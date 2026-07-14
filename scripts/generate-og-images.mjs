// Per-tool Open Graph images.
//
// Renders one share card per tool: the toolbox hero (assets/images/hero.png) as
// a full-bleed background with the tool's category, name, and description laid
// over the dark left side, matching the site's hero band. Cards are produced by
// screenshotting an HTML template with the copy of Chrome already installed on
// this machine (no npm dependency), then compressed to JPEG with `sips`.
//
// This is intentionally NOT part of generate-site.mjs — 117 Chrome launches are
// too slow for the normal build. Run it only when tools change or the hero
// image changes; the resulting assets/og/*.jpg are committed. generate-site.mjs
// references them and falls back to the generic social card if one is missing.
//
//   node scripts/generate-og-images.mjs          # all tools
//   node scripts/generate-og-images.mjs 3        # first 3 (quick smoke test)
//
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";

const ROOT = process.cwd();
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OG_DIR = path.join(ROOT, "assets", "og");
const HERO = path.join(ROOT, "assets", "images", "hero.png");
const LOGO = path.join(ROOT, "assets", "brand", "nifty-utilities-logo-512.png");
const CONCURRENCY = 6;
const JPEG_QUALITY = 82;

if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);
if (!fs.existsSync("tools.json")) throw new Error("tools.json missing — run `node generate-site.mjs` first.");
fs.mkdirSync(OG_DIR, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));

const limit = Number(process.argv[2]) || Infinity;
const tools = JSON.parse(fs.readFileSync("tools.json", "utf8")).tools.slice(0, limit);

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Shrink the title as it gets longer so it never overflows the card.
const titleSize = (name) => {
  const n = name.length;
  if (n <= 16) return 76;
  if (n <= 24) return 64;
  if (n <= 34) return 54;
  return 46;
};

const template = (tool) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1200px; height:630px; }
  .card { position:relative; width:1200px; height:630px; overflow:hidden;
    background:#0b121a url('file://${HERO}') right center / cover no-repeat;
    font-family:"Avenir Next",Avenir,"Segoe UI",sans-serif; }
  .card::before { content:""; position:absolute; inset:0;
    background:linear-gradient(90deg,#0b121a 34%,rgba(11,18,26,.85) 50%,rgba(11,18,26,0) 72%); }
  .inner { position:absolute; inset:0; padding:70px 72px; display:flex; flex-direction:column; }
  .logo img { height:52px; width:auto; }
  .body { margin-top:auto; max-width:660px; }
  .eyebrow { color:#2dd4bf; font-size:24px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
  h1 { color:#e6edf3; font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;
    font-size:${titleSize(tool.name)}px; line-height:1.04; margin:14px 0 20px; font-weight:700; }
  .desc { color:#93a4b3; font-size:28px; line-height:1.35; max-width:600px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tag { display:inline-flex; align-items:center; gap:10px; margin-top:26px; color:#3ecf8e; font-size:22px; font-weight:700; }
  .dot { width:12px; height:12px; border-radius:50%; background:#3ecf8e; box-shadow:0 0 0 6px rgba(62,207,142,.18); }
</style></head><body>
  <div class="card"><div class="inner">
    <div class="logo"><img src="file://${LOGO}" alt=""></div>
    <div class="body">
      <div class="eyebrow">${esc(tool.categoryName)}</div>
      <h1>${esc(tool.name)}</h1>
      <div class="desc">${esc(tool.description)}</div>
      <div class="tag"><span class="dot"></span>Runs in your browser — no upload, no sign-up</div>
    </div>
  </div></div>
</body></html>`;

const run = (cmd, args) => new Promise((resolve, reject) => {
  execFile(cmd, args, { maxBuffer: 1 << 24 }, (err) => err ? reject(err) : resolve());
});

async function renderOne(tool, i) {
  const htmlPath = path.join(tmpDir, `${tool.slug}.html`);
  const pngPath = path.join(tmpDir, `${tool.slug}.png`);
  const jpgPath = path.join(OG_DIR, `${tool.slug}.jpg`);
  fs.writeFileSync(htmlPath, template(tool));
  // No --user-data-dir: that flag triggers a fresh-profile init that hangs in
  // this environment. Omitting it lets Chrome auto-create a throwaway temp
  // profile per invocation, which also makes concurrent launches safe.
  await run(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--window-size=1200,630",
    `--screenshot=${pngPath}`, `file://${htmlPath}`
  ]);
  // Compress PNG -> JPEG with the macOS built-in image tool.
  await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", String(JPEG_QUALITY), pngPath, "--out", jpgPath]);
  fs.rmSync(pngPath, { force: true });
  fs.rmSync(htmlPath, { force: true });
  return jpgPath;
}

// Simple concurrency pool.
let done = 0;
const queue = tools.map((tool, i) => () => renderOne(tool, i).then(() => {
  done++;
  if (done % 10 === 0 || done === tools.length) console.log(`  ${done}/${tools.length}`);
}));
async function worker() { while (queue.length) await queue.shift()(); }

console.log(`Rendering ${tools.length} OG image(s) at concurrency ${CONCURRENCY}…`);
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tools.length) }, worker));
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`Done. Wrote ${tools.length} JPEG(s) to assets/og/`);
