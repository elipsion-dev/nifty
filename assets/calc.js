(() => {
  const root = document.querySelector("#tool-root");
  if (!root) return;
  const slug = root.dataset.tool;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const num = (value) => { const n = Number.parseFloat(value); return Number.isFinite(n) ? n : 0; };
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const money0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const pct = (value, digits = 2) => `${number.format(Math.round(value * 10 ** digits) / 10 ** digits)}%`;

  const DAY = 86400000;
  const parseDate = (value) => {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (d) => d instanceof Date && !Number.isNaN(d.getTime())
    ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(d) : "—";
  const fmtDateShort = (d) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }).format(d);
  const addUtc = (d, { years = 0, months = 0, days = 0 } = {}) => {
    const r = new Date(d.getTime());
    const day = r.getUTCDate();
    r.setUTCDate(1);
    r.setUTCFullYear(r.getUTCFullYear() + years);
    r.setUTCMonth(r.getUTCMonth() + months);
    const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
    r.setUTCDate(Math.min(day, last));
    r.setUTCDate(r.getUTCDate() + days);
    return r;
  };
  const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY);

  const fieldHtml = (f) => {
    const id = `field-${f.id}`;
    const full = f.full ? " full" : "";
    const help = f.help ? `<small>${esc(f.help)}</small>` : "";
    if (f.type === "select") {
      return `<div class="field${full}" data-field="${f.id}"><label for="${id}">${esc(f.label)}</label><select id="${id}" name="${f.id}">${f.options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(f.value) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>${help}</div>`;
    }
    const attrs = `${f.min !== undefined ? ` min="${f.min}"` : ""}${f.max !== undefined ? ` max="${f.max}"` : ""}${f.step ? ` step="${f.step}"` : (f.type === "number" || !f.type) ? ' step="any"' : ""}`;
    return `<div class="field${full}" data-field="${f.id}"><label for="${id}">${esc(f.label)}</label><input id="${id}" name="${f.id}" type="${f.type || "number"}" value="${esc(f.value ?? "")}" placeholder="${esc(f.placeholder || "")}"${attrs}>${help}</div>`;
  };
  const formHtml = (fields) => `<div class="form-grid">${fields.map(fieldHtml).join("")}</div>`;
  const metricsHtml = (items) => `<div class="metric-grid">${items.map(([l, v]) => `<div class="metric"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join("")}</div>`;
  const resultPanel = () => `<section id="result" class="result-panel" aria-live="polite" hidden></section>`;
  const val = (id) => { const el = root.querySelector(`#field-${id}`); return el ? el.value : ""; };
  const show = (html) => { const p = root.querySelector("#result"); p.innerHTML = html; p.hidden = false; };
  const download = (content, filename, type = "text/csv") => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  // Wire every input/select in the tool to a recompute function, then run once.
  const live = (compute) => {
    root.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", compute);
      el.addEventListener("change", compute);
    });
    compute();
  };
  const toggleFields = (ids, showSet) => ids.forEach((id) => {
    const el = root.querySelector(`[data-field="${id}"]`);
    if (el) el.style.display = showSet.has(id) ? "" : "none";
  });

  // ---------- age ----------
  function renderAge() {
    root.innerHTML = `${formHtml([
      { id: "dob", label: "Date of birth", type: "date", value: "1990-01-01" },
      { id: "as", label: "Age at this date", type: "date", value: todayIso() }
    ])}${resultPanel()}`;
    live(() => {
      const dob = parseDate(val("dob")), as = parseDate(val("as"));
      if (!dob || !as) return show(`<p class="error">Enter a valid date of birth and comparison date.</p>`);
      if (as < dob) return show(`<p class="error">The comparison date is before the date of birth.</p>`);
      let years = as.getUTCFullYear() - dob.getUTCFullYear();
      let months = as.getUTCMonth() - dob.getUTCMonth();
      let days = as.getUTCDate() - dob.getUTCDate();
      if (days < 0) { months--; days += new Date(Date.UTC(as.getUTCFullYear(), as.getUTCMonth(), 0)).getUTCDate(); }
      if (months < 0) { years--; months += 12; }
      const totalDays = daysBetween(dob, as);
      const totalMonths = years * 12 + months;
      let next = addUtc(dob, { years: years + 1 });
      // next birthday relative to "as" date
      let nb = new Date(Date.UTC(as.getUTCFullYear(), dob.getUTCMonth(), Math.min(dob.getUTCDate(), new Date(Date.UTC(as.getUTCFullYear(), dob.getUTCMonth() + 1, 0)).getUTCDate())));
      if (nb < as) nb = new Date(Date.UTC(as.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()));
      const toNext = daysBetween(as, nb);
      const bornWeekday = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(dob);
      show(`<h2>${years} years, ${months} month${months === 1 ? "" : "s"}, ${days} day${days === 1 ? "" : "s"}</h2>${metricsHtml([
        ["Total months", `${int.format(totalMonths)} months, ${days} days`],
        ["Total weeks", `${int.format(Math.floor(totalDays / 7))} weeks`],
        ["Total days", `${int.format(totalDays)} days`],
        ["Total hours", `${int.format(totalDays * 24)} hours`],
        ["Born on a", bornWeekday],
        [toNext === 0 ? "Next birthday" : "Days to next birthday", toNext === 0 ? "Today! 🎉" : `${int.format(toNext)} days (${fmtDateShort(nb)})`]
      ])}<p class="notice">Ages are counted in whole calendar years, months, and days between the two dates.</p>`);
    });
  }

  // ---------- date ----------
  function renderDate() {
    root.innerHTML = `${formHtml([
      { id: "mode", label: "What do you want to do?", type: "select", value: "between", options: [["between", "Days between two dates"], ["add", "Add or subtract from a date"], ["business", "Business days between two dates"]] },
      { id: "start", label: "Start date", type: "date", value: todayIso() },
      { id: "end", label: "End date", type: "date", value: todayIso() },
      { id: "incl", label: "Count", type: "select", value: "excl", options: [["excl", "Days in between (exclude end day)"], ["incl", "Include both start and end days"]] },
      { id: "amount", label: "Amount to add or subtract", type: "number", value: 30 },
      { id: "unit", label: "Unit", type: "select", value: "days", options: [["days", "Days"], ["weeks", "Weeks"], ["months", "Months"], ["years", "Years"]] },
      { id: "dir", label: "Direction", type: "select", value: "add", options: [["add", "Add (into the future)"], ["sub", "Subtract (into the past)"]] }
    ])}${resultPanel()}`;
    const compute = () => {
      const mode = val("mode");
      toggleFields(["start", "end", "incl", "amount", "unit", "dir"],
        new Set(mode === "add" ? ["start", "amount", "unit", "dir"] : ["start", "end", ...(mode === "between" ? ["incl"] : [])]));
      root.querySelector(`[data-field="start"] label`).textContent = mode === "add" ? "Starting date" : "Start date";
      const start = parseDate(val("start"));
      if (!start) return show(`<p class="error">Enter a valid starting date.</p>`);
      if (mode === "add") {
        const sign = val("dir") === "sub" ? -1 : 1;
        const amt = Math.round(num(val("amount"))) * sign;
        const unit = val("unit");
        const result = addUtc(start, { days: unit === "days" ? amt : unit === "weeks" ? amt * 7 : 0, months: unit === "months" ? amt : 0, years: unit === "years" ? amt : 0 });
        return show(`<h2>${fmtDate(result)}</h2>${metricsHtml([
          ["From", fmtDateShort(start)],
          ["Change", `${sign < 0 ? "−" : "+"}${int.format(Math.abs(Math.round(num(val("amount")))))} ${val("unit")}`],
          ["Result date", fmtDateShort(result)],
          ["Days from start", `${int.format(Math.abs(daysBetween(start, result)))} days`]
        ])}`);
      }
      const end = parseDate(val("end"));
      if (!end) return show(`<p class="error">Enter a valid end date.</p>`);
      const raw = daysBetween(start, end);
      if (mode === "between") {
        const inclusive = val("incl") === "incl";
        const count = Math.abs(raw) + (inclusive ? 1 : 0);
        return show(`<h2>${int.format(count)} day${count === 1 ? "" : "s"}</h2>${metricsHtml([
          ["From", fmtDateShort(start)],
          ["To", fmtDateShort(end)],
          ["Calendar days", `${int.format(count)} days`],
          ["Weeks", `${number.format(Math.round(Math.abs(raw) / 7 * 10) / 10)} weeks`]
        ])}<p class="notice">${inclusive ? "Both the start and end dates are counted." : "The end date itself is not counted."}</p>`);
      }
      // business days
      const [a, b] = raw >= 0 ? [start, end] : [end, start];
      const span = Math.abs(raw);
      if (span > 40000) return show(`<p class="error">Please choose dates within about 100 years of each other.</p>`);
      let bus = 0, sat = 0, sun = 0;
      for (let i = 0; i <= span; i++) {
        const d = new Date(a.getTime() + i * DAY).getUTCDay();
        if (d === 0) sun++; else if (d === 6) sat++; else bus++;
      }
      return show(`<h2>${int.format(bus)} business day${bus === 1 ? "" : "s"}</h2>${metricsHtml([
        ["From", fmtDateShort(a)],
        ["To", fmtDateShort(b)],
        ["Business days", int.format(bus)],
        ["Weekend days", int.format(sat + sun)]
      ])}<p class="notice">Counts weekdays inclusive of both endpoints. Public holidays are not removed — subtract those yourself.</p>`);
    };
    live(compute);
  }

  // ---------- percentage ----------
  function renderPercentage() {
    root.innerHTML = `${formHtml([
      { id: "mode", label: "Calculation", type: "select", value: "of", options: [["of", "What is X% of Y"], ["is", "X is what percent of Y"], ["change", "Percent change from X to Y"]] },
      { id: "a", label: "X", type: "number", value: 15 },
      { id: "b", label: "Y", type: "number", value: 200 }
    ])}${resultPanel()}`;
    const compute = () => {
      const mode = val("mode"), a = num(val("a")), b = num(val("b"));
      const la = root.querySelector(`[data-field="a"] label`), lb = root.querySelector(`[data-field="b"] label`);
      if (mode === "of") {
        la.textContent = "Percent (X%)"; lb.textContent = "Of value (Y)";
        return show(`<h2>${number.format(a / 100 * b)}</h2>${metricsHtml([[`${number.format(a)}% of ${number.format(b)}`, number.format(a / 100 * b)]])}<p class="notice">X% of Y = (X ÷ 100) × Y.</p>`);
      }
      if (mode === "is") {
        la.textContent = "Value (X)"; lb.textContent = "Total (Y)";
        if (b === 0) return show(`<p class="error">The total (Y) can't be zero.</p>`);
        return show(`<h2>${pct(a / b * 100)}</h2>${metricsHtml([[`${number.format(a)} is what % of ${number.format(b)}`, pct(a / b * 100)]])}<p class="notice">X is (X ÷ Y) × 100 percent of Y.</p>`);
      }
      la.textContent = "From (X)"; lb.textContent = "To (Y)";
      if (a === 0) return show(`<p class="error">The starting value (X) can't be zero for a percent change.</p>`);
      const change = (b - a) / Math.abs(a) * 100;
      return show(`<h2>${change >= 0 ? "+" : ""}${pct(change)}</h2>${metricsHtml([
        ["Direction", change > 0 ? "Increase" : change < 0 ? "Decrease" : "No change"],
        ["Absolute change", number.format(b - a)],
        ["Percent change", `${change >= 0 ? "+" : ""}${pct(change)}`]
      ])}<p class="notice">Percent change = (Y − X) ÷ |X| × 100.</p>`);
    };
    live(compute);
  }

  // ---------- tip ----------
  function renderTip() {
    root.innerHTML = `${formHtml([
      { id: "bill", label: "Bill amount ($)", type: "number", value: 60, min: 0 },
      { id: "tip", label: "Tip (%)", type: "number", value: 18, min: 0 },
      { id: "people", label: "Split between (people)", type: "number", value: 2, min: 1 },
      { id: "round", label: "Rounding", type: "select", value: "none", options: [["none", "No rounding"], ["total", "Round total up to the nearest dollar"], ["person", "Round each person up to the nearest dollar"]] }
    ])}${resultPanel()}`;
    live(() => {
      const bill = num(val("bill")), tipPct = num(val("tip")), people = Math.max(1, Math.floor(num(val("people"))));
      let tip = bill * tipPct / 100;
      let total = bill + tip;
      const round = val("round");
      if (round === "total") { total = Math.ceil(total); tip = total - bill; }
      let perPerson = total / people;
      if (round === "person") { perPerson = Math.ceil(perPerson); total = perPerson * people; tip = total - bill; }
      show(`<h2>${money.format(perPerson)} per person</h2>${metricsHtml([
        ["Tip amount", money.format(tip)],
        ["Total with tip", money.format(total)],
        ["Effective tip", bill > 0 ? pct(tip / bill * 100) : "—"],
        [`Each of ${people}`, money.format(perPerson)]
      ])}`);
    });
  }

  // ---------- BMI ----------
  function renderBmi() {
    root.innerHTML = `${formHtml([
      { id: "unit", label: "Units", type: "select", value: "imperial", options: [["imperial", "Feet / inches & pounds"], ["metric", "Centimeters & kilograms"]] },
      { id: "ft", label: "Height — feet", type: "number", value: 5, min: 0 },
      { id: "in", label: "Height — inches", type: "number", value: 9, min: 0 },
      { id: "lb", label: "Weight — pounds", type: "number", value: 160, min: 0 },
      { id: "cm", label: "Height — centimeters", type: "number", value: 175, min: 0 },
      { id: "kg", label: "Weight — kilograms", type: "number", value: 72, min: 0 }
    ])}${resultPanel()}`;
    live(() => {
      const metric = val("unit") === "metric";
      toggleFields(["ft", "in", "lb", "cm", "kg"], new Set(metric ? ["cm", "kg"] : ["ft", "in", "lb"]));
      let meters, kg;
      if (metric) { meters = num(val("cm")) / 100; kg = num(val("kg")); }
      else { meters = (num(val("ft")) * 12 + num(val("in"))) * 0.0254; kg = num(val("lb")) * 0.45359237; }
      if (meters <= 0 || kg <= 0) return show(`<p class="error">Enter a height and weight greater than zero.</p>`);
      const bmi = kg / (meters * meters);
      const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy weight" : bmi < 30 ? "Overweight" : "Obesity";
      // healthy weight range for this height
      const lo = 18.5 * meters * meters, hi = 24.9 * meters * meters;
      const range = metric ? `${number.format(lo)}–${number.format(hi)} kg` : `${number.format(lo / 0.45359237)}–${number.format(hi / 0.45359237)} lb`;
      show(`<h2>BMI ${number.format(Math.round(bmi * 10) / 10)} — ${cat}</h2>${metricsHtml([
        ["Body mass index", number.format(Math.round(bmi * 10) / 10)],
        ["Category", cat],
        ["Healthy range (BMI 18.5–24.9)", range]
      ])}<p class="notice">BMI is a rough screening number, not a diagnosis or a measure of body fat, fitness, or health. It does not account for muscle mass, frame, age, sex, or ethnicity. Talk to a clinician about what it means for you.</p>`);
    });
  }

  // ---------- GPA ----------
  const GRADES = [["4.0", "A / A+ (4.0)"], ["3.7", "A− (3.7)"], ["3.3", "B+ (3.3)"], ["3.0", "B (3.0)"], ["2.7", "B− (2.7)"], ["2.3", "C+ (2.3)"], ["2.0", "C (2.0)"], ["1.7", "C− (1.7)"], ["1.3", "D+ (1.3)"], ["1.0", "D (1.0)"], ["0.7", "D− (0.7)"], ["0.0", "F (0.0)"]];
  const LEVELS = [["0", "Regular"], ["0.5", "Honors (+0.5)"], ["1", "AP / IB (+1.0)"]];
  function renderGpa() {
    root.innerHTML = `
      <div id="gpa-rows"></div>
      <div class="actions"><button id="add-course" class="button" type="button">+ Add course</button></div>
      ${resultPanel()}`;
    const rowsBox = root.querySelector("#gpa-rows");
    let n = 0;
    const rowHtml = (i) => `<div class="gpa-row" data-row="${i}">
      <div class="field"><label for="g-name-${i}">Course ${i + 1} (optional)</label><input id="g-name-${i}" type="text" placeholder="e.g. Biology"></div>
      <div class="field"><label for="g-grade-${i}">Grade</label><select id="g-grade-${i}" class="g-grade">${GRADES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
      <div class="field"><label for="g-cred-${i}">Credits</label><input id="g-cred-${i}" class="g-cred" type="number" value="3" min="0" step="0.5"></div>
      <div class="field"><label for="g-lvl-${i}">Level</label><select id="g-lvl-${i}" class="g-lvl">${LEVELS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
      <div class="field"><button class="button g-remove" type="button" data-row="${i}" aria-label="Remove course">✕</button></div>
    </div>`;
    const compute = () => {
      let credits = 0, unweighted = 0, weighted = 0;
      rowsBox.querySelectorAll(".gpa-row").forEach((row) => {
        const g = num(row.querySelector(".g-grade").value);
        const c = num(row.querySelector(".g-cred").value);
        const lvl = num(row.querySelector(".g-lvl").value);
        if (c <= 0) return;
        credits += c;
        unweighted += g * c;
        weighted += Math.min(5, g + (g > 0 ? lvl : 0)) * c;
      });
      if (credits <= 0) return show(`<p class="error">Add at least one course with credits above zero.</p>`);
      show(`<h2>GPA ${number.format(Math.round(unweighted / credits * 1000) / 1000)}</h2>${metricsHtml([
        ["Unweighted GPA", number.format(Math.round(unweighted / credits * 1000) / 1000)],
        ["Weighted GPA", number.format(Math.round(weighted / credits * 1000) / 1000)],
        ["Total credits", number.format(credits)],
        ["Quality points", number.format(Math.round(unweighted * 100) / 100)]
      ])}<p class="notice">Unweighted uses a standard 4.0 letter scale. Weighted adds 0.5 for honors and 1.0 for AP/IB courses (capped at 5.0). Schools vary — confirm against your school's official scale.</p>`);
    };
    const wire = () => {
      rowsBox.querySelectorAll("input, select").forEach((el) => { el.oninput = compute; el.onchange = compute; });
      rowsBox.querySelectorAll(".g-remove").forEach((b) => b.onclick = () => {
        if (rowsBox.querySelectorAll(".gpa-row").length <= 1) return;
        b.closest(".gpa-row").remove(); compute();
      });
    };
    const addRow = () => { rowsBox.insertAdjacentHTML("beforeend", rowHtml(n++)); wire(); compute(); };
    root.querySelector("#add-course").onclick = addRow;
    for (let i = 0; i < 4; i++) addRow();
  }

  // ---------- loan / mortgage ----------
  function renderLoan() {
    root.innerHTML = `${formHtml([
      { id: "principal", label: "Loan amount ($)", type: "number", value: 300000, min: 0 },
      { id: "rate", label: "Annual interest rate (%)", type: "number", value: 6.5, min: 0, step: "0.01" },
      { id: "term", label: "Term (years)", type: "number", value: 30, min: 1 },
      { id: "extra", label: "Extra monthly payment ($)", type: "number", value: 0, min: 0, help: "Optional — applied to principal each month." }
    ])}${resultPanel()}`;
    let schedule = [];
    live(() => {
      const P = num(val("principal")), annual = num(val("rate")), years = Math.max(1, Math.round(num(val("term")))), extra = Math.max(0, num(val("extra")));
      if (P <= 0) return show(`<p class="error">Enter a loan amount greater than zero.</p>`);
      const r = annual / 100 / 12, n = years * 12;
      const base = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
      // amortize
      schedule = [];
      let bal = P, totalInterest = 0, month = 0;
      while (bal > 0.005 && month < n + 600) {
        month++;
        const interest = bal * r;
        let principalPaid = base - interest + extra;
        if (principalPaid > bal) principalPaid = bal;
        bal -= principalPaid;
        totalInterest += interest;
        schedule.push([month, base + extra > interest ? Math.min(base + extra, principalPaid + interest) : interest, principalPaid, interest, Math.max(0, bal)]);
      }
      const payoffMonths = schedule.length;
      const monthly = base + extra;
      const totalPaid = P + totalInterest;
      // yearly summary table
      const years2 = Math.ceil(payoffMonths / 12);
      let rows = "";
      for (let y = 1; y <= years2; y++) {
        const slice = schedule.slice((y - 1) * 12, y * 12);
        if (!slice.length) break;
        const prin = slice.reduce((s, r) => s + r[2], 0);
        const intr = slice.reduce((s, r) => s + r[3], 0);
        rows += `<tr><td>${y}</td><td>${money0.format(prin)}</td><td>${money0.format(intr)}</td><td>${money0.format(slice[slice.length - 1][4])}</td></tr>`;
      }
      show(`<h2>${money.format(monthly)} / month</h2>${metricsHtml([
        ["Monthly payment", money.format(monthly)],
        ["Total interest", money.format(totalInterest)],
        ["Total paid", money.format(totalPaid)],
        ["Payoff time", `${Math.floor(payoffMonths / 12)} yr ${payoffMonths % 12} mo`]
      ])}
      ${extra > 0 ? `<p class="notice">With ${money.format(extra)} extra each month you pay off ${int.format(n - payoffMonths)} month${n - payoffMonths === 1 ? "" : "s"} early.</p>` : ""}
      <h2 style="font-size:1.05rem;margin-top:1.4rem">Yearly breakdown</h2>
      <div class="table-wrap"><table><thead><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="actions"><button id="dl-amort" class="button" type="button">Download full monthly schedule (CSV)</button></div>
      <p class="notice">Estimate only. Excludes property tax, insurance, PMI, HOA, and fees. Confirm figures with your lender before relying on them.</p>`);
      root.querySelector("#dl-amort").onclick = () => {
        const csv = ["month,payment,principal,interest,balance", ...schedule.map((r) => `${r[0]},${(r[2] + r[3]).toFixed(2)},${r[2].toFixed(2)},${r[3].toFixed(2)},${r[4].toFixed(2)}`)].join("\n");
        download(csv, "amortization-schedule.csv");
      };
    });
  }

  // ---------- salary <-> hourly ----------
  function renderSalary() {
    root.innerHTML = `${formHtml([
      { id: "amount", label: "Amount ($)", type: "number", value: 25, min: 0 },
      { id: "per", label: "This amount is per", type: "select", value: "hour", options: [["hour", "Hour"], ["week", "Week"], ["month", "Month"], ["year", "Year"]] },
      { id: "hours", label: "Hours per week", type: "number", value: 40, min: 0 },
      { id: "weeks", label: "Weeks worked per year", type: "number", value: 52, min: 0, max: 52 }
    ])}${resultPanel()}`;
    live(() => {
      const amount = num(val("amount")), per = val("per");
      const hpw = num(val("hours")), wpy = num(val("weeks"));
      const hoursPerYear = hpw * wpy;
      if (hoursPerYear <= 0) return show(`<p class="error">Enter hours per week and weeks per year greater than zero.</p>`);
      let annual;
      if (per === "hour") annual = amount * hoursPerYear;
      else if (per === "week") annual = amount * wpy;
      else if (per === "month") annual = amount * 12;
      else annual = amount;
      const hourly = annual / hoursPerYear;
      show(`<h2>${money.format(hourly)} / hour · ${money0.format(annual)} / year</h2>${metricsHtml([
        ["Hourly", money.format(hourly)],
        ["Weekly", money.format(annual / (wpy || 1))],
        ["Monthly", money.format(annual / 12)],
        ["Annual", money.format(annual)]
      ])}<p class="notice">Gross pay before taxes and deductions, based on ${number.format(hpw)} hours/week × ${number.format(wpy)} weeks/year. Paid time off is included when weeks = 52.</p>`);
    });
  }

  // ---------- due date ----------
  function renderDueDate() {
    root.innerHTML = `${formHtml([
      { id: "method", label: "Calculate from", type: "select", value: "lmp", options: [["lmp", "First day of last menstrual period"], ["conception", "Conception / ovulation date"], ["ivf5", "IVF — day-5 embryo transfer"], ["ivf3", "IVF — day-3 embryo transfer"]] },
      { id: "date", label: "Date", type: "date", value: todayIso() },
      { id: "cycle", label: "Average cycle length (days)", type: "number", value: 28, min: 20, max: 45, help: "Only used with the last-period method." }
    ])}${resultPanel()}`;
    live(() => {
      const method = val("method"), start = parseDate(val("date"));
      toggleFields(["cycle"], new Set(method === "lmp" ? ["cycle"] : []));
      if (!start) return show(`<p class="error">Enter a valid date.</p>`);
      let due, conception;
      if (method === "lmp") {
        const adj = Math.round(num(val("cycle"))) - 28;
        due = addUtc(start, { days: 280 + adj });
        conception = addUtc(start, { days: 14 + adj });
      } else if (method === "conception") {
        conception = start; due = addUtc(start, { days: 266 });
      } else if (method === "ivf5") {
        conception = addUtc(start, { days: -5 }); due = addUtc(start, { days: 261 });
      } else {
        conception = addUtc(start, { days: -3 }); due = addUtc(start, { days: 264 });
      }
      const today = parseDate(todayIso());
      const gaDays = daysBetween(conception ? addUtc(conception, { days: -14 }) : start, today);
      const weeks = Math.floor(gaDays / 7), days = ((gaDays % 7) + 7) % 7;
      const tri = gaDays < 0 ? "—" : gaDays < 7 * 13 ? "First trimester" : gaDays < 7 * 27 ? "Second trimester" : "Third trimester";
      show(`<h2>Estimated due date: ${fmtDate(due)}</h2>${metricsHtml([
        ["Estimated due date", fmtDateShort(due)],
        ["Estimated conception", conception ? fmtDateShort(conception) : "—"],
        ["Gestational age today", gaDays < 0 ? "Not yet begun" : `${weeks} weeks, ${days} days`],
        ["Trimester", tri]
      ])}<p class="notice">This is an estimate based on standard averages (a 40-week pregnancy from the last period). Only about 1 in 20 births happens on the due date itself. This is not medical advice — your prenatal care provider, using an ultrasound, gives the dating you should rely on.</p>`);
    });
  }

  // ---------- time zone meeting planner ----------
  const ZONES = [
    ["Pacific/Honolulu", "Honolulu"], ["America/Anchorage", "Anchorage"], ["America/Los_Angeles", "Los Angeles (Pacific)"],
    ["America/Denver", "Denver (Mountain)"], ["America/Chicago", "Chicago (Central)"], ["America/New_York", "New York (Eastern)"],
    ["America/Sao_Paulo", "São Paulo"], ["Europe/London", "London"], ["Europe/Paris", "Paris / Berlin / Madrid"],
    ["Europe/Athens", "Athens / Helsinki"], ["Europe/Moscow", "Moscow"], ["Asia/Dubai", "Dubai"], ["Asia/Karachi", "Karachi"],
    ["Asia/Kolkata", "India (Mumbai / Delhi)"], ["Asia/Dhaka", "Dhaka"], ["Asia/Bangkok", "Bangkok / Jakarta"],
    ["Asia/Shanghai", "China (Beijing / Shanghai)"], ["Asia/Singapore", "Singapore"], ["Asia/Tokyo", "Tokyo / Seoul"],
    ["Australia/Sydney", "Sydney"], ["Pacific/Auckland", "Auckland"], ["UTC", "UTC"]
  ];
  const zoneOffset = (timeZone, date) => {
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const p = dtf.formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +(p.hour === "24" ? 0 : p.hour), +p.minute, +p.second);
    return asUTC - date.getTime();
  };
  const wallToInstant = (timeZone, y, mo, d, h, mi) => {
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    let inst = guess - zoneOffset(timeZone, new Date(guess));
    inst = guess - zoneOffset(timeZone, new Date(inst));
    return new Date(inst);
  };
  function renderTimezone() {
    let localZone = "America/New_York";
    try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; if (ZONES.some(([v]) => v === z)) localZone = z; } catch (e) { /* default */ }
    const zoneOpts = ZONES.slice();
    root.innerHTML = `${formHtml([
      { id: "date", label: "Meeting date", type: "date", value: todayIso() },
      { id: "time", label: "Meeting time", type: "time", value: "09:00" },
      { id: "base", label: "In this time zone", type: "select", value: localZone, options: zoneOpts },
      { id: "z1", label: "Compare with", type: "select", value: "Europe/London", options: zoneOpts },
      { id: "z2", label: "Compare with", type: "select", value: "Asia/Tokyo", options: zoneOpts },
      { id: "z3", label: "Compare with (optional)", type: "select", value: "none", options: [["none", "— none —"], ...zoneOpts] }
    ])}${resultPanel()}`;
    live(() => {
      const dstr = val("date"), tstr = val("time");
      const dm = dstr.match(/^(\d{4})-(\d{2})-(\d{2})$/), tm = tstr.match(/^(\d{2}):(\d{2})$/);
      if (!dm || !tm) return show(`<p class="error">Enter a valid meeting date and time.</p>`);
      const base = val("base");
      const instant = wallToInstant(base, +dm[1], +dm[2], +dm[3], +tm[1], +tm[2]);
      const picked = [base, val("z1"), val("z2"), val("z3")].filter((z, i) => z && z !== "none");
      const seen = new Set(), rows = [];
      for (const z of picked) {
        if (seen.has(z)) continue; seen.add(z);
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: z, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).formatToParts(instant).reduce((a, x) => (a[x.type] = x.value, a), {});
        const hour24 = +new Intl.DateTimeFormat("en-US", { timeZone: z, hour12: false, hour: "2-digit" }).format(instant).replace(/\D/g, "");
        const label = (ZONES.find(([v]) => v === z) || [z, z])[1];
        const offHours = hour24 < 8 || hour24 >= 20;
        rows.push(`<tr${z === base ? ' style="font-weight:700"' : ""}><td>${esc(label)}${z === base ? " (base)" : ""}</td><td>${parts.weekday} ${parts.month} ${parts.day}</td><td>${parts.hour}:${parts.minute} ${parts.dayPeriod || ""}</td><td>${offHours ? "🌙 off-hours" : "🟢 daytime"}</td></tr>`);
      }
      show(`<h2>Meeting times by zone</h2><div class="table-wrap"><table><thead><tr><th>Location</th><th>Date</th><th>Local time</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table></div><p class="notice">Daylight-saving shifts are handled automatically for the chosen date. "Off-hours" flags times before 8am or after 8pm local.</p>`);
    });
  }

  const renderers = {
    "age-calculator": renderAge,
    "date-calculator": renderDate,
    "percentage-calculator": renderPercentage,
    "tip-calculator": renderTip,
    "bmi-calculator": renderBmi,
    "gpa-calculator": renderGpa,
    "loan-payment-calculator": renderLoan,
    "salary-to-hourly-calculator": renderSalary,
    "due-date-calculator": renderDueDate,
    "time-zone-meeting-planner": renderTimezone
  };
  if (renderers[slug]) renderers[slug]();
  else root.innerHTML = `<p class="error">This tool could not be loaded.</p>`;
})();
