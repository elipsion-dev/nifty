(() => {
  const menu = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
  });

  const dropdown = document.querySelector(".nav-dropdown");
  const dropButton = document.querySelector(".nav-drop-button");
  const setDropdown = (open) => {
    dropdown?.classList.toggle("open", open);
    dropButton?.setAttribute("aria-expanded", String(open));
  };
  dropButton?.addEventListener("click", () => setDropdown(!dropdown.classList.contains("open")));
  document.addEventListener("click", (event) => {
    if (dropdown?.classList.contains("open") && !dropdown.contains(event.target)) setDropdown(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dropdown?.classList.contains("open")) setDropdown(false);
  });

  const input = document.querySelector("#tool-search");
  const results = document.querySelector("#search-results");
  const categories = document.querySelector("#category-list");
  const status = document.querySelector("#search-status");
  const tools = window.PLAINTOOLS || [];

  const esc = (text) => String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const wrap = input?.closest(".search-wrap");
  let isOpen = false;
  const setOpen = (open) => {
    if (results) results.hidden = !open;
    input?.setAttribute("aria-expanded", String(open));
    // On the open transition only (never mid-typing), lift the search box up
    // near the top so the full results panel is visible without manual scroll.
    if (open && !isOpen && results && wrap) {
      requestAnimationFrame(() => {
        if (results.getBoundingClientRect().bottom > window.innerHeight - 8) {
          wrap.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    isOpen = open;
  };

  const render = () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      setOpen(false);
      if (status) status.textContent = `${tools.length} tools, zero sign-ups`;
      return;
    }
    const matches = tools.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.categoryName}`.toLowerCase().includes(query)
    );
    if (matches.length) {
      results.innerHTML = `<p class="search-count">${matches.length} match${matches.length === 1 ? "" : "es"} for “${esc(input.value.trim())}”</p><div class="tool-grid">${matches.map((tool) => `
        <a class="tool-card" href="${esc(tool.category)}/${esc(tool.slug)}.html">
          <span class="tool-arrow" aria-hidden="true">↗</span>
          <h3>${esc(tool.name)}</h3><p>${esc(tool.description)}</p>
        </a>`).join("")}</div>`;
    } else {
      results.innerHTML = `<div class="search-empty">
        <strong>No matches for “${esc(input.value.trim())}”.</strong>
        <p>Try a category like Finance, Spreadsheet, Documents, Homeowner, Business, Government, or Weirdly Useful.</p>
      </div>`;
    }
    setOpen(true);
    if (status) status.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"}`;
  };

  input?.addEventListener("input", render);
  input?.addEventListener("focus", () => { if (input.value.trim()) render(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && results && !results.hidden) { setOpen(false); return; }
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      event.preventDefault();
      input?.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!results || results.hidden) return;
    if (!results.contains(event.target) && event.target !== input) setOpen(false);
  });
})();

