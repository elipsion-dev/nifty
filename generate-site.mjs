import fs from "node:fs";
import path from "node:path";

const SITE_NAME = "Nifty Utilities";
const SITE_URL = "https://niftyutilities.com";
const SUPPORT_EMAIL = "support@niftyutilities.com";
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const mailtoLink = `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`;
const toolSupportNote = `<p class="support-note">Problem with this tool or suggestions for improvement? Please email ${mailtoLink}.</p>`;
const pageSupportNote = `<p class="support-note">Spotted a problem or have a suggestion for improvement? Please email ${mailtoLink}.</p>`;

// Analytics & advertising config. Both are OFF until you fill these in and rerun
// `node generate-site.mjs`. While blank, no tracking/ads code is emitted and the
// privacy policy keeps its "no analytics or advertising" wording.
//   GA4_MEASUREMENT_ID:   from analytics.google.com → Admin → Data streams (e.g. "G-XXXXXXXXXX")
//   ADSENSE_PUBLISHER_ID: from adsense.google.com after approval (e.g. "ca-pub-1234567890123456")
const GA4_MEASUREMENT_ID = "G-FMSJ4HRY7L";
const ADSENSE_PUBLISHER_ID = "";

// Google Analytics 4 with Consent Mode v2: every storage type is denied by default.
// A Google-certified consent platform (e.g. AdSense "Privacy & messaging") grants
// consent at runtime; until then GA runs in cookieless, no-storage mode.
const analyticsTags = GA4_MEASUREMENT_ID ? `
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });
  </script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
  <script>
    gtag('js', new Date());
    gtag('config', '${GA4_MEASUREMENT_ID}');
  </script>` : "";

// Google AdSense Auto ads loader. Emits nothing until a publisher ID is set.
const adsTags = ADSENSE_PUBLISHER_ID ? `
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}" crossorigin="anonymous"></script>` : "";

const headTags = `${analyticsTags}${adsTags}`;
const analyticsEnabled = Boolean(GA4_MEASUREMENT_ID || ADSENSE_PUBLISHER_ID);

// Privacy-policy wording follows the actual deployed state. With both IDs blank it
// keeps the original "no analytics or advertising" promise; once either is set it
// discloses the Google services, cookies, and consent controls those require.
const enabledServices = [
  GA4_MEASUREMENT_ID ? "Google Analytics 4 to measure site traffic" : null,
  ADSENSE_PUBLISHER_ID ? "Google AdSense to display advertising" : null
].filter(Boolean);
const servicesSentence = enabledServices.length === 2
  ? `${enabledServices[0]} and ${enabledServices[1]}`
  : enabledServices[0];

const privacyAnalyticsSection = analyticsEnabled
  ? `<h2>Analytics and advertising</h2><p>${SITE_NAME} uses ${servicesSentence}. ${enabledServices.length > 1 ? "These Google services" : "This Google service"} may set cookies and process technical data such as your IP address, device type, and the pages you view in order to produce aggregate statistics${ADSENSE_PUBLISHER_ID ? " and to select and measure advertising" : ""}.</p><p>This code runs only as you browse pages. It never receives the files or information you enter into a tool; that processing stays inside your browser as described above, and we never send tool inputs to ${ADSENSE_PUBLISHER_ID ? "an advertising or analytics provider" : "an analytics provider"}.</p><p>Cookies and any personalization are denied by default through Google Consent Mode. Where the law requires it, a Google-certified consent message asks for your choice before cookies are set, and you can change that choice at any time through the same control.</p>`
  : `<h2>Future analytics and advertising</h2><p>${SITE_NAME} currently has no analytics or advertising code. Before either is enabled, this policy and the site interface must be updated to identify the provider, explain what it collects, and provide any legally required consent controls. Advertising or analytics must never receive the contents of files or information entered into a tool.</p>`;

