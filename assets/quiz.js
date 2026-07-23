/*
 * quiz.js — interactive apps for the "Quizzes & You" category.
 * Three self-contained modules mount into #tool-root based on data-tool:
 *   iq-test, personality-type-test, zodiac-compatibility.
 * Everything runs in the browser. Nothing is sent anywhere or stored on a server.
 * All test items, personality types, and compatibility text are original to this
 * site — no copyrighted instruments are reproduced.
 */
(() => {
  "use strict";
  const root = document.getElementById("tool-root");
  if (!root) return;
  const slug = root.dataset.tool;

  /* ---------- shared helpers ---------- */
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Standard-normal CDF (Abramowitz & Stegun 7.1.26) for percentile estimates.
  const normCdf = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };
  const pct = (n) => `${Math.round(n)}%`;

  /* ---------- social share bar (used by every results screen) ----------
   * shareBar() returns the HTML; call wireShare(text) AFTER the results
   * innerHTML is set. Instagram has no web share URL, so the "More" button
   * uses the native share sheet (navigator.share) where Instagram, Messenger,
   * SMS, etc. appear on mobile. */
  const SHARE_ICONS = {
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>'
  };
  const shareBar = () => `
    <div class="share-bar">
      <span class="share-label">Share your result</span>
      <div class="share-btns">
        <button type="button" class="share-btn share-x" data-share="x" aria-label="Share on X (Twitter)">${SHARE_ICONS.x}</button>
        <button type="button" class="share-btn share-fb" data-share="facebook" aria-label="Share on Facebook">${SHARE_ICONS.facebook}</button>
        <button type="button" class="share-btn share-wa" data-share="whatsapp" aria-label="Share on WhatsApp">${SHARE_ICONS.whatsapp}</button>
        <button type="button" class="share-btn share-more" data-share="native" aria-label="More sharing options (Instagram, Messages…)">${SHARE_ICONS.more}<span>More</span></button>
        <button type="button" class="share-btn share-copy" data-share="copy" aria-label="Copy result to clipboard">${SHARE_ICONS.copy}<span>Copy</span></button>
      </div>
    </div>`;
  function wireShare(text) {
    const bar = root.querySelector(".share-bar");
    if (!bar) return;
    // Shareable result permalink: encode the result text into the URL hash so
    // the link itself carries the result. Opening it shows a "shared result"
    // banner (see showSharedResult) above the quiz.
    const url = location.origin + location.pathname + "#r=" + encodeURIComponent(text);
    const full = `${text} ${url}`;
    const enc = encodeURIComponent;
    const open = (u) => window.open(u, "_blank", "noopener,noreferrer,width=680,height=560");
    const nativeBtn = bar.querySelector('[data-share="native"]');
    if (nativeBtn && typeof navigator.share !== "function") nativeBtn.remove();
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-share]");
      if (!btn) return;
      const kind = btn.dataset.share;
      if (kind === "x") open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`);
      else if (kind === "facebook") open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}`);
      else if (kind === "whatsapp") open(`https://wa.me/?text=${enc(full)}`);
      else if (kind === "native") navigator.share({ text, url }).catch(() => {});
      else if (kind === "copy") {
        const done = () => {
          const label = btn.querySelector("span");
          if (label) { label.textContent = "Copied!"; setTimeout(() => { label.textContent = "Copy"; }, 1600); }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(full).then(done, () => legacyCopy(full, done));
        } else legacyCopy(full, done);
      }
    });
  }
  function legacyCopy(value, done) {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (_) { /* clipboard unavailable */ }
    ta.remove();
  }

  // If the page was opened from a shared result permalink (#r=<encoded result>),
  // show a banner above the tool with that result. Decoded text goes in via
  // textContent (never innerHTML), so a crafted link can't inject markup.
  function showSharedResult() {
    const match = location.hash.match(/(?:^#|&)r=([^&]+)/);
    if (!match) return;
    let text;
    try { text = decodeURIComponent(match[1]); } catch (_) { return; }
    if (!text.trim()) return;
    const banner = document.createElement("div");
    banner.className = "shared-result";
    const label = document.createElement("strong");
    label.textContent = "A shared result";
    const body = document.createElement("p");
    body.textContent = text;
    const cta = document.createElement("p");
    cta.className = "shared-result-cta";
    cta.textContent = "Curious how you compare? Take the test below to see your own result.";
    banner.append(label, body, cta);
    root.parentNode.insertBefore(banner, root);
  }
  showSharedResult();

  if (slug === "iq-test") renderIqTest();
  else if (slug === "personality-type-test") renderPersonalityTest();
  else if (slug === "zodiac-compatibility") renderZodiac();
  else if (slug === "typing-speed-test") renderTypingTest();
  else if (slug === "reaction-time-test") renderReactionTest();
  else if (slug === "click-speed-test") renderClickSpeedTest();
  else if (slug === "memory-test") renderMemoryTest();
  else if (slug === "color-blindness-test") renderColorBlindnessTest();
  else if (slug === "love-calculator") renderLoveCalculator();
  else root.innerHTML = '<p class="error">This tool could not be loaded.</p>';

  /* =====================================================================
   *  IQ TEST
   * ===================================================================== */
  function renderIqTest() {
    /* ---- original SVG builders for figural items ---- */
    const SVG = (inner, vb = "0 0 90 90") =>
      `<svg viewBox="${vb}" class="q-svg" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
    const oneShape = (kind, cx, cy, r, fill) => {
      const f = fill ? 'fill="currentColor"' : 'fill="none"';
      if (kind === "circle") return `<circle cx="${cx}" cy="${cy}" r="${r}" ${f}/>`;
      if (kind === "square") return `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" ${f}/>`;
      if (kind === "triangle") return `<polygon points="${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}" ${f}/>`;
      if (kind === "diamond") return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" ${f}/>`;
      return "";
    };
    // n copies of a shape spread across a cell.
    const shapesCell = ({ kind, n = 1, fill = false }) => {
      const r = 9;
      const positions = n === 1 ? [45] : n === 2 ? [31, 59] : [24, 45, 66];
      return SVG(positions.map((x) => oneShape(kind, x, 45, r, fill)).join(""));
    };
    // an arrow rotated `rot` degrees about the cell centre.
    const arrowCell = (rot) =>
      SVG(`<g transform="rotate(${rot} 45 45)"><path d="M45 20v50M45 20l-11 12M45 20l11 12"/></g>`);
    // asymmetric glyph (a flag / boot) for mental-rotation items.
    const glyphPath = "M32 20v50h6V46l22 10V26L38 36V20z";
    const glyph = (transform) =>
      SVG(`<g transform="${transform}"><path d="${glyphPath}" fill="currentColor" stroke="currentColor" stroke-width="2"/></g>`);
    // cell built from line segments (for XOR-rule matrices):
    // h = horizontal, v = vertical, d = diagonal TL-BR, u = diagonal BL-TR.
    const SEG_PATHS = { h: "M20 45h50", v: "M45 20v50", d: "M24 24l42 42", u: "M24 66l42-42" };
    const segCell = (segs) => SVG(segs.map((s) => `<path d="${SEG_PATHS[s]}"/>`).join(""));

    /* ---- item bank (all original) ---- */
    // Each item: { cat, b, prompt, promptSvg?, options:[{t?/svg?}], correct } where
    // correct is the index into options BEFORE shuffle.
    // `b` is the item's difficulty in logits on an adult-population scale
    // (θ ~ N(0,1)): b = ability level at which ~62% answer correctly under the
    // 3PL model used in results(). Values are calibrated estimates informed by
    // published pass-rate patterns for each item family (simple visible-rule
    // series ≈ 85-90% adult pass rate → b ≈ -1.8; interleaved/second-order
    // series ≈ 45-60% → b ≈ 0-0.7; belief-bias syllogisms ≈ 35-55% → b ≈ 0.7-1.6;
    // two-rule and distribution matrices ≈ 25-40% → b ≈ 1.5-2.5).
    const txt = (t) => ({ t });
    const items = [
      /* ---------- Numerical (11) ---------- */
      { cat: "Numerical", b: -1.8, prompt: "What number continues the series?  2, 4, 8, 16, __", options: [txt("24"), txt("32"), txt("20"), txt("64")], correct: 1 },
      { cat: "Numerical", b: -1.4, prompt: "What number continues the series?  81, 27, 9, 3, __", options: [txt("0"), txt("1"), txt("2"), txt("3")], correct: 1 },
      { cat: "Numerical", b: -0.9, prompt: "What number continues the series?  1, 1, 2, 3, 5, 8, __", options: [txt("11"), txt("13"), txt("10"), txt("15")], correct: 1 },
      { cat: "Numerical", b: -0.4, prompt: "Which number does NOT belong with the others?", options: [txt("2"), txt("3"), txt("9"), txt("11")], correct: 2 },
      { cat: "Numerical", b: 0.1, prompt: "What number continues the series?  3, 5, 8, 10, 13, 15, __", options: [txt("18"), txt("17"), txt("20"), txt("16")], correct: 0 },
      { cat: "Numerical", b: 0.4, prompt: "What number continues the series?  7, 14, 12, 24, 22, __", options: [txt("44"), txt("20"), txt("11"), txt("33")], correct: 0 },
      { cat: "Numerical", b: 0.6, prompt: "Which number does NOT belong with the others?", options: [txt("16"), txt("27"), txt("36"), txt("49")], correct: 1 },
      { cat: "Numerical", b: 0.7, prompt: "What number continues the series?  2, 3, 6, 11, 18, 27, __", options: [txt("36"), txt("38"), txt("40"), txt("34")], correct: 1 },
      { cat: "Numerical", b: 1.2, prompt: "What number continues the series?  3, 4, 7, 11, 18, 29, __", options: [txt("40"), txt("47"), txt("43"), txt("52")], correct: 1 },
      { cat: "Numerical", b: 1.5, prompt: "What number continues the series?  2, 3, 5, 9, 17, 33, __", options: [txt("49"), txt("57"), txt("65"), txt("66")], correct: 2 },
      { cat: "Numerical", b: 2.5, prompt: "What number continues the series?  4, 9, 25, 49, 121, __", options: [txt("144"), txt("169"), txt("143"), txt("225")], correct: 1 },
      /* ---------- Verbal (11) ---------- */
      { cat: "Verbal", b: -2.0, prompt: "Hand is to glove as foot is to __", options: [txt("sock"), txt("shoe leather"), txt("toe"), txt("ankle")], correct: 0 },
      { cat: "Verbal", b: -1.6, prompt: "Water is to thirst as food is to __", options: [txt("plate"), txt("cook"), txt("hunger"), txt("taste")], correct: 2 },
      { cat: "Verbal", b: -1.2, prompt: "Whisper is to shout as dim is to __", options: [txt("dark"), txt("faint"), txt("bright"), txt("quiet")], correct: 2 },
      { cat: "Verbal", b: -0.9, prompt: "Petal is to flower as page is to __", options: [txt("word"), txt("book"), txt("cover"), txt("ink")], correct: 1 },
      { cat: "Verbal", b: -0.7, prompt: "Which word does NOT belong with the others?", options: [txt("rose"), txt("tulip"), txt("oak"), txt("daisy")], correct: 2 },
      { cat: "Verbal", b: -0.4, prompt: "Island is to water as oasis is to __", options: [txt("sand"), txt("desert"), txt("palm"), txt("camel")], correct: 1 },
      { cat: "Verbal", b: 0.5, prompt: "Which instrument does NOT belong with the others?", options: [txt("trumpet"), txt("trombone"), txt("oboe"), txt("tuba")], correct: 2 },
      { cat: "Verbal", b: 0.8, prompt: "Ornithology is to birds as entomology is to __", options: [txt("fossils"), txt("insects"), txt("languages"), txt("weather")], correct: 1 },
      { cat: "Verbal", b: 1.3, prompt: "Ephemeral is to permanent as scarce is to __", options: [txt("rare"), txt("valuable"), txt("abundant"), txt("empty")], correct: 2 },
      { cat: "Verbal", b: 1.7, prompt: "Mitigate is to aggravate as bolster is to __", options: [txt("support"), txt("undermine"), txt("repair"), txt("strengthen")], correct: 1 },
      { cat: "Verbal", b: 2.0, prompt: "Candid is to evasive as gregarious is to __", options: [txt("friendly"), txt("talkative"), txt("hostile"), txt("solitary")], correct: 3 },
      /* ---------- Logical (9) ---------- */
      { cat: "Logical", b: -1.4, prompt: "Tom is taller than Sam. Sam is taller than Bo. Who is shortest?", options: [txt("Tom"), txt("Sam"), txt("Bo"), txt("Cannot tell")], correct: 2 },
      { cat: "Logical", b: -1.0, prompt: "Town A is north of B. C is south of B. Which town is furthest north?", options: [txt("A"), txt("B"), txt("C"), txt("They are level")], correct: 0 },
      { cat: "Logical", b: -0.2, prompt: "All roses are flowers. Some flowers fade quickly. Does it follow that all roses fade quickly?", options: [txt("Yes, it must"), txt("No, it does not follow"), txt("Only red roses"), txt("Cannot tell at all")], correct: 1 },
      { cat: "Logical", b: 0.0, prompt: "If it rains, the ground gets wet. The ground is wet. Did it necessarily rain?", options: [txt("Yes, definitely"), txt("No, something else could have wet it"), txt("Only if it is cloudy"), txt("It never rained")], correct: 1 },
      { cat: "Logical", b: 0.3, prompt: "Every day it is sunny, Mia walks. Today Mia did not walk. What can you conclude?", options: [txt("It was sunny"), txt("It was not sunny"), txt("Mia was ill"), txt("Nothing at all")], correct: 1 },
      { cat: "Logical", b: 0.7, prompt: "All bloops are razzies. No razzies are loppies. Does it follow that no bloops are loppies?", options: [txt("Yes — it must follow"), txt("No — it does not follow"), txt("Only some bloops"), txt("Cannot tell at all")], correct: 0 },
      { cat: "Logical", b: 1.2, prompt: "No pilots are careless. Some students are careless. Therefore some students are not pilots.", options: [txt("Valid — it follows"), txt("Invalid — it does not follow"), txt("True only for careful students"), txt("Cannot tell at all")], correct: 0 },
      { cat: "Logical", b: 1.5, prompt: "Five runners finish a race. Anna finishes ahead of Ben but behind Carla. Dan finishes ahead of Anna but behind Carla. Erin finishes last. Who comes third?", options: [txt("Anna"), txt("Ben"), txt("Dan"), txt("Cannot tell")], correct: 0 },
      { cat: "Logical", b: 2.3, prompt: "A coin is in box A, B, or C. Exactly ONE of these statements is true: (1) “The coin is in box A.” (2) “The coin is not in box B.” Where is the coin?", options: [txt("Box A"), txt("Box B"), txt("Box C"), txt("Cannot be determined")], correct: 2 },
      /* ---------- Spatial (9) ---------- */
      // Count progression matrix
      {
        cat: "Spatial", b: -1.1, prompt: "Complete the pattern. Which figure belongs in the empty cell?",
        matrix: [
          shapesCell({ kind: "circle", n: 1 }), shapesCell({ kind: "circle", n: 2 }), shapesCell({ kind: "circle", n: 3 }),
          shapesCell({ kind: "square", n: 1 }), shapesCell({ kind: "square", n: 2 }), shapesCell({ kind: "square", n: 3 }),
          shapesCell({ kind: "triangle", n: 1 }), shapesCell({ kind: "triangle", n: 2 }), null
        ],
        options: [
          { svg: shapesCell({ kind: "triangle", n: 3 }) },
          { svg: shapesCell({ kind: "triangle", n: 2 }) },
          { svg: shapesCell({ kind: "square", n: 3 }) },
          { svg: shapesCell({ kind: "circle", n: 3 }) }
        ], correct: 0
      },
      // Fill alternation matrix (columns: circle/square/triangle; rows toggle fill)
      {
        cat: "Spatial", b: -0.6, prompt: "Complete the pattern. Which figure belongs in the empty cell?",
        matrix: [
          shapesCell({ kind: "circle", fill: false }), shapesCell({ kind: "square", fill: false }), shapesCell({ kind: "triangle", fill: false }),
          shapesCell({ kind: "circle", fill: true }), shapesCell({ kind: "square", fill: true }), shapesCell({ kind: "triangle", fill: true }),
          shapesCell({ kind: "circle", fill: false }), shapesCell({ kind: "square", fill: false }), null
        ],
        options: [
          { svg: shapesCell({ kind: "triangle", fill: false }) },
          { svg: shapesCell({ kind: "triangle", fill: true }) },
          { svg: shapesCell({ kind: "circle", fill: false }) },
          { svg: shapesCell({ kind: "square", fill: false }) }
        ], correct: 0
      },
      // Rotation matrix (each column +45°, each row +45°)
      {
        cat: "Spatial", b: 0.2, prompt: "Complete the pattern. Which figure belongs in the empty cell?",
        matrix: [
          arrowCell(0), arrowCell(45), arrowCell(90),
          arrowCell(45), arrowCell(90), arrowCell(135),
          arrowCell(90), arrowCell(135), null
        ],
        options: [
          { svg: arrowCell(180) }, { svg: arrowCell(135) }, { svg: arrowCell(90) }, { svg: arrowCell(0) }
        ], correct: 0
      },
      // Mental rotation — which option is the SAME glyph rotated (not mirrored)?
      {
        cat: "Spatial", b: 0.5, prompt: "The figure on the left is shown first. Which option is the SAME figure simply rotated (not flipped/mirrored)?",
        promptSvg: glyph("rotate(0 45 45)"),
        options: [
          { svg: glyph("rotate(90 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(90 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(180 45 45)") }
        ], correct: 0
      },
      {
        cat: "Spatial", b: 0.9, prompt: "Which option is the SAME figure simply rotated (not flipped/mirrored)?",
        promptSvg: glyph("rotate(0 45 45)"),
        options: [
          { svg: glyph("matrix(-1,0,0,1,90,0)") },
          { svg: glyph("rotate(180 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(90 45 45)") },
          { svg: glyph("matrix(1,0,0,-1,0,90)") }
        ], correct: 1
      },
      // Two simultaneous rules: shape fixed per row, count grows per column,
      // fill alternates on a checkerboard.
      {
        cat: "Spatial", b: 1.1, prompt: "Complete the pattern. Which figure belongs in the empty cell? (Two rules operate at once.)",
        matrix: [
          shapesCell({ kind: "circle", n: 1, fill: false }), shapesCell({ kind: "circle", n: 2, fill: true }), shapesCell({ kind: "circle", n: 3, fill: false }),
          shapesCell({ kind: "square", n: 1, fill: true }), shapesCell({ kind: "square", n: 2, fill: false }), shapesCell({ kind: "square", n: 3, fill: true }),
          shapesCell({ kind: "triangle", n: 1, fill: false }), shapesCell({ kind: "triangle", n: 2, fill: true }), null
        ],
        options: [
          { svg: shapesCell({ kind: "triangle", n: 3, fill: false }) },
          { svg: shapesCell({ kind: "triangle", n: 3, fill: true }) },
          { svg: shapesCell({ kind: "triangle", n: 2, fill: false }) },
          { svg: shapesCell({ kind: "square", n: 3, fill: false }) }
        ], correct: 0
      },
      // XOR rule: third column shows the segments that appear in exactly ONE
      // of the first two cells of the row.
      {
        cat: "Spatial", b: 1.5, prompt: "In each row, the third cell keeps only the lines that appear in exactly ONE of the first two cells. Which figure completes the last row?",
        matrix: [
          segCell(["h"]), segCell(["v"]), segCell(["h", "v"]),
          segCell(["h", "v"]), segCell(["v", "d"]), segCell(["h", "d"]),
          segCell(["d", "u"]), segCell(["u", "v"]), null
        ],
        options: [
          { svg: segCell(["d", "v"]) },
          { svg: segCell(["d", "u", "v"]) },
          { svg: segCell(["u"]) },
          { svg: segCell(["h", "v"]) }
        ], correct: 0
      },
      // Distribution of three: every row and column contains each shape once
      // AND each count once (double Latin square).
      {
        cat: "Spatial", b: 1.9, prompt: "Complete the pattern. Every row and every column follows the same two rules. Which figure belongs in the empty cell?",
        matrix: [
          shapesCell({ kind: "circle", n: 1 }), shapesCell({ kind: "square", n: 2 }), shapesCell({ kind: "triangle", n: 3 }),
          shapesCell({ kind: "triangle", n: 2 }), shapesCell({ kind: "circle", n: 3 }), shapesCell({ kind: "square", n: 1 }),
          shapesCell({ kind: "square", n: 3 }), shapesCell({ kind: "triangle", n: 1 }), null
        ],
        options: [
          { svg: shapesCell({ kind: "circle", n: 2 }) },
          { svg: shapesCell({ kind: "circle", n: 3 }) },
          { svg: shapesCell({ kind: "triangle", n: 2 }) },
          { svg: shapesCell({ kind: "square", n: 2 }) }
        ], correct: 0
      },
      // Hard mental rotation: odd angles, all distractors mirrored.
      {
        cat: "Spatial", b: 2.4, prompt: "Which option is the SAME figure simply rotated (not flipped/mirrored)?",
        promptSvg: glyph("rotate(0 45 45)"),
        options: [
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(45 45 45)") },
          { svg: glyph("rotate(135 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(225 45 45)") },
          { svg: glyph("matrix(1,0,0,-1,0,90) rotate(45 45 45)") }
        ], correct: 1
      }
    ];

    const TOTAL = items.length;
    const TIME_LIMIT = 30 * 60; // seconds, soft cap; auto-submits at 0.

    // Present items easiest-first (standard practice on ability tests) but
    // shuffle within each difficulty tier so retakes still vary. Options are
    // always shuffled.
    const tierOf = (b) => (b < -0.5 ? 0 : b < 0.5 ? 1 : b < 1.5 ? 2 : 3);
    const ordered = [0, 1, 2, 3].flatMap((t) => shuffle(items.filter((it) => tierOf(it.b) === t)));
    const run = ordered.map((item) => {
      const order = shuffle(item.options.map((_, i) => i));
      return {
        item,
        options: order.map((i) => item.options[i]),
        correctIndex: order.indexOf(item.correct)
      };
    });
    const answers = new Array(TOTAL).fill(null);
    let current = 0;
    let remaining = TIME_LIMIT;
    let timerId = null;

    const catLabels = { Numerical: "Number & series", Verbal: "Verbal reasoning", Logical: "Logical reasoning", Spatial: "Pattern & spatial" };

    /* ---- screens ---- */
    function intro() {
      stopTimer();
      root.innerHTML = `
        <div class="quiz quiz-intro">
          <div class="quiz-badges">
            <span class="quiz-badge time">⏱ Estimated time: 25–30 minutes</span>
            <span class="quiz-badge">${TOTAL} questions</span>
            <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
          </div>
          <h2>A free reasoning (IQ-style) test</h2>
          <p class="quiz-lede"><strong>Completely FREE IQ Test. No signup, no email, no credit card. Instant results, no catch.</strong></p>
          <p>This test estimates fluid reasoning the way established cognitive assessments do — through <strong>original</strong> puzzles across four proven item families used in real intelligence research. Questions start easy and ramp up to genuinely hard; your score is estimated from <em>which</em> difficulty levels you can solve, not just how many you get right. No question here is copied from any published test.</p>
          <ul class="quiz-facts">
            <li><span>🔢</span><div><strong>Number &amp; series</strong> — spot the numerical rule and continue the pattern.</div></li>
            <li><span>🔤</span><div><strong>Verbal reasoning</strong> — analogies and odd-one-out relationships.</div></li>
            <li><span>🧩</span><div><strong>Logical reasoning</strong> — short deductions and valid-or-not judgments.</div></li>
            <li><span>◑</span><div><strong>Pattern &amp; spatial</strong> — matrix completion and mental rotation.</div></li>
          </ul>
          <div class="quiz-note">
            <strong>How to get an accurate result</strong>
            <p>Work somewhere quiet and answer without help or a calculator. There is a gentle 30-minute timer, and every question is multiple-choice with one best answer. Later questions are meant to be hard — most people miss several, and guessing is better than leaving blanks. Your result is an <em>unnormed self-assessment estimate</em> — a useful practice indicator, not a clinical IQ score.</p>
          </div>
          <div class="actions"><button class="button primary" id="start">Start the test →</button></div>
        </div>`;
      root.querySelector("#start").onclick = () => { startTimer(); current = 0; question(); };
    }

    function startTimer() {
      remaining = TIME_LIMIT;
      timerId = window.setInterval(() => {
        remaining -= 1;
        const t = document.getElementById("quiz-timer");
        if (t) {
          t.textContent = clock(remaining);
          if (remaining <= 60) t.classList.add("low");
        }
        if (remaining <= 0) { stopTimer(); results(true); }
      }, 1000);
    }
    function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
    const clock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

    function question() {
      const q = run[current];
      const it = q.item;
      const answered = run.filter((_, i) => answers[i] !== null).length;
      let stimulus = "";
      if (it.matrix) {
        stimulus = `<div class="q-matrix">${it.matrix.map((c) =>
          `<div class="q-matrix-cell${c === null ? " q-missing" : ""}">${c === null ? "?" : c}</div>`).join("")}</div>`;
      } else if (it.promptSvg) {
        stimulus = `<div class="q-stimulus">${it.promptSvg}</div>`;
      }
      const isFigural = q.options.some((o) => o.svg);
      const opts = q.options.map((o, i) => `
        <button type="button" class="q-option${answers[current] === i ? " selected" : ""}${isFigural ? " figural" : ""}" data-i="${i}">
          <span class="q-key">${String.fromCharCode(65 + i)}</span>
          <span class="q-val">${o.svg ? o.svg : esc(o.t)}</span>
        </button>`).join("");
      root.innerHTML = `
        <div class="quiz quiz-question">
          <div class="quiz-topbar">
            <span class="quiz-cat">${esc(catLabels[it.cat] || it.cat)}</span>
            <span class="quiz-timer-wrap">⏱ <span id="quiz-timer"${remaining <= 60 ? ' class="low"' : ""}>${clock(remaining)}</span></span>
          </div>
          <div class="quiz-progress"><span style="width:${((current) / TOTAL) * 100}%"></span></div>
          <p class="quiz-count">Question ${current + 1} of ${TOTAL} · ${answered} answered</p>
          <h2 class="q-prompt">${esc(it.prompt)}</h2>
          ${stimulus}
          <div class="q-options${isFigural ? " q-options-grid" : ""}">${opts}</div>
          <div class="actions quiz-nav">
            <button class="button" id="prev"${current === 0 ? " disabled" : ""}>← Back</button>
            ${current === TOTAL - 1
              ? `<button class="button primary" id="finish">See my results</button>`
              : `<button class="button primary" id="next">Next →</button>`}
            <button class="button" id="review">Review &amp; finish</button>
          </div>
        </div>`;
      root.querySelectorAll(".q-option").forEach((b) => {
        b.onclick = () => {
          answers[current] = Number(b.dataset.i);
          if (current < TOTAL - 1) { current += 1; question(); }
          else question();
        };
      });
      const prev = root.querySelector("#prev");
      if (prev) prev.onclick = () => { if (current > 0) { current -= 1; question(); } };
      const next = root.querySelector("#next");
      if (next) next.onclick = () => { if (current < TOTAL - 1) { current += 1; question(); } };
      const finish = root.querySelector("#finish");
      if (finish) finish.onclick = () => confirmFinish();
      root.querySelector("#review").onclick = () => confirmFinish();
    }

    function confirmFinish() {
      const unanswered = answers.filter((a) => a === null).length;
      if (unanswered > 0 && !window.confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} still unanswered — they'll be scored as incorrect. Finish anyway?`)) return;
      stopTimer();
      results(false);
    }

    function results(timedOut) {
      // Score
      let correct = 0;
      const byCat = {};
      const scored = []; // { b, right } per item, for the ability estimate
      run.forEach((q, i) => {
        const c = q.item.cat;
        byCat[c] = byCat[c] || { correct: 0, total: 0 };
        byCat[c].total += 1;
        const right = answers[i] === q.correctIndex;
        if (right) { correct += 1; byCat[c].correct += 1; }
        scored.push({ b: q.item.b, right });
      });
      const p = correct / TOTAL;

      // Ability estimate via a 3-parameter IRT model. Each item has a
      // difficulty b (logits, adult population θ ~ N(0,1)); with 4 options the
      // guessing floor is c = 0.25. P(correct | θ) = c + (1-c)·σ(θ - b).
      // θ is the maximum-likelihood estimate found by bisection on the score
      // equation Σ P_i(θ) = raw score, so solving hard items moves the
      // estimate far more than solving easy ones.
      const GUESS = 0.25;
      const pAt = (theta, b) => GUESS + (1 - GUESS) / (1 + Math.exp(-(theta - b)));
      const expectedScore = (theta) => scored.reduce((s, it) => s + pAt(theta, it.b), 0);
      let theta;
      if (correct <= expectedScore(-4)) theta = -4;
      else if (correct >= expectedScore(4)) theta = 4;
      else {
        let lo = -4, hi = 4;
        for (let k = 0; k < 50; k++) {
          const mid = (lo + hi) / 2;
          if (expectedScore(mid) < correct) lo = mid; else hi = mid;
        }
        theta = (lo + hi) / 2;
      }
      // Standard error from the Fisher information of the 3PL model:
      // I(θ) = Σ (Q/P)·((P-c)/(1-c))², SE = 1/√I. Gives an honest, ability-
      // dependent confidence band (wider at the extremes).
      const info = scored.reduce((s, it) => {
        const P = pAt(theta, it.b);
        const r = (P - GUESS) / (1 - GUESS);
        return s + ((1 - P) / P) * r * r;
      }, 0);
      const se = info > 0 ? 1 / Math.sqrt(info) : 1.5;

      // Convert to the familiar IQ scale (mean 100, SD 15).
      let est = Math.round(100 + 15 * theta);
      est = Math.max(65, Math.min(150, est));
      const spread = Math.max(4, Math.min(15, Math.round(15 * se)));
      const lo = Math.max(55, est - spread);
      const hi = Math.min(160, est + spread);
      const percentile = Math.max(1, Math.min(99, Math.round(normCdf((est - 100) / 15) * 100)));
      const band =
        est >= 130 ? "Very high" : est >= 120 ? "High" : est >= 110 ? "Above average" :
        est >= 90 ? "Average" : est >= 80 ? "Below average" : "Low";

      const catRows = Object.keys(byCat).map((c) => {
        const b = byCat[c];
        const cp = Math.round((b.correct / b.total) * 100);
        return `<div class="score-row">
          <div class="score-row-head"><span>${esc(catLabels[c] || c)}</span><strong>${b.correct}/${b.total}</strong></div>
          <div class="score-bar"><span style="width:${cp}%"></span></div>
        </div>`;
      }).join("");

      root.innerHTML = `
        <div class="quiz quiz-results">
          ${timedOut ? `<p class="quiz-flash">⏱ Time is up — here is your result based on the questions you answered.</p>` : ""}
          <p class="eyebrow">Your estimated result</p>
          <div class="score-hero">
            <div class="score-big">≈ ${est}<small>estimated range ${lo}–${hi}</small></div>
            <div class="score-meta">
              <p><strong>${band}</strong> band</p>
              <p>Around the <strong>${percentile}${ordinal(percentile)} percentile</strong> of this test's scale.</p>
              <p>${correct} of ${TOTAL} correct (${pct(p * 100)}).</p>
            </div>
          </div>
          <div class="quiz-note warn">
            <strong>Read this before you share the number</strong>
            <p>This is an <em>unnormed, self-scored estimate</em> from a short online test, not a professionally administered or normed IQ score. Real IQ tests are given one-to-one by trained psychologists and standardised on large samples. Treat this as a fun practice indicator of pattern-based reasoning — nothing more.</p>
          </div>
          <h3>How you did by reasoning type</h3>
          <div class="score-rows">${catRows}</div>
          <div class="quiz-note">
            <strong>How this score was calculated</strong>
            <p>Every question carries a difficulty weight, and your estimate comes from an item-response model (the same family of statistics behind professionally normed tests): solving hard items raises the estimate far more than solving easy ones, and a 25% guessing floor is built in because each question has four options. The range shown is the model's own statistical uncertainty, so it widens at extreme scores. <strong>Number &amp; series</strong> and <strong>logical reasoning</strong> lean on sequential, rule-finding thinking; <strong>verbal reasoning</strong> reflects how you map relationships between concepts; <strong>pattern &amp; spatial</strong> is the closest to pure "fluid intelligence."</p>
          </div>
          ${shareBar()}
          <div class="actions">
            <button class="button primary" id="retake">Retake the test</button>
          </div>
          <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone. Retaking reshuffles the questions and answer order.</p>
        </div>`;
      wireShare(`I scored an estimated IQ of ${est} (${band.toLowerCase()} band, ~${percentile}${ordinal(percentile)} percentile) on this free ${TOTAL}-question IQ test 🧠 Think you can beat it?`);
      root.querySelector("#retake").onclick = () => location.reload();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };

    intro();
  }

  /* =====================================================================
   *  PERSONALITY TYPE TEST
   *  Original 6-type model (not Color Code / True Colors / MBTI). Balanced
   *  Likert: 6 first-person statements per type, scored 0-4, summed, and
   *  shown as an affinity intensity per type with a dominant type.
   * ===================================================================== */
  function renderPersonalityTest() {
    const ICON = (inner) =>
      `<svg viewBox="0 0 64 64" class="type-ic" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
    const icons = {
      beacon: ICON(`<circle cx="32" cy="32" r="11"/><path d="M32 6v9M32 49v9M6 32h9M49 32h9M14 14l6 6M44 44l6 6M50 14l-6 6M20 44l-6 6"/>`),
      architect: ICON(`<circle cx="32" cy="12" r="3.5"/><path d="M32 15 19 52M32 15l13 37M24 40h16"/>`),
      trailblazer: ICON(`<path d="M20 8v48"/><path d="M20 12h28l-8 9 8 9H20z" fill="currentColor"/>`),
      anchor: ICON(`<circle cx="32" cy="14" r="5"/><path d="M32 19v33M20 34h24M16 42a16 16 0 0 0 32 0"/>`),
      voyager: ICON(`<path d="M32 6l5.5 18.5L56 30l-18.5 5.5L32 54l-5.5-18.5L8 30l18.5-5.5z"/>`),
      weaver: ICON(`<circle cx="25" cy="32" r="13"/><circle cx="39" cy="32" r="13"/>`)
    };
    // key, name, color, tagline, blurb (intro card), meaning (full), strengths, watch
    const types = [
      {
        key: "beacon", name: "The Beacon", color: "#e6a935", tagline: "Warmth that moves people",
        blurb: "Expressive, optimistic, and energised by people. Beacons lift the mood and pull others together.",
        meaning: "You lead with warmth and energy. A Beacon reads a room instinctively and knows how to lift it — you turn a flat meeting into a conversation and a stranger into a friend. Optimism is your default setting, so you tend to see possibility where others see problems, and people are drawn to that hopeful, expressive energy. You think out loud, connect quickly, and feel most alive when you're helping others feel seen and encouraged.",
        strengths: ["Rallies and motivates the people around you", "Communicates with genuine warmth and enthusiasm", "Finds the upside and keeps morale high under pressure", "Builds a wide, loyal network with ease"],
        watch: ["Can talk over quieter voices without meaning to", "May gloss over hard details in favour of the vibe", "Needs recognition, and can deflate without it"]
      },
      {
        key: "architect", name: "The Architect", color: "#4f8cff", tagline: "Order out of complexity",
        blurb: "Analytical, precise, and structured. Architects trust logic, plans, and evidence over impulse.",
        meaning: "You bring clarity to messy problems. An Architect wants to understand how things actually work, and you're happiest with a clean plan, solid data, and a system you can trust. You notice the errors and inconsistencies everyone else skimmed past, and you'd rather be right than fast. That precision makes you the person others turn to when a decision really has to hold up — you think it through before you commit, and your conclusions tend to last.",
        strengths: ["Thinks rigorously and spots flaws early", "Builds reliable plans, systems, and processes", "Makes decisions grounded in evidence, not mood", "Delivers careful, high-quality, detailed work"],
        watch: ["Can over-analyse and delay a good-enough decision", "May come across as cool or critical to feelings-first people", "Resists changing a plan even when the ground shifts"]
      },
      {
        key: "trailblazer", name: "The Trailblazer", color: "#e0796c", tagline: "Momentum and nerve",
        blurb: "Driven, decisive, and bold. Trailblazers move first, take charge, and push through obstacles.",
        meaning: "You are built for momentum. A Trailblazer would rather act and adjust than wait for perfect certainty, and you're comfortable making the hard call when everyone else hesitates. Goals genuinely energise you, obstacles make you push harder, and you like owning the outcome. When a group is stuck, you're the one who gets it moving — decisive, direct, and unafraid to lead from the front.",
        strengths: ["Decisive and confident under pressure", "Drives projects forward and gets results", "Takes ownership and leads without being asked", "Turns setbacks into fuel"],
        watch: ["Can steamroll people in the rush to progress", "Impatience may cut off useful discussion", "Risks burning out yourself and others"]
      },
      {
        key: "anchor", name: "The Anchor", color: "#3ecf8e", tagline: "Steady ground for everyone",
        blurb: "Calm, loyal, and dependable. Anchors keep things stable and quietly look after the people around them.",
        meaning: "You are the steady ground others stand on. An Anchor stays level when everyone else is stressed, keeps their word, and shows up consistently — which is exactly why people rely on you. You value harmony and would usually rather keep the peace than win a point, and you quietly make sure the people around you are actually okay. Your calm, dependable presence is the thing that holds teams and friendships together over the long haul.",
        strengths: ["Stays calm and grounded in a crisis", "Deeply loyal, consistent, and trustworthy", "Creates harmony and looks after others", "Follows through and finishes what you start"],
        watch: ["Can avoid necessary conflict to keep the peace", "May resist change even when it's needed", "Puts others first until your own needs go unmet"]
      },
      {
        key: "voyager", name: "The Voyager", color: "#b57edc", tagline: "Chasing what could be",
        blurb: "Curious, imaginative, and restless. Voyagers chase new ideas and reimagine how things could be.",
        meaning: "You are pulled forward by possibility. A Voyager is always chasing the next idea, experience, or what-if, and you get restless doing the same thing the same way for long. You imagine how things could be completely different and happily rethink the rules to get there. That curiosity makes you a natural innovator — you see the future arriving before other people do, and you'd take an interesting risk over a safe, predictable path almost every time.",
        strengths: ["Generates original ideas and fresh angles", "Embraces change and thrives on novelty", "Sees possibilities and long-range vision", "Comfortable with bold, calculated risks"],
        watch: ["Can start more than you finish", "May dismiss proven methods too quickly", "Restlessness can read as unreliability"]
      },
      {
        key: "weaver", name: "The Weaver", color: "#2dd4bf", tagline: "Bringing people together",
        blurb: "Empathetic, diplomatic, and adaptive. Weavers sense what people feel and bring them into harmony.",
        meaning: "You connect people to each other. A Weaver senses how others feel before they say a word, and you naturally end up mediating when there's tension. You adapt your approach to whoever you're with, listen more than you talk, and care more about doing what's fair than about being right. That empathy and diplomacy make you the quiet glue in any group — the one who understands every side and helps everyone feel heard.",
        strengths: ["Reads people and emotions with real accuracy", "Mediates conflict and builds consensus", "Adapts smoothly to different people and situations", "Leads with fairness, empathy, and values"],
        watch: ["Can absorb others' stress until it wears you down", "May lose your own position while accommodating everyone", "Avoids taking a hard stand when one is needed"]
      }
    ];
    const typeByKey = Object.fromEntries(types.map((t) => [t.key, t]));

    // 6 first-person statements per type (order interleaved at runtime).
    const S = (type, text) => ({ type, text });
    const bank = [
      S("beacon", "I light up when I'm the one energising a room."),
      S("beacon", "People come to me for a boost of encouragement."),
      S("beacon", "I'd rather talk an idea through out loud than sit with it alone."),
      S("beacon", "I naturally look for the bright side of a tough situation."),
      S("beacon", "Being noticed and appreciated matters a lot to me."),
      S("beacon", "I make new connections easily wherever I go."),
      S("architect", "I like to understand exactly how something works before I trust it."),
      S("architect", "A clear plan and a tidy system calm me down."),
      S("architect", "I catch errors and inconsistencies that other people miss."),
      S("architect", "I prefer decisions backed by data over decisions based on a feeling."),
      S("architect", "I think carefully before I speak or commit."),
      S("architect", "Vague instructions frustrate me; I want the specifics."),
      S("trailblazer", "I'd rather act now and adjust than wait for perfect certainty."),
      S("trailblazer", "I get restless when things move too slowly."),
      S("trailblazer", "Winning and hitting the goal genuinely motivate me."),
      S("trailblazer", "I'm comfortable making the hard call when no one else will."),
      S("trailblazer", "Obstacles make me push harder, not back off."),
      S("trailblazer", "I like being in charge of the outcome."),
      S("anchor", "I stay calm and level-headed when other people are stressed."),
      S("anchor", "Loyalty and keeping my word matter deeply to me."),
      S("anchor", "I'd rather keep the peace than win an argument."),
      S("anchor", "People rely on me because I'm consistent and dependable."),
      S("anchor", "I prefer steady routines over constant change."),
      S("anchor", "I quietly make sure everyone around me is okay."),
      S("voyager", "I'm always chasing the next new idea or experience."),
      S("voyager", "I get bored doing the same thing the same way for long."),
      S("voyager", "I love imagining how things could be completely different."),
      S("voyager", "I'd pick an interesting risk over a safe, predictable path."),
      S("voyager", "My mind jumps ahead to possibilities others haven't considered."),
      S("voyager", "Rules are starting points I'm happy to rethink."),
      S("weaver", "I can sense how people are feeling before they say it."),
      S("weaver", "I naturally end up mediating when people disagree."),
      S("weaver", "I adapt my approach to fit whoever I'm with."),
      S("weaver", "Doing what's fair and right matters more to me than being right."),
      S("weaver", "I listen more than I talk in a group."),
      S("weaver", "I feel other people's emotions almost as if they were my own.")
    ];
    // Interleave so the same type doesn't cluster: round-robin by type.
    const byType = types.map((t) => bank.filter((s) => s.type === t.key));
    const questions = [];
    for (let i = 0; i < 6; i++) for (const group of byType) questions.push(group[i]);

    const TOTAL = questions.length;
    const PER_PAGE = 6;
    const PAGES = Math.ceil(TOTAL / PER_PAGE);
    const scale = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
    const scaleAbbr = ["SD", "D", "N", "A", "SA"];
    const answers = new Array(TOTAL).fill(null);
    let page = 0;

    function intro() {
      root.innerHTML = `
        <div class="quiz quiz-intro">
          <div class="quiz-badges">
            <span class="quiz-badge time">⏱ Estimated time: about 10 minutes</span>
            <span class="quiz-badge">${TOTAL} statements · 6 types</span>
            <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
          </div>
          <h2>Which of the six types are you?</h2>
          <p class="quiz-lede"><strong>Completely FREE personality type test. No signup, no email, no credit card. Instant results with a full type breakdown, no catch.</strong></p>
          <p>This is an original, colour-coded model built for this site — it isn't the Color Code, True Colors, or Myers-Briggs. You'll rate ${TOTAL} short statements, and we'll show your <strong>dominant type</strong> plus your affinity for all six. Most people are a blend, and the scorecard shows exactly how yours mixes.</p>
          <h3>Meet the six types</h3>
          <div class="type-grid">
            ${types.map((t) => `
              <div class="type-card" style="--tc:${t.color}">
                ${icons[t.key]}
                <h4>${esc(t.name)}</h4>
                <p>${esc(t.blurb)}</p>
              </div>`).join("")}
          </div>
          <div class="quiz-note">
            <strong>Answer honestly, not aspirationally</strong>
            <p>Rate how you actually are day to day, not how you'd like to be or how you act at work. There are no better or worse types — each one is a different set of strengths.</p>
          </div>
          <div class="actions"><button class="button primary" id="start">Start the test →</button></div>
        </div>`;
      root.querySelector("#start").onclick = () => { page = 0; renderPage(); };
    }

    function renderPage() {
      const start = page * PER_PAGE;
      const slice = questions.slice(start, start + PER_PAGE);
      const answered = answers.filter((a) => a !== null).length;
      const rows = slice.map((q, idx) => {
        const gi = start + idx;
        return `
          <div class="p-statement">
            <p class="p-text">${esc(q.text)}</p>
            <div class="p-scale" role="group" aria-label="${esc(q.text)}">
              ${scale.map((label, v) => `
                <button type="button" class="p-dot${answers[gi] === v ? " selected" : ""}" data-gi="${gi}" data-v="${v}" data-abbr="${scaleAbbr[v]}" title="${esc(label)}" aria-label="${esc(label)}"><span>${label}</span></button>`).join("")}
            </div>
          </div>`;
      }).join("");
      root.innerHTML = `
        <div class="quiz quiz-question">
          <div class="quiz-progress"><span style="width:${(answered / TOTAL) * 100}%"></span></div>
          <p class="quiz-count">Page ${page + 1} of ${PAGES} · ${answered} of ${TOTAL} answered</p>
          <div class="p-scale-legend"><span>Strongly disagree</span><span>Strongly agree</span></div>
          <div class="p-statements">${rows}</div>
          <div class="actions quiz-nav">
            <button class="button" id="prev"${page === 0 ? " disabled" : ""}>← Back</button>
            ${page === PAGES - 1
              ? `<button class="button primary" id="finish">See my results</button>`
              : `<button class="button primary" id="next">Next →</button>`}
          </div>
        </div>`;
      root.querySelectorAll(".p-dot").forEach((b) => {
        b.onclick = () => {
          answers[Number(b.dataset.gi)] = Number(b.dataset.v);
          b.parentElement.querySelectorAll(".p-dot").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          const bar = root.querySelector(".quiz-progress > span");
          const a = answers.filter((x) => x !== null).length;
          if (bar) bar.style.width = `${(a / TOTAL) * 100}%`;
          const c = root.querySelector(".quiz-count");
          if (c) c.textContent = `Page ${page + 1} of ${PAGES} · ${a} of ${TOTAL} answered`;
        };
      });
      const prev = root.querySelector("#prev");
      if (prev) prev.onclick = () => { if (page > 0) { page -= 1; renderPage(); root.scrollIntoView({ block: "start" }); } };
      const next = root.querySelector("#next");
      if (next) next.onclick = () => {
        if (!pageComplete(start)) { alert("Please answer every statement on this page before continuing."); return; }
        page += 1; renderPage(); root.scrollIntoView({ block: "start" });
      };
      const finish = root.querySelector("#finish");
      if (finish) finish.onclick = () => {
        if (answers.some((a) => a === null)) { alert("Please answer every statement so the scorecard is accurate."); return; }
        results();
      };
    }
    function pageComplete(start) {
      for (let i = start; i < Math.min(start + PER_PAGE, TOTAL); i++) if (answers[i] === null) return false;
      return true;
    }

    function results() {
      const scores = Object.fromEntries(types.map((t) => [t.key, 0]));
      questions.forEach((q, i) => { scores[q.type] += answers[i]; });
      const max = 6 * 4; // 6 statements * max 4
      const ranked = types
        .map((t) => ({ t, raw: scores[t.key], pct: Math.round((scores[t.key] / max) * 100) }))
        .sort((a, b) => b.raw - a.raw);
      const top = ranked[0];
      const second = ranked[1];
      const blend = (top.raw - second.raw) <= 3
        ? `<p>Your profile is a close blend of <strong style="color:${top.t.color}">${esc(top.t.name)}</strong> and <strong style="color:${second.t.color}">${esc(second.t.name)}</strong> — you draw on both depending on the situation.</p>`
        : `<p><strong style="color:${top.t.color}">${esc(top.t.name)}</strong> is clearly out in front for you, with <strong style="color:${second.t.color}">${esc(second.t.name)}</strong> as your strong secondary flavour.</p>`;

      const bars = ranked.map((r) => `
        <div class="affinity-row">
          <div class="affinity-head"><span><span class="dot" style="background:${r.t.color}"></span>${esc(r.t.name)}</span><strong>${r.pct}%</strong></div>
          <div class="affinity-bar"><span style="width:${r.pct}%;background:${r.t.color}"></span></div>
        </div>`).join("");

      root.innerHTML = `
        <div class="quiz quiz-results">
          <p class="eyebrow">Your dominant type</p>
          <div class="type-result-head" style="--tc:${top.t.color}">
            ${icons[top.t.key]}
            <div><h2>${esc(top.t.name)}</h2><span class="type-tag">${esc(top.t.tagline)}</span></div>
          </div>
          <p>${esc(top.t.meaning)}</p>
          ${blend}
          <h3>Your affinity for each type</h3>
          <div class="affinity-rows">${bars}</div>
          <div class="two-col">
            <div class="quiz-note">
              <strong>Where you shine</strong>
              <ul class="q-list">${top.t.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
            </div>
            <div class="quiz-note warn">
              <strong>What to watch for</strong>
              <ul class="q-list watch-list">${top.t.watch.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="quiz-note">
            <strong>Remember</strong>
            <p>No type is better than another, and this is a self-reflection tool, not a clinical assessment. Your result is a snapshot of how you answered today — use it as a mirror and a conversation starter, not a label.</p>
          </div>
          ${shareBar()}
          <div class="actions"><button class="button primary" id="retake">Retake the test</button></div>
          <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone.</p>
        </div>`;
      wireShare(`My personality type is ${top.t.name} — "${top.t.tagline}" ✨ Take the free test and find yours!`);
      root.querySelector("#retake").onclick = () => location.reload();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    intro();
  }

  /* =====================================================================
   *  ZODIAC COMPATIBILITY
   *  12 signs with original SVG glyphs, sign-or-birthday input (correct
   *  date boundaries), a traditional aspect-based score, and hand-written
   *  specificity for every one of the 78 unordered pairings.
   * ===================================================================== */
  function renderZodiac() {
    const G = (inner) =>
      `<svg viewBox="0 0 48 48" class="sign-ic" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
    const glyphs = {
      aries: G(`<path d="M24 42V22M24 22c0-9-5-13-10-11-5 2-4 10 2 11M24 22c0-9 5-13 10-11 5 2 4 10-2 11"/>`),
      taurus: G(`<circle cx="24" cy="30" r="10"/><path d="M10 11c2 7 8 11 14 11s12-4 14-11"/>`),
      gemini: G(`<path d="M13 12c7 3 15 3 22 0M13 36c7-3 15-3 22 0M20 13v22M28 13v22"/>`),
      cancer: G(`<path d="M8 23c4-8 18-9 25-2M40 25c-4 8-18 9-25 2"/><circle cx="14" cy="26" r="3.2"/><circle cx="34" cy="22" r="3.2"/>`),
      leo: G(`<circle cx="16" cy="32" r="7"/><path d="M22 29c-4-8 0-17 6-18 6-1 10 5 6 10-3 4-8 2-7-2"/>`),
      virgo: G(`<path d="M9 14v22M9 14c5 0 6 4 6 9v13M15 23c5-2 6 2 6 9v6M21 30c1-6 5-9 9-6 5 3 3 10-2 12 5 2 6 6 2 9"/>`),
      libra: G(`<path d="M8 35h32M8 41h32M14 31a10 10 0 0 1 20 0"/>`),
      scorpio: G(`<path d="M8 15v20M8 15c5 0 6 4 6 9v11M14 20c5-2 6 2 6 9v9M20 24c1-4 6-6 9-3 3 3 3 8 0 11l5 6M32 33l7 5-2-8"/>`),
      sagittarius: G(`<path d="M11 37 35 13M23 13h13v13M17 25l9 9"/>`),
      capricorn: G(`<path d="M9 16c5-2 7 3 7 9v10M16 21c4-5 9-3 10 3 1 5-2 9-5 9M25 34c7 3 13-3 10-10-2-5-8-4-9 1"/>`),
      aquarius: G(`<path d="M8 22c3-4 5-4 8 0 3 4 5 4 8 0 3-4 5-4 8 0 3 4 5 4 8 0M8 31c3-4 5-4 8 0 3 4 5 4 8 0 3-4 5-4 8 0 3 4 5 4 8 0"/>`),
      pisces: G(`<path d="M14 9c-6 6-6 24 0 30M34 9c6 6 6 24 0 30M10 24h28"/>`)
    };

    // key, name, element, modality, dates label, ruler, blurb, gift
    const signs = [
      { key: "aries", name: "Aries", el: "Fire", mod: "Cardinal", dates: "Mar 21 – Apr 19", ruler: "Mars", blurb: "Bold, driven, and first through the door. Aries brings courage and unstoppable momentum.", gift: "courage, initiative, and a jolt of adventurous energy" },
      { key: "taurus", name: "Taurus", el: "Earth", mod: "Fixed", dates: "Apr 20 – May 20", ruler: "Venus", blurb: "Steady, sensual, and loyal. Taurus loves comfort, security, and the finer, slower things.", gift: "steadiness, comfort, and unwavering loyalty" },
      { key: "gemini", name: "Gemini", el: "Air", mod: "Mutable", dates: "May 21 – Jun 20", ruler: "Mercury", blurb: "Curious, quick, and endlessly talkative. Gemini lives for ideas, variety, and good conversation.", gift: "curiosity, wit, and conversation that never runs dry" },
      { key: "cancer", name: "Cancer", el: "Water", mod: "Cardinal", dates: "Jun 21 – Jul 22", ruler: "the Moon", blurb: "Nurturing, intuitive, and protective. Cancer leads with feeling and builds a real home.", gift: "nurturing warmth and a genuine emotional home" },
      { key: "leo", name: "Leo", el: "Fire", mod: "Fixed", dates: "Jul 23 – Aug 22", ruler: "the Sun", blurb: "Warm, generous, and magnetic. Leo shines, loves grandly, and stays fiercely loyal.", gift: "generous warmth, loyalty, and a sense of occasion" },
      { key: "virgo", name: "Virgo", el: "Earth", mod: "Mutable", dates: "Aug 23 – Sep 22", ruler: "Mercury", blurb: "Precise, practical, and quietly caring. Virgo shows love by making everything work better.", gift: "practical care, sharp attention, and quiet devotion" },
      { key: "libra", name: "Libra", el: "Air", mod: "Cardinal", dates: "Sep 23 – Oct 22", ruler: "Venus", blurb: "Charming, fair, and partnership-minded. Libra seeks harmony, beauty, and balance.", gift: "harmony, fairness, and effortless charm" },
      { key: "scorpio", name: "Scorpio", el: "Water", mod: "Fixed", dates: "Oct 23 – Nov 21", ruler: "Pluto", blurb: "Intense, loyal, and deep. Scorpio loves all the way down and never does anything halfway.", gift: "depth, passion, and fierce commitment" },
      { key: "sagittarius", name: "Sagittarius", el: "Fire", mod: "Mutable", dates: "Nov 22 – Dec 21", ruler: "Jupiter", blurb: "Adventurous, honest, and free. Sagittarius chases the horizon and the bigger meaning.", gift: "optimism, adventure, and refreshingly honest perspective" },
      { key: "capricorn", name: "Capricorn", el: "Earth", mod: "Cardinal", dates: "Dec 22 – Jan 19", ruler: "Saturn", blurb: "Ambitious, disciplined, and dependable. Capricorn builds status and security to last.", gift: "ambition, stability, and a plan that actually works" },
      { key: "aquarius", name: "Aquarius", el: "Air", mod: "Fixed", dates: "Jan 20 – Feb 18", ruler: "Uranus", blurb: "Inventive, independent, and idealistic. Aquarius thinks ahead and champions the bigger cause.", gift: "originality, open-mindedness, and breathing room" },
      { key: "pisces", name: "Pisces", el: "Water", mod: "Mutable", dates: "Feb 19 – Mar 20", ruler: "Neptune", blurb: "Dreamy, compassionate, and artistic. Pisces feels everything and loves with the whole heart.", gift: "empathy, imagination, and gentle romance" }
    ];
    const idx = Object.fromEntries(signs.map((s, i) => [s.key, i]));

    // Birthday → sign using standard tropical-zodiac date boundaries.
    // Encode the date as month*100+day so ranges are simple integer comparisons.
    const signFromDate = (month, day) => {
      const t = month * 100 + day;
      if (t >= 120 && t <= 218) return "aquarius";     // Jan 20 – Feb 18
      if (t >= 219 && t <= 320) return "pisces";       // Feb 19 – Mar 20
      if (t >= 321 && t <= 419) return "aries";        // Mar 21 – Apr 19
      if (t >= 420 && t <= 520) return "taurus";       // Apr 20 – May 20
      if (t >= 521 && t <= 620) return "gemini";       // May 21 – Jun 20
      if (t >= 621 && t <= 722) return "cancer";       // Jun 21 – Jul 22
      if (t >= 723 && t <= 822) return "leo";          // Jul 23 – Aug 22
      if (t >= 823 && t <= 922) return "virgo";        // Aug 23 – Sep 22
      if (t >= 923 && t <= 1022) return "libra";       // Sep 23 – Oct 22
      if (t >= 1023 && t <= 1121) return "scorpio";    // Oct 23 – Nov 21
      if (t >= 1122 && t <= 1221) return "sagittarius"; // Nov 22 – Dec 21
      return "capricorn";                              // Dec 22 – Jan 19 (wraps)
    };

    // Hand-written signature for every unordered pair (canonical key "min-max").
    const pairNote = {
      "0-0": "Two rams means pure high-octane momentum — you chase goals, adventures and the occasional argument with equal fire, and neither of you holds a grudge for long. The spark is instant; the challenge is that nobody wants to be the one who slows down to plan.",
      "1-1": "Two Bulls build something solid and sensual — a shared love of comfort, good food, loyalty, and a home that feels like a fortress. You understand each other's need for security completely; the risk is that neither of you budges once you've dug in.",
      "2-2": "Two Geminis never run out of things to say — endless curiosity, banter, and half-finished plans that somehow multiply. Mentally you're a perfect match; grounding all that energy into follow-through is the shared homework.",
      "3-3": "Two Crabs create a deeply nurturing, emotionally fluent bond — you read each other's moods without a word and build a cozy, protective nest. The tenderness is real; so is the risk of both retreating into your shells at the same time.",
      "4-4": "Two Lions light up the room together — warmth, loyalty, drama, and grand romantic gestures on both sides. When you share the spotlight it's dazzling; when you compete for it, the roars get loud.",
      "5-5": "Two Virgos run a tidy, thoughtful life together — shared standards, mutual usefulness, and small daily acts of care. You genuinely appreciate each other's efforts; the trap is trading improvement tips until it tips into mutual criticism.",
      "6-6": "Two Libras create a graceful, harmonious, beautiful partnership — endless fairness, charm, and consideration. You both crave balance; the shared struggle is that eventually someone has to actually make the decision.",
      "7-7": "Two Scorpios go all the way in — intense loyalty, magnetic attraction, and a bond with no shallow end. The depth is unmatched; that same intensity fuels jealousy and power struggles if trust ever wobbles.",
      "8-8": "Two Archers are a travelling, laughing, on-to-the-next-thing duo — freedom, optimism, and big dreams you actually chase together. Space is never a problem; remembering to handle the boring logistics is.",
      "9-9": "Two Capricorns are a power couple by design — ambitious, disciplined, and quietly devoted, building status and security as a team. You respect each other's drive; the work is letting warmth in past the to-do list.",
      "10-10": "Two Aquarians are best friends first — inventive, independent, and fascinated by ideas and causes bigger than yourselves. You give each other total freedom; the missing piece can be day-to-day emotional closeness.",
      "11-11": "Two Pisces share a dreamy, compassionate, almost telepathic bond — art, empathy, and a private world only the two of you inhabit. The romance is enchanting; someone still has to keep a foot in the real world.",
      "0-1": "Mars-fire meets Venus-earth: Aries brings the spark and the nerve, Taurus brings the staying power and the comfort. Aries learns patience, Taurus learns spontaneity — a slow-burn that lasts if Aries doesn't rush the Bull.",
      "0-2": "Fire and air, and it crackles — Aries acts, Gemini schemes, and together you're never bored. Fast talk, fast plans, and spontaneous adventures keep you both mentally and physically on the move.",
      "0-3": "Bold Aries and tender Cancer sit on one of the zodiac's oldest fault lines: drive versus feeling. When Aries provides protection and Cancer provides a home base it's powerful; friction comes when Aries is blunt and Cancer takes it to heart.",
      "0-4": "Two fire signs, instant heat — Aries the initiator, Leo the star, both passionate, loyal, and up for anything. You cheer each other on brilliantly; keep the ego contest friendly and it's a blaze that warms rather than burns.",
      "0-5": "Impulsive Aries and precise Virgo look mismatched, and that's the point — Aries supplies courage and momentum, Virgo supplies the plan that makes it work. Respect the difference and you're a formidable start-to-finish team.",
      "0-6": "Opposite signs, and magnetic for it — Aries is 'me,' Libra is 'we,' and each has exactly what the other lacks. Aries brings decisiveness, Libra brings diplomacy; balance the self-and-partner tug and it's classic opposites-attract.",
      "0-7": "Both answer to warrior Mars, so this is pure intensity — fearless, passionate, all-in. Aries fights out loud, Scorpio fights deep; aim that shared drive at the world instead of each other and few couples are more powerful.",
      "0-8": "Two fire signs built for adventure — spontaneous, optimistic, blunt, and always ready for the next trip. You hand each other freedom and fun in equal measure; one of the zodiac's easiest, most energizing matches.",
      "0-9": "Two cardinal go-getters from opposite directions — Aries charges, Capricorn strategizes. It's a square, so sparks fly, but as an ambition-driven team you can conquer almost anything once Aries respects the long game.",
      "0-10": "Fire and air, rebels together — Aries acts on instinct, Aquarius on vision, and neither one clings. You fan each other's independence and love a bold idea; expect excitement, spontaneity, and plenty of room to breathe.",
      "0-11": "Zodiac neighbours: Aries the warrior, Pisces the dreamer. Aries protects and emboldens gentle Pisces, Pisces softens and inspires fiery Aries — a tender-tough pairing when Aries stays gentle with Pisces' feelings.",
      "1-2": "Steady earth and restless air — Taurus wants to settle, Gemini wants to explore. Neighbours who balance each other: Gemini brings lightness and ideas, Taurus brings follow-through and calm, as long as patience runs both ways.",
      "1-3": "Earth and water in easy harmony — both crave security, home comforts, and loyalty, and you build a warm, stable life almost effortlessly. Taurus is the steady rock, Cancer the emotional heart; a genuinely nurturing match.",
      "1-4": "Two fixed signs who love luxury and loyalty — Taurus the sensualist, Leo the romantic, both devoted once committed. The affection and comfort are lavish; the standoffs, when they come, are epic because neither backs down.",
      "1-5": "Two earth signs, deeply compatible — practical, reliable, and quietly devoted, with Virgo's precision and Taurus's steadiness reinforcing each other. You build security together and mean it; one of the zodiac's most stable pairings.",
      "1-6": "Both ruled by Venus, so beauty, comfort, and affection are your shared language — lovely spaces, good food, real tenderness. Taurus grounds Libra's indecision, Libra lightens Taurus's stubbornness; a graceful, harmony-loving match.",
      "1-7": "Opposites and intensely magnetic — Taurus the sensual builder, Scorpio the emotional depth-charge, both fiercely loyal and possessive. The attraction is powerful and lasting; the shared fixity means neither forgives being crossed easily.",
      "1-8": "Homebody earth meets wanderer fire — Taurus wants roots, Sagittarius wants the horizon. It takes real compromise, but Taurus can ground Sag's adventures and Sag can coax Taurus out to play.",
      "1-9": "Two earth signs and a natural power base — ambitious, loyal, and grounded, you build wealth, security, and a solid life as a team. Taurus adds warmth and pleasure to Capricorn's discipline; steady, sensible, and enduring.",
      "1-10": "Fixed earth and fixed air, stubborn on both ends — Taurus loves tradition, Aquarius loves reinvention. It's a square with real friction, but Taurus grounds Aquarius's ideas and Aquarius widens Taurus's world if both will bend.",
      "1-11": "Earth and water, gentle and romantic — Taurus offers Pisces safety and a stable shore, Pisces offers Taurus tenderness and imagination. A soothing, affectionate match where practicality meets dreams.",
      "2-3": "Air and water, mind and heart — Gemini talks it out, Cancer feels it through. Neighbours who trade gifts: Gemini lightens Cancer's moods, Cancer gives Gemini emotional depth, once Gemini learns a little tenderness.",
      "2-4": "Air feeds fire — playful Gemini and warm Leo make a sociable, flirtatious, fun-loving pair. Gemini's wit delights Leo, Leo's generosity charms Gemini; lots of sparkle when Leo's ego and Gemini's teasing stay kind.",
      "2-5": "Both ruled by Mercury, so it's a true meeting of minds — clever, verbal, endlessly curious. Gemini scatters ideas, Virgo organizes them; great conversation and mental chemistry once Virgo's critique and Gemini's flit find a rhythm.",
      "2-6": "Two air signs in effortless sync — social, witty, idea-loving, and light on their feet. The conversation never stops and the vibe stays easy and elegant; among the most naturally harmonious matches in the zodiac.",
      "2-7": "Airy Gemini and deep Scorpio are a study in contrast — Gemini floats across the surface, Scorpio dives to the seabed. Fascinating and challenging: Scorpio wants total depth, Gemini wants total freedom, and the pull is real.",
      "2-8": "Opposite signs, twin explorers — Gemini the local scout, Sagittarius the far traveller, both curious, funny, and freedom-loving. You finish each other's ideas and adventures; a lively, never-boring opposites-attract match.",
      "2-9": "Playful air and serious earth — Gemini improvises, Capricorn plans. An unlikely but useful pair: Capricorn gives Gemini's ideas structure, Gemini lightens Capricorn's load, when each respects the other's tempo.",
      "2-10": "Two air signs and instant friends — inventive, quirky, intellectually electric, and allergic to clinginess. You give each other total freedom and a stream of new ideas; one of the zodiac's brightest mental matches.",
      "2-11": "Mutable air and mutable water — Gemini the thinker, Pisces the dreamer, both adaptable and imaginative. Neighbours who spark each other creatively; the work is turning all those ideas and feelings into something that holds.",
      "3-4": "Neighbouring Moon and Sun — Cancer nurtures, Leo shines. A warm, protective pairing: Leo brings confidence and generosity, Cancer brings devotion and a real home, when Leo's pride and Cancer's sensitivity are handled gently.",
      "3-5": "Water and earth, quietly devoted — both caretakers, you show love through practical, thoughtful acts. Virgo steadies Cancer's moods, Cancer softens Virgo's self-criticism; a nurturing, dependable, low-drama match.",
      "3-6": "Two cardinal signs who both want partnership but express it differently — Cancer through care, Libra through charm. It's a square, so tact matters, but a home full of beauty and warmth is possible when feeling and fairness align.",
      "3-7": "Two water signs, profoundly bonded — emotional, intuitive, and loyal to the bone. You read each other's depths instinctively and love fiercely; among the most devoted matches, once Scorpio's guardedness meets Cancer's tenderness.",
      "3-8": "Homebody water and wandering fire — Cancer wants closeness and roots, Sagittarius wants space and horizons. Different needs, but Sag brings adventure to Cancer's world and Cancer gives Sag a home worth returning to.",
      "3-9": "Opposite signs, the zodiac's parents — Cancer the nurturing home, Capricorn the providing structure. Deeply complementary: Cancer warms Capricorn, Capricorn secures Cancer; a classic build-a-life-together match.",
      "3-10": "Tender water and cool air — Cancer leads with emotion, Aquarius with logic and independence. A square that stretches both: Cancer teaches Aquarius warmth, Aquarius teaches Cancer perspective, if the emotional gap is respected.",
      "3-11": "Two water signs, gentle and intuitive — you feel each other completely and create a soft, romantic, deeply empathetic world. Cancer gives Pisces security, Pisces gives Cancer wonder; one of the tenderest matches going.",
      "4-5": "Fire and earth, star and stage manager — Leo dazzles, Virgo perfects. Neighbours who complement: Virgo quietly supports Leo's shine and Leo warms Virgo up, when Leo appreciates the help and Virgo eases the critique.",
      "4-6": "Fire and air, a glamorous pair — Leo the warm romantic, Libra the charming aesthete, both social and affectionate. You love beauty, romance, and being adored; a genuinely fun, flattering, harmonious match.",
      "4-7": "Two fixed signs, magnetic and intense — Leo blazes in the open, Scorpio smoulders underneath, both proud and fiercely loyal. Passion runs high, so does the will: this soars when you're allies and scorches when you clash.",
      "4-8": "Two fire signs, pure joy — Leo the performer, Sagittarius the adventurer, both generous, warm, and up for the big life. Endless fun, romance, and optimism; one of the zodiac's most naturally happy matches.",
      "4-9": "Warm fire and cool earth — Leo wants applause, Capricorn wants achievement. A square, but a power pairing: Leo brings heart and flair, Capricorn brings ambition and stability, and together you build something impressive.",
      "4-10": "Opposite signs and electric — Leo the radiant individual, Aquarius the visionary humanitarian, both fixed and strong-willed. Leo warms Aquarius, Aquarius broadens Leo; a fascinating attraction of heart and head.",
      "4-11": "Fire and water, showman and dreamer — Leo's warmth draws gentle Pisces out, Pisces's imagination enchants Leo. A romantic, creative pairing when Leo stays tender and Pisces bolsters Leo's heart.",
      "5-6": "Earth and air, neighbours with different loves — Virgo craves order, Libra craves harmony, both refined and considerate. Libra lightens Virgo's worry, Virgo grounds Libra's indecision; a polished, thoughtful match.",
      "5-7": "Earth and water, quietly powerful — both perceptive, private, and loyal, you build deep trust and shared purpose. Virgo's precision meets Scorpio's intensity beautifully; a devoted, mutually respectful match.",
      "5-8": "Precise earth and expansive fire — Virgo sweats the details, Sagittarius chases the big picture. A square, so patience helps, but Sag opens Virgo's horizons and Virgo grounds Sag's plans when they meet in the middle.",
      "5-9": "Two earth signs, a competent and devoted team — practical, ambitious, and grounded, you turn goals into results together. Virgo perfects, Capricorn builds; a stable, mutually admiring, get-things-done match.",
      "5-10": "Earthy Virgo and airy Aquarius, both cerebral but pointed differently — Virgo wants the workable, Aquarius the visionary. An offbeat combination that intrigues: Aquarius stretches Virgo's thinking, Virgo makes Aquarius's ideas real.",
      "5-11": "Opposite signs, service and compassion — Virgo the practical helper, Pisces the tender dreamer, each supplying what the other lacks. Virgo grounds Pisces, Pisces softens Virgo; a caring, healing opposites-attract match.",
      "6-7": "Air and water, neighbours with pull — Libra keeps it light and fair, Scorpio wants it deep and real. Libra charms Scorpio out of brooding, Scorpio gives Libra emotional substance, when surface meets depth respectfully.",
      "6-8": "Air feeds fire — sociable Libra and adventurous Sagittarius make a fun, easygoing, optimistic pair. Libra adds grace and partnership, Sag adds spark and freedom; a warm, harmonious, on-the-go match.",
      "6-9": "Two cardinal signs, charm meets ambition — Libra smooths the room, Capricorn builds the empire. A square, but complementary: Libra brings people skills, Capricorn brings structure, once tact and drive learn to share the lead.",
      "6-10": "Two air signs, an easy meeting of minds — social, fair-minded, idea-driven, and cool-headed. You share values and conversation effortlessly and give each other space; a naturally harmonious, friendship-first match.",
      "6-11": "Airy Libra and watery Pisces, both gentle romantics drawn to beauty and softness. A dreamy, artistic pairing; the shared challenge is that neither one loves confrontation or hard decisions.",
      "7-8": "Deep water and free fire — Scorpio wants intensity and loyalty, Sagittarius wants freedom and fun. Neighbours who intrigue each other: Sag lightens Scorpio, Scorpio deepens Sag, once jealousy and restlessness are managed.",
      "7-9": "Water and earth, a formidable and loyal alliance — both strategic, determined, and private, you trust slowly and commit deeply. Scorpio brings passion, Capricorn brings steadiness; a quietly powerful, ambitious match.",
      "7-10": "Two fixed signs, intense and unconventional — Scorpio craves depth and merging, Aquarius craves freedom and distance. A square of strong wills; magnetic and challenging, it works when independence and intimacy strike a truce.",
      "7-11": "Two water signs, soulmate territory — Scorpio's depth and Pisces's imagination merge into an intuitive, all-in bond. Scorpio protects tender Pisces, Pisces softens guarded Scorpio; profoundly emotional and devoted.",
      "8-9": "Free fire and structured earth — Sag chases the horizon, Capricorn builds the base. Neighbours who balance each other: Capricorn turns Sag's dreams into plans, Sag loosens Capricorn up, when tempo and priorities are negotiated.",
      "8-10": "Fire and air, freedom-loving originals — Sag the adventurer, Aquarius the visionary, both independent, open-minded, and allergic to control. Big ideas, big trips, and easy space; a stimulating, friendship-based match.",
      "8-11": "Two mutable signs lit by Jupiter's optimism — Sag the seeker, Pisces the dreamer, both idealistic and adaptable. A square, but inspiring: Sag brings adventure, Pisces brings soul, when bluntness meets sensitivity kindly.",
      "9-10": "Traditional earth and radical air — Capricorn respects structure, Aquarius rewrites it. Neighbours once both ruled by Saturn: Capricorn grounds Aquarius's vision, Aquarius modernizes Capricorn's plans, as long as both stay open.",
      "9-11": "Earth and water, a gentle-strong pairing — Capricorn provides security and direction, Pisces provides tenderness and imagination. Cap grounds Pisces's dreams, Pisces warms Cap's world; a quietly complementary match.",
      "10-11": "Air and water, neighbours and idealists — Aquarius dreams for humanity, Pisces feels for the individual. A creative, compassionate pairing: Aquarius gives Pisces perspective, Pisces gives Aquarius heart, across the head-and-heart gap."
    };

    // Short element descriptor per sign (varies by element → helps differentiate).
    const elAdj = {
      Fire: "fiery drive and spontaneity",
      Earth: "grounded, practical steadiness",
      Air: "quick ideas and social ease",
      Water: "deep feeling and intuition"
    };
    // Relationship clause per unordered element pair — 2 variants each, chosen by
    // the pair so two same-element couples don't read identically.
    const relClause = {
      "Fire-Fire": ["a shared flame that sparks and races", "two fires that keep each other burning bright"],
      "Earth-Earth": ["a solid, sensual base built to last", "two steady hands building something real"],
      "Air-Air": ["a restless, idea-swapping current between you", "two lively minds forever in conversation"],
      "Water-Water": ["two deep wells of feeling that mirror each other", "an intuitive tide you both move with"],
      "Earth-Fire": ["drive meeting substance once the pace is shared", "spark and staying-power, if you sync your speeds"],
      "Air-Fire": ["a naturally energizing mix, since air feeds fire", "ideas fanning the flames into real momentum"],
      "Fire-Water": ["the classic heat-and-depth blend of passion and feeling", "steam when it's good, a balance of fire and tide when it's not"],
      "Air-Earth": ["the practical shaking hands with the theoretical", "big thinking finding solid ground to stand on"],
      "Earth-Water": ["a nurturing mix, feeling finding a safe, steady shore", "roots and rain — one steadies, one softens"],
      "Air-Water": ["head meeting heart, with a little translation", "thought and emotion learning each other's language"]
    };
    const modClause = {
      "Cardinal-Cardinal": ["both of you love to start and to lead", "two initiators who set things in motion"],
      "Fixed-Fixed": ["both of you are loyal, committed, and delightfully stubborn", "two fixed hearts that stay the course"],
      "Mutable-Mutable": ["both of you bend and adapt with ease", "two flexible spirits who flow around trouble"],
      "Cardinal-Fixed": ["one of you starts, the other sustains", "an initiator paired with a stabilizer"],
      "Cardinal-Mutable": ["one of you launches, the other adapts", "a leader paired with a natural improviser"],
      "Fixed-Mutable": ["one of you holds steady while the other bends", "an anchor paired with a free-flowing current"]
    };
    const aspectGoodV = {
      0: ["share the same sign's wavelength — a conjunction of instant, built-in understanding", "meet at a conjunction, so you simply get each other from the start"],
      1: ["sit side by side on the wheel — different speeds, but plenty to teach each other", "are next-door neighbours, close enough to learn each other's rhythm"],
      2: ["form a sextile — a friendly, easy angle where attraction comes naturally", "sit at a supportive sextile, an angle that just clicks"],
      3: ["form a square — a high-energy angle that keeps the passion switched on", "meet at a square, the aspect that generates heat and drive"],
      4: ["form a trine — the most harmonious angle in astrology, all ease and flow", "sit at a trine, so comfort and understanding come effortlessly"],
      5: ["form a quincunx — an offbeat angle that grows through curiosity", "meet at a quincunx, an intriguing angle that rewards adjustment"],
      6: ["sit in opposition — the axis of attraction, each the other's missing half", "face each other across the wheel, opposites with real magnetic pull"]
    };
    const elClashV = {
      "Fire-Water": ["blunt fire can scald tender feelings, and heavy moods can dampen the spark", "the heat-and-water gap means pace and gentleness matter a lot"],
      "Earth-Fire": ["one of you races while the other wants caution — agree on a tempo", "impatience versus prudence can grind unless you meet in the middle"],
      "Air-Earth": ["one wants the concrete, the other the abstract — you can talk past each other", "practical versus theoretical can feel like two different channels"],
      "Air-Water": ["one rationalizes while the other feels — give feelings airtime and logic patience", "head and heart need a translator when things get tense"],
      "Fire-Fire": ["two fires can burn hot — tempers and competition need an outlet", "so much heat between you that egos need somewhere to go"],
      "Earth-Earth": ["two steady natures can settle into a rut — schedule novelty on purpose", "comfort can tip into stagnation without a nudge"],
      "Air-Air": ["two heads can over-think — remember to land the decisions and the feelings", "all talk and no landing is the trap to avoid"],
      "Water-Water": ["two deep feelers can drown in shared moods — keep a line to the surface", "emotions can flood the room unless one of you stays anchored"]
    };
    const modClashV = {
      "Cardinal-Cardinal": ["as two initiators, watch for a quiet tug-of-war over who's in charge", "both wanting to lead can turn into a subtle power struggle"],
      "Fixed-Fixed": ["as two fixed signs, neither of you loves being first to bend", "two stubborn streaks mean compromise takes real effort"],
      "Mutable-Mutable": ["as two adaptable signs, you can drift without a firm plan", "all that flexibility needs one of you to hold the anchor"]
    };

    const scoreByDist = { 0: 82, 1: 64, 2: 88, 3: 66, 4: 92, 5: 62, 6: 84 };
    const label = (s) => s >= 88 ? "Excellent" : s >= 78 ? "Strong" : s >= 68 ? "Promising" : "Takes real work";

    /* ---- screens ---- */
    function intro() {
      root.innerHTML = `
        <div class="quiz quiz-intro">
          <div class="quiz-badges">
            <span class="quiz-badge">☉ All 12 signs</span>
            <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
          </div>
          <h2>Check any two signs for compatibility</h2>
          <p class="quiz-lede"><strong>Completely FREE zodiac compatibility check. No signup, no email, no credit card. Instant results for any two signs, no catch.</strong></p>
          <p>Pick your sign (or enter a birthday and we'll find it), do the same for your partner, and get an in-depth breakdown of the good ways your signs work together — plus a few honest things to watch for.</p>
          <div class="zodiac-input">
            ${sidePicker("a", "You")}
            ${sidePicker("b", "Your partner")}
          </div>
          <div class="actions"><button class="button primary" id="reveal">Reveal our compatibility →</button></div>
          <p id="z-error" class="error" hidden></p>
          <h3>A little about each sign</h3>
          <div class="zodiac-grid">
            ${signs.map((s) => `
              <div class="sign-card">
                ${glyphs[s.key]}
                <h4>${esc(s.name)}</h4>
                <span class="sign-dates">${esc(s.dates)}</span>
                <span class="sign-el">${esc(s.el)} · ${esc(s.mod)}</span>
                <p>${esc(s.blurb)}</p>
              </div>`).join("")}
          </div>
        </div>`;
      wireSide("a");
      wireSide("b");
      root.querySelector("#reveal").onclick = reveal;
    }

    function sidePicker(side, title) {
      return `
        <div class="zodiac-side" data-side="${side}">
          <h3>${esc(title)}</h3>
          <div class="zodiac-mode">
            <button type="button" class="on" data-mode="sign">By sign</button>
            <button type="button" data-mode="date">By birthday</button>
          </div>
          <div class="field" data-panel="sign">
            <label for="z-sign-${side}">Star sign</label>
            <select id="z-sign-${side}">
              <option value="">Choose a sign…</option>
              ${signs.map((s) => `<option value="${s.key}">${esc(s.name)} (${esc(s.dates)})</option>`).join("")}
            </select>
          </div>
          <div class="field" data-panel="date" hidden>
            <label for="z-date-${side}">Date of birth</label>
            <input type="date" id="z-date-${side}">
            <small>We only use the month and day to find the sign. Nothing is saved.</small>
          </div>
        </div>`;
    }

    function wireSide(side) {
      const wrap = root.querySelector(`.zodiac-side[data-side="${side}"]`);
      wrap.querySelectorAll(".zodiac-mode button").forEach((b) => {
        b.onclick = () => {
          wrap.querySelectorAll(".zodiac-mode button").forEach((x) => x.classList.toggle("on", x === b));
          wrap.querySelector('[data-panel="sign"]').hidden = b.dataset.mode !== "sign";
          wrap.querySelector('[data-panel="date"]').hidden = b.dataset.mode !== "date";
        };
      });
    }

    function readSide(side) {
      const wrap = root.querySelector(`.zodiac-side[data-side="${side}"]`);
      const mode = wrap.querySelector(".zodiac-mode button.on").dataset.mode;
      if (mode === "sign") {
        const v = wrap.querySelector(`#z-sign-${side}`).value;
        return v || null;
      }
      const dv = wrap.querySelector(`#z-date-${side}`).value; // YYYY-MM-DD
      if (!dv) return null;
      const parts = dv.split("-");
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (!month || !day) return null;
      return signFromDate(month, day);
    }

    function reveal() {
      const err = root.querySelector("#z-error");
      const a = readSide("a");
      const b = readSide("b");
      if (!a || !b) {
        err.textContent = "Please choose a sign or enter a birthday on both sides.";
        err.hidden = false;
        return;
      }
      results(a, b);
    }

    function results(keyA, keyB) {
      const i = idx[keyA];
      const j = idx[keyB];
      const A = signs[i];
      const B = signs[j];
      const dist = Math.min(Math.abs(i - j), 12 - Math.abs(i - j));
      const score = scoreByDist[dist];

      const note = pairNote[`${Math.min(i, j)}-${Math.max(i, j)}`] || "";
      const elKey = [A.el, B.el].sort().join("-");
      const modKey = [A.mod, B.mod].sort().join("-");
      // Deterministic per-pair variant picker so same-category couples diverge.
      const pick = (arr) => arr[(i * 7 + j * 3) % arr.length];

      const elText = `${A.name} brings ${elAdj[A.el]}, ${B.name} ${elAdj[B.el]} — ${pick(relClause[elKey])}.`;
      const modText = i === j
        ? `And as two ${A.mod.toLowerCase()} signs, ${pick(modClause[modKey])}.`
        : `On top of that, ${pick(modClause[modKey])} — ${A.name} is ${A.mod.toLowerCase()}, ${B.name} is ${B.mod.toLowerCase()}.`;
      const aspectGood = `${A.name} and ${B.name} ${pick(aspectGoodV[dist])}.`;

      const gifts = i === j
        ? `<li>You both bring the same gift — ${esc(A.gift)} — which makes for deep mutual understanding.</li>`
        : `<li><strong>${esc(A.name)}</strong> offers <strong>${esc(B.name)}</strong> ${esc(A.gift)}.</li>
           <li><strong>${esc(B.name)}</strong> offers <strong>${esc(A.name)}</strong> ${esc(B.gift)}.</li>`;

      // Watch-outs: element clash + modality clash + aspect note, named, brief.
      const watch = [];
      if (elClashV[elKey]) watch.push(`${A.name} and ${B.name}: ${pick(elClashV[elKey])}.`);
      if (modClashV[modKey]) watch.push(`${pick(modClashV[modKey]).replace(/^as /, "As ")}.`);
      if (dist === 3) watch.push(`As a square, the chemistry is real, but ${A.name} and ${B.name} only turn friction into growth by working at it.`);
      else if (dist === 6) watch.push(`As opposites, ${A.name} and ${B.name} complete each other — but can amplify each other's extremes if you stop meeting in the middle.`);
      else if (dist === 1 || dist === 5) watch.push(`${A.name} and ${B.name} are wired quite differently, so small misunderstandings need patience and translation.`);
      if (watch.length === 0) watch.push(`Even an easy match like ${A.name} and ${B.name} can coast — keep choosing each other on purpose.`);
      const watchTop = watch.slice(0, 3);

      root.innerHTML = `
        <div class="quiz quiz-results">
          <p class="eyebrow">Your compatibility</p>
          <div class="match-hero">
            <div style="text-align:center">${glyphs[A.key]}<div class="sign-mini">${esc(A.name)}</div></div>
            <div class="match-score">${score}%<small>${esc(label(score))} match</small></div>
            <div style="text-align:center">${glyphs[B.key]}<div class="sign-mini">${esc(B.name)}</div></div>
          </div>
          <p class="match-meta">${esc(A.name)} (${esc(A.el)}, ${esc(A.mod)}) &amp; ${esc(B.name)} (${esc(B.el)}, ${esc(B.mod)})</p>
          <p class="match-lead">${esc(note)}</p>
          <h3>Why the chemistry works</h3>
          <p>${esc(elText)} ${esc(modText)}</p>
          <h3>The good ways you work together</h3>
          <ul class="q-list good-list">
            ${gifts}
            <li>${esc(aspectGood)}</li>
          </ul>
          <h3>A few things to watch</h3>
          <ul class="q-list watch-list">${watchTop.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
          <div class="quiz-note">
            <strong>Take it lightly</strong>
            <p>Sun-sign compatibility is a fun lens, not a rulebook. A full astrological picture involves far more than two birthdays, and any two people can make it work — or not — regardless of their signs. Enjoy it for what it is.</p>
          </div>
          ${shareBar()}
          <div class="actions">
            <button class="button primary" id="again">Try another pairing</button>
          </div>
          <p class="quiz-share-note">Nothing was uploaded or saved — this all runs in your browser.</p>
        </div>`;
      wireShare(`${A.name} + ${B.name} = ${score}% compatibility (${label(score)} match) 💫 Check your zodiac pairing free:`);
      root.querySelector("#again").onclick = () => { intro(); root.scrollIntoView({ block: "start", behavior: "smooth" }); };
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    intro();
  }

  /* =====================================================================
   *  TYPING SPEED TEST (WPM)
   *  Live WPM + accuracy typing test. All words are an original common-word
   *  pool assembled for this site. Runs entirely in the browser; nothing is
   *  saved or uploaded. Timer starts on the first keystroke.
   * ===================================================================== */
  function renderTypingTest() {
    /* ---- device: a coarse pointer on a narrow screen ⇒ treat as a phone ---- */
    const isMobile = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches) && window.innerWidth < 900;

    /* ---- desktop pool of common English words (assembled for this site) ---- */
    const DESKTOP_WORDS = (
      "the of and to in is it you that he was for on are with as his they at be this " +
      "from or one had by word but not what all were when we there can an your which " +
      "their said each she do how if will up other about out many then them these so " +
      "some her would make like him into time has look two more write go see number no " +
      "way could people my than first water been call who now find long down day did get " +
      "come made may part over new sound take only little work know place year live me " +
      "back give most very after thing our just name good sentence man think say great " +
      "where help through much before line right too mean old any same tell boy follow " +
      "came want show also around form three small set put end does another well large " +
      "must big even such because turn here why ask went men read need land different " +
      "home us move try kind hand picture again change off play spell air away animal " +
      "house point page letter mother answer found study still learn should world high " +
      "every near add food between own below country plant last school father keep tree " +
      "never start city earth eye light thought head under story saw left don't few " +
      "while along might close something seem next hard open example begin life always " +
      "those both paper together got group often run important until children side feet " +
      "car mile night walk white sea began grow took river four carry state once book " +
      "hear stop without second later miss idea enough eat face watch far really almost " +
      "above girl sometimes mountain cut young talk soon list song being leave family " +
      "money story point since power human water travel market office reason common simple " +
      "morning window garden street summer winter market coffee travel picture history nature"
    ).trim().split(/\s+/);

    /* ---- mobile pool: shorter, thumb-friendly words for two-thumb typing ---- */
    const MOBILE_WORDS = (
      "the and you for are was but not all any can had her him his how man may new now " +
      "old one our out own put say she too two use way who why yet get got let big red " +
      "run top box car cat dog day end eye far few fun job key kid lot map pay set sit " +
      "sun ten yes ago air arm art ask bad bag bed bit boy bus buy cup cut ear eat egg " +
      "fit fix fly fog gas gun hat hit hot ice ink jam law leg lie low mad mix mud net " +
      "nod oil pan pen pet pie pig pin pot raw rib rid row rub rug sad saw sea sky spy " +
      "tea tie tip toe toy try van war wax web wet win zip good time work make like here " +
      "from this that they them then some what when very just take give last next well"
    ).trim().split(/\s+/);

    const WORDS = isMobile ? MOBILE_WORDS : DESKTOP_WORDS;

    /* ---- original short practice lines for Quote mode (written for this site) ---- */
    const QUOTES = [
      "a calm mind and loose hands will always type faster than a rushed one",
      "speed is simply what happens on its own once your fingers stop searching for the keys",
      "small daily practice will beat a single long session almost every single time",
      "put accuracy first and the speed will quietly follow along behind it",
      "the keyboard never moves so let your hands learn exactly where each key lives",
      "every fast typist you have ever admired was once slow and simply refused to stop",
      "keep your eyes on the screen and trust that the letters are still where you left them",
      "a steady rhythm will carry you much further than a frantic burst that quickly fades",
      "type the word you actually see and not the word you expect and your errors will shrink",
      "progress feels boring up close but it adds up faster than you would ever think"
    ];

    const NUM_TOKENS = ["3", "7", "9", "12", "21", "40", "64", "95", "100", "256", "2026", "18", "5", "8"];

    /* ---- selectable settings ---- */
    let testType = "time";                 // "time" | "words" | "quote"
    let timeSeconds = isMobile ? 30 : 60;  // used when testType === "time"
    let wordCount = 25;                     // used when testType === "words"
    let punctuation = false;
    let numbers = false;
    const TIME_OPTS = [15, 30, 60, 120, 300];
    const WORD_OPTS = [10, 25, 50, 100];
    const timeLabel = (s) => (s >= 60 ? `${s / 60} min` : `${s}s`);
    const isTimed = () => testType === "time";

    /* ---- per-run state / teardown ---- */
    let target = "";        // the passage string
    let typed = "";         // what the user has entered so far
    let prevVal = "";       // previous input value, for common-prefix diffing
    let correctChars = 0;   // keystroke-based: correct chars ever committed
    let totalTyped = 0;     // keystroke-based: total chars ever committed (no decrement on backspace)
    let startTime = null;   // performance.now() at first keystroke
    let active = false;     // true only during the live typing phase
    let rafId = null;       // requestAnimationFrame handle for the live stat loop
    let endTimer = null;    // setTimeout that ends a timed run
    let input = null;       // the (real, on-screen) input element
    let onResize = null;    // full-width stage re-measure, removed on teardown
    let samples = [];       // instantaneous net WPM sampled each ~second (for the graph)
    let lastSampleT = 0;    // performance.now() of the last sample boundary
    let lastSampleCorrect = 0;
    let keyHandler = null;  // document-level keydown for the results screen
    const onBlur = () => { if (active && input) setTimeout(() => { if (active && input) input.focus(); }, 0); };

    function teardown() {
      active = false;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      if (endTimer !== null) { clearTimeout(endTimer); endTimer = null; }
      if (onResize) { window.removeEventListener("resize", onResize); onResize = null; }
      if (input) { input.removeEventListener("blur", onBlur); }
      if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
      input = null;
    }

    /* ---- passage building ---- */
    function drawWords(n) {
      const out = [];
      let bag = [];
      for (let i = 0; i < n; i++) {
        if (bag.length === 0) bag = shuffle(WORDS);
        out.push(bag.pop());
      }
      return out;
    }
    function withNumbers(words) {
      return words.map((w, i) => (i > 0 && i % 6 === 0) ? NUM_TOKENS[Math.floor(Math.random() * NUM_TOKENS.length)] : w);
    }
    function withPunctuation(words) {
      let cap = true, since = 0;
      const out = words.map((w, i) => {
        let s = cap ? w.charAt(0).toUpperCase() + w.slice(1) : w;
        cap = false;
        since++;
        const last = i === words.length - 1;
        if (!last && since >= 3 && Math.random() < 0.12) s += ",";
        else if (!last && since >= 6 && Math.random() < 0.28) { s += (Math.random() < 0.15 ? "?" : "."); since = 0; cap = true; }
        return s;
      });
      out[out.length - 1] = out[out.length - 1].replace(/[.,?!]$/, "") + ".";
      return out;
    }
    function buildPassage() {
      if (testType === "quote") return QUOTES[Math.floor(Math.random() * QUOTES.length)];
      // Size a timed passage so even a fast typist won't run out; word mode is exact.
      const n = isTimed()
        ? Math.max(30, Math.round(timeSeconds * (isMobile ? 1.6 : 2.6)) + 20)
        : wordCount;
      let words = drawWords(n);
      if (numbers) words = withNumbers(words);
      if (punctuation) words = withPunctuation(words);
      return words.join(" ");
    }

    const round1 = (n) => Math.round(n * 10) / 10;
    const chip = (label, on, attrs) => `<button type="button" class="button typing-mode${on ? " on" : ""}" ${attrs}>${esc(label)}</button>`;

    /* ---- inline SVG sparkline of net WPM across the run ---- */
    function sparkline(series) {
      const n = series.length;
      const maxY = Math.max(10, ...series) * 1.12;
      const pts = series.map((v, i) => {
        const x = n === 1 ? 0 : (i / (n - 1)) * 100;
        const y = 40 - Math.max(0, Math.min(38, (v / maxY) * 38));
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      });
      const line = pts.join(" ");
      return `<svg class="wpm-graph-svg" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Net words per minute over the run">
        <polygon class="wpm-graph-fill" points="0,40 ${line} 100,40"></polygon>
        <polyline class="wpm-graph-line" points="${line}"></polyline>
      </svg>`;
    }

    /* ---- shareable result card, drawn on a canvas (1200×630, OG proportions) ---- */
    function roundRect(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function drawCertificate({ netWpm, accuracy, band, mobile }) {
      const W = 1200, H = 630, c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#101b24"); grad.addColorStop(1, "#0b1118");
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
      const m = 40;
      roundRect(g, m, m, W - 2 * m, H - 2 * m, 28);
      g.strokeStyle = "#2dd4bf"; g.lineWidth = 3; g.stroke();
      roundRect(g, m, m, W - 2 * m, 12, 6); g.fillStyle = "#2dd4bf"; g.fill();
      g.textAlign = "left";
      g.fillStyle = "#2dd4bf";
      g.font = "700 34px Georgia, 'Times New Roman', serif";
      g.fillText("NIFTY UTILITIES", 92, 152);
      g.fillStyle = "#8b98a5";
      g.font = "600 26px Arial, Helvetica, sans-serif";
      g.fillText(mobile ? "FREE MOBILE TYPING TEST" : "FREE TYPING SPEED TEST", 92, 196);
      g.textAlign = "center";
      g.fillStyle = "#e6edf3";
      g.font = "800 240px Georgia, 'Times New Roman', serif";
      g.fillText(String(netWpm), W / 2, 440);
      g.fillStyle = "#2dd4bf";
      g.font = "700 40px Arial, Helvetica, sans-serif";
      g.fillText("NET WORDS PER MINUTE", W / 2, 498);
      g.fillStyle = "#cbd5e1";
      g.font = "400 34px Arial, Helvetica, sans-serif";
      g.fillText(`${band}  ·  ${accuracy} accuracy`, W / 2, 552);
      g.fillStyle = "#6b7885";
      g.font = "400 26px Arial, Helvetica, sans-serif";
      g.fillText("niftyutilities.com/quizzes/typing-speed-test.html", W / 2, 594);
      return c;
    }

    /* ---- progress store: best score + recent runs, kept only in this browser's
     * localStorage so runs can be compared over time. Nothing is ever uploaded.
     * Bucketed by device because phone and keyboard scores aren't comparable. ---- */
    const STORE_KEY = "nu_typing_v1";
    const deviceKey = isMobile ? "mobile" : "desktop";
    function loadStore() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { return {}; }
    }
    function saveStore(obj) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); return true; } catch (_) { return false; }
    }

    /* ---- intro / setup screen ---- */
    function intro() {
      teardown();
      const typeChips = [
        chip("Time", testType === "time", 'data-type="time"'),
        chip("Words", testType === "words", 'data-type="words"'),
        chip("Quote", testType === "quote", 'data-type="quote"')
      ].join("");
      let lengthChips = "";
      if (testType === "time") lengthChips = TIME_OPTS.map((s) => chip(timeLabel(s), s === timeSeconds, `data-secs="${s}"`)).join("");
      else if (testType === "words") lengthChips = WORD_OPTS.map((w) => chip(`${w} words`, w === wordCount, `data-words="${w}"`)).join("");
      const toggleChips = testType === "quote" ? "" :
        chip("Punctuation", punctuation, 'data-toggle="punctuation"') + chip("Numbers", numbers, 'data-toggle="numbers"');

      const mobileNote = isMobile ? `
          <div class="quiz-note">
            <strong>📱 This is a mobile typing test</strong>
            <p>You're on a phone, so this measures <b>two-thumb</b> typing — expect a lower number than a full keyboard, and that's completely normal. Your result is compared against other phone typists, not desktop ones. If your keyboard's autocorrect or predictive text rewrites your words, switch it off for the truest score.</p>
          </div>` : `
          <div class="quiz-note">
            <strong>How to get an accurate result</strong>
            <p>Use a real keyboard if you can, keep your eyes on the screen, and don't worry about the odd typo — fixing it with backspace is fine. Autocorrect and auto-capitalisation are turned off so what you type is exactly what is measured.</p>
          </div>`;

      root.innerHTML = `
        <div class="quiz quiz-intro">
          <div class="quiz-badges">
            <span class="quiz-badge time">⌨️ Live WPM &amp; accuracy</span>
            ${isMobile ? `<span class="quiz-badge">📱 Mobile two-thumb test</span>` : `<span class="quiz-badge">Time · Words · Quote</span>`}
            <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
          </div>
          <h2>${isMobile ? "A free mobile typing test" : "A free typing speed test"}</h2>
          <p class="quiz-lede"><strong>Completely FREE Typing Speed Test. No signup, no email, no credit card. Instant results, no catch.</strong></p>
          <p>Type the passage as fast and as accurately as you can. Your <strong>words per minute</strong> and <strong>accuracy</strong> update live, and the timer only starts on your first keystroke. Your keystrokes are never uploaded or seen by us — only your best score is saved in this browser so you can track your progress.</p>
          <div class="typing-setup">
            <div class="typing-setup-row"><span class="typing-setup-label">Test</span><div class="typing-modes" role="group" aria-label="Test type">${typeChips}</div></div>
            ${lengthChips ? `<div class="typing-setup-row"><span class="typing-setup-label">Length</span><div class="typing-modes" role="group" aria-label="Length">${lengthChips}</div></div>` : ""}
            ${toggleChips ? `<div class="typing-setup-row"><span class="typing-setup-label">Extras</span><div class="typing-modes" role="group" aria-label="Extras">${toggleChips}</div></div>` : ""}
          </div>
          ${mobileNote}
          <div class="actions"><button class="button primary" id="start">Start typing →</button></div>
        </div>`;

      // Re-render the setup on any change so the contextual controls stay in sync.
      root.querySelectorAll("[data-type]").forEach((b) => b.onclick = () => { testType = b.dataset.type; intro(); });
      root.querySelectorAll("[data-secs]").forEach((b) => b.onclick = () => { timeSeconds = Number(b.dataset.secs); intro(); });
      root.querySelectorAll("[data-words]").forEach((b) => b.onclick = () => { wordCount = Number(b.dataset.words); intro(); });
      root.querySelectorAll("[data-toggle]").forEach((b) => b.onclick = () => {
        if (b.dataset.toggle === "punctuation") punctuation = !punctuation; else numbers = !numbers;
        intro();
      });
      root.querySelector("#start").onclick = () => startTest();
    }

    /* ---- typing phase ---- */
    function startTest() {
      teardown();
      target = buildPassage();
      typed = "";
      prevVal = "";
      correctChars = 0;
      totalTyped = 0;
      startTime = null;
      samples = [];
      lastSampleT = 0;
      lastSampleCorrect = 0;
      active = true;

      const clockInit = isTimed() ? `${timeSeconds}.0s` : "0.0s";
      const catLabel = isMobile ? "Mobile typing test" : "Typing speed test";

      root.innerHTML = `
        <div class="quiz quiz-question typing-live">
          <div class="quiz-topbar">
            <span class="quiz-cat">${catLabel}</span>
            <span class="quiz-timer-wrap">⏱ <span id="typing-clock">${clockInit}</span></span>
          </div>
          <div class="typing-stats">
            <div class="typing-stat"><strong id="typing-wpm">0</strong><span>WPM</span></div>
            <div class="typing-stat"><strong id="typing-acc">100%</strong><span>Accuracy</span></div>
            <div class="typing-stat"><strong id="typing-chars">0</strong><span>Characters</span></div>
          </div>
          <div class="typing-stage" id="typing-stage">
            <div class="typing-passage" id="typing-passage" aria-hidden="true">${renderPassage("")}</div>
            <input id="typing-input" class="typing-input" type="text" inputmode="text"
              autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
              aria-label="Type the passage shown above" />
          </div>
          <p class="typing-hint" id="typing-hint">Start typing to begin${isTimed() ? " the timer" : ""}.<span class="typing-kbd-hint">Tab restarts · Esc for settings</span></p>
          <div class="actions">
            <button class="button" id="typing-restart">Restart</button>
            <button class="button" id="typing-settings">Change settings</button>
          </div>
        </div>`;

      input = root.querySelector("#typing-input");
      const stage = root.querySelector("#typing-stage");
      // Stretch the stage to the full viewport width. Measured rather than done
      // with a 50vw margin trick because the sidebar leaves the content column
      // off viewport-center, and clientWidth sidesteps the scrollbar overhang.
      const fitStage = () => {
        stage.style.marginLeft = "0px";
        stage.style.width = "";
        const left = stage.getBoundingClientRect().left;
        stage.style.marginLeft = `${-left}px`;
        stage.style.width = `${document.documentElement.clientWidth}px`;
      };
      fitStage();
      onResize = fitStage;
      window.addEventListener("resize", onResize);
      // Clicking anywhere in the stage refocuses the input so keystrokes are never lost.
      stage.onclick = () => { if (active && input) input.focus(); };
      input.addEventListener("blur", onBlur);
      input.addEventListener("paste", (e) => e.preventDefault());
      input.addEventListener("input", onInput);
      // Keyboard shortcuts, scoped to the input so the rest of the page's Tab
      // navigation is untouched. Tab = fresh passage, Esc = back to settings.
      input.addEventListener("keydown", (e) => {
        if (e.key === "Tab") { e.preventDefault(); startTest(); }
        else if (e.key === "Escape") { e.preventDefault(); intro(); }
      });
      root.querySelector("#typing-restart").onclick = () => startTest();
      root.querySelector("#typing-settings").onclick = () => intro();

      // Auto-focus synchronously (this call is what raises the mobile keyboard).
      input.focus();
    }

    /* ---- per-character passage markup ---- */
    // Each word's character spans are grouped in an unbreakable .tw chunk and
    // spaces are real spaces between chunks, so lines wrap only at word
    // boundaries — a word is never split across two lines.
    function renderPassage(current) {
      let html = "";
      let word = "";
      const flushWord = () => { if (word) { html += `<span class="tw">${word}</span>`; word = ""; } };
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        let cls = "tc";
        let id = "";
        if (i < current.length) {
          cls += current[i] === ch ? " tc-ok" : " tc-bad";
        } else if (i === current.length) {
          cls += " tc-cur";
          id = ' id="tc-cursor"';
        }
        const span = `<span class="${cls}"${id}>${ch === " " ? " " : esc(ch)}</span>`;
        if (ch === " ") { flushWord(); html += span; }
        else word += span;
      }
      flushWord();
      return html;
    }

    /* ---- input handler (keystroke accounting) ---- */
    function onInput() {
      if (!active) return;
      let val = input.value;
      // Never let the user type past the passage length.
      if (val.length > target.length) { val = val.slice(0, target.length); input.value = val; }

      if (startTime === null && val.length > 0) {
        startTime = performance.now();
        lastSampleT = startTime;
        lastSampleCorrect = 0;
        const hint = document.getElementById("typing-hint");
        if (hint) hint.textContent = isTimed() ? "Timer running — keep going!" : "Go — finish the passage!";
        // A timed run ends on the clock; word/quote runs end when the passage is done.
        if (isTimed()) endTimer = window.setTimeout(() => finish(true), timeSeconds * 1000);
        loop();
      }

      // Score by common-prefix diff: every character from the first point where
      // the value diverges from the previous value is treated as newly entered
      // this event. This catches autocorrect / IME replacements that rewrite
      // earlier characters without growing the length (so the tally can never
      // drift from the on-screen highlighting, which is redrawn from the same
      // value). Deletions add nothing and never decrement — "backspace can't
      // erase a mistake".
      let cp = 0;
      const m = Math.min(prevVal.length, val.length);
      while (cp < m && prevVal[cp] === val[cp]) cp++;
      for (let i = cp; i < val.length; i++) {
        totalTyped += 1;
        if (val[i] === target[i]) correctChars += 1;
      }
      prevVal = val;
      typed = val;

      // Re-render highlighting.
      const passage = document.getElementById("typing-passage");
      if (passage) {
        passage.innerHTML = renderPassage(typed);
        // Keep the active line pinned one line from the top of the window, so
        // finishing a line scrolls the text up and the upcoming lines are
        // always in view — the cursor never reaches the bottom edge.
        const cursor = document.getElementById("tc-cursor");
        if (cursor) {
          const anchor = cursor.parentElement && cursor.parentElement.classList.contains("tw")
            ? cursor.parentElement : cursor;
          const lineH = parseFloat(getComputedStyle(passage).lineHeight) || 36;
          const want = Math.max(0, anchor.offsetTop - lineH);
          if (Math.abs(passage.scrollTop - want) > 1) passage.scrollTop = want;
        }
      }

      updateStats();
      maybeSample();

      // Finish early if the whole passage has been typed.
      if (typed.length >= target.length) finish(false);
    }

    /* ---- live stat loop (rAF) ---- */
    function loop() {
      if (!active) return;
      updateStats();
      const now = performance.now();
      const clock = document.getElementById("typing-clock");
      if (clock && startTime !== null) {
        const elapsed = (now - startTime) / 1000;
        if (isTimed()) {
          const left = Math.max(0, timeSeconds - elapsed);
          clock.textContent = `${left.toFixed(1)}s`;
          if (left <= 5) clock.classList.add("low");
        } else {
          clock.textContent = `${elapsed.toFixed(1)}s`;
        }
      }
      maybeSample();
      rafId = requestAnimationFrame(loop);
    }

    // Sample the instantaneous net WPM once per whole second elapsed, for the
    // post-run graph and consistency score. Called from both the rAF loop and
    // each keystroke so samples still accumulate if rAF is throttled (e.g. a
    // backgrounded tab).
    function maybeSample() {
      if (startTime === null) return;
      const now = performance.now();
      if (samples.length < Math.floor((now - startTime) / 1000)) {
        const dtMin = (now - lastSampleT) / 60000;
        const inst = dtMin > 0 ? ((correctChars - lastSampleCorrect) / 5) / dtMin : 0;
        // Cap at a humanly-possible ceiling so a burst landing in a tiny interval
        // can't spike the y-scale or tank the consistency score.
        samples.push(Math.max(0, Math.min(400, Math.round(inst))));
        lastSampleT = now;
        lastSampleCorrect = correctChars;
      }
    }

    function currentWpm() {
      if (startTime === null) return { net: 0, raw: 0, minutes: 0 };
      const minutes = (performance.now() - startTime) / 60000;
      // Suppress the divide-by-near-zero spike on the very first keystrokes.
      if (minutes < 1 / 600) return { net: 0, raw: 0, minutes };
      return {
        net: (correctChars / 5) / minutes,
        raw: (totalTyped / 5) / minutes,
        minutes
      };
    }

    function updateStats() {
      const { net } = currentWpm();
      const wpmEl = document.getElementById("typing-wpm");
      const accEl = document.getElementById("typing-acc");
      const charsEl = document.getElementById("typing-chars");
      if (wpmEl) wpmEl.textContent = String(Math.round(net));
      if (accEl) accEl.textContent = totalTyped === 0 ? "100%" : pct((correctChars / totalTyped) * 100);
      if (charsEl) charsEl.textContent = String(correctChars);
    }

    /* ---- results ---- */
    function finish(timedOut) {
      if (!active) return; // guard against double-finish (timer + full passage)
      const { net, raw, minutes } = currentWpm();
      teardown();

      const netWpm = Math.round(net);
      const rawWpm = Math.round(raw);
      const incorrect = Math.max(0, totalTyped - correctChars);
      const accuracy = totalTyped === 0 ? 100 : (correctChars / totalTyped) * 100;

      // Bands differ by device — a fast phone score is a different number from a
      // fast keyboard score, so we grade phones against phone typists.
      const band = isMobile
        ? ( netWpm >= 50 ? { name: "Pro thumbs", note: "Seriously fast for a phone — near the top of two-thumb typists." } :
            netWpm >= 38 ? { name: "Fast", note: "Above the ~36 WPM phone average. Your thumbs know the layout." } :
            netWpm >= 27 ? { name: "Good", note: "A solid phone pace, right around what most people manage on glass." } :
            netWpm >= 18 ? { name: "Steady", note: "A comfortable everyday thumb pace. Practice nudges it up fast." } :
            { name: "Warming up", note: "An honest phone starting point — accuracy first, speed follows." } )
        : ( netWpm >= 80 ? { name: "Professional", note: "Genuinely fast — that's the territory of typists who do it for a living." } :
            netWpm >= 60 ? { name: "Fast", note: "Well above average. Your fingers clearly know the keyboard." } :
            netWpm >= 40 ? { name: "Good", note: "Around and above the typical typist's pace of roughly 40 WPM." } :
            netWpm >= 25 ? { name: "Steady", note: "A solid everyday pace. Regular practice moves this up quickly." } :
            { name: "Warming up", note: "A short, honest starting point — accuracy first, speed follows." } );

      const WPM_MAX = isMobile ? 80 : 120; // scale ceiling for the bar
      const wpmBar = Math.max(2, Math.min(100, (netWpm / WPM_MAX) * 100));
      const accBar = Math.max(2, Math.min(100, accuracy));

      // ---- how you compare to others ----
      // Model typing speed as roughly normal. Desktop centres on the ~40 WPM adult
      // average (SD ≈ 18); mobile on the ~36 WPM two-thumb average from the Aalto
      // 37k-user study (SD ≈ 14). normCdf turns a net score into an approx percentile.
      const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };
      const MEAN = isMobile ? 36 : 40;
      const SD = isMobile ? 14 : 18;
      const who = isMobile ? "phone typists" : "people";
      const avgPhrase = isMobile ? "the ~36 WPM phone average (two thumbs)" : "the ~40 WPM average for adults";
      const percentile = Math.max(1, Math.min(99, Math.round(normCdf((netWpm - MEAN) / SD) * 100)));
      const diff = netWpm - MEAN;
      const compareLine =
        diff > 2 ? `That's about <strong>${diff} WPM above</strong> ${avgPhrase} — faster than roughly <strong>${percentile}% of ${who}</strong> (around the ${percentile}${ord(percentile)} percentile).` :
        diff < -2 ? `${isMobile ? "The average phone typist manages about 36 WPM with two thumbs" : "The average adult types about 40 WPM"}, so you're roughly <strong>${-diff} WPM under</strong> that for now — around the <strong>${percentile}${ord(percentile)} percentile</strong>. That number climbs quickly with practice.` :
        `That's right around ${avgPhrase} — about the ${percentile}${ord(percentile)} percentile, squarely in the middle of the pack.`;

      // ---- speed-over-time graph + consistency (#11) ----
      const peak = samples.length ? Math.max(...samples) : netWpm;
      let consistency = null;
      if (samples.length >= 2) {
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        if (mean > 0) {
          const variance = samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length;
          const cv = Math.sqrt(variance) / mean;
          consistency = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
        }
      }
      const graphBlock = samples.length >= 2 ? `
          <div class="wpm-graph">
            <div class="wpm-graph-head"><span>Speed through the run</span><span>peak ${peak} WPM${consistency !== null ? ` · <strong>${consistency}%</strong> consistent` : ""}</span></div>
            ${sparkline(samples)}
            <p class="wpm-graph-foot">Each point is your net WPM for one second. A flatter line means a steadier pace — that's what a high consistency score rewards.</p>
          </div>` : "";

      // ---- personal best + recent runs (#3), kept in this browser only ----
      let progressBlock = "";
      let bestFlash = "";
      if (totalTyped > 0) {
        const store = loadStore();
        const bucket = store[deviceKey] || { best: 0, bestAcc: 0, runs: [] };
        const prevBest = bucket.best || 0;
        const isBest = netWpm > prevBest;
        bucket.runs = [{ wpm: netWpm, acc: Math.round(accuracy), ts: Date.now() }].concat(bucket.runs || []).slice(0, 8);
        if (isBest) { bucket.best = netWpm; bucket.bestAcc = Math.round(accuracy); bucket.bestTs = Date.now(); }
        store[deviceKey] = bucket;
        if (saveStore(store)) {
          if (isBest && prevBest > 0) bestFlash = `<p class="quiz-flash best">🏆 New personal best — up from ${prevBest} WPM!</p>`;
          const runsHtml = bucket.runs.map((r, i) => `<div class="typing-run${i === 0 ? " now" : ""}"><strong>${r.wpm}</strong><span>${r.acc}%</span></div>`).join("");
          progressBlock = `
          <div class="typing-progress">
            <div class="typing-progress-head"><span>Your progress${isMobile ? " (phone)" : ""}</span><button type="button" class="linklike" id="typing-clear">Clear history</button></div>
            <div class="typing-progress-grid">
              <div class="typing-progress-best"><strong>${bucket.best}</strong><span>personal best · WPM${bucket.bestAcc ? ` · ${bucket.bestAcc}% acc` : ""}</span></div>
              <div class="typing-runs">${runsHtml}</div>
            </div>
            <p class="typing-progress-note">These numbers are saved only in <strong>this browser's local storage</strong> so you can compare your runs and watch yourself improve over time. Nothing is uploaded — your results never leave your device, exactly like everything else on the site. Clear them whenever you like.</p>
          </div>`;
        }
      }

      const readNote = isMobile
        ? `On a phone the average is about 36 WPM with two thumbs; 38–50 is fast and 50+ is exceptional on glass. Your score shifts with your keyboard, autocorrect, and the words you drew — treat it as a personal benchmark, not a certified credential.`
        : `An average typist lands near 40 WPM; 40–60 is good, 60–80 is fast, and 80+ is professional territory. Your score shifts with the keyboard you used, the sample words, and how familiar they were — treat it as a personal benchmark, not a certified credential.`;

      // ---- why net differs from raw ----
      const gap = Math.max(0, rawWpm - netWpm);
      const rawLine = gap <= 0
        ? `You didn't lose a single character to errors, so your <b>raw</b> and <b>net</b> speeds came out identical — a perfectly clean run.`
        : `Your <b>raw</b> speed was ${rawWpm} WPM, which counts every key you pressed. Your <b>net</b> speed of ${netWpm} WPM counts only the ${correctChars} keys you got right — and that's the figure that reflects typing you could actually use. The <b>${gap} WPM gap</b> between them is the cost of ${incorrect} mistyped character${incorrect === 1 ? "" : "s"}: type cleaner and net rises toward raw.`;

      root.innerHTML = `
        <div class="quiz quiz-results">
          ${timedOut ? `<p class="quiz-flash">⏱ Time is up — here is how you did.</p>` : `<p class="quiz-flash">✓ Passage complete — here is how you did.</p>`}
          ${bestFlash}
          <p class="eyebrow">Your ${isMobile ? "mobile " : ""}typing result</p>
          <div class="score-hero">
            <div class="score-big">${netWpm}<small>net words per minute</small></div>
            <div class="score-meta">
              <p><strong>${esc(band.name)}</strong> · ${pct(accuracy)} accuracy · ${round1(minutes * 60)}s</p>
              <p>${esc(band.note)}</p>
              <p class="score-compare">${compareLine}</p>
            </div>
          </div>
          <div class="share-spotlight">
            ${shareBar()}
            <p class="share-spotlight-cue">🙌 Please share your result as a way to support our free utilities</p>
          </div>
          <a class="tutor-cta" href="../typing-games/index.html">
            <span class="tutor-cta-top">Play the fun Nifty Utilities Typing Tutor Games to improve your typing speed while having a little fun!</span>
            <span class="tutor-cta-btn">🎮 Play the Typing Games →</span>
          </a>
          <div class="score-rows">
            <div class="score-row">
              <div class="score-row-head"><span>Net speed (of ${WPM_MAX} WPM scale)</span><strong>${netWpm} WPM</strong></div>
              <div class="score-bar"><span style="width:${wpmBar}%"></span></div>
            </div>
            <div class="score-row">
              <div class="score-row-head"><span>Accuracy</span><strong>${pct(accuracy)}</strong></div>
              <div class="score-bar"><span style="width:${accBar}%"></span></div>
            </div>
          </div>
          ${graphBlock}
          ${progressBlock}
          <div class="typing-tally">
            <div class="typing-tally-item"><strong>${correctChars}</strong><span>correct characters</span></div>
            <div class="typing-tally-item"><strong>${incorrect}</strong><span>incorrect characters</span></div>
            <div class="typing-tally-item"><strong>${totalTyped}</strong><span>characters typed</span></div>
          </div>
          <div class="quiz-note">
            <strong>Net vs. raw — why they differ</strong>
            <p>${rawLine}</p>
          </div>
          <div class="quiz-note warn">
            <strong>How to read this number</strong>
            <p>${readNote}</p>
          </div>
          <div class="actions">
            <button class="button primary" id="typing-again">Try again →</button>
            <button class="button" id="typing-change">Change length / mode</button>
            <button class="button" id="typing-cert">🎖 Save result image</button>
          </div>
          <p class="quiz-share-note">Your keystrokes are never uploaded — only your best score and recent runs are kept in this browser so you can track progress. “Try again” drops you straight into a fresh passage (same settings); “Change length / mode” lets you pick a different test.</p>
        </div>`;
      wireShare(`I just typed ${netWpm} WPM at ${pct(accuracy)} accuracy on this free ${isMobile ? "mobile " : ""}typing speed test ⌨️ Can you beat it?`);
      // "Try again" jumps straight into a ready test — no second "start" click needed.
      root.querySelector("#typing-again").onclick = () => startTest();
      root.querySelector("#typing-change").onclick = () => intro();
      // Clear the locally-stored history for this device on request.
      const clearBtn = root.querySelector("#typing-clear");
      if (clearBtn) clearBtn.onclick = () => {
        const s = loadStore();
        delete s[deviceKey];
        saveStore(s);
        const panel = root.querySelector(".typing-progress");
        if (panel) panel.innerHTML = `<p class="typing-progress-note">Cleared — your saved runs were removed from this browser.</p>`;
      };

      // Downloadable / shareable result card, drawn on a canvas in the browser.
      const certBtn = root.querySelector("#typing-cert");
      if (certBtn) certBtn.onclick = () => {
        const canvas = drawCertificate({ netWpm, accuracy: pct(accuracy), band: band.name, mobile: isMobile });
        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], `nifty-typing-${netWpm}wpm.png`, { type: "image/png" });
          const shareText = `I typed ${netWpm} WPM at ${pct(accuracy)} accuracy on the free Nifty Utilities typing test ⌨️`;
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], text: shareText }).catch(() => {});
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }, "image/png");
      };
      // Keyboard on the results view: Enter = try again, Esc = settings. Ignored
      // when a button/link is focused so it never hijacks the share controls.
      keyHandler = (e) => {
        if (!root.querySelector(".quiz-results")) return;
        if (e.target && (e.target.closest("button") || e.target.closest("a") || e.target.tagName === "INPUT")) return;
        if (e.key === "Enter") { e.preventDefault(); startTest(); }
        else if (e.key === "Escape") { e.preventDefault(); intro(); }
      };
      document.addEventListener("keydown", keyHandler);
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    intro();
  }

