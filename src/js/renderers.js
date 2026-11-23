/* Shared HTML Escape & Block Renderers */

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanSceneBadge(raw) {
  return String(raw ?? "")
    .replace(/^(?:SCENE|\d+)\s*\/\/\s*/i, "")
    .trim();
}

function getAllPrinciples() {
  const out = [];
  for (const tid of SITE_DATA.topicOrder) {
    const t = SITE_DATA.topics[tid];
    for (const ch of t.chapters) {
      for (const p of ch.principles || []) {
        out.push({ ...p, topicId: tid, topicTitle: t.title, chapterId: ch.id, chapterNum: ch.num });
      }
    }
  }
  return out;
}

function chapterLink(topicId, chapterId, text, className = "") {
  return `<a class="${className}" href="#/topic/${esc(topicId)}/${esc(chapterId)}">${esc(text)}</a>`;
}

function renderTopBar(state) {
  const reading = state.view === "read";
  const savedLabel = state.savedIds.length ? `收藏 ${state.savedIds.length}` : "收藏";
  return `<div class="topbar-inner">
    <div class="topbar-left">
      ${reading
        ? `<a class="topbar-brand" href="#/" aria-label="头三年首页">头三年</a><span class="topbar-topic">${esc(SITE_DATA.topics[state.topicId].title)}</span>`
        : `<span class="masthead">家庭育儿手记</span>`}
    </div>
    <nav class="topbar-actions" aria-label="阅读工具">
      ${reading ? `<button type="button" data-action="toggle-font" aria-pressed="${state.fontLarge}">大字</button>` : ""}
      <button type="button" data-action="open-saved" aria-haspopup="dialog">${savedLabel}</button>
      <button type="button" data-action="open-toc" aria-haspopup="dialog">目录</button>
    </nav>
  </div>${reading ? '<div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progress-fill"></div></div>' : ""}`;
}

function renderRouter(state) {
  const routerItems = SITE_DATA.comboRouter || [];
  const active = routerItems.find(r => r.id === state.routerId) || routerItems[0];
  if (!active) return "";
  return `<h2>先改环境，还是先接情绪？</h2>
    <div class="router-tabs" aria-label="选择情境">${routerItems.map(r =>
      `<button type="button" aria-pressed="${r.id === active.id}" data-router-id="${esc(r.id)}">${esc(r.situation)}</button>`
    ).join("")}</div>
    <div class="router-panel" aria-live="polite">
      <h3>${esc(active.firstStep)}</h3><p>${esc(active.why)}</p>
      ${chapterLink(active.targetTopic, active.targetChapter, active.targetLabel, "text-link")}
    </div>`;
}

function renderTopic(topic, state) {
  const last = state.lastVisited;
  const next = (last?.topicId === topic.id && topic.chapters.find(ch => ch.id === last.chapterId))
    || topic.chapters.find(ch => !state.readChapters.includes(`${topic.id}/${ch.id}`)) || topic.chapters[0];
  const summary = topic.id === "montessori"
    ? "从一把矮椅、一只小水壶开始，观察孩子怎样在日常生活里学会自己动手。"
    : "从扔勺子、不肯穿鞋和舍不得离开公园说起，练习接住情绪，也把界限说清楚。";
  return `<section class="topic-entry">
    <div class="topic-meta">${topic.chapters.length} 章<span aria-hidden="true"> · </span>约 ${topic.totalMinutes} 分钟</div>
    <h3>${chapterLink(topic.id, next.id, topic.title)}</h3>
    <p>${summary}</p>
    <div class="topic-actions">
      ${chapterLink(topic.id, next.id, last?.topicId === topic.id ? "继续阅读" : "读这一篇", "text-link")}
      <details class="chapter-index">
        <summary>章节目录</summary>
        <ol>${topic.chapters.map(ch => `<li>${chapterLink(topic.id, ch.id, ch.title)}${state.readChapters.includes(`${topic.id}/${ch.id}`) ? '<small>已读</small>' : ""}</li>`).join("")}</ol>
      </details>
    </div>
  </section>`;
}

