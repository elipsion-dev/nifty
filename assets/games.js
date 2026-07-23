/*
 * games.js — interactive "Typing Games" category.
 * Mounts one game into #tool-root based on data-tool:
 *   falling-letters, word-cannon, musical-typing, key-trainer,
 *   word-sprint, balloon-pop, key-memory, ztype.
 * Everything runs in the browser. Nothing is sent anywhere or stored on a server.
 * Word lists are original; melodies are public-domain classics — no copyrighted
 * game music (Mario, Zelda, etc.) is reproduced. ZType is an external embed.
 */
(() => {
  "use strict";
  const root = document.getElementById("tool-root");
  if (!root) return;
  const slug = root.dataset.tool;

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];

  /* ---------- shared Web Audio (lazy, unlocked on first gesture) ---------- */
  let audioCtx = null;
  function resumeAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (_) { /* audio unavailable */ }
  }
  function beep(freq, dur = 0.14, type = "sine", vol = 0.18) {
    if (!audioCtx) return;
    try {
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (_) { /* ignore */ }
  }

  /* ---------- shared screens (reuse the site's quiz-intro / quiz-results CSS) ---------- */
  function introScreen(emoji, title, lede, facts, startId) {
    return `
      <div class="quiz quiz-intro">
        <div class="quiz-badges">
          <span class="quiz-badge time">${emoji} Typing game</span>
          <span class="quiz-badge ok">✓ 100% free · no sign-up · learn while you play</span>
        </div>
        <h2>${esc(title)}</h2>
        <p class="quiz-lede">${lede}</p>
        <ul class="quiz-facts">${facts.map((f) => `<li><span>${f[0]}</span><div>${f[1]}</div></li>`).join("")}</ul>
        <div class="actions"><button class="button primary" id="${startId}">Start game →</button></div>
      </div>`;
  }
  function overScreen(flash, score, scoreLabel, detail, againId) {
    return `
      <div class="quiz quiz-results">
        <p class="quiz-flash">${flash}</p>
        <div class="score-hero">
          <div class="score-big">${score}<small>${esc(scoreLabel)}</small></div>
          <div class="score-meta"><p>${detail}</p></div>
        </div>
        <div class="actions">
          <button class="button primary" id="${againId}">Play again →</button>
          <a class="button" href="index.html">More typing games</a>
          <a class="button" href="../quizzes/typing-speed-test.html">Test your speed</a>
        </div>
      </div>`;
  }
  function canvasStage(quitId, showLives) {
    return `
      <div class="game-wrap">
        <div class="game-hud">
          <div class="game-hud-item"><span>Score</span><strong id="g-score">0</strong></div>
          <div class="game-hud-item"><span>Level</span><strong id="g-level">1</strong></div>
          ${showLives === false ? `<div class="game-hud-item"><span>Time</span><strong id="g-time">–</strong></div>` : `<div class="game-hud-item"><span>Lives</span><strong id="g-lives">❤️❤️❤️</strong></div>`}
        </div>
        <canvas id="g-canvas" class="game-canvas" aria-label="Typing game play area"></canvas>
        <p class="game-hint">Just type on your keyboard — no clicking needed. <button type="button" class="linklike" id="${quitId}">Quit to menu</button></p>
      </div>`;
  }
  function fitCanvas(cv) {
    const dpr = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    const W = Math.max(280, Math.floor(rect.width));
    const H = Math.max(320, Math.floor(rect.height));
    cv.width = Math.floor(W * dpr);
    cv.height = Math.floor(H * dpr);
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }
  const hud = (id, val) => { const el = root.querySelector(id); if (el) el.textContent = val; };
  const lifeStr = (n) => (n > 0 ? "❤️".repeat(n) : "—");

  /* =====================================================================
   *  GAME 1 — FALLING LETTERS (now with capitals)
   * ===================================================================== */
  function renderFallingLetters() {
    const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
    let raf = null, keyfn = null, resizefn = null, running = false;
    let letters = [], pops = [], score = 0, lives = 3, spawnAcc = 0, last = 0;
    let cv = null, ctx = null, W = 0, H = 0;

    function teardown() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (keyfn) { document.removeEventListener("keydown", keyfn); keyfn = null; }
      if (resizefn) { window.removeEventListener("resize", resizefn); resizefn = null; }
    }
    function intro() {
      teardown();
      root.innerHTML = introScreen("🔤", "Falling Letters",
        "Letters drift down from the top of the screen. Type each one before it reaches the floor. It gently speeds up as your score climbs, and CAPITAL letters (hold Shift!) start mixing in as it gets harder. Miss three and the round ends.",
        [["⌨️", "<strong>Type the letter you see</strong> — no Enter, no mouse. Capitals need the Shift key."],
         ["🎯", "When letters pile up, clear the <strong>lowest</strong> ones first."],
         ["❤️", "Three lives; a letter reaching the floor costs one."]],
        "g-start");
      root.querySelector("#g-start").onclick = () => { resumeAudio(); start(); };
    }
    function level() { return Math.floor(score / 12) + 1; }
    function fallSpeed() { return Math.min(160, 40 + level() * 10); }
    function spawnEvery() { return Math.max(0.55, 1.55 - level() * 0.09); }
    function capChance() { return Math.min(0.4, (level() - 1) * 0.06); } // rare → ~40%

    function start() {
      teardown();
      letters = []; pops = []; score = 0; lives = 3; spawnAcc = 0; last = 0; running = true;
      root.innerHTML = canvasStage("g-quit");
      cv = root.querySelector("#g-canvas");
      ({ ctx, W, H } = fitCanvas(cv));
      resizefn = () => { if (cv) ({ ctx, W, H } = fitCanvas(cv)); };
      window.addEventListener("resize", resizefn);
      keyfn = (e) => {
        if (!running || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) { e.preventDefault(); hit(e.key); }
      };
      document.addEventListener("keydown", keyfn);
      root.querySelector("#g-quit").onclick = intro;
      updateHud();
      raf = requestAnimationFrame(loop);
    }
    function hit(ch) { // case-sensitive: "A" only matches falling "A"
      let idx = -1, maxY = -1;
      for (let i = 0; i < letters.length; i++) {
        if (letters[i].ch === ch && letters[i].y > maxY) { maxY = letters[i].y; idx = i; }
      }
      if (idx >= 0) {
        pops.push({ x: letters[idx].x, y: letters[idx].y, r: 8, a: 1 });
        letters.splice(idx, 1);
        score++;
        beep(440 + rand(200), 0.08, "triangle", 0.13);
        updateHud();
      }
    }
    function spawn() {
      let ch = pick(LOWER);
      if (Math.random() < capChance()) ch = ch.toUpperCase();
      letters.push({ ch, x: 28 + Math.random() * (W - 56), y: -8 });
    }
    function loop(ts) {
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      spawnAcc += dt;
      if (spawnAcc >= spawnEvery()) { spawnAcc = 0; spawn(); }
      const floorY = H - 40, v = fallSpeed();
      for (let i = letters.length - 1; i >= 0; i--) {
        letters[i].y += v * dt;
        if (letters[i].y >= floorY) {
          letters.splice(i, 1); lives--; beep(110, 0.2, "sawtooth", 0.16); updateHud();
          if (lives <= 0) return gameover();
        }
      }
      draw(floorY);
      raf = requestAnimationFrame(loop);
    }
    function draw(floorY) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(239,68,68,.45)"; ctx.lineWidth = 2; ctx.setLineDash([7, 7]);
      ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const L of letters) {
        const d = Math.min(1, L.y / floorY);
        const cap = L.ch !== L.ch.toLowerCase();
        ctx.font = `700 ${cap ? 40 : 36}px 'Iowan Old Style',Georgia,serif`;
        ctx.fillStyle = cap
          ? `rgb(${Math.round(250)},${Math.round(200 - d * 120)},${Math.round(80)})`
          : `rgb(${Math.round(110 + d * 145)},${Math.round(225 - d * 150)},${Math.round(200 - d * 130)})`;
        ctx.fillText(L.ch, L.x, L.y);
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        ctx.strokeStyle = `rgba(45,212,191,${Math.max(0, p.a)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        p.r += 1.6; p.a -= 0.06; if (p.a <= 0) pops.splice(i, 1);
      }
    }
    function updateHud() { hud("#g-score", score); hud("#g-level", level()); hud("#g-lives", lifeStr(lives)); }
    function gameover() {
      teardown();
      root.innerHTML = overScreen("💥 Game over — nice reflexes!", score, "letters cleared",
        `You cleared <strong>${score}</strong> letters and reached <strong>level ${level()}</strong>. Every round trains your fingers to find keys — including the Shift reaches — without looking.`, "g-again");
      root.querySelector("#g-again").onclick = () => { resumeAudio(); start(); };
    }
    intro();
  }

  /* =====================================================================
   *  GAME 2 — WORD CANNON (circus cannon, smoke/explosion, unique words)
   * ===================================================================== */
  function renderWordCannon() {
    const POOLS = [
      "planet garden bright yellow orange purple silver bottle window pencil rocket forest island cactus button candle basket dragon flower guitar".split(" "),
      "keyboard journey picture morning balance chicken diamond harvest kingdom library machine network rainbow blanket citizen freedom lantern penguin".split(" "),
      "adventure knowledge celebrate wonderful chocolate beautiful discovery dangerous education furniture generator happiness invention landscape orchestra".split(" ")
    ];
    let raf = null, keyfn = null, resizefn = null, running = false;
    let words = [], parts = [], score = 0, lives = 3, spawnAcc = 0, last = 0, active = null;
    let cv = null, ctx = null, W = 0, H = 0;
    const GY = 60;

    function teardown() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (keyfn) { document.removeEventListener("keydown", keyfn); keyfn = null; }
      if (resizefn) { window.removeEventListener("resize", resizefn); resizefn = null; }
    }
    function intro() {
      teardown();
      root.innerHTML = introScreen("🎯", "Word Cannon",
        "Words blast out of a circus cannon and arc across the screen. Type a word to shoot it down before it lands. Type its first letter to lock on, then finish it. The words are always six letters or more, and they come faster as you level up.",
        [["🎪", "Words fire from the cannon — <strong>type the first letter</strong> to lock on, then type the rest."],
         ["⚡", "No repeats on screen, and they speed up the higher you climb."],
         ["❤️", "Three lives; a word that lands before you finish it costs one."]],
        "g-start");
      root.querySelector("#g-start").onclick = () => { resumeAudio(); start(); };
    }
    function level() { return Math.floor(score / 30) + 1; }
    function spawnEvery() { return Math.max(0.9, 2.6 - level() * 0.18); } // faster and faster
    function poolFor() {
      const t = Math.min(POOLS.length - 1, Math.floor((level() - 1) / 2));
      return Math.random() < 0.7 ? POOLS[t] : POOLS[Math.min(POOLS.length - 1, t + 1)];
    }

    function start() {
      teardown();
      words = []; parts = []; score = 0; lives = 3; spawnAcc = 0; last = 0; active = null; running = true;
      root.innerHTML = canvasStage("g-quit");
      cv = root.querySelector("#g-canvas");
      ({ ctx, W, H } = fitCanvas(cv));
      resizefn = () => { if (cv) ({ ctx, W, H } = fitCanvas(cv)); };
      window.addEventListener("resize", resizefn);
      keyfn = (e) => {
        if (!running || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) { e.preventDefault(); typeChar(e.key.toLowerCase()); }
      };
      document.addEventListener("keydown", keyfn);
      root.querySelector("#g-quit").onclick = intro;
      updateHud();
      raf = requestAnimationFrame(loop);
    }
    function typeChar(ch) {
      if (active && !active.dead) {
        if (active.text[active.typed] === ch) {
          active.typed++;
          beep(360 + active.typed * 40, 0.06, "square", 0.1);
          if (active.typed >= active.text.length) { popWord(active); active = null; }
        }
        return;
      }
      let best = null;
      for (const w of words) { if (!w.dead && w.text[0] === ch && (!best || w.x > best.x)) best = w; }
      if (best) {
        active = best; best.typed = 1;
        beep(360, 0.06, "square", 0.1);
        if (best.text.length === 1) { popWord(best); active = null; }
      }
    }
    function popWord(w) {
      w.dead = true;
      burst(w.x + 20, w.y, "#2dd4bf", 14);
      score += w.text.length;
      beep(680, 0.12, "triangle", 0.14);
      updateHud();
    }
    function burst(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 90;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color, smoke: false });
      }
    }
    function smoke(x, y) {
      for (let i = 0; i < 8; i++) {
        parts.push({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vx: 30 + Math.random() * 40, vy: -20 - Math.random() * 30, life: 1, r: 6 + Math.random() * 6, color: "150,160,170", smoke: true });
      }
    }
    function launch() {
      const inFlight = new Set(words.map((w) => w.text));
      const pool = poolFor();
      let text = null;
      for (let tries = 0; tries < 12; tries++) { const c = pick(pool); if (!inFlight.has(c)) { text = c; break; } }
      if (!text) return; // everything already on screen — skip this spawn
      words.push({ text, typed: 0, dead: false, age: 0, x: 60, y: H - 58, vx: 62 + level() * 6, vy: -(180 + Math.random() * 35) });
      burst(60, H - 58, "249,191,59", 10);
      smoke(60, H - 58);
      beep(150, 0.12, "sawtooth", 0.14);
    }
    function loop(ts) {
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      spawnAcc += dt;
      if (spawnAcc >= spawnEvery()) { spawnAcc = 0; launch(); }
      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        w.age += dt; w.vy += GY * dt; w.x += w.vx * dt; w.y += w.vy * dt;
        if (w.dead) { words.splice(i, 1); continue; }
        if (w.y >= H - 30 || w.x >= W + 70) {
          words.splice(i, 1);
          if (active === w) active = null;
          lives--; beep(100, 0.22, "sawtooth", 0.16); updateHud();
          if (lives <= 0) return gameover();
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.smoke) { p.vy += 6 * dt; p.r += 14 * dt; p.life -= 0.9 * dt; } else { p.vy += 120 * dt; p.life -= 1.6 * dt; }
        if (p.life <= 0) parts.splice(i, 1);
      }
      draw();
      raf = requestAnimationFrame(loop);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // smoke behind, sparks in front
      for (const p of parts) {
        if (p.smoke) { ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.life) * 0.4})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      }
      drawCannon();
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      for (const w of words) {
        const scale = Math.min(1, w.age / 0.16);
        ctx.font = `700 ${Math.round(27 * scale)}px 'Iowan Old Style',Georgia,serif`;
        const isActive = active === w;
        const done = w.text.slice(0, w.typed), rest = w.text.slice(w.typed);
        const wd = ctx.measureText(w.text).width;
        if (isActive) { ctx.fillStyle = "rgba(45,212,191,.15)"; ctx.fillRect(w.x - 7, w.y - 19, wd + 14, 36); }
        ctx.fillStyle = "#2dd4bf"; ctx.fillText(done, w.x, w.y);
        ctx.fillStyle = isActive ? "#e6edf3" : "#a7b6c4"; ctx.fillText(rest, w.x + ctx.measureText(done).width, w.y);
      }
      for (const p of parts) {
        if (!p.smoke) { ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.life)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    function star(cx, cy, r) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        const a2 = a + Math.PI / 5;
        ctx.lineTo(cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45);
      }
      ctx.closePath(); ctx.fill();
    }
    function drawCannon() {
      const bx = 52, by = H - 46;
      // barrel
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.7);
      const bar = ctx.createLinearGradient(0, -16, 0, 16);
      bar.addColorStop(0, "#f43f5e"); bar.addColorStop(0.5, "#fb7185"); bar.addColorStop(1, "#be123c");
      ctx.fillStyle = bar; ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3;
      roundRectPath(-4, -16, 62, 32, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#facc15"; ctx.fillRect(52, -18, 10, 36); // gold muzzle band
      ctx.restore();
      // wheel / base
      const base = ctx.createRadialGradient(bx, by, 4, bx, by, 30);
      base.addColorStop(0, "#38bdf8"); base.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = base; ctx.beginPath(); ctx.arc(bx, by, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3; ctx.stroke();
      // bright stars
      ctx.fillStyle = "#fde047"; star(bx - 6, by - 4, 8); star(bx + 10, by + 8, 5);
      ctx.fillStyle = "#a855f7"; star(bx + 4, by - 12, 4);
      ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
    }
    function roundRectPath(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function updateHud() { hud("#g-score", score); hud("#g-level", level()); hud("#g-lives", lifeStr(lives)); }
    function gameover() {
      teardown();
      root.innerHTML = overScreen("💥 Game over — good shooting!", score, "points",
        `You scored <strong>${score}</strong> and reached <strong>level ${level()}</strong>. Typing whole words on sight is exactly how real speed is built.`, "g-again");
      root.querySelector("#g-again").onclick = () => { resumeAudio(); start(); };
    }
    intro();
  }

  /* =====================================================================
   *  GAME 3 — MUSICAL TYPING
   *  Typed letters are practice keys (home row → +top row → whole keyboard);
   *  each correct keystroke plays the next note of a public-domain melody, so a
   *  long drill "plays a song". The letters need NOT match the note names.
   * ===================================================================== */
  function renderMusicalTyping() {
    const FREQ = { c: 261.63, d: 293.66, e: 329.63, f: 349.23, g: 392.00, a: 440.00, b: 493.88 };
    const SONGS = [
      { name: "Twinkle Twinkle Little Star", seq: "ccggaagffeeddcggffeedggffeedccggaagffeeddc" },
      { name: "Mary Had a Little Lamb", seq: "edcdeeedddeggedcdeeeeddedc" },
      { name: "Row Row Row Your Boat", seq: "cccdeedefggggeeeeccccgfedc" },
      { name: "Jingle Bells", seq: "eeeeeeegcdefffffeeeeddedg" }
    ];
    const HOME = "asdfghjkl", TOP = "qwertyuiop", BOT = "zxcvbnm";
    let song = null, passage = "", idx = 0, melody = [], nIdx = 0, keyfn = null, doneCount = 0, total = 0;

    function teardown() { if (keyfn) { document.removeEventListener("keydown", keyfn); keyfn = null; } }
    function drill(pool, words) {
      const out = [];
      for (let i = 0; i < words; i++) { const len = 3 + rand(3); let w = ""; for (let j = 0; j < len; j++) w += pool[rand(pool.length)]; out.push(w); }
      return out.join(" ");
    }
    function intro() {
      teardown();
      root.innerHTML = `
        <div class="quiz quiz-intro">
          <div class="quiz-badges">
            <span class="quiz-badge time">🎵 Typing game</span>
            <span class="quiz-badge ok">✓ 100% free · no sign-up</span>
          </div>
          <h2>Musical Typing</h2>
          <p class="quiz-lede">Type the highlighted letters and a real melody plays back, one note per keystroke. The letters are a <strong>typing drill</strong> — they start on the home row, then add the top row, then the whole keyboard — while your keystrokes play a tune you already know.</p>
          <ul class="quiz-facts">
            <li><span>🎹</span><div>Type the highlighted letter to play the next note and move on.</div></li>
            <li><span>📈</span><div>It gets harder as you go: <strong>home row → home + top → every key</strong>.</div></li>
            <li><span>🔊</span><div>Turn your sound on. Public-domain classics — no copyrighted game music.</div></li>
          </ul>
          <p class="song-label">Pick a tune:</p>
          <div class="song-picker">${SONGS.map((s, i) => `<button type="button" class="button typing-mode" data-song="${i}">${esc(s.name)}</button>`).join("")}</div>
        </div>`;
      root.querySelectorAll("[data-song]").forEach((b) => b.onclick = () => { resumeAudio(); play(SONGS[Number(b.dataset.song)]); });
    }
    function play(s) {
      teardown();
      song = s;
      melody = s.seq.split("").map((c) => FREQ[c]).filter(Boolean);
      passage = drill(HOME, 12) + "  " + drill(HOME + TOP, 16) + "  " + drill(HOME + TOP + BOT, 20);
      idx = 0; nIdx = 0; doneCount = 0; total = passage.replace(/ /g, "").length;
      render();
      keyfn = (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (!e.key || e.key.length !== 1) return;
        const ch = e.key.toLowerCase();
        if (!/[a-z]/.test(ch)) return;
        e.preventDefault();
        step(ch);
      };
      document.addEventListener("keydown", keyfn);
    }
    function nextIdx(from) { while (from < passage.length && passage[from] === " ") from++; return from; }
    function step(ch) {
      const i = nextIdx(idx);
      if (i >= passage.length) return;
      if (passage[i] === ch) {
        beep(melody[nIdx % melody.length], 0.3, "sine", 0.2);
        nIdx++; doneCount++; idx = nextIdx(i + 1); render();
        if (nextIdx(idx) >= passage.length) finish();
      } else {
        beep(90, 0.12, "sawtooth", 0.13);
        const c = root.querySelector(".mt-cur"); if (c) { c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); }
      }
    }
    function render() {
      const cursor = nextIdx(idx);
      let html = "";
      for (let i = 0; i < passage.length; i++) {
        const ch = passage[i];
        if (ch === " ") { html += " "; continue; }
        const cls = i < cursor ? "mt-ch done" : (i === cursor ? "mt-ch mt-cur" : "mt-ch");
        html += `<span class="${cls}">${ch}</span>`;
      }
      const pct = total ? Math.round((doneCount / total) * 100) : 0;
      root.innerHTML = `
        <div class="quiz quiz-question mt-play">
          <div class="quiz-topbar"><span class="quiz-cat">🎵 ${esc(song.name)}</span><span>${doneCount} / ${total}</span></div>
          <div class="mt-passage">${html}</div>
          <div class="score-bar mt-bar"><span style="width:${pct}%"></span></div>
          <p class="game-hint">Type the highlighted letter — it plays the next note. Keys get harder as you go. <button type="button" class="linklike" id="mt-menu">Pick another tune</button></p>
        </div>`;
      const m = root.querySelector("#mt-menu"); if (m) m.onclick = intro;
    }
    function finish() {
      teardown();
      root.innerHTML = `
        <div class="quiz quiz-results">
          <p class="quiz-flash">🎉 You played <strong>${esc(song.name)}</strong> — and drilled ${total} keystrokes!</p>
          <div class="score-hero"><div class="score-big">${total}<small>keys played</small></div>
            <div class="score-meta"><p>Every key you hit was a step toward faster, no-look typing — with a tune as your reward. Play it again to smooth out your rhythm, or pick a new one.</p></div></div>
          <div class="actions">
            <button class="button primary" id="mt-replay">Play it again →</button>
            <button class="button" id="mt-another">Pick another tune</button>
            <a class="button" href="index.html">More typing games</a>
          </div>
        </div>`;
      root.querySelector("#mt-replay").onclick = () => { resumeAudio(); play(song); };
      root.querySelector("#mt-another").onclick = intro;
    }
    intro();
  }

  /* =====================================================================
   *  GAME 4 — KEY TRAINER (on-screen keyboard, light-up target key)
   * ===================================================================== */
  function renderKeyTrainer() {
    const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    let target = "", score = 0, misses = 0, keyfn = null, timer = null, timeLeft = 30, running = false;

    function teardown() {
      running = false;
      if (keyfn) { document.removeEventListener("keydown", keyfn); keyfn = null; }
      if (timer) { clearInterval(timer); timer = null; }
    }
    function intro() {
      teardown();
      root.innerHTML = introScreen("🎹", "Key Trainer",
        "One key lights up on the on-screen keyboard — press it as fast as you can. It starts on the home row, then adds the top row, then the whole keyboard as your score climbs. You have 30 seconds to hit as many as you can.",
        [["🏠", "Starts on the <strong>home row</strong>, then expands to every key."],
         ["👀", "Glance at the glowing key, then trust your fingers to find it."],
         ["⏱️", "30 seconds — accuracy counts, so aim before you press."]],
        "g-start");
      root.querySelector("#g-start").onclick = () => { resumeAudio(); start(); };
    }
    function poolFor() {
      if (score < 10) return "asdfghjkl";
      if (score < 24) return "asdfghjkl" + "qwertyuiop";
      return "asdfghjkl" + "qwertyuiop" + "zxcvbnm";
    }
    function boardHTML() {
      return `
        <div class="game-hud">
          <div class="game-hud-item"><span>Hits</span><strong id="g-score">0</strong></div>
          <div class="game-hud-item"><span>Accuracy</span><strong id="g-acc">100%</strong></div>
          <div class="game-hud-item"><span>Time</span><strong id="g-time">30</strong></div>
        </div>
        <div class="kt-board">${ROWS.map((r, i) => `<div class="kt-row kt-row-${i}">${r.split("").map((k) => `<span class="kt-key" data-k="${k}">${k}</span>`).join("")}</div>`).join("")}</div>
        <p class="game-hint">Press the glowing key. <button type="button" class="linklike" id="g-quit">Quit to menu</button></p>`;
    }
    function start() {
      teardown();
      score = 0; misses = 0; timeLeft = 30; running = true;
      root.innerHTML = `<div class="game-wrap">${boardHTML()}</div>`;
      root.querySelector("#g-quit").onclick = intro;
      next();
      keyfn = (e) => {
        if (!running || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) { e.preventDefault(); press(e.key.toLowerCase()); }
      };
      document.addEventListener("keydown", keyfn);
      timer = setInterval(() => { timeLeft--; hud("#g-time", Math.max(0, timeLeft)); if (timeLeft <= 0) end(); }, 1000);
    }
    function next() {
      const p = poolFor();
      target = p[rand(p.length)];
      root.querySelectorAll(".kt-key").forEach((k) => k.classList.toggle("target", k.dataset.k === target));
    }
    function flash(cell, cls) { if (!cell) return; cell.classList.add(cls); setTimeout(() => cell.classList.remove(cls), 160); }
    function press(ch) {
      const cell = root.querySelector(`[data-k="${ch}"]`);
      if (ch === target) { score++; flash(cell, "hit"); beep(500 + rand(160), 0.06, "triangle", 0.12); next(); }
      else { misses++; flash(cell, "miss"); beep(120, 0.1, "sawtooth", 0.12); }
      hud("#g-score", score);
      hud("#g-acc", Math.round((score / Math.max(1, score + misses)) * 100) + "%");
    }
    function end() {
      const acc = Math.round((score / Math.max(1, score + misses)) * 100);
      teardown();
      root.innerHTML = overScreen("⏱️ Time! Fast fingers.", score, "keys hit",
        `You hit <strong>${score}</strong> keys at <strong>${acc}% accuracy</strong>. Finding keys by feel is the whole foundation of touch typing.`, "g-again");
      root.querySelector("#g-again").onclick = () => { resumeAudio(); start(); };
    }
    intro();
  }

  /* =====================================================================
   *  GAME 5 — WORD SPRINT (type as many words as you can in 60s)
   * ===================================================================== */
  function renderWordSprint() {
    const EASY = "time work make good many over such most well even want here word life give kind".split(" ");
    const MID = "family window travel simple bottle strong friend school planet reason garden number".split(" ");
    const HARD = "keyboard practice sentence remember birthday hospital thousand computer chocolate elephant".split(" ");
    let cur = "", score = 0, chars = 0, timeLeft = 60, timer = null, running = false, inputEl = null, onInput = null;

    function teardown() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (inputEl && onInput) inputEl.removeEventListener("input", onInput);
      inputEl = null;
    }
    function intro() {
      teardown();
      root.innerHTML = introScreen("⚡", "Word Sprint",
        "Type as many words as you can in 60 seconds. A word appears — type it and the next pops up instantly. The words get a little longer as you find your rhythm. Great for building real, everyday typing speed.",
        [["⌨️", "Type the word shown, then it clears itself — no Enter needed."],
         ["📈", "Words grow from short to longer as your streak builds."],
         ["⏱️", "60 seconds on the clock; we'll show your words and WPM."]],
        "g-start");
      root.querySelector("#g-start").onclick = () => { resumeAudio(); start(); };
    }
    function poolFor() { if (score < 8) return EASY; if (score < 20) return MID; return HARD; }
    function newWord() { cur = pick(poolFor()); const el = root.querySelector("#ws-word"); if (el) el.textContent = cur; if (inputEl) inputEl.value = ""; }
    function start() {
      teardown();
      score = 0; chars = 0; timeLeft = 60; running = true;
      root.innerHTML = `
        <div class="game-wrap">
          <div class="game-hud">
            <div class="game-hud-item"><span>Words</span><strong id="g-score">0</strong></div>
            <div class="game-hud-item"><span>WPM</span><strong id="g-wpm">0</strong></div>
            <div class="game-hud-item"><span>Time</span><strong id="g-time">60</strong></div>
          </div>
          <div class="ws-word" id="ws-word">ready…</div>
          <input id="ws-input" class="ws-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Type the word shown above">
          <p class="game-hint">Type the word above. <button type="button" class="linklike" id="g-quit">Quit to menu</button></p>
        </div>`;
      inputEl = root.querySelector("#ws-input");
      root.querySelector("#g-quit").onclick = intro;
      onInput = () => {
        if (!running) return;
        const v = inputEl.value;
        if (v === cur) { score++; chars += cur.length + 1; beep(480 + rand(140), 0.05, "triangle", 0.1); hud("#g-score", score); hud("#g-wpm", wpm()); newWord(); }
        else if (cur && !cur.startsWith(v)) { inputEl.classList.add("bad"); }
        else { inputEl.classList.remove("bad"); }
      };
      inputEl.addEventListener("input", onInput);
      newWord();
      inputEl.focus();
      timer = setInterval(() => { timeLeft--; hud("#g-time", Math.max(0, timeLeft)); hud("#g-wpm", wpm()); if (timeLeft <= 0) end(); }, 1000);
    }
    function wpm() { const mins = (60 - timeLeft) / 60; return mins > 0 ? Math.round((chars / 5) / mins) : 0; }
    function end() {
      const w = wpm();
      teardown();
      root.innerHTML = overScreen("⏱️ Time! Nice sprint.", score, "words typed",
        `You typed <strong>${score}</strong> words — about <strong>${w} WPM</strong>. Want an official measure? Take the full typing speed test.`, "g-again");
      root.querySelector("#g-again").onclick = () => { resumeAudio(); start(); };
    }
    intro();
  }

  /* =====================================================================
   *  GAME 6 — BALLOON POP (letters float up; type before they escape)
   * ===================================================================== */
  function renderBalloonPop() {
    const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
    const COLORS = ["#f43f5e", "#f59e0b", "#22d3ee", "#a855f7", "#34d399", "#60a5fa"];
    let raf = null, keyfn = null, resizefn = null, running = false;
    let balloons = [], pops = [], score = 0, lives = 3, spawnAcc = 0, last = 0;
    let cv = null, ctx = null, W = 0, H = 0;

    function teardown() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (keyfn) { document.removeEventListener("keydown", keyfn); keyfn = null; }
      if (resizefn) { window.removeEventListener("resize", resizefn); resizefn = null; }
    }
    function intro() {
      teardown();
      root.innerHTML = introScreen("🎈", "Balloon Pop",
        "Balloons drift up from the bottom, each carrying a letter. Type the letter to pop the balloon before it floats off the top. It rises a little faster as you go. Let three escape and the round is over.",
        [["⌨️", "Type a balloon's letter to <strong>pop</strong> it — no mouse needed."],
         ["⬆️", "Pop the <strong>highest</strong> balloons first; they're closest to escaping."],
         ["❤️", "Three lives; a balloon that floats off the top costs one."]],
        "g-start");
      root.querySelector("#g-start").onclick = () => { resumeAudio(); start(); };
    }
    function level() { return Math.floor(score / 12) + 1; }
    function riseSpeed() { return Math.min(140, 34 + level() * 9); }
    function spawnEvery() { return Math.max(0.6, 1.6 - level() * 0.09); }
    function start() {
      teardown();
      balloons = []; pops = []; score = 0; lives = 3; spawnAcc = 0; last = 0; running = true;
      root.innerHTML = canvasStage("g-quit");
      cv = root.querySelector("#g-canvas");
      ({ ctx, W, H } = fitCanvas(cv));
      resizefn = () => { if (cv) ({ ctx, W, H } = fitCanvas(cv)); };
      window.addEventListener("resize", resizefn);
      keyfn = (e) => {
        if (!running || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) { e.preventDefault(); hit(e.key.toLowerCase()); }
      };
      document.addEventListener("keydown", keyfn);
      root.querySelector("#g-quit").onclick = intro;
      updateHud();
      raf = requestAnimationFrame(loop);
    }
    function hit(ch) {
      let idx = -1, minY = Infinity;
      for (let i = 0; i < balloons.length; i++) { if (balloons[i].ch === ch && balloons[i].y < minY) { minY = balloons[i].y; idx = i; } }
      if (idx >= 0) { pops.push({ x: balloons[idx].x, y: balloons[idx].y, r: 14, a: 1, c: balloons[idx].c }); balloons.splice(idx, 1); score++; beep(500 + rand(160), 0.07, "triangle", 0.12); updateHud(); }
    }
    function loop(ts) {
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      spawnAcc += dt;
      if (spawnAcc >= spawnEvery()) { spawnAcc = 0; balloons.push({ ch: pick(LOWER), x: 34 + Math.random() * (W - 68), y: H + 24, c: pick(COLORS), sway: Math.random() * Math.PI * 2 }); }
      const v = riseSpeed();
      for (let i = balloons.length - 1; i >= 0; i--) {
        balloons[i].y -= v * dt; balloons[i].sway += dt * 2;
        if (balloons[i].y < 34) { balloons.splice(i, 1); lives--; beep(110, 0.2, "sawtooth", 0.16); updateHud(); if (lives <= 0) return gameover(); }
      }
      draw();
      raf = requestAnimationFrame(loop);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const b of balloons) {
        const x = b.x + Math.sin(b.sway) * 8, y = b.y;
        ctx.strokeStyle = "rgba(200,210,220,.4)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y + 22); ctx.lineTo(x, y + 40); ctx.stroke();
        ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(x, y, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(x - 6, y - 8, 5, 7, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0b1118"; ctx.font = "700 22px 'Iowan Old Style',Georgia,serif"; ctx.fillText(b.ch, x, y);
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        ctx.strokeStyle = `rgba(45,212,191,${Math.max(0, p.a)})`;
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        p.r += 2; p.a -= 0.07; if (p.a <= 0) pops.splice(i, 1);
      }
    }
    function updateHud() { hud("#g-score", score); hud("#g-level", level()); hud("#g-lives", lifeStr(lives)); }
    function gameover() {
      teardown();
      root.innerHTML = overScreen("🎈 Game over — pop pop!", score, "balloons popped",
        `You popped <strong>${score}</strong> balloons and reached <strong>level ${level()}</strong>. A cheerful way to sharpen your key-finding reflexes.`, "g-again");
      root.querySelector("#g-again").onclick = () => { resumeAudio(); start(); };
    }
    intro();
  }

  /* =====================================================================
   *  GAME 7 — KEY MEMORY (Simon-style: watch a key sequence, type it back)
   * ===================================================================== */
  function renderKeyMemory() {
    const PADS = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];
    const FREQS = { q: 262, w: 294, e: 330, a: 349, s: 392, d: 440, z: 494, x: 523, c: 587 };
    let seq = [], pos = 0, round = 0, keyfn = null, showing = false, timers = [];

    function teardown() {
      if (keyfn) { document.removeEventListener("keydown", keyfn); keyfn = null; }
      timers.forEach(clearTimeout); timers = [];
      showing = false;
    }
    function intro() {
      teardown();
      root.innerHTML = introScreen("🧠", "Key Memory",
        "Watch the keys light up in order, then type them back from memory. Each round adds one more key. It's a Simon-style memory game that quietly teaches you where the keys are. How long a chain can you hold?",
        [["👀", "Watch the sequence light up, then repeat it by typing."],
         ["➕", "Every round adds one more key to remember."],
         ["🧠", "One wrong key ends the round — take your time."]],
        "g-start");
      root.querySelector("#g-start").onclick = () => { resumeAudio(); start(); };
    }
    function board() {
      return `
        <div class="game-wrap">
          <div class="game-hud">
            <div class="game-hud-item"><span>Round</span><strong id="g-round">1</strong></div>
            <div class="game-hud-item"><span>Length</span><strong id="g-len">1</strong></div>
          </div>
          <div class="km-grid">${PADS.map((k) => `<span class="km-pad" data-k="${k}">${k}</span>`).join("")}</div>
          <p class="game-hint" id="km-msg">Watch closely…</p>
          <p class="game-hint"><button type="button" class="linklike" id="g-quit">Quit to menu</button></p>
        </div>`;
    }
    function start() {
      teardown();
      seq = []; round = 0;
      root.innerHTML = board();
      root.querySelector("#g-quit").onclick = intro;
      keyfn = (e) => {
        if (showing || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key && e.key.length === 1) { const ch = e.key.toLowerCase(); if (PADS.includes(ch)) { e.preventDefault(); guess(ch); } }
      };
      document.addEventListener("keydown", keyfn);
      nextRound();
    }
    function nextRound() {
      round++;
      seq.push(pick(PADS));
      pos = 0;
      hud("#g-round", round); hud("#g-len", seq.length);
      const msg = root.querySelector("#km-msg"); if (msg) msg.textContent = "Watch closely…";
      showSequence();
    }
    function litPad(k, on) { const p = root.querySelector(`[data-k="${k}"]`); if (p) p.classList.toggle("on", on); }
    function showSequence() {
      showing = true;
      let t = 350;
      seq.forEach((k) => {
        timers.push(setTimeout(() => { litPad(k, true); beep(FREQS[k], 0.24, "sine", 0.18); }, t));
        timers.push(setTimeout(() => litPad(k, false), t + 300));
        t += 520;
      });
      timers.push(setTimeout(() => { showing = false; const msg = root.querySelector("#km-msg"); if (msg) msg.textContent = "Your turn — type the sequence."; }, t + 100));
    }
    function guess(ch) {
      litPad(ch, true); setTimeout(() => litPad(ch, false), 140);
      if (ch === seq[pos]) {
        beep(FREQS[ch], 0.16, "sine", 0.16); pos++;
        if (pos >= seq.length) { const msg = root.querySelector("#km-msg"); if (msg) msg.textContent = "Nice! Next round…"; timers.push(setTimeout(nextRound, 700)); }
      } else {
        beep(90, 0.2, "sawtooth", 0.16); gameover();
      }
    }
    function gameover() {
      const best = seq.length - 1;
      teardown();
      root.innerHTML = overScreen("🧠 Sequence broken!", best, "keys remembered",
        `You held a chain of <strong>${best}</strong> ${best === 1 ? "key" : "keys"} in memory. Recalling key positions from memory is exactly what fast typing feels like.`, "g-again");
      root.querySelector("#g-again").onclick = () => { resumeAudio(); start(); };
    }
    intro();
  }

  /* =====================================================================
   *  GAME 8 — ZTYPE (external embed)
   * ===================================================================== */
  function renderZType() {
    root.innerHTML = `
      <div class="ztype-embed">
        <div class="ztype-frame">
          <iframe src="https://zty.pe/" allow="autoplay; fullscreen" loading="lazy" title="ZType typing game"></iframe>
        </div>
        <p class="game-hint">ZType is a free game hosted at <a href="https://zty.pe/" target="_blank" rel="noopener noreferrer">zty.pe</a> and loads here in a frame. If it doesn't appear, <a href="https://zty.pe/" target="_blank" rel="noopener noreferrer">open it in a new tab</a>.</p>
      </div>`;
  }

  const GAMES = {
    "falling-letters": renderFallingLetters,
    "word-cannon": renderWordCannon,
    "musical-typing": renderMusicalTyping,
    "key-trainer": renderKeyTrainer,
    "word-sprint": renderWordSprint,
    "balloon-pop": renderBalloonPop,
    "key-memory": renderKeyMemory,
    "ztype": renderZType
  };
  if (GAMES[slug]) GAMES[slug]();
  else root.innerHTML = '<p class="error">This game could not be loaded.</p>';
})();
