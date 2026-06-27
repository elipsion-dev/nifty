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

  const render = () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.hidden = true;
      categories.hidden = false;
      status.textContent = `${tools.length} tools, zero sign-ups`;
      return;
    }
    const matches = tools.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.categoryName}`.toLowerCase().includes(query)
    );
    if (matches.length) {
      results.innerHTML = `<div class="tool-grid">${matches.map((tool) => `
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
    results.hidden = false;
    categories.hidden = true;
    status.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"}`;
  };

  input?.addEventListener("input", render);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      event.preventDefault();
      input?.focus();
    }
  });
})();
