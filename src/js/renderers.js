/* Shared HTML Escape & Block Renderers */

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  if (state.view === "home") {
    return `<div class="topbar-inner">
      <div class="topbar-left">
        <span class="topbar-brand">${esc(SITE_DATA.brand.code)}</span>
      </div>
      <div class="topbar-actions">
        <button type="button" class="pill-btn" data-action="open-saved">★ 收藏 (${savedCount})</button>
        <button type="button" class="pill-btn" data-action="open-toc">全书目录</button>
      </div>
    </div>`;
  }

  const topic = SITE_DATA.topics[state.topicId];
  const ch = topic.chapters.find(c => c.id === state.chapterId) || topic.chapters[0];
  return `<div class="topbar-inner">
    <div class="topbar-left">
      <button type="button" class="topbar-back" data-action="go-home">← 索引</button>
      <span class="topbar-topic">${esc(topic.vol)} · ${esc(ch.num)}/${String(topic.chapters.length).padStart(2, "0")}</span>
    </div>
    <div class="topbar-actions">
      <button type="button" class="pill-btn" data-action="toggle-font" aria-pressed="${state.fontLarge}">${state.fontLarge ? "标准字" : "大字"}</button>
      <button type="button" class="pill-btn" data-action="open-saved">★ ${savedCount}</button>
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
        <span class="side-chap-num">${esc(ch.num)}</span>
        <span style="flex:1">${esc(ch.title)}</span>
        ${done ? `<span class="side-chap-check">✓</span>` : ""}
      </button>`;
    }).join("")}
  </div>
  <div class="side-utility">
    <span>预计 ${topic.totalMinutes} 分钟读完</span>
    <button type="button" style="color:var(--blue);font-weight:700;" data-action="open-saved">★ 已存 ${state.savedIds.length} 条</button>
  </div>`;
}

function renderHome(state) {
  const topics = SITE_DATA.topicOrder.map(id => SITE_DATA.topics[id]);
  const totalMins = topics.reduce((acc, t) => acc + t.totalMinutes, 0);
  const totalChaps = topics.reduce((acc, t) => acc + t.chapters.length, 0);

  let resumeHtml = "";
  if (state.lastVisited) {
    const t = SITE_DATA.topics[state.lastVisited.topicId];
    const ch = t?.chapters?.find(c => c.id === state.lastVisited.chapterId);
    if (t && ch) {
      resumeHtml = `<div class="resume-banner">
        <div class="resume-meta">
          <span>继续上次阅读</span>
          <strong>${esc(t.title)} · ${esc(ch.num)} ${esc(ch.title)}</strong>
        </div>
        <button type="button" class="resume-go" data-open-topic="${t.id}" data-open-chapter="${ch.id}">接着看 →</button>
      </div>`;
    }
  }

  const routerItems = SITE_DATA.comboRouter || [];
  const activeRouter = routerItems.find(r => r.id === state.routerId) || routerItems[0];

  return `<header class="home-hero">
    <div class="home-eyebrow">${esc(SITE_DATA.brand.code)} · 白纸手记</div>
    <h1>${esc(SITE_DATA.brand.name)}：${esc(SITE_DATA.brand.tagline)}</h1>
    <p>把最容易被商业机构讲偏的两套育儿方法，还原成 0–3 岁家长真正用得上的白纸手记。说人话、有具体现场、不贩卖焦虑，合起来是能从头读到尾的深读手册。</p>
    <div class="home-stats-line">
      <span>2 大专题 · ${totalChaps} 节完整内容</span>
      <span>12 张小黑原创手绘图解</span>
      <span>全站约 ${totalMins} 分钟深读</span>
    </div>
    ${resumeHtml}
  </header>

  <section class="sos-box" aria-label="今晚遇到了什么">
    <div class="sos-head">
      <h2>今晚刚遇到了什么？点一下直达现场</h2>
      <span>1-TAP JUMP</span>
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
        <div class="topic-card-top">
          <span class="topic-code">${esc(t.code)}</span>
          <span class="topic-dur">${t.chapters.length} 节 · 约 ${t.totalMinutes} 分钟${doneCount ? ` · 已读 ${doneCount}` : ""}</span>
        </div>
        <h2>${esc(t.title)}</h2>
        <div class="topic-sub">${esc(t.subtitle)}</div>
        <p class="topic-desc">${esc(t.summary)}</p>
        <div class="topic-chaps">
          ${t.chapters.map(ch => {
            const isRead = state.readChapters.includes(`${t.id}/${ch.id}`);
            return `<button type="button" class="topic-chap-btn ${isRead ? "is-read" : ""}" data-open-topic="${t.id}" data-open-chapter="${ch.id}">
              <span class="t-num">${esc(ch.num)}</span>
              <span class="t-title">${esc(ch.title)}</span>
              <span class="t-meta">${isRead ? "✓ 已读" : `${ch.minutes}m`}</span>
            </button>`;
          }).join("")}
        </div>
        <button type="button" class="topic-start-btn" data-open-topic="${t.id}" data-open-chapter="${t.chapters[0].id}">
          从第 01 节开始读《${esc(t.title)}》 →
        </button>
      </section>`;
    }).join("")}
  </div>

  ${activeRouter ? `<section class="router-box" aria-label="蒙氏与正面管教怎么配合">
    <h3>拿不准时：先改环境（蒙氏），还是先接情绪（正面管教）？</h3>
    <p class="router-sub">两套方法在客厅里并不冲突——点一下家里正发生的状况，看第一步到底先做什么：</p>
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
    <h3>本手册依据的原典脉络与适用边界</h3>
    <ul class="biblio-list">
      ${(SITE_DATA.bibliography || []).map(b => `
        <li class="biblio-item"><strong>${esc(b.author)}《${esc(b.title)}》(${esc(b.year)})：</strong>${esc(b.note)}</li>
      `).join("")}
    </ul>
    <div class="future-box">
      <strong>后续规划专题：</strong>${(SITE_DATA.futureTopics || []).map(f => `${esc(f.title)}（${esc(f.note)}）`).join(" · ")}
    </div>
  </section>

  <footer class="site-footer">
    <span>头三年 · 0–3 岁育儿白纸手记 <span class="site-ver">${esc(typeof APP_VERSION === "string" ? APP_VERSION : "v1.0.0")}</span></span>
    <span class="site-footer-links">
      <a href="https://github.com/holynova/first-three-years" target="_blank" rel="noopener">GitHub 源码</a>
    </span>
  </footer>`;
}

function renderBlock(blk, state) {
  const idAttr = blk.id ? ` id="${esc(blk.id)}"` : "";

  switch (blk.type) {
    case "scene":
      return `<section class="scene-block"${idAttr}>
        <span class="scene-badge">${esc(blk.badge)}</span>
        ${blk.paragraphs.map(p => `<p>${p}</p>`).join("")}
      </section>`;

    case "heading":
      return `<div class="sec-heading"${idAttr}>
        ${blk.num ? `<span class="sec-num">${esc(blk.num)}</span>` : ""}
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
        <span class="figure-tag">${esc(blk.tag)}</span>
        <button type="button" class="figure-btn" data-zoom-src="${esc(blk.src)}" data-zoom-cap="${esc(blk.caption)}" data-zoom-alt="${esc(blk.alt)}">
          <img src="${esc(blk.src)}" alt="${esc(blk.alt)}" loading="lazy">
          <figcaption class="figure-cap">
            <span>${esc(blk.caption)}</span>
            <span class="figure-zoom">轻点放大 ↗</span>
          </figcaption>
        </button>
      </figure>`;

    case "comparePair":
      return `<section${idAttr}>
        ${blk.title ? `<div class="sec-heading"><span class="sec-num">VS</span><h2>${esc(blk.title)}</h2></div>` : ""}
        <div class="compare-grid">
          <div class="compare-card is-bad">
            <span class="compare-badge">${esc(blk.badLabel || "常见踩坑做法")}</span>
            <h4>${esc(blk.badTitle)}</h4>
            <p>${esc(blk.badText)}</p>
            ${blk.badConsequence ? `<div class="compare-note">${esc(blk.badConsequence)}</div>` : ""}
          </div>
          <div class="compare-card is-good">
            <span class="compare-badge">${esc(blk.goodLabel || "试试这样改")}</span>
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
        ${blk.sub ? `<p class="widget-sub">${esc(blk.sub)}</p>` : ""}
        <div class="tab-strip" role="tablist">
          ${blk.tabs.map(t => `
            <button type="button" class="tab-pill" role="tab" aria-selected="${t.key === active.key}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(t.key)}">${esc(t.label)}</button>
          `).join("")}
        </div>
        <div class="panel-card" role="tabpanel">
          <div class="panel-row"><span class="panel-label blue">${esc(active.focus)} · 怎么改 / 怎么看</span><div>${esc(active.setup)}</div></div>
          <div class="panel-row"><span class="panel-label ok">孩子收获</span><div>${esc(active.gain)}</div></div>
          <div class="panel-row"><span class="panel-label warn">避坑提醒</span><div>${esc(active.pitfall)}</div></div>
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
        ${blk.sub ? `<p class="widget-sub">${esc(blk.sub)}</p>` : ""}
        <div class="tab-strip" role="tablist">
          ${scenarioKeys.map(k => `
            <button type="button" class="tab-pill" role="tab" aria-selected="${k === selectedSc}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(k)}">${esc(blk.scenarios[k].label)}</button>
          `).join("")}
        </div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:10px;line-height:1.55;">${esc(sc.sceneNote)}</p>
        <div class="mode-strip" role="tablist">
          ${["bad", "soft", "good"].map(mk => `
            <button type="button" class="mode-btn" role="tab" data-tone="${sc.modes[mk].tone}" aria-selected="${modeKey === mk}" data-widget-key="${esc(blk.widgetKey)}_mode" data-widget-val="${mk}">${esc(sc.modes[mk].name)}</button>
          `).join("")}
        </div>
        <div class="panel-card" role="tabpanel">
          <div class="dialogue-quote">${esc(m.script)}</div>
          <div class="panel-row"><span class="panel-label blue">0–3 岁大脑实际听到了什么</span><div>${esc(m.brain)}</div></div>
          <div class="panel-row"><span class="panel-label ${m.tone === "good" ? "ok" : "warn"}">${m.tone === "good" ? "为什么这句管用" : "为什么容易翻车"}</span><div>${esc(m.why)}</div></div>
          <div class="panel-row"><span class="panel-label">下一步动作</span><div>${esc(m.next)}</div></div>
        </div>
      </section>`;
    }

    case "myths":
      return `<section class="widget-box"${idAttr}>
        <h3 class="widget-title">${esc(blk.title)}</h3>
        ${blk.sub ? `<p class="widget-sub">${esc(blk.sub)}</p>` : ""}
        <div class="myth-list">
          ${blk.items.map((item, idx) => {
            const k = `${blk.id || "myths"}_${idx}`;
            const isOpen = state.openMyths[k] !== undefined ? state.openMyths[k] : idx === 0;
            return `<div class="myth-item">
              <button type="button" class="myth-trigger" aria-expanded="${isOpen}" data-myth-key="${esc(k)}">
                <span class="myth-tag">${esc(item.tag || `误区 ${idx + 1}`)}</span>
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
        ${blk.sub ? `<p class="widget-sub">${esc(blk.sub)}</p>` : ""}
        <div class="tab-strip" role="tablist">
          ${blk.items.map(it => `
            <button type="button" class="tab-pill" role="tab" aria-selected="${it.key === active.key}" data-widget-key="${esc(blk.widgetKey)}" data-widget-val="${esc(it.key)}">${esc(it.label)}</button>
          `).join("")}
        </div>
        <div class="panel-card" role="tabpanel">
          <div class="panel-row"><span class="panel-label warn">大人眼里的表象</span><div>${esc(active.surface)}</div></div>
          <div class="panel-row"><span class="panel-label blue">掀开盖子往往是</span><div>${active.needs.map(n => `· ${esc(n)}`).join("<br>")}</div></div>
          <div class="panel-row"><span class="panel-label ok">第一句短话 + 身体动作</span><div><strong>${esc(active.say)}</strong><br>${esc(active.action)}</div></div>
          <div class="panel-row"><span class="panel-label">别说这句话</span><div>${esc(active.avoid)}</div></div>
        </div>
      </section>`;
    }

    case "checklist": {
      const doneInList = blk.items.filter(it => state.checkedIds.includes(it.id)).length;
      return `<section class="widget-box"${idAttr}>
        <h3 class="widget-title">${esc(blk.title)}</h3>
        ${blk.sub ? `<p class="widget-sub">${esc(blk.sub)}</p>` : ""}
        <div class="checklist-meta">已完成 ${doneInList} / ${blk.items.length} 项（状态自动存在本机）</div>
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
        <div class="bridge-eyebrow">${esc(blk.eyebrow)}</div>
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
  const chIdx = topic.chapters.indexOf(ch);

  return `<article class="article-wrap ${state.fontLarge ? "is-large" : ""}">
    <header class="article-head" id="${esc(ch.jumpRail?.[0]?.id || "sec-top")}">
      <div class="article-eyebrow">${esc(topic.title)} · 第 ${esc(ch.num)} 节 / 共 ${topic.chapters.length} 节 · 约 ${ch.minutes} 分钟</div>
      <h1>${esc(ch.title)}</h1>
      ${ch.subtitle ? `<div class="article-subtitle">${esc(ch.subtitle)}</div>` : ""}
      <div class="article-lead">${esc(ch.lead)}</div>
    </header>

    ${(ch.blocks || []).map(b => renderBlock(b, state)).join("")}

    <section class="widget-box" id="sec-principles">
      <h3 class="widget-title">本节 3 条可带走原则</h3>
      <p class="widget-sub">点击收藏存入本机共读夹，可随时一键复制发给家人：</p>
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
        ${isDone ? "✓ 已读完本节" : "标为已读"}
      </button>
      ${prevCh ? `<button type="button" class="dock-btn" data-open-topic="${topic.id}" data-open-chapter="${prevCh.id}">← 上一节</button>` : ""}
    </div>
    <div class="dock-group">
      ${nextCh
        ? `<button type="button" class="dock-btn primary" data-open-topic="${topic.id}" data-open-chapter="${nextCh.id}">下一节：${esc(nextCh.num)} →</button>`
        : `<button type="button" class="dock-btn primary" data-open-topic="${otherTopic.id}" data-open-chapter="${otherTopic.chapters[0].id}">继续读《${esc(otherTopic.title)}》 →</button>`
      }
    </div>
  </div>`;
}