const categories = [
  {
    slug: "finance",
    name: "Finance / CSV",
    description: "Clean statements, inspect spending, and plan debt without uploading financial data.",
    tools: [
      ["bank-statement-cleaner", "Bank Statement Cleaner", "Standardize dates, amounts, descriptions, and blank rows in statement CSVs."],
      ["recurring-subscription-finder", "Recurring Subscription Finder", "Find merchants and charges that appear on a repeating schedule."],
      ["merchant-name-normalizer", "Merchant Name Normalizer", "Turn noisy transaction descriptions into consistent merchant names."],
      ["personal-spending-categorizer", "Personal Spending Categorizer", "Assign common spending categories using editable keyword rules."],
      ["duplicate-transaction-finder", "Duplicate Transaction Finder", "Flag transactions with matching dates, amounts, and descriptions."],
      ["csv-bank-format-converter", "CSV Bank Format Converter", "Map statement columns into a simple date, description, amount format."],
      ["credit-card-statement-analyzer", "Credit Card Statement Analyzer", "Summarize charges by category and merchant from a CSV statement."],
      ["debt-snowball-calculator", "Debt Snowball Calculator", "Estimate a payoff schedule using smallest-balance-first payments."],
      ["debt-avalanche-calculator", "Debt Avalanche Calculator", "Estimate a payoff schedule using highest-interest-first payments."],
      ["net-worth-tracker", "Net Worth Tracker", "Track assets and liabilities locally in this browser."]
    ]
  },
  {
    slug: "spreadsheet",
    name: "Spreadsheet / Data",
    description: "Repair, reshape, compare, and convert everyday data files.",
    tools: [
      ["merge-csv-files", "Merge CSV Files", "Combine multiple CSV files that share the same columns."],
      ["split-csv-files", "Split CSV Files", "Break a large CSV into smaller files by row count."],
      ["remove-duplicate-rows", "Remove Duplicate Rows", "Remove repeated rows using all columns or selected columns."],
      ["compare-two-csvs", "Compare Two CSVs", "Find rows that were added, removed, or kept between two files."],
      ["excel-to-csv-cleaner", "Excel to CSV Cleaner", "Convert an Excel sheet to clean CSV in your browser."],
      ["column-mapper", "Column Mapper", "Rename and reorder columns into a target schema."],
      ["csv-formula-generator", "CSV Formula Generator", "Build spreadsheet formulas from a plain-English recipe."],
      ["spreadsheet-error-finder", "Spreadsheet Error Finder", "Scan CSV data for blanks, inconsistent widths, and suspicious values."],
      ["delimiter-converter", "Delimiter Converter", "Convert comma, tab, semicolon, or pipe-delimited data."],
      ["json-csv-converter", "JSON ↔ CSV Converter", "Convert arrays of JSON objects to CSV and CSV back to JSON."]
    ]
  },
  {
    slug: "documents",
    name: "Documents",
    description: "Create practical records and printable forms from straightforward inputs.",
    tools: [
      ["bill-of-sale-generator", "Bill of Sale Generator", "Create a printable general-purpose bill of sale."],
      ["rent-receipt-generator", "Rent Receipt Generator", "Create a clean receipt for a rent payment."],
      ["mileage-log-generator", "Mileage Log Generator", "Build and export a mileage log for business trips."],
      ["equipment-inventory-generator", "Equipment Inventory Generator", "Record equipment, serial numbers, locations, and values."],
      ["invoice-number-generator", "Invoice Number Generator", "Generate sequential, dated, or random invoice numbers."],
      ["business-asset-register", "Business Asset Register", "Create a downloadable register of business assets."],
      ["home-inventory-generator", "Home Inventory Generator", "Catalog household belongings and estimated replacement values."],
      ["estate-inventory-worksheet", "Estate Inventory Worksheet", "Organize estate assets, debts, accounts, and notes."],
      ["affidavit-generator", "Affidavit Generator", "Draft a basic affidavit worksheet for review and notarization."],
      ["printable-receipt-generator", "Printable Receipt Generator", "Create a simple printable receipt for a payment or sale."]
    ]
  },
  {
    slug: "homeowner",
    name: "Homeowner / Life",
    description: "Estimate major ownership, housing, travel, and shared-living costs.",
    tools: [
      ["rent-vs-buy-calculator", "Rent vs Buy Calculator", "Compare estimated monthly and long-term renting and buying costs."],
      ["lease-vs-buy-calculator", "Lease vs Buy Calculator", "Compare the estimated net cost of leasing and buying a vehicle."],
      ["real-cost-of-owning-a-pool", "Real Cost of Owning a Pool", "Estimate annual pool chemicals, energy, service, and repair costs."],
      ["real-cost-of-owning-a-boat", "Real Cost of Owning a Boat", "Estimate financing, fuel, storage, insurance, and maintenance."],
      ["real-cost-of-owning-an-rv", "Real Cost of Owning an RV", "Estimate financing, campsites, fuel, storage, and maintenance."],
      ["moving-cost-estimator", "Moving Cost Estimator", "Estimate truck, movers, mileage, supplies, lodging, and other costs."],
      ["roommate-expense-splitter", "Roommate Expense Splitter", "Split shared expenses evenly or by custom percentages."],
      ["home-maintenance-budget-calculator", "Home Maintenance Budget Calculator", "Build an annual maintenance reserve from home value, age, and systems."],
      ["property-tax-estimator", "Property Tax Estimator", "Estimate annual and monthly property tax from assessed value and rate."],
      ["vacation-budget-planner", "Vacation Budget Planner", "Plan transportation, lodging, food, activities, and contingency spending."]
    ]
  },
  {
    slug: "business",
    name: "Business",
    description: "Model pricing, profitability, labor, sales, and customer economics.",
    tools: [
      ["lead-value-calculator", "Lead Value Calculator", "Estimate the expected revenue and profit value of each lead."],
      ["customer-lifetime-value-calculator", "Customer Lifetime Value Calculator", "Estimate customer value using revenue, margin, churn, and acquisition cost."],
      ["cost-of-missed-calls-calculator", "Cost of Missed Calls Calculator", "Estimate revenue lost when customer calls go unanswered."],
      ["cost-of-employee-turnover-calculator", "Cost of Employee Turnover Calculator", "Estimate recruiting, vacancy, training, and productivity costs."],
      ["hourly-rate-calculator", "Hourly Rate Calculator", "Turn income goals and business costs into a sustainable hourly rate."],
      ["profit-margin-calculator", "Profit Margin Calculator", "Calculate gross profit, margin, markup, and target sale price."],
      ["break-even-calculator", "Break-Even Calculator", "Find the units and revenue needed to cover fixed costs."],
      ["job-cost-calculator", "Job Cost Calculator", "Calculate labor, materials, overhead, markup, and job price."],
      ["service-pricing-calculator", "Service Pricing Calculator", "Price a service from time, costs, overhead, and desired margin."],
      ["sales-commission-calculator", "Sales Commission Calculator", "Calculate tiered or flat sales commissions."]
    ]
  },
  {
    slug: "useful",
    name: "Weirdly Useful",
    description: "Small browser utilities for images, filenames, codes, and awkward one-off jobs.",
    tools: [
      ["screenshot-to-csv", "Screenshot to CSV", "Extract text from a screenshot and arrange detected lines as CSV."],
      ["screenshot-table-extractor", "Screenshot Table Extractor", "Use in-browser OCR to turn a table image into editable rows."],
      ["image-dimensions-inspector", "Image Dimensions Inspector", "Inspect pixel size, aspect ratio, file type, and file size."],
      ["bulk-file-renamer", "Bulk File Renamer", "Preview cleaned, numbered filenames and download renamed copies."],
      ["filename-cleaner", "Filename Cleaner", "Remove clutter, normalize spacing, and standardize filename casing."],
      ["duplicate-photo-detector", "Duplicate Photo Detector", "Find exact duplicate images using local file hashes."],
      ["qr-batch-generator", "QR Batch Generator", "Generate multiple downloadable QR codes from lines of text."],
      ["barcode-generator", "Barcode Generator", "Generate a printable CODE128 barcode in the browser."],
      ["upc-validator", "UPC Validator", "Validate UPC-A check digits or calculate a missing check digit."],
      ["vin-decoder", "VIN Decoder", "Validate a VIN and decode its year and basic structure locally."]
    ]
  }
];