function renderReactionTest() {
  // States: "intro" | "waiting" | "ready" | "result" | "done"
  const ROUNDS = 5;
  const MIN_DELAY = 1500;
  const MAX_DELAY = 4500;

  const times = [];
  let state = "intro";
  let greenAt = 0;
  let timerId = null;
  let keyHandler = null;

  function clearPendingTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function removeKeyHandler() {
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
  }

  function addKeyHandler() {
    removeKeyHandler(); // never stack listeners
    keyHandler = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    };
    document.addEventListener("keydown", keyHandler);
  }

  // ---- intro ----
  function intro() {
    state = "intro";
    root.innerHTML = `
      <div class="quiz quiz-intro">
        <div class="quiz-badges">
          <span class="quiz-badge time">⏱ About 2 minutes</span>
          <span class="quiz-badge">${ROUNDS} rounds</span>
          <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
        </div>
        <h2>⚡ Reaction Time Test</h2>
        <p class="quiz-lede"><strong>Completely FREE Reaction Time Test. No signup, no email, no credit card. Instant results, no catch.</strong> Find out how fast your reflexes are with five timed rounds — all in your browser, nothing saved, no installs.</p>
        <ul class="quiz-facts">
          <li><span>🟥</span><div><strong>Wait for red to turn green</strong> — stare at the pad and be ready.</div></li>
          <li><span>⚡</span><div><strong>Click or tap the moment it goes green</strong> — or press Space bar.</div></li>
          <li><span>📊</span><div><strong>5 valid rounds recorded</strong> — clicking before green restarts that round.</div></li>
          <li><span>📈</span><div><strong>Average, best, and worst</strong> — plus honest performance bands.</div></li>
        </ul>
        <div class="quiz-note">
          <strong>Get the most accurate result</strong>
          <p>Use a mouse or trackpad on a desktop for the fastest times. Touchscreens work too but typically add 20–40 ms. Keep your eyes on the pad, don't anticipate — clicking while it's still red voids that round and restarts it.</p>
        </div>
        <div class="actions"><button class="button primary" id="rt-start">Start →</button></div>
      </div>`;
    root.querySelector("#rt-start").onclick = () => {
      addKeyHandler();
      beginRound();
    };
  }

  // ---- round ----
  function beginRound() {
    state = "waiting";
    addKeyHandler(); // restore Space→onActivate for every round (clears any stale spaceAdvance)
    const roundNum = times.length + 1;
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);

    root.innerHTML = `
      <div class="quiz">
        <div class="quiz-topbar">
          <span class="quiz-cat">Round ${roundNum} of ${ROUNDS}</span>
          <span class="quiz-count" style="margin:0">Click or tap the pad · Space also works</span>
        </div>
        <div class="quiz-progress"><span style="width:${((roundNum - 1) / ROUNDS) * 100}%"></span></div>
        <div class="reaction-pad-wrap">
          <div class="reaction-pad reaction-waiting" id="rt-pad" role="button" tabindex="0" aria-label="Reaction pad — wait for green">
            <div class="reaction-pad-label">Wait for green…</div>
          </div>
        </div>
        <p class="reaction-hint">Don't click yet — click as soon as it turns green.</p>
      </div>`;

    const pad = root.querySelector("#rt-pad");
    pad.addEventListener("click", onActivate);
    pad.addEventListener("touchend", (e) => { e.preventDefault(); onActivate(); }, { passive: false });

    clearPendingTimer();
    timerId = setTimeout(() => {
      timerId = null;
      if (state !== "waiting") return; // already torn down
      state = "ready";
      greenAt = performance.now();
      const p = root.querySelector("#rt-pad");
      if (p) {
        p.className = "reaction-pad reaction-ready";
        p.setAttribute("aria-label", "Reaction pad — click now!");
        const lbl = p.querySelector(".reaction-pad-label");
        if (lbl) lbl.textContent = "CLICK!";
      }
    }, delay);
  }

  function onActivate() {
    if (state === "waiting") {
      // Too soon
      clearPendingTimer();
      state = "result"; // prevent re-entry while showing message
      const pad = root.querySelector("#rt-pad");
      if (pad) {
        pad.className = "reaction-pad reaction-toosoon";
        const lbl = pad.querySelector(".reaction-pad-label");
        if (lbl) lbl.textContent = "Too soon!";
      }
      const hint = root.querySelector(".reaction-hint");
      if (hint) hint.textContent = "You clicked before it turned green. Restarting this round…";
      timerId = setTimeout(() => {
        timerId = null;
        beginRound();
      }, 1200);
    } else if (state === "ready") {
      const rt = Math.round(performance.now() - greenAt);
      state = "result"; // double-click guard
      times.push(rt);
      showRoundResult(rt);
    }
    // state "result" / "done" / "intro" — ignore
  }

  function showRoundResult(rt) {
    const pad = root.querySelector("#rt-pad");
    if (pad) {
      pad.className = "reaction-pad reaction-done";
      const lbl = pad.querySelector(".reaction-pad-label");
      if (lbl) lbl.textContent = `${rt} ms`;
    }
    const hint = root.querySelector(".reaction-hint");
    if (hint) {
      if (times.length < ROUNDS) {
        hint.innerHTML = `Round ${times.length} recorded. <strong>Click or tap the pad to continue.</strong>`;
      } else {
        hint.innerHTML = `All ${ROUNDS} rounds done! <strong>Click or tap to see your results.</strong>`;
      }
    }
    // Now clicking/tapping the pad advances to next round or results.
    const pad2 = root.querySelector("#rt-pad");
    if (pad2) {
      const advanceFn = () => {
        if (times.length >= ROUNDS) {
          removeKeyHandler();
          clearPendingTimer();
          results();
        } else {
          beginRound();
        }
      };
      pad2.addEventListener("click", advanceFn, { once: true });
      pad2.addEventListener("touchend", (e) => { e.preventDefault(); advanceFn(); }, { once: true, passive: false });
      // Space also advances from result state
      const spaceAdvance = (e) => {
        if (e.code === "Space" || e.key === " ") {
          e.preventDefault();
          document.removeEventListener("keydown", spaceAdvance);
          advanceFn();
        }
      };
      // Temporarily replace keyHandler with space-advance
      removeKeyHandler();
      document.addEventListener("keydown", spaceAdvance);
      keyHandler = spaceAdvance; // track it so teardown can remove it
    }
  }

  // ---- results ----
  function results() {
    state = "done";
    removeKeyHandler();
    clearPendingTimer();

    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const best = Math.min(...times);
    const worst = Math.max(...times);

    const band =
      avg < 200 ? { label: "Excellent", note: "Very fast — top end for human perception." } :
      avg < 250 ? { label: "Fast", note: "Above average — faster than most people." } :
      avg < 300 ? { label: "Average", note: "Right in the normal human range (~250 ms)." } :
      avg < 350 ? { label: "Slower than average", note: "Below average but within the normal range." } :
                  { label: "Relaxed", note: "On the slower side — may reflect device lag, fatigue, or touch input." };

    // Bars: width ∝ ms against worst or 500ms ceiling (shorter = faster)
    const ceiling = Math.max(worst, 500);
    const roundRows = times.map((t, i) => {
      const w = Math.round((t / ceiling) * 100);
      return `<div class="score-row">
        <div class="score-row-head"><span>Round ${i + 1}</span><strong>${t} ms</strong></div>
        <div class="score-bar"><span style="width:${w}%"></span></div>
      </div>`;
    }).join("");

    const compRows = [
      ["< 200 ms", "Excellent", "Top of the human range"],
      ["200–250 ms", "Fast", "Above average"],
      ["250–300 ms", "Average", "Normal human range"],
      ["300–350 ms", "Slower", "Below average but normal"],
      ["> 350 ms", "Relaxed", "May reflect fatigue or touch lag"],
    ].map(([range, label, desc]) => {
      const isYours = (
        (range === "< 200 ms" && avg < 200) ||
        (range === "200–250 ms" && avg >= 200 && avg < 250) ||
        (range === "250–300 ms" && avg >= 250 && avg < 300) ||
        (range === "300–350 ms" && avg >= 300 && avg < 350) ||
        (range === "> 350 ms" && avg >= 350)
      );
      return `<tr class="${isYours ? "reaction-yours" : ""}">
        <td>${esc(range)}</td><td>${esc(label)}</td><td>${esc(desc)}${isYours ? " ← you" : ""}</td>
      </tr>`;
    }).join("");

    root.innerHTML = `
      <div class="quiz quiz-results">
        <p class="eyebrow">Your result</p>
        <div class="score-hero">
          <div class="score-big">${avg}<small>ms average</small></div>
          <div class="score-meta">
            <p><strong>${band.label}</strong></p>
            <p>${band.note}</p>
            <p>Best: <strong>${best} ms</strong> · Worst: <strong>${worst} ms</strong></p>
          </div>
        </div>
        <h3>Your 5 rounds</h3>
        <p class="reaction-bar-note">Shorter bar = faster reaction.</p>
        <div class="score-rows">${roundRows}</div>
        <h3>How you compare</h3>
        <p style="color:var(--muted);font-size:.88rem;margin-bottom:.6rem">Honest performance bands — not clinical. Average humans click around 250 ms on a mouse; touchscreen typically adds 20–40 ms.</p>
        <div class="reaction-table-wrap">
          <table class="reaction-table">
            <thead><tr><th>Average</th><th>Band</th><th>What it means</th></tr></thead>
            <tbody>${compRows}</tbody>
          </table>
        </div>
        <div class="quiz-note warn">
          <strong>Important</strong>
          <p>Reaction times on this test depend on your device hardware, display refresh rate, input method (mouse vs. touch), browser, and background CPU load. Results vary run-to-run. This is not a medical or diagnostic measure of neurological health — it's a fun self-comparison tool.</p>
        </div>
        ${shareBar()}
        <div class="actions">
          <button class="button primary" id="rt-retake">Try again</button>
        </div>
        <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone. Retaking starts fresh rounds.</p>
      </div>`;

    wireShare(`My average reaction time is ${avg} ms (${band.label.toLowerCase()}, best round ${best} ms) ⚡ Test yours free:`);
    root.querySelector("#rt-retake").onclick = () => location.reload();
    root.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  intro();
}

