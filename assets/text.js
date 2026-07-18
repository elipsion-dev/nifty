(() => {
  const root = document.querySelector("#tool-root");
  if (!root) return;
  const slug = root.dataset.tool;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const num = (value) => { const n = Number.parseFloat(value); return Number.isFinite(n) ? n : 0; };
  const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  const fieldHtml = (f) => {
    const id = `field-${f.id}`;
    const full = f.full ? " full" : "";
    const help = f.help ? `<small>${esc(f.help)}</small>` : "";
    if (f.type === "select") {
      return `<div class="field${full}" data-field="${f.id}"><label for="${id}">${esc(f.label)}</label><select id="${id}" name="${f.id}">${f.options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(f.value) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>${help}</div>`;
    }
    if (f.type === "textarea") {
      return `<div class="field full" data-field="${f.id}"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" name="${f.id}" placeholder="${esc(f.placeholder || "")}" spellcheck="false"${f.rows ? ` rows="${f.rows}"` : ""}>${esc(f.value ?? "")}</textarea>${help}</div>`;
    }
    if (f.type === "checkbox") {
      return `<div class="field${full} field-check" data-field="${f.id}"><label for="${id}"><input id="${id}" name="${f.id}" type="checkbox"${f.value ? " checked" : ""}> ${esc(f.label)}</label>${help}</div>`;
    }
    const attrs = `${f.min !== undefined ? ` min="${f.min}"` : ""}${f.max !== undefined ? ` max="${f.max}"` : ""}${f.step ? ` step="${f.step}"` : (f.type === "number" || !f.type) ? ' step="any"' : ""}`;
    return `<div class="field${full}" data-field="${f.id}"><label for="${id}">${esc(f.label)}</label><input id="${id}" name="${f.id}" type="${f.type || "number"}" value="${esc(f.value ?? "")}" placeholder="${esc(f.placeholder || "")}"${attrs}>${help}</div>`;
  };
  const formHtml = (fields) => `<div class="form-grid">${fields.map(fieldHtml).join("")}</div>`;
  const metricsHtml = (items) => `<div class="metric-grid">${items.map(([l, v]) => `<div class="metric"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join("")}</div>`;
  const resultPanel = () => `<section id="result" class="result-panel" aria-live="polite" hidden></section>`;
  const val = (id) => { const el = root.querySelector(`#field-${id}`); return el ? (el.type === "checkbox" ? el.checked : el.value) : ""; };
  const show = (html) => { const p = root.querySelector("#result"); p.innerHTML = html; p.hidden = false; };
  const live = (compute) => {
    root.querySelectorAll("input, select, textarea").forEach((el) => {
      el.addEventListener("input", compute);
      el.addEventListener("change", compute);
    });
    compute();
  };
  const download = (content, filename, type = "text/plain") => {
    const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const copyText = (text, btn, doneLabel = "Copied!") => {
    const original = btn.textContent;
    const done = () => { btn.textContent = doneLabel; setTimeout(() => { btn.textContent = original; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else done();
  };

  // ---------- word & character counter ----------
  function renderWordCounter() {
    root.innerHTML = `${formHtml([
      { id: "text", label: "Paste or type your text", type: "textarea", rows: 10, placeholder: "Start typing, or paste a draft, essay, or post here…" }
    ])}${resultPanel()}`;
    live(() => {
      const text = val("text");
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s/g, "").length;
      const sentences = trimmed ? (trimmed.match(/[.!?…]+(?=\s|$)/g) || []).length || 1 : 0;
      const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
      // 238 wpm silent reading, 130 wpm speaking — common published averages.
      const readSec = Math.round(words / 238 * 60);
      const speakSec = Math.round(words / 130 * 60);
      const fmtTime = (s) => s < 60 ? `${s} sec` : `${Math.floor(s / 60)} min ${s % 60} sec`;
      const avgWordLen = words ? (charsNoSpace / words).toFixed(1) : "0";
      show(`<h2>${int.format(words)} word${words === 1 ? "" : "s"}</h2>${metricsHtml([
        ["Characters", int.format(chars)],
        ["Characters (no spaces)", int.format(charsNoSpace)],
        ["Sentences", int.format(sentences)],
        ["Paragraphs", int.format(paragraphs)],
        ["Reading time", words ? `~${fmtTime(readSec)}` : "—"],
        ["Speaking time", words ? `~${fmtTime(speakSec)}` : "—"],
        ["Avg. word length", `${avgWordLen} chars`],
        ["Longest paragraph", paragraphs ? `${int.format(Math.max(...text.split(/\n\s*\n/).map((p) => p.trim() ? p.trim().split(/\s+/).length : 0)))} words` : "—"]
      ])}<p class="notice">Reading time assumes ~238 words per minute (silent reading); speaking time assumes ~130 wpm. Counts update as you type and nothing leaves this page.</p>`);
    });
  }

  // ---------- case converter ----------
  function renderCaseConverter() {
    const MODES = [
      ["upper", "UPPERCASE"], ["lower", "lowercase"], ["title", "Title Case"], ["sentence", "Sentence case"],
      ["camel", "camelCase"], ["pascal", "PascalCase"], ["snake", "snake_case"], ["kebab", "kebab-case"], ["constant", "CONSTANT_CASE"], ["alternating", "aLtErNaTiNg"]
    ];
    const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor", "of", "on", "or", "so", "the", "to", "up", "yet"]);
    const wordsOf = (t) => t.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9']+/).filter(Boolean);
    const convert = (t, mode) => {
      if (mode === "upper") return t.toUpperCase();
      if (mode === "lower") return t.toLowerCase();
      if (mode === "sentence") return t.toLowerCase().replace(/(^\s*[a-z])|([.!?…]\s+[a-z])/g, (m) => m.toUpperCase()).replace(/\bi\b/g, "I");
      if (mode === "title") {
        return t.toLowerCase().split(/\n/).map((line) => {
          const ws = line.split(/(\s+)/);
          let wordIndex = 0;
          const lastWord = ws.filter((w) => w.trim()).length - 1;
          return ws.map((w) => {
            if (!w.trim()) return w;
            const i = wordIndex++;
            const cap = () => w.replace(/[a-z]/, (c) => c.toUpperCase());
            return (i !== 0 && i !== lastWord && SMALL.has(w.replace(/[^a-z']/g, ""))) ? w : cap();
          }).join("");
        }).join("\n");
      }
      if (mode === "alternating") { let i = 0; return t.replace(/[a-zA-Z]/g, (c) => (i++ % 2 ? c.toUpperCase() : c.toLowerCase())); }
      const ws = wordsOf(t).map((w) => w.toLowerCase());
      if (mode === "camel") return ws.map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w).join("");
      if (mode === "pascal") return ws.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
      if (mode === "snake") return ws.join("_");
      if (mode === "kebab") return ws.join("-");
      if (mode === "constant") return ws.join("_").toUpperCase();
      return t;
    };
    root.innerHTML = `${formHtml([
      { id: "text", label: "Text to convert", type: "textarea", rows: 7, placeholder: "Paste the text you want to change the case of…" },
      { id: "mode", label: "Convert to", type: "select", value: "title", options: MODES }
    ])}
    <div class="actions"><button id="copy-out" class="button primary" type="button">Copy result</button><button id="dl-out" class="button" type="button">Download .txt</button></div>
    ${resultPanel()}`;
    let out = "";
    live(() => {
      const text = val("text");
      out = convert(text, val("mode"));
      show(text.trim()
        ? `<h2>Converted text</h2><div class="field full"><textarea rows="7" readonly spellcheck="false">${esc(out)}</textarea></div><p class="notice">camelCase, snake_case, and friends treat existing spaces, hyphens, underscores, and capital-letter boundaries as word breaks. Title Case keeps short joining words (a, of, the…) lowercase except at the start and end.</p>`
        : `<p class="notice">Type or paste some text above and the converted version will appear here.</p>`);
    });
    root.querySelector("#copy-out").onclick = (e) => copyText(out, e.currentTarget);
    root.querySelector("#dl-out").onclick = () => download(out, "converted-text.txt");
  }

  // ---------- text diff ----------
  function renderTextDiff() {
    // Standard LCS-based line diff: walk the longest-common-subsequence table
    // back to classify each line as kept, added, or removed.
    const diffLines = (aText, bText) => {
      const a = aText.split("\n"), b = bText.split("\n");
      if (a.length * b.length > 4000000) return null; // keep the table small enough for the browser
      const m = a.length, n = b.length;
      const lcs = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
      for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
          lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
      }
      const ops = [];
      let i = 0, j = 0;
      while (i < m && j < n) {
        if (a[i] === b[j]) { ops.push(["same", a[i]]); i++; j++; }
        else if (lcs[i + 1][j] >= lcs[i][j + 1]) { ops.push(["del", a[i]]); i++; }
        else { ops.push(["add", b[j]]); j++; }
      }
      while (i < m) { ops.push(["del", a[i]]); i++; }
      while (j < n) { ops.push(["add", b[j]]); j++; }
      return ops;
    };
    root.innerHTML = `${formHtml([
      { id: "a", label: "Original text", type: "textarea", rows: 9, placeholder: "Paste the first (original) version…" },
      { id: "b", label: "Changed text", type: "textarea", rows: 9, placeholder: "Paste the second (changed) version…" },
      { id: "trim", label: "Ignore leading/trailing spaces on each line", type: "checkbox", value: false },
      { id: "case", label: "Ignore letter case", type: "checkbox", value: false }
    ])}${resultPanel()}`;
    live(() => {
      let a = val("a"), b = val("b");
      if (!a && !b) return show(`<p class="notice">Paste two versions of your text above to see the differences.</p>`);
      const norm = (t) => {
        let lines = t.split("\n");
        if (val("trim")) lines = lines.map((l) => l.trim());
        if (val("case")) lines = lines.map((l) => l.toLowerCase());
        return lines.join("\n");
      };
      const ops = diffLines(norm(a), norm(b));
      if (!ops) return show(`<p class="error">These texts are too large to compare in the browser. Try comparing smaller sections.</p>`);
      // Show original (pre-normalization) line content alongside the classification.
      const aLines = a.split("\n"), bLines = b.split("\n");
      let ai = 0, bi = 0;
      const rows = ops.map(([op]) => {
        if (op === "same") { const line = bLines[bi] ?? aLines[ai]; ai++; bi++; return `<div class="diff-line diff-same"><span class="diff-sign"> </span>${esc(line) || "&nbsp;"}</div>`; }
        if (op === "del") { const line = aLines[ai++]; return `<div class="diff-line diff-del"><span class="diff-sign">−</span>${esc(line) || "&nbsp;"}</div>`; }
        const line = bLines[bi++]; return `<div class="diff-line diff-add"><span class="diff-sign">+</span>${esc(line) || "&nbsp;"}</div>`;
      }).join("");
      const added = ops.filter(([op]) => op === "add").length;
      const removed = ops.filter(([op]) => op === "del").length;
      const kept = ops.filter(([op]) => op === "same").length;
      show(`<h2>${added + removed === 0 ? "No differences found" : `${int.format(added)} line${added === 1 ? "" : "s"} added, ${int.format(removed)} removed`}</h2>${metricsHtml([
        ["Lines added", int.format(added)],
        ["Lines removed", int.format(removed)],
        ["Lines unchanged", int.format(kept)]
      ])}<div class="diff-output">${rows}</div><p class="notice">Green lines with + exist only in the changed text; red lines with − exist only in the original. The comparison is line-by-line.</p>`);
    });
  }

  // ---------- JSON formatter ----------
  function renderJsonFormatter() {
    root.innerHTML = `${formHtml([
      { id: "json", label: "JSON input", type: "textarea", rows: 12, placeholder: '{"paste": "your JSON here"}' },
      { id: "indent", label: "Output style", type: "select", value: "2", options: [["2", "Pretty — 2-space indent"], ["4", "Pretty — 4-space indent"], ["tab", "Pretty — tabs"], ["min", "Minified — one line"]] },
      { id: "sort", label: "Sort object keys alphabetically", type: "checkbox", value: false }
    ])}
    <div class="actions"><button id="copy-out" class="button primary" type="button">Copy result</button><button id="dl-out" class="button" type="button">Download .json</button></div>
    ${resultPanel()}`;
    const sortKeys = (value) => {
      if (Array.isArray(value)) return value.map(sortKeys);
      if (value && typeof value === "object") {
        return Object.keys(value).sort().reduce((acc, k) => (acc[k] = sortKeys(value[k]), acc), {});
      }
      return value;
    };
    // Point at the first syntax error: modern browsers report "position N" in the message.
    const errorContext = (text, message) => {
      const m = message.match(/position (\d+)/);
      if (!m) return "";
      const pos = +m[1];
      const before = text.slice(0, pos);
      const line = before.split("\n").length;
      const col = pos - before.lastIndexOf("\n");
      const snippet = text.slice(Math.max(0, pos - 30), pos + 30).replace(/\n/g, "⏎");
      return `<p>Around line ${line}, column ${col}:</p><pre class="diff-output" style="padding:.7rem">…${esc(snippet)}…</pre>`;
    };
    let out = "";
    live(() => {
      const text = val("json");
      if (!text.trim()) { out = ""; return show(`<p class="notice">Paste JSON above to validate and re-format it.</p>`); }
      let parsed;
      try { parsed = JSON.parse(text); }
      catch (error) {
        out = "";
        return show(`<h2>✗ Invalid JSON</h2><p class="error">${esc(error.message)}</p>${errorContext(text, error.message)}`);
      }
      if (val("sort")) parsed = sortKeys(parsed);
      const indent = val("indent");
      out = indent === "min" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent === "tab" ? "\t" : +indent);
      const stats = { objects: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, maxDepth: 0 };
      const walk = (v, d) => {
        stats.maxDepth = Math.max(stats.maxDepth, d);
        if (Array.isArray(v)) { stats.arrays++; v.forEach((x) => walk(x, d + 1)); }
        else if (v === null) stats.nulls++;
        else if (typeof v === "object") { stats.objects++; Object.values(v).forEach((x) => walk(x, d + 1)); }
        else if (typeof v === "string") stats.strings++;
        else if (typeof v === "number") stats.numbers++;
        else if (typeof v === "boolean") stats.booleans++;
      };
      walk(parsed, 1);
      show(`<h2>✓ Valid JSON</h2>${metricsHtml([
        ["Objects", int.format(stats.objects)],
        ["Arrays", int.format(stats.arrays)],
        ["Strings", int.format(stats.strings)],
        ["Numbers", int.format(stats.numbers)],
        ["Nesting depth", int.format(stats.maxDepth)],
        ["Output size", `${int.format(out.length)} chars`]
      ])}<div class="field full"><textarea rows="12" readonly spellcheck="false">${esc(out)}</textarea></div>`);
    });
    root.querySelector("#copy-out").onclick = (e) => copyText(out, e.currentTarget);
    root.querySelector("#dl-out").onclick = () => download(out, "formatted.json", "application/json");
  }

  // ---------- password generator ----------
  function renderPasswordGenerator() {
    const SETS = {
      lower: "abcdefghijklmnopqrstuvwxyz",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      digits: "0123456789",
      symbols: "!@#$%^&*()-_=+[]{};:,.?/",
    };
    const AMBIGUOUS = new Set("Il1O0o|`'\"");
    root.innerHTML = `${formHtml([
      { id: "length", label: "Length", type: "number", value: 20, min: 4, max: 128 },
      { id: "count", label: "How many passwords", type: "number", value: 5, min: 1, max: 50 },
      { id: "lower", label: "Lowercase letters (a–z)", type: "checkbox", value: true },
      { id: "upper", label: "Uppercase letters (A–Z)", type: "checkbox", value: true },
      { id: "digits", label: "Digits (0–9)", type: "checkbox", value: true },
      { id: "symbols", label: "Symbols (!@#$…)", type: "checkbox", value: true },
      { id: "ambiguous", label: "Exclude look-alike characters (I, l, 1, O, 0…)", type: "checkbox", value: false }
    ])}
    <div class="actions"><button id="regen" class="button primary" type="button">Generate new passwords</button></div>
    ${resultPanel()}`;
    // Unbiased random index: reject values that would wrap unevenly around the alphabet size.
    const randIndex = (max) => {
      const limit = Math.floor(4294967296 / max) * max;
      const buf = new Uint32Array(1);
      do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % max;
    };
    const generate = () => {
      const length = Math.min(128, Math.max(4, Math.round(num(val("length")) || 20)));
      const count = Math.min(50, Math.max(1, Math.round(num(val("count")) || 1)));
      const chosen = ["lower", "upper", "digits", "symbols"].filter((k) => val(k));
      if (!chosen.length) return show(`<p class="error">Pick at least one character set.</p>`);
      const strip = (s) => val("ambiguous") ? [...s].filter((c) => !AMBIGUOUS.has(c)).join("") : s;
      const pools = chosen.map((k) => strip(SETS[k])).filter((s) => s.length);
      const alphabet = pools.join("");
      const passwords = [];
      for (let p = 0; p < count; p++) {
        // Guarantee one char from every selected set, fill the rest from the full
        // alphabet, then shuffle so the guaranteed chars aren't always first.
        const chars = pools.map((pool) => pool[randIndex(pool.length)]);
        while (chars.length < length) chars.push(alphabet[randIndex(alphabet.length)]);
        for (let i = chars.length - 1; i > 0; i--) { const j = randIndex(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
        passwords.push(chars.slice(0, length).join(""));
      }
      const entropy = Math.round(length * Math.log2(alphabet.length));
      const strength = entropy >= 100 ? "Excellent" : entropy >= 75 ? "Strong" : entropy >= 55 ? "Good" : entropy >= 40 ? "Fair" : "Weak";
      show(`<h2>${strength} — about ${entropy} bits of entropy</h2>
        <div class="password-list">${passwords.map((pw) => `<div class="password-row"><code>${esc(pw)}</code><button class="button pw-copy" type="button" data-pw="${esc(pw)}">Copy</button></div>`).join("")}</div>
        ${metricsHtml([
          ["Alphabet size", `${alphabet.length} characters`],
          ["Entropy per password", `~${entropy} bits`],
          ["Combinations", `${alphabet.length}^${length}`]
        ])}<p class="notice">Passwords are generated with your browser's cryptographic random number generator and never leave this page. Reloading or regenerating discards them — copy what you need into a password manager first.</p>`);
      root.querySelectorAll(".pw-copy").forEach((btn) => btn.onclick = () => copyText(btn.dataset.pw, btn));
    };
    root.querySelector("#regen").onclick = generate;
    root.querySelectorAll("input").forEach((el) => el.addEventListener("change", generate));
    generate();
  }

  // ---------- UUID generator ----------
  function renderUuidGenerator() {
    const uuid = () => crypto.randomUUID ? crypto.randomUUID() : (() => {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
      const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    })();
    root.innerHTML = `${formHtml([
      { id: "count", label: "How many UUIDs", type: "number", value: 5, min: 1, max: 1000 },
      { id: "format", label: "Format", type: "select", value: "lower", options: [["lower", "Lowercase (standard)"], ["upper", "Uppercase"], ["nodash", "Lowercase, no dashes"], ["braces", "With {braces}"]] }
    ])}
    <div class="actions"><button id="regen" class="button primary" type="button">Generate</button><button id="copy-all" class="button" type="button">Copy all</button><button id="dl-out" class="button" type="button">Download .txt</button></div>
    ${resultPanel()}`;
    let list = [];
    const generate = () => {
      const count = Math.min(1000, Math.max(1, Math.round(num(val("count")) || 1)));
      const format = val("format");
      list = Array.from({ length: count }, () => {
        let u = uuid();
        if (format === "upper") u = u.toUpperCase();
        else if (format === "nodash") u = u.replaceAll("-", "");
        else if (format === "braces") u = `{${u}}`;
        return u;
      });
      show(`<h2>${int.format(count)} UUID${count === 1 ? "" : "s"} (version 4)</h2>
        <div class="password-list">${list.map((u) => `<div class="password-row"><code>${esc(u)}</code><button class="button pw-copy" type="button" data-pw="${esc(u)}">Copy</button></div>`).join("")}</div>
        <p class="notice">Version 4 UUIDs are 122 random bits — the chance of two ever colliding is negligible for any practical purpose. Generated locally with your browser's cryptographic randomness.</p>`);
      root.querySelectorAll(".pw-copy").forEach((btn) => btn.onclick = () => copyText(btn.dataset.pw, btn));
    };
    root.querySelector("#regen").onclick = generate;
    root.querySelector("#copy-all").onclick = (e) => copyText(list.join("\n"), e.currentTarget);
    root.querySelector("#dl-out").onclick = () => download(list.join("\n"), "uuids.txt");
    root.querySelectorAll("input, select").forEach((el) => el.addEventListener("change", generate));
    generate();
  }

  // ---------- hash generator ----------
  // Compact MD5 (RFC 1321). WebCrypto has no MD5, and legacy checksums still use it.
  const md5 = (bytes) => {
    const K = new Uint32Array(64).map((_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296));
    const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    const len = bytes.length;
    const withPad = new Uint8Array((((len + 8) >> 6) + 1) << 6);
    withPad.set(bytes); withPad[len] = 0x80;
    const bitLen = len * 8;
    new DataView(withPad.buffer).setUint32(withPad.length - 8, bitLen >>> 0, true);
    new DataView(withPad.buffer).setUint32(withPad.length - 4, Math.floor(bitLen / 4294967296), true);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const view = new DataView(withPad.buffer);
    for (let off = 0; off < withPad.length; off += 64) {
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + view.getUint32(off + g * 4, true)) >>> 0;
        A = D; D = C; C = B;
        B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    return [a0, b0, c0, d0].map((w) => [w & 255, (w >> 8) & 255, (w >> 16) & 255, (w >> 24) & 255].map((x) => x.toString(16).padStart(2, "0")).join("")).join("");
  };
  function renderHashGenerator() {
    root.innerHTML = `${formHtml([
      { id: "mode", label: "Hash", type: "select", value: "text", options: [["text", "Text"], ["file", "A file"]] },
      { id: "text", label: "Text to hash", type: "textarea", rows: 6, placeholder: "Type or paste text…" }
    ])}
    <div class="field full" data-field="file" style="display:none"><label for="hash-file">Choose a file (never uploaded)</label><input id="hash-file" type="file"></div>
    ${resultPanel()}`;
    const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
    const compute = async (bytes, label) => {
      const [sha1, sha256, sha512] = await Promise.all([
        crypto.subtle.digest("SHA-1", bytes), crypto.subtle.digest("SHA-256", bytes), crypto.subtle.digest("SHA-512", bytes)
      ]);
      const rows = [["MD5", md5(new Uint8Array(bytes))], ["SHA-1", hex(sha1)], ["SHA-256", hex(sha256)], ["SHA-512", hex(sha512)]];
      show(`<h2>Hashes${label ? ` — ${esc(label)}` : ""}</h2>
        <div class="password-list">${rows.map(([name, h]) => `<div class="password-row"><span class="hash-name">${name}</span><code>${h}</code><button class="button pw-copy" type="button" data-pw="${h}">Copy</button></div>`).join("")}</div>
        <p class="notice">Everything is hashed locally in your browser. MD5 and SHA-1 are fine for checksums and deduplication but are broken for security purposes — use SHA-256 or SHA-512 when integrity matters against an adversary.</p>`);
      root.querySelectorAll(".pw-copy").forEach((btn) => btn.onclick = () => copyText(btn.dataset.pw, btn));
    };
    const update = async () => {
      const mode = val("mode");
      root.querySelector('[data-field="text"]').style.display = mode === "text" ? "" : "none";
      root.querySelector('[data-field="file"]').style.display = mode === "file" ? "" : "none";
      if (mode === "text") {
        await compute(new TextEncoder().encode(val("text")).buffer, val("text") ? "" : "empty input");
      } else {
        const file = root.querySelector("#hash-file").files[0];
        if (!file) return show(`<p class="notice">Choose a file to see its hashes. The file is read locally and never uploaded.</p>`);
        if (file.size > 512 * 1024 * 1024) return show(`<p class="error">Files over 512 MB are too large to hash comfortably in the browser.</p>`);
        show(`<p class="notice">Hashing ${esc(file.name)}…</p>`);
        await compute(await file.arrayBuffer(), `${file.name} (${int.format(file.size)} bytes)`);
      }
    };
    root.querySelectorAll("input, select, textarea").forEach((el) => {
      el.addEventListener("input", update); el.addEventListener("change", update);
    });
    update();
  }

  // ---------- random picker ----------
  function renderRandomPicker() {
    root.innerHTML = `${formHtml([
      { id: "list", label: "Options — one per line", type: "textarea", rows: 8, placeholder: "Alice\nBen\nCarmen\nDev\nEsme" },
      { id: "count", label: "How many to pick", type: "number", value: 1, min: 1, max: 100 },
      { id: "unique", label: "No repeats (draw without replacement)", type: "checkbox", value: true }
    ])}
    <div class="actions"><button id="pick" class="button primary" type="button">🎲 Pick</button><button id="shuffle" class="button" type="button">Shuffle whole list</button></div>
    ${resultPanel()}`;
    const randIndex = (max) => {
      const limit = Math.floor(4294967296 / max) * max;
      const buf = new Uint32Array(1);
      do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % max;
    };
    const entries = () => val("list").split("\n").map((l) => l.trim()).filter(Boolean);
    const reveal = (winners, note) => {
      show(`<h2>${winners.length === 1 ? "The pick is…" : "The picks are…"}</h2>
        <div class="picker-winners">${winners.map((w, i) => `<div class="picker-winner"><span class="picker-rank">${winners.length > 1 ? `#${i + 1}` : "★"}</span> ${esc(w)}</div>`).join("")}</div>
        ${note ? `<p class="notice">${note}</p>` : ""}`);
    };
    root.querySelector("#pick").onclick = () => {
      const list = entries();
      if (list.length < 2) return show(`<p class="error">Enter at least two options, one per line.</p>`);
      const count = Math.min(100, Math.max(1, Math.round(num(val("count")) || 1)));
      const unique = val("unique");
      if (unique && count > list.length) return show(`<p class="error">You asked for ${count} unique picks but only listed ${list.length} options.</p>`);
      let winners;
      if (unique) {
        const pool = list.slice();
        winners = Array.from({ length: count }, () => pool.splice(randIndex(pool.length), 1)[0]);
      } else {
        winners = Array.from({ length: count }, () => list[randIndex(list.length)]);
      }
      reveal(winners, `Drawn from ${list.length} options using the browser's cryptographic randomness — every option had an equal chance.`);
    };
    root.querySelector("#shuffle").onclick = () => {
      const list = entries();
      if (list.length < 2) return show(`<p class="error">Enter at least two options, one per line.</p>`);
      for (let i = list.length - 1; i > 0; i--) { const j = randIndex(i + 1); [list[i], list[j]] = [list[j], list[i]]; }
      show(`<h2>Shuffled order</h2><div class="picker-winners">${list.map((w, i) => `<div class="picker-winner"><span class="picker-rank">#${i + 1}</span> ${esc(w)}</div>`).join("")}</div><p class="notice">A full random reordering (Fisher–Yates shuffle) — useful for turn order or assigning a fair sequence.</p>`);
    };
    show(`<p class="notice">Enter your options above — names for a draw, restaurants, chores, anything — then hit <strong>Pick</strong>.</p>`);
  }

  // ---------- lorem ipsum ----------
  function renderLoremIpsum() {
    const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
    const randIndex = (max) => Math.floor(Math.random() * max);
    const sentence = (first) => {
      const len = 6 + randIndex(10);
      const ws = Array.from({ length: len }, (_, i) => (first && i < 5) ? WORDS[i] : WORDS[randIndex(WORDS.length)]);
      let s = ws.join(" ");
      if (len > 9) { const comma = 3 + randIndex(len - 5); s = ws.slice(0, comma).join(" ") + ", " + ws.slice(comma).join(" "); }
      return s[0].toUpperCase() + s.slice(1) + ".";
    };
    const paragraph = (first) => Array.from({ length: 4 + randIndex(4) }, (_, i) => sentence(first && i === 0)).join(" ");
    root.innerHTML = `${formHtml([
      { id: "count", label: "How many", type: "number", value: 3, min: 1, max: 100 },
      { id: "unit", label: "Of what", type: "select", value: "paragraphs", options: [["paragraphs", "Paragraphs"], ["sentences", "Sentences"], ["words", "Words"]] },
      { id: "start", label: 'Start with the classic "Lorem ipsum dolor sit amet…"', type: "checkbox", value: true },
      { id: "html", label: "Wrap paragraphs in <p> tags", type: "checkbox", value: false }
    ])}
    <div class="actions"><button id="regen" class="button primary" type="button">Generate</button><button id="copy-out" class="button" type="button">Copy</button></div>
    ${resultPanel()}`;
    let out = "";
    const generate = () => {
      const count = Math.min(100, Math.max(1, Math.round(num(val("count")) || 1)));
      const unit = val("unit"), classic = val("start");
      if (unit === "words") {
        const ws = Array.from({ length: count }, (_, i) => classic && i < Math.min(count, 8) ? WORDS[i] : WORDS[randIndex(WORDS.length)]);
        out = ws.join(" ");
      } else if (unit === "sentences") {
        out = Array.from({ length: count }, (_, i) => sentence(classic && i === 0)).join(" ");
      } else {
        const paras = Array.from({ length: count }, (_, i) => paragraph(classic && i === 0));
        out = val("html") ? paras.map((p) => `<p>${p}</p>`).join("\n") : paras.join("\n\n");
      }
      const words = out.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
      show(`<h2>${int.format(count)} ${unit}</h2><div class="field full"><textarea rows="10" readonly spellcheck="false">${esc(out)}</textarea></div>${metricsHtml([
        ["Words", int.format(words)],
        ["Characters", int.format(out.length)]
      ])}`);
    };
    root.querySelector("#regen").onclick = generate;
    root.querySelector("#copy-out").onclick = (e) => copyText(out, e.currentTarget);
    root.querySelectorAll("input, select").forEach((el) => el.addEventListener("change", generate));
    generate();
  }

  // ---------- signature drawer ----------
  function renderSignatureDrawer() {
    root.innerHTML = `
      <div class="form-grid">
        <div class="field"><label for="sig-color">Ink color</label><select id="sig-color"><option value="#1a2b4a">Blue-black</option><option value="#000000">Black</option><option value="#1743c7">Blue</option></select></div>
        <div class="field"><label for="sig-width">Stroke width</label><select id="sig-width"><option value="2">Fine</option><option value="3" selected>Medium</option><option value="5">Bold</option></select></div>
      </div>
      <div class="signature-pad-wrap"><canvas id="sig-pad" width="900" height="300" aria-label="Signature drawing area"></canvas></div>
      <div class="actions">
        <button id="sig-undo" class="button" type="button">Undo stroke</button>
        <button id="sig-clear" class="button danger" type="button">Clear</button>
        <button id="sig-dl-png" class="button primary" type="button">Download transparent PNG</button>
        <button id="sig-dl-white" class="button" type="button">Download on white</button>
      </div>
      <p class="notice">Draw with a mouse, trackpad, finger, or stylus. The signature exists only on this page until you download it — nothing is uploaded or saved.</p>`;
    const canvas = root.querySelector("#sig-pad");
    const ctx = canvas.getContext("2d");
    const strokes = [];
    let current = null;
    const scale = () => canvas.width / canvas.getBoundingClientRect().width;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const s = scale();
      return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s };
    };
    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (const s of strokes) {
        ctx.strokeStyle = s.color; ctx.lineWidth = s.width * 3;
        ctx.beginPath();
        s.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y);
        ctx.stroke();
      }
    };
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      current = { color: root.querySelector("#sig-color").value, width: +root.querySelector("#sig-width").value, points: [pos(e)] };
      strokes.push(current);
      redraw();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!current) return;
      current.points.push(pos(e));
      redraw();
    });
    const end = () => { current = null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    root.querySelector("#sig-undo").onclick = () => { strokes.pop(); redraw(); };
    root.querySelector("#sig-clear").onclick = () => { strokes.length = 0; redraw(); };
    const exportPng = (white) => {
      if (!strokes.length) return;
      // Crop to the drawn area with a margin so the PNG isn't mostly empty space.
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of strokes) for (const p of s.points) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      }
      const pad = 24;
      const w = Math.max(1, maxX - minX + pad * 2), h = Math.max(1, maxY - minY + pad * 2);
      const out = document.createElement("canvas");
      out.width = Math.round(w); out.height = Math.round(h);
      const octx = out.getContext("2d");
      if (white) { octx.fillStyle = "#ffffff"; octx.fillRect(0, 0, out.width, out.height); }
      octx.lineCap = "round"; octx.lineJoin = "round";
      for (const s of strokes) {
        octx.strokeStyle = s.color; octx.lineWidth = s.width * 3;
        octx.beginPath();
        s.points.forEach((p, i) => i ? octx.lineTo(p.x - minX + pad, p.y - minY + pad) : octx.moveTo(p.x - minX + pad, p.y - minY + pad));
        if (s.points.length === 1) octx.lineTo(s.points[0].x - minX + pad + 0.1, s.points[0].y - minY + pad);
        octx.stroke();
      }
      out.toBlob((blob) => download(blob, white ? "signature-white.png" : "signature.png"));
    };
    root.querySelector("#sig-dl-png").onclick = () => exportPng(false);
    root.querySelector("#sig-dl-white").onclick = () => exportPng(true);
  }

  // ---------- countdown / stopwatch / pomodoro ----------
  function renderTimer() {
    root.innerHTML = `${formHtml([
      { id: "mode", label: "Mode", type: "select", value: "countdown", options: [["countdown", "Countdown timer"], ["stopwatch", "Stopwatch"], ["pomodoro", "Pomodoro (25 min focus / 5 min break)"]] },
      { id: "mins", label: "Minutes", type: "number", value: 5, min: 0, max: 999 },
      { id: "secs", label: "Seconds", type: "number", value: 0, min: 0, max: 59 }
    ])}
    <div class="timer-display" id="timer-display" role="timer" aria-live="off">05:00</div>
    <p class="timer-phase" id="timer-phase"></p>
    <div class="actions">
      <button id="t-start" class="button primary" type="button">Start</button>
      <button id="t-pause" class="button" type="button" disabled>Pause</button>
      <button id="t-reset" class="button" type="button">Reset</button>
      <button id="t-lap" class="button" type="button" style="display:none">Lap</button>
    </div>
    <div id="t-laps"></div>
    <p class="notice">The timer keeps counting while this tab stays open, and the page title shows the remaining time so you can switch tabs. A chime plays when a countdown or Pomodoro phase ends (if your browser allows sound).</p>`;
    const display = root.querySelector("#timer-display");
    const phaseEl = root.querySelector("#timer-phase");
    const lapsEl = root.querySelector("#t-laps");
    const btnStart = root.querySelector("#t-start"), btnPause = root.querySelector("#t-pause"), btnReset = root.querySelector("#t-reset"), btnLap = root.querySelector("#t-lap");
    const baseTitle = document.title;
    let raf = null, running = false, startAt = 0, banked = 0, target = 0, pomoPhase = "focus", pomoRound = 1, laps = [];
    const POMO = { focus: 25 * 60000, break: 5 * 60000 };
    const beep = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const t0 = ac.currentTime;
        [880, 660, 880].forEach((f, i) => {
          const osc = ac.createOscillator(), gain = ac.createGain();
          osc.frequency.value = f; osc.connect(gain); gain.connect(ac.destination);
          gain.gain.setValueAtTime(0.0001, t0 + i * 0.28);
          gain.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.28 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.28 + 0.25);
          osc.start(t0 + i * 0.28); osc.stop(t0 + i * 0.28 + 0.26);
        });
        setTimeout(() => ac.close(), 1500);
      } catch (e) { /* sound blocked — the flash still shows */ }
    };
    // Countdowns ceil (a timer reads 00:03 until three full seconds remain);
    // stopwatch values floor so the seconds agree with the centiseconds shown.
    const fmt = (ms, roundFn = Math.ceil) => {
      const total = Math.max(0, roundFn(ms / 1000));
      const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
      return (h ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };
    const fmtLap = (ms) => {
      const cs = Math.floor((ms % 1000) / 10);
      return `${fmt(ms, Math.floor)}.${String(cs).padStart(2, "0")}`;
    };
    const mode = () => val("mode");
    const countdownTotal = () => Math.min(999 * 60000, Math.max(1000, (Math.round(num(val("mins"))) * 60 + Math.round(num(val("secs")))) * 1000));
    const elapsed = () => banked + (running ? performance.now() - startAt : 0);
    const setDisplay = (text, title) => {
      display.textContent = text;
      document.title = title ? `${title} — ${baseTitle}` : baseTitle;
    };
    const finishPhase = () => {
      beep();
      display.classList.add("timer-done");
      setTimeout(() => display.classList.remove("timer-done"), 3000);
      if (mode() === "pomodoro") {
        if (pomoPhase === "focus") { pomoPhase = "break"; } else { pomoPhase = "focus"; pomoRound++; }
        banked = 0; startAt = performance.now(); target = POMO[pomoPhase];
        phaseEl.textContent = pomoPhase === "focus" ? `Round ${pomoRound} — focus for 25 minutes` : "Break — step away for 5 minutes";
        return; // keep running into the next phase
      }
      running = false; banked = 0;
      btnStart.disabled = false; btnPause.disabled = true;
      btnStart.textContent = "Start";
      setDisplay("00:00", "Time's up!");
    };
    const tick = () => {
      if (running) {
        if (mode() === "stopwatch") {
          setDisplay(fmtLap(elapsed()), fmt(elapsed(), Math.floor));
        } else {
          const left = target - elapsed();
          if (left <= 0) { finishPhase(); }
          else setDisplay(fmt(left), `${fmt(left)}${mode() === "pomodoro" ? (pomoPhase === "focus" ? " focus" : " break") : ""}`);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const reset = () => {
      running = false; banked = 0; laps = []; lapsEl.innerHTML = "";
      pomoPhase = "focus"; pomoRound = 1;
      btnStart.disabled = false; btnPause.disabled = true; btnStart.textContent = "Start";
      const m = mode();
      const isStopwatch = m === "stopwatch";
      root.querySelector('[data-field="mins"]').style.display = m === "countdown" ? "" : "none";
      root.querySelector('[data-field="secs"]').style.display = m === "countdown" ? "" : "none";
      btnLap.style.display = isStopwatch ? "" : "none";
      phaseEl.textContent = m === "pomodoro" ? "Round 1 — focus for 25 minutes" : "";
      setDisplay(isStopwatch ? "00:00.00" : fmt(m === "pomodoro" ? POMO.focus : countdownTotal()));
    };
    btnStart.onclick = () => {
      if (running) return;
      if (banked === 0) target = mode() === "pomodoro" ? POMO[pomoPhase] : countdownTotal();
      running = true; startAt = performance.now();
      btnStart.disabled = true; btnPause.disabled = false;
    };
    btnPause.onclick = () => {
      if (!running) return;
      banked = elapsed(); running = false;
      btnStart.disabled = false; btnPause.disabled = true; btnStart.textContent = "Resume";
    };
    btnReset.onclick = reset;
    btnLap.onclick = () => {
      if (mode() !== "stopwatch") return;
      laps.push(elapsed());
      lapsEl.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Lap</th><th>Lap time</th><th>Total</th></tr></thead><tbody>${laps.map((t, i) => `<tr><td>${i + 1}</td><td>${fmtLap(t - (laps[i - 1] || 0))}</td><td>${fmtLap(t)}</td></tr>`).reverse().join("")}</tbody></table></div>`;
    };
    root.querySelectorAll("select, input").forEach((el) => el.addEventListener("change", reset));
    reset();
    tick();
  }

  const renderers = {
    "word-counter": renderWordCounter,
    "case-converter": renderCaseConverter,
    "text-diff": renderTextDiff,
    "json-formatter": renderJsonFormatter,
    "password-generator": renderPasswordGenerator,
    "uuid-generator": renderUuidGenerator,
    "hash-generator": renderHashGenerator,
    "random-picker": renderRandomPicker,
    "lorem-ipsum-generator": renderLoremIpsum,
    "signature-drawer": renderSignatureDrawer,
    "countdown-timer": renderTimer
  };
  if (renderers[slug]) renderers[slug]();
  else root.innerHTML = `<p class="error">This tool could not be loaded.</p>`;
})();