const allTools = categories.flatMap((category) =>
  category.tools.map(([slug, name, description]) => ({
    slug,
    name,
    description,
    category: category.slug,
    categoryName: category.name
  }))
);

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const header = (prefix = "") => `
  <header class="site-header">
    <a class="brand" href="${prefix}index.html" aria-label="${SITE_NAME} home">
      <img src="${prefix}assets/brand/nifty-utilities-logo-512.png" width="512" height="256" alt="${SITE_NAME}">
    </a>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" class="site-nav" aria-label="Main navigation">
      ${categories.map((category) => `<a href="${prefix}${category.slug}/index.html">${escapeHtml(category.name.replace(" / CSV", "").replace(" / Data", ""))}</a>`).join("")}
    </nav>
  </header>`;

const footer = (prefix = "") => `
  <footer class="site-footer">
    <div><strong>${SITE_NAME}</strong><br><span>No backend. No database. Your tool data stays on your device.</span></div>
    <div class="footer-links"><a href="${prefix}privacy.html">Privacy</a><a href="${prefix}about.html">About</a><a href="mailto:${SUPPORT_EMAIL}">Support</a></div>
  </footer>`;

const page = ({ title, description, body, pathname, prefix = "", scripts = "", pageType = "WebPage", extraSchema = [], indexable = true }) => {
  const canonical = `${SITE_URL}${pathname}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/assets/icons/icon-512x512.png`,
          width: 512,
          height: 512
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: "Free browser-based tools for finance, CSV files, documents, home decisions, business math, images, and everyday tasks.",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US"
      },
      {
        "@type": pageType,
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
        dateModified: BUILD_DATE
      },
      ...extraSchema
    ]
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${indexable ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow"}">
  <meta name="theme-color" content="#0085ff">
  <meta name="application-name" content="${SITE_NAME}">
  <meta name="apple-mobile-web-app-title" content="${SITE_NAME}">
  <meta name="msapplication-config" content="${prefix}browserconfig.xml">
  <meta name="msapplication-TileColor" content="#0085ff">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)} | ${SITE_NAME}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/assets/brand/nifty-utilities-social-card.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${SITE_NAME} toolbox logo">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | ${SITE_NAME}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}/assets/brand/nifty-utilities-social-card.png">
  <title>${escapeHtml(title)} | ${SITE_NAME}</title>
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en-US" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="icon" href="${prefix}favicon.ico" sizes="any">
  <link rel="icon" href="${prefix}assets/icons/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="${prefix}assets/icons/favicon-16x16.png" type="image/png" sizes="16x16">
  <link rel="apple-touch-icon" href="${prefix}assets/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="mask-icon" href="${prefix}assets/icons/safari-pinned-tab.svg" color="#0085ff">
  <link rel="manifest" href="${prefix}site.webmanifest">
  <link rel="stylesheet" href="${prefix}assets/styles.css">
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>${headTags}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="page-shell">
    ${header(prefix)}
    ${body}
    ${footer(prefix)}
  </div>
  <script src="${prefix}assets/site.js" defer></script>
  ${scripts}
