import montessoriMeta from "./montessori/meta.mjs";
import m01 from "./montessori/ch01.mjs";
import m02 from "./montessori/ch02.mjs";
import m03 from "./montessori/ch03.mjs";
import m04 from "./montessori/ch04.mjs";
import m05 from "./montessori/ch05.mjs";
import m06 from "./montessori/ch06.mjs";
import m07 from "./montessori/ch07.mjs";

import disciplineMeta from "./discipline/meta.mjs";
import d01 from "./discipline/ch01.mjs";
import d02 from "./discipline/ch02.mjs";
import d03 from "./discipline/ch03.mjs";
import d04 from "./discipline/ch04.mjs";
import d05 from "./discipline/ch05.mjs";
import d06 from "./discipline/ch06.mjs";

export default {
  brand: {
    name: "头三年",
    tagline: "0–3 岁育儿白纸手记",
    code: "0–3Y // FIELD NOTES"
  },
  topicOrder: ["montessori", "discipline"],
  topics: {
    montessori: {
      ...montessoriMeta,
      chapters: [m01, m02, m03, m04, m05, m06, m07]
    },
    discipline: {
      ...disciplineMeta,
      chapters: [d01, d02, d03, d04, d05, d06]
    }
  },
  sosShortcuts: [
    {
      id: "sos-spoon",
      label: "吃饭扔勺子",
      topicId: "discipline",
      chapterId: "ch05",
      jumpAnchor: "sec-scripts",
      widgetUpdate: { scenario: "spoon" }
    },
    {
      id: "sos-shoes",
      label: "死活不穿鞋",
      topicId: "discipline",
      chapterId: "ch05",
      jumpAnchor: "sec-scripts",
      widgetUpdate: { scenario: "shoes" }
    },
    {
      id: "sos-park",
      label: "公园不肯走",
      topicId: "discipline",
      chapterId: "ch05",
      jumpAnchor: "sec-scripts",
      widgetUpdate: { scenario: "park" }
    },
    {
      id: "sos-snatch",
      label: "抢玩具打人咬人",
      topicId: "discipline",
      chapterId: "ch05",
      jumpAnchor: "sec-scripts",
      widgetUpdate: { scenario: "snatch" }
    },
    {
      id: "sos-bedtime",
      label: "睡前嚎啕大哭",
      topicId: "discipline",
      chapterId: "ch05",
      jumpAnchor: "sec-scripts",
      widgetUpdate: { scenario: "bedtime" }
    },
    {
      id: "sos-mess",
      label: "乱翻抽屉打翻水",
      topicId: "montessori",
      chapterId: "ch02",
      jumpAnchor: "sec-age-setup",
      widgetUpdate: { ageTab: "1-2" }
    }
  ],
  comboRouter: [
    {
      id: "mess",
      situation: "刚会走满屋翻抽屉",
      firstStep: "先用蒙氏「物理减摩擦」：80cm 以下只留能碰的东西",
      why: "1–2 岁翻抽屉不是故意跟你作对，是手眼协调和探索欲刚开机。用蒙氏把不能碰的收上高柜、底层留两个可安全开关的旧盒子，能直接省掉每天一半的吼叫。",
      targetTopic: "montessori",
      targetChapter: "ch02",
      targetLabel: "读蒙氏 02 节：把世界降到 80 厘米"
    },
    {
      id: "spoon",
      situation: "明知不行还是故意扔勺",
      firstStep: "先按正面管教「和善而坚定」：少字短句 + 动作收场",
      why: "环境已经配合好了他依然扔勺子，往往是在测试因果关系或已经吃饱无聊。不要讲大道理，平静说一句短话后把餐盘收走，用行动立边界。",
      targetTopic: "discipline",
      targetChapter: "ch05",
      targetLabel: "读正面管教 05 节：吃饭扔勺完整话术"
    },
    {
      id: "focus",
      situation: "大人一靠近就发脾气甩手",
      firstStep: "用蒙氏「退后半步」：停止随时纠正与夸奖",
      why: "很多孩子发脾气是因为正在专心倒豆子或套袜子，被大人频繁“我来帮你”“宝贝真棒”打断。先忍住手退后 10 秒看他怎么自己试完。",
      targetTopic: "montessori",
      targetChapter: "ch05",
      targetLabel: "读蒙氏 05 节：别一口一口打断专注力"
    },
    {
      id: "meltdown",
      situation: "困极了躺地崩溃大哭",
      firstStep: "切正面管教「先连结再说事」：把断开的蓝牙接回来",
      why: "前额叶在疲惫饥饿时彻底下线。这时候不管环境摆得多完美、规矩讲得多清楚都听不进去，先抱起来共情两分钟，等呼吸平稳再转移离开。",
      targetTopic: "discipline",
      targetChapter: "ch01",
      targetLabel: "读正面管教 01 节：为什么讲道理像对断开蓝牙的音箱喊话"
    }
  ],
  bibliography: [
    {
      author: "Maria Montessori",
      title: "吸收性心智 (The Absorbent Mind) / 蒙台梭利早期教育法",
      year: "1949 / 1909",
      note: "奠定 0–3 岁无意识吸收、有准备的环境与敏感期概念。本手册同时纳入现代发展心理学对其“过早轻视装扮游戏”局限的客观修正。"
    },
    {
      author: "Paula Polk Lillard",
      title: "Montessori from the Start",
      year: "2003",
      note: "最接地气的 0–3 岁家庭环境与日常起居实操参考，剥离了商业早教对高端教具的迷信。"
    },
    {
      author: "Jane Nelsen & Cheryl Erwin",
      title: "正面管教 0–3 岁 (Positive Discipline: The First Three Years)",
      year: "1998 / 修订版",
      note: "基于阿德勒“和善而坚定”个体心理学，专门针对 0–3 岁前额叶未成熟期重构了工具——剥除了 4 岁以上才适用的长篇说教与家庭会议。"
    }
  ],
  futureTopics: [
    { title: "依恋理论与安全感", note: "哭了就抱到底会不会惯坏孩子" },
    { title: "0–3 岁睡眠节律", note: "分房睡、夜醒与睡前情绪大战" }
  ]
};
