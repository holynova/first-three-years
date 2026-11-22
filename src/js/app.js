/* Application State, Routing, Persistence & Interactions */

const STORAGE_KEY = "first_three_years_state_v1";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function savePersisted(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      fontLarge: state.fontLarge,
      savedIds: state.savedIds,
      readChapters: state.readChapters,
      checkedIds: state.checkedIds,
      lastVisited: state.lastVisited
    }));
  } catch (e) {}
}

const persisted = loadPersisted();

const state = {
  view: "home",
  topicId: "montessori",
  chapterId: "ch01",
  fontLarge: Boolean(persisted.fontLarge),
  savedIds: Array.isArray(persisted.savedIds) ? persisted.savedIds : ["m-ch02-p1", "d-ch01-p1"],
  readChapters: Array.isArray(persisted.readChapters) ? persisted.readChapters : [],
  checkedIds: Array.isArray(persisted.checkedIds) ? persisted.checkedIds : [],
  lastVisited: persisted.lastVisited || null,
  routerId: (SITE_DATA.comboRouter && SITE_DATA.comboRouter[0]?.id) || "mess",
  widgetState: {},
  openMyths: {},
  activeJump: ""
};

function parseHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw || raw === "/") {
    state.view = "home";
    return;
  }
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "topic" && SITE_DATA.topics[parts[1]]) {
    const topic = SITE_DATA.topics[parts[1]];
    const ch = topic.chapters.find(c => c.id === parts[2]) || topic.chapters[0];
    state.view = "read";
    state.topicId = topic.id;
    state.chapterId = ch.id;
    state.activeJump = ch.jumpRail?.[0]?.id || "";
    state.lastVisited = { topicId: topic.id, chapterId: ch.id };
  } else {
    state.view = "home";
  }
}

function writeHash() {
  const target = state.view === "read"
    ? `#/topic/${state.topicId}/${state.chapterId}`
    : "#/";
  if (location.hash !== target) {
    try {
      history.replaceState(null, "", target);
    } catch (e) {
      location.hash = target;
    }
  }
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { el.hidden = true; }, 2200);
}

function updateScrollProgress() {
  const fill = document.getElementById("progress-fill");
  if (!fill) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0.08, window.scrollY / max)) : 0.25;
  fill.style.width = Math.round(ratio * 100) + "%";
}

function renderAll(opts = {}) {
  const frame = document.getElementById("layout-frame");
  frame.className = state.view === "read" ? "layout-frame is-reading" : "layout-frame is-home";

  document.getElementById("topbar").innerHTML = renderTopBar(state);

  const rail = document.getElementById("jump-rail");
  if (state.view === "read") {
    rail.hidden = false;
    rail.innerHTML = renderJumpRail(state);
  } else {
    rail.hidden = true;
    rail.innerHTML = "";
  }

  document.getElementById("desktop-sidebar").innerHTML = renderSidebar(state);
  document.getElementById("main-canvas").innerHTML = state.view === "read" ? renderReading(state) : renderHome(state);

  const dock = document.getElementById("bottom-dock");
  if (state.view === "read") {
    dock.hidden = false;
    dock.innerHTML = renderBottomDock(state);
  } else {
    dock.hidden = true;
    dock.innerHTML = "";
  }

  writeHash();
  savePersisted(state);
  if (opts.scrollTop) window.scrollTo({ top: 0, behavior: "instant" });
  updateScrollProgress();
}

function openTocDrawer() {
  const overlay = document.getElementById("drawer-overlay");
  document.getElementById("drawer-title").textContent = "目录";
  const body = document.getElementById("drawer-body");
  body.innerHTML = SITE_DATA.topicOrder.map(tid => {
    const t = SITE_DATA.topics[tid];
    return `<div class="toc-section-label">${esc(t.title)}</div>` +
      t.chapters.map(ch => {
        const current = state.view === "read" && state.topicId === tid && state.chapterId === ch.id;
        const done = state.readChapters.includes(`${tid}/${ch.id}`);
        return `<button type="button" class="toc-row ${current ? "current" : ""}" data-open-topic="${tid}" data-open-chapter="${ch.id}">
          <span class="t-main">${esc(ch.title)}</span>
          ${done ? `<span class="t-done">✓</span>` : ""}
        </button>`;
      }).join("");
  }).join("");
  overlay.hidden = false;
}

function openSavedDrawer() {
  const overlay = document.getElementById("drawer-overlay");
  const all = getAllPrinciples();
  const saved = all.filter(p => state.savedIds.includes(p.id));
  document.getElementById("drawer-title").textContent = saved.length ? `收藏 ${saved.length}` : "收藏";
  const body = document.getElementById("drawer-body");
  body.innerHTML = saved.length
    ? `<button type="button" class="copy-saved-btn" data-action="copy-saved">一键复制全部收藏</button>` +
      saved.map(p => `<div class="principle-item" style="margin-bottom:10px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--orange);margin-bottom:3px;">${esc(p.topicTitle)}</div>
          <div class="principle-text">${esc(p.text)}</div>
        </div>
        <button type="button" class="save-btn" aria-pressed="true" data-remove-save="${esc(p.id)}">移除</button>
      </div>`).join("")
    : `<p style="font-size:14px;color:var(--muted);padding:18px 0;">还没有收藏。在每节末尾点“收藏”即可保存。</p>`;
  overlay.hidden = false;
}

function openLightbox(src, cap, alt) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-img").alt = alt || "";
  document.getElementById("lightbox-cap").textContent = cap || "";
  document.getElementById("lightbox-overlay").hidden = false;
}

