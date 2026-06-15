# Nifty Utilities

A dependency-free static utility site for [niftyutilities.com](https://niftyutilities.com), built for GitHub Pages.

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

Brand derivatives are generated from the transparent masters in `assets/brand/`:

```sh
uv run --with pillow python3 scripts/generate-brand-assets.py
```

The site has no application backend or database. Tool inputs are processed in the browser. Review and update `privacy.html` before adding analytics or advertising.
