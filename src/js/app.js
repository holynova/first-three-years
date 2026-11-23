/* Application State, Routing, Persistence & Interactions */

const STORAGE_KEY = "first_three_years_state_v1";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw && JSON.parse(raw)) || {};
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
  savedIds: Array.isArray(persisted.savedIds) ? persisted.savedIds : [],
  readChapters: Array.isArray(persisted.readChapters) ? persisted.readChapters : [],
  checkedIds: Array.isArray(persisted.checkedIds) ? persisted.checkedIds : [],
  lastVisited: persisted.lastVisited || null,
  routerId: (SITE_DATA.comboRouter && SITE_DATA.comboRouter[0]?.id) || "mess",
  widgetState: {},
  openMyths: {}
};

function parseHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw || raw === "/") {
    state.view = "home";
    return;
  }
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "topic" && SITE_DATA.topicOrder.includes(parts[1])) {
    const topic = SITE_DATA.topics[parts[1]];
    const ch = topic.chapters.find(c => c.id === parts[2]) || topic.chapters[0];
    state.view = "read";
    state.topicId = topic.id;
    state.chapterId = ch.id;
    state.lastVisited = { topicId: topic.id, chapterId: ch.id };
  } else {
    state.view = "home";
  }
}

const main = document.getElementById("main-canvas");
const topbar = document.getElementById("topbar");
const drawer = document.getElementById("drawer-overlay");
const drawerBody = document.getElementById("drawer-body");
const lightbox = document.getElementById("lightbox-overlay");

function currentChapter() {
  return SITE_DATA.topics[state.topicId].chapters.find(ch => ch.id === state.chapterId);
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
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
  fill.style.transform = `scaleX(${ratio})`;
}

function renderAll(scrollTop = false) {
  if (drawer.open) drawer.close();
  if (lightbox.open) lightbox.close();
  main.className = state.view === "read" ? "layout-frame is-reading" : "layout-frame is-home";
  topbar.innerHTML = renderTopBar(state);
  main.innerHTML = state.view === "read" ? renderReading(state) : renderHome(state);
  document.title = state.view === "read"
    ? `${currentChapter().title} · 头三年` : "头三年 · 0–3 岁育儿白纸手记";
  savePersisted(state);
  if (scrollTop) {
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  updateScrollProgress();
}

function showDrawer(title, html) {
  document.getElementById("drawer-title").textContent = title;
  drawerBody.innerHTML = html;
  if (!drawer.open) drawer.showModal();
  drawer.scrollTop = 0;
}

function openTocDrawer() {
  const jumps = state.view === "read" ? `<h3 class="toc-section-label">本章速查</h3>${currentChapter().jumpRail
    .map(j => `<button type="button" class="toc-jump" data-jump="${esc(j.id)}">${esc(j.label)}</button>`).join("")}` : "";
  const contents = SITE_DATA.topicOrder.map(tid => {
    const t = SITE_DATA.topics[tid];
    return `<h3 class="toc-section-label">${esc(t.title)}</h3>` +
      t.chapters.map(ch => {
        const current = state.view === "read" && state.topicId === tid && state.chapterId === ch.id;
        const done = state.readChapters.includes(`${tid}/${ch.id}`);
        return `<button type="button" class="toc-row ${current ? "current" : ""}" ${current ? 'aria-current="page"' : ""}
          data-open-topic="${tid}" data-open-chapter="${ch.id}">
          <span>${esc(ch.title)}</span>${done ? '<span class="t-done">已读</span>' : ""}</button>`;
      }).join("");
  }).join("");
  showDrawer("目录", jumps + contents);
}

function openSavedDrawer() {
  const saved = getAllPrinciples().filter(p => state.savedIds.includes(p.id));
  const items = saved.map(p => `<div class="principle-item"><div>
      <div class="saved-topic">${esc(p.topicTitle)} · 第 ${Number(p.chapterNum)} 章</div>
      <div class="principle-text">${esc(p.text)}</div>
    </div><button type="button" class="save-btn" data-remove-save="${esc(p.id)}">移除</button></div>`).join("");
  showDrawer("收藏", saved.length
    ? '<button type="button" class="copy-saved-btn" data-action="copy-saved">复制全部收藏</button>' + items
    : '<p>还没有收藏。每章末尾的「收藏」可以把想再读的句子留在这里。</p>');
}

function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.tabIndex = -1;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "start" });
}

function navigateTo(topicId, chapterId, jumpAnchor) {
  const target = `#/topic/${topicId}/${chapterId}`;
  if (location.hash !== target) history.pushState(null, "", target);
  parseHash();
  renderAll(true);
  if (jumpAnchor) jumpTo(jumpAnchor);
}

function refreshWidget(button) {
  const box = button.closest(".widget-box");
  const block = currentChapter().blocks.find(b => b.id === box.id);
  const buttons = [...box.querySelectorAll("button")];
  const index = buttons.indexOf(button);
  box.outerHTML = renderBlock(block, state);
  document.getElementById(block.id).querySelectorAll("button")[index]?.focus({ preventScroll: true });
  updateScrollProgress();
}

