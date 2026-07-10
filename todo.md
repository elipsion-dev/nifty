# To-do

## New utility suggestions (added 2026-07-08)

All of these run fully client-side, so they fit the site's "nothing leaves your
device" promise. Roughly ordered by expected search traffic within each group.
Same build process as before: register in `generate-site.mjs`, unique long-form
article per page, dedupe against the live sitemap.

### COMPLETE - Tier 1 — high-search interactive tests (same playbook as the IQ test)

The IQ test was added because tons of people search for it; these are the other
evergreen self-test searches, and each is easy to do genuinely well in a browser:

1. **Typing speed test (WPM)** — one of the highest-volume evergreen tool
   searches on the web. Original word lists, live WPM/accuracy, shareable
   scorecard. Pure JS, no libraries. Fits "Quizzes & You" or a new "Tests" shelf.
2. **Reaction time test** — click-when-green, average over 5 rounds, percentile
   table. Trivial to build, huge search volume, very sticky/shareable.
3. **Click speed test (CPS)** — 5/10/30-second modes. Massive with younger
   audiences; pairs naturally with reaction time.
4. **Memory test (number/pattern span)** — progressive sequence recall with a
   scorecard, same styling as the IQ test.
5. **Color blindness screening (Ishihara-style)** — generate original dot-plate
   SVGs at build time (avoid copying real Ishihara plates). Needs the same
   "screening, not diagnosis" disclaimer treatment as the IQ test.
6. **Love calculator / name compatibility** — pure fun, big search volume,
   zodiac-compatibility sibling; reuse the quiz result-card components.

### COMPLETE - Tier 2 — in-browser file conversion (explicitly wanted: "any conversion we can do in the browser")

Shipped 2026-07-10 as the new **Convert Files** category (12 tools, `assets/convert.js`,
one article fragment each). Notes: image converter/compressor/resizer handle HEIC via
heic2any; PDF tools use pdf-lib + pdf.js; DOCX via mammoth; MP3 via @breezystack/lamejs
(`dist/lamejs.iife.js` — the upstream lamejs npm build is broken); CSV→Excel via SheetJS.
Item 7 shipped as "PDF & Word Text Extractor" (word counts included); item 11 shipped
without video→GIF (deferred, as suggested). Also added the curated cross-category
"Pairs well with this tool" related-links system and collapsed the navbar into a single
Categories dropdown while landing this batch.

Original list, for reference:

1. **Image format converter** (HEIC/PNG/JPG/WebP/AVIF → PNG/JPG/WebP) —
   canvas handles PNG/JPG/WebP natively; HEIC needs `heic2any` (wasm, CDN).
   "HEIC to JPG" alone is a top-tier search since iPhones default to HEIC.
2. **Image compressor** — quality slider + before/after size, canvas re-encode.
   "compress image to 100kb" style searches are enormous.
3. **Image resizer / cropper** — resize to pixels/percent, social-media presets.
4. **Images → PDF** (`pdf-lib` or `jsPDF`) — "jpg to pdf" is one of the biggest
   conversion searches; fully local is a genuine differentiator vs. upload sites.
5. **PDF merge / split / reorder** (`pdf-lib`, works entirely client-side).
6. **PDF → images** (`pdf.js` renders pages to canvas → PNG downloads).
7. **Word count / PDF & DOCX text extractor** (`pdf.js` + `mammoth.js` for DOCX
   → clean text/markdown in browser).
8. **Markdown ↔ HTML converter** with live preview (`marked` or hand-rolled).
9. **SVG → PNG converter** (draw to canvas at chosen scale; favicon sizes too —
   could double as a **favicon generator**, itself a decent search term).
10. **EXIF viewer & remover** — show photo metadata (GPS!) and strip it via
    canvas re-encode. Strong privacy story that matches the site's brand.
11. **Audio converter / trimmer** (WAV↔MP3 via `lamejs`, trim via WebAudio) —
    medium effort; **video → GIF** via `ffmpeg.wasm` is possible but heavy
    (~25 MB wasm) — defer unless traffic justifies it.
12. **CSV → Excel (.xlsx)** via `SheetJS` — complements the existing
    Excel → CSV cleaner (currently one-directional).

### Tier 3 — high-volume everyday calculators (cheap to build, huge queries)

1. **Age calculator** ("how old am I / age between dates") — giant search term.
2. **Date calculator** — days between dates, add/subtract days, business days.
3. **Percentage calculator** — % of, % change, X is what % of Y. Enormous volume.
4. **Tip calculator** with bill splitting.
5. **BMI calculator** — needs a "not medical advice" disclaimer like the quizzes.
6. **GPA calculator** (weighted/unweighted).
7. **Loan / mortgage payment calculator** with amortization table — high CPC,
   fits Finance category; careful to stay "estimate, not advice."
8. **Salary ↔ hourly converter** ("$25 an hour is how much a year").
9. **Pregnancy due date calculator** — very high volume; disclaimer treatment.
10. **Time zone meeting planner** — compare 2–3 zones side by side.

### Tier 4 — text & generator utilities (small, good internal-mesh filler)

- **Word/character counter** (with reading-time estimate), **case converter**,
  **text diff/compare** (pairs with Compare Two CSVs), **password generator**,
  **random picker / wheel spinner**, **UUID generator**, **hash generator**
  (MD5/SHA via WebCrypto), **JSON formatter/validator** (pairs with the JSON↔CSV
  converter), **lorem ipsum generator**, **signature drawer** (canvas → PNG,
  pairs with the document generators), **countdown timer / stopwatch / pomodoro**.

### Site chores (not new tools)

- The quizzes hub description on the homepage still says "self-assessments…no
  email" — fine, but once Tier 1 tests land, consider renaming the category
  "Quizzes & Tests" so typing/reaction tests fit.
- `content/` fragments: remember every new tool needs its article fragment and
  is auto-blocked from crawlers by robots.txt — no action, just the checklist.
- After any tool batch: rerun `node generate-site.mjs` (tool counts, sitemap,
  llms.txt all update automatically) and request indexing in GSC.