function renderClickSpeedTest() {
  // ── state ──────────────────────────────────────────────────────────────────
  let selectedDuration = 10; // seconds (5 / 10 / 30)
  let totalClicks = 0;
  let startTime = null;     // performance.now() at first click
  let rafId = null;
  let finished = false;

  // Teardown helpers — held in closure so every screen transition cleans up.
  let kbListener = null;

  function teardown() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    if (kbListener !== null) {
      document.removeEventListener("keydown", kbListener);
      kbListener = null;
    }
  }

  // ── screen: intro ──────────────────────────────────────────────────────────
  function intro() {
    teardown();
    finished = false;
    totalClicks = 0;
    startTime = null;

    root.innerHTML = `
      <div class="quiz quiz-intro">
        <div class="quiz-badges">
          <span class="quiz-badge time">⏱ Finish in 5 – 30 seconds</span>
          <span class="quiz-badge">Click as fast as you can</span>
          <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
        </div>
        <h2>How fast can you click?</h2>
        <p class="quiz-lede"><strong>Completely FREE Click Speed Test. No signup, no email, no credit card. Instant results, no catch.</strong> Pick a duration, tap the pad to start, and click as fast as you can. Your CPS appears the moment time runs out.</p>
        <ul class="quiz-facts">
          <li><span>🖱️</span><div><strong>Clicks per second (CPS)</strong> — total clicks divided by the duration you chose.</div></li>
          <li><span>⌨️</span><div><strong>Space bar counts</strong> — prefer the keyboard? It registers as a click too.</div></li>
          <li><span>⏱</span><div><strong>Timer starts on first click</strong> — no reaction-lag penalty; the clock waits for you.</div></li>
          <li><span>📱</span><div><strong>Touch-friendly</strong> — works on phones and tablets as well as desktops.</div></li>
        </ul>
        <div class="quiz-note">
          <strong>Tips for an accurate result</strong>
          <p>Rest your clicking arm on a surface, use your fingertip (not a knuckle), and keep a relaxed grip — tension slows you down. Take a 30-second rest between attempts. Three runs averaged is a more honest picture than a single peak.</p>
        </div>
        <h3>Choose your duration</h3>
        <div class="cps-duration-row">
          <button class="button cps-dur-btn" data-sec="5">5 seconds</button>
          <button class="button cps-dur-btn cps-dur-active" data-sec="10">10 seconds</button>
          <button class="button cps-dur-btn" data-sec="30">30 seconds</button>
        </div>
        <div class="actions" style="margin-top:1.6rem">
          <button class="button primary" id="cps-go">Ready — open the pad →</button>
        </div>
      </div>`;

    // Duration selector
    root.querySelectorAll(".cps-dur-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll(".cps-dur-btn").forEach((b) => b.classList.remove("cps-dur-active"));
        btn.classList.add("cps-dur-active");
        selectedDuration = Number(btn.dataset.sec);
      });
    });

    root.querySelector("#cps-go").addEventListener("click", () => pad());
  }

  // ── screen: pad ────────────────────────────────────────────────────────────
  function pad() {
    teardown();
    finished = false;
    totalClicks = 0;
    startTime = null;

    root.innerHTML = `
      <div class="quiz cps-pad-screen">
        <div class="cps-topbar">
          <span class="cps-dur-label">Duration: <strong>${selectedDuration}s</strong></span>
          <span class="cps-live-cps" id="cps-live-cps">— CPS</span>
        </div>
        <div class="cps-countdown" id="cps-countdown">${selectedDuration}.0</div>
        <button
          class="cps-pad"
          id="cps-pad"
          aria-label="Click pad — click as fast as you can"
          aria-live="polite"
        >
          <span class="cps-pad-count" id="cps-pad-count">0</span>
          <span class="cps-pad-hint" id="cps-pad-hint">Tap here to start</span>
        </button>
        <p class="cps-kb-note">Space bar also counts</p>
      </div>`;

    const padEl       = root.querySelector("#cps-pad");
    const countEl     = root.querySelector("#cps-pad-count");
    const hintEl      = root.querySelector("#cps-pad-hint");
    const countdownEl = root.querySelector("#cps-countdown");
    const liveCpsEl   = root.querySelector("#cps-live-cps");

    // Prevent context menu on long-press (mobile)
    padEl.addEventListener("contextmenu", (e) => e.preventDefault());

    function registerClick() {
      if (finished) return;

      if (startTime === null) {
        // First click — start the timer loop
        startTime = performance.now();
        hintEl.textContent = "";
        hintEl.style.display = "none";
        startLoop();
      }

      totalClicks += 1;
      countEl.textContent = totalClicks;

      // Live CPS (guard division by ~0 on first click)
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > 0.05) {
        liveCpsEl.textContent = (totalClicks / elapsed).toFixed(1) + " CPS";
      }
    }

    // pointerdown — one event per physical tap or click, no double-fire
    padEl.addEventListener("pointerdown", (e) => {
      e.preventDefault(); // kill scroll / zoom on touch
      registerClick();
    });

    // Space bar
    kbListener = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // prevent page scroll
        // Only count if the pad is visible and the pointer is not a repeat key event
        if (!finished) registerClick();
      }
    };
    document.addEventListener("keydown", kbListener);

    // rAF loop — updates countdown and fires end independently of click events
    function startLoop() {
      function tick() {
        if (finished) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const remaining = selectedDuration - elapsed;

        if (remaining <= 0) {
          countdownEl.textContent = "0.0";
          endTest();
          return;
        }

        countdownEl.textContent = remaining.toFixed(1);
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }
  }

  // ── end of test ────────────────────────────────────────────────────────────
  function endTest() {
    finished = true;
    teardown();

    const cps = totalClicks / selectedDuration; // use fixed duration, not elapsed
    results(cps, totalClicks, selectedDuration);
  }

  // ── screen: results ────────────────────────────────────────────────────────
  function results(cps, clicks, duration) {
    const cpsDisplay = cps.toFixed(1);

    // Interpretation band
    let band, bandColor, bandDetail;
    if (cps < 4) {
      band = "Relaxed";
      bandColor = "var(--muted)";
      bandDetail = "A calm, unhurried pace — typical of someone not trying to go fast, or using a particularly heavy input device.";
    } else if (cps < 6) {
      band = "Average";
      bandColor = "var(--green)";
      bandDetail = "Solidly in the middle of the pack for everyday mouse and trackpad users clicking at a comfortable speed.";
    } else if (cps < 8) {
      band = "Fast";
      bandColor = "var(--qa)";
      bandDetail = "Above the typical casual pace. Consistent clicking technique and a light-trigger device both help here.";
    } else if (cps < 10) {
      band = "Very fast";
      bandColor = "var(--qa)";
      bandDetail = "In the range you'd expect from a practiced gamer using a gaming mouse with a light trigger.";
    } else {
      band = "Exceptional";
      bandColor = "var(--gold)";
      bandDetail = "Scores above 10 CPS are unusual with single-finger clicking technique. If you reached this with a standard mouse, that's genuinely impressive. Note that some techniques (jitter clicking, butterfly clicking, drag clicking) can push scores higher but aren't measuring natural click speed.";
    }

    // Score bars for the stat rows (scaled to a 12 CPS ceiling for the bars)
    const barPct = Math.min(100, Math.round((cps / 12) * 100));

    const interpretation = [
      { label: "Relaxed", range: "< 4 CPS", active: cps < 4 },
      { label: "Average", range: "4 – 6 CPS", active: cps >= 4 && cps < 6 },
      { label: "Fast", range: "6 – 8 CPS", active: cps >= 6 && cps < 8 },
      { label: "Very fast", range: "8 – 10 CPS", active: cps >= 8 && cps < 10 },
      { label: "Exceptional", range: "> 10 CPS", active: cps >= 10 },
    ];

    const tableRows = interpretation.map(({ label, range, active }) => `
      <div class="score-row${active ? " cps-row-active" : ""}">
        <div class="score-row-head">
          <span>${active ? "▶ " : ""}${esc(label)}</span>
          <strong>${esc(range)}</strong>
        </div>
        <div class="score-bar">
          <span style="width:${active ? barPct : (label === "Relaxed" ? 25 : label === "Average" ? 50 : label === "Fast" ? 67 : label === "Very fast" ? 83 : 100)}%"></span>
        </div>
      </div>`).join("");

    root.innerHTML = `
      <div class="quiz quiz-results">
        <p class="eyebrow">Your click speed result</p>
        <div class="score-hero">
          <div class="score-big">${esc(cpsDisplay)}<small>clicks per second</small></div>
          <div class="score-meta">
            <p><strong style="color:${bandColor}">${esc(band)}</strong></p>
            <p>${esc(clicks)} total click${clicks === 1 ? "" : "s"} in ${esc(String(duration))} seconds.</p>
          </div>
        </div>
        <div class="quiz-note">
          <strong>${esc(band)}</strong>
          <p>${esc(bandDetail)}</p>
        </div>
        <h3>How you compare</h3>
        <div class="score-rows">${tableRows}</div>
        <div class="quiz-note warn">
          <strong>A note on high scores</strong>
          <p>Scores above 10 CPS usually involve specialised techniques: <strong>jitter clicking</strong> (tensing the forearm to vibrate), <strong>butterfly clicking</strong> (alternating two fingers), or <strong>drag clicking</strong> (dragging a finger across the button to register multiple contacts). These produce big numbers but carry injury risk and don't reflect natural clicking speed. This test is calibrated for ordinary single-finger technique.</p>
        </div>
        ${shareBar()}
        <div class="actions">
          <button class="button primary" id="cps-again">Try again</button>
          <button class="button" id="cps-change">Change duration</button>
        </div>
        <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone. Each run is independent.</p>
      </div>`;

    wireShare(`I hit ${cpsDisplay} clicks per second (${clicks} clicks in ${duration}s) on this free click speed test 🖱️ Beat my score!`);
    root.querySelector("#cps-again").addEventListener("click", () => pad());
    root.querySelector("#cps-change").addEventListener("click", () => intro());
    root.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // ── kick off ───────────────────────────────────────────────────────────────
  intro();
}