</body>
</html>`;
};

const toolCards = (tools, prefix = "../") => tools.map(([slug, name, description]) => `
  <a class="tool-card" href="${prefix}${slug}.html">
    <span class="tool-arrow" aria-hidden="true">↗</span>
    <h3>${escapeHtml(name)}</h3>
    <p>${escapeHtml(description)}</p>
  </a>`).join("");

fs.mkdirSync("assets", { recursive: true });

const homeBody = `
<main id="main">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Free browser-based utilities</p>
      <h1>Get the small job done.</h1>
      <p class="hero-lede">Clean a bank statement, compare a purchase, generate a receipt, or fix a spreadsheet. No account. No upload queue.</p>
      <label class="search-box">
        <span class="sr-only">Search all tools</span>
        <input id="tool-search" type="search" placeholder="Search ${allTools.length} tools…" autocomplete="off">
        <kbd>/</kbd>
      </label>
    </div>
    <aside class="privacy-note">
      <span class="status-light"></span>
      <strong>We cannot capture your tool data</strong>
      <p>This is a static site with no backend, database, accounts, or submission endpoint. Files and entries are processed on your device and never sent to us.</p>
    </aside>
  </section>
  <div class="ad-slot ad-slot-wide" aria-label="Advertisement placeholder">Advertisement</div>
  <section class="directory" aria-labelledby="directory-title">
    <div class="section-heading">
      <div><p class="eyebrow">Tool directory</p><h2 id="directory-title">Browse by category</h2></div>
      <p id="search-status">${allTools.length} tools, zero sign-ups</p>
    </div>
    <div id="search-results" class="search-results" hidden></div>
    <div id="category-list" class="category-list">
      ${categories.map((category) => `
        <section class="category-block">
          <div class="category-heading">
            <div><h2>${escapeHtml(category.name)}</h2><p>${escapeHtml(category.description)}</p></div>
            <a href="${category.slug}/index.html">View all ${category.tools.length}</a>
          </div>
          <div class="tool-grid">${toolCards(category.tools.slice(0, 4), `${category.slug}/`)}</div>
        </section>`).join("")}
    </div>
    ${pageSupportNote}
  </section>
