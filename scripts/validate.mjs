import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const BANNED_SLOP = [
  "值得注意的是",
  "总而言之",
  "综上所述",
  "不可否认",
  "不仅如此",
  "温柔而有力量的桥梁",
  "静待花开",
  "开启育儿新篇章",
  "赋能",
  "闭环",
  "抓手"
];

function collectStrings(node, out = [], pathLabel = "root") {
  if (typeof node === "string") {
    out.push({ path: pathLabel, text: node });
  } else if (Array.isArray(node)) {
    node.forEach((item, idx) => collectStrings(item, out, `${pathLabel}[${idx}]`));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      collectStrings(v, out, `${pathLabel}.${k}`);
    }
  }
  return out;
}

function countHanzi(node) {
  let total = 0;
  for (const { text } of collectStrings(node)) {
    const clean = text.replace(/<[^>]+>/g, "");
    const m = clean.match(/[\u4e00-\u9fff]/g);
    if (m) total += m.length;
  }
  return total;
}

async function main() {
  const errors = [];
  const requiredFiles = ["index.html", "styles.css", "app.js", "favicon.svg"];
  for (const file of requiredFiles) {
    const p = path.join(distDir, file);
    if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
      errors.push(`Missing or empty dist/${file}`);
    }
  }

  const appJs = fs.readFileSync(path.join(distDir, "app.js"), "utf8");
  try {
    new Function(appJs);
  } catch (err) {
    errors.push(`dist/app.js syntax error: ${err.message}`);
  }

  const cssText = fs.readFileSync(path.join(distDir, "styles.css"), "utf8");
  if (/\d+(?:dvh|vh)\b/.test(cssText)) {
    errors.push("styles.css contains forbidden vh/dvh units");
  }

  const { default: siteData } = await import(new URL("../src/content/index.mjs?t=" + Date.now(), import.meta.url));

  const expectedCounts = { montessori: 7, discipline: 6 };
  const validBlocks = new Set([
    "scene",
    "heading",
    "prose",
    "quote",
    "figure",
    "comparePair",
    "ageTabs",
    "scriptCompare",
    "myths",
    "decoder",
    "checklist",
    "bridge"
  ]);

  const seenIllustrations = new Set();

  for (const [tid, expectedCh] of Object.entries(expectedCounts)) {
    const topic = siteData.topics?.[tid];
    if (!topic) {
      errors.push(`Missing topic: ${tid}`);
      continue;
    }
    if (topic.chapters.length !== expectedCh) {
      errors.push(`${tid} expected ${expectedCh} chapters, got ${topic.chapters.length}`);
    }
    const hanzi = countHanzi(topic);
    if (hanzi < 16000) {
      errors.push(`${tid} Chinese character count too low: ${hanzi} (< 16000)`);
    }

    for (const ch of topic.chapters) {
      const chHanzi = countHanzi(ch);
      if (chHanzi < 1800) {
        errors.push(`${tid}/${ch.id} too short (${chHanzi} hanzi < 1800)`);
      }
      if (!Array.isArray(ch.jumpRail) || ch.jumpRail.length < 3 || ch.jumpRail.length > 6) {
        errors.push(`${tid}/${ch.id} invalid jumpRail length`);
      }
      if (!Array.isArray(ch.principles) || ch.principles.length < 2) {
        errors.push(`${tid}/${ch.id} missing principles`);
      }
      for (const blk of ch.blocks || []) {
        if (!validBlocks.has(blk.type)) {
          errors.push(`${tid}/${ch.id} unknown block type: ${blk.type}`);
        }
        if (blk.type === "figure") {
          const rel = blk.src.replace(/^\.\//, "");
          const fp = path.join(distDir, rel);
          if (!fs.existsSync(fp) || fs.statSync(fp).size === 0) {
            errors.push(`${tid}/${ch.id} missing illustration file: ${blk.src}`);
          } else {
            seenIllustrations.add(rel);
          }
        }
        if (blk.type === "bridge") {
          const targetT = siteData.topics?.[blk.targetTopic];
          const targetC = targetT?.chapters?.find(c => c.id === blk.targetChapter);
          if (!targetC) {
            errors.push(`${tid}/${ch.id} broken bridge target ${blk.targetTopic}/${blk.targetChapter}`);
          }
        }
      }
    }
  }

  if (seenIllustrations.size < 12) {
    errors.push(`Expected 12 unique illustrations used across chapters, found ${seenIllustrations.size}`);
  }

  // Validate SOS shortcuts & comboRouter links
  for (const s of siteData.sosShortcuts || []) {
    const t = siteData.topics?.[s.topicId];
    const c = t?.chapters?.find(ch => ch.id === s.chapterId);
    if (!c) errors.push(`SOS shortcut ${s.id} points to missing ${s.topicId}/${s.chapterId}`);
    if (s.widgetUpdate?.scenario) {
      const hasSc = c?.blocks?.some(b => b.type === "scriptCompare" && b.scenarios?.[s.widgetUpdate.scenario]);
      if (!hasSc) errors.push(`SOS shortcut ${s.id} scenario '${s.widgetUpdate.scenario}' missing in ${s.chapterId}`);
    }
  }

  for (const r of siteData.comboRouter || []) {
    const t = siteData.topics?.[r.targetTopic];
    const c = t?.chapters?.find(ch => ch.id === r.targetChapter);
    if (!c) errors.push(`ComboRouter ${r.id} points to missing ${r.targetTopic}/${r.targetChapter}`);
  }

  // Scan for AI slop phrases
  for (const { path: p, text } of collectStrings(siteData)) {
    for (const phrase of BANNED_SLOP) {
      if (text.includes(phrase)) {
        errors.push(`AI slop phrase "${phrase}" found at ${p}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Validation FAILED:");
    errors.forEach(e => console.error("  - " + e));
    process.exit(1);
  }

  console.log("Validation PASSED:");
  console.log(`  - Montessori: ${countHanzi(siteData.topics.montessori)} 汉字 (${siteData.topics.montessori.chapters.length} 节)`);
  console.log(`  - Positive Discipline: ${countHanzi(siteData.topics.discipline)} 汉字 (${siteData.topics.discipline.chapters.length} 节)`);
  console.log(`  - Illustrations verified: ${seenIllustrations.size} files`);
  console.log("  - Zero syntax errors, zero broken links, zero AI-slop clichés.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