function renderMemoryTest() {
  /* ------------------------------------------------------------------ *
   * Memory Test — progressive digit-span recall
   * Helpers in scope: esc, shuffle, normCdf, pct, root
   * ------------------------------------------------------------------ */

  /* ---- constants ---- */
  const START_LENGTH = 3;
  const MAX_LIVES    = 3;

  /* ---- state ---- */
  let spanLength  = START_LENGTH;   // current digit-sequence length
  let lives       = MAX_LIVES;      // mistakes remaining
  let bestSpan    = 0;              // longest length correctly recalled
  let roundsWon   = 0;              // sequences answered correctly
  let sequence    = [];             // current digit array
  let flashTimer  = null;           // setTimeout ID for hide-sequence step
  let phase       = "intro";        // "intro" | "flash" | "recall" | "feedback" | "over"

  /* ---- timer guard: always cancel before scheduling a new one ----
   * This is the key to avoiding stale-timer races.  Every code path
   * that starts a new flash timer calls clearFlash() first, and every
   * screen teardown (intro / results) also calls it.  A timer ID is
   * stored once and immediately nulled after use so it can never fire
   * twice into the wrong screen.
   */
  function clearFlash() {
    if (flashTimer !== null) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
  }

  /* ---- digit-sequence generator ---- */
  function makeSequence(len) {
    const digits = [];
    let last = -1;
    for (let i = 0; i < len; i++) {
      // Avoid immediate repeats of the same digit (makes it marginally non-trivial)
      let d;
      do { d = Math.floor(Math.random() * 10); } while (d === last && len > 1);
      digits.push(d);
      last = d;
    }
    return digits;
  }

  /* ==================================================================
   *  SCREENS
   * ================================================================== */

  /* ---- INTRO ---- */
  function intro() {
    clearFlash();
    phase = "intro";
    root.innerHTML = `
      <div class="quiz quiz-intro">
        <div class="quiz-badges">
          <span class="quiz-badge time">⏱ Estimated time: 3–5 minutes</span>
          <span class="quiz-badge">Digit-span recall</span>
          <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
        </div>
        <h2>🔢 Memory Test — digit span</h2>
        <p class="quiz-lede"><strong>Completely FREE Memory Test. No signup, no email, no credit card. Instant results, no catch.</strong> Find out how many digits your working memory can hold in one go — your result is your <em>memory span</em>.</p>
        <p>You will see a sequence of digits flash on screen for a moment, then you type back exactly what you saw. Get it right and the next sequence is one digit longer. Three mistakes and the test ends — your span is the longest sequence you recalled correctly.</p>
        <ul class="quiz-facts">
          <li><span>👀</span><div><strong>Flash phase</strong> — a sequence of digits appears briefly, then disappears.</div></li>
          <li><span>⌨️</span><div><strong>Recall phase</strong> — type the digits back in order and press Submit.</div></li>
          <li><span>📈</span><div><strong>Level up</strong> — each correct answer adds one more digit to the sequence.</div></li>
          <li><span>❤️</span><div><strong>Three lives</strong> — the test ends after three mistakes. Your span is your best correct recall.</div></li>
        </ul>
        <div class="quiz-note">
          <strong>For the fairest result</strong>
          <p>Put your phone down, clear your mind, and watch the sequence the moment it appears. Saying the digits aloud or sub-vocalising is fine — that is a normal part of how working memory works. Do not write them down.</p>
        </div>
        <div class="actions"><button class="button primary" id="mt-start">Start the test →</button></div>
      </div>`;
    root.querySelector("#mt-start").onclick = startTest;
  }

  /* ---- start / restart ---- */
  function startTest() {
    spanLength = START_LENGTH;
    lives      = MAX_LIVES;
    bestSpan   = 0;
    roundsWon  = 0;
    beginFlash();
  }

  /* ---- FLASH: show the sequence ---- */
  function beginFlash() {
    clearFlash();                            // cancel any lingering timer first
    phase    = "flash";
    sequence = makeSequence(spanLength);
    const duration = spanLength * 700;       // ~700 ms per digit (tested readable)

    root.innerHTML = `
      <div class="quiz quiz-question memory-screen">
        ${topbar()}
        <p class="quiz-count memory-instruction">Watch the sequence — it will disappear in <strong>${(duration / 1000).toFixed(1)}s</strong></p>
        <div class="memory-sequence-wrap">
          <div class="memory-sequence" id="mt-seq" aria-live="polite">${sequence.join(" ")}</div>
        </div>
      </div>`;

    // Schedule the transition to recall.  Store the ID immediately so
    // clearFlash() can cancel it if the user somehow navigates away.
    flashTimer = setTimeout(() => {
      flashTimer = null;              // nulled BEFORE entering recall so double-clear is harmless
      if (phase === "flash") recall(); // guard: only advance if we are still in flash phase
    }, duration);
  }

  /* ---- RECALL: hide sequence, show input ---- */
  function recall() {
    clearFlash();   // belt-and-suspenders — clears any residual timer
    phase = "recall";

    root.innerHTML = `
      <div class="quiz quiz-question memory-screen">
        ${topbar()}
        <p class="quiz-count memory-instruction">What was the sequence? Type the digits and press Submit.</p>
        <div class="memory-input-area">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            id="mt-input"
            class="memory-input"
            maxlength="20"
            placeholder="${"_ ".repeat(sequence.length).trim()}"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            autofocus
          />
          <div class="actions" style="margin-top:1rem">
            <button class="button primary" id="mt-submit">Submit</button>
          </div>
        </div>
        <div class="memory-keypad" id="mt-keypad" aria-label="On-screen digit keypad">
          ${[1,2,3,4,5,6,7,8,9,"⌫",0,"✓"].map((k) =>
            `<button type="button" class="memory-key${k === "✓" ? " memory-key-enter" : k === "⌫" ? " memory-key-del" : ""}" data-k="${k}">${k}</button>`
          ).join("")}
        </div>
      </div>`;

    const inp = root.querySelector("#mt-input");
    const submitBtn = root.querySelector("#mt-submit");

    /* on-screen keypad */
    root.querySelectorAll(".memory-key").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.k;
        if (k === "⌫") {
          inp.value = inp.value.slice(0, -1);
        } else if (k === "✓") {
          checkAnswer();
        } else {
          if (inp.value.length < 20) inp.value += k;
        }
        inp.focus();
      };
    });

    submitBtn.onclick = checkAnswer;
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); checkAnswer(); }
    });

    inp.focus();
  }

  /* ---- check the typed answer ---- */
  function checkAnswer() {
    if (phase !== "recall") return;          // guard against double-submit
    const inp = root.querySelector("#mt-input");
    if (!inp) return;
    const typed = inp.value.replace(/\s/g, "");
    const correct = sequence.join("");
    if (typed === correct) {
      onCorrect();
    } else {
      onWrong(typed, correct);
    }
  }

  /* ---- correct answer ---- */
  function onCorrect() {
    phase = "feedback";
    if (spanLength > bestSpan) bestSpan = spanLength;
    roundsWon += 1;
    spanLength += 1;

    // Brief positive flash overlay
    root.innerHTML = `
      <div class="quiz quiz-question memory-screen">
        ${topbar()}
        <div class="memory-feedback memory-feedback-ok">
          <span class="memory-feedback-icon">✓</span>
          <p>Correct! Next up: <strong>${spanLength} digits</strong></p>
        </div>
      </div>`;

    flashTimer = setTimeout(() => {
      flashTimer = null;
      if (phase === "feedback") beginFlash();
    }, 900);
  }

  /* ---- wrong answer ---- */
  function onWrong(typed, correct) {
    phase = "feedback";
    lives -= 1;

    const livesLeft = lives;
    const over = livesLeft <= 0;

    if (over) {
      // Show wrong feedback briefly then go to results
      root.innerHTML = `
        <div class="quiz quiz-question memory-screen">
          ${topbar()}
          <div class="memory-feedback memory-feedback-err">
            <span class="memory-feedback-icon">✗</span>
            <p>The sequence was <strong class="memory-seq-reveal">${esc(correct)}</strong></p>
            <p class="memory-typed">You typed: <span>${esc(typed || "(nothing)")}</span></p>
            <p>No lives left — calculating your result…</p>
          </div>
        </div>`;
      flashTimer = setTimeout(() => {
        flashTimer = null;
        if (phase === "feedback") results();
      }, 1800);
    } else {
      // Still has lives — show wrong, same length retry
      root.innerHTML = `
        <div class="quiz quiz-question memory-screen">
          ${topbar()}
          <div class="memory-feedback memory-feedback-err">
            <span class="memory-feedback-icon">✗</span>
            <p>The sequence was <strong class="memory-seq-reveal">${esc(correct)}</strong></p>
            <p class="memory-typed">You typed: <span>${esc(typed || "(nothing)")}</span></p>
            <p>${livesLeft} ${livesLeft === 1 ? "life" : "lives"} remaining. Same length, try again!</p>
          </div>
        </div>`;
      flashTimer = setTimeout(() => {
        flashTimer = null;
        if (phase === "feedback") beginFlash();
      }, 2000);
    }
  }

  /* ---- RESULTS ---- */
  function results() {
    clearFlash();
    phase = "over";

    // Interpret the span honestly
    const span = bestSpan;
    let band, bandNote;
    if (span === 0) {
      band = "—";
      bandNote = "No sequences were recalled correctly. Try again on a fresh day!";
    } else if (span <= 4) {
      band = "Short";
      bandNote = "Most adults hold 5–9 items. Practice and a distraction-free environment can improve this.";
    } else if (span <= 6) {
      band = "Average";
      bandNote = "Right in the typical range for adults. The classic average is about 7 (give or take 2).";
    } else if (span <= 8) {
      band = "Above average";
      bandNote = "You're comfortably above the typical range of 5–9 digits. Solid working memory!";
    } else {
      band = "Impressive";
      bandNote = "Spans of 9+ are uncommon. Expert mnemonists aside, this is well above the population average.";
    }

    // Comparison bar: population average ≈ 7, scale max shown = 12
    const barMax = Math.max(12, span);
    const avgPct = Math.round((7 / barMax) * 100);
    const yourPct = Math.round((span / barMax) * 100);

    root.innerHTML = `
      <div class="quiz quiz-results">
        <p class="eyebrow">Your memory span result</p>
        <div class="score-hero">
          <div class="score-big">${span}<small>digit${span !== 1 ? "s" : ""} recalled</small></div>
          <div class="score-meta">
            <p><strong>${esc(band)}</strong> span</p>
            <p>${roundsWon} sequence${roundsWon !== 1 ? "s" : ""} cleared correctly.</p>
            <p>The well-known population average is <strong>~7 ± 2 digits</strong>.</p>
          </div>
        </div>
        <p>${esc(bandNote)}</p>
        <h3>How you compare</h3>
        <div class="score-rows">
          <div class="score-row">
            <div class="score-row-head"><span>Your span</span><strong>${span}</strong></div>
            <div class="score-bar"><span style="width:${yourPct}%"></span></div>
          </div>
          <div class="score-row">
            <div class="score-row-head"><span>Population average (~7)</span><strong>7</strong></div>
            <div class="score-bar memory-bar-avg"><span style="width:${avgPct}%;background:var(--muted)"></span></div>
          </div>
        </div>
        <div class="quiz-note">
          <strong>What affects your span?</strong>
          <p>Working-memory span naturally varies with tiredness, stress, distraction, and time of day. It can improve with practice — digit-span exercises appear regularly in memory and cognitive training research. Taking this test again after a rest or in a quieter setting may give a different result.</p>
        </div>
        <div class="quiz-note warn">
          <strong>Keep this in perspective</strong>
          <p>This is a casual, browser-based measure — not a clinical digit-span task administered by a professional. Your score reflects how you performed right now, under these conditions, in a text-input format. Treat it as a fun snapshot, not a definitive assessment of your memory.</p>
        </div>
        ${shareBar()}
        <div class="actions">
          <button class="button primary" id="mt-retry">Try again</button>
        </div>
        <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone. Retaking generates a fresh set of random sequences.</p>
      </div>`;

    wireShare(`I remembered a ${span}-digit sequence on this free memory span test 🧠 (average is ~7). Try to beat it!`);
    root.querySelector("#mt-retry").onclick = () => { intro(); };
    root.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  /* ---- shared top-bar (lives + level) ---- */
  function topbar() {
    const heartsFull  = "❤️".repeat(lives);
    const heartsEmpty = "🖤".repeat(MAX_LIVES - lives);
    return `
      <div class="quiz-topbar memory-topbar">
        <span class="quiz-cat">Length: ${spanLength}</span>
        <span class="memory-lives" aria-label="${lives} of ${MAX_LIVES} lives remaining">${heartsFull}${heartsEmpty}</span>
      </div>
      <div class="quiz-progress">
        <span style="width:${Math.min(100, Math.round(((spanLength - START_LENGTH) / (12 - START_LENGTH)) * 100))}%"></span>
      </div>`;
  }

  /* ---- boot ---- */
  intro();
}

  /* =====================================================================
   *  COLOR BLINDNESS TEST (Ishihara-style screening)
   *  An at-home red-green color-vision *screening* — NOT a diagnosis.
   *  Plates are generated at runtime as original dot-mosaics: a hidden
   *  numeral is drawn to an offscreen canvas, its alpha mask decides which
   *  dots are "figure" vs "background", and the two dot palettes differ
   *  mainly in HUE along the red-green confusion axis while their LUMINANCE
   *  ranges overlap — so luminance can't be used as a segmentation cue and
   *  only hue carries the digit. No copyrighted plate is reproduced.
   * ===================================================================== */
  function renderColorBlindnessTest() {
    /* ---- palettes (see color-blindness-test.note.md for luminance proof) ----
     * Both figure and background contain LIGHT and DARK shades whose WCAG
     * relative luminances interleave, so brightness gives no clue. Figure =
     * warm reds/oranges; background = greens/olives of similar lightness. */
    const PAL_FIGURE_RG = ["#c0392b", "#d9534f", "#e8734a", "#f0a15b", "#b5522e"]; // reds/oranges
    const PAL_BG_RG = ["#4f6b28", "#6b8a34", "#8aa04c", "#a9b06e", "#5f7d40"];      // greens/olives
    // Control plate (readable by ANY color vision): figure is clearly darker
    // blue/teal vs a light warm-neutral background — a pure luminance+hue cue.
    const PAL_FIGURE_CTRL = ["#20506b", "#2e6f8e", "#3b8ca8", "#276a55"];
    const PAL_BG_CTRL = ["#e7dfae", "#efe6bc", "#ddd39a", "#f2ead0"];
    // Neutral "empty field" speckle used behind everything for texture.
    const PAL_NEUTRAL = ["#e9e4d6", "#ddd7c6", "#efeadd"];

    /* ---- digit pool: every value a plate can hide is drawn from here, so
     * options (true digit + distractors) always come from the same set. On
     * every retake we resample fresh digits, so the hidden numbers vary — not
     * just their order — which also defeats memorising the answer set. */
    const DIGIT_POOL = ["2", "3", "5", "6", "7", "8", "9", "12", "15", "21", "26", "29", "45", "74"];
    const RG_PLATE_COUNT = 7; // 7 red-green screening plates + 1 control = 8

    const SIZE = 300;          // logical px of the plate square
    const PACK_RADIUS = 146;   // dot-field radius inside the square
    const NO_NUMBER = "__none__";

    // Build the option set for one plate: true digit + a couple of distractors.
    const distractorsFor = (digit) => {
      const opts = new Set([digit]);
      const shuffled = shuffle(DIGIT_POOL);
      for (const d of shuffled) { if (opts.size >= 3) break; if (d !== digit) opts.add(d); }
      return shuffle([...opts]);
    };

    // Sample distinct hidden digits for the red-green plates this session.
    const sampleDigits = (n) => shuffle(DIGIT_POOL).slice(0, n);

    /* ---- offscreen digit mask: draw the numeral, read alpha ----
     * Returns a function isFigure(x,y) over the SIZE×SIZE field, or null if
     * canvas/readback is unavailable (caller degrades gracefully). */
    function buildMask(digit) {
      let cvs, ctx;
      try {
        cvs = document.createElement("canvas");
        cvs.width = SIZE; cvs.height = SIZE;
        ctx = cvs.getContext("2d");
        if (!ctx) return null;
      } catch (e) { return null; }
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Wide, heavy font so the stroke is thick enough to be dot-sampled well.
      const fontPx = digit.length > 1 ? Math.round(SIZE * 0.62) : Math.round(SIZE * 0.74);
      ctx.font = `900 ${fontPx}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(digit, SIZE / 2, SIZE / 2 + fontPx * 0.02);
      let data;
      try {
        data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      } catch (e) { return null; } // tainted canvas guard (shouldn't happen locally)
      return (x, y) => {
        const px = Math.max(0, Math.min(SIZE - 1, Math.round(x)));
        const py = Math.max(0, Math.min(SIZE - 1, Math.round(y)));
        return data[(py * SIZE + px) * 4 + 3] > 128; // alpha of the glyph
      };
    }

    // Random-dart circle packing with radius classes + loose overlap reject.
    function packDots() {
      const dots = [];
      const cx = SIZE / 2, cy = SIZE / 2;
      const radiusClasses = [9, 7, 5.5, 4];
      const targetByClass = [70, 150, 300, 420];
      for (let ci = 0; ci < radiusClasses.length; ci++) {
        const r = radiusClasses[ci];
        let placed = 0, attempts = 0;
        const cap = targetByClass[ci] * 30; // attempt cap: never loop forever
        while (placed < targetByClass[ci] && attempts < cap) {
          attempts++;
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.sqrt(Math.random()) * (PACK_RADIUS - r);
          const x = cx + Math.cos(ang) * rad;
          const y = cy + Math.sin(ang) * rad;
          let ok = true;
          // Loose rejection: only check against nearby larger/equal dots.
          for (let k = dots.length - 1; k >= 0 && k > dots.length - 260; k--) {
            const o = dots[k];
            const dx = o.x - x, dy = o.y - y;
            const min = (o.r + r) * 0.86; // allow slight touch, like real plates
            if (dx * dx + dy * dy < min * min) { ok = false; break; }
          }
          if (ok) { dots.push({ x, y, r }); placed++; }
        }
      }
      return dots;
    }

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Render one plate to a <canvas> element and return it (or null on failure).
    function renderPlate(spec) {
      const mask = buildMask(spec.digit);
      if (!mask) return null;
      const dots = packDots();
      let cvs, ctx;
      try {
        cvs = document.createElement("canvas");
        // Hi-DPI crisp: back the 300px box with 2x pixels.
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cvs.width = SIZE * dpr; cvs.height = SIZE * dpr;
        cvs.style.width = "100%";
        cvs.style.maxWidth = SIZE + "px";
        cvs.style.height = "auto";
        ctx = cvs.getContext("2d");
        if (!ctx) return null;
        ctx.scale(dpr, dpr);
      } catch (e) { return null; }

      const figPal = spec.control ? PAL_FIGURE_CTRL : PAL_FIGURE_RG;
      const bgPal = spec.control ? PAL_BG_CTRL : PAL_BG_RG;

      for (const d of dots) {
        // Sample the mask at the dot centre to decide figure vs background.
        const fig = mask(d.x, d.y);
        const color = fig ? pick(figPal) : pick(bgPal);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      return cvs;
    }

    /* ---- run state: reshuffle plate order + digit selection each session ---- */
    let run, answers, current, canvasOK;

    function newRun() {
      // Fresh hidden digits for the red-green plates + one fixed-role control.
      const rgDigits = sampleDigits(RG_PLATE_COUNT);
      const controlDigit = pick(DIGIT_POOL.filter((d) => d.length === 1 && !rgDigits.includes(d)));
      const specs = rgDigits.map((digit) => ({ digit, control: false }));
      specs.push({ digit: controlDigit, control: true });
      run = shuffle(specs).map((spec) => ({
        spec,
        options: distractorsFor(spec.digit),
        canvas: null // cached on first render so Back/Next keeps the same dots
      }));
      answers = new Array(run.length).fill(null);
      current = 0;
      canvasOK = true;
    }

    /* ---- screens ---- */
    function intro() {
      root.innerHTML = `
        <div class="quiz quiz-intro">
          <div class="quiz-badges">
            <span class="quiz-badge time">⏱ Estimated time: about 3 minutes</span>
            <span class="quiz-badge">${RG_PLATE_COUNT + 1} color plates</span>
            <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
          </div>
          <h2>A free color-vision screening</h2>
          <p class="quiz-lede"><strong>Completely FREE Color Blindness Test. No signup, no email, no credit card. Instant results, no catch.</strong></p>
          <p>You'll see a series of dotted plates. Each one hides a <strong>number</strong> made of colored dots. For every plate, tell us which number you can read — or say you can't see one. It's the same idea as the classic dot-pattern plates, drawn fresh in your browser so nothing copyrighted is used.</p>
          <ul class="quiz-facts">
            <li><span>🔴</span><div><strong>Look for the number</strong> — each plate hides a digit or two in the dots.</div></li>
            <li><span>👁️</span><div><strong>Answer honestly</strong> — pick what you actually see, not what you think should be there.</div></li>
            <li><span>🟢</span><div><strong>Red-green focus</strong> — the plates screen the most common type of color-vision difference.</div></li>
            <li><span>🧭</span><div><strong>One control plate</strong> — a number almost everyone can read, to sanity-check your screen.</div></li>
          </ul>
          <div class="quiz-note warn">
            <strong>Read this first — this is a screening, not a diagnosis</strong>
            <p>This is an at-home color-vision check for curiosity and learning only. It is <strong>not a medical diagnosis</strong>. Your screen's colors, brightness, and the lighting in your room strongly affect the result, and no online test can replace a properly administered exam. If you have any concern about your color vision, please see an optometrist or ophthalmologist. Don't use this to self-diagnose or rule anything in or out.</p>
          </div>
          <div class="plate-tips">
            <strong>Before you start:</strong> view on a color screen at normal brightness, not in direct sunlight, and don't tilt the screen (angle shifts the colors). Glance at each plate naturally rather than staring.
          </div>
          <div class="actions"><button class="button primary" id="start">Start the screening →</button></div>
        </div>`;
      root.querySelector("#start").onclick = () => { current = 0; plate(); };
    }

    function plate() {
      const q = run[current];
      const answered = answers.filter((a) => a !== null).length;
      // Render once per plate and cache, so navigating Back/Next keeps the
      // exact same dot pattern (only the answer matters, not the speckle).
      if (canvasOK && !q.canvas) q.canvas = renderPlate(q.spec);
      const cvs = canvasOK ? q.canvas : null;
      if (!cvs) {
        // Graceful degradation — canvas unavailable/blocked.
        canvasOK = false;
        root.innerHTML = `
          <div class="quiz quiz-question">
            <div class="quiz-note warn">
              <strong>This screening needs canvas graphics</strong>
              <p>Your browser blocked the drawing surface this test uses to build the color plates, so it can't run here. Try a different browser or re-enable canvas/JavaScript, then reload.</p>
            </div>
            <div class="actions"><button class="button" id="back-intro">← Back</button></div>
          </div>`;
        const b = root.querySelector("#back-intro");
        if (b) b.onclick = () => intro();
        return;
      }

      const opts = q.options.map((d, i) => `
        <button type="button" class="q-option plate-opt${answers[current] === d ? " selected" : ""}" data-d="${esc(d)}">
          <span class="q-key">${String.fromCharCode(65 + i)}</span>
          <span class="q-val">${esc(d)}</span>
        </button>`).join("");

      root.innerHTML = `
        <div class="quiz quiz-question">
          <div class="quiz-topbar">
            <span class="quiz-cat">Plate ${current + 1} of ${run.length}</span>
            <span class="quiz-timer-wrap">${q.spec.control ? "🧭 control plate" : "🔎 find the number"}</span>
          </div>
          <div class="quiz-progress"><span style="width:${(current / run.length) * 100}%"></span></div>
          <p class="quiz-count">Plate ${current + 1} of ${run.length} · ${answered} answered</p>
          <h2 class="q-prompt">What number do you see?</h2>
          <div class="plate-stage" id="plate-stage"></div>
          <div class="q-options plate-options">
            ${opts}
            <button type="button" class="q-option plate-opt plate-none${answers[current] === NO_NUMBER ? " selected" : ""}" data-d="${NO_NUMBER}">
              <span class="q-key">✕</span>
              <span class="q-val">I can't see a number</span>
            </button>
          </div>
          <div class="actions quiz-nav">
            <button class="button" id="prev"${current === 0 ? " disabled" : ""}>← Back</button>
            ${current === run.length - 1
              ? `<button class="button primary" id="finish">See my result</button>`
              : `<button class="button primary" id="next">Next →</button>`}
          </div>
        </div>`;
      root.querySelector("#plate-stage").appendChild(cvs);

      root.querySelectorAll(".plate-opt").forEach((b) => {
        b.onclick = () => {
          answers[current] = b.dataset.d;
          if (current < run.length - 1) { current += 1; plate(); }
          else plate();
        };
      });
      const prev = root.querySelector("#prev");
      if (prev) prev.onclick = () => { if (current > 0) { current -= 1; plate(); } };
      const next = root.querySelector("#next");
      if (next) next.onclick = () => { if (current < run.length - 1) { current += 1; plate(); } };
      const finish = root.querySelector("#finish");
      if (finish) finish.onclick = () => confirmFinish();
    }

    function confirmFinish() {
      const blank = answers.filter((a) => a === null).length;
      if (blank > 0 && !window.confirm(`${blank} plate${blank === 1 ? " has" : "s have"} no answer yet — they'll count as "no number seen". Finish anyway?`)) return;
      results();
    }

    function results() {
      // Score: how many red-green plates were read as the intended digit,
      // plus whether the control was read (a proxy for good conditions).
      let rgTotal = 0, rgCorrect = 0;
      let controlSeen = null;
      run.forEach((q, i) => {
        const expected = q.spec.digit;
        const got = answers[i];
        if (q.spec.control) {
          controlSeen = (got === expected);
          return;
        }
        rgTotal += 1;
        if (got === expected) rgCorrect += 1;
      });

      const rgPct = rgTotal ? Math.round((rgCorrect / rgTotal) * 100) : 0;

      // Cautious interpretation. NEVER name a specific diagnosis as fact.
      let headline, tone, body;
      if (controlSeen === false) {
        headline = "Inconclusive";
        tone = "warn";
        body = "You didn't read the <strong>control plate</strong> — the one almost everyone can see. That usually points to a display or lighting problem (brightness too low, a color filter or night-mode on, sunlight on the screen, or a tilted panel) rather than to your color vision. Fix the viewing conditions and try again before reading anything into the result.";
      } else if (rgPct >= 80) {
        headline = "Consistent with typical color vision";
        tone = "ok";
        body = "You read most of the plates the way someone with typical red-green color vision would. On this quick screen, nothing stood out — but remember this is a rough at-home check, not a measurement.";
      } else if (rgPct >= 45) {
        headline = "Mixed — worth a proper test";
        tone = "warn";
        body = "You read some plates as expected and missed others. That can happen from screen and lighting conditions, from guessing, or it <em>may</em> suggest a mild red-green color-vision difference. This screen can't tell those apart. If you're curious, a proper test with an eye-care professional is the only way to know.";
      } else {
        headline = "May suggest a red-green difference";
        tone = "warn";
        body = "You read few of the hidden numbers the way typical color vision usually does. That pattern <em>may</em> be consistent with a red-green color-vision deficiency — the most common kind — but it can also come from your screen, lighting, or how the plates rendered. This is only a screening: it can't diagnose anything or name a specific condition. Please consider a professionally administered color-vision test.";
      }

      const controlLine = controlSeen === null
        ? ""
        : controlSeen
          ? `<p>✓ You read the control plate, so your screen and lighting were probably fine.</p>`
          : `<p>⚠ You did not read the control plate — treat everything above with extra caution.</p>`;

      root.innerHTML = `
        <div class="quiz quiz-results">
          <p class="eyebrow">Your screening result</p>
          <div class="score-hero">
            <div class="score-big">${rgCorrect}/${rgTotal}<small>red-green plates read as expected</small></div>
            <div class="score-meta">
              <p><strong>${esc(headline)}</strong></p>
              <p>${rgPct}% of the screening plates matched the intended number.</p>
              ${controlLine}
            </div>
          </div>
          <div class="quiz-note ${tone === "ok" ? "" : "warn"}">
            <strong>What this suggests (cautiously)</strong>
            <p>${body}</p>
          </div>
          <div class="quiz-note warn">
            <strong>This is a screening, not a diagnosis</strong>
            <p>An online dot-plate check can only ever be <em>suggestive</em>. Screen colors, brightness, night-mode filters, and room lighting all change what you see, and this test cannot replace an eye-care professional. It cannot diagnose color blindness, rule it out, or name a specific type. If your color vision matters for work, safety, or peace of mind, book a proper test with an optometrist or ophthalmologist.</p>
          </div>
          <div class="plate-tips">
            <strong>Why plates like these work:</strong> the figure dots and background dots are chosen to differ mainly in <em>hue</em> along the red-green axis while staying close in brightness. Someone with typical color vision separates them by color and reads the number; a red-green difference makes them blend together. Because brightness and screen settings can fake or hide that effect, at-home results are only ever a hint.
          </div>
          ${shareBar()}
          <div class="actions">
            <button class="button primary" id="retake">Try again</button>
          </div>
          <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone. Trying again reshuffles the plates and the hidden numbers.</p>
        </div>`;
      wireShare(`I read ${rgCorrect}/${rgTotal} hidden numbers on this free color vision screening 👁️ See how many you can spot:`);
      root.querySelector("#retake").onclick = () => { newRun(); plate(); };
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    newRun();
    intro();
  }

function renderLoveCalculator() {
  /* ------------------------------------------------------------------
   *  Algorithm (deterministic, symmetric, transparent)
   *
   *  Normalise each name: lowercase, keep only [a-z].
   *  Combine the two normalised strings in canonical order (sorted
   *  alphabetically so A+B == B+A) into a single "signature".
   *
   *  Hash via a simple djb2-style mix — no external libraries needed.
   *  Map the hash to 0-100 using modulo-then-scale, then "warm"
   *  (bias away from the extremes a little so extreme scores feel
   *  earned rather than common).
   *
   *  Sub-factor scores are also derived from the combined signature /
   *  properties so they are symmetric and always the same for a given
   *  pair.
   * ------------------------------------------------------------------ */

  /* ---- helpers specific to this module ---- */
  function normName(raw) {
    return String(raw).toLowerCase().replace(/[^a-z]/g, "");
  }

  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; // djb2, unsigned 32-bit
    }
    return h;
  }

  // Canonical combined key — symmetric by construction.
  function pairKey(na, nb) {
    const [a, b] = [na, nb].sort();
    return a + "|" + b;
  }

  // Map a 32-bit hash to [0, 100] with a mild centre bias.
  function hashToScore(h) {
    const raw = h % 101; // 0-100 uniform
    // Bias: nudge scores within [15, 90] more often by blending two draws.
    const h2 = hashStr(String(h) + "x") % 101;
    const blended = Math.round((raw + h2) / 2);
    // Clamp to [8, 97] so extreme scores feel special.
    return Math.max(8, Math.min(97, blended));
  }

  // Derive a sub-score (0-100) from the pair key with a secondary salt.
  function subScore(key, salt, lo, hi) {
    const h = hashStr(key + salt);
    const span = hi - lo;
    return lo + (h % (span + 1));
  }

  /* ---- verdict bands ---- */
  const verdicts = [
    { max: 20, label: "Cosmic Strangers", message: (a, b) =>
        `${a} and ${b} march to completely different drums — and honestly, that's rare. The universe clearly has a sense of humour pairing you two, but stranger things have worked out. You'd both make excellent pen pals.` },
    { max: 40, label: "Unlikely Allies", message: (a, b) =>
        `${a} and ${b} have some ground to cover, but a little mystery never hurt anyone. Opposites have a funny way of keeping things interesting. There's potential here if you're both curious enough to explore it.` },
    { max: 60, label: "Nice Spark", message: (a, b) =>
        `${a} and ${b} have a genuine spark going. It's not written in the stars or anything — more like a warm Tuesday-afternoon kind of chemistry. Comfortable, easy, worth pursuing.` },
    { max: 80, label: "Strong Pull", message: (a, b) =>
        `${a} and ${b} are a strong match by the letters. There's a real pull here — the comfortable kind, where you finish each other's sentences and also each other's snacks. Go for it.` },
    { max: 100, label: "Meant to Be? 💘", message: (a, b) =>
        `${a} and ${b} — the letters don't lie. This is the kind of match that makes a great story. The energy is high, the resonance is real, and the universe seems to agree. At least the alphabet does.` }
  ];

  function getVerdict(score) {
    return verdicts.find((v) => score <= v.max);
  }

  /* ---- factor definitions ---- */
  // Each factor returns a {label, score:0-100} from normalised names.
  function factors(na, nb) {
    const key = pairKey(na, nb);

    // 1. Shared letters — symmetric set intersection.
    const setA = new Set(na.split(""));
    const setB = new Set(nb.split(""));
    const shared = [...setA].filter((c) => setB.has(c)).length;
    const union = new Set([...setA, ...setB]).size;
    const letterScore = union > 0 ? Math.round((shared / union) * 100) : 50;

    // 2. Name-length harmony — closer lengths = higher score.
    const diff = Math.abs(na.length - nb.length);
    const maxLen = Math.max(na.length, nb.length, 1);
    const lengthScore = Math.round((1 - diff / maxLen) * 100);

    // 3. Vowel balance — how close the vowel densities are.
    const vowels = new Set(["a", "e", "i", "o", "u"]);
    const vA = na.length > 0 ? [...na].filter((c) => vowels.has(c)).length / na.length : 0;
    const vB = nb.length > 0 ? [...nb].filter((c) => vowels.has(c)).length / nb.length : 0;
    const vowelScore = Math.round((1 - Math.abs(vA - vB)) * 100);

    // 4. Rhythm resonance — mix of the pair's hash, unique to the pair.
    const rhythmScore = subScore(key, "rhythm", 30, 98);

    return [
      { label: "Shared letters", score: letterScore },
      { label: "Name-length harmony", score: lengthScore },
      { label: "Vowel balance", score: vowelScore },
      { label: "Rhythm resonance", score: rhythmScore }
    ];
  }

  /* ---- screens ---- */
  function intro() {
    root.innerHTML = `
      <div class="quiz quiz-intro">
        <div class="quiz-badges">
          <span class="quiz-badge time">💘 Just your names — nothing else</span>
          <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
        </div>
        <h2>Love Calculator — name compatibility</h2>
        <p class="quiz-lede"><strong>Completely FREE Love Calculator. No signup, no email, no credit card. Instant results, no catch.</strong> Enter two names and get an instant, deterministic love-compatibility score — same pair, same result every time.</p>
        <ul class="quiz-facts">
          <li><span>🔤</span><div><strong>Letters only</strong> — the score is worked out from the letters in each name. No birthdays, no personal data.</div></li>
          <li><span>📊</span><div><strong>Broken down by factor</strong> — shared letters, name-length harmony, vowel balance, and rhythm resonance.</div></li>
          <li><span>🔒</span><div><strong>Runs entirely in your browser</strong> — nothing is sent anywhere or saved. Refresh and it's gone.</div></li>
        </ul>
        <div class="quiz-note">
          <strong>It's a game, not a prediction</strong>
          <p>This is a fun letter-maths game. The score says nothing about your real compatibility — that takes, you know, actually knowing each other. Enjoy it for what it is.</p>
        </div>
        <div class="love-inputs">
          <div class="field">
            <label for="love-name-a">Your name</label>
            <input type="text" id="love-name-a" placeholder="Enter your name" maxlength="60" autocomplete="off" spellcheck="false">
          </div>
          <div class="love-heart-divider" aria-hidden="true">💘</div>
          <div class="field">
            <label for="love-name-b">Their name</label>
            <input type="text" id="love-name-b" placeholder="Enter their name" maxlength="60" autocomplete="off" spellcheck="false">
          </div>
        </div>
        <p id="love-error" class="error" hidden></p>
        <div class="actions">
          <button class="button primary" id="love-calc">Calculate our score →</button>
        </div>
      </div>`;

    const inA = root.querySelector("#love-name-a");
    const inB = root.querySelector("#love-name-b");
    const btn = root.querySelector("#love-calc");
    const err = root.querySelector("#love-error");

    function validate() {
      const ok = normName(inA.value).length > 0 && normName(inB.value).length > 0;
      btn.disabled = false; // always allow click, show message instead
      return ok;
    }

    btn.onclick = () => {
      const na = normName(inA.value);
      const nb = normName(inB.value);
      if (!na || !nb) {
        err.textContent = na
          ? "Please enter a name in the second field."
          : nb
          ? "Please enter a name in the first field."
          : "Please enter both names to calculate.";
        err.hidden = false;
        (na ? inB : inA).focus();
        return;
      }
      err.hidden = true;
      results(inA.value.trim(), inB.value.trim(), na, nb);
    };

    // Allow Enter in either field.
    [inA, inB].forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btn.click();
      });
    });

    inA.focus();
  }

  function results(rawA, rawB, na, nb) {
    // --- compute ---
    const key = pairKey(na, nb);
    const h = hashStr(key);
    const score = hashToScore(h);
    const verdict = getVerdict(score);
    const fs = factors(na, nb);

    // Safe-escaped display names.
    const dA = esc(rawA);
    const dB = esc(rawB);

    // Factor bar HTML.
    const factorRows = fs.map((f) => `
      <div class="score-row">
        <div class="score-row-head"><span>${esc(f.label)}</span><strong>${f.score}%</strong></div>
        <div class="score-bar"><span class="love-bar-fill" style="width:0%" data-pct="${f.score}%"></span></div>
      </div>`).join("");

    root.innerHTML = `
      <div class="quiz quiz-results">
        <p class="eyebrow">Your love score</p>
        <div class="score-hero love-result-hero">
          <div class="score-big love-score-big">${score}<small>out of 100</small></div>
          <div class="score-meta">
            <p><strong>${esc(verdict.label)}</strong></p>
            <p>${verdict.message(dA, dB)}</p>
          </div>
        </div>
        <div class="love-meter-wrap" aria-label="Love meter: ${score} out of 100">
          <div class="love-meter-track">
            <div class="love-meter-fill" id="love-meter-fill" style="width:0%" data-pct="${score}%"></div>
          </div>
          <div class="love-meter-labels">
            <span>0%</span>
            <span class="love-meter-score" id="love-meter-label">0%</span>
            <span>100%</span>
          </div>
        </div>
        <h3>How the score breaks down</h3>
        <div class="score-rows">${factorRows}</div>
        <div class="quiz-note">
          <strong>Same pair, same result — always</strong>
          <p>The score is worked out from the letters in both names using a fixed algorithm, so ${dA} and ${dB} will always get ${score}% on this calculator. Swap the order and the result is the same. It's deterministic, not magic — but a little of both, maybe.</p>
        </div>
        ${shareBar()}
        <div class="actions">
          <button class="button primary" id="love-again">Try another pair</button>
        </div>
        <p class="quiz-share-note">Nothing was uploaded or saved — this all runs in your browser. Refresh and it's gone.</p>
      </div>`;

    wireShare(`${rawA} + ${rawB} = ${score}% on the love calculator 💘 (${verdict.label}) Try your names free:`);
    root.querySelector("#love-again").onclick = () => {
      intro();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    };

    // Animate the meter and factor bars after paint.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fill = document.getElementById("love-meter-fill");
        const label = document.getElementById("love-meter-label");
        if (fill) {
          fill.style.transition = "width 1s cubic-bezier(.22,.68,0,1.2)";
          fill.style.width = score + "%";
        }
        if (label) {
          // Set the true value synchronously first, so a backgrounded tab (where
          // rAF/timers are frozen) still shows the correct score. The rAF count-up
          // below is pure visual enhancement when the tab is visible.
          label.textContent = score + "%";
          let start = null;
          const dur = 900;
          function step(ts) {
            if (!start) start = ts;
            const prog = Math.min((ts - start) / dur, 1);
            const val = Math.round(prog * score);
            label.textContent = val + "%";
            if (prog < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }
        // Animate factor bars with a short stagger.
        root.querySelectorAll(".love-bar-fill").forEach((el, i) => {
          setTimeout(() => {
            el.style.transition = "width .7s ease";
            el.style.width = el.dataset.pct;
          }, 200 + i * 80);
        });
      });
    });

    root.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  intro();
}

})();
