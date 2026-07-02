(() => {
  "use strict";
  const root = document.getElementById("tool-root");
  if (!root) return;
  const slug = root.dataset.tool;
  root.innerHTML = '<div class="loading-state">Loading…</div>';
  // Feature modules attach here as they are built.
  if (slug === "iq-test") {/* iq */}
  else if (slug === "personality-type-test") {/* personality */}
  else if (slug === "zodiac-compatibility") {/* zodiac */}
  else root.innerHTML = '<p class="error">This tool could not be loaded.</p>';
})();
