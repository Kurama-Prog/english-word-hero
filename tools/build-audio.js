/* ============================================================
   build-audio.js · 生成单词发音包
   1. 从 js/data/words.js 取出 117 条词条
   2. 调 Windows SAPI（Microsoft Zira，en-US）合成 16kHz 单声道 WAV
   3. 裁掉首尾静音、加淡入淡出、重写标准 WAV 头
   4. 输出 js/data/audio-index.js（id -> 文件路径）
   用法：node tools/build-audio.js
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "audio");
const TMP_JSON = path.join(__dirname, "_words.json");
const TMP_DIR = path.join(__dirname, "_raw");
const INDEX_JS = path.join(ROOT, "js", "data", "audio-index.js");

/* ---------- 1. 取词 ---------- */
global.window = {};
require(path.join(ROOT, "js", "data", "words.js"));
const BANK = global.window.EWG.WORD_BANK || [];

// 朗读文本清洗：只处理会干扰发音的符号，显示文本不变
function toSpeech(en) {
  return String(en)
    .replace(/\.{3,}/g, " , ")      // keep ... tidy -> keep , tidy
    .replace(/\bsb\b\.?/gi, "somebody")
    .replace(/\bsth\b\.?/gi, "something")
    .replace(/\s+/g, " ")
    .trim();
}

const words = BANK.map((w) => ({ id: w.id, en: w.en, speech: toSpeech(w.en) }));
console.log("词条数量:", words.length);

/* ---------- 2. 调 SAPI ---------- */
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.writeFileSync(TMP_JSON, JSON.stringify(words), "utf8");

if (!process.env.EWG_SKIP_TTS) {
  const ps1 = path.join(__dirname, "sapi-tts.ps1");
  execFileSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, "-WordsJson", TMP_JSON, "-OutDir", TMP_DIR],
    { stdio: "inherit" }
  );
}

/* ---------- 3. 裁静音 / 归一化 ---------- */
function parseWav(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return null;
  let off = 12;
  let fmt = null;
  let data = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === "fmt ") {
      fmt = {
        format: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bits: buf.readUInt16LE(body + 14)
      };
    } else if (id === "data") {
      data = buf.subarray(body, Math.min(body + size, buf.length));
    }
    off = body + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16) return null;
  return { fmt, data };
}

function buildWav(fmt, pcm) {
  const head = Buffer.alloc(44);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(36 + pcm.length, 4);
  head.write("WAVE", 8, "ascii");
  head.write("fmt ", 12, "ascii");
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);                      // PCM
  head.writeUInt16LE(fmt.channels, 22);
  head.writeUInt32LE(fmt.sampleRate, 24);
  head.writeUInt32LE(fmt.sampleRate * fmt.channels * 2, 28);
  head.writeUInt16LE(fmt.channels * 2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36, "ascii");
  head.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([head, pcm]);
}

function trimSilence(wav) {
  const { fmt, data } = wav;
  const total = Math.floor(data.length / 2);
  const TH = 320;                                  // ≈1% 满量程
  let start = 0;
  let end = total - 1;
  while (start < total && Math.abs(data.readInt16LE(start * 2)) < TH) start++;
  while (end > start && Math.abs(data.readInt16LE(end * 2)) < TH) end--;
  if (start >= end) return null;

  const padHead = Math.round(fmt.sampleRate * 0.05);
  const padTail = Math.round(fmt.sampleRate * 0.12);
  start = Math.max(0, start - padHead);
  end = Math.min(total - 1, end + padTail);

  const pcm = Buffer.from(data.subarray(start * 2, (end + 1) * 2));

  // 8ms 淡入淡出，避免爆音
  const fade = Math.min(Math.round(fmt.sampleRate * 0.008), Math.floor(pcm.length / 4));
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    const a = i * 2;
    const b = pcm.length - 2 - i * 2;
    pcm.writeInt16LE(Math.round(pcm.readInt16LE(a) * g), a);
    pcm.writeInt16LE(Math.round(pcm.readInt16LE(b) * g), b);
  }
  return buildWav(fmt, pcm);
}

/* ---------- 4. 输出 ---------- */
fs.mkdirSync(OUT_DIR, { recursive: true });
const index = {};
let okCount = 0;
let totalBytes = 0;
const failed = [];

for (const w of words) {
  const raw = path.join(TMP_DIR, w.id + ".wav");
  const out = path.join(OUT_DIR, w.id + ".wav");
  if (!fs.existsSync(raw)) { failed.push(w.id); continue; }
  const parsed = parseWav(fs.readFileSync(raw));
  const trimmed = parsed && trimSilence(parsed);
  if (!trimmed) { failed.push(w.id); continue; }
  fs.writeFileSync(out, trimmed);
  index[w.id] = "audio/" + w.id + ".wav";
  okCount++;
  totalBytes += trimmed.length;
}

const lines = [
  "/* 本文件由 tools/build-audio.js 自动生成，请勿手改 */",
  "window.EWG = window.EWG || {};",
  "EWG.AUDIO_MAP = " + JSON.stringify(index, null, 0) + ";"
];
fs.writeFileSync(INDEX_JS, lines.join("\n") + "\n", "utf8");

fs.rmSync(TMP_JSON, { force: true });
console.log("成功生成音频:", okCount, "/", words.length);
console.log("音频总大小:", (totalBytes / 1024 / 1024).toFixed(2), "MB");
if (failed.length) console.log("失败清单:", failed.join(", "));