function navigateTo(topicId, chapterId, jumpAnchor) {
  const topic = SITE_DATA.topics[topicId];
  const ch = topic?.chapters?.find(c => c.id === chapterId) || topic?.chapters?.[0];
  if (!topic || !ch) return;
  state.view = "read";
  state.topicId = topic.id;
  state.chapterId = ch.id;
  state.activeJump = jumpAnchor || ch.jumpRail?.[0]?.id || "";
  state.lastVisited = { topicId: topic.id, chapterId: ch.id };
  document.getElementById("drawer-overlay").hidden = true;
  renderAll({ scrollTop: !jumpAnchor });
  if (jumpAnchor) {
    const el = document.getElementById(jumpAnchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) {
    if (e.target.id === "drawer-overlay") document.getElementById("drawer-overlay").hidden = true;
    if (e.target.id === "lightbox-overlay") document.getElementById("lightbox-overlay").hidden = true;
    return;
  }

  if (btn.id === "drawer-close") {
    document.getElementById("drawer-overlay").hidden = true;
    return;
  }
  if (btn.id === "lightbox-close") {
    document.getElementById("lightbox-overlay").hidden = true;
    return;
  }

  if (btn.dataset.action === "go-home") {
    state.view = "home";
    renderAll({ scrollTop: true });
    return;
  }
  if (btn.dataset.action === "toggle-font") {
    state.fontLarge = !state.fontLarge;
    renderAll();
    return;
  }
  if (btn.dataset.action === "open-toc") {
    openTocDrawer();
    return;
  }
  if (btn.dataset.action === "open-saved") {
    openSavedDrawer();
    return;
  }
  if (btn.dataset.action === "copy-saved") {
    const saved = getAllPrinciples().filter(p => state.savedIds.includes(p.id));
    const text = saved.map((p, i) => `${i + 1}. [${p.topicTitle} ${p.chapterNum}] ${p.text}`).join("\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast("已复制到剪贴板")).catch(() => showToast("复制失败，请手动选中"));
    } else {
      showToast("当前浏览器不支持自动复制");
    }
    return;
  }

  if (btn.dataset.openTopic) {
    navigateTo(btn.dataset.openTopic, btn.dataset.openChapter);
    return;
  }

  if (btn.dataset.sosId) {
    const s = (SITE_DATA.sosShortcuts || []).find(item => item.id === btn.dataset.sosId);
    if (!s) return;
    if (s.widgetUpdate) {
      const topic = SITE_DATA.topics[s.topicId];
      const ch = topic?.chapters?.find(c => c.id === s.chapterId);
      for (const blk of ch?.blocks || []) {
        if (blk.type === "scriptCompare" && s.widgetUpdate.scenario && blk.scenarios?.[s.widgetUpdate.scenario]) {
          state.widgetState[blk.widgetKey] = s.widgetUpdate.scenario;
          state.widgetState[`${blk.widgetKey}_mode`] = "good";
        }
        if (blk.type === "ageTabs" && s.widgetUpdate.ageTab) {
          state.widgetState[blk.widgetKey] = s.widgetUpdate.ageTab;
        }
      }
    }
    navigateTo(s.topicId, s.chapterId, s.jumpAnchor);
    return;
  }

  if (btn.dataset.routerId) {
    state.routerId = btn.dataset.routerId;
    renderAll();
    return;
  }

  if (btn.dataset.jump) {
    state.activeJump = btn.dataset.jump;
    document.querySelectorAll(".rail-pill").forEach(el => {
      el.classList.toggle("active", el.dataset.jump === btn.dataset.jump);
    });
    const target = document.getElementById(btn.dataset.jump);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (btn.dataset.widgetKey) {
    state.widgetState[btn.dataset.widgetKey] = btn.dataset.widgetVal;
    renderAll();
    return;
  }

  if (btn.dataset.mythKey) {
    const k = btn.dataset.mythKey;
    const prev = state.openMyths[k] !== undefined ? state.openMyths[k] : k.endsWith("_0");
    state.openMyths[k] = !prev;
    renderAll();
    return;
  }

  if (btn.dataset.checkId) {
    const id = btn.dataset.checkId;
    if (state.checkedIds.includes(id)) {
      state.checkedIds = state.checkedIds.filter(x => x !== id);
    } else {
      state.checkedIds = [...state.checkedIds, id];
    }
    renderAll();
    return;
  }

  if (btn.dataset.saveId) {
    const id = btn.dataset.saveId;
    if (state.savedIds.includes(id)) {
      state.savedIds = state.savedIds.filter(x => x !== id);
      showToast("已从共读夹移除");
    } else {
      state.savedIds = [...state.savedIds, id];
      showToast("已存进共读夹");
    }
    renderAll();
    return;
  }

  if (btn.dataset.removeSave) {
    state.savedIds = state.savedIds.filter(x => x !== btn.dataset.removeSave);
    openSavedDrawer();
    document.getElementById("topbar").innerHTML = renderTopBar(state);
    savePersisted(state);
    return;
  }

  if (btn.dataset.toggleRead) {
    const k = btn.dataset.toggleRead;
    if (state.readChapters.includes(k)) {
      state.readChapters = state.readChapters.filter(x => x !== k);
      showToast("已取消已读标记");
    } else {
      state.readChapters = [...state.readChapters, k];
      showToast("本节已标为读完 ✓");
    }
    renderAll();
    return;
  }

  if (btn.dataset.zoomSrc) {
    openLightbox(btn.dataset.zoomSrc, btn.dataset.zoomCap, btn.dataset.zoomAlt);
  }
});

window.addEventListener("hashchange", () => {
  parseHash();
  renderAll({ scrollTop: true });
});

window.addEventListener("scroll", updateScrollProgress, { passive: true });

parseHash();
renderAll();
