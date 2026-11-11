#!/usr/bin/env node
// Verifies the IQ test item banks in assets/quiz.js without a browser.
//
// Extracts the self-contained "IQ ITEM BANK" block (SVG builders + QUICK/FULL
// arrays), evaluates it, and checks structure, balance, uniqueness, and the
// numeric answer keys that can be re-derived from the prompts. Then computes
// the 3PL model's standard error for each version across the ability range —
// the "±N points" precision figures quoted on the page come from here.
//
// Usage:  node scripts/verify-iq-bank.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "assets", "quiz.js"), "utf8");
const start = src.indexOf("/* ---- IQ ITEM BANK START");
const end = src.indexOf("/* ---- IQ ITEM BANK END ---- */");
if (start < 0 || end < 0) throw new Error("IQ ITEM BANK markers not found in assets/quiz.js");
const { QUICK, FULL } = new Function(src.slice(start, end) + "\nreturn { QUICK, FULL };")();

let failures = 0;
const fail = (msg) => { failures += 1; console.error("  ✗ " + msg); };
const warn = (msg) => console.log("  ! " + msg);
const ok = (msg) => console.log("  ✓ " + msg);

/* ---------- structure ---------- */
const CATS = ["Numerical", "Verbal", "Logical", "Spatial"];
const check = (name, items, perCat) => {
  console.log(`\n${name} (${items.length} items)`);
  if (items.length !== perCat * 4) fail(`expected ${perCat * 4} items, got ${items.length}`);
  for (const c of CATS) {
    const n = items.filter((it) => it.cat === c).length;
    if (n !== perCat) fail(`${c}: expected ${perCat}, got ${n}`);
  }
  items.forEach((it, i) => {
    const id = `${name}#${i + 1} (${it.cat}, b=${it.b})`;
    if (!CATS.includes(it.cat)) fail(`${id}: unknown category`);
    if (typeof it.b !== "number" || it.b < -3 || it.b > 3) fail(`${id}: difficulty out of range`);
    if (!Array.isArray(it.options) || it.options.length !== 4) fail(`${id}: needs exactly 4 options`);
    if (!Number.isInteger(it.correct) || it.correct < 0 || it.correct > 3) fail(`${id}: bad correct index`);
    const keys = it.options.map((o) => o.t ?? o.svg);
    if (new Set(keys).size !== keys.length) fail(`${id}: duplicate options (two choices render identically)`);
    if (it.matrix && (it.matrix.length !== 9 || it.matrix[8] !== null)) fail(`${id}: matrix must be 9 cells with the last missing`);
    if (it.matrix && it.matrix.slice(0, 8).some((c) => !c)) fail(`${id}: matrix has an empty cell before the last`);
    if (it.seq && it.seq.some((c) => !c)) fail(`${id}: empty sequence cell`);
    if (!it.prompt) fail(`${id}: missing prompt`);
    // Figural matrices: flag when the key repeats a visible cell. Cyclic
    // patterns (row 3 restarts the cycle) do this legitimately, so it is a
    // warning, not a failure — but it should only ever happen on easy items.
    if (it.matrix) {
      const correctSvg = it.options[it.correct].svg;
      if (it.matrix.includes(correctSvg)) {
        if (it.b > 1) fail(`${id}: correct answer duplicates a visible matrix cell on a hard item`);
        else warn(`${id}: key repeats a visible cell (cyclic pattern; easy item, allowed)`);
      }
    }
  });
  const bs = items.map((it) => it.b).sort((a, b) => a - b);
  ok(`difficulty span ${bs[0]} … ${bs[bs.length - 1]}, median ${bs[Math.floor(bs.length / 2)]}`);
  for (const c of CATS) {
    const cb = items.filter((it) => it.cat === c).map((it) => it.b);
    const lo = Math.min(...cb), hi = Math.max(...cb);
    if (lo > -0.8 || hi < 1.2) fail(`${c}: difficulty range ${lo}…${hi} too narrow`);
  }
};
check("QUICK", QUICK, 5);
check("FULL", FULL, 15);

/* ---------- no overlap between versions ---------- */
console.log("\nOverlap");
const sig = (it) => it.prompt + "|" + it.options.map((o) => o.t ?? o.svg).join("|");
const quickSigs = new Set(QUICK.map(sig));
const dup = FULL.filter((it) => quickSigs.has(sig(it)));
if (dup.length) fail(`${dup.length} item(s) appear in both versions`); else ok("Quick and Full share no items");
const all = [...QUICK, ...FULL];
const textPrompts = all.filter((it) => !it.matrix && !it.seq && !it.promptSvg).map((it) => it.prompt + "|" + it.options.map((o) => o.t).join("|"));
if (new Set(textPrompts).size !== textPrompts.length) fail("duplicate text items across the banks"); else ok("all text items unique");

