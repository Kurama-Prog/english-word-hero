/* ============================================================
   单词小英雄 · 词库
   数据来源：工作区「单词库」文件夹六张图片
     - 课本 Words to use  Unit 1 ~ Unit 4
     - Reading time 1《My school》
     - Reading time 2《My classmates》
     - Reading time 3《Animals and their homes》
   中文释义严格按教材原文，未改写、未增补义项。
   ============================================================ */
window.EWG = window.EWG || {};
(function (EWG) {
  "use strict";

  /* ---------------- 单元与主题 ---------------- */
  var UNITS = [
    { id: 1, name: "Unit 1", title: "我的校园", theme: "school" },
    { id: 2, name: "Unit 2", title: "我的同学", theme: "classmates" },
    { id: 3, name: "Unit 3", title: "可爱的动物", theme: "animals" },
    { id: 4, name: "Unit 4", title: "快乐的聚会", theme: "party" }
  ];

  var THEMES = {
    school:     { name: "校园", color: "#4CC9F0", soft: "#E8F6FF", deep: "#2CA8CE" },
    classmates: { name: "同学", color: "#FF7A45", soft: "#FFEDE2", deep: "#F2653A" },
    animals:    { name: "动物", color: "#4ADE80", soft: "#E5FBEC", deep: "#22C55E" },
    party:      { name: "派对", color: "#7B61FF", soft: "#EFEBFF", deep: "#5B44D6" }
  };

  /* ---------------- 原始词条 ----------------
     [英文, 中文释义, 词性, 例句, 例句中文, 记忆提示, 出处]
     出处留空表示课本 Words to use；否则写复习卷名称
  ------------------------------------------- */
  var RAW = {
    1: [
      ["classroom", "教室", "n.", "Our classroom is big and bright.", "我们的教室又大又明亮。", "class（班级）+ room（房间）= 上课的房间"],
      ["sports field", "运动场", "phr.", "We do sports on the sports field.", "我们在运动场上做运动。", null, "Reading 1"],
      ["hall", "礼堂", "n.", "The hall is very big.", "礼堂很大。"],
      ["begin", "开始", "v.", "Let's begin our English class.", "让我们开始上英语课吧。", "和 start 意思相近"],
      ["project", "学校的课题", "n.", "We are working on a project about bamboo.", "我们在做一个关于竹子的课题。", null, "Reading 1"],
      ["computer room", "计算机房", "phr.", "We have computer class in the computer room.", "我们在计算机房上电脑课。"],
      ["let", "允许；让", "v.", "Let me help you.", "让我来帮你。"],
      ["bamboo", "竹子", "n.", "All the school buildings are made of bamboo.", "学校里所有的教学楼都是由竹子做成的。"],
      ["school building", "教学楼", "phr.", "Our school building is tall.", "我们的教学楼很高。"],
      ["tall", "高大的", "adj.", "This bamboo is very tall.", "这根竹子很高。"],
      ["student", "学生", "n.", "I am a student in Grade Four.", "我是四年级的学生。"],
      ["art room", "美术教室", "phr.", "We draw pictures in the art room.", "我们在美术教室里画画。"],
      ["Sure.", "当然。", "—", "Sure! Let's go together.", "当然！我们一起去吧。", "答应别人时很好用"],
      ["See you soon.", "一会儿见。", "—", "See you soon, Miss Li!", "一会儿见，李老师！"],
      ["library", "图书馆", "n.", "James is in the library.", "詹姆斯在图书馆里。", null, "Reading 1"],
      ["toilet", "厕所", "n.", "The toilet is on the ground floor.", "厕所在底层（一楼）。", null, "Reading 1"],
      ["special", "特殊的；特别的", "adj.", "Today is a special day for me.", "今天对我来说是特别的一天。", null, "Reading 1"],
      ["keep ... tidy", "保持……整洁", "phr.", "We always keep our classroom tidy.", "我们总是保持教室整洁。", "keep 保持 + tidy 整洁"],
      ["do sports", "做运动", "phr.", "Let's do sports on the sports field.", "我们去运动场做运动吧。", null, "Reading 1"],
      ["best of all", "最棒的", "phr.", "I like the art room best of all.", "我最喜欢美术教室。", null, "Reading 1"],
      ["begin with", "以……开始", "phr.", "Our class begins with an English song.", "我们的课以一首英文歌开始。", null, "Reading 1"],
      ["work on", "从事于；忙于", "phr.", "We are working on a new project.", "我们正在做一个新课题。", null, "Reading 1"],
      ["on the ground floor", "在一楼", "phr.", "The library is on the ground floor.", "图书馆在一楼。", "ground floor 是英式的一楼", "Reading 1"],
      ["look for", "寻找", "phr.", "I am looking for my English book.", "我在找我的英语书。", null, "Reading 1"],
      ["be made of", "由……制成", "phr.", "These desks are made of bamboo.", "这些桌子是用竹子做的。", null, "Reading 1"],
      ["look like", "看起来像", "phr.", "That cloud looks like a panda.", "那朵云看起来像一只熊猫。", null, "Reading 1"],
      ["Take it easy.", "放轻松。", "—", "Take it easy! You can do it.", "放轻松！你能做到的。", "安慰小伙伴的话"],
      ["Keep going.", "继续下去。", "—", "Keep going! You are almost there.", "继续下去！你就快成功了。"]
    ],

    2: [
      ["lovely", "令人愉快的；极好的", "adj.", "She is a lovely girl.", "她是个可爱的女孩。"],
      ["great", "好极的；使人快乐的", "adj.", "We had a great time at the party.", "我们在聚会上玩得非常开心。"],
      ["often", "时常", "adv.", "He often tells interesting stories.", "他经常讲有趣的故事。", "频度副词，放在实义动词前面"],
      ["always", "总是", "adv.", "I always keep my desk tidy.", "我总是保持书桌整洁。", "always > usually > often > sometimes > seldom > never"],
      ["interesting", "有趣的；有吸引力的", "adj.", "This story is very interesting.", "这个故事很有趣。"],
      ["helpful", "愿意帮忙的", "adj.", "James is helpful and friendly.", "詹姆斯乐于助人而且很友好。"],
      ["English", "英语", "n.", "She helps me with my English.", "她帮助我学英语。"],
      ["duck", "躲闪；躲避", "v.", "He ducks down behind the desk.", "他躲到书桌后面。", "这里 duck 是动词「躲闪」，不是鸭子哦"],
      ["Let me try.", "让我试试。", "—", "Let me try! I can do it.", "让我试试！我能行。"],
      ["painter", "画家", "n.", "He wants to be a painter.", "他想成为一名画家。", null, "Reading 2"],
      ["excited", "兴奋的", "adj.", "The children are excited about the party.", "孩子们对聚会感到很兴奋。", null, "Reading 2"],
      ["result", "结果", "n.", "The result of the game is good.", "游戏的结果很好。", null, "Reading 2"],
      ["different", "不同的", "adj.", "We are in different classes.", "我们在不同的班级。", null, "Reading 2"],
      ["friendly", "友好的", "adj.", "Our new teacher is very friendly.", "我们的新老师非常友好。", null, "Reading 2"],
      ["writer", "作家", "n.", "She wants to be a writer.", "她想成为一名作家。", null, "Reading 2"],
      ["afraid", "害怕的", "adj.", "I'm afraid not.", "恐怕不行。", null, "Reading 2"],
      ["solution", "解决办法", "n.", "We found a good solution.", "我们找到了一个好办法。", null, "Reading 2"],
      ["problem", "问题", "n.", "No problem! Let me help you.", "没问题！我来帮你。", null, "Reading 2"],
      ["be good at", "擅长", "phr.", "Xiaopu is good at basketball.", "小浦擅长打篮球。", "be good at + 名词 / 动名词", "Reading 2"],
      ["cheer for", "为……欢呼", "phr.", "We cheer for our team.", "我们为我们的队伍欢呼。", null, "Reading 2"],
      ["each other", "互相", "phr.", "We help each other.", "我们互相帮助。", null, "Reading 2"],
      ["come down", "下来；降落", "phr.", "Please come down the stairs slowly.", "请慢慢下楼。", null, "Reading 2"],
      ["slow down", "（使）减速；放慢速度", "phr.", "Slow down! The road is wet.", "慢一点！路面是湿的。", null, "Reading 2"],
      ["share ... with sb.", "与某人分享……", "phr.", "I share my cake with my friend.", "我和朋友分享蛋糕。", null, "Reading 2"],
      ["want to be", "想成为", "phr.", "I want to be a writer.", "我想成为作家。", null, "Reading 2"],
      ["tell stories", "讲故事", "phr.", "Grandpa tells stories every night.", "爷爷每天晚上讲故事。", null, "Reading 2"],
      ["jump over", "跳过；跃过", "phr.", "He can jump over the box.", "他能跳过那个箱子。", null, "Reading 2"],
      ["nice", "和善的", "adj.", "Yaoyao is polite and nice.", "瑶瑶有礼貌又友善。", null, "Reading 2"],
      ["polite", "有礼貌的", "adj.", "He is polite to everyone.", "他对每个人都很有礼貌。", null, "Reading 2"],
      ["hard-working", "勤奋的", "adj.", "She is a hard-working student.", "她是个勤奋的学生。", null, "Reading 2"],
      ["smart", "机灵的", "adj.", "My little brother is smart.", "我弟弟很机灵。", null, "Reading 2"],
      ["clever", "聪明的；机灵的", "adj.", "The clever monkey gets the fruit.", "聪明的猴子拿到了水果。", null, "Reading 2"],
      ["funny", "滑稽的", "adj.", "He is a funny boy.", "他是个滑稽的男孩。", null, "Reading 2"],
      ["quiet", "安静的", "adj.", "Please be quiet in the library.", "在图书馆里请安静。", null, "Reading 2"],
      ["shy", "害羞的", "adj.", "The little girl is a bit shy.", "这个小女孩有点害羞。", null, "Reading 2"],
      ["active", "活泼的", "adj.", "She is active in class.", "她在课堂上很活泼。", null, "Reading 2"],
      ["brave", "勇敢的", "adj.", "The brave boy helps the little cat.", "那个勇敢的男孩救了小猫。", null, "Reading 2"],
      ["honest", "诚实的", "adj.", "An honest child never tells a lie.", "诚实的孩子不说谎。", null, "Reading 2"],
      ["careful", "细心的", "adj.", "Be careful with your homework.", "做作业要细心。", null, "Reading 2"],
      ["patient", "有耐心的", "adj.", "Our teacher is patient with us.", "老师对我们很有耐心。", null, "Reading 2"],
      ["lazy", "懒惰的", "adj.", "The cat is lazy in the sun.", "这只猫在太阳下懒洋洋的。", null, "Reading 2"],
      ["naughty", "淘气的", "adj.", "The naughty monkey jumps over the wall.", "淘气的猴子跳过墙。", null, "Reading 2"]
    ],

    3: [
      ["panda", "大熊猫", "n.", "The panda is black and white.", "熊猫是黑白两色的。"],
      ["black", "黑的；黑色的", "adj.", "I have a black school bag.", "我有一个黑色的书包。"],
      ["white", "白的；白色的", "adj.", "The snow is white.", "雪是白色的。"],
      ["hometown", "家乡", "n.", "My hometown is Sichuan.", "我的家乡在四川。"],
      ["monkey", "猴子", "n.", "The monkeys are playing in the trees.", "猴子们正在树上玩耍。"],
      ["yellow", "黄的；黄色的", "adj.", "The banana is yellow.", "香蕉是黄色的。"],
      ["elephant", "象", "n.", "The elephant has a long trunk.", "大象有长长的鼻子。"],
      ["grey", "灰色的", "adj.", "The elephant is grey.", "大象是灰色的。"],
      ["trunk", "象鼻", "n.", "An elephant's trunk is very long.", "大象的鼻子很长。"],
      ["family", "家庭", "n.", "I love my family.", "我爱我的家庭。"],
      ["India", "印度", "n.", "Elephants live in India.", "大象生活在印度。"],
      ["Africa", "非洲", "n.", "The lion comes from Africa.", "这只狮子来自非洲。"],
      ["baby elephant", "小象", "phr.", "The mother elephant is playing with the baby elephant.", "象妈妈正在和小象玩耍。"],
      ["tail", "尾巴", "n.", "The monkey has a long tail.", "猴子有一条长尾巴。"],
      ["kind", "友好的", "adj.", "Our teacher is kind to us.", "老师对我们很友善。"],
      ["polar bear", "北极熊", "n.", "The polar bear has thick fur.", "北极熊有厚厚的皮毛。"],
      ["the North Pole", "北极", "n.", "Polar bears live at the North Pole.", "北极熊生活在北极。"],
      ["warm", "温暖的", "adj.", "This coat is warm.", "这件外套很暖和。"],
      ["bed", "床", "n.", "The cat is on the bed.", "猫在床上。"],
      ["golden", "金色的", "adj.", "The monkey has golden fur.", "猴子有金色的皮毛。", null, "Reading 3"],
      ["nearly", "将近", "adv.", "It is nearly twelve o'clock.", "快十二点了。", null, "Reading 3"],
      ["thick", "厚的", "adj.", "This book is very thick.", "这本书很厚。", null, "Reading 3"],
      ["ice", "冰", "n.", "There is a lot of ice and snow.", "那里有很多冰雪。", null, "Reading 3"],
      ["melt", "融化", "v.", "The ice melts in warm weather.", "冰在温暖的天气里融化。", null, "Reading 3"],
      ["fur", "皮毛", "n.", "The seal has soft fur.", "海豹有柔软的皮毛。", null, "Reading 3"],
      ["snow", "雪", "n.", "The snow is white and cold.", "雪又白又冷。", null, "Reading 3"],
      ["difficult", "困难的；难懂的", "adj.", "This question is difficult.", "这个问题很难。", null, "Reading 3"],
      ["seal", "海豹", "n.", "A seal lives in the cold sea.", "海豹生活在寒冷的海里。", null, "Reading 3"],
      ["catch", "抓住；捕捉", "v.", "The seal catches a fish.", "海豹抓住了一条鱼。", null, "Reading 3"],
      ["lives", "生命（life 的复数）", "n.", "Sea animals have happy lives.", "海洋动物们生活得很快乐。", "life 的复数是 lives", "Reading 3"],
      ["show around", "带领……参观", "phr.", "Let me show you around my school.", "让我带你参观我的学校。", null, "Reading 3"],
      ["pull back", "拉回", "phr.", "He pulls back the big box.", "他把那个大箱子拉回来。", null, "Reading 3"],
      ["roll like a ball", "像球一样滚动", "phr.", "The panda rolls like a ball.", "熊猫像球一样滚动。", null, "Reading 3"],
      ["because of", "因为（后加名词）", "phr.", "We stay at home because of the rain.", "因为下雨我们待在家里。", null, "Reading 3"]
    ],

    4: [
      ["invitation", "（口头或书面的）邀请", "n.", "Here is an invitation to the party.", "这是一张聚会的邀请。"],
      ["party", "聚会；联欢会", "n.", "We have a party on Children's Day.", "我们在儿童节开联欢会。"],
      ["activity", "活动", "n.", "We have many activities at school.", "学校有很多活动。"],
      ["share a cake", "分享蛋糕", "phr.", "Let's share a cake together.", "我们一起分享蛋糕吧。"],
      ["bring", "带来", "v.", "Please bring some juice to the party.", "请带些果汁来聚会。"],
      ["letter", "信；函", "n.", "I write a letter to my friend.", "我给朋友写信。"],
      ["child", "儿童（复数 children）", "n.", "Every child is happy today.", "今天每个孩子都很开心。", "复数要说 children"],
      ["tradition", "传统", "n.", "It is a Chinese tradition.", "这是中国的传统。"],
      ["love", "爱；热爱", "n./v.", "We love our school.", "我们热爱我们的学校。"],
      ["bowl", "碗", "n.", "There is a bowl on the table.", "桌上有一个碗。"],
      ["egg", "鸡蛋", "n.", "I eat an egg for breakfast.", "我早餐吃一个鸡蛋。"],
      ["wish", "祝愿", "v.", "We wish you a happy New Year.", "我们祝你新年快乐。"],
      ["soup", "汤；羹", "n.", "My mother makes soup for us.", "妈妈给我们做汤。"]
    ]
  };

  /* ---------------- 构建词库 ---------------- */
  function slug(s) {
    return s.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  function guessKind(en) {
    if (/[.?!]$/.test(en)) return "sentence";
    if (en.indexOf(" ") > -1) return "phrase";
    return "word";
  }
  function kindName(k) {
    return k === "sentence" ? "句子" : k === "phrase" ? "词组" : "单词";
  }

  var BANK = [];
  var seen = {};

  UNITS.forEach(function (u) {
    (RAW[u.id] || []).forEach(function (r) {
      var en = r[0], cn = r[1], pos = r[2], sen = r[3], senCn = r[4], tip = r[5], src = r[6];
      var base = "u" + u.id + "-" + slug(en);
      var id = base, n = 2;
      while (seen[id]) { id = base + "-" + n; n++; }
      seen[id] = true;
      var kind = guessKind(en);
      BANK.push({
        id: id,
        en: en,
        cn: cn,
        pos: pos,
        unit: u.id,
        unitName: u.name,
        theme: u.theme,
        themeName: THEMES[u.theme].name,
        kind: kind,
        kindName: kindName(kind),
        sentence: sen || "",
        sentenceCn: senCn || "",
        tip: tip || "",
        src: src || "课本",
        // 拼写关是否可用：只挑纯字母、长度适中的单词
        spellable: /^[a-zA-Z]{3,11}$/.test(en),
        letters: en.replace(/[^a-zA-Z]/g, "")
      });
    });
  });

  var BY_ID = {};
  BANK.forEach(function (w) { BY_ID[w.id] = w; });

  /* ---------------- 语法小贴士（来自复习卷语法解析） ---------------- */
  var GRAMMAR_TIPS = [
    {
      id: "quality",
      title: "描述人物品质：主语 + be + 形容词",
      rule: "想说「某某很有礼貌」，就用 be 动词加形容词。",
      eg: "Yaoyao is polite and nice.",
      egCn: "瑶瑶有礼貌又友善。",
      unit: 2
    },
    {
      id: "goodat",
      title: "描述能力：be good at + 名词 / 动名词",
      rule: "at 后面接动词时，动词要加 -ing。",
      eg: "Xiaopu is good at basketball. = Xiaopu is good at playing basketball.",
      egCn: "小浦擅长打篮球。",
      unit: 2
    },
    {
      id: "frequency",
      title: "频度副词的位置与顺序",
      rule: "频度副词放在实义动词之前。从高到低：always > usually > often > sometimes > seldom > never。",
      eg: "He often tells interesting stories.",
      egCn: "他经常讲有趣的故事。",
      unit: 2
    },
    {
      id: "help",
      title: "help 的两种说法",
      rule: "help sb. (to) do sth. 帮助某人做某事（to 可省略）；help sb. with sth. 在某方面帮助某人。",
      eg: "He helps me clean the classroom. / He helps me with my English.",
      egCn: "他帮我打扫教室。/ 他帮助我学英语。",
      unit: 2
    },
    {
      id: "shallwe",
      title: "提建议：Shall we + 动词原形？",
      rule: "同意可以说 Good idea. / Sure.；不同意可以说 I'm afraid not. / Sorry, I can't.",
      eg: "Shall we meet in the classroom?",
      egCn: "我们在教室里见面好吗？",
      unit: 1
    },
    {
      id: "negative",
      title: "否定句：have / There be 怎么说「没有」",
      rule: "have no + 名词 = don't / doesn't have any + 名词。",
      eg: "These bamboo buildings have no walls. = These bamboo buildings don't have any walls.",
      egCn: "这些竹楼没有墙。",
      unit: 1
    },
    {
      id: "prep",
      title: "介词 in / on 表示地点",
      rule: "in + 封闭或较大的空间内部；on + 楼层、表面。",
      eg: "in the classroom / in the library / on the ground floor / on the sports field",
      egCn: "在教室里 / 在图书馆里 / 在一楼 / 在运动场上",
      unit: 1
    },
    {
      id: "madeof",
      title: "be made of 由……制成",
      rule: "看得出原材料用 be made of。",
      eg: "All the school buildings are made of bamboo.",
      egCn: "学校里所有的教学楼都是由竹子做成的。",
      unit: 1
    },
    {
      id: "best",
      title: "I like ... best. = My favorite ... is ...",
      rule: "两种说法意思一样，都是「我最喜欢……」。",
      eg: "I like the art room best. = My favorite room is the art room.",
      egCn: "我最喜欢美术教室。",
      unit: 1
    },
    {
      id: "floor",
      title: "ground floor 和 first floor 不一样",
      rule: "英式英语里 ground floor 是一楼；美式英语里 first floor 是一楼。",
      eg: "The library is on the ground floor.",
      egCn: "图书馆在一楼。",
      unit: 1
    },
    {
      id: "present",
      title: "现在进行时：be + 动词-ing",
      rule: "表示此刻正在发生的动作。",
      eg: "The monkeys are playing in the trees.",
      egCn: "猴子们正在树上玩耍。",
      unit: 3
    },
    {
      id: "ing",
      title: "动词 -ing 的三条变化规则",
      rule: "① 一般直接加 -ing：play → playing；② 以不发音的 e 结尾，去 e 加 -ing：make → making；③ 重读闭音节，双写末尾字母加 -ing：run → running。",
      eg: "play → playing, write → writing, swim → swimming",
      egCn: "玩 / 写 / 游泳",
      unit: 3
    },
    {
      id: "from",
      title: "be from 和 come from",
      rule: "两个都表示「来自」，后面都接地点。",
      eg: "We are from Sichuan. = We come from Sichuan.",
      egCn: "我们来自四川。",
      unit: 3
    },
    {
      id: "alotof",
      title: "a lot of 和 lots of",
      rule: "两个都表示「许多」，后面都可以接可数名词复数或不可数名词。",
      eg: "There's a lot of ice and snow. / There are lots of trees in the forest.",
      egCn: "那里有很多冰雪。/ 森林里有很多树。",
      unit: 3
    }
  ];

  /* ---------------- 导出 ---------------- */
  EWG.WORD_BANK = BANK;
  EWG.WORD_BY_ID = BY_ID;
  EWG.UNITS = UNITS;
  EWG.THEMES = THEMES;
  EWG.GRAMMAR_TIPS = GRAMMAR_TIPS;

  EWG.getWord = function (id) { return BY_ID[id] || null; };
  EWG.wordsOfUnit = function (unit) {
    return BANK.filter(function (w) { return w.unit === Number(unit); });
  };
})(window.EWG);
