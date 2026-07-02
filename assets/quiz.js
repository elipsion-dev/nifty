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
                <button type="button" class="p-dot${answers[gi] === v ? " selected" : ""}" data-gi="${gi}" data-v="${v}" title="${esc(label)}" aria-label="${esc(label)}"><span>${label}</span></button>`).join("")}
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
   *  ZODIAC COMPATIBILITY  (built next)
   * ===================================================================== */
  function renderZodiac() {
    root.innerHTML = '<div class="loading-state">Zodiac guide coming online…</div>';
  }
})();