/* ---------- Recently used, command palette, PWA, web vitals ---------- */
(() => {
  "use strict";
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inField = () => {
    const a = document.activeElement;
    return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
  };

  /* --- Recently used tools (localStorage, no backend) --- */
  const RECENT_KEY = "nu_recent";
  const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (_) { return []; } };
  const writeRecent = (list) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))); } catch (_) {} };
  const toolRoot = document.getElementById("tool-root");
  if (toolRoot && toolRoot.dataset.tool) {
    const entry = { slug: toolRoot.dataset.tool, name: toolRoot.dataset.toolName || document.title, href: location.pathname };
    writeRecent([entry, ...readRecent().filter((t) => t.slug !== entry.slug)]);
  }
  const rail = document.getElementById("recent-tools");
  if (rail) {
    const list = readRecent().filter((t) => t.href !== location.pathname);
    if (list.length) {
      rail.innerHTML = `<h2>Recently used</h2><div class="recent-rail">${list
        .map((t) => `<a class="recent-chip" href="${esc(t.href)}">${esc(t.name)}</a>`).join("")}</div>`;
      rail.hidden = false;
    }
  }

  /* --- Command palette (Cmd/Ctrl+K) --- */
  let paletteEl, listEl, inputEl, items = [], selected = 0, toolCache = null;
  const loadTools = async () => {
    if (toolCache) return toolCache;
    if (Array.isArray(window.PLAINTOOLS)) return (toolCache = window.PLAINTOOLS);
    try {
      const res = await fetch("/tools.json");
      toolCache = (await res.json()).tools;
    } catch (_) { toolCache = []; }
    return toolCache;
  };
  const buildPalette = () => {
    paletteEl = document.createElement("div");
    paletteEl.className = "cmdk";
    paletteEl.hidden = true;
    paletteEl.setAttribute("role", "dialog");
    paletteEl.setAttribute("aria-modal", "true");
    paletteEl.setAttribute("aria-label", "Command palette");
    paletteEl.innerHTML = '<div class="cmdk-backdrop"></div><div class="cmdk-panel">' +
      '<input id="cmdk-input" type="text" autocomplete="off" placeholder="Jump to a tool…" aria-label="Search tools">' +
      '<ul id="cmdk-list" class="cmdk-list" role="listbox"></ul></div>';
    document.body.appendChild(paletteEl);
    inputEl = paletteEl.querySelector("#cmdk-input");
    listEl = paletteEl.querySelector("#cmdk-list");
    paletteEl.querySelector(".cmdk-backdrop").addEventListener("click", closePalette);
    inputEl.addEventListener("input", filterPalette);
    inputEl.addEventListener("keydown", paletteKeys);
  };
  const renderList = () => {
    listEl.innerHTML = items.map((t, i) =>
      `<li role="option" class="cmdk-item${i === selected ? " sel" : ""}" data-href="${esc(location.origin)}/${esc(t.category)}/${esc(t.slug)}.html">` +
      `<span class="cmdk-name">${esc(t.name)}</span><span class="cmdk-cat">${esc(t.categoryName)}</span></li>`).join("");
    [...listEl.children].forEach((li, i) => li.addEventListener("click", () => { selected = i; go(); }));
  };
  const filterPalette = async () => {
    const all = await loadTools();
    const q = inputEl.value.trim().toLowerCase();
    items = (q ? all.filter((t) => `${t.name} ${t.description} ${t.categoryName}`.toLowerCase().includes(q)) : all).slice(0, 8);
    selected = 0;
    renderList();
  };
  const go = () => { const li = listEl.children[selected]; if (li) location.href = li.dataset.href; };
  const paletteKeys = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(selected + 1, items.length - 1); renderList(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selected = Math.max(selected - 1, 0); renderList(); }
    else if (e.key === "Enter") { e.preventDefault(); go(); }
    else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
  };
  const openPalette = async () => {
    if (!paletteEl) buildPalette();
    paletteEl.hidden = false;
    inputEl.value = "";
    await filterPalette();
    inputEl.focus();
  };
  function closePalette() { if (paletteEl) paletteEl.hidden = true; }

  /* --- Keyboard shortcut help overlay (?) --- */
  let helpEl;
  const toggleHelp = () => {
    if (!helpEl) {
      helpEl = document.createElement("div");
      helpEl.className = "cmdk help-overlay";
      helpEl.hidden = true;
      helpEl.innerHTML = '<div class="cmdk-backdrop"></div><div class="cmdk-panel help-panel">' +
        "<h2>Keyboard shortcuts</h2><dl>" +
        "<dt>⌘ K <span>/</span> Ctrl K</dt><dd>Open the command palette</dd>" +
        "<dt>/</dt><dd>Focus the search box</dd>" +
        "<dt>?</dt><dd>Show this help</dd>" +
        "<dt>Esc</dt><dd>Close menus and dialogs</dd></dl></div>";
      document.body.appendChild(helpEl);
      helpEl.querySelector(".cmdk-backdrop").addEventListener("click", () => { helpEl.hidden = true; });
    }
    helpEl.hidden = !helpEl.hidden;
  };

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (paletteEl && !paletteEl.hidden) closePalette(); else openPalette();
    } else if (e.key === "?" && !inField()) {
      e.preventDefault();
      toggleHelp();
    }
  });

  /* --- PWA: register service worker + install prompt after 3rd session --- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
  try {
    if (!sessionStorage.getItem("nu_session")) {
      sessionStorage.setItem("nu_session", "1");
      const n = (parseInt(localStorage.getItem("nu_sessions") || "0", 10) || 0) + 1;
      localStorage.setItem("nu_sessions", String(n));
    }
  } catch (_) {}
  let deferredPrompt = null;
  const showInstall = () => {
    if (document.querySelector(".install-toast")) return;
    const toast = document.createElement("div");
    toast.className = "install-toast";
    toast.innerHTML = "<span>Install Nifty Utilities for one-tap access — works offline, no account.</span>" +
      '<button class="install-yes">Install</button><button class="install-no" aria-label="Dismiss">✕</button>';
    document.body.appendChild(toast);
    toast.querySelector(".install-yes").addEventListener("click", async () => {
      toast.remove();
      if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice.catch(() => {}); deferredPrompt = null; }
    });
    toast.querySelector(".install-no").addEventListener("click", () => {
      toast.remove();
      try { localStorage.setItem("nu_install_dismissed", "1"); } catch (_) {}
    });
  };
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    let sessions = 0, dismissed = false;
    try { sessions = parseInt(localStorage.getItem("nu_sessions") || "0", 10); } catch (_) {}
    try { dismissed = localStorage.getItem("nu_install_dismissed") === "1"; } catch (_) {}
    if (sessions >= 3 && !dismissed) showInstall();
  });

  /* --- Web Vitals (LCP/CLS/INP) reported to GA4, if analytics is present --- */
  const sendVital = (name, value) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "web_vitals", { metric_name: name, metric_value: Math.round(value), page_path: location.pathname });
    }
  };
  try {
    let lcp = 0, cls = 0, inp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; })
      .observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
      .observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) inp = Math.max(inp, e.duration); })
      .observe({ type: "event", buffered: true, durationThreshold: 40 });
    const report = () => {
      if (document.visibilityState !== "hidden") return;
      sendVital("LCP", lcp);
      sendVital("CLS", cls * 1000);
      sendVital("INP", inp);
      document.removeEventListener("visibilitychange", report);
    };
    document.addEventListener("visibilitychange", report);
  } catch (_) {}
})();
