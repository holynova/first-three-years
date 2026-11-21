import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");

function countHanzi(value) {
  let count = 0;
  function walk(node) {
    if (typeof node === "string") {
      const stripped = node.replace(/<[^>]+>/g, "");
      const matches = stripped.match(/[\u4e00-\u9fff]/g);
      if (matches) count += matches.length;
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  }
  walk(value);
  return count;
}

export async function build() {
  const contentUrl = new URL("../src/content/index.mjs?t=" + Date.now(), import.meta.url);
  const { default: siteData } = await import(contentUrl);

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(distDir, "assets", "illustrations"), { recursive: true });

  // Copy static shell files
  fs.copyFileSync(path.join(srcDir, "index.html"), path.join(distDir, "index.html"));
  fs.copyFileSync(path.join(srcDir, "favicon.svg"), path.join(distDir, "favicon.svg"));
  fs.copyFileSync(path.join(srcDir, "styles", "main.css"), path.join(distDir, "styles.css"));

  // Copy all illustrations
  const illusSrcDir = path.join(srcDir, "assets", "illustrations");
  const illusFiles = fs.readdirSync(illusSrcDir).filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  for (const file of illusFiles) {
    fs.copyFileSync(
      path.join(illusSrcDir, file),
      path.join(distDir, "assets", "illustrations", file)
    );
  }

  // Assemble classic IIFE bundle compatible with both file:// and HTTP servers
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const appVersion = String(pkg.version || "1.0.0");
  const renderersSrc = fs.readFileSync(path.join(srcDir, "js", "renderers.js"), "utf8");
  const appSrc = fs.readFileSync(path.join(srcDir, "js", "app.js"), "utf8");
  const serializedData = JSON.stringify(siteData);

  const bundle = [
    "/* Built by scripts/build.mjs */",
    "(function () {",
    '"use strict";',
    `const APP_VERSION = ${JSON.stringify("v" + appVersion)};`,
    `const SITE_DATA = ${serializedData};`,
    renderersSrc,
    appSrc,
    "})();",
    ""
  ].join("\n");

  fs.writeFileSync(path.join(distDir, "app.js"), bundle, "utf8");

  const stats = {};
  for (const tid of siteData.topicOrder) {
    const t = siteData.topics[tid];
    const hanzi = countHanzi(t);
    stats[tid] = {
      title: t.title,
      chapters: t.chapters.length,
      hanzi,
      estMinutes: Math.round(hanzi / 340)
    };
  }

  console.log("Build complete -> dist/");
  console.log(`Illustrations copied: ${illusFiles.length}`);
  for (const [k, s] of Object.entries(stats)) {
    console.log(`  - ${k} (${s.title}): ${s.chapters} 节, ${s.hanzi} 汉字, 约 ${s.estMinutes} 分钟`);
  }
  return stats;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
