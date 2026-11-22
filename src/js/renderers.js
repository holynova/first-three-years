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

function renderTopBar(state) {
  const savedCount = state.savedIds.length;
  const savedLabel = savedCount > 0 ? `收藏 ${savedCount}` : "收藏";
  if (state.view === "home") {
    return `<div class="topbar-inner">
      <div class="topbar-left">
        <span class="topbar-brand">${esc(SITE_DATA.brand.name)}</span>
      </div>
      <div class="topbar-actions">
        <button type="button" class="pill-btn" data-action="open-saved">${savedLabel}</button>
        <button type="button" class="pill-btn" data-action="open-toc">目录</button>
      </div>
    </div>`;
  }

  const topic = SITE_DATA.topics[state.topicId];
  return `<div class="topbar-inner">
    <div class="topbar-left">
      <button type="button" class="topbar-back" data-action="go-home">← 首页</button>
      <span class="topbar-topic">${esc(topic.title)}</span>
    </div>
    <div class="topbar-actions">
      <button type="button" class="pill-btn" data-action="toggle-font" aria-pressed="${state.fontLarge}">${state.fontLarge ? "标准" : "大字"}</button>
      <button type="button" class="pill-btn" data-action="open-saved">${savedLabel}</button>
      <button type="button" class="pill-btn" data-action="open-toc">目录</button>
    </div>
  </div>
  <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>`;
}

function renderJumpRail(state) {
  if (state.view !== "read") return "";
  const topic = SITE_DATA.topics[state.topicId];
  const ch = topic.chapters.find(c => c.id === state.chapterId) || topic.chapters[0];
  const items = ch.jumpRail || [];
  return `<div class="jump-rail-inner">${items.map((item, idx) => {
    const isActive = state.activeJump ? state.activeJump === item.id : idx === 0;
    return `<button type="button" class="rail-pill ${isActive ? "active" : ""}" data-jump="${esc(item.id)}">${esc(item.label)}</button>`;
  }).join("")}</div>`;
}

function renderSidebar(state) {
  if (state.view !== "read") return "";
  const topic = SITE_DATA.topics[state.topicId];
  return `<div class="side-topic-tabs" role="tablist" aria-label="切换专题">
    ${SITE_DATA.topicOrder.map(tid => {
      const t = SITE_DATA.topics[tid];
      const active = tid === state.topicId;
      return `<button type="button" class="side-topic-btn ${active ? "active" : ""}" data-open-chapter="${t.chapters[0].id}" data-open-topic="${tid}">${esc(t.title)}</button>`;
    }).join("")}
  </div>
  <div class="side-chap-list">
    ${topic.chapters.map(ch => {
      const active = ch.id === state.chapterId;
      const done = state.readChapters.includes(`${topic.id}/${ch.id}`);
      return `<button type="button" class="side-chap-btn ${active ? "active" : ""}" data-open-topic="${topic.id}" data-open-chapter="${ch.id}">
        <span style="flex:1">${esc(ch.title)}</span>
        ${done ? `<span class="side-chap-check">✓</span>` : ""}
      </button>`;
    }).join("")}
  </div>
  <div class="side-utility">
    <button type="button" class="side-saved-link" data-action="open-saved">查看收藏${state.savedIds.length ? ` (${state.savedIds.length})` : ""}</button>
  </div>`;
}