</main>`;

fs.writeFileSync("index.html", page({
  title: `${allTools.length} Free Online Tools`,
  description: "Free online tools for CSV files, personal finance, documents, home costs, business, images, and more. No sign-up; data stays in your browser.",
  pathname: "/",
  pageType: "CollectionPage",
  body: homeBody,
  scripts: `<script>window.PLAINTOOLS=${JSON.stringify(allTools)};</script>`
}));

for (const category of categories) {
  fs.mkdirSync(category.slug, { recursive: true });
  fs.writeFileSync(path.join(category.slug, "index.html"), page({
    title: `Free ${category.name} Tools`,
    description: `Browse ${category.tools.length} free ${category.name.toLowerCase()} tools. ${category.description} No sign-up required.`,
    pathname: `/${category.slug}/`,
    pageType: "CollectionPage",
    prefix: "../",
    body: `
      <main id="main">
        <section class="category-hero">
          <p class="breadcrumbs"><a href="../index.html">All tools</a><span>/</span>${escapeHtml(category.name)}</p>
          <p class="eyebrow">${category.tools.length} free tools</p>
          <h1>${escapeHtml(category.name)}</h1>
          <p>${escapeHtml(category.description)}</p>
        </section>
        <div class="ad-slot ad-slot-wide" aria-label="Advertisement placeholder">Advertisement</div>
        <section class="directory compact-directory">
          <div class="tool-grid">${toolCards(category.tools, "")}</div>
        </section>
      </main>`
  }));

  for (const [slug, name, description] of category.tools) {
    fs.writeFileSync(path.join(category.slug, `${slug}.html`), page({
      title: `Free ${name}`,
      description: `Free online ${name.toLowerCase()}. ${description} No sign-up; processing stays in your browser.`,
      pathname: `/${category.slug}/${slug}.html`,
      prefix: "../",
      extraSchema: [
        {
          "@type": "WebApplication",
          "@id": `${SITE_URL}/${category.slug}/${slug}.html#application`,
          name,
          description,
          url: `${SITE_URL}/${category.slug}/${slug}.html`,
          applicationCategory: category.name,
          operatingSystem: "Any",
          browserRequirements: "Requires a modern web browser with JavaScript enabled.",
          isAccessibleForFree: true,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          },
          publisher: { "@id": `${SITE_URL}/#organization` }
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "All tools", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/${category.slug}/` },
            { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/${category.slug}/${slug}.html` }
          ]
        }
      ],
      body: `
        <main id="main">
          <div class="tool-layout">
            <article class="tool-page">
              <p class="breadcrumbs"><a href="../index.html">All tools</a><span>/</span><a href="index.html">${escapeHtml(category.name)}</a></p>
              <header class="tool-title">
                <p class="eyebrow">${escapeHtml(category.name)}</p>
                <h1>${escapeHtml(name)}</h1>
                <p>${escapeHtml(description)}</p>
                <div class="local-badge"><span class="status-light"></span>No data sent or stored</div>
              </header>
              <section id="tool-root" class="tool-workspace" data-tool="${slug}">
                <div class="loading-state">Loading tool…</div>
              </section>
              <section class="tool-help">
                <div class="privacy-callout">
                  <h2>Your data never reaches us</h2>
                  <p>${SITE_NAME} has no backend server, database, user accounts, or endpoint capable of receiving your tool inputs. Files and entries are processed inside your browser. We cannot view, capture, or store them.</p>
                </div>
                <h2>About this ${escapeHtml(name).toLowerCase()}</h2>
                <p>${escapeHtml(description)} Use it free without creating an account or uploading data to ${SITE_NAME}.</p>
                <h2>How it works</h2>
                <p>Enter or select your information, review the result, then download or print it when available. Inputs remain on this device. The Net Worth Tracker can save entries only in your own browser's local storage.</p>
                <h2>Important</h2>
                <p>This tool provides estimates and general-purpose documents, not financial, tax, legal, or professional advice. Verify important results before relying on them.</p>
                <h2>Support</h2>
                ${toolSupportNote}
              </section>
            </article>
            <aside class="tool-sidebar">
              <div class="ad-slot ad-slot-tall" aria-label="Advertisement placeholder">Advertisement</div>
              <div class="sidebar-card"><strong>Nothing is sent to us</strong><p>This static site has no server endpoint or database capable of receiving your files or entries.</p></div>
            </aside>
          </div>
        </main>`,
      scripts: `<script src="../assets/tool.js" defer></script>`
    }));
  }
}

