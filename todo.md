# Nifty Utilities — Tool Build Tracker

Working agreement (set 2026-06-15):
- **Not pushing live until AdSense review is done.** Quality over volume; thin
  near-duplicate pages are the exact "mass-produced" signal we must avoid.
- Build **3–5 tools per batch**. Each new tool's rich article is written by a
  **Sonnet agent** against a tight brief; **Opus reviews** each batch and owns the
  shared-file edits (tool registration in `generate-site.mjs`, calculator logic in
  `assets/tool.js`) so parallel agents never collide.
- **Differentiation strategy** (what actually beats Google duplicate-content flags,
  in order): unique substantive copy (~90%) > varied layout + unique hero media >
  visual styling (~0 for dedup; we still vary accent color/headings for brand/UX).
- Hero images: **hand-coded inline SVG + emoji** (free, offline, privacy-safe).
- Every assigned tool is **deduped against the live sitemap** before building.

## Framework (Opus — prerequisite for safe parallel agents)  ✅ DONE (batch 1)
- [x] `content/<slug>.html` loader merged into generator. Reads optional first-line
      `<!--meta {json}-->` (keys: hero {type:"emoji",value | type:"svg",id},
      heroPosition "top"|"bottom", accent "#hex", layout "feature"). Optional
      `<!--more-->` marker splits article: before = intro ABOVE tool, after = deep
      dive BELOW. Files populate the same toolContent map; one file per tool = zero
      agent collisions. Loader THROWS on bad meta JSON (build fails loudly).
- [x] Layout variation via hero position + intro split + per-tool accent + layout
      class. `heroSvgs` ids available: house, paw, wheel, document, calendar, coins.
- [x] CSS for hero/intro/accent in `assets/styles.css` (color-mix accent tint +
      @supports fallback).
- [x] Verification approach proven: regenerate, per-page hero/word/FAQ counts,
      pairwise 4-gram Jaccard similarity (<0.10 = distinct), browser check that
      calc emits output + hero renders + DOM order correct.

## Existing-page differentiation passes (make the 63 not look templated)
- [x] Boat page: hero ⛵ at top (inline toolMeta).
- [x] RV page: hero 🚐 BELOW the tool (inline toolMeta).
- [x] Seeded inline heroes/accents: pool, property-tax-estimator,
      property-tax-appeal-estimator, receipt-warranty-tracker,
      screenshot-measurement-calculator.
- [ ] Sweep REMAINING existing pages, vary layout/hero/copy where thin (later).

---

## HOW TO RUN A BATCH (proven in batch 1)
Per batch of 3–5 tools:
1. **Opus, shared files (do these yourself — agents must NOT touch them):**
   - `assets/tool.js`: add each tool's calculator. Ownership tools reuse
     `ownershipCalculator("label",[["id","Annual label",default],...])` or
     `financedOwnershipCalculator(...)`. Bureaucracy tools need a custom
     `{fields:[...], calculate(v){... return {metrics:[[label,val]...], note}}}`
     entry in the `calculators` object (date math — review carefully).
   - `generate-site.mjs`: add `[slug,"Name","desc"]` to the right category's `tools`
     array. (For the new "Government & Deadlines" category, add the whole category
     block to `categories` + create `<slug>/` dir — first bureaucracy batch only.)
2. **Spawn one Sonnet agent per tool** (general-purpose, model sonnet), each writes
   ONLY `content/<slug>.html`. Give each: exact file path, the meta format, the
   `<!--more-->` rule, its assigned hero/heroPosition/accent/layout (vary these
   ACROSS siblings so pages differ structurally), the calculator's real input
   fields (article mirrors them), "no $ figures as fact", ~600–850 words, FAQ count,
   and "write only this one file, no other edits". heroSvgs ids: house, paw, wheel,
   document, calendar, coins (else emoji).
3. **Opus review/verify:** `node generate-site.mjs` (throws on bad meta JSON) →
   per-page checks (hero present, word count, h3 count) → pairwise 4-gram Jaccard
   (<~0.12 = distinct) → browser-check one page (calc emits output, hero renders,
   DOM order). Then update this file + report to user.
Note: build currently emits "Generated 77 tool pages across 6 categories."

## NEW TOOLS TO BUILD (deduped vs. current 63 — no overlaps)

### Ownership — Homeowner/Life  (reuses ownershipCalculator helpers; copy is the work)
- [x] real-cost-of-owning-a-horse          (BATCH 1 — done + verified)
- [ ] real-cost-of-owning-a-vacation-rental   (Airbnb property — needs CUSTOM calc:
      financing + operating costs MINUS rental income → net cost/profit. Not the
      plain ownershipCalculator helper.)