/* ---------- re-derive answer keys where a rule can be checked mechanically ---------- */
console.log("\nAnswer keys");
const seriesRules = {
  "2, 4, 8, 16": 32, "81, 27, 9, 3": 1, "1, 1, 2, 3, 5, 8": 13, "3, 5, 8, 10, 13, 15": 18,
  "7, 14, 12, 24, 22": 44, "2, 3, 6, 11, 18, 27": 38, "3, 4, 7, 11, 18, 29": 47, "2, 3, 5, 9, 17, 33": 65,
  "4, 9, 25, 49, 121": 169, "1, 4, 9, 16, 25": 36, "0, 1, 3, 6, 10, 15": 21, "100, 98, 94, 88, 80": 70,
  "2, 5, 10, 17, 26": 37, "1, 10, 3, 20, 9, 30, 27": 40, "3, 7, 16, 35, 74": 153, "1, 2, 6, 21, 88": 445
};
// independent derivations of each series answer
const derive = {
  "2, 4, 8, 16": 16 * 2, "81, 27, 9, 3": 3 / 3, "1, 1, 2, 3, 5, 8": 5 + 8, "3, 5, 8, 10, 13, 15": 15 + 3,
  "7, 14, 12, 24, 22": 22 * 2, "2, 3, 6, 11, 18, 27": 27 + 11, "3, 4, 7, 11, 18, 29": 18 + 29, "2, 3, 5, 9, 17, 33": 33 * 2 - 1,
  "4, 9, 25, 49, 121": 13 * 13, "1, 4, 9, 16, 25": 36, "0, 1, 3, 6, 10, 15": 15 + 6, "100, 98, 94, 88, 80": 80 - 10,
  "2, 5, 10, 17, 26": 6 * 6 + 1, "1, 10, 3, 20, 9, 30, 27": 30 + 10, "3, 7, 16, 35, 74": 74 * 2 + 5, "1, 2, 6, 21, 88": 88 * 5 + 5
};
let seriesChecked = 0;
for (const it of all) {
  const m = it.prompt.match(/series\?\s+([\d, ]+?), __$/);
  if (!m) continue;
  const key = m[1];
  if (!(key in seriesRules)) { fail(`no rule recorded for series "${key}"`); continue; }
  if (seriesRules[key] !== derive[key]) fail(`series "${key}": recorded ${seriesRules[key]} but derivation gives ${derive[key]}`);
  const chosen = Number(it.options[it.correct].t);
  if (chosen !== seriesRules[key]) fail(`series "${key}": marked answer ${chosen}, expected ${seriesRules[key]}`);
  seriesChecked += 1;
}
ok(`${seriesChecked} number series re-derived and matched`);
const missing = all.find((it) => /missing from the series/.test(it.prompt));
if (missing && Number(missing.options[missing.correct].t) !== 21) fail("missing-term series key wrong");
const table = all.find((it) => it.table);
if (table) {
  const rule = (a, b) => a * b + 1;
  const consistent = table.table.slice(0, 3).every(([a, b, c]) => rule(a, b) === c);
  const [a, b] = table.table[3];
  if (!consistent || Number(table.options[table.correct].t) !== rule(a, b)) fail("table item key wrong");
  else ok("table rule (a·b+1) consistent and key matches");
}
// Logical puzzles with a brute-force check.
const seat = all.find((it) => /row of five seats/.test(it.prompt));
if (seat) {
  const people = ["J", "K", "L", "M", "N"];
  const perms = [];
  const permute = (arr, m = []) => { if (!arr.length) perms.push(m); arr.forEach((x, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...m, x])); };
  permute(people);
  const pos = (p, x) => p.indexOf(x);
  const adj = (p, x, y) => Math.abs(pos(p, x) - pos(p, y)) === 1;
  const valid = perms.filter((p) => pos(p, "K") === 2 && adj(p, "J", "K") && (pos(p, "L") === 0 || pos(p, "L") === 4) && !adj(p, "L", "J") && !adj(p, "M", "K"));
  const neighbours = new Set(valid.map((p) => { const i = pos(p, "L"); return p[i === 0 ? 1 : 3]; }));
  if (neighbours.size !== 1 || !neighbours.has(seat.options[seat.correct].t)) fail(`seating puzzle: neighbours of L = ${[...neighbours]}`);
  else ok(`seating puzzle: ${valid.length} valid arrangements, L's neighbour is always ${[...neighbours][0]}`);
}
const coin = all.find((it) => /coin is in box/.test(it.prompt));
if (coin) {
  const sols = ["A", "B", "C"].filter((box) => [(box === "A"), (box !== "B")].filter(Boolean).length === 1);
  if (sols.length !== 1 || coin.options[coin.correct].t !== `Box ${sols[0]}`) fail(`coin puzzle: solutions ${sols}`);
  else ok(`coin puzzle: unique solution box ${sols[0]}`);
}
const knights = all.find((it) => /knights always tell the truth/.test(it.prompt));
if (knights) {
  // A says "at least one of us is a knave". Enumerate.
  const sols = [];
  for (const a of [true, false]) for (const b of [true, false]) {
    const claim = !a || !b;
    if (a === claim) sols.push(`A is a ${a ? "knight" : "knave"} and B is a ${b ? "knight" : "knave"}`);
  }
  if (sols.length !== 1 || knights.options[knights.correct].t !== sols[0]) fail(`knights puzzle: ${sols}`);
  else ok(`knights puzzle: ${sols[0]}`);
}
const liars = all.find((it) => /Ben is lying/.test(it.prompt));
if (liars) {
  const sols = [];
  for (const ann of [true, false]) for (const ben of [true, false]) {
    const annClaim = !ben, benClaim = ann && ben;
    if (ann === annClaim && ben === benClaim) sols.push(ann && ben ? "Both of them" : ann ? "Only Ann" : ben ? "Only Ben" : "Neither of them");
  }
  if (sols.length !== 1 || liars.options[liars.correct].t !== sols[0]) fail(`Ann/Ben puzzle: ${sols}`);
  else ok(`Ann/Ben puzzle: ${sols[0]}`);
}
const race = all.find((it) => /Five runners/.test(it.prompt));
if (race) {
  const perms = [];
  const permute = (arr, m = []) => { if (!arr.length) perms.push(m); arr.forEach((x, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...m, x])); };
  permute(["Anna", "Ben", "Carla", "Dan", "Erin"]);
  const i = (p, x) => p.indexOf(x);
  const valid = perms.filter((p) => i(p, "Anna") < i(p, "Ben") && i(p, "Anna") > i(p, "Carla") && i(p, "Dan") < i(p, "Anna") && i(p, "Dan") > i(p, "Carla") && i(p, "Erin") === 4);
  const thirds = new Set(valid.map((p) => p[2]));
  if (thirds.size !== 1 || !thirds.has(race.options[race.correct].t)) fail(`race puzzle: thirds ${[...thirds]}`);
  else ok(`race puzzle: third place is always ${[...thirds][0]}`);
}
const rowFriends = all.find((it) => /Four friends sit in a row/.test(it.prompt));
if (rowFriends) {
  const perms = [];
  const permute = (arr, m = []) => { if (!arr.length) perms.push(m); arr.forEach((x, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...m, x])); };
  permute(["Priya", "Noah", "Liam", "Ava"]);
  const i = (p, x) => p.indexOf(x);
  const valid = perms.filter((p) => i(p, "Priya") < i(p, "Noah") && i(p, "Noah") < i(p, "Liam") && i(p, "Ava") > i(p, "Liam"));
  const lefts = new Set(valid.map((p) => p[0]));
  if (lefts.size !== 1 || !lefts.has(rowFriends.options[rowFriends.correct].t)) fail(`friends row: ${[...lefts]}`);
  else ok(`friends row: far left is always ${[...lefts][0]}`);
}