fs.writeFileSync("privacy.html", page({
  title: "Privacy",
  description: `${SITE_NAME} privacy information and local browser processing policy.`,
  pathname: "/privacy.html",
  body: `<main id="main" class="prose-page"><p class="eyebrow">${SITE_NAME}</p><h1>Your tool data never reaches us.</h1><p>${SITE_NAME} is a static website. It has no application backend, database, user accounts, upload service, or form submission endpoint. There is no ${SITE_NAME} system capable of receiving, viewing, capturing, or storing the files and information you enter into these tools.</p><p>Calculations and file processing happen inside your web browser on your device. Your inputs are not transmitted to ${SITE_NAME}.</p><h2>Local storage</h2><p>The Net Worth Tracker can save information in your browser's local storage so it remains available on that device. That information still does not leave your browser. You can remove it with the tool's clear button or your browser settings.</p><h2>Downloaded libraries</h2><p>A few advanced tools download software libraries from a public content delivery network. The libraries run in your browser; ${SITE_NAME} does not send your tool inputs or files to those providers.</p>${privacyAnalyticsSection}</main>`
}));

fs.writeFileSync("about.html", page({
  title: "About",
  description: `About ${SITE_NAME}, a free collection of private browser-based utilities.`,
  pathname: "/about.html",
  body: `<main id="main" class="prose-page"><p class="eyebrow">About ${SITE_NAME}</p><h1>Small tools, clear answers.</h1><p>${SITE_NAME} is a collection of practical utilities for files, finances, documents, home decisions, and business math. The site is static, fast, and built to work without an account.</p><p>Results are estimates. Check important calculations and documents with a qualified professional.</p><h2>Support</h2><p>Found a problem with a tool or have a suggestion for improvement? Please email ${mailtoLink}.</p></main>`
}));