function syncSavedCount() {
  const button = topbar.querySelector('[data-action="open-saved"]');
  button.textContent = state.savedIds.length ? `收藏 ${state.savedIds.length}` : "收藏";
  for (const save of main.querySelectorAll("[data-save-id]")) {
    const saved = state.savedIds.includes(save.dataset.saveId);
    save.setAttribute("aria-pressed", saved);
    save.textContent = saved ? "已收藏" : "收藏";
  }
  savePersisted(state);
}

document.addEventListener("click", e => {
  if (e.target.closest(".skip-link")) {
    e.preventDefault();
    main.focus();
    return;
  }
  const btn = e.target.closest("button");
  if (!btn) {
    if (e.target.matches("dialog")) {
      const rect = e.target.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) e.target.close();
    }
    return;
  }

  if (btn.id === "drawer-close" || btn.id === "lightbox-close") {
    btn.closest("dialog").close();
    return;
  }
  if (btn.dataset.action === "toggle-font") {
    const article = main.querySelector("article");
    const anchor = [...article.querySelectorAll("p, h2, figure, .widget-box")].find(el => el.getBoundingClientRect().top >= topbar.offsetHeight);
    const previousTop = anchor?.getBoundingClientRect().top;
    state.fontLarge = !state.fontLarge;
    article.classList.toggle("is-large", state.fontLarge);
    btn.setAttribute("aria-pressed", state.fontLarge);
    if (anchor && window.scrollY > 0) window.scrollBy(0, anchor.getBoundingClientRect().top - previousTop);
    savePersisted(state);
    updateScrollProgress();
    return;
  }
  if (btn.dataset.action === "find-scenes") {
    jumpTo("scenes-heading");
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
    const router = document.getElementById("home-router");
    router.innerHTML = renderRouter(state);
    router.querySelector('[aria-pressed="true"]').focus({ preventScroll: true });
    return;
  }

  if (btn.dataset.jump) {
    drawer.close();
    jumpTo(btn.dataset.jump);
    return;
  }

  if (btn.dataset.widgetKey) {
    state.widgetState[btn.dataset.widgetKey] = btn.dataset.widgetVal;
    refreshWidget(btn);
    return;
  }

  if (btn.dataset.mythKey) {
    const k = btn.dataset.mythKey;
    const prev = state.openMyths[k] !== undefined ? state.openMyths[k] : k.endsWith("_0");
    state.openMyths[k] = !prev;
    refreshWidget(btn);
    return;
  }

  if (btn.dataset.checkId) {
    const id = btn.dataset.checkId;
    if (state.checkedIds.includes(id)) {
      state.checkedIds = state.checkedIds.filter(x => x !== id);
    } else {
      state.checkedIds = [...state.checkedIds, id];
    }
    refreshWidget(btn);
    savePersisted(state);
    return;
  }

  if (btn.dataset.saveId) {
    const id = btn.dataset.saveId;
    if (state.savedIds.includes(id)) {
      state.savedIds = state.savedIds.filter(x => x !== id);
      showToast("已移除收藏");
    } else {
      state.savedIds = [...state.savedIds, id];
      showToast("已加入收藏");
    }
    syncSavedCount();
    return;
  }

  if (btn.dataset.removeSave) {
    state.savedIds = state.savedIds.filter(x => x !== btn.dataset.removeSave);
    openSavedDrawer();
    syncSavedCount();
    (drawerBody.querySelector("[data-remove-save]") || document.getElementById("drawer-close")).focus();
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
    const done = state.readChapters.includes(k);
    btn.classList.toggle("is-done", done);
    btn.setAttribute("aria-pressed", done);
    btn.textContent = done ? "已读" : "标为已读";
    savePersisted(state);
    return;
  }

  if (btn.dataset.zoomSrc) {
    const img = document.getElementById("lightbox-img");
    img.src = btn.dataset.zoomSrc;
    img.alt = btn.dataset.zoomAlt || "";
    document.getElementById("lightbox-cap").textContent = btn.dataset.zoomCap;
    lightbox.showModal();
  }
});

document.addEventListener("keydown", e => {
  const activeTab = e.target.closest('[role="tab"]');
  if (!activeTab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  const tabs = [...activeTab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
  let index = tabs.indexOf(activeTab);
  if (e.key === "Home") index = 0;
  if (e.key === "End") index = tabs.length - 1;
  if (e.key === "ArrowLeft") index = (index - 1 + tabs.length) % tabs.length;
  if (e.key === "ArrowRight") index = (index + 1) % tabs.length;
  e.preventDefault();
  tabs[index].click();
});

window.addEventListener("hashchange", () => {
  parseHash();
  renderAll(true);
});

window.addEventListener("scroll", updateScrollProgress, { passive: true });

parseHash();
renderAll();
