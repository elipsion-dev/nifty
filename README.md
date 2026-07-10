# Nifty Utilities

A dependency-free static utility site for [niftyutilities.com](https://niftyutilities.com), built for GitHub Pages. 107 browser-only tools across 9 categories (Finance/CSV, Spreadsheet/Data, Convert Files, Documents, Homeowner/Life, Business, Government & Deadlines, Weirdly Useful, Quizzes & Tests).

## How the site is put together

- `generate-site.mjs` is the single source of truth: the category/tool manifest, page templates, SEO titles, schema markup, the sitemap, `llms.txt`, and the cross-category "Pairs well with this tool" links (the `crossLinks` map — list a related pair once and both pages link each other; unknown slugs fail the build).
- `content/<slug>.html` holds each tool's long-form article plus an optional `<!--meta-->` JSON block (accent color, title tag, meta description, disclaimer, and which script runs the tool). These fragments are blocked from crawlers via `robots.txt`; only the generated pages are indexable.
- Tool logic lives in three per-page scripts dispatched by the `data-tool` slug: `assets/tool.js` (calculators, CSV/document tools), `assets/quiz.js` (quizzes and tests), and `assets/convert.js` (file converters — images, PDF, audio, Markdown, Excel). Heavy libraries (pdf-lib, pdf.js, SheetJS, heic2any, mammoth, exifr, lamejs) load on demand from pinned jsDelivr URLs; everything executes client-side.

After changing the manifest or content fragments, rerun the generator — tool counts, category pages, sitemap, and `llms.txt` all update automatically.

## Publish with GitHub Pages

1. Create a GitHub repository and push this folder to its default branch.
2. In the repository, open **Settings → Pages**.
3. Set the source to **Deploy from a branch**, select the default branch, and use `/ (root)`.
4. Configure the repository's custom domain as `niftyutilities.com`.

## Local preview

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Regenerate pages

Tool pages and category pages are generated from the manifest in `generate-site.mjs`:

```sh
node generate-site.mjs
```

Or build, commit, and push in one step:

```sh
./deploy.sh "commit message"
```

Brand derivatives are generated from the transparent masters in `assets/brand/`:

```sh
uv run --with pillow python3 scripts/generate-brand-assets.py
```

The site has no application backend or database. Tool inputs are processed in the browser. Review and update `privacy.html` before adding analytics or advertising.
