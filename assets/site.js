(() => {
  const menu = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
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
