(() => {
  const root = document.querySelector("#tool-root");
  if (!root) return;
  const slug = root.dataset.tool;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const num = (value) => Number.parseFloat(value) || 0;
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const fmtBytes = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
  const baseName = (file) => file.name.replace(/\.[^.]+$/, "");
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const download = (content, filename, type = "application/octet-stream") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const resultPanel = () => `<section id="result" class="result-panel" aria-live="polite" hidden></section>`;
  const metricsHtml = (items) => `<div class="metric-grid">${items.map(([label, value]) => `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div>`;
  const showError = (panel, message) => { panel.innerHTML = `<p class="error">${esc(message)}</p>`; panel.hidden = false; };
  const fileInput = (multiple = false, accept = "", prompt = "") => `<div class="drop-zone"><label><strong>${esc(prompt || `Choose ${multiple ? "files" : "a file"}`)}</strong><br><input id="file-input" type="file" ${accept ? `accept="${accept}"` : ""} ${multiple ? "multiple" : ""}></label></div>`;
  const selectHtml = (id, label, options, help = "") => `<div class="field"><label for="${id}">${esc(label)}</label><select id="${id}">${options.map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`).join("")}</select>${help ? `<small>${esc(help)}</small>` : ""}</div>`;
  const numberHtml = (id, label, value, help = "", attrs = "") => `<div class="field"><label for="${id}">${esc(label)}</label><input id="${id}" type="number" value="${esc(value)}" step="any" ${attrs}>${help ? `<small>${esc(help)}</small>` : ""}</div>`;
  const sliderHtml = (id, label, value, min, max, step) => `<div class="field"><label for="${id}">${esc(label)} — <output for="${id}" id="${id}-out">${esc(value)}</output></label><input id="${id}" type="range" value="${esc(value)}" min="${min}" max="${max}" step="${step}" oninput="document.getElementById('${id}-out').textContent=this.value"></div>`;

  async function loadScript(src, globalName) {
    if (window[globalName]) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const LIB = {
    heic2any: ["https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js", "heic2any"],
    pdfLib: ["https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js", "PDFLib"],
    pdfjs: ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js", "pdfjsLib"],
    mammoth: ["https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth"],
    lamejs: ["https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/dist/lamejs.iife.js", "lamejs"],
    xlsx: ["https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", "XLSX"],
    exifr: ["https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js", "exifr"]
  };
  const lib = async (key) => loadScript(LIB[key][0], LIB[key][1]);
  async function loadPdfjs() {
    await lib("pdfjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }

  const LIB_FAIL = "A conversion library could not load. Check your internet connection and try again.";

  // ---------- image helpers ----------
  const isHeic = (file) => /\.hei[cf]$/i.test(file.name) || /hei[cf]/.test(file.type || "");
  const imgW = (img) => img.naturalWidth || img.width;
  const imgH = (img) => img.naturalHeight || img.height;

  async function decodeImageFile(file) {
    let source = file;
    if (isHeic(file)) {
      await lib("heic2any");
      const converted = await heic2any({ blob: file, toType: "image/png" });
      source = Array.isArray(converted) ? converted[0] : converted;
    }
    if (window.createImageBitmap) {
      try { return await createImageBitmap(source); } catch { /* fall through to <img> decode */ }
    }
    return await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(source);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image format could not be decoded by your browser.")); };
      img.src = url;
    });
  }

  const makeCanvas = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
  };

  // fill: background color for formats without alpha; cover: center-crop to exactly w×h.
  function drawToCanvas(img, width, height, { fill = "", cover = false } = {}) {
    const canvas = makeCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (cover) {
      const scale = Math.max(canvas.width / imgW(img), canvas.height / imgH(img));
      const sw = canvas.width / scale, sh = canvas.height / scale;
      ctx.drawImage(img, (imgW(img) - sw) / 2, (imgH(img) - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }

  const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not encode this format.")), type, quality);
  });

  const extFor = (type) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[type] || "img");
  const needsFill = (type) => type === "image/jpeg";

  const formatSelect = (id = "format", withKeep = false) => selectHtml(id, "Output format", [
    ...(withKeep ? [["keep", "Same as input (PNG stays PNG)"]] : []),
    ["image/jpeg", "JPG — smallest, no transparency"],
    ["image/png", "PNG — lossless, keeps transparency"],
    ["image/webp", "WebP — small, keeps transparency"]
  ]);

  function fileResultRow(name, before, after, index) {
    const savedPct = before ? Math.round((1 - after / before) * 100) : 0;
    return `<tr><td>${esc(name)}</td><td>${fmtBytes(before)}</td><td>${fmtBytes(after)}</td><td>${savedPct > 0 ? `−${savedPct}%` : savedPct < 0 ? `+${-savedPct}%` : "0%"}</td><td><button class="button" data-dl="${index}" type="button">Download</button></td></tr>`;
  }

  function wireDownloads(panel, results) {
    panel.querySelectorAll("[data-dl]").forEach((button) => {
      button.onclick = () => { const item = results[num(button.dataset.dl)]; download(item.blob, item.filename); };
    });
    const all = panel.querySelector("#download-all");
    if (all) all.onclick = async () => {
      for (const item of results) { download(item.blob, item.filename); await delay(400); }
    };
  }

  const resultsTable = (rows, count) => `<div class="table-wrap"><table><thead><tr><th>File</th><th>Before</th><th>After</th><th>Change</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${count > 1 ? `<div class="actions"><button id="download-all" class="button primary" type="button">Download all ${count} files</button></div>` : ""}`;

  // ---------- reorderable file list (images-to-pdf, pdf merge) ----------
  function reorderList(container, files, label) {
    const render = () => {
      container.innerHTML = files.length ? `<p class="notice">${esc(label)}</p><div class="table-wrap"><table><tbody>${files.map((file, index) => `
        <tr><td>${index + 1}.</td><td>${esc(file.name)}</td><td>${fmtBytes(file.size)}</td>
        <td><button class="button" data-up="${index}" type="button" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="button" data-down="${index}" type="button" ${index === files.length - 1 ? "disabled" : ""}>↓</button>
        <button class="button" data-remove="${index}" type="button">✕</button></td></tr>`).join("")}</tbody></table></div>` : "";
      container.querySelectorAll("[data-up]").forEach((button) => button.onclick = () => { const i = num(button.dataset.up); [files[i - 1], files[i]] = [files[i], files[i - 1]]; render(); });
      container.querySelectorAll("[data-down]").forEach((button) => button.onclick = () => { const i = num(button.dataset.down); [files[i], files[i + 1]] = [files[i + 1], files[i]]; render(); });
      container.querySelectorAll("[data-remove]").forEach((button) => button.onclick = () => { files.splice(num(button.dataset.remove), 1); render(); });
    };
    render();
    return render;
  }

  // ---------- 1. image format converter ----------
  function renderImageFormatConverter() {
    root.innerHTML = `
      ${fileInput(true, "image/*,.heic,.heif", "Choose images (HEIC, PNG, JPG, WebP, AVIF…)")}
      <div class="form-grid" style="margin-top:1rem">
        ${formatSelect()}
        ${sliderHtml("quality", "Quality (JPG / WebP)", "0.92", "0.5", "1", "0.01")}
      </div>
      <p class="notice">HEIC support downloads a small decoder library on first use. Transparent areas become white when converting to JPG.</p>
      <div class="actions"><button id="convert" class="button primary" type="button">Convert images</button></div>
      ${resultPanel()}`;
    root.querySelector("#convert").onclick = async () => {
      const panel = root.querySelector("#result");
      const files = [...root.querySelector("#file-input").files];
      if (!files.length) return showError(panel, "Choose at least one image first.");
      const type = root.querySelector("#format").value;
      const quality = num(root.querySelector("#quality").value);
      panel.hidden = false; panel.innerHTML = "<h2>Converting…</h2><p id=\"progress\"></p>";
      const results = []; const rows = []; const failures = [];
      for (const [index, file] of files.entries()) {
        panel.querySelector("#progress").textContent = `${index + 1} of ${files.length}: ${file.name}`;
        try {
          const img = await decodeImageFile(file);
          const canvas = drawToCanvas(img, imgW(img), imgH(img), { fill: needsFill(type) ? "#ffffff" : "" });
          const blob = await canvasToBlob(canvas, type, quality);
          const filename = `${baseName(file)}.${extFor(blob.type)}`;
          results.push({ blob, filename });
          rows.push(fileResultRow(filename, file.size, blob.size, results.length - 1));
        } catch (error) {
          failures.push(`${file.name} — ${error.message || "could not be converted"}`);
        }
      }
      panel.innerHTML = `<h2>${results.length} of ${files.length} image${files.length === 1 ? "" : "s"} converted</h2>
        ${results.length ? resultsTable(rows.join(""), results.length) : ""}
        ${failures.length ? `<p class="notice">Skipped: ${esc(failures.join("; "))}. AVIF and HEIC decoding depends on your browser.</p>` : ""}`;
      wireDownloads(panel, results);
    };
  }

  // ---------- 2. image compressor ----------
  async function compressToTarget(canvas, type, targetBytes) {
    let low = 0.3, high = 0.95, best = await canvasToBlob(canvas, type, high);
    if (best.size <= targetBytes) return { blob: best, quality: high };
    let bestBlob = null, bestQuality = low;
    for (let i = 0; i < 8; i++) {
      const mid = (low + high) / 2;
      const blob = await canvasToBlob(canvas, type, mid);
      if (blob.size <= targetBytes) { bestBlob = blob; bestQuality = mid; low = mid; } else { high = mid; }
    }
    return { blob: bestBlob || await canvasToBlob(canvas, type, 0.3), quality: bestBlob ? bestQuality : 0.3 };
  }

  function renderImageCompressor() {
    root.innerHTML = `
      ${fileInput(true, "image/*,.heic,.heif", "Choose images to compress")}
      <div class="form-grid" style="margin-top:1rem">
        ${sliderHtml("quality", "Quality", "0.7", "0.3", "0.95", "0.01")}
        ${selectHtml("format", "Output format", [["image/jpeg", "JPG — best for photos"], ["image/webp", "WebP — smaller, modern"]])}
        ${numberHtml("maxwidth", "Max width in pixels (optional)", "", "Leave blank to keep original dimensions.", 'min="16" placeholder="e.g. 1920"')}
        ${numberHtml("target", "Target size in KB (optional)", "", "Overrides the quality slider — quality is searched automatically.", 'min="5" placeholder="e.g. 100"')}
      </div>
      <div class="actions"><button id="compress" class="button primary" type="button">Compress images</button></div>
      ${resultPanel()}`;
    root.querySelector("#compress").onclick = async () => {
      const panel = root.querySelector("#result");
      const files = [...root.querySelector("#file-input").files];
      if (!files.length) return showError(panel, "Choose at least one image first.");
      const type = root.querySelector("#format").value;
      const quality = num(root.querySelector("#quality").value);
      const maxWidth = num(root.querySelector("#maxwidth").value);
      const targetKb = num(root.querySelector("#target").value);
      panel.hidden = false; panel.innerHTML = "<h2>Compressing…</h2><p id=\"progress\"></p>";
      const results = []; const rows = []; const failures = []; const qualityUsed = [];
      for (const [index, file] of files.entries()) {
        panel.querySelector("#progress").textContent = `${index + 1} of ${files.length}: ${file.name}`;
        try {
          const img = await decodeImageFile(file);
          const scale = maxWidth && imgW(img) > maxWidth ? maxWidth / imgW(img) : 1;
          const canvas = drawToCanvas(img, imgW(img) * scale, imgH(img) * scale, { fill: needsFill(type) ? "#ffffff" : "" });
          let blob;
          if (targetKb) {
            const found = await compressToTarget(canvas, type, targetKb * 1024);
            blob = found.blob; qualityUsed.push(Math.round(found.quality * 100));
          } else {
            blob = await canvasToBlob(canvas, type, quality);
          }
          const filename = `${baseName(file)}-compressed.${extFor(blob.type)}`;
          results.push({ blob, filename });
          rows.push(fileResultRow(filename, file.size, blob.size, results.length - 1));
        } catch (error) {
          failures.push(`${file.name} — ${error.message || "could not be compressed"}`);
        }
      }
      const totalBefore = files.reduce((sum, file) => sum + file.size, 0);
      const totalAfter = results.reduce((sum, item) => sum + item.blob.size, 0);
      panel.innerHTML = `<h2>${results.length} image${results.length === 1 ? "" : "s"} compressed</h2>
        ${results.length ? metricsHtml([["Total before", fmtBytes(totalBefore)], ["Total after", fmtBytes(totalAfter)], ["Space saved", totalBefore ? `${Math.max(0, Math.round((1 - totalAfter / totalBefore) * 100))}%` : "—"]]) : ""}
        ${results.length ? resultsTable(rows.join(""), results.length) : ""}
        ${targetKb && qualityUsed.length ? `<p class="notice">Quality was searched automatically to stay near ${targetKb} KB (settled around ${Math.round(qualityUsed.reduce((sum, q) => sum + q, 0) / qualityUsed.length)}%). Very small targets may not be reachable without also lowering the max width.</p>` : ""}
        ${failures.length ? `<p class="notice">Skipped: ${esc(failures.join("; "))}</p>` : ""}`;
      wireDownloads(panel, results);
    };
  }

  // ---------- 3. image resizer ----------
  const PRESETS = [
    ["1080x1080", "Instagram post — 1080 × 1080"],
    ["1080x1350", "Instagram portrait — 1080 × 1350"],
    ["1080x1920", "Instagram / TikTok story — 1080 × 1920"],
    ["1600x900", "X (Twitter) post — 1600 × 900"],
    ["1500x500", "X (Twitter) header — 1500 × 500"],
    ["820x312", "Facebook cover — 820 × 312"],
    ["1280x720", "YouTube thumbnail — 1280 × 720"],
    ["1584x396", "LinkedIn cover — 1584 × 396"],
    ["1200x630", "Link preview (Open Graph) — 1200 × 630"],
    ["1920x1080", "Full HD — 1920 × 1080"]
  ];

  function renderImageResizer() {
    root.innerHTML = `
      ${fileInput(false, "image/*,.heic,.heif", "Choose an image")}
      <div class="form-grid" style="margin-top:1rem">
        ${selectHtml("mode", "Resize by", [["percent", "Percentage"], ["exact", "Exact pixels"], ["preset", "Social-media preset"]])}
        ${numberHtml("percent", "Scale (%)", "50", "", 'min="1" max="400"')}
        ${numberHtml("width", "Width (px)", "1200", "Leave height blank to keep the aspect ratio.", 'min="1"')}
        ${numberHtml("height", "Height (px)", "", "", 'min="1" placeholder="auto"')}
        ${selectHtml("preset", "Preset size", PRESETS)}
        ${selectHtml("fit", "If the shape doesn't match", [["cover", "Fill the frame and crop the overflow (centered)"], ["contain", "Fit inside without cropping (may letterbox)"]])}
        ${formatSelect()}
        ${sliderHtml("quality", "Quality (JPG / WebP)", "0.92", "0.5", "1", "0.01")}
      </div>
      <div class="actions"><button id="resize" class="button primary" type="button">Resize image</button></div>
      ${resultPanel()}`;
    const modeSelect = root.querySelector("#mode");
    const showFields = () => {
      const mode = modeSelect.value;
      root.querySelector("#percent").closest(".field").style.display = mode === "percent" ? "" : "none";
      root.querySelector("#width").closest(".field").style.display = mode === "exact" ? "" : "none";
      root.querySelector("#height").closest(".field").style.display = mode === "exact" ? "" : "none";
      root.querySelector("#preset").closest(".field").style.display = mode === "preset" ? "" : "none";
      root.querySelector("#fit").closest(".field").style.display = mode === "percent" ? "none" : "";
    };
    modeSelect.onchange = showFields;
    showFields();
    root.querySelector("#resize").onclick = async () => {
      const panel = root.querySelector("#result");
      const file = root.querySelector("#file-input").files[0];
      if (!file) return showError(panel, "Choose an image first.");
      const type = root.querySelector("#format").value;
      const quality = num(root.querySelector("#quality").value);
      panel.hidden = false; panel.innerHTML = "<h2>Resizing…</h2>";
      try {
        const img = await decodeImageFile(file);
        const mode = modeSelect.value;
        let width, height, cover = false;
        if (mode === "percent") {
          const scale = Math.min(4, Math.max(0.01, num(root.querySelector("#percent").value) / 100 || 0.5));
          width = imgW(img) * scale; height = imgH(img) * scale;
        } else {
          if (mode === "preset") {
            [width, height] = root.querySelector("#preset").value.split("x").map(Number);
          } else {
            width = num(root.querySelector("#width").value) || imgW(img);
            height = num(root.querySelector("#height").value) || Math.round(width * imgH(img) / imgW(img));
          }
          cover = root.querySelector("#fit").value === "cover";
        }
        let canvas;
        if (cover || mode === "percent") {
          canvas = drawToCanvas(img, width, height, { fill: needsFill(type) ? "#ffffff" : "", cover });
        } else {
          // contain: scale to fit inside width×height, canvas shrinks to the fitted size (no letterbox bars)
          const scale = Math.min(width / imgW(img), height / imgH(img));
          canvas = drawToCanvas(img, imgW(img) * scale, imgH(img) * scale, { fill: needsFill(type) ? "#ffffff" : "" });
        }
        const blob = await canvasToBlob(canvas, type, quality);
        const filename = `${baseName(file)}-${canvas.width}x${canvas.height}.${extFor(blob.type)}`;
        panel.innerHTML = `<h2>Resized to ${canvas.width} × ${canvas.height}</h2>
          ${metricsHtml([["Original", `${imgW(img)} × ${imgH(img)} (${fmtBytes(file.size)})`], ["New", `${canvas.width} × ${canvas.height} (${fmtBytes(blob.size)})`]])}
          <div style="margin:1rem 0;border:1px solid var(--line);border-radius:8px;overflow:hidden"><img id="preview" alt="Resized preview" style="display:block;max-width:100%"></div>
          <div class="actions"><button id="download-resized" class="button primary" type="button">Download image</button></div>`;
        panel.querySelector("#preview").src = URL.createObjectURL(blob);
        panel.querySelector("#download-resized").onclick = () => download(blob, filename);
      } catch (error) {
        showError(panel, error.message || "This image could not be resized.");
      }
    };
  }

  // ---------- 4. images to PDF ----------
  function renderImagesToPdf() {
    root.innerHTML = `
      ${fileInput(true, "image/*,.heic,.heif", "Choose images (they become PDF pages in order)")}
      <div id="file-list" style="margin-top:1rem"></div>
      <div class="form-grid">
        ${selectHtml("pagesize", "Page size", [["auto", "Auto — page matches each image"], ["letter", "US Letter (8.5 × 11 in)"], ["a4", "A4"]])}
        ${numberHtml("margin", "Margin (inches)", "0.5", "Used with Letter and A4 pages.", 'min="0" max="3"')}
      </div>
      <div class="actions"><button id="make-pdf" class="button primary" type="button">Create PDF</button></div>
      ${resultPanel()}`;
    let files = [];
    const listBox = root.querySelector("#file-list");
    root.querySelector("#file-input").onchange = (event) => {
      files = [...event.target.files];
      reorderList(listBox, files, "Use the arrows to set the page order.");
    };
    root.querySelector("#make-pdf").onclick = async () => {
      const panel = root.querySelector("#result");
      if (!files.length) return showError(panel, "Choose at least one image first.");
      panel.hidden = false; panel.innerHTML = "<h2>Building PDF…</h2><p id=\"progress\"></p>";
      try {
        await lib("pdfLib");
      } catch { return showError(panel, LIB_FAIL); }
      try {
        const pageSize = root.querySelector("#pagesize").value;
        const margin = Math.max(0, num(root.querySelector("#margin").value)) * 72;
        const doc = await PDFLib.PDFDocument.create();
        const failures = [];
        for (const [index, file] of files.entries()) {
          panel.querySelector("#progress").textContent = `${index + 1} of ${files.length}: ${file.name}`;
          try {
            const img = await decodeImageFile(file);
            const canvas = drawToCanvas(img, imgW(img), imgH(img), { fill: "#ffffff" });
            const jpgBytes = await (await canvasToBlob(canvas, "image/jpeg", 0.92)).arrayBuffer();
            const embedded = await doc.embedJpg(jpgBytes);
            const imagePts = { width: imgW(img) * 72 / 96, height: imgH(img) * 72 / 96 };
            if (pageSize === "auto") {
              const page = doc.addPage([imagePts.width, imagePts.height]);
              page.drawImage(embedded, { x: 0, y: 0, width: imagePts.width, height: imagePts.height });
            } else {
              let [pw, ph] = pageSize === "letter" ? [612, 792] : [595.28, 841.89];
              if (imgW(img) > imgH(img)) [pw, ph] = [ph, pw];
              const page = doc.addPage([pw, ph]);
              const scale = Math.min((pw - margin * 2) / imagePts.width, (ph - margin * 2) / imagePts.height);
              const w = imagePts.width * scale, h = imagePts.height * scale;
              page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
            }
          } catch (error) {
            failures.push(`${file.name} — ${error.message || "could not be added"}`);
          }
        }
        if (!doc.getPageCount()) return showError(panel, "None of the chosen images could be decoded.");
        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        panel.innerHTML = `<h2>PDF ready — ${doc.getPageCount()} page${doc.getPageCount() === 1 ? "" : "s"}</h2>
          ${metricsHtml([["Images", String(files.length)], ["PDF size", fmtBytes(blob.size)]])}
          <div class="actions"><button id="download-pdf" class="button primary" type="button">Download PDF</button></div>
          ${failures.length ? `<p class="notice">Skipped: ${esc(failures.join("; "))}</p>` : ""}`;
        panel.querySelector("#download-pdf").onclick = () => download(blob, "images.pdf", "application/pdf");
      } catch (error) {
        showError(panel, error.message || "The PDF could not be created.");
      }
    };
  }

  // ---------- 5. PDF merge / split ----------
  function parsePageRanges(text, pageCount) {
    const pages = [];
    for (const part of String(text).split(",").map((piece) => piece.trim()).filter(Boolean)) {
      const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
      if (!match) throw new Error(`"${part}" is not a page or range like 2 or 4-7.`);
      const from = Number(match[1]), to = Number(match[2] || match[1]);
      if (from < 1 || to > pageCount || from > to) throw new Error(`"${part}" is outside this ${pageCount}-page PDF.`);
      for (let page = from; page <= to; page++) if (!pages.includes(page)) pages.push(page);
    }
    if (!pages.length) throw new Error("Enter at least one page number or range, like 1-3, 5.");
    return pages;
  }

  function renderPdfMergeSplit() {
    root.innerHTML = `
      <div class="form-grid">${selectHtml("mode", "What do you want to do?", [["merge", "Merge several PDFs into one"], ["split", "Split / extract pages from one PDF"]])}</div>
      <div id="stage" style="margin-top:1rem"></div>
      ${resultPanel()}`;
    const stage = root.querySelector("#stage");
    const panel = root.querySelector("#result");
    let files = [];

    const renderMode = () => {
      panel.hidden = true;
      const merge = root.querySelector("#mode").value === "merge";
      stage.innerHTML = merge ? `
        ${fileInput(true, ".pdf,application/pdf", "Choose two or more PDFs")}
        <div id="file-list" style="margin-top:1rem"></div>
        <div class="actions"><button id="go" class="button primary" type="button">Merge PDFs</button></div>` : `
        ${fileInput(false, ".pdf,application/pdf", "Choose a PDF")}
        <div class="form-grid" style="margin-top:1rem">
          <div class="field full"><label for="ranges">Pages to keep</label><input id="ranges" type="text" value="" placeholder="e.g. 1-3, 5, 8-10"><small>Order matters — pages come out in the order you list them.</small></div>
          ${selectHtml("splitmode", "Output", [["one", "One PDF with the selected pages"], ["each", "A separate PDF for every selected page"]])}
        </div>
        <div class="actions"><button id="go" class="button primary" type="button">Split PDF</button></div>`;
      if (merge) {
        root.querySelector("#file-input").onchange = (event) => {
          files = [...event.target.files];
          reorderList(root.querySelector("#file-list"), files, "Use the arrows to set the merge order.");
        };
      }
      stage.querySelector("#go").onclick = merge ? doMerge : doSplit;
    };

    async function doMerge() {
      if (files.length < 2) return showError(panel, "Choose at least two PDFs to merge.");
      panel.hidden = false; panel.innerHTML = "<h2>Merging…</h2><p id=\"progress\"></p>";
      try { await lib("pdfLib"); } catch { return showError(panel, LIB_FAIL); }
      try {
        const merged = await PDFLib.PDFDocument.create();
        for (const [index, file] of files.entries()) {
          panel.querySelector("#progress").textContent = `${index + 1} of ${files.length}: ${file.name}`;
          let source;
          try {
            source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
          } catch {
            return showError(panel, `${file.name} could not be read. Password-protected or damaged PDFs cannot be merged here.`);
          }
          const pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach((page) => merged.addPage(page));
        }
        const blob = new Blob([await merged.save()], { type: "application/pdf" });
        panel.innerHTML = `<h2>Merged — ${merged.getPageCount()} pages from ${files.length} files</h2>
          ${metricsHtml([["Output size", fmtBytes(blob.size)]])}
          <div class="actions"><button id="download-merged" class="button primary" type="button">Download merged PDF</button></div>`;
        panel.querySelector("#download-merged").onclick = () => download(blob, "merged.pdf", "application/pdf");
      } catch (error) {
        showError(panel, error.message || "These PDFs could not be merged.");
      }
    }

    async function doSplit() {
      const file = root.querySelector("#file-input").files[0];
      if (!file) return showError(panel, "Choose a PDF first.");
      panel.hidden = false; panel.innerHTML = "<h2>Splitting…</h2>";
      try { await lib("pdfLib"); } catch { return showError(panel, LIB_FAIL); }
      try {
        let source;
        try {
          source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        } catch {
          return showError(panel, "This PDF could not be read. Password-protected or damaged PDFs cannot be split here.");
        }
        const pages = parsePageRanges(root.querySelector("#ranges").value, source.getPageCount());
        if (root.querySelector("#splitmode").value === "each") {
          const results = [];
          for (const pageNumber of pages) {
            const doc = await PDFLib.PDFDocument.create();
            const [page] = await doc.copyPages(source, [pageNumber - 1]);
            doc.addPage(page);
            results.push({ blob: new Blob([await doc.save()], { type: "application/pdf" }), filename: `${baseName(file)}-page-${pageNumber}.pdf` });
          }
          panel.innerHTML = `<h2>${results.length} single-page PDFs ready</h2>
            <div class="table-wrap"><table><tbody>${results.map((item, index) => `<tr><td>${esc(item.filename)}</td><td>${fmtBytes(item.blob.size)}</td><td><button class="button" data-dl="${index}" type="button">Download</button></td></tr>`).join("")}</tbody></table></div>
            <div class="actions"><button id="download-all" class="button primary" type="button">Download all ${results.length} files</button></div>`;
          wireDownloads(panel, results);
        } else {
          const doc = await PDFLib.PDFDocument.create();
          const copied = await doc.copyPages(source, pages.map((page) => page - 1));
          copied.forEach((page) => doc.addPage(page));
          const blob = new Blob([await doc.save()], { type: "application/pdf" });
          panel.innerHTML = `<h2>Extracted ${pages.length} page${pages.length === 1 ? "" : "s"}</h2>
            ${metricsHtml([["Source pages", String(source.getPageCount())], ["Output size", fmtBytes(blob.size)]])}
            <div class="actions"><button id="download-split" class="button primary" type="button">Download PDF</button></div>`;
          panel.querySelector("#download-split").onclick = () => download(blob, `${baseName(file)}-pages.pdf`, "application/pdf");
        }
      } catch (error) {
        showError(panel, error.message || "This PDF could not be split.");
      }
    }

    root.querySelector("#mode").onchange = renderMode;
    renderMode();
  }

  // ---------- 6. PDF to images ----------
  function renderPdfToImages() {
    root.innerHTML = `
      ${fileInput(false, ".pdf,application/pdf", "Choose a PDF")}
      <div class="form-grid" style="margin-top:1rem">
        ${selectHtml("scale", "Resolution", [["1", "Standard (72 dpi)"], ["2", "High (144 dpi)"], ["3", "Very high (216 dpi)"]])}
        ${selectHtml("format", "Image format", [["image/png", "PNG — sharp text, larger files"], ["image/jpeg", "JPG — smaller files"]])}
      </div>
      <div class="actions"><button id="render" class="button primary" type="button">Convert pages to images</button></div>
      ${resultPanel()}`;
    root.querySelector("#render").onclick = async () => {
      const panel = root.querySelector("#result");
      const file = root.querySelector("#file-input").files[0];
      if (!file) return showError(panel, "Choose a PDF first.");
      panel.hidden = false; panel.innerHTML = "<h2>Rendering…</h2><p id=\"progress\"></p>";
      try { await loadPdfjs(); } catch { return showError(panel, LIB_FAIL); }
      try {
        const type = root.querySelector("#format").value;
        const scale = num(root.querySelector("#scale").value) || 2;
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const pageLimit = 60;
        const pageCount = Math.min(pdf.numPages, pageLimit);
        const results = [];
        let grid = "";
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
          panel.querySelector("#progress").textContent = `Page ${pageNumber} of ${pageCount}`;
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          const canvas = makeCanvas(viewport.width, viewport.height);
          const ctx = canvas.getContext("2d");
          if (type === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
          await page.render({ canvasContext: ctx, viewport }).promise;
          const blob = await canvasToBlob(canvas, type, 0.92);
          const filename = `${baseName(file)}-page-${pageNumber}.${extFor(blob.type)}`;
          results.push({ blob, filename });
          const thumb = drawToCanvas(canvas, 220, 220 * canvas.height / canvas.width);
          grid += `<div class="tool-card"><img src="${thumb.toDataURL("image/jpeg", 0.7)}" alt="Page ${pageNumber} preview" style="max-width:100%;border-radius:4px"><p>Page ${pageNumber} · ${fmtBytes(blob.size)}</p><button class="button" data-dl="${results.length - 1}" type="button">Download</button></div>`;
        }
        panel.innerHTML = `<h2>${pageCount} page${pageCount === 1 ? "" : "s"} converted</h2>
          ${pdf.numPages > pageLimit ? `<p class="notice">This PDF has ${pdf.numPages} pages; the first ${pageLimit} were converted. Split the PDF first to convert the rest.</p>` : ""}
          <div class="tool-grid">${grid}</div>
          <div class="actions"><button id="download-all" class="button primary" type="button">Download all ${results.length} images</button></div>`;
        wireDownloads(panel, results);
      } catch (error) {
        showError(panel, /password/i.test(String(error?.message)) ? "This PDF is password-protected and cannot be rendered here." : "This PDF could not be rendered. It may be damaged or use unsupported features.");
      }
    };
  }

  // ---------- 7. PDF & Word text extractor ----------
  function textStats(text) {
    const words = (text.match(/\S+/g) || []).length;
    const sentences = (text.match(/[.!?]+(?:\s|$)/g) || []).length;
    return [
      ["Words", number.format(words)],
      ["Characters", number.format(text.length)],
      ["Characters (no spaces)", number.format(text.replace(/\s/g, "").length)],
      ["Sentences (approx.)", number.format(sentences)],
      ["Reading time", `${Math.max(1, Math.ceil(words / 238))} min`],
      ["Speaking time", `${Math.max(1, Math.ceil(words / 130))} min`]
    ];
  }

  function renderTextExtractor() {
    root.innerHTML = `
      ${fileInput(false, ".pdf,.docx,.txt,application/pdf", "Choose a PDF, Word (.docx), or text file")}
      <p class="notice">Scanned PDFs are pictures of text, not text — for those, use the Screenshot Table Extractor's OCR instead.</p>
      <div class="actions"><button id="extract" class="button primary" type="button">Extract text & count words</button></div>
      ${resultPanel()}`;
    root.querySelector("#extract").onclick = async () => {
      const panel = root.querySelector("#result");
      const file = root.querySelector("#file-input").files[0];
      if (!file) return showError(panel, "Choose a file first.");
      panel.hidden = false; panel.innerHTML = "<h2>Extracting…</h2><p id=\"progress\"></p>";
      try {
        let text = "";
        if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
          try { await loadPdfjs(); } catch { return showError(panel, LIB_FAIL); }
          const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
          const pageTexts = [];
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            panel.querySelector("#progress").textContent = `Page ${pageNumber} of ${pdf.numPages}`;
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            let pageText = "";
            for (const item of content.items) pageText += item.str + (item.hasEOL ? "\n" : " ");
            pageTexts.push(pageText.replace(/[ \t]+/g, " ").trim());
          }
          text = pageTexts.join("\n\n");
        } else if (/\.docx$/i.test(file.name)) {
          try { await lib("mammoth"); } catch { return showError(panel, LIB_FAIL); }
          text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value.trim();
        } else {
          text = String(await file.text()).trim();
        }
        if (!text) return showError(panel, "No selectable text was found. If this is a scanned document, it needs OCR rather than extraction.");
        panel.innerHTML = `<h2>Text extracted</h2>${metricsHtml(textStats(text))}
          <div class="field"><textarea id="text-out" rows="14" readonly>${esc(text)}</textarea></div>
          <div class="actions"><button id="copy-text" class="button primary" type="button">Copy text</button><button id="download-text" class="button" type="button">Download .txt</button></div>`;
        panel.querySelector("#copy-text").onclick = () => navigator.clipboard.writeText(text);
        panel.querySelector("#download-text").onclick = () => download(text, `${baseName(file)}.txt`, "text/plain");
      } catch {
        showError(panel, "This file could not be read. Password-protected or damaged files cannot be extracted here.");
      }
    };
  }

  // ---------- 8. Markdown ↔ HTML ----------
  const safeUrl = (url) => /^(https?:|mailto:|#|\/|\.)/i.test(String(url).trim()) ? String(url).trim() : "#";

  function mdInline(text) {
    let out = esc(text);
    const codeSpans = [];
    out = out.replace(/`([^`]+)`/g, (_match, code) => { codeSpans.push(`<code>${code}</code>`); return `\u0000${codeSpans.length - 1}\u0000`; });
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_match, alt, url) => `<img src="${esc(safeUrl(url))}" alt="${alt}">`);
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_match, label, url) => `<a href="${esc(safeUrl(url))}">${label}</a>`);
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
    out = out.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/(^|[\s(])_([^_\s][^_]*)_/g, "$1<em>$2</em>");
    out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    out = out.replace(/\u0000(\d+)\u0000/g, (match, index) => codeSpans[Number(index)] ?? match);
    return out;
  }

  function mdToHtml(source) {
    const lines = String(source).replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index++; continue; }
      if (/^```/.test(line)) {
        const code = [];
        index++;
        while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);
        index++;
        html.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
        continue;
      }
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) { html.push(`<h${heading[1].length}>${mdInline(heading[2].replace(/\s#+\s*$/, ""))}</h${heading[1].length}>`); index++; continue; }
      if (/^(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html.push("<hr>"); index++; continue; }
      if (/^>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
        html.push(`<blockquote>${mdToHtml(quote.join("\n"))}</blockquote>`);
        continue;
      }
      const listMatch = /^(\s*)([-*+]|\d+[.)])\s+/.exec(line);
      if (listMatch) {
        const ordered = /\d/.test(listMatch[2]);
        const items = [];
        while (index < lines.length) {
          const itemMatch = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(lines[index]);
          if (!itemMatch) break;
          items.push(`<li>${mdInline(itemMatch[1])}</li>`);
          index++;
        }
        html.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
        continue;
      }
      const paragraph = [];
      while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|>|(?:\s*(?:[-*+]|\d+[.)])\s)|(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[index])) {
        paragraph.push(lines[index++]);
      }
      html.push(`<p>${paragraph.map(mdInline).join("<br>\n")}</p>`);
    }
    return html.join("\n");
  }

  function htmlToMd(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const walk = (node, context = {}) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, " ");
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const children = (childContext = context) => [...node.childNodes].map((child) => walk(child, childContext)).join("");
      const tag = node.tagName.toLowerCase();
      switch (tag) {
        case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
          return `\n\n${"#".repeat(Number(tag[1]))} ${children().trim()}\n\n`;
        case "p": case "section": case "article": case "div":
          return `\n\n${children().trim()}\n\n`;
        case "br": return "\n";
        case "hr": return "\n\n---\n\n";
        case "strong": case "b": return `**${children().trim()}**`;
        case "em": case "i": return `*${children().trim()}*`;
        case "del": case "s": return `~~${children().trim()}~~`;
        case "code":
          return context.inPre ? children() : `\`${node.textContent}\``;
        case "pre": return `\n\n\`\`\`\n${node.textContent.replace(/\n$/, "")}\n\`\`\`\n\n`;
        case "a": return `[${children().trim() || node.getAttribute("href") || ""}](${node.getAttribute("href") || "#"})`;
        case "img": return `![${node.getAttribute("alt") || ""}](${node.getAttribute("src") || ""})`;
        case "blockquote": return `\n\n${children().trim().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
        case "ul": case "ol": {
          const ordered = tag === "ol";
          const items = [...node.children].filter((child) => child.tagName === "LI")
            .map((item, itemIndex) => `${ordered ? `${itemIndex + 1}.` : "-"} ${walk(item).trim()}`);
          return `\n\n${items.join("\n")}\n\n`;
        }
        case "li": return children();
        case "table": {
          const rows = [...node.querySelectorAll("tr")].map((row) => [...row.children].map((cell) => walk(cell).trim().replace(/\|/g, "\\|")));
          if (!rows.length) return "";
          const header = rows[0];
          const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`, ...rows.slice(1).map((row) => `| ${row.join(" | ")} |`)];
          return `\n\n${lines.join("\n")}\n\n`;
        }
        case "script": case "style": return "";
        default: return children();
      }
    };
    return walk(doc.body).replace(/\n[ \t]+\n/g, "\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function renderMarkdownConverter() {
    const sample = "# Meeting notes\n\nThese are **bold plans** with a [link](https://example.com).\n\n- First item\n- Second item\n\n> One quoted line.";
    root.innerHTML = `
      <div class="form-grid">${selectHtml("direction", "Direction", [["md2html", "Markdown → HTML"], ["html2md", "HTML → Markdown"]])}</div>
      <div class="field" style="margin-top:1rem"><label for="source">Input</label><textarea id="source" rows="10" spellcheck="false">${esc(sample)}</textarea></div>
      <div class="field"><label for="output">Output</label><textarea id="output" rows="10" readonly></textarea></div>
      <div class="actions"><button id="copy-out" class="button primary" type="button">Copy output</button><button id="download-out" class="button" type="button">Download</button></div>
      <div id="preview-wrap"><h2 style="font-size:1.1rem;margin:1.5rem 0 .6rem">Live preview</h2>
      <iframe id="preview" sandbox="" title="Rendered preview" style="width:100%;min-height:280px;border:1px solid var(--line);border-radius:8px;background:#fff"></iframe></div>`;
    const source = root.querySelector("#source");
    const output = root.querySelector("#output");
    const preview = root.querySelector("#preview");
    const direction = root.querySelector("#direction");
    const previewWrap = root.querySelector("#preview-wrap");
    const previewCss = "<style>body{font:16px/1.6 -apple-system,system-ui,sans-serif;color:#1c2733;background:#fff;padding:1.2rem;max-width:720px}pre{background:#f0f3f7;padding:.8rem;border-radius:6px;overflow:auto}code{background:#f0f3f7;padding:.1rem .3rem;border-radius:4px}blockquote{border-left:3px solid #b9c4d0;margin:0;padding:.2rem 1rem;color:#4a5866}table{border-collapse:collapse}td,th{border:1px solid #ccd4dd;padding:.35rem .6rem}img{max-width:100%}</style>";
    const convert = () => {
      const md2html = direction.value === "md2html";
      previewWrap.style.display = md2html ? "" : "none";
      if (md2html) {
        const html = mdToHtml(source.value);
        output.value = html;
        preview.srcdoc = `<!doctype html><meta charset="utf-8">${previewCss}${html}`;
      } else {
        output.value = htmlToMd(source.value);
      }
    };
    source.addEventListener("input", convert);
    direction.addEventListener("change", () => {
      source.value = direction.value === "html2md" ? output.value || "<h1>Paste HTML here</h1>\n<p>It becomes <strong>Markdown</strong>.</p>" : sample;
      convert();
    });
    root.querySelector("#copy-out").onclick = () => navigator.clipboard.writeText(output.value);
    root.querySelector("#download-out").onclick = () => {
      const md2html = direction.value === "md2html";
      download(output.value, md2html ? "converted.html" : "converted.md", md2html ? "text/html" : "text/markdown");
    };
    convert();
  }

  // ---------- 9. SVG to PNG ----------
  function svgDimensions(svgText) {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg || doc.querySelector("parsererror")) return null;
    const attr = (name) => { const value = svg.getAttribute(name); return value && !/%$/.test(value) ? Number.parseFloat(value) : 0; };
    let width = attr("width"), height = attr("height");
    if (!width || !height) {
      const viewBox = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
      if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) { width = width || viewBox[2]; height = height || viewBox[3]; }
    }
    if (!width || !height) { width = width || 512; height = height || 512; }
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    return { width, height, text: new XMLSerializer().serializeToString(svg) };
  }

  function svgToImage(svgText) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This SVG could not be rendered. Embedded external images or fonts are not supported.")); };
      img.src = url;
    });
  }

  function renderSvgToPng() {
    root.innerHTML = `
      ${fileInput(false, ".svg,image/svg+xml", "Choose an SVG file")}
      <div class="field" style="margin-top:1rem"><label for="svg-code">…or paste SVG code</label><textarea id="svg-code" rows="6" spellcheck="false" placeholder="&lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; …&gt;"></textarea></div>
      <div class="form-grid">${numberHtml("out-width", "Output width (px)", "", "Leave blank to use the SVG's own size. Height keeps the aspect ratio.", 'min="8" max="8192" placeholder="e.g. 1024"')}</div>
      <div class="actions"><button id="to-png" class="button primary" type="button">Convert to PNG</button><button id="favicons" class="button" type="button">Generate favicon set</button></div>
      ${resultPanel()}`;
    const getSvgText = async () => {
      const file = root.querySelector("#file-input").files[0];
      if (file) return await file.text();
      return root.querySelector("#svg-code").value.trim();
    };
    root.querySelector("#to-png").onclick = async () => {
      const panel = root.querySelector("#result");
      try {
        const raw = await getSvgText();
        if (!raw) return showError(panel, "Choose an SVG file or paste SVG code first.");
        const svg = svgDimensions(raw);
        if (!svg) return showError(panel, "That doesn't look like valid SVG markup.");
        const img = await svgToImage(svg.text);
        const width = num(root.querySelector("#out-width").value) || svg.width;
        const canvas = drawToCanvas(img, width, width * svg.height / svg.width);
        const blob = await canvasToBlob(canvas, "image/png");
        panel.innerHTML = `<h2>PNG ready — ${canvas.width} × ${canvas.height}</h2>
          ${metricsHtml([["SVG size", `${number.format(svg.width)} × ${number.format(svg.height)}`], ["PNG file", fmtBytes(blob.size)]])}
          <div style="margin:1rem 0;padding:1rem;border:1px solid var(--line);border-radius:8px;background-image:conic-gradient(#2a3542 25%,#1d2632 0 50%,#2a3542 0 75%,#1d2632 0)"><img id="png-preview" alt="PNG preview" style="display:block;max-width:100%"></div>
          <div class="actions"><button id="download-png" class="button primary" type="button">Download PNG</button></div>
          <p class="notice">Transparency is preserved — the checkerboard is just the preview background.</p>`;
        panel.hidden = false;
        panel.querySelector("#png-preview").src = URL.createObjectURL(blob);
        panel.querySelector("#download-png").onclick = () => download(blob, "image.png", "image/png");
      } catch (error) {
        showError(panel, error.message || "This SVG could not be converted.");
      }
    };
    root.querySelector("#favicons").onclick = async () => {
      const panel = root.querySelector("#result");
      try {
        const raw = await getSvgText();
        if (!raw) return showError(panel, "Choose an SVG file or paste SVG code first.");
        const svg = svgDimensions(raw);
        if (!svg) return showError(panel, "That doesn't look like valid SVG markup.");
        const img = await svgToImage(svg.text);
        const sizes = [16, 32, 48, 180, 192, 512];
        const names = { 180: "apple-touch-icon.png" };
        const results = [];
        let grid = "";
        for (const size of sizes) {
          const canvas = makeCanvas(size, size);
          const ctx = canvas.getContext("2d");
          const scale = Math.min(size / svg.width, size / svg.height);
          const w = svg.width * scale, h = svg.height * scale;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          const blob = await canvasToBlob(canvas, "image/png");
          results.push({ blob, filename: names[size] || `favicon-${size}x${size}.png` });
          grid += `<div class="tool-card"><img src="${canvas.toDataURL("image/png")}" width="${Math.min(size, 64)}" height="${Math.min(size, 64)}" alt="${size}px favicon" style="image-rendering:auto"><p>${esc(results.at(-1).filename)}<br>${size} × ${size} · ${fmtBytes(blob.size)}</p><button class="button" data-dl="${results.length - 1}" type="button">Download</button></div>`;
        }
        const snippet = `<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">\n<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">`;
        panel.innerHTML = `<h2>Favicon set — 6 sizes</h2><div class="tool-grid">${grid}</div>
          <div class="actions"><button id="download-all" class="button primary" type="button">Download all 6 files</button></div>
          <h2 style="font-size:1.05rem;margin-top:1.4rem">Paste into your &lt;head&gt;</h2>
          <div class="field"><textarea rows="4" readonly>${esc(snippet)}</textarea></div>`;
        panel.hidden = false;
        wireDownloads(panel, results);
      } catch (error) {
        showError(panel, error.message || "This SVG could not be converted.");
      }
    };
  }

  // ---------- 10. EXIF viewer & remover ----------
  function renderExifTool() {
    root.innerHTML = `
      ${fileInput(false, "image/*,.heic,.heif,.tiff,.tif", "Choose a photo")}
      <div class="actions"><button id="inspect" class="button primary" type="button">Show hidden metadata</button></div>
      ${resultPanel()}`;
    root.querySelector("#inspect").onclick = async () => {
      const panel = root.querySelector("#result");
      const file = root.querySelector("#file-input").files[0];
      if (!file) return showError(panel, "Choose a photo first.");
      panel.hidden = false; panel.innerHTML = "<h2>Reading metadata…</h2>";
      try { await lib("exifr"); } catch { return showError(panel, LIB_FAIL); }
      let data = null;
      try { data = await exifr.parse(file, { tiff: true, exif: true, gps: true, ifd0: true, xmp: false }); } catch { /* fall through — treated as no metadata */ }
      const format = (value) => value instanceof Date ? value.toLocaleString() : Array.isArray(value) ? value.join(", ") : typeof value === "number" ? number.format(value) : String(value);
      const gps = data && typeof data.latitude === "number" && typeof data.longitude === "number"
        ? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}` : "";
      const highlights = [];
      if (data) {
        if (data.Make || data.Model) highlights.push(["Camera", [data.Make, data.Model].filter(Boolean).join(" ")]);
        if (data.LensModel) highlights.push(["Lens", data.LensModel]);
        if (data.DateTimeOriginal) highlights.push(["Taken", format(data.DateTimeOriginal)]);
        if (data.FNumber) highlights.push(["Aperture", `f/${data.FNumber}`]);
        if (data.ExposureTime) highlights.push(["Shutter", data.ExposureTime >= 1 ? `${data.ExposureTime}s` : `1/${Math.round(1 / data.ExposureTime)}s`]);
        if (data.ISO) highlights.push(["ISO", String(data.ISO)]);
        if (data.FocalLength) highlights.push(["Focal length", `${data.FocalLength} mm`]);
        if (data.Software) highlights.push(["Software", data.Software]);
      }
      highlights.push(["GPS location", gps || "None found"]);
      const skipKeys = new Set(["latitude", "longitude", "MakerNote", "UserComment", "ApplicationNotes"]);
      const tableRows = data ? Object.entries(data)
        .filter(([key, value]) => !skipKeys.has(key) && value != null && typeof value !== "object" || value instanceof Date)
        .map(([key, value]) => `<tr><td>${esc(key)}</td><td>${esc(format(value)).slice(0, 200)}</td></tr>`).join("") : "";
      panel.innerHTML = `<h2>${data ? "Metadata found in this photo" : "No readable metadata found"}</h2>
        ${gps ? `<p class="notice"><strong>This photo contains GPS coordinates (${esc(gps)}).</strong> Anyone you send the original to can see where it was taken. Download the clean copy below to remove them.</p>` : ""}
        ${metricsHtml(highlights)}
        ${tableRows ? `<details style="margin-top:1rem"><summary style="cursor:pointer">All ${tableRows.split("<tr>").length - 1} readable tags</summary><div class="table-wrap"><table><thead><tr><th>Tag</th><th>Value</th></tr></thead><tbody>${tableRows}</tbody></table></div></details>` : ""}
        <h2 style="font-size:1.05rem;margin-top:1.4rem">Download a clean copy</h2>
        <p>Re-encodes the pixels into a brand-new file with no metadata at all — no camera info, no timestamps, no GPS.</p>
        <div class="form-grid">${formatSelect("clean-format")}</div>
        <div class="actions"><button id="clean" class="button primary" type="button">Create clean copy</button></div>
        <div id="clean-out"></div>`;
      panel.querySelector("#clean").onclick = async () => {
        const out = panel.querySelector("#clean-out");
        out.innerHTML = "<p>Re-encoding…</p>";
        try {
          const img = await decodeImageFile(file);
          const type = panel.querySelector("#clean-format").value;
          const canvas = drawToCanvas(img, imgW(img), imgH(img), { fill: needsFill(type) ? "#ffffff" : "" });
          const blob = await canvasToBlob(canvas, type, 0.95);
          out.innerHTML = `${metricsHtml([["Original", fmtBytes(file.size)], ["Clean copy", fmtBytes(blob.size)]])}
            <div class="actions"><button id="download-clean" class="button primary" type="button">Download clean image</button></div>
            <p class="notice">Re-encoding removes everything, including copyright fields and the color profile, and (for JPG/WebP) re-compresses the pixels slightly.</p>`;
          out.querySelector("#download-clean").onclick = () => download(blob, `${baseName(file)}-clean.${extFor(blob.type)}`);
        } catch (error) {
          out.innerHTML = `<p class="error">${esc(error.message || "This image could not be re-encoded.")}</p>`;
        }
      };
    };
  }

  // ---------- 11. audio converter & trimmer ----------
  function encodeWav(channels, sampleRate) {
    const channelCount = channels.length;
    const length = channels[0].length;
    const buffer = new ArrayBuffer(44 + length * channelCount * 2);
    const view = new DataView(buffer);
    const writeString = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    writeString(0, "RIFF"); view.setUint32(4, 36 + length * channelCount * 2, true); writeString(8, "WAVE");
    writeString(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channelCount * 2, true); view.setUint16(32, channelCount * 2, true); view.setUint16(34, 16, true);
    writeString(36, "data"); view.setUint32(40, length * channelCount * 2, true);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channelCount; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  const toInt16 = (float32) => {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32[i]));
      out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return out;
  };

  function encodeMp3(channels, sampleRate, kbps) {
    const channelCount = Math.min(2, channels.length);
    const encoder = new lamejs.Mp3Encoder(channelCount, sampleRate, kbps);
    const left = toInt16(channels[0]);
    const right = channelCount === 2 ? toInt16(channels[1]) : null;
    const chunks = [];
    const blockSize = 1152;
    for (let i = 0; i < left.length; i += blockSize) {
      const leftChunk = left.subarray(i, i + blockSize);
      const encoded = channelCount === 2
        ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + blockSize))
        : encoder.encodeBuffer(leftChunk);
      if (encoded.length) chunks.push(encoded);
    }
    const flushed = encoder.flush();
    if (flushed.length) chunks.push(flushed);
    return new Blob(chunks, { type: "audio/mpeg" });
  }

  function renderAudioConverter() {
    root.innerHTML = `
      ${fileInput(false, "audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac", "Choose an audio file")}
      <div id="audio-info"></div>
      <div class="form-grid" style="margin-top:1rem">
        ${numberHtml("trim-start", "Start at (seconds)", "0", "", 'min="0"')}
        ${numberHtml("trim-end", "End at (seconds)", "", "Leave blank to keep everything to the end.", 'min="0" placeholder="end of file"')}
        ${selectHtml("out-format", "Output format", [["mp3", "MP3 — small, plays everywhere"], ["wav", "WAV — lossless, much larger"]])}
        ${selectHtml("bitrate", "MP3 quality", [["128", "128 kbps — good"], ["192", "192 kbps — better"], ["320", "320 kbps — best"]])}
      </div>
      <div class="actions"><button id="convert-audio" class="button primary" type="button">Convert audio</button></div>
      ${resultPanel()}`;
    let decoded = null, decodedName = "";
    const info = root.querySelector("#audio-info");
    root.querySelector("#file-input").onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      info.innerHTML = "<p class=\"notice\">Decoding audio…</p>";
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const context = new AudioCtx();
        decoded = await context.decodeAudioData(await file.arrayBuffer());
        decodedName = baseName(file);
        context.close();
        info.innerHTML = `<p class="notice">Loaded: ${esc(file.name)} — ${number.format(decoded.duration)}s, ${decoded.numberOfChannels === 1 ? "mono" : "stereo"}, ${number.format(decoded.sampleRate)} Hz, ${fmtBytes(file.size)}</p>`;
        root.querySelector("#trim-end").placeholder = `${decoded.duration.toFixed(1)}`;
      } catch {
        decoded = null;
        info.innerHTML = "<p class=\"error\">Your browser could not decode this file. MP3, WAV, M4A, and OGG support varies by browser; FLAC is not supported everywhere.</p>";
      }
    };
    root.querySelector("#convert-audio").onclick = async () => {
      const panel = root.querySelector("#result");
      if (!decoded) return showError(panel, "Choose an audio file and wait for it to decode first.");
      const start = Math.max(0, num(root.querySelector("#trim-start").value));
      const endRaw = root.querySelector("#trim-end").value;
      const end = endRaw === "" ? decoded.duration : Math.min(decoded.duration, num(endRaw));
      if (end - start < 0.05) return showError(panel, "The end time must be after the start time.");
      panel.hidden = false; panel.innerHTML = "<h2>Encoding…</h2><p>Long files can take a little while.</p>";
      await delay(30); // let the progress message paint before the encode blocks the thread
      try {
        const from = Math.floor(start * decoded.sampleRate);
        const to = Math.floor(end * decoded.sampleRate);
        const channels = [];
        for (let channel = 0; channel < Math.min(2, decoded.numberOfChannels); channel++) {
          channels.push(decoded.getChannelData(channel).slice(from, to));
        }
        const format = root.querySelector("#out-format").value;
        let blob, filename;
        if (format === "wav") {
          blob = encodeWav(channels, decoded.sampleRate);
          filename = `${decodedName}.wav`;
        } else {
          try { await lib("lamejs"); } catch { return showError(panel, LIB_FAIL); }
          blob = encodeMp3(channels, decoded.sampleRate, num(root.querySelector("#bitrate").value) || 192);
          filename = `${decodedName}.mp3`;
        }
        panel.innerHTML = `<h2>Audio ready</h2>
          ${metricsHtml([["Length", `${number.format(end - start)}s`], ["Format", format.toUpperCase()], ["File size", fmtBytes(blob.size)]])}
          <audio controls style="width:100%;margin:.6rem 0"></audio>
          <div class="actions"><button id="download-audio" class="button primary" type="button">Download ${format.toUpperCase()}</button></div>`;
        panel.querySelector("audio").src = URL.createObjectURL(blob);
        panel.querySelector("#download-audio").onclick = () => download(blob, filename);
      } catch {
        showError(panel, "Encoding failed. Very long recordings can run out of memory — try trimming to a shorter section.");
      }
    };
  }

  // ---------- 12. CSV to Excel ----------
  const parseCSV = (text, delimiter = ",") => {
    const rows = [];
    let row = [], cell = "", quoted = false;
    const source = String(text).replace(/^﻿/, "");
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (quoted) {
        if (char === '"' && source[i + 1] === '"') { cell += '"'; i++; }
        else if (char === '"') quoted = false;
        else cell += char;
      } else if (char === '"') quoted = true;
      else if (char === delimiter) { row.push(cell); cell = ""; }
      else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
      else cell += char;
    }
    if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
    return rows;
  };
  const detectDelimiter = (text) => {
    const sample = String(text).split(/\r?\n/, 1)[0];
    return [[",", sample.split(",").length], ["\t", sample.split("\t").length], [";", sample.split(";").length], ["|", sample.split("|").length]].sort((a, b) => b[1] - a[1])[0][0];
  };

  function renderCsvToExcel() {
    root.innerHTML = `
      ${fileInput(true, ".csv,.txt,.tsv,text/csv,text/plain", "Choose one or more CSV files")}
      <p class="notice">Each CSV becomes its own worksheet in a single Excel workbook. Comma, tab, semicolon, and pipe delimiters are detected automatically.</p>
      <div class="form-grid">${selectHtml("numbers", "Cell values", [["detect", "Convert numeric text to real numbers"], ["text", "Keep everything as text (protects ZIP codes, IDs)"]])}</div>
      <div class="actions"><button id="make-xlsx" class="button primary" type="button">Create Excel workbook</button></div>
      ${resultPanel()}`;
    root.querySelector("#make-xlsx").onclick = async () => {
      const panel = root.querySelector("#result");
      const files = [...root.querySelector("#file-input").files];
      if (!files.length) return showError(panel, "Choose at least one CSV file first.");
      panel.hidden = false; panel.innerHTML = "<h2>Converting…</h2>";
      try { await lib("xlsx"); } catch { return showError(panel, LIB_FAIL); }
      try {
        const detectNumbers = root.querySelector("#numbers").value === "detect";
        const workbook = XLSX.utils.book_new();
        const used = new Set();
        let totalRows = 0;
        for (const file of files) {
          const text = await file.text();
          let rows = parseCSV(text, detectDelimiter(text));
          if (detectNumbers) {
            rows = rows.map((row) => row.map((cell) => {
              const trimmed = String(cell).trim();
              return /^-?\d+(\.\d+)?$/.test(trimmed) && trimmed.length < 15 && !/^0\d/.test(trimmed) ? Number(trimmed) : cell;
            }));
          }
          totalRows += Math.max(0, rows.length - 1);
          let sheetName = baseName(file).replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28) || "Sheet";
          let suffix = 1;
          while (used.has(sheetName)) sheetName = `${sheetName.slice(0, 25)}~${++suffix}`;
          used.add(sheetName);
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName);
        }
        const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const filename = files.length === 1 ? `${baseName(files[0])}.xlsx` : "workbook.xlsx";
        panel.innerHTML = `<h2>Excel workbook ready</h2>
          ${metricsHtml([["Worksheets", String(files.length)], ["Data rows", number.format(totalRows)], ["File size", fmtBytes(blob.size)]])}
          <div class="actions"><button id="download-xlsx" class="button primary" type="button">Download .xlsx</button></div>`;
        panel.querySelector("#download-xlsx").onclick = () => download(blob, filename);
      } catch {
        showError(panel, "These files could not be converted. Check that they are plain CSV or text files.");
      }
    };
  }

  // ---------- dispatch ----------
  const renderers = {
    "image-format-converter": renderImageFormatConverter,
    "image-compressor": renderImageCompressor,
    "image-resizer": renderImageResizer,
    "images-to-pdf": renderImagesToPdf,
    "pdf-merge-split": renderPdfMergeSplit,
    "pdf-to-images": renderPdfToImages,
    "pdf-word-text-extractor": renderTextExtractor,
    "markdown-html-converter": renderMarkdownConverter,
    "svg-to-png-converter": renderSvgToPng,
    "exif-viewer-remover": renderExifTool,
    "audio-converter": renderAudioConverter,
    "csv-to-excel-converter": renderCsvToExcel
  };
  if (renderers[slug]) renderers[slug]();
  else root.innerHTML = `<p class="error">This tool could not be loaded.</p>`;
})();
