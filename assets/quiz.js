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

  if (slug === "iq-test") renderIqTest();
  else if (slug === "personality-type-test") renderPersonalityTest();
  else if (slug === "zodiac-compatibility") renderZodiac();
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

    /* ---- item bank (all original) ---- */
    // Each item: { cat, prompt, promptSvg?, options:[{t?/svg?}], correct } where
    // correct is the index into options BEFORE shuffle.
    const txt = (t) => ({ t });
    const items = [
      // Number series
      { cat: "Numerical", prompt: "What number continues the series?  2, 4, 8, 16, __", options: [txt("24"), txt("32"), txt("20"), txt("64")], correct: 1 },
      { cat: "Numerical", prompt: "What number continues the series?  1, 4, 9, 16, __", options: [txt("20"), txt("24"), txt("25"), txt("36")], correct: 2 },
      { cat: "Numerical", prompt: "What number continues the series?  1, 1, 2, 3, 5, 8, __", options: [txt("11"), txt("13"), txt("10"), txt("15")], correct: 1 },
      { cat: "Numerical", prompt: "What number continues the series?  2, 3, 5, 7, 11, __", options: [txt("12"), txt("13"), txt("14"), txt("15")], correct: 1 },
      { cat: "Numerical", prompt: "What number continues the series?  81, 27, 9, 3, __", options: [txt("0"), txt("1"), txt("2"), txt("3")], correct: 1 },
      { cat: "Numerical", prompt: "What number continues the series?  2, 6, 12, 20, __", options: [txt("28"), txt("30"), txt("24"), txt("32")], correct: 1 },
      { cat: "Numerical", prompt: "What number continues the series?  100, 96, 88, 72, __", options: [txt("64"), txt("56"), txt("48"), txt("40")], correct: 3 },
      { cat: "Numerical", prompt: "What number continues the series?  7, 14, 12, 24, 22, __", options: [txt("44"), txt("20"), txt("11"), txt("33")], correct: 0 },
      // Verbal analogies
      { cat: "Verbal", prompt: "Hand is to glove as foot is to __", options: [txt("sock"), txt("shoe leather"), txt("toe"), txt("ankle")], correct: 0 },
      { cat: "Verbal", prompt: "Cub is to bear as kitten is to __", options: [txt("dog"), txt("cat"), txt("lion"), txt("mouse")], correct: 1 },
      { cat: "Verbal", prompt: "Water is to thirst as food is to __", options: [txt("plate"), txt("cook"), txt("hunger"), txt("taste")], correct: 2 },
      { cat: "Verbal", prompt: "Petal is to flower as page is to __", options: [txt("word"), txt("book"), txt("cover"), txt("ink")], correct: 1 },
      { cat: "Verbal", prompt: "Painter is to brush as writer is to __", options: [txt("paper"), txt("story"), txt("pen"), txt("desk")], correct: 2 },
      { cat: "Verbal", prompt: "Island is to water as oasis is to __", options: [txt("sand"), txt("desert"), txt("palm"), txt("camel")], correct: 1 },
      { cat: "Verbal", prompt: "Whisper is to shout as dim is to __", options: [txt("dark"), txt("faint"), txt("bright"), txt("quiet")], correct: 2 },
      { cat: "Verbal", prompt: "Second is to minute as minute is to __", options: [txt("hour"), txt("day"), txt("clock"), txt("time")], correct: 0 },
      // Odd one out
      { cat: "Verbal", prompt: "Which word does NOT belong with the others?", options: [txt("rose"), txt("tulip"), txt("oak"), txt("daisy")], correct: 2 },
      { cat: "Verbal", prompt: "Which does NOT belong with the others?", options: [txt("copper"), txt("iron"), txt("gold"), txt("plastic")], correct: 3 },
      { cat: "Verbal", prompt: "Which animal does NOT belong with the others?", options: [txt("whale"), txt("shark"), txt("dolphin"), txt("seal")], correct: 1 },
      { cat: "Numerical", prompt: "Which number does NOT belong with the others?", options: [txt("2"), txt("3"), txt("9"), txt("11")], correct: 2 },
      { cat: "Verbal", prompt: "Which instrument does NOT belong with the others?", options: [txt("violin"), txt("guitar"), txt("flute"), txt("cello")], correct: 2 },
      // Logical deduction
      { cat: "Logical", prompt: "All roses are flowers. Some flowers fade quickly. Does it follow that all roses fade quickly?", options: [txt("Yes, it must"), txt("No, it does not follow"), txt("Only red roses"), txt("Cannot tell at all")], correct: 1 },
      { cat: "Logical", prompt: "If it rains, the ground gets wet. The ground is wet. Did it necessarily rain?", options: [txt("Yes, definitely"), txt("No, something else could have wet it"), txt("Only if it is cloudy"), txt("It never rained")], correct: 1 },
      { cat: "Logical", prompt: "Some cats are black. All black things absorb heat. Therefore, some cats absorb heat.", options: [txt("Valid — it follows"), txt("Invalid — it does not follow"), txt("Only in sunlight"), txt("Depends on the cat")], correct: 0 },
      { cat: "Logical", prompt: "Tom is taller than Sam. Sam is taller than Bo. Who is shortest?", options: [txt("Tom"), txt("Sam"), txt("Bo"), txt("Cannot tell")], correct: 2 },
      { cat: "Logical", prompt: "Town A is north of B. C is south of B. Which town is furthest north?", options: [txt("A"), txt("B"), txt("C"), txt("They are level")], correct: 0 },
      { cat: "Logical", prompt: "Every day it is sunny, Mia walks. Today Mia did not walk. What can you conclude?", options: [txt("It was sunny"), txt("It was not sunny"), txt("Mia was ill"), txt("Nothing at all")], correct: 1 },
      // Figural — count progression matrix
      {
        cat: "Spatial", prompt: "Complete the pattern. Which figure belongs in the empty cell?",
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
      // Figural — rotation matrix (each column +45°, each row +45°)
      {
        cat: "Spatial", prompt: "Complete the pattern. Which figure belongs in the empty cell?",
        matrix: [
          arrowCell(0), arrowCell(45), arrowCell(90),
          arrowCell(45), arrowCell(90), arrowCell(135),
          arrowCell(90), arrowCell(135), null
        ],
        options: [
          { svg: arrowCell(180) }, { svg: arrowCell(135) }, { svg: arrowCell(90) }, { svg: arrowCell(0) }
        ], correct: 0
      },
      // Figural — fill alternation matrix (columns: circle/square/triangle; rows toggle fill)
      {
        cat: "Spatial", prompt: "Complete the pattern. Which figure belongs in the empty cell?",
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
      // Mental rotation — which option is the SAME glyph rotated (not mirrored)?
      {
        cat: "Spatial", prompt: "The figure on the left is shown first. Which option is the SAME figure simply rotated (not flipped/mirrored)?",
        promptSvg: glyph("rotate(0 45 45)"),
        options: [
          { svg: glyph("rotate(90 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(90 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(180 45 45)") }
        ], correct: 0
      },
      {
        cat: "Spatial", prompt: "Which option is the SAME figure simply rotated (not flipped/mirrored)?",
        promptSvg: glyph("rotate(0 45 45)"),
        options: [
          { svg: glyph("matrix(-1,0,0,1,90,0)") },
          { svg: glyph("rotate(180 45 45)") },
          { svg: glyph("matrix(-1,0,0,1,90,0) rotate(90 45 45)") },
          { svg: glyph("matrix(1,0,0,-1,0,90)") }
        ], correct: 1
      }
    ];

    const TOTAL = items.length;
    const TIME_LIMIT = 25 * 60; // seconds, soft cap; auto-submits at 0.

    // Prepare a shuffled run: shuffle item order and each item's options.
    const run = shuffle(items).map((item) => {
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
            <span class="quiz-badge time">⏱ Estimated time: about 20 minutes</span>
            <span class="quiz-badge">${TOTAL} questions</span>
            <span class="quiz-badge ok">✓ 100% free · no sign-up · no email</span>
          </div>
          <h2>A free reasoning (IQ-style) test</h2>
          <p class="quiz-lede"><strong>Completely FREE IQ Test. No signup, no email, no credit card. Instant results, no catch.</strong></p>
          <p>This test estimates fluid reasoning the way established cognitive assessments do — through <strong>original</strong> puzzles across four proven item families used in real intelligence research. No question here is copied from any published test.</p>
          <ul class="quiz-facts">
            <li><span>🔢</span><div><strong>Number &amp; series</strong> — spot the numerical rule and continue the pattern.</div></li>
            <li><span>🔤</span><div><strong>Verbal reasoning</strong> — analogies and odd-one-out relationships.</div></li>
            <li><span>🧩</span><div><strong>Logical reasoning</strong> — short deductions and valid-or-not judgments.</div></li>
            <li><span>◑</span><div><strong>Pattern &amp; spatial</strong> — matrix completion and mental rotation.</div></li>
          </ul>
          <div class="quiz-note">
            <strong>How to get an accurate result</strong>
            <p>Work somewhere quiet and answer without help or a calculator. There is a gentle 25-minute timer, and every question is multiple-choice with one best answer. Your result is an <em>unnormed self-assessment estimate</em> — a useful practice indicator, not a clinical IQ score.</p>
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
      run.forEach((q, i) => {
        const c = q.item.cat;
        byCat[c] = byCat[c] || { correct: 0, total: 0 };
        byCat[c].total += 1;
        if (answers[i] === q.correctIndex) { correct += 1; byCat[c].correct += 1; }
      });
      const p = correct / TOTAL;
      // Honest, clearly-unnormed mapping: centre average performance near 100.
      let est = Math.round(100 + (p - 0.55) * 62);
      est = Math.max(70, Math.min(145, est));
      const lo = Math.max(60, est - 7);
      const hi = Math.min(160, est + 7);
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
            <strong>What these categories mean</strong>
            <p><strong>Number &amp; series</strong> and <strong>logical reasoning</strong> lean on sequential, rule-finding thinking. <strong>Verbal reasoning</strong> reflects how you map relationships between concepts. <strong>Pattern &amp; spatial</strong> is the closest to "fluid intelligence" — reasoning about brand-new visual problems with no learned answer.</p>
          </div>
          <div class="actions">
            <button class="button primary" id="retake">Retake the test</button>
          </div>
          <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone. Retaking reshuffles the questions and answer order.</p>
        </div>`;
      root.querySelector("#retake").onclick = () => location.reload();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };

    intro();
  }

  /* =====================================================================
   *  PERSONALITY TYPE TEST  (built next)
   * ===================================================================== */
  function renderPersonalityTest() {
    root.innerHTML = '<div class="loading-state">Personality test coming online…</div>';
  }

  /* =====================================================================
   *  ZODIAC COMPATIBILITY  (built next)
   * ===================================================================== */
  function renderZodiac() {
    root.innerHTML = '<div class="loading-state">Zodiac guide coming online…</div>';
  }
})();