- [x] real-cost-of-owning-a-dog            (BATCH 1 — done + verified)
- [x] real-cost-of-owning-a-cat            (BATCH 1 — done + verified)
- [x] real-cost-of-owning-a-car            (BATCH 2 — done + verified; financedOwnershipCalculator
      now takes optional base-defaults arg so car shows $38k/6yr, boat/RV unchanged)
- [x] real-cost-of-owning-an-electric-car     (BATCH 4 — done + verified; lone financed; charging/tires/battery/EV-fee, diverged from car article)
- [x] real-cost-of-owning-a-motorcycle        (BATCH 3 — done + verified; lone financed tool;
      motorcycle-vs-car Jaccard = 0.024 after handing agent the frozen car article to diverge from)
- [x] real-cost-of-owning-a-hot-tub        (BATCH 1 — done + verified)
- [x] real-cost-of-owning-a-second-home       (BATCH 4 — done + verified; custom carrying-cost calc, personal-use framing, diverged from rental-property)
- [x] real-cost-of-owning-a-rental-property   (BATCH 3 — done + verified; custom cash-flow calc)
- [x] solar-panel-payback-calculator          (BATCH 3 — done + verified; custom payback calc)
- [x] real-cost-of-raising-backyard-chickens   (BATCH 2 — done + verified)
- [x] real-cost-of-owning-a-septic-system       (BATCH 2 — done + verified)
- [x] real-cost-of-lawn-care                    (BATCH 2 — done + verified)
- [x] real-cost-of-owning-a-jet-ski           (BATCH 4 — done + verified; ownershipCalculator, PWC trailer/impeller/flush themes, diverged from boat)
- [ ] real-cost-of-owning-a-classic-car

### Government & Deadlines — NEW category  (CUSTOM DATE MATH — Sonnet+ , Opus reviews)
- [ ] social-security-claiming-age-calculator
- [ ] medicare-enrollment-deadline-calculator
- [ ] rmd-calculator                          (required minimum distribution)
- [ ] real-id-deadline-checker
- [ ] passport-renewal-time-estimator
- [ ] passport-validity-travel-checker        (6-month rule)
- [ ] tax-refund-timing-estimator
- [ ] quarterly-estimated-tax-due-dates
- [ ] tax-extension-deadline-calculator
- [ ] fmla-eligibility-calculator
- [ ] cobra-election-deadline-calculator
- [ ] special-enrollment-period-calculator
- [ ] naturalization-residency-date-calculator
- [ ] green-card-renewal-timing-calculator
- [ ] i94-overstay-date-calculator
- [ ] statute-of-limitations-calculator
- [ ] small-claims-deadline-calculator

---

## DONE
- [x] property-tax-appeal-estimator (homeowner) — built + browser-verified
- [x] receipt-warranty-tracker (useful) — OCR → warranty calendar, built + verified
- [x] screenshot-measurement-calculator (useful) — canvas measure, built + verified

## CURRENT SITE (63 tools — do NOT rebuild)
- Finance/CSV (10): bank-statement-cleaner, recurring-subscription-finder,
  merchant-name-normalizer, personal-spending-categorizer, duplicate-transaction-finder,
  csv-bank-format-converter, credit-card-statement-analyzer, debt-snowball-calculator,
  debt-avalanche-calculator, net-worth-tracker
- Spreadsheet (10): merge-csv-files, split-csv-files, remove-duplicate-rows,
  compare-two-csvs, excel-to-csv-cleaner, column-mapper, csv-formula-generator,
  spreadsheet-error-finder, delimiter-converter, json-csv-converter
- Documents (10): bill-of-sale-generator, rent-receipt-generator, mileage-log-generator,
  equipment-inventory-generator, invoice-number-generator, business-asset-register,
  home-inventory-generator, estate-inventory-worksheet, affidavit-generator,
  printable-receipt-generator
- Homeowner (11): rent-vs-buy-calculator, lease-vs-buy-calculator,
  real-cost-of-owning-a-pool, real-cost-of-owning-a-boat, real-cost-of-owning-an-rv,
  moving-cost-estimator, roommate-expense-splitter, home-maintenance-budget-calculator,
  property-tax-estimator, property-tax-appeal-estimator, vacation-budget-planner
- Business (10): lead-value-calculator, customer-lifetime-value-calculator,
  cost-of-missed-calls-calculator, cost-of-employee-turnover-calculator,
  hourly-rate-calculator, profit-margin-calculator, break-even-calculator,
  job-cost-calculator, service-pricing-calculator, sales-commission-calculator
- Useful (12): screenshot-measurement-calculator, receipt-warranty-tracker,
  screenshot-to-csv, screenshot-table-extractor, image-dimensions-inspector,
  bulk-file-renamer, filename-cleaner, duplicate-photo-detector, qr-batch-generator,
  barcode-generator, upc-validator, vin-decoder