/* ---------- figural keys: rotation vs mirror ---------- */
console.log("\nFigural keys");
const isMirror = (svg) => /matrix\(-1,0,0,1,90,0\)|matrix\(1,0,0,-1,0,90\)/.test(svg);
for (const it of all) {
  if (/SAME figure simply rotated/.test(it.prompt)) {
    const rotatedOnly = it.options.map((o) => !isMirror(o.svg));
    if (rotatedOnly.filter(Boolean).length !== 1 || !rotatedOnly[it.correct]) fail(`rotation item (b=${it.b}): exactly one un-mirrored option expected at the key`);
  }
  if (/Which one is a mirror image/.test(it.prompt)) {
    const mirrored = it.options.map((o) => isMirror(o.svg));
    if (mirrored.filter(Boolean).length !== 1 || !mirrored[it.correct]) fail(`odd-one-out mirror item: exactly one mirrored option expected at the key`);
  }
  if (/flipped left-to-right/.test(it.prompt)) {
    if (!/matrix\(-1,0,0,1,90,0\)/.test(it.options[it.correct].svg) || /rotate/.test(it.options[it.correct].svg)) fail("reflection item: key is not a pure left-right mirror");
  }
}
ok("rotation / mirror keys consistent");

// Segment-rule matrices: recompute the rule from rows 1–2 and apply to row 3.
const segsOf = (svg) => {
  const map = { "M20 45h50": "h", "M45 20v50": "v", "M24 24l42 42": "d", "M24 66l42-42": "u" };
  return new Set([...svg.matchAll(/d="([^"]+)"/g)].map((m) => map[m[1]]).filter(Boolean));
};
const setOps = {
  xor: (a, b) => new Set([...a, ...b].filter((x) => a.has(x) !== b.has(x))),
  and: (a, b) => new Set([...a].filter((x) => b.has(x))),
  minus: (a, b) => new Set([...a].filter((x) => !b.has(x))),
  union: (a, b) => new Set([...a, ...b])
};
const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
for (const it of all) {
  const isSeg = (svg) => /^<svg[^>]*>(<path d="(M20 45h50|M45 20v50|M24 24l42 42|M24 66l42-42)"\/>)+<\/svg>$/.test(svg);
  if (!it.matrix || !it.matrix.slice(0, 8).every(isSeg)) continue;
  const rows = [0, 1, 2].map((r) => it.matrix.slice(r * 3, r * 3 + 3).map((c) => (c ? segsOf(c) : null)));
  const fitting = Object.entries(setOps).filter(([, op]) => rows.slice(0, 2).every(([a, b, c]) => same(op(a, b), c)));
  if (fitting.length !== 1) { fail(`segment matrix (b=${it.b}): ${fitting.length} rules fit rows 1–2 (${fitting.map(([n]) => n)})`); continue; }
  const [name, op] = fitting[0];
  const expect = op(rows[2][0], rows[2][1]);
  const keyed = segsOf(it.options[it.correct].svg);
  if (!same(expect, keyed)) fail(`segment matrix (${name}, b=${it.b}): key does not match the rule`);
  else ok(`segment matrix rule "${name}" (b=${it.b}): unique and key matches`);
  const others = it.options.filter((_, i) => i !== it.correct).map((o) => segsOf(o.svg));
  if (others.some((s) => same(s, expect))) fail(`segment matrix (${name}): a distractor equals the key`);
}
const union = all.find((it) => it.seqOp === "+");
if (union) {
  const expect = setOps.union(segsOf(union.seq[0]), segsOf(union.seq[1]));
  if (!same(expect, segsOf(union.options[union.correct].svg))) fail("superposition key wrong"); else ok("superposition key matches union");
}

/* ---------- precision (3PL standard error; page quotes the θ = 0 figure) ---------- */
console.log("\nPrecision (3PL, c = 0.25, a = 1)");
const GUESS = 0.25;
const pAt = (theta, b) => GUESS + (1 - GUESS) / (1 + Math.exp(-(theta - b)));
const seAt = (items, theta) => {
  const info = items.reduce((s, it) => {
    const P = pAt(theta, it.b);
    const r = (P - GUESS) / (1 - GUESS);
    return s + ((1 - P) / P) * r * r;
  }, 0);
  return 1 / Math.sqrt(info);
};
const thetas = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const row = (name, items) => {
  const ses = thetas.map((t) => seAt(items, t));
  const mid = thetas.map((t, i) => (Math.abs(t) <= 1.5 ? ses[i] : null)).filter((x) => x !== null);
  const avg = mid.reduce((a, b) => a + b, 0) / mid.length;
  console.log(`  ${name.padEnd(6)} ` + thetas.map((t, i) => `θ=${String(t).padStart(4)}: ±${(15 * ses[i]).toFixed(1)}`).join("  "));
  console.log(`  ${name.padEnd(6)} average over θ∈[-1.5,1.5]: ±${(15 * avg).toFixed(1)} IQ points; at θ = 0: ±${(15 * seAt(items, 0)).toFixed(1)}`);
  return 15 * seAt(items, 0);
};
const q = row("QUICK", QUICK);
const f = row("FULL", FULL);
const quoted = { quick: Number((src.match(/key: "quick"[\s\S]*?precision: (\d+)/) || [])[1]), full: Number((src.match(/key: "full"[\s\S]*?precision: (\d+)/) || [])[1]) };
if (Math.round(q) !== quoted.quick) fail(`page quotes ±${quoted.quick} for Quick but model SE at θ=0 is ±${q.toFixed(1)}`);
if (Math.round(f) !== quoted.full) fail(`page quotes ±${quoted.full} for Full but model SE at θ=0 is ±${f.toFixed(1)}`);
if (!failures) ok(`quoted precision (±${quoted.quick} / ±${quoted.full}) matches the model`);

console.log(failures ? `\n${failures} problem(s) found.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