function renderHome(state) {
  const topics = SITE_DATA.topicOrder.map(id => SITE_DATA.topics[id]);
  const last = state.lastVisited;
  const resumeTopic = last && SITE_DATA.topics[last.topicId];
  const resumeChapter = resumeTopic?.chapters.find(c => c.id === last.chapterId);
  const start = resumeChapter || topics[0].chapters[0];
  const topic = resumeChapter ? resumeTopic : topics[0];

  return `<header class="home-hero">
    <div class="cover-copy">
      <p class="cover-age">写给 0–3 岁孩子的父母</p>
      <h1>头三年</h1>
      <p class="cover-intro">孩子第一次自己倒水，你会伸手吗？<br>从家里的小事，读懂蒙台梭利与正面管教。</p>
      <div class="cover-actions">
        ${chapterLink(topic.id, start.id, resumeChapter ? "继续上次阅读" : "开始阅读", "cover-start")}
        <button class="quiet-link" type="button" data-action="find-scenes">按生活场景查找</button>
      </div>
      ${resumeChapter ? `<p class="resume-title">上次读到 · ${esc(resumeChapter.title)}</p>` : ""}
    </div>
    <img class="cover-art" src="./assets/illustrations/m-02c-pouring-water.webp" width="1200" height="675" fetchpriority="high" alt="孩子双手扶着小壶往杯里倒水，小黑坐在矮桌旁安静等候。">
  </header>

  <section class="home-section topics-section" aria-labelledby="topics-heading">
    <h2 id="topics-heading">选读专题</h2>
    <div class="topics-grid">${topics.map(t => renderTopic(t, state)).join("")}</div>
  </section>

  <section class="home-section scene-index" aria-labelledby="scenes-heading">
    <h2 id="scenes-heading" tabindex="-1">今晚遇到什么了？</h2>
    <div class="scene-links">${(SITE_DATA.sosShortcuts || []).map(s =>
      `<button type="button" data-sos-id="${esc(s.id)}">${esc(s.label)}</button>`
    ).join("")}</div>
  </section>

  <section class="home-section router-section" id="home-router">${renderRouter(state)}</section>
  <details class="sources"><summary>原典脉络与适用边界</summary>
    <ul>${(SITE_DATA.bibliography || []).map(b =>
      `<li><strong>${esc(b.author)}《${esc(b.title)}》</strong>（${esc(b.year)}）<p>${esc(b.note)}</p></li>`).join("")}</ul>
    <p class="future-note">后续选题 · ${(SITE_DATA.futureTopics || []).map(f => `${esc(f.title)}（${esc(f.note)}）`).join("、")}</p>
  </details>
  <footer class="site-footer"><span>头三年 · ${esc(APP_VERSION)}</span>
    <a href="https://github.com/holynova/first-three-years" target="_blank" rel="noopener">GitHub</a>
  </footer>`;
}

