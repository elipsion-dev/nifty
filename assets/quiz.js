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
          <div class="actions"><button class="button primary" id="retake">Retake the test</button></div>
          <p class="quiz-share-note">Nothing was uploaded or saved — refresh and it's gone.</p>
        </div>`;
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
          <div class="actions">
            <button class="button primary" id="again">Try another pairing</button>
          </div>
          <p class="quiz-share-note">Nothing was uploaded or saved — this all runs in your browser.</p>
        </div>`;
      root.querySelector("#again").onclick = () => { intro(); root.scrollIntoView({ block: "start", behavior: "smooth" }); };
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    intro();
  }
})();