fs.writeFileSync("404.html", page({
  title: "Page not found",
  description: "The requested page could not be found.",
  pathname: "/404.html",
  indexable: false,
  body: `<main id="main" class="prose-page"><p class="eyebrow">404</p><h1>That tool is not here.</h1><p>Return to the directory to find the tool you need.</p><p><a class="button primary" href="index.html">Browse all tools</a></p></main>`
}));

const publicPaths = [
  "",
  "about.html",
  "privacy.html",
  ...categories.flatMap((category) => [
    `${category.slug}/`,
    ...category.tools.map(([slug]) => `${category.slug}/${slug}.html`)
  ])
];

fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map((url) => `  <url><loc>${SITE_URL}/${url}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join("\n")}\n</urlset>\n`);

fs.writeFileSync("robots.txt", `User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);

fs.writeFileSync("site.webmanifest", JSON.stringify({
  name: SITE_NAME,
  short_name: "Nifty",
  description: "Free private browser-based utilities for files, finances, documents, business, and everyday tasks.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#f7fafc",
  theme_color: "#0085ff",
  categories: ["utilities", "productivity", "finance", "business"],
  icons: [
    { src: "/assets/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/assets/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/assets/icons/maskable-icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/assets/icons/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2));

fs.writeFileSync("browserconfig.xml", `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/assets/icons/mstile-70x70.png"/>
      <square150x150logo src="/assets/icons/mstile-150x150.png"/>
      <wide310x150logo src="/assets/icons/mstile-310x150.png"/>
      <square310x310logo src="/assets/icons/mstile-310x310.png"/>
      <TileColor>#0085ff</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`);

const llmsSections = categories.map((category) => `## ${category.name}

${category.description}

${category.tools.map(([slug, name, description]) => `- [${name}](${SITE_URL}/${category.slug}/${slug}.html): ${description}`).join("\n")}`).join("\n\n");

fs.writeFileSync("llms.txt", `# ${SITE_NAME}

> ${SITE_NAME} provides free browser-based utilities for CSV and spreadsheet data, personal finance, documents, home and life decisions, business calculations, images, filenames, barcodes, and other everyday tasks.

The site is static and requires no account. Tool inputs are processed locally in the visitor's browser and are not sent to or stored by ${SITE_NAME}. Each tool has a permanent, crawlable URL and a concise explanation of its purpose.

## Main pages

- [All tools](${SITE_URL}/): Search and browse the complete tool directory.
- [About](${SITE_URL}/about.html): Site purpose and operating model.
- [Privacy](${SITE_URL}/privacy.html): Local-processing and no-data-storage policy.

${llmsSections}
`);

fs.writeFileSync("llms-full.txt", `# ${SITE_NAME}: Complete Tool Directory

${SITE_NAME} is a free collection of ${allTools.length} practical web utilities. No account is required. The website has no application backend, upload endpoint, or database capable of receiving tool inputs. Processing happens in the visitor's browser.

${llmsSections}

## Usage notes

- Financial calculations are estimates and are not financial or tax advice.
- Generated forms are general-purpose drafts and are not legal advice.
- Uploaded files remain in the browser and are not transmitted to ${SITE_NAME}.
- The Net Worth Tracker may save information only in the visitor's own browser local storage.
`);

fs.writeFileSync("CNAME", "niftyutilities.com\n");
fs.writeFileSync(".nojekyll", "");

// AdSense requires an ads.txt at the domain root declaring authorized sellers.
// The publisher line is generated only once a real publisher ID is configured.
if (ADSENSE_PUBLISHER_ID) {
  const pubId = ADSENSE_PUBLISHER_ID.replace(/^ca-/, "");
  fs.writeFileSync("ads.txt", `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
}

console.log(`Generated ${allTools.length} tool pages across ${categories.length} categories.`);