function renderBlock(blk, state) {
  const idAttr = blk.id ? ` id="${esc(blk.id)}"` : "";

  switch (blk.type) {
    case "scene": {
      const badge = cleanSceneBadge(blk.badge);
      return `<section class="scene-block"${idAttr}>
        ${badge ? `<span class="scene-badge">${esc(badge)}</span>` : ""}
        ${blk.paragraphs.map(p => `<p>${p}</p>`).join("")}
      </section>`;
    }

    case "heading":
      return `<div class="sec-heading"${idAttr}>
        <h2>${esc(blk.title)}</h2>
      </div>`;

    case "prose":
      return `<div class="prose"${idAttr}>
        ${blk.paragraphs.map(p => `<p>${p}</p>`).join("")}
      </div>`;

    case "quote":
      return `<blockquote class="quote-block"${idAttr}>
        ${esc(blk.text)}
        ${blk.cite ? `<span class="quote-cite">—— ${esc(blk.cite)}</span>` : ""}
      </blockquote>`;

    case "figure":
      return `<figure class="figure-block"${idAttr}>
        <button type="button" class="figure-btn" aria-label="放大插图 · ${esc(blk.alt)}" aria-haspopup="dialog" data-zoom-src="${esc(blk.src)}" data-zoom-cap="${esc(blk.caption)}" data-zoom-alt="${esc(blk.alt)}">
          <img src="${esc(blk.src)}" alt="${esc(blk.alt)}" loading="lazy" decoding="async" width="1200" height="675">
        </button>
        <figcaption class="figure-cap">${esc(blk.caption)}</figcaption>
      </figure>`;

    case "comparePair":
      return `<section${idAttr}>
        ${blk.title ? `<div class="sec-heading"><h2>${esc(blk.title)}</h2></div>` : ""}
        <div class="compare-grid">
          <div class="compare-card is-bad">
            <h4>${esc(blk.badTitle)}</h4>
            <p>${esc(blk.badText)}</p>
            ${blk.badConsequence ? `<div class="compare-note">${esc(blk.badConsequence)}</div>` : ""}
          </div>
          <div class="compare-card is-good">
            <h4>${esc(blk.goodTitle)}</h4>
            <p>${esc(blk.goodText)}</p>
            ${blk.goodEffect ? `<div class="compare-note">${esc(blk.goodEffect)}</div>` : ""}
          </div>
        </div>
      </section>`;

    case "ageTabs": {
      const selectedKey = state.widgetState[blk.widgetKey] || blk.defaultKey || blk.tabs[0]?.key;
      const active = blk.tabs.find(t => t.key === selectedKey) || blk.tabs[0];
      return `<section class="widget-box"${idAttr}>
        <h3 class="widget-title">${esc(blk.title)}</h3>
        <div class="tab-strip" role="tablist">
          ${blk.tabs.map(t => `
            <button type="button" class="tab-pill" role="tab" aria-selected="${t.key === active.key}" tabindex="${t.key === active.key ? 0 : -1}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(t.key)}">${esc(t.label)}</button>
          `).join("")}
        </div>
        <div class="panel-card" role="tabpanel">
          <div class="panel-row"><span class="panel-label blue">${esc(active.focus)} · 怎么改</span><div>${esc(active.setup)}</div></div>
          <div class="panel-row"><span class="panel-label ok">孩子收获</span><div>${esc(active.gain)}</div></div>
          <div class="panel-row"><span class="panel-label warn">避坑</span><div>${esc(active.pitfall)}</div></div>
        </div>
      </section>`;
    }

    case "scriptCompare": {
      const scenarioKeys = Object.keys(blk.scenarios);
      const selectedSc = state.widgetState[blk.widgetKey] && blk.scenarios[state.widgetState[blk.widgetKey]]
        ? state.widgetState[blk.widgetKey]
        : (blk.defaultScenario || scenarioKeys[0]);
      const sc = blk.scenarios[selectedSc];
      const modeKey = state.widgetState[`${blk.widgetKey}_mode`] || "good";
      const m = sc.modes[modeKey] || sc.modes.good;

      return `<section class="widget-box"${idAttr}>
        <h3 class="widget-title">${esc(blk.title)}</h3>
        <div class="tab-strip" role="tablist">
          ${scenarioKeys.map(k => `
            <button type="button" class="tab-pill" role="tab" aria-selected="${k === selectedSc}" tabindex="${k === selectedSc ? 0 : -1}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(k)}">${esc(blk.scenarios[k].label)}</button>
          `).join("")}
        </div>
        <p class="widget-context">${esc(sc.sceneNote)}</p>
        <div class="mode-strip" role="tablist">
          ${["bad", "soft", "good"].map(mk => `
            <button type="button" class="mode-btn" role="tab" data-tone="${sc.modes[mk].tone}" aria-selected="${modeKey === mk}" tabindex="${modeKey === mk ? 0 : -1}" data-widget-key="${esc(blk.widgetKey)}_mode" data-widget-val="${mk}">${esc(sc.modes[mk].name)}</button>
          `).join("")}
        </div>
        <div class="panel-card" role="tabpanel">
          <div class="dialogue-quote">${esc(m.script)}</div>
          <div class="panel-row"><span class="panel-label blue">孩子听到了什么</span><div>${esc(m.brain)}</div></div>
          <div class="panel-row"><span class="panel-label ${m.tone === "good" ? "ok" : "warn"}">${m.tone === "good" ? "为什么管用" : "为什么翻车"}</span><div>${esc(m.why)}</div></div>
          <div class="panel-row"><span class="panel-label">下一步</span><div>${esc(m.next)}</div></div>
        </div>
      </section>`;
    }

    case "myths":
      return `<section class="widget-box"${idAttr}>
        <h3 class="widget-title">${esc(blk.title)}</h3>
        <div class="myth-list">
          ${blk.items.map((item, idx) => {
            const k = `${blk.id || "myths"}_${idx}`;
            const isOpen = state.openMyths[k] !== undefined ? state.openMyths[k] : idx === 0;
            return `<div class="myth-item">
              <button type="button" class="myth-trigger" aria-expanded="${isOpen}" data-myth-key="${esc(k)}">
                <span class="myth-question">${esc(item.q)}</span>
                <span class="myth-chevron">${isOpen ? "−" : "+"}</span>
              </button>
              ${isOpen ? `<div class="myth-body">${esc(item.a)}</div>` : ""}
            </div>`;
          }).join("")}
        </div>
      </section>`;

    case "decoder": {
      const selectedKey = state.widgetState[blk.widgetKey] || blk.defaultKey || blk.items[0]?.key;
      const active = blk.items.find(it => it.key === selectedKey) || blk.items[0];
      return `<section class="widget-box"${idAttr}>
        <h3 class="widget-title">${esc(blk.title)}</h3>
        <div class="tab-strip" role="tablist">
          ${blk.items.map(it => `
            <button type="button" class="tab-pill" role="tab" aria-selected="${it.key === active.key}" tabindex="${it.key === active.key ? 0 : -1}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(it.key)}">${esc(it.label)}</button>
          `).join("")}
        </div>
        <div class="panel-card" role="tabpanel">
          <div class="panel-row"><span class="panel-label warn">表象</span><div>${esc(active.surface)}</div></div>
          <div class="panel-row"><span class="panel-label blue">背后需求</span><div>${active.needs.map(n => `· ${esc(n)}`).join("<br>")}</div></div>
          <div class="panel-row"><span class="panel-label ok">短话与动作</span><div><strong>${esc(active.say)}</strong><br>${esc(active.action)}</div></div>
          <div class="panel-row"><span class="panel-label">别说这句</span><div>${esc(active.avoid)}</div></div>
        </div>
      </section>`;
    }

    case "checklist": {
      const doneInList = blk.items.filter(it => state.checkedIds.includes(it.id)).length;
      return `<section class="widget-box"${idAttr}>
        <div class="checklist-head">
          <h3 class="widget-title">${esc(blk.title)}</h3>
          <span class="checklist-meta">${doneInList}/${blk.items.length}</span>
        </div>
        <div class="check-list">
          ${blk.items.map(it => {
            const checked = state.checkedIds.includes(it.id);
            return `<button type="button" class="check-row" role="checkbox" aria-checked="${checked}" data-check-id="${esc(it.id)}">
              <span class="check-box">${checked ? "✓" : ""}</span>
              <span class="check-main">
                ${esc(it.text)}
                ${it.hint ? `<span class="check-hint">${esc(it.hint)}</span>` : ""}
              </span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
    }

    case "bridge":
      return `<section class="bridge-card"${idAttr}>
        <p>${esc(blk.text)}</p>
        <button type="button" class="bridge-go" data-open-topic="${esc(blk.targetTopic)}" data-open-chapter="${esc(blk.targetChapter)}">${esc(blk.btnText)}</button>
      </section>`;

    default:
      return "";
  }
}