function renderHome(state) {
  const topics = SITE_DATA.topicOrder.map(id => SITE_DATA.topics[id]);

  let resumeHtml = "";
  if (state.lastVisited) {
    const t = SITE_DATA.topics[state.lastVisited.topicId];
    const ch = t?.chapters?.find(c => c.id === state.lastVisited.chapterId);
    if (t && ch) {
      resumeHtml = `<div class="resume-banner">
        <div class="resume-meta">
          <span>继续上次阅读</span>
          <strong>${esc(t.title)} · ${esc(ch.title)}</strong>
        </div>
        <button type="button" class="resume-go" data-open-topic="${t.id}" data-open-chapter="${ch.id}">接着看 →</button>
      </div>`;
    }
  }

  const routerItems = SITE_DATA.comboRouter || [];
  const activeRouter = routerItems.find(r => r.id === state.routerId) || routerItems[0];

  return `<header class="home-hero">
    <h1>${esc(SITE_DATA.brand.name)}</h1>
    <p>把最容易被商业机构讲偏的两套 0–3 岁育儿方法拆开说人话：有真实生活现场、小黑手绘图解和可直接照着说的话术，合起来是一份耐看的随手翻手册。</p>
    ${resumeHtml}
  </header>

  <section class="sos-box" aria-label="今晚遇到什么了">
    <div class="sos-head">
      <h2>今晚遇到什么了？</h2>
    </div>
    <div class="sos-chips">
      ${(SITE_DATA.sosShortcuts || []).map(s => `
        <button type="button" class="sos-chip" data-sos-id="${esc(s.id)}">${esc(s.label)}</button>
      `).join("")}
    </div>
  </section>

  <div class="topics-grid">
    ${topics.map(t => {
      const doneCount = t.chapters.filter(c => state.readChapters.includes(`${t.id}/${c.id}`)).length;
      return `<section class="topic-card">
        <h2>${esc(t.title)}</h2>
        <p class="topic-desc">${esc(t.summary)}</p>
        <div class="topic-chaps">
          ${t.chapters.map(ch => {
            const isRead = state.readChapters.includes(`${t.id}/${ch.id}`);
            return `<button type="button" class="topic-chap-btn ${isRead ? "is-read" : ""}" data-open-topic="${t.id}" data-open-chapter="${ch.id}">
              <span class="t-title">${esc(ch.title)}</span>
              ${isRead ? `<span class="t-done">✓</span>` : ""}
            </button>`;
          }).join("")}
        </div>
        <button type="button" class="topic-start-btn" data-open-topic="${t.id}" data-open-chapter="${t.chapters[0].id}">
          ${doneCount > 0 ? "继续阅读" : "开始阅读"} →
        </button>
      </section>`;
    }).join("")}
  </div>

  ${activeRouter ? `<section class="router-box" aria-label="先改环境，还是先接情绪">
    <h3>先改环境，还是先接情绪？</h3>
    <div class="router-tabs" role="tablist">
      ${routerItems.map(r => `
        <button type="button" class="router-tab" role="tab" aria-selected="${r.id === activeRouter.id}" data-router-id="${esc(r.id)}">${esc(r.situation)}</button>
      `).join("")}
    </div>
    <div class="router-panel" role="tabpanel">
      <strong>${esc(activeRouter.firstStep)}</strong>
      <p>${esc(activeRouter.why)}</p>
      <button type="button" class="router-go" data-open-topic="${activeRouter.targetTopic}" data-open-chapter="${activeRouter.targetChapter}">
        ${esc(activeRouter.targetLabel)} →
      </button>
    </div>
  </section>` : ""}

  <section class="biblio-box">
    <h3>原典脉络与适用边界</h3>
    <ul class="biblio-list">
      ${(SITE_DATA.bibliography || []).map(b => `
        <li class="biblio-item"><strong>${esc(b.author)}《${esc(b.title)}》(${esc(b.year)})：</strong>${esc(b.note)}</li>
      `).join("")}
    </ul>
    <div class="future-box">
      <strong>后续规划：</strong>${(SITE_DATA.futureTopics || []).map(f => `${esc(f.title)}（${esc(f.note)}）`).join(" · ")}
    </div>
  </section>

  <footer class="site-footer">
    <span>头三年 ${esc(typeof APP_VERSION === "string" ? APP_VERSION : "v1.1.0")}</span>
    <span class="site-footer-links">
      <a href="https://github.com/holynova/first-three-years" target="_blank" rel="noopener">GitHub</a>
    </span>
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
        <button type="button" class="figure-btn" aria-label="放大查看插图" data-zoom-src="${esc(blk.src)}" data-zoom-cap="${esc(blk.caption)}" data-zoom-alt="${esc(blk.alt)}">
          <img src="${esc(blk.src)}" alt="${esc(blk.alt)}" loading="lazy">
          <figcaption class="figure-cap">${esc(blk.caption)}</figcaption>
        </button>
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
            <button type="button" class="tab-pill" role="tab" aria-selected="${t.key === active.key}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(t.key)}">${esc(t.label)}</button>
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
            <button type="button" class="tab-pill" role="tab" aria-selected="${k === selectedSc}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(k)}">${esc(blk.scenarios[k].label)}</button>
          `).join("")}
        </div>
        <p class="widget-context">${esc(sc.sceneNote)}</p>
        <div class="mode-strip" role="tablist">
          ${["bad", "soft", "good"].map(mk => `
            <button type="button" class="mode-btn" role="tab" data-tone="${sc.modes[mk].tone}" aria-selected="${modeKey === mk}" data-widget-key="${esc(blk.widgetKey)}_mode" data-widget-val="${mk}">${esc(sc.modes[mk].name)}</button>
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
                <span style="flex:1">${esc(item.q)}</span>
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
            <button type="button" class="tab-pill" role="tab" aria-selected="${it.key === active.key}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(it.key)}">${esc(it.label)}</button>
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
        <button type="button" class="bridge-go" data-open-topic="${esc(blk.targetTopic)}" data-open-chapter="${esc(blk.targetChapter)}">${esc(blk.btnText)} →</button>
      </section>`;

    default:
      return "";
  }
}

function renderReading(state) {
  const topic = SITE_DATA.topics[state.topicId];
  const ch = topic.chapters.find(c => c.id === state.chapterId) || topic.chapters[0];

  return `<article class="article-wrap ${state.fontLarge ? "is-large" : ""}">
    <header class="article-head" id="${esc(ch.jumpRail?.[0]?.id || "sec-top")}">
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
            <button type="button" class="save-btn" aria-pressed="${saved}" data-save-id="${esc(p.id)}">${saved ? "★ 已存" : "☆ 收藏"}</button>
          </div>`;
        }).join("")}
      </div>
    </section>
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
      <button type="button" class="dock-btn ${isDone ? "is-done" : ""}" data-toggle-read="${esc(readKey)}">
        ${isDone ? "✓ 已读" : "标为已读"}
      </button>
      ${prevCh ? `<button type="button" class="dock-btn" data-open-topic="${topic.id}" data-open-chapter="${prevCh.id}">← 上一节</button>` : ""}
    </div>
    <div class="dock-group">
      ${nextCh
        ? `<button type="button" class="dock-btn primary" data-open-topic="${topic.id}" data-open-chapter="${nextCh.id}">下一节 →</button>`
        : `<button type="button" class="dock-btn primary" data-open-topic="${otherTopic.id}" data-open-chapter="${otherTopic.chapters[0].id}">读《${esc(otherTopic.title)}》 →</button>`
      }
    </div>
  </div>`;
}