function renderReading(state) {
  const topic = SITE_DATA.topics[state.topicId];
  const ch = topic.chapters.find(c => c.id === state.chapterId) || topic.chapters[0];

  return `<article class="article-wrap ${state.fontLarge ? "is-large" : ""}">
    <header class="article-head" id="sec-top">
      <p class="chapter-meta">${esc(topic.title)} · 第 ${Number(ch.num)} 章 / 共 ${topic.chapters.length} 章</p>
      <h1>${esc(ch.title)}</h1>
      <div class="article-lead">${esc(ch.lead)}</div>
    </header>

    ${(ch.blocks || []).map(b => renderBlock(b, state)).join("")}

    <section class="widget-box" id="sec-principles">
      <h3 class="widget-title">记住这三条</h3>
      <div class="principle-list">
        ${(ch.principles || []).map(p => {
          const saved = state.savedIds.includes(p.id);
          return `<div class="principle-item">
            <div class="principle-text">${esc(p.text)}</div>
            <button type="button" class="save-btn" aria-pressed="${saved}" data-save-id="${esc(p.id)}">${saved ? "已收藏" : "收藏"}</button>
          </div>`;
        }).join("")}
      </div>
    </section>
    <nav class="chapter-foot" aria-label="章节翻页">${renderBottomDock(state)}</nav>
  </article>`;
}

function renderBottomDock(state) {
  if (state.view !== "read") return "";
  const topic = SITE_DATA.topics[state.topicId];
  const idx = topic.chapters.findIndex(c => c.id === state.chapterId);
  const prevCh = idx > 0 ? topic.chapters[idx - 1] : null;
  const nextCh = idx >= 0 && idx < topic.chapters.length - 1 ? topic.chapters[idx + 1] : null;
  const otherTopicId = state.topicId === "montessori" ? "discipline" : "montessori";
  const otherTopic = SITE_DATA.topics[otherTopicId];
  const readKey = `${topic.id}/${topic.chapters[idx].id}`;
  const isDone = state.readChapters.includes(readKey);

  return `<div class="bottom-dock-inner">
    <div class="dock-group">
      <button type="button" class="dock-btn ${isDone ? "is-done" : ""}" aria-pressed="${isDone}" data-toggle-read="${esc(readKey)}">
        ${isDone ? "已读" : "标为已读"}
      </button>
      ${prevCh ? `<button type="button" class="dock-btn" data-open-topic="${topic.id}" data-open-chapter="${prevCh.id}">上一章</button>` : ""}
    </div>
    <div class="dock-group">
      ${nextCh
        ? `<button type="button" class="dock-btn primary" data-open-topic="${topic.id}" data-open-chapter="${nextCh.id}">下一章</button>`
        : `<button type="button" class="dock-btn primary" data-open-topic="${otherTopic.id}" data-open-chapter="${otherTopic.chapters[0].id}">读《${esc(otherTopic.title)}》</button>`
      }
    </div>
  </div>`;
}
