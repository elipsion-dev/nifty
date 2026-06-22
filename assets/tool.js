(() => {
  const root = document.querySelector("#tool-root");
  if (!root) return;
  const slug = root.dataset.tool;

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const num = (value) => Number.parseFloat(value) || 0;
  const slugify = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const today = () => new Date().toISOString().slice(0, 10);
  const titleCase = (value) => String(value).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const DAY_MS = 86400000;
  const parseIsoDate = (value) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dateText = (date) => date instanceof Date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" }).format(date)
    : "—";
  const addUtc = (date, { years = 0, months = 0, days = 0 } = {}) => {
    const result = new Date(date.getTime());
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCFullYear(result.getUTCFullYear() + years);
    result.setUTCMonth(result.getUTCMonth() + months);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  };
  const daysBetween = (from, to) => Math.floor((to.getTime() - from.getTime()) / DAY_MS);

  const fieldHtml = (field) => {
    const id = `field-${field.id}`;
    const full = field.full ? " full" : "";
    const help = field.help ? `<small>${esc(field.help)}</small>` : "";
    if (field.type === "select") {
      return `<div class="field${full}"><label for="${id}">${esc(field.label)}</label><select id="${id}" name="${field.id}">${field.options.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}</select>${help}</div>`;
    }
    if (field.type === "textarea") {
      return `<div class="field${full}"><label for="${id}">${esc(field.label)}</label><textarea id="${id}" name="${field.id}" placeholder="${esc(field.placeholder || "")}">${esc(field.value || "")}</textarea>${help}</div>`;
    }
    return `<div class="field${full}"><label for="${id}">${esc(field.label)}</label><input id="${id}" name="${field.id}" type="${field.type || "number"}" value="${esc(field.value ?? "")}" placeholder="${esc(field.placeholder || "")}" ${field.min !== undefined ? `min="${field.min}"` : ""} ${field.step ? `step="${field.step}"` : field.type === "number" || !field.type ? 'step="any"' : ""}>${help}</div>`;
  };

  const metricsHtml = (items) => `<div class="metric-grid">${items.map(([label, value]) => `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div>`;
  const resultPanel = () => `<section id="result" class="result-panel" aria-live="polite" hidden></section>`;
  const values = (form) => Object.fromEntries(new FormData(form).entries());
  const download = (content, filename, type = "text/plain") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const calculators = {
    "social-security-claiming-age-calculator": {
      fields: [
        { id: "birth", label: "Date of birth", type: "date", value: "1964-06-15" },
        { id: "claimAge", label: "Planned claiming age", type: "select", options: Array.from({ length: 9 }, (_, index) => [String(index + 62), `Age ${index + 62}`]) },
        { id: "claimMonths", label: "Additional months after birthday", type: "select", options: Array.from({ length: 12 }, (_, month) => [String(month), `${month} month${month === 1 ? "" : "s"}`]) },
        { id: "fraBenefit", label: "Estimated monthly benefit at full retirement age", value: 2000, min: 0 }
      ],
      calculate(v) {
        const birth = parseIsoDate(v.birth);
        if (!birth) return { metrics: [["Result", "Enter a valid birth date"]], note: "Use the date printed on your birth record." };
        let birthYear = birth.getUTCFullYear();
        if (birth.getUTCMonth() === 0 && birth.getUTCDate() === 1) birthYear -= 1;
        const fraMonthsByYear = { 1938: 782, 1939: 784, 1940: 786, 1941: 788, 1942: 790, 1943: 792, 1955: 794, 1956: 796, 1957: 798, 1958: 800, 1959: 802 };
        let fraMonths = birthYear <= 1937 ? 780 : birthYear >= 1960 ? 804 : (fraMonthsByYear[birthYear] || 792);
        const claimMonths = num(v.claimAge) * 12 + num(v.claimMonths);
        const earlyMonths = Math.max(0, fraMonths - claimMonths);
        const delayedMonths = Math.max(0, Math.min(840, claimMonths) - fraMonths);
        const reduction = Math.min(36, earlyMonths) * (5 / 9) / 100 + Math.max(0, earlyMonths - 36) * (5 / 12) / 100;
        const increase = delayedMonths * (2 / 3) / 100;
        const factor = 1 - reduction + increase;
        const fraYears = Math.floor(fraMonths / 12), fraExtraMonths = fraMonths % 12;
        const claimDate = addUtc(birth, { years: num(v.claimAge), months: num(v.claimMonths) });
        return {
          metrics: [["Full retirement age", `${fraYears} years${fraExtraMonths ? `, ${fraExtraMonths} months` : ""}`], ["Planned claiming month", dateText(claimDate)], ["Estimated monthly benefit", money.format(num(v.fraBenefit) * factor)], ["Change from FRA estimate", `${factor >= 1 ? "+" : ""}${number.format((factor - 1) * 100)}%`]],
          note: "Planning estimate only. SSA calculates eligibility by month and may apply family, earnings-test, pension, disability, or survivor rules not modeled here. Delayed credits stop at age 70."
        };
      }
    },
    "rmd-calculator": {
      fields: [
        { id: "balance", label: "Prior December 31 account balance", value: 250000, min: 0 },
        { id: "age", label: "Age at the end of the distribution year", value: 73, min: 72 },
        { id: "account", label: "Account situation", type: "select", options: [["standard", "Owner — standard Uniform Lifetime Table"], ["spouse", "Spouse is sole beneficiary and more than 10 years younger"], ["inherited", "Inherited account / beneficiary"]] },
        { id: "already", label: "Already withdrawn for this RMD year", value: 0, min: 0 }
      ],
      calculate(v) {
        const table = [27.4,26.5,25.5,24.6,23.7,22.9,22.0,21.1,20.2,19.4,18.5,17.7,16.8,16.0,15.2,14.4,13.7,12.9,12.2,11.5,10.8,10.1,9.5,8.9,8.4,7.8,7.3,6.8,6.4,6.0,5.6,5.2,4.9,4.6,4.3,4.1,3.9,3.7,3.5,3.4,3.3,3.1,3.0,2.9,2.8,2.7,2.5,2.3,2.0];
        const age = Math.floor(num(v.age));
        if (v.account !== "standard") return { metrics: [["Table required", v.account === "spouse" ? "Joint Life and Last Survivor" : "Beneficiary rules"]], note: "This calculator intentionally does not estimate this situation. Use the applicable IRS table or beneficiary worksheet because the Uniform Lifetime Table would give the wrong result." };
        const divisor = age >= 120 ? 2 : table[age - 72];
        if (!divisor) return { metrics: [["RMD", "Age outside this table"]], note: "Enter an age from 72 through 120. Whether an RMD is due depends on birth year, account type, employment, and plan terms." };
        const rmd = num(v.balance) / divisor;
        const remaining = Math.max(0, rmd - num(v.already));
        return { metrics: [["IRS distribution period", number.format(divisor)], ["Calculated RMD", money.format(rmd)], ["Still to withdraw", money.format(remaining)], ["Monthly planning amount", money.format(remaining / 12)]], note: "Uses the IRS Uniform Lifetime Table. This does not determine whether an RMD is required, combine accounts, or calculate inherited-account distributions." };
      }
    },
    "tax-refund-timing-estimator": {
      fields: [
        { id: "filed", label: "Date the IRS accepted or received the return", type: "date", value: today() },
        { id: "method", label: "Return type", type: "select", options: [["efile", "Original return — e-filed"], ["paper", "Original return — mailed"], ["amended", "Amended return"]] },
        { id: "path", label: "Claimed EITC or Additional Child Tax Credit", type: "select", options: [["no", "No"], ["yes", "Yes"], ["unsure", "Not sure"]] },
        { id: "review", label: "IRS says corrections or additional review are needed", type: "select", options: [["no", "No"], ["yes", "Yes"]] }
      ],
      calculate(v) {
        const filed = parseIsoDate(v.filed);
        if (!filed) return { metrics: [["Result", "Enter a valid date"]], note: "Use the acceptance date for an e-filed return or the IRS receipt date for a mailed return." };
        const days = v.method === "amended" ? 112 : v.method === "paper" ? 42 : 21;
        let planningDate = addUtc(filed, { days });
        let pathNote = "";
        if (v.path === "yes" && filed.getUTCMonth() <= 1) {
          const lateFebruary = new Date(Date.UTC(filed.getUTCFullYear(), 1, 28));
          if (planningDate < lateFebruary) planningDate = lateFebruary;
          pathNote = " PATH Act timing can hold early EITC/ACTC refunds until after mid-February."
        }
        return { metrics: [["Typical processing window", v.method === "amended" ? "Up to 16 weeks" : v.method === "paper" ? "6 weeks or more" : "About 3 weeks"], ["Planning date", v.review === "yes" ? "No reliable estimate" : dateText(planningDate)], ["Status-check starting point", v.method === "efile" ? "24 hours after acceptance" : v.method === "amended" ? "3 weeks after filing" : "After processing begins"]], note: `${v.review === "yes" ? "Once the IRS requests corrections or review, standard windows no longer predict the refund date." : "This is a typical processing window, not a promised deposit date."}${pathNote} Check Where's My Refund? for the authoritative status.` };
      }
    },
    "fmla-eligibility-calculator": {
      fields: [
        { id: "covered", label: "Covered employer", type: "select", options: [["yes", "Yes — public agency, school, or covered private employer"], ["no", "No"], ["unsure", "Not sure"]] },
        { id: "months", label: "Total months worked for this employer", value: 12, min: 0 },
        { id: "hours", label: "Hours actually worked in the previous 12 months", value: 1250, min: 0 },
        { id: "nearby", label: "Employees within 75 miles of the worksite", value: 50, min: 0 },
        { id: "airline", label: "Airline flight crew employee", type: "select", options: [["no", "No"], ["yes", "Yes"]] }
      ],
      calculate(v) {
        const checks = [v.covered === "yes", num(v.months) >= 12, num(v.hours) >= 1250, num(v.nearby) >= 50];
        const labels = ["covered-employer status", "12 months of employment", "1,250 hours actually worked", "50 employees within 75 miles"];
        const failed = labels.filter((_, index) => !checks[index]);
        const special = v.airline === "yes";
        const status = special ? "Special rules apply" : failed.length ? (v.covered === "unsure" ? "Needs employer confirmation" : "Does not meet every federal gate") : "Meets the basic federal gates";
        return { metrics: [["Screening result", status], ["Employment test", num(v.months) >= 12 ? "Meets 12 months" : `${number.format(12 - num(v.months))} months short`], ["Hours test", num(v.hours) >= 1250 ? "Meets 1,250 hours" : `${number.format(1250 - num(v.hours))} hours short`], ["Worksite test", num(v.nearby) >= 50 ? "Meets 50/75 rule" : `${number.format(50 - num(v.nearby))} employees short`]], note: special ? "Airline flight crew employees use special hours-of-service rules; ask the employer or U.S. Department of Labor rather than relying on this result." : failed.length ? `Items to verify: ${failed.join(", ")}. State family-leave laws or employer policies may provide protection even when federal FMLA does not.` : "This screens employee eligibility only. The reason for leave, notice, certification, and other FMLA requirements still must be satisfied." };
      }
    },
    "naturalization-residency-date-calculator": {
      fields: [
        { id: "resident", label: "Resident Since date on Green Card", type: "date", value: "2022-08-01" },
        { id: "basis", label: "Filing basis", type: "select", options: [["five", "General 5-year permanent-resident rule"], ["three", "3-year rule for qualifying spouse of a U.S. citizen"]] },
        { id: "outside", label: "Total approximate days outside the U.S. during the statutory period", value: 0, min: 0 },
        { id: "longest", label: "Longest single trip outside the U.S. (days)", value: 0, min: 0 },
        { id: "district", label: "Months living in current state or USCIS district", value: 3, min: 0 }
      ],
      calculate(v) {
        const resident = parseIsoDate(v.resident);
        if (!resident) return { metrics: [["Result", "Enter a valid Resident Since date"]], note: "Use the date shown on the front of the Permanent Resident Card." };
        const years = v.basis === "three" ? 3 : 5;
        const requiredPresence = v.basis === "three" ? 548 : 913;
        const anniversary = addUtc(resident, { years });
        const early = addUtc(anniversary, { days: -90 });
        const statutoryDays = Math.round(years * 365.25);
        const presence = Math.max(0, statutoryDays - num(v.outside));
        const warnings = [];
        if (num(v.longest) > 180) warnings.push(num(v.longest) >= 365 ? "a trip of one year or more may break continuous residence" : "a trip over six months may create a presumption that continuous residence was broken");
        if (presence < requiredPresence) warnings.push("the physical-presence estimate is below the usual minimum");
        if (num(v.district) < 3) warnings.push("the three-month state/district residence period may not be met");
        if (v.basis === "three") warnings.push("the marital-union and U.S.-citizen-spouse requirements must also be met");
        return { metrics: [["90-day early-filing estimate", dateText(early)], ["Residence anniversary", dateText(anniversary)], ["Estimated physical presence", `${number.format(presence)} days`], ["Usual minimum", `${number.format(requiredPresence)} days`]], note: warnings.length ? `Review before filing: ${warnings.join("; ")}. This date alone does not establish eligibility.` : "No issue was identified from these limited inputs, but USCIS also reviews age, good moral character, English/civics, travel records, and other eligibility requirements." };
      }
    },
    "i94-overstay-date-calculator": {
      fields: [
        { id: "type", label: "I-94 Admit Until entry", type: "select", options: [["date", "A specific date"], ["ds", "D/S (duration of status)"]] },
        { id: "until", label: "Admit Until date", type: "date", value: today() },
        { id: "compare", label: "Date to compare (today or planned departure)", type: "date", value: today() }
      ],
      calculate(v) {
        if (v.type === "ds") return { metrics: [["Result", "No calendar deadline can be calculated"], ["I-94 notation", "D/S — duration of status"]], note: "D/S depends on maintaining the underlying status and program rules, not a printed expiration date. Confirm status with the designated school/program official or a qualified immigration professional." };
        const until = parseIsoDate(v.until), compare = parseIsoDate(v.compare);
        if (!until || !compare) return { metrics: [["Result", "Enter valid dates"]], note: "Copy the Admit Until date from the most recent CBP I-94 record, not the visa expiration date or the form's OMB expiration date." };
        const difference = daysBetween(until, compare);
        const status = difference <= 0 ? `${Math.abs(difference)} day${Math.abs(difference) === 1 ? "" : "s"} remaining` : `${difference} day${difference === 1 ? "" : "s"} after date`;
        return { metrics: [["Admit Until date", dateText(until)], ["Comparison date", dateText(compare)], ["Calendar difference", status], ["Planning status", difference <= 0 ? "Before or on printed date" : "Past printed date"]], note: "This is calendar arithmetic, not a determination of lawful status or unlawful presence. Extensions, changes of status, tolling, age, asylum, D/S, and other rules can change the legal analysis." };
      }
    },
    "small-claims-deadline-calculator": {
      fields: [
        { id: "event", label: "Claim-accrual or incident date", type: "date", value: today() },
        { id: "years", label: "Verified limitation period — years", value: 2, min: 0 },
        { id: "months", label: "Additional months", value: 0, min: 0 },
        { id: "tolling", label: "Verified tolling days to add", value: 0, min: 0 },
        { id: "margin", label: "Personal filing safety margin (days)", value: 30, min: 0 },
        { id: "jurisdiction", label: "State / court checked", type: "text", value: "", placeholder: "Example: Indiana county small claims court", full: true }
      ],
      calculate(v) {
        const event = parseIsoDate(v.event);
        if (!event) return { metrics: [["Result", "Enter a valid date"]], note: "The legally relevant accrual date may differ from the day you first noticed the dispute." };
        const deadline = addUtc(event, { years: Math.floor(num(v.years)), months: Math.floor(num(v.months)), days: Math.floor(num(v.tolling)) });
        const target = addUtc(deadline, { days: -Math.floor(num(v.margin)) });
        const daysToTarget = daysBetween(parseIsoDate(today()), target);
        return { metrics: [["Raw calculated deadline", dateText(deadline)], ["Your safety-margin target", dateText(target)], ["Time from today to target", daysToTarget >= 0 ? `${daysToTarget} days remaining` : `${Math.abs(daysToTarget)} days ago`], ["Jurisdiction noted", v.jurisdiction || "Not entered"]], note: "Do not rely on this date until an official court source or lawyer confirms the claim type, accrual rule, limitation period, tolling, pre-suit notice, defendant, venue, monetary limit, and filing method. Weekends and holidays are not adjusted." };
      }
    },
    "rent-vs-buy-calculator": {
      fields: [
        { id: "rent", label: "Monthly rent", value: 1800 },
        { id: "home", label: "Home price", value: 350000 },
        { id: "down", label: "Down payment", value: 70000 },
        { id: "rate", label: "Mortgage rate (%)", value: 6.5 },
        { id: "term", label: "Mortgage term (years)", value: 30 },
        { id: "tax", label: "Annual property tax", value: 4200 },
        { id: "insurance", label: "Annual home insurance", value: 1800 },
        { id: "maintenance", label: "Annual maintenance (%)", value: 1 },
        { id: "years", label: "Years to compare", value: 7 },
        { id: "appreciation", label: "Annual appreciation (%)", value: 3 }
      ],
      calculate(v) {
        const principal = num(v.home) - num(v.down);
        const monthlyRate = num(v.rate) / 1200;
        const payments = num(v.term) * 12;
        const mortgage = monthlyRate ? principal * monthlyRate * (1 + monthlyRate) ** payments / ((1 + monthlyRate) ** payments - 1) : principal / payments;
        const ownershipMonthly = mortgage + num(v.tax) / 12 + num(v.insurance) / 12 + num(v.home) * num(v.maintenance) / 1200;
        const months = num(v.years) * 12;
        const remaining = monthlyRate ? principal * ((1 + monthlyRate) ** payments - (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** payments - 1) : principal * (1 - months / payments);
        const futureValue = num(v.home) * (1 + num(v.appreciation) / 100) ** num(v.years);
        const equity = Math.max(0, futureValue - remaining);
        const buyNet = num(v.down) + ownershipMonthly * months - equity;
        const rentTotal = num(v.rent) * months;
        return {
          metrics: [["Monthly rent", money.format(num(v.rent))], ["Est. monthly ownership", money.format(ownershipMonthly)], [`${v.years}-year net buy cost`, money.format(buyNet)]],
          note: buyNet < rentTotal ? `Buying is estimated to cost ${money.format(rentTotal - buyNet)} less over this period.` : `Renting is estimated to cost ${money.format(buyNet - rentTotal)} less over this period.`
        };
      }
    },
    "lease-vs-buy-calculator": {
      fields: [
        { id: "leaseDown", label: "Lease due at signing", value: 3000 },
        { id: "leasePayment", label: "Monthly lease payment", value: 425 },
        { id: "leaseMonths", label: "Lease term (months)", value: 36 },
        { id: "leaseFees", label: "Lease-end fees", value: 500 },
        { id: "purchasePrice", label: "Purchase price", value: 36000 },
        { id: "buyDown", label: "Purchase down payment", value: 5000 },
        { id: "apr", label: "Loan APR (%)", value: 6.5 },
        { id: "loanMonths", label: "Loan term (months)", value: 60 },
        { id: "resale", label: "Estimated value after lease term", value: 24000 }
      ],
      calculate(v) {
        const lease = num(v.leaseDown) + num(v.leasePayment) * num(v.leaseMonths) + num(v.leaseFees);
        const principal = num(v.purchasePrice) - num(v.buyDown);
        const r = num(v.apr) / 1200;
        const n = num(v.loanMonths);
        const payment = r ? principal * r * (1 + r) ** n / ((1 + r) ** n - 1) : principal / n;
        const paidMonths = Math.min(num(v.leaseMonths), n);
        const remaining = r ? principal * ((1 + r) ** n - (1 + r) ** paidMonths) / ((1 + r) ** n - 1) : principal * (1 - paidMonths / n);
        const equity = Math.max(0, num(v.resale) - remaining);
        const buy = num(v.buyDown) + payment * paidMonths - equity;
        return { metrics: [["Lease net cost", money.format(lease)], ["Buy net cost", money.format(buy)], ["Estimated loan payment", money.format(payment)]], note: lease < buy ? `Leasing is lower by ${money.format(buy - lease)} for this comparison.` : `Buying is lower by ${money.format(lease - buy)} for this comparison.` };
      }
    },
    "real-cost-of-owning-a-pool": ownershipCalculator("pool", [
      ["chemicals", "Chemicals and supplies", 900], ["energy", "Pump and heating energy", 1200], ["service", "Cleaning/service", 1800], ["insurance", "Insurance increase", 250], ["repairs", "Repairs reserve", 1000], ["water", "Water", 400]
    ]),
    "real-cost-of-owning-a-boat": financedOwnershipCalculator("boat", [
      ["storage", "Storage or slip", 3600], ["fuel", "Fuel", 2400], ["insurance", "Insurance", 900], ["maintenance", "Maintenance", 1800], ["registration", "Registration and taxes", 300]
    ]),
    "real-cost-of-owning-an-rv": financedOwnershipCalculator("RV", [
      ["storage", "Storage", 1200], ["fuel", "Trip fuel", 2500], ["insurance", "Insurance", 1100], ["maintenance", "Maintenance", 1800], ["campsites", "Campsites", 2200]
    ]),
    "real-cost-of-owning-a-horse": ownershipCalculator("horse", [
      ["boarding", "Boarding or pasture", 6000], ["feed", "Feed and hay", 1800], ["farrier", "Farrier (hoof care)", 1500], ["vet", "Routine vet and dental", 1200], ["insurance", "Insurance", 600], ["tack", "Tack and equipment", 500], ["training", "Training or lessons", 1800]
    ]),
    "real-cost-of-owning-a-dog": ownershipCalculator("dog", [
      ["food", "Food and treats", 700], ["vet", "Routine vet and vaccines", 500], ["preventatives", "Flea, tick, and heartworm", 250], ["grooming", "Grooming", 300], ["supplies", "Supplies and toys", 200], ["insurance", "Pet insurance", 400], ["boarding", "Boarding or daycare", 400]
    ]),
    "real-cost-of-owning-a-cat": ownershipCalculator("cat", [
      ["food", "Food and treats", 450], ["litter", "Litter", 250], ["vet", "Routine vet and vaccines", 350], ["preventatives", "Flea and parasite control", 150], ["supplies", "Supplies and toys", 150], ["insurance", "Pet insurance", 300]
    ]),
    "real-cost-of-owning-a-hot-tub": ownershipCalculator("hot tub", [
      ["energy", "Electricity to heat and run", 600], ["chemicals", "Chemicals and test supplies", 300], ["water", "Water and refills", 120], ["filters", "Filters and parts", 150], ["service", "Service and repairs reserve", 400], ["insurance", "Insurance increase", 100]
    ]),
    "real-cost-of-owning-a-car": financedOwnershipCalculator("car", [
      ["fuel", "Fuel", 2000], ["insurance", "Insurance", 1600], ["maintenance", "Maintenance and repairs", 1200], ["registration", "Registration, taxes, and fees", 400], ["parking", "Parking and tolls", 600]
    ], { price: 38000, down: 5000, apr: 7, years: 6 }),
    "real-cost-of-raising-backyard-chickens": ownershipCalculator("flock", [
      ["feed", "Feed", 400], ["bedding", "Bedding and litter", 120], ["health", "Health and supplements", 80], ["supplies", "Supplies and replacements", 100], ["utilities", "Coop electricity for heat and light", 60]
    ]),
    "real-cost-of-lawn-care": ownershipCalculator("lawn", [
      ["mowing", "Mowing or lawn service", 1200], ["fertilizer", "Fertilizer and treatments", 300], ["seed", "Seed, soil, and overseeding", 150], ["irrigation", "Irrigation and water", 400], ["equipment", "Equipment maintenance and fuel", 250], ["pest", "Weed and pest control", 200]
    ]),
    "real-cost-of-owning-a-septic-system": ownershipCalculator("septic system", [
      ["pumping", "Pumping (amortized per year)", 150], ["inspection", "Inspection", 120], ["additives", "Additives and maintenance", 60], ["repairs", "Repairs reserve", 400], ["drainfield", "Drainfield reserve", 300]
    ]),
    "real-cost-of-owning-a-motorcycle": financedOwnershipCalculator("motorcycle", [
      ["fuel", "Fuel", 300], ["insurance", "Insurance", 600], ["maintenance", "Maintenance and tires", 700], ["registration", "Registration and fees", 150], ["gear", "Riding gear reserve", 250]
    ], { price: 12000, down: 2000, apr: 9, years: 5 }),
    "solar-panel-payback-calculator": {
      fields: [
        { id: "cost", label: "Gross system cost", value: 25000 }, { id: "incentive", label: "Tax credits and rebates (%)", value: 30 },
        { id: "bill", label: "Current monthly electric bill", value: 160 }, { id: "offset", label: "Bill offset by solar (%)", value: 90 }
      ],
      calculate(v) {
        const net = num(v.cost) * (1 - num(v.incentive) / 100);
        const annual = num(v.bill) * 12 * num(v.offset) / 100;
        const payback = annual > 0 ? net / annual : 0;
        const lifetime = annual * 25 - net;
        return { metrics: [["Net cost after incentives", money.format(net)], ["Estimated annual savings", money.format(annual)], ["Payback period", annual > 0 ? `${number.format(payback)} years` : "—"], ["Estimated 25-year net savings", money.format(lifetime)]], note: "Actual results depend on local electricity rates, sunlight, system performance, and future rate changes not modeled here." };
      }
    },
    "real-cost-of-owning-a-rental-property": {
      fields: [
        { id: "price", label: "Purchase price", value: 280000 }, { id: "down", label: "Down payment", value: 56000 },
        { id: "apr", label: "Mortgage APR (%)", value: 7 }, { id: "years", label: "Loan term (years)", value: 30 },
        { id: "rent", label: "Monthly rent", value: 2100 }, { id: "vacancy", label: "Vacancy allowance (%)", value: 6 },
        { id: "tax", label: "Annual property tax", value: 3200 }, { id: "insurance", label: "Annual insurance", value: 1400 },
        { id: "maintenance", label: "Annual maintenance and repairs", value: 2500 }, { id: "management", label: "Property management (% of rent)", value: 8 }
      ],
      calculate(v) {
        const principal = num(v.price) - num(v.down);
        const r = num(v.apr) / 1200;
        const n = num(v.years) * 12;
        const payment = r ? principal * r * (1 + r) ** n / ((1 + r) ** n - 1) : principal / n;
        const grossRent = num(v.rent) * 12;
        const effectiveRent = grossRent * (1 - num(v.vacancy) / 100);
        const mgmt = effectiveRent * num(v.management) / 100;
        const operating = num(v.tax) + num(v.insurance) + num(v.maintenance) + mgmt;
        const annualCost = payment * 12 + operating;
        const cashFlow = effectiveRent - annualCost;
        return { metrics: [["Monthly loan payment", money.format(payment)], ["Effective annual rent", money.format(effectiveRent)], ["Annual operating + financing cost", money.format(annualCost)], ["Annual cash flow", money.format(cashFlow)], ["Monthly cash flow", money.format(cashFlow / 12)]], note: cashFlow >= 0 ? "Positive cash flow shown is before income taxes, depreciation, and appreciation, none of which are modeled here." : "This scenario shows negative cash flow before any tax effects or appreciation; the property costs more each year than it brings in." };
      }
    },
    "real-cost-of-owning-an-electric-car": financedOwnershipCalculator("electric car", [
      ["charging", "Home and public charging", 700], ["insurance", "Insurance", 1700], ["maintenance", "Maintenance and repairs", 700], ["tires", "Tires", 500], ["registration", "Registration, taxes, and fees", 450]
    ], { price: 47000, down: 6000, apr: 7, years: 6 }),
    "real-cost-of-owning-a-jet-ski": ownershipCalculator("personal watercraft", [
      ["storage", "Storage and trailer upkeep", 600], ["fuel", "Fuel", 500], ["insurance", "Insurance", 350], ["maintenance", "Maintenance and winterization", 600], ["registration", "Registration and launch fees", 150]
    ]),
    "real-cost-of-owning-a-second-home": {
      fields: [
        { id: "price", label: "Purchase price", value: 320000 }, { id: "down", label: "Down payment", value: 64000 },
        { id: "apr", label: "Mortgage APR (%)", value: 7 }, { id: "years", label: "Loan term (years)", value: 30 },
        { id: "tax", label: "Annual property tax", value: 4200 }, { id: "insurance", label: "Annual insurance", value: 2200 },
        { id: "utilities", label: "Annual utilities", value: 2400 }, { id: "maintenance", label: "Annual maintenance and HOA", value: 3600 },
        { id: "travel", label: "Annual travel to the property", value: 1500 }
      ],
      calculate(v) {
        const principal = num(v.price) - num(v.down);
        const r = num(v.apr) / 1200;
        const n = num(v.years) * 12;
        const payment = r ? principal * r * (1 + r) ** n / ((1 + r) ** n - 1) : principal / n;
        const carrying = num(v.tax) + num(v.insurance) + num(v.utilities) + num(v.maintenance) + num(v.travel);
        const annual = payment * 12 + carrying;
        return { metrics: [["Monthly mortgage payment", money.format(payment)], ["Annual carrying cost (excl. mortgage)", money.format(carrying)], ["Total annual cost", money.format(annual)], ["Total monthly cost", money.format(annual / 12)]], note: "This is the cost of holding a second home for personal use; it excludes any rental income, and changes in the home's value over time are not modeled here." };
      }
    },
    "real-cost-of-owning-a-classic-car": {
      fields: [
        { id: "value", label: "Current market value", value: 35000 }, { id: "appreciation", label: "Expected appreciation (%/yr)", value: 3 },
        { id: "insurance", label: "Agreed-value collector insurance (annual)", value: 600 }, { id: "storage", label: "Climate-controlled storage (annual)", value: 1800 },
        { id: "maintenance", label: "Specialist maintenance and restoration reserve (annual)", value: 1500 }, { id: "fuel", label: "Fuel for limited use (annual)", value: 300 },
        { id: "events", label: "Registration, club dues, and show fees (annual)", value: 350 }
      ],
      calculate(v) {
        const carrying = num(v.insurance) + num(v.storage) + num(v.maintenance) + num(v.fuel) + num(v.events);
        const appreciation = num(v.value) * num(v.appreciation) / 100;
        const net = carrying - appreciation;
        return { metrics: [["Annual carrying cost", money.format(carrying)], ["Estimated annual appreciation", money.format(appreciation)], ["Net annual cost after appreciation", money.format(net)], ["Five-year carrying cost", money.format(carrying * 5)]], note: net <= 0 ? "At the appreciation rate you entered, estimated value gains exceed the yearly carrying cost — but collector-car values can fall as easily as rise and are never guaranteed." : "Appreciation is not guaranteed; collector values can fall. This estimate excludes the purchase price and any major restoration work." };
      }
    },
    "real-cost-of-owning-a-vacation-rental": {
      fields: [
        { id: "price", label: "Purchase price", value: 340000 }, { id: "down", label: "Down payment", value: 68000 },
        { id: "apr", label: "Mortgage APR (%)", value: 7 }, { id: "years", label: "Loan term (years)", value: 30 },
        { id: "nightly", label: "Average nightly rate", value: 180 }, { id: "occupancy", label: "Occupancy (% of nights booked)", value: 55 },
        { id: "platform", label: "Platform and host service fees (% of revenue)", value: 3 }, { id: "management", label: "Short-term management (% of revenue)", value: 20 },
        { id: "tax", label: "Annual property tax", value: 3800 }, { id: "insurance", label: "Annual short-term rental insurance", value: 2000 },
        { id: "utilities", label: "Annual utilities and internet", value: 3000 }, { id: "maintenance", label: "Annual maintenance, cleaning, and furnishing reserve", value: 4000 }
      ],
      calculate(v) {
        const principal = num(v.price) - num(v.down);
        const r = num(v.apr) / 1200;
        const n = num(v.years) * 12;
        const payment = r ? principal * r * (1 + r) ** n / ((1 + r) ** n - 1) : principal / n;
        const grossRevenue = num(v.nightly) * 365 * num(v.occupancy) / 100;
        const platformFee = grossRevenue * num(v.platform) / 100;
        const mgmt = grossRevenue * num(v.management) / 100;
        const operating = num(v.tax) + num(v.insurance) + num(v.utilities) + num(v.maintenance) + platformFee + mgmt;
        const annualCost = payment * 12 + operating;
        const netIncome = grossRevenue - annualCost;
        return { metrics: [["Monthly loan payment", money.format(payment)], ["Gross annual revenue", money.format(grossRevenue)], ["Annual operating + financing cost", money.format(annualCost)], ["Annual net income", money.format(netIncome)], ["Monthly net income", money.format(netIncome / 12)]], note: netIncome >= 0 ? "Net income shown is before income taxes, depreciation, and appreciation, none of which are modeled here; occupancy and nightly rate are the biggest swing factors." : "This scenario operates at a loss before any tax effects or appreciation; raising occupancy or the nightly rate, or lowering management fees, are the main levers to model." };
      }
    },
    "moving-cost-estimator": {
      fields: [
        { id: "movers", label: "Movers (hours)", value: 6 }, { id: "moverRate", label: "Mover hourly rate", value: 180 },
        { id: "truck", label: "Truck rental", value: 450 }, { id: "miles", label: "Distance (miles)", value: 250 },
        { id: "mileCost", label: "Fuel/cost per mile", value: .55 }, { id: "supplies", label: "Boxes and supplies", value: 250 },
        { id: "lodging", label: "Lodging", value: 0 }, { id: "other", label: "Other costs", value: 300 }
      ],
      calculate(v) {
        const labor = num(v.movers) * num(v.moverRate);
        const transport = num(v.truck) + num(v.miles) * num(v.mileCost);
        const total = labor + transport + num(v.supplies) + num(v.lodging) + num(v.other);
        return { metrics: [["Estimated total", money.format(total)], ["Labor", money.format(labor)], ["Transportation", money.format(transport)]], note: `Add a 10% buffer for an adjusted budget of ${money.format(total * 1.1)}.` };
      }
    },
    "home-maintenance-budget-calculator": {
      fields: [
        { id: "value", label: "Home value", value: 350000 }, { id: "age", label: "Home age (years)", value: 25 },
        { id: "systems", label: "Major systems near replacement", value: 1 }, { id: "known", label: "Known projects this year", value: 2500 }
      ],
      calculate(v) {
        const rate = .01 + (num(v.age) >= 30 ? .005 : num(v.age) >= 15 ? .0025 : 0);
        const annual = num(v.value) * rate + num(v.systems) * 1500 + num(v.known);
        return { metrics: [["Annual reserve", money.format(annual)], ["Monthly reserve", money.format(annual / 12)], ["Base reserve rate", `${number.format(rate * 100)}%`]], note: "This reserve is a planning estimate; actual project timing varies." };
      }
    },
    "property-tax-estimator": {
      fields: [
        { id: "market", label: "Market value", value: 350000 }, { id: "ratio", label: "Assessment ratio (%)", value: 100 },
        { id: "exemption", label: "Exemptions", value: 25000 }, { id: "rate", label: "Tax rate (%)", value: 1.2 }
      ],
      calculate(v) {
        const assessed = Math.max(0, num(v.market) * num(v.ratio) / 100 - num(v.exemption));
        const annual = assessed * num(v.rate) / 100;
        return { metrics: [["Taxable assessed value", money.format(assessed)], ["Estimated annual tax", money.format(annual)], ["Estimated monthly tax", money.format(annual / 12)]], note: "Local assessment rules, millage rates, and special levies may change the actual bill." };
      }
    },
    "property-tax-appeal-estimator": {
      fields: [
        { id: "assessed", label: "Current assessed value", value: 400000, help: "From your latest assessment or tax notice." },
        { id: "purchase", label: "Recent purchase price", value: 350000, help: "Leave 0 if you have not bought recently." },
        { id: "comps", label: "Average value of comparable homes", value: 355000, help: "Average recent sale or assessed value of similar nearby homes." },
        { id: "rate", label: "Effective tax rate (%)", value: 1.2, help: "Annual property tax divided by assessed value, as a percent." }
      ],
      calculate(v) {
        const assessed = num(v.assessed);
        const evidence = [num(v.purchase), num(v.comps)].filter((value) => value > 0);
        const supported = evidence.length ? evidence.reduce((sum, value) => sum + value, 0) / evidence.length : 0;
        const gap = assessed - supported;
        const gapPct = assessed > 0 ? gap / assessed : 0;
        const annualSavings = gap > 0 ? gap * num(v.rate) / 100 : 0;
        let likelihood = "Unlikely";
        if (gapPct >= 0.1) likelihood = "High";
        else if (gapPct >= 0.05) likelihood = "Moderate";
        else if (gapPct > 0.0) likelihood = "Low";
        const note = supported <= 0
          ? "Enter a purchase price or comparable home value so the estimate has evidence to compare against your assessment."
          : gap > 0
            ? `Your assessment looks about ${number.format(Math.round(gapPct * 1000) / 10)}% above your supported value of ${money.format(supported)}. Bring documented comparable sales to your appeal; assessors weigh evidence, so a larger, well-supported gap improves your odds.`
            : `Your assessment is at or below your supported value of ${money.format(supported)}, so an appeal is unlikely to lower it and could prompt a review.`;
        return {
          metrics: [
            ["Supported market value", supported > 0 ? money.format(supported) : "—"],
            ["Possible over-assessment", gap > 0 ? money.format(gap) : money.format(0)],
            ["Appeal success likelihood", likelihood],
            ["Estimated annual savings", money.format(annualSavings)],
            ["Estimated 3-year savings", money.format(annualSavings * 3)]
          ],
          note
        };
      }
    },
    "vacation-budget-planner": sumCalculator([
      ["transport", "Transportation", 900], ["lodging", "Lodging", 1400], ["food", "Food", 700], ["activities", "Activities", 500], ["shopping", "Shopping", 250], ["other", "Other", 150]
    ], true),
    "lead-value-calculator": {
      fields: [
        { id: "close", label: "Lead-to-customer rate (%)", value: 20 }, { id: "revenue", label: "Average customer revenue", value: 2500 },
        { id: "margin", label: "Gross margin (%)", value: 55 }, { id: "cost", label: "Cost per lead", value: 75 }
      ],
      calculate(v) {
        const revenueValue = num(v.close) / 100 * num(v.revenue);
        const profitValue = revenueValue * num(v.margin) / 100;
        return { metrics: [["Revenue value per lead", money.format(revenueValue)], ["Gross profit value", money.format(profitValue)], ["Net value after lead cost", money.format(profitValue - num(v.cost))]], note: `A break-even lead cost is approximately ${money.format(profitValue)}.` };
      }
    },
    "customer-lifetime-value-calculator": {
      fields: [
        { id: "monthly", label: "Monthly revenue per customer", value: 150 }, { id: "margin", label: "Gross margin (%)", value: 70 },
        { id: "churn", label: "Monthly churn (%)", value: 3 }, { id: "cac", label: "Acquisition cost", value: 500 }
      ],
      calculate(v) {
        const lifetime = num(v.churn) ? 1 / (num(v.churn) / 100) : 0;
        const gross = num(v.monthly) * num(v.margin) / 100 * lifetime;
        return { metrics: [["Expected lifetime", `${number.format(lifetime)} months`], ["Gross profit LTV", money.format(gross)], ["LTV after acquisition cost", money.format(gross - num(v.cac))]], note: `LTV:CAC ratio is ${num(v.cac) ? number.format(gross / num(v.cac)) : "—"}:1.` };
      }
    },
    "cost-of-missed-calls-calculator": {
      fields: [
        { id: "calls", label: "Inbound calls per month", value: 400 }, { id: "missed", label: "Calls missed (%)", value: 18 },
        { id: "qualified", label: "Missed calls that are qualified (%)", value: 50 }, { id: "close", label: "Close rate (%)", value: 30 },
        { id: "sale", label: "Average sale value", value: 750 }
      ],
      calculate(v) {
        const missed = num(v.calls) * num(v.missed) / 100;
        const lostSales = missed * num(v.qualified) / 100 * num(v.close) / 100;
        const monthly = lostSales * num(v.sale);
        return { metrics: [["Missed calls", number.format(missed)], ["Potential lost sales", number.format(lostSales)], ["Potential monthly revenue loss", money.format(monthly)]], note: `Annualized potential loss: ${money.format(monthly * 12)}.` };
      }
    },
    "cost-of-employee-turnover-calculator": {
      fields: [
        { id: "salary", label: "Annual salary", value: 60000 }, { id: "vacancyDays", label: "Vacancy days", value: 45 },
        { id: "vacancyLoss", label: "Daily vacancy productivity loss", value: 250 }, { id: "recruiting", label: "Recruiting and hiring costs", value: 7000 },
        { id: "training", label: "Training cost", value: 5000 }, { id: "rampMonths", label: "Ramp-up months", value: 3 },
        { id: "rampProductivity", label: "Productivity lost during ramp (%)", value: 35 }
      ],
      calculate(v) {
        const vacancy = num(v.vacancyDays) * num(v.vacancyLoss);
        const ramp = num(v.salary) / 12 * num(v.rampMonths) * num(v.rampProductivity) / 100;
        const total = vacancy + num(v.recruiting) + num(v.training) + ramp;
        return { metrics: [["Estimated turnover cost", money.format(total)], ["Vacancy cost", money.format(vacancy)], ["Ramp-up cost", money.format(ramp)]], note: `Equivalent to ${number.format(total / num(v.salary) * 100)}% of annual salary.` };
      }
    },
    "hourly-rate-calculator": {
      fields: [
        { id: "income", label: "Desired annual take-home", value: 80000 }, { id: "expenses", label: "Annual business expenses", value: 18000 },
        { id: "tax", label: "Tax reserve (%)", value: 25 }, { id: "hours", label: "Billable hours per week", value: 25 },
        { id: "weeks", label: "Working weeks per year", value: 48 }
      ],
      calculate(v) {
        const revenue = (num(v.income) + num(v.expenses)) / (1 - num(v.tax) / 100);
        const rate = revenue / (num(v.hours) * num(v.weeks));
        return { metrics: [["Minimum hourly rate", money.format(rate)], ["Required annual revenue", money.format(revenue)], ["Annual billable hours", number.format(num(v.hours) * num(v.weeks))]], note: `A 10% pricing buffer produces a rate of ${money.format(rate * 1.1)}.` };
      }
    },
    "profit-margin-calculator": {
      fields: [
        { id: "revenue", label: "Sale price / revenue", value: 1000 }, { id: "cost", label: "Cost", value: 600 }, { id: "target", label: "Target margin (%)", value: 40 }
      ],
      calculate(v) {
        const profit = num(v.revenue) - num(v.cost);
        const margin = num(v.revenue) ? profit / num(v.revenue) * 100 : 0;
        const markup = num(v.cost) ? profit / num(v.cost) * 100 : 0;
        const targetPrice = num(v.cost) / (1 - num(v.target) / 100);
        return { metrics: [["Gross profit", money.format(profit)], ["Margin", `${number.format(margin)}%`], ["Markup", `${number.format(markup)}%`]], note: `Price needed for a ${number.format(num(v.target))}% margin: ${money.format(targetPrice)}.` };
      }
    },
    "break-even-calculator": {
      fields: [
        { id: "fixed", label: "Fixed costs", value: 25000 }, { id: "price", label: "Price per unit", value: 120 },
        { id: "variable", label: "Variable cost per unit", value: 45 }
      ],
      calculate(v) {
        const contribution = num(v.price) - num(v.variable);
        const units = contribution > 0 ? Math.ceil(num(v.fixed) / contribution) : 0;
        return { metrics: [["Break-even units", number.format(units)], ["Break-even revenue", money.format(units * num(v.price))], ["Contribution per unit", money.format(contribution)]], note: contribution <= 0 ? "Price must be greater than variable cost to break even." : `Each additional unit contributes ${money.format(contribution)} toward profit.` };
      }
    },
    "job-cost-calculator": {
      fields: [
        { id: "laborHours", label: "Labor hours", value: 40 }, { id: "laborRate", label: "Loaded labor rate", value: 45 },
        { id: "materials", label: "Materials", value: 2200 }, { id: "other", label: "Other direct costs", value: 350 },
        { id: "overhead", label: "Overhead (%)", value: 15 }, { id: "markup", label: "Markup (%)", value: 30 }
      ],
      calculate(v) {
        const direct = num(v.laborHours) * num(v.laborRate) + num(v.materials) + num(v.other);
        const cost = direct * (1 + num(v.overhead) / 100);
        const price = cost * (1 + num(v.markup) / 100);
        return { metrics: [["Total job cost", money.format(cost)], ["Suggested price", money.format(price)], ["Expected gross profit", money.format(price - cost)]], note: `Expected margin: ${number.format((price - cost) / price * 100)}%.` };
      }
    },
    "service-pricing-calculator": {
      fields: [
        { id: "hours", label: "Service hours", value: 3 }, { id: "hourly", label: "Labor cost per hour", value: 35 },
        { id: "materials", label: "Materials and direct costs", value: 50 }, { id: "overhead", label: "Overhead allocation", value: 40 },
        { id: "margin", label: "Desired profit margin (%)", value: 35 }
      ],
      calculate(v) {
        const cost = num(v.hours) * num(v.hourly) + num(v.materials) + num(v.overhead);
        const price = cost / (1 - num(v.margin) / 100);
        return { metrics: [["Service cost", money.format(cost)], ["Recommended price", money.format(price)], ["Profit per service", money.format(price - cost)]], note: `Effective customer rate: ${money.format(price / num(v.hours))} per service hour.` };
      }
    },
    "sales-commission-calculator": {
      fields: [
        { id: "sales", label: "Sales amount", value: 75000 }, { id: "rate", label: "Base commission rate (%)", value: 5 },
        { id: "threshold", label: "Accelerator threshold", value: 50000 }, { id: "accelerator", label: "Rate above threshold (%)", value: 8 }
      ],
      calculate(v) {
        const below = Math.min(num(v.sales), num(v.threshold));
        const above = Math.max(0, num(v.sales) - num(v.threshold));
        const commission = below * num(v.rate) / 100 + above * num(v.accelerator) / 100;
        return { metrics: [["Total commission", money.format(commission)], ["Base-tier commission", money.format(below * num(v.rate) / 100)], ["Accelerated commission", money.format(above * num(v.accelerator) / 100)]], note: `Effective commission rate: ${number.format(commission / num(v.sales) * 100)}%.` };
      }
    }
  };

  function ownershipCalculator(label, costs) {
    return {
      fields: costs.map(([id, name, value]) => ({ id, label: `Annual ${name.toLowerCase()}`, value })),
      calculate(v) {
        const annual = costs.reduce((sum, [id]) => sum + num(v[id]), 0);
        return { metrics: [["Annual cost", money.format(annual)], ["Monthly average", money.format(annual / 12)], ["Five-year cost", money.format(annual * 5)]], note: `This estimate excludes the purchase or installation cost of the ${label}.` };
      }
    };
  }

  function financedOwnershipCalculator(label, costs, base = {}) {
    return {
      fields: [
        { id: "price", label: `Purchase price`, value: base.price ?? 65000 }, { id: "down", label: "Down payment", value: base.down ?? 10000 },
        { id: "apr", label: "Loan APR (%)", value: base.apr ?? 7 }, { id: "years", label: "Loan term (years)", value: base.years ?? 10 },
        ...costs.map(([id, name, value]) => ({ id, label: `Annual ${name.toLowerCase()}`, value }))
      ],
      calculate(v) {
        const principal = num(v.price) - num(v.down);
        const r = num(v.apr) / 1200;
        const n = num(v.years) * 12;
        const payment = r ? principal * r * (1 + r) ** n / ((1 + r) ** n - 1) : principal / n;
        const annualOther = costs.reduce((sum, [id]) => sum + num(v[id]), 0);
        const annual = payment * 12 + annualOther;
        return { metrics: [["Monthly loan payment", money.format(payment)], ["Annual ownership cost", money.format(annual)], ["Monthly all-in average", money.format(annual / 12)]], note: `This estimate does not include depreciation or resale value of the ${label}.` };
      }
    };
  }

  function sumCalculator(costs, contingency = false) {
    return {
      fields: costs.map(([id, label, value]) => ({ id, label, value })).concat(contingency ? [{ id: "buffer", label: "Contingency (%)", value: 10 }] : []),
      calculate(v) {
        const subtotal = costs.reduce((sum, [id]) => sum + num(v[id]), 0);
        const buffer = contingency ? subtotal * num(v.buffer) / 100 : 0;
        return { metrics: [["Subtotal", money.format(subtotal)], ["Contingency", money.format(buffer)], ["Total budget", money.format(subtotal + buffer)]], note: "Adjust each category as quotes and reservations become available." };
      }
    };
  }

  function renderCalculator(config) {
    root.innerHTML = `<form id="calculator-form"><div class="form-grid">${config.fields.map(fieldHtml).join("")}</div><div class="actions"><button class="button primary" type="submit">Calculate</button><button class="button" type="reset">Reset</button></div></form>${resultPanel()}`;
    const form = root.querySelector("form");
    const result = root.querySelector("#result");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const output = config.calculate(values(form));
      result.innerHTML = `<h2>Estimate</h2>${metricsHtml(output.metrics)}<p>${esc(output.note)}</p>`;
      result.hidden = false;
    });
    form.addEventListener("reset", () => { result.hidden = true; });
    form.requestSubmit();
  }

  const parseCSV = (text, delimiter = ",") => {
    const rows = [];
    let row = [], cell = "", quoted = false;
    const source = String(text).replace(/^\uFEFF/, "");
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
  const toCSV = (rows, delimiter = ",") => rows.map((row) => row.map((cell) => {
    const value = String(cell ?? "");
    return /["\r\n,;\t|]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  }).join(delimiter)).join("\n");
  const detectDelimiter = (text) => {
    const sample = String(text).split(/\r?\n/, 1)[0];
    return [[",", sample.split(",").length], ["\t", sample.split("\t").length], [";", sample.split(";").length], ["|", sample.split("|").length]].sort((a, b) => b[1] - a[1])[0][0];
  };
  const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
  const tableHtml = (rows, limit = 12) => {
    if (!rows.length) return "<p>No rows found.</p>";
    return `<div class="table-wrap"><table><thead><tr>${rows[0].map((cell) => `<th>${esc(cell)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1, limit + 1).map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${rows.length - 1 > limit ? `<p><small>Showing ${limit} of ${rows.length - 1} data rows.</small></p>` : ""}`;
  };
  const fileInput = (multiple = false, accept = ".csv,text/csv") => `<div class="drop-zone"><label><strong>Choose ${multiple ? "files" : "a file"}</strong><br><input id="file-input" type="file" accept="${accept}" ${multiple ? "multiple" : ""}></label></div>`;

  async function renderCsvTool() {
    const multi = ["merge-csv-files", "compare-two-csvs"].includes(slug);
    const accept = slug === "excel-to-csv-cleaner" ? ".xlsx,.xls,.csv" : ".csv,.txt,text/csv,text/plain";
    root.innerHTML = `${fileInput(multi, accept)}<div id="csv-options"></div><div class="actions"><button id="process" class="button primary" type="button">Process file${multi ? "s" : ""}</button></div>${resultPanel()}`;
    const options = root.querySelector("#csv-options");
    const result = root.querySelector("#result");
    const process = root.querySelector("#process");

    if (slug === "split-csv-files") options.innerHTML = `<div class="form-grid"><div class="field"><label for="rows-per-file">Rows per output file</label><input id="rows-per-file" type="number" value="500" min="1"></div></div>`;
    if (slug === "remove-duplicate-rows") options.innerHTML = `<p class="notice">Rows are considered duplicates when every cell matches after surrounding whitespace is removed.</p>`;
    if (slug === "column-mapper") options.innerHTML = `<div class="field"><label for="column-map">New column names, comma-separated</label><input id="column-map" placeholder="Date, Description, Amount"></div>`;
    if (slug === "delimiter-converter") options.innerHTML = `<div class="form-grid"><div class="field"><label for="output-delimiter">Output delimiter</label><select id="output-delimiter"><option value=",">Comma</option><option value="tab">Tab</option><option value=";">Semicolon</option><option value="|">Pipe</option></select></div></div>`;
    if (slug === "csv-formula-generator") {
      root.innerHTML = `<form id="formula-form"><div class="form-grid">
        ${fieldHtml({ id: "operation", label: "Formula type", type: "select", options: [["sum", "Sum a range"], ["if", "If / then"], ["lookup", "XLOOKUP"], ["join", "Join text"], ["percent", "Percent change"]] })}
        ${fieldHtml({ id: "range", label: "Primary cells or range", type: "text", value: "A2:A100" })}
        ${fieldHtml({ id: "second", label: "Second value / range", type: "text", value: "B2" })}
        ${fieldHtml({ id: "condition", label: "Condition", type: "text", value: ">0" })}
      </div><div class="actions"><button class="button primary" type="submit">Generate formula</button></div></form>${resultPanel()}`;
      const form = root.querySelector("form");
      const panel = root.querySelector("#result");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const v = values(form);
        const formulas = {
          sum: `=SUM(${v.range})`,
          if: `=IF(${v.range}${v.condition},"Yes","No")`,
          lookup: `=XLOOKUP(${v.range},${v.second},C:C,"Not found")`,
          join: `=TEXTJOIN(" ",TRUE,${v.range},${v.second})`,
          percent: `=IFERROR((${v.second}-${v.range})/${v.range},0)`
        };
        panel.innerHTML = `<h2>Formula</h2><p><code>${esc(formulas[v.operation])}</code></p><div class="actions"><button id="copy-formula" class="button" type="button">Copy formula</button></div>`;
        panel.hidden = false;
        panel.querySelector("#copy-formula").onclick = () => navigator.clipboard.writeText(formulas[v.operation]);
      });
      return;
    }
    if (slug === "json-csv-converter") {
      root.innerHTML = `<div class="field"><label for="data-text">Paste JSON or CSV</label><textarea id="data-text" rows="12" placeholder='[{"name":"Ada","score":10}]'></textarea></div><div class="actions"><button id="json-to-csv" class="button primary">JSON to CSV</button><button id="csv-to-json" class="button">CSV to JSON</button></div>${resultPanel()}`;
      const text = root.querySelector("#data-text");
      const panel = root.querySelector("#result");
      root.querySelector("#json-to-csv").onclick = () => {
        try {
          const data = JSON.parse(text.value);
          if (!Array.isArray(data)) throw new Error("JSON must be an array of objects.");
          const headers = [...new Set(data.flatMap(Object.keys))];
          const output = toCSV([headers, ...data.map((item) => headers.map((key) => item[key] ?? ""))]);
          showTextResult(panel, output, "converted.csv", "CSV result");
        } catch (error) { showError(panel, error.message); }
      };
      root.querySelector("#csv-to-json").onclick = () => {
        const rows = parseCSV(text.value, detectDelimiter(text.value));
        const headers = rows.shift() || [];
        const output = JSON.stringify(rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))), null, 2);
        showTextResult(panel, output, "converted.json", "JSON result", "application/json");
      };
      return;
    }

    process.addEventListener("click", async () => {
      const files = [...root.querySelector("#file-input").files];
      if (!files.length || (multi && files.length < 2)) return showError(result, multi ? "Choose at least two files." : "Choose a file.");
      try {
        if (slug === "excel-to-csv-cleaner") return processExcel(files[0], result);
        const texts = await Promise.all(files.map(readFile));
        const datasets = texts.map((text) => parseCSV(text, detectDelimiter(text)));
        if (slug === "merge-csv-files") {
          const header = datasets[0][0];
          const merged = [header, ...datasets.flatMap((rows, index) => rows.slice(index === 0 ? 1 : (JSON.stringify(rows[0]) === JSON.stringify(header) ? 1 : 0)))];
          showCsvResult(result, merged, "merged.csv", `${merged.length - 1} rows merged`);
        } else if (slug === "split-csv-files") {
          const rows = datasets[0], chunkSize = Math.max(1, num(root.querySelector("#rows-per-file").value));
          const parts = Math.ceil((rows.length - 1) / chunkSize);
          result.innerHTML = `<h2>${parts} files ready</h2><div class="actions">${Array.from({ length: parts }, (_, index) => `<button class="button split-download" data-index="${index}">Download part ${index + 1}</button>`).join("")}</div>`;
          result.hidden = false;
          result.querySelectorAll(".split-download").forEach((button) => button.onclick = () => {
            const start = 1 + num(button.dataset.index) * chunkSize;
            download(toCSV([rows[0], ...rows.slice(start, start + chunkSize)]), `split-${num(button.dataset.index) + 1}.csv`, "text/csv");
          });
        } else if (slug === "remove-duplicate-rows") {
          const rows = datasets[0], seen = new Set(), unique = [rows[0]], duplicates = [];
          rows.slice(1).forEach((row) => {
            const key = JSON.stringify(row.map((cell) => cell.trim()));
            if (seen.has(key)) duplicates.push(row); else { seen.add(key); unique.push(row); }
          });
          showCsvResult(result, unique, "deduplicated.csv", `${duplicates.length} duplicate rows removed`);
        } else if (slug === "compare-two-csvs") {
          const [a, b] = datasets;
          const aSet = new Set(a.slice(1).map(JSON.stringify)), bSet = new Set(b.slice(1).map(JSON.stringify));
          const output = [["status", ...a[0]], ...a.slice(1).filter((row) => !bSet.has(JSON.stringify(row))).map((row) => ["removed", ...row]), ...b.slice(1).filter((row) => !aSet.has(JSON.stringify(row))).map((row) => ["added", ...row])];
          showCsvResult(result, output, "comparison.csv", `${output.length - 1} changed rows found`);
        } else if (slug === "column-mapper") {
          const rows = datasets[0];
          const names = root.querySelector("#column-map").value.split(",").map((name) => name.trim()).filter(Boolean);
          if (!names.length) root.querySelector("#column-map").value = rows[0].join(", ");
          const headers = names.length ? names : rows[0];
          showCsvResult(result, [headers, ...rows.slice(1).map((row) => headers.map((_, index) => row[index] ?? ""))], "mapped.csv", `${headers.length} columns mapped`);
        } else if (slug === "spreadsheet-error-finder") {
          const rows = datasets[0], width = rows[0]?.length || 0, issues = [["row", "column", "issue", "value"]];
          rows.slice(1).forEach((row, rowIndex) => {
            if (row.length !== width) issues.push([rowIndex + 2, "", `Expected ${width} columns; found ${row.length}`, ""]);
            row.forEach((cell, columnIndex) => {
              if (!cell.trim()) issues.push([rowIndex + 2, rows[0][columnIndex] || columnIndex + 1, "Blank value", ""]);
              if (/^#(REF|VALUE|DIV\/0|N\/A|NAME)\!?$/i.test(cell.trim())) issues.push([rowIndex + 2, rows[0][columnIndex] || columnIndex + 1, "Spreadsheet error", cell]);
            });
          });
          showCsvResult(result, issues, "issues.csv", `${issues.length - 1} potential issues found`);
        } else if (slug === "delimiter-converter") {
          const delimiter = root.querySelector("#output-delimiter").value === "tab" ? "\t" : root.querySelector("#output-delimiter").value;
          showTextResult(result, toCSV(datasets[0], delimiter), "converted.txt", "Converted data", "text/plain");
        } else {
          processFinanceCsv(slug, datasets[0], result);
        }
      } catch (error) { showError(result, error.message || "The file could not be processed."); }
    });
  }

  function showError(panel, message) {
    panel.innerHTML = `<h2 class="error">Could not process</h2><p>${esc(message)}</p>`;
    panel.hidden = false;
  }
  function showCsvResult(panel, rows, filename, summary) {
    panel.innerHTML = `<h2>${esc(summary)}</h2>${tableHtml(rows)}<div class="actions"><button id="download-result" class="button primary">Download CSV</button></div>`;
    panel.hidden = false;
    panel.querySelector("#download-result").onclick = () => download(toCSV(rows), filename, "text/csv");
  }
  function showTextResult(panel, content, filename, heading, type = "text/csv") {
    panel.innerHTML = `<h2>${esc(heading)}</h2><div class="field"><textarea id="text-result" rows="10" readonly>${esc(content)}</textarea></div><div class="actions"><button id="download-result" class="button primary">Download</button><button id="copy-result" class="button">Copy</button></div>`;
    panel.hidden = false;
    panel.querySelector("#download-result").onclick = () => download(content, filename, type);
    panel.querySelector("#copy-result").onclick = () => navigator.clipboard.writeText(content);
  }

  async function loadScript(src, globalName) {
    if (window[globalName]) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  async function processExcel(file, panel) {
    await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", "XLSX");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }).filter((row) => row.some((cell) => String(cell).trim()));
    showCsvResult(panel, rows, `${file.name.replace(/\.[^.]+$/, "")}-clean.csv`, `${rows.length - 1} rows converted from ${workbook.SheetNames[0]}`);
  }

  const normalizeMerchant = (description) => String(description)
    .toUpperCase()
    .replace(/\b(POS|DEBIT|CREDIT|PURCHASE|CARD|CHECKCARD|ONLINE|PAYMENT|ACH|RECURRING)\b/g, "")
    .replace(/\b\d{3,}\b/g, "")
    .replace(/[#*_/.-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const spendingCategory = (description) => {
    const text = String(description).toLowerCase();
    const rules = [
      ["Housing", /rent|mortgage|property/], ["Groceries", /grocery|kroger|aldi|whole foods|walmart|costco/],
      ["Dining", /restaurant|cafe|coffee|doordash|uber eats|mcdonald/], ["Transportation", /gas|fuel|shell|exxon|uber|lyft|transit/],
      ["Utilities", /electric|water|utility|internet|phone|comcast|att|verizon/], ["Subscriptions", /netflix|spotify|hulu|adobe|subscription/],
      ["Shopping", /amazon|target|store|shop/], ["Healthcare", /pharmacy|medical|dental|hospital|cvs|walgreens/],
      ["Income", /payroll|salary|deposit|interest/], ["Transfer", /transfer|payment|zelle|venmo/]
    ];
    return rules.find(([, regex]) => regex.test(text))?.[0] || "Other";
  };
  const columnIndex = (headers, patterns, fallback) => {
    const lowered = headers.map((header) => String(header).toLowerCase());
    const found = lowered.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
    return found >= 0 ? found : fallback;
  };

  function processFinanceCsv(tool, rows, panel) {
    if (!rows.length) return showError(panel, "No rows found.");
    const headers = rows[0], dateI = columnIndex(headers, ["date", "posted"], 0), descI = columnIndex(headers, ["description", "merchant", "memo", "name"], 1);
    const amountI = columnIndex(headers, ["amount", "value"], Math.min(2, headers.length - 1));
    const debitI = columnIndex(headers, ["debit", "withdrawal"], -1), creditI = columnIndex(headers, ["credit", "deposit"], -1);
    const amountFor = (row) => amountI >= 0 ? num(String(row[amountI]).replace(/[$,]/g, "")) : num(String(row[creditI]).replace(/[$,]/g, "")) - num(String(row[debitI]).replace(/[$,]/g, ""));
    const normalized = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => [row[dateI] || "", String(row[descI] || "").trim(), amountFor(row)]);
    if (tool === "bank-statement-cleaner" || tool === "csv-bank-format-converter") {
      showCsvResult(panel, [["date", "description", "amount"], ...normalized], "clean-statement.csv", `${normalized.length} transactions cleaned`);
    } else if (tool === "merchant-name-normalizer") {
      showCsvResult(panel, [["date", "original_description", "normalized_merchant", "amount"], ...normalized.map(([date, desc, amount]) => [date, desc, normalizeMerchant(desc), amount])], "normalized-merchants.csv", `${normalized.length} merchant names normalized`);
    } else if (tool === "personal-spending-categorizer") {
      showCsvResult(panel, [["date", "description", "category", "amount"], ...normalized.map(([date, desc, amount]) => [date, desc, spendingCategory(desc), amount])], "categorized-spending.csv", `${normalized.length} transactions categorized`);
    } else if (tool === "duplicate-transaction-finder") {
      const seen = new Map(), output = [["date", "description", "amount", "duplicate_of_row"]];
      normalized.forEach((row, index) => {
        const key = JSON.stringify(row.map((value) => String(value).trim().toLowerCase()));
        if (seen.has(key)) output.push([...row, seen.get(key) + 2]); else seen.set(key, index);
      });
      showCsvResult(panel, output, "duplicate-transactions.csv", `${output.length - 1} possible duplicates found`);
    } else if (tool === "recurring-subscription-finder") {
      const groups = new Map();
      normalized.forEach(([date, desc, amount]) => {
        const merchant = normalizeMerchant(desc);
        const key = `${merchant}|${Math.abs(amount).toFixed(2)}`;
        if (!groups.has(key)) groups.set(key, { merchant, amount: Math.abs(amount), dates: [] });
        groups.get(key).dates.push(date);
      });
      const recurring = [...groups.values()].filter((group) => group.dates.length >= 2).sort((a, b) => b.dates.length - a.dates.length);
      showCsvResult(panel, [["merchant", "typical_amount", "occurrences", "dates"], ...recurring.map((group) => [group.merchant, group.amount, group.dates.length, group.dates.join(" | ")])], "recurring-charges.csv", `${recurring.length} repeating charges found`);
    } else if (tool === "credit-card-statement-analyzer") {
      const categoryTotals = new Map(), merchantTotals = new Map();
      normalized.filter(([, , amount]) => amount !== 0).forEach(([, desc, amount]) => {
        const spend = Math.abs(amount);
        categoryTotals.set(spendingCategory(desc), (categoryTotals.get(spendingCategory(desc)) || 0) + spend);
        merchantTotals.set(normalizeMerchant(desc), (merchantTotals.get(normalizeMerchant(desc)) || 0) + spend);
      });
      const total = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
      const rowsOut = [["category", "total"], ...[...categoryTotals.entries()].sort((a, b) => b[1] - a[1])];
      panel.innerHTML = `<h2>Statement summary</h2>${metricsHtml([["Transactions", normalized.length], ["Total activity", money.format(total)], ["Top merchant", [...merchantTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—"]])}${tableHtml(rowsOut)}<div class="actions"><button id="download-result" class="button primary">Download category summary</button></div>`;
      panel.hidden = false;
      panel.querySelector("#download-result").onclick = () => download(toCSV(rowsOut), "statement-summary.csv", "text/csv");
    }
  }

  function renderFinanceUploader() {
    root.innerHTML = `${fileInput(false)}<p class="notice">Best results come from a CSV with date, description, and amount columns. Debit and credit columns are also supported.</p><div class="actions"><button id="process" class="button primary">Analyze statement</button></div>${resultPanel()}`;
    root.querySelector("#process").onclick = async () => {
      const file = root.querySelector("#file-input").files[0], panel = root.querySelector("#result");
      if (!file) return showError(panel, "Choose a CSV statement first.");
      try {
        const text = await readFile(file);
        processFinanceCsv(slug, parseCSV(text, detectDelimiter(text)), panel);
      } catch (error) { showError(panel, error.message); }
    };
  }

  function renderDebt(method) {
    root.innerHTML = `<p class="notice">Add debts and enter the total amount you can pay toward all debts each month.</p><div id="debts" class="repeat-list"></div><div class="actions"><button id="add-debt" class="button">Add debt</button></div><div class="form-grid" style="margin-top:1rem">${fieldHtml({ id: "budget", label: "Total monthly debt payment", value: 1000 })}</div><div class="actions"><button id="calculate-debt" class="button primary">Build payoff plan</button></div>${resultPanel()}`;
    const list = root.querySelector("#debts");
    const add = (name = "", balance = "", rate = "", minimum = "") => {
      const row = document.createElement("div");
      row.className = "repeat-row";
      row.innerHTML = `<div><label class="group-label">Debt name</label><input class="debt-name" value="${esc(name)}"></div><div><label class="group-label">Balance</label><input class="debt-balance" type="number" step="any" value="${esc(balance)}"></div><div><label class="group-label">APR %</label><input class="debt-rate" type="number" step="any" value="${esc(rate)}"></div><div><label class="group-label">Minimum</label><input class="debt-min" type="number" step="any" value="${esc(minimum)}"></div><button class="button danger remove-row" type="button">Remove</button>`;
      row.querySelector(".remove-row").onclick = () => row.remove();
      list.appendChild(row);
    };
    add("Credit card", 6500, 22.9, 175); add("Car loan", 14000, 6.5, 325); add("Student loan", 22000, 5.2, 250);
    root.querySelector("#add-debt").onclick = () => add();
    root.querySelector("#calculate-debt").onclick = () => {
      let debts = [...list.querySelectorAll(".repeat-row")].map((row) => ({
        name: row.querySelector(".debt-name").value || "Debt",
        balance: num(row.querySelector(".debt-balance").value),
        rate: num(row.querySelector(".debt-rate").value) / 1200,
        minimum: num(row.querySelector(".debt-min").value)
      })).filter((debt) => debt.balance > 0);
      const original = debts.reduce((sum, debt) => sum + debt.balance, 0);
      const budget = num(root.querySelector("#field-budget").value);
      if (!debts.length || budget <= 0 || budget < debts.reduce((sum, debt) => sum + debt.minimum, 0)) return showError(root.querySelector("#result"), "Enter debts and a monthly payment at least as large as the combined minimums.");
      let month = 0, interest = 0, payoff = [], guard = 0;
      while (debts.some((debt) => debt.balance > .01) && guard++ < 1200) {
        month++;
        debts.forEach((debt) => { const charge = debt.balance * debt.rate; debt.balance += charge; interest += charge; });
        let available = budget;
        debts.filter((debt) => debt.balance > 0).forEach((debt) => {
          const payment = Math.min(debt.balance, debt.minimum, available);
          debt.balance -= payment; available -= payment;
          if (debt.balance <= .01 && !payoff.some((item) => item.name === debt.name)) payoff.push({ name: debt.name, month });
        });
        const active = debts.filter((debt) => debt.balance > .01).sort((a, b) => method === "snowball" ? a.balance - b.balance : b.rate - a.rate);
        for (const debt of active) {
          if (available <= 0) break;
          const payment = Math.min(debt.balance, available);
          debt.balance -= payment; available -= payment;
          if (debt.balance <= .01 && !payoff.some((item) => item.name === debt.name)) payoff.push({ name: debt.name, month });
        }
      }
      const panel = root.querySelector("#result");
      panel.innerHTML = `<h2>Estimated payoff plan</h2>${metricsHtml([["Starting debt", money.format(original)], ["Debt-free in", `${month} months`], ["Estimated interest", money.format(interest)]])}<div class="table-wrap"><table><thead><tr><th>Debt</th><th>Estimated payoff month</th></tr></thead><tbody>${payoff.map((item) => `<tr><td>${esc(item.name)}</td><td>${item.month}</td></tr>`).join("")}</tbody></table></div>`;
      panel.hidden = false;
    };
  }

  function renderNetWorth() {
    const storageKey = "niftyutilities-net-worth";
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "assets", label: "Assets (one per line: name, amount)", type: "textarea", value: "Checking, 5000\nRetirement, 45000\nHome, 300000" })}${fieldHtml({ id: "liabilities", label: "Liabilities (one per line: name, amount)", type: "textarea", value: "Credit card, 2500\nMortgage, 225000" })}</div><div class="actions"><button id="calculate-net" class="button primary">Calculate and save locally</button><button id="clear-net" class="button danger">Clear saved data</button></div>${resultPanel()}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      root.querySelector("#field-assets").value = data.assets;
      root.querySelector("#field-liabilities").value = data.liabilities;
    }
    const calculate = () => {
      const assetsText = root.querySelector("#field-assets").value, liabilitiesText = root.querySelector("#field-liabilities").value;
      const parseLines = (text) => text.split(/\r?\n/).filter(Boolean).map((line) => { const parts = line.split(","); return [parts.slice(0, -1).join(",").trim(), num(parts.at(-1))]; });
      const assets = parseLines(assetsText), liabilities = parseLines(liabilitiesText);
      const assetTotal = assets.reduce((sum, [, value]) => sum + value, 0), liabilityTotal = liabilities.reduce((sum, [, value]) => sum + value, 0);
      localStorage.setItem(storageKey, JSON.stringify({ assets: assetsText, liabilities: liabilitiesText }));
      const panel = root.querySelector("#result");
      panel.innerHTML = `<h2>Net worth</h2>${metricsHtml([["Total assets", money.format(assetTotal)], ["Total liabilities", money.format(liabilityTotal)], ["Net worth", money.format(assetTotal - liabilityTotal)]])}`;
      panel.hidden = false;
    };
    root.querySelector("#calculate-net").onclick = calculate;
    root.querySelector("#clear-net").onclick = () => { localStorage.removeItem(storageKey); root.querySelector("#field-assets").value = ""; root.querySelector("#field-liabilities").value = ""; root.querySelector("#result").hidden = true; };
    calculate();
  }

  function renderRoommateSplitter() {
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "roommates", label: "Roommates (comma-separated)", type: "text", value: "Alex, Jordan, Sam", full: true })}${fieldHtml({ id: "expenses", label: "Expenses (one per line: item, amount)", type: "textarea", value: "Rent, 2100\nElectric, 140\nInternet, 75", full: true })}</div><div class="actions"><button id="split" class="button primary">Split expenses</button></div>${resultPanel()}`;
    root.querySelector("#split").onclick = () => {
      const names = root.querySelector("#field-roommates").value.split(",").map((name) => name.trim()).filter(Boolean);
      const total = root.querySelector("#field-expenses").value.split(/\r?\n/).filter(Boolean).reduce((sum, line) => sum + num(line.split(",").at(-1)), 0);
      const share = names.length ? total / names.length : 0;
      const panel = root.querySelector("#result");
      panel.innerHTML = `<h2>Equal split</h2>${metricsHtml([["Total shared expenses", money.format(total)], ["Roommates", names.length], ["Each person pays", money.format(share)]])}${tableHtml([["roommate", "amount"], ...names.map((name) => [name, share.toFixed(2)])])}`;
      panel.hidden = false;
    };
    root.querySelector("#split").click();
  }

  const documentConfigs = {
    "bill-of-sale-generator": {
      fields: [
        ["seller", "Seller full name", "Jordan Taylor"], ["buyer", "Buyer full name", "Morgan Lee"], ["item", "Item being sold", "2018 utility trailer"],
        ["description", "Description / serial number", "VIN or identifying details"], ["price", "Sale price", "2500"], ["date", "Sale date", today()],
        ["location", "City and state", "Evansville, Indiana"]
      ],
      template(v) { return `<h2>Bill of Sale</h2><p>This Bill of Sale records that <strong>${esc(v.seller)}</strong> sells to <strong>${esc(v.buyer)}</strong> the following property:</p><p><strong>${esc(v.item)}</strong><br>${esc(v.description)}</p><p>The buyer agrees to pay <strong>${money.format(num(v.price))}</strong>. The sale takes place on ${esc(v.date)} in ${esc(v.location)}. The property is sold as-is, without warranties except those stated in writing.</p>${signatures(["Seller signature", "Buyer signature"])}`; }
    },
    "rent-receipt-generator": {
      fields: [["landlord", "Landlord / manager", "Taylor Property LLC"], ["tenant", "Tenant", "Morgan Lee"], ["amount", "Amount paid", "1200"], ["period", "Rental period", "June 2026"], ["method", "Payment method", "Check"], ["property", "Property address", "123 Main Street"], ["date", "Payment date", today()]],
      template(v) { return `<h2>Rent Receipt</h2><p>Received from <strong>${esc(v.tenant)}</strong> the amount of <strong>${money.format(num(v.amount))}</strong> for rent covering <strong>${esc(v.period)}</strong> at ${esc(v.property)}.</p><p>Payment method: ${esc(v.method)}<br>Date received: ${esc(v.date)}</p><p>Received by: ${esc(v.landlord)}</p>${signatures(["Landlord / agent signature"])} `; }
    },
    "affidavit-generator": {
      fields: [["name", "Affiant full name", "Jordan Taylor"], ["address", "Affiant address", "123 Main Street"], ["county", "County and state", "Vanderburgh County, Indiana"], ["facts", "Statement of facts", "Describe the facts being affirmed here."], ["date", "Date", today()]],
      template(v) { return `<h2>Affidavit</h2><p>I, <strong>${esc(v.name)}</strong>, residing at ${esc(v.address)}, being duly sworn, state as follows:</p><p>${esc(v.facts).replace(/\n/g, "<br>")}</p><p>I affirm that the foregoing is true and correct to the best of my knowledge.</p><p>Dated: ${esc(v.date)}</p>${signatures(["Affiant signature", "Notary public"])}<p><small>County: ${esc(v.county)}. This general worksheet may require changes to meet local legal requirements.</small></p>`; }
    },
    "printable-receipt-generator": {
      fields: [["from", "Received from", "Morgan Lee"], ["to", "Received by", "Jordan Taylor"], ["amount", "Amount", "150"], ["for", "Payment for", "Used desk"], ["method", "Payment method", "Cash"], ["date", "Date", today()], ["receipt", "Receipt number", `R-${Date.now().toString().slice(-6)}`]],
      template(v) { return `<h2>Receipt</h2><p><strong>Receipt no.</strong> ${esc(v.receipt)}<br><strong>Date:</strong> ${esc(v.date)}</p><p>Received from <strong>${esc(v.from)}</strong> the amount of <strong>${money.format(num(v.amount))}</strong> for ${esc(v.for)}.</p><p>Payment method: ${esc(v.method)}<br>Received by: ${esc(v.to)}</p>${signatures(["Authorized signature"])}`; }
    }
  };
  const signatures = (labels) => `<div class="signature-grid">${labels.map((label) => `<div><div class="signature-line"></div><small>${esc(label)}</small></div>`).join("")}</div>`;

  function renderDocument(config) {
    root.innerHTML = `<form id="document-form"><div class="form-grid">${config.fields.map(([id, label, value]) => fieldHtml({ id, label, value, type: id === "facts" || id === "description" ? "textarea" : id === "date" ? "date" : id === "price" || id === "amount" ? "number" : "text", full: id === "facts" || id === "description" })).join("")}</div><div class="actions"><button class="button primary" type="submit">Create document</button><button id="print-document" class="button" type="button">Print</button></div></form>${resultPanel()}`;
    const form = root.querySelector("form"), panel = root.querySelector("#result");
    const render = () => { panel.innerHTML = `<div class="document-preview">${config.template(values(form))}</div>`; panel.hidden = false; };
    form.addEventListener("submit", (event) => { event.preventDefault(); render(); });
    root.querySelector("#print-document").onclick = () => { render(); window.print(); };
    render();
  }

  function renderInventory() {
    const labels = {
      "mileage-log-generator": ["Date", "Purpose", "Start", "End", "Miles"],
      "equipment-inventory-generator": ["Equipment", "Serial number", "Location", "Value"],
      "business-asset-register": ["Asset", "Category", "Purchase date", "Cost"],
      "home-inventory-generator": ["Item", "Room", "Serial / notes", "Replacement value"],
      "estate-inventory-worksheet": ["Asset / debt", "Type", "Institution / location", "Estimated value"]
    }[slug];
    root.innerHTML = `<div id="inventory-rows" class="repeat-list"></div><div class="actions"><button id="add-item" class="button">Add row</button><button id="download-inventory" class="button primary">Download CSV</button></div>${resultPanel()}`;
    const list = root.querySelector("#inventory-rows");
    const add = () => {
      const row = document.createElement("div"); row.className = "repeat-row";
      row.style.gridTemplateColumns = `repeat(${labels.length}, 1fr) auto`;
      row.innerHTML = labels.map((label) => `<div><label class="group-label">${esc(label)}</label><input></div>`).join("") + `<button class="button danger">Remove</button>`;
      row.querySelector("button").onclick = () => row.remove();
      list.appendChild(row);
    };
    add(); add(); add();
    root.querySelector("#add-item").onclick = add;
    root.querySelector("#download-inventory").onclick = () => {
      const rows = [labels, ...[...list.children].map((row) => [...row.querySelectorAll("input")].map((input) => input.value))];
      download(toCSV(rows), `${slug}.csv`, "text/csv");
      const panel = root.querySelector("#result");
      const valueIndex = labels.length - 1;
      const total = rows.slice(1).reduce((sum, row) => sum + num(row[valueIndex]), 0);
      panel.innerHTML = `<h2>Inventory ready</h2>${metricsHtml([["Rows", rows.length - 1], ["Total of final column", number.format(total)], ["Format", "CSV"]])}`;
      panel.hidden = false;
    };
  }

  function renderInvoiceNumber() {
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "prefix", label: "Prefix", type: "text", value: "INV" })}${fieldHtml({ id: "start", label: "Starting number", value: 1001 })}${fieldHtml({ id: "count", label: "How many", value: 10 })}${fieldHtml({ id: "date", label: "Include date", type: "select", options: [["no", "No"], ["yes", "Yes"]] })}</div><div class="actions"><button id="generate-invoices" class="button primary">Generate numbers</button></div>${resultPanel()}`;
    root.querySelector("#generate-invoices").onclick = () => {
      const prefix = root.querySelector("#field-prefix").value.trim(), start = num(root.querySelector("#field-start").value), count = Math.min(500, num(root.querySelector("#field-count").value));
      const includeDate = root.querySelector("#field-date").value === "yes";
      const datePart = today().replaceAll("-", "");
      const numbers = Array.from({ length: count }, (_, index) => [includeDate ? `${prefix}-${datePart}-${start + index}` : `${prefix}-${start + index}`]);
      showCsvResult(root.querySelector("#result"), [["invoice_number"], ...numbers], "invoice-numbers.csv", `${count} invoice numbers generated`);
    };
    root.querySelector("#generate-invoices").click();
  }

  async function renderUseful() {
    if (slug === "image-dimensions-inspector") {
      root.innerHTML = `${fileInput(true, "image/*")}<div class="actions"><button id="inspect" class="button primary">Inspect images</button></div>${resultPanel()}`;
      root.querySelector("#inspect").onclick = async () => {
        const files = [...root.querySelector("#file-input").files], rows = [["filename", "width", "height", "aspect_ratio", "type", "size_bytes"]];
        for (const file of files) {
          const dimensions = await new Promise((resolve, reject) => {
            const image = new Image(), url = URL.createObjectURL(file);
            image.onload = () => { resolve([image.naturalWidth, image.naturalHeight]); URL.revokeObjectURL(url); };
            image.onerror = reject; image.src = url;
          });
          rows.push([file.name, dimensions[0], dimensions[1], (dimensions[0] / dimensions[1]).toFixed(3), file.type, file.size]);
        }
        showCsvResult(root.querySelector("#result"), rows, "image-dimensions.csv", `${files.length} images inspected`);
      };
    } else if (slug === "filename-cleaner") {
      root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "names", label: "Filenames, one per line", type: "textarea", full: true, value: "IMG_0042 FINAL copy.JPG\nMy Document (1).pdf" })}${fieldHtml({ id: "case", label: "Name style", type: "select", options: [["kebab", "lowercase-dashes"], ["snake", "lowercase_underscores"], ["title", "Title Case"]] })}</div><div class="actions"><button id="clean-names" class="button primary">Clean filenames</button></div>${resultPanel()}`;
      root.querySelector("#clean-names").onclick = () => {
        const style = root.querySelector("#field-case").value;
        const cleaned = root.querySelector("#field-names").value.split(/\r?\n/).filter(Boolean).map((name) => cleanFilename(name, style));
        showTextResult(root.querySelector("#result"), cleaned.join("\n"), "clean-filenames.txt", "Cleaned filenames");
      };
      root.querySelector("#clean-names").click();
    } else if (slug === "bulk-file-renamer") {
      root.innerHTML = `${fileInput(true, "*/*")}<div class="form-grid" style="margin-top:1rem">${fieldHtml({ id: "prefix", label: "Filename prefix", type: "text", value: "file" })}${fieldHtml({ id: "start", label: "Starting number", value: 1 })}</div><div class="actions"><button id="rename" class="button primary">Preview renamed files</button></div>${resultPanel()}`;
      root.querySelector("#rename").onclick = () => {
        const files = [...root.querySelector("#file-input").files], prefix = slugify(root.querySelector("#field-prefix").value) || "file", start = num(root.querySelector("#field-start").value);
        const rows = [["original", "new_name"], ...files.map((file, index) => [file.name, `${prefix}-${String(start + index).padStart(3, "0")}${file.name.includes(".") ? `.${file.name.split(".").pop().toLowerCase()}` : ""}`])];
        showCsvResult(root.querySelector("#result"), rows, "rename-map.csv", `${files.length} new filenames previewed`);
      };
    } else if (slug === "duplicate-photo-detector") {
      root.innerHTML = `${fileInput(true, "image/*")}<div class="actions"><button id="find-duplicates" class="button primary">Find exact duplicates</button></div>${resultPanel()}`;
      root.querySelector("#find-duplicates").onclick = async () => {
        const files = [...root.querySelector("#file-input").files], hashes = new Map(), rows = [["duplicate_file", "matches_file", "size_bytes"]];
        for (const file of files) {
          const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
          if (hashes.has(hash)) rows.push([file.name, hashes.get(hash), file.size]); else hashes.set(hash, file.name);
        }
        showCsvResult(root.querySelector("#result"), rows, "duplicate-photos.csv", `${rows.length - 1} exact duplicates found`);
      };
    } else if (slug === "upc-validator") renderUpc();
    else if (slug === "vin-decoder") renderVin();
    else if (slug === "barcode-generator") renderBarcode();
    else if (slug === "qr-batch-generator") renderQr();
    else if (slug === "screenshot-to-csv" || slug === "screenshot-table-extractor") renderOcr();
  }

  function cleanFilename(name, style) {
    const dot = name.lastIndexOf("."), extension = dot > 0 ? name.slice(dot).toLowerCase() : "", base = dot > 0 ? name.slice(0, dot) : name;
    const words = base.replace(/\b(copy|final|img)\b/gi, " ").replace(/\(\d+\)/g, " ").replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();
    if (style === "title") return `${titleCase(words)}${extension}`;
    const separator = style === "snake" ? "_" : "-";
    return `${words.toLowerCase().replace(/[^a-z0-9]+/g, separator).replace(new RegExp(`^\\${separator}|\\${separator}$`, "g"), "")}${extension}`;
  }
  function renderUpc() {
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "upc", label: "UPC-A (11 or 12 digits)", type: "text", value: "036000291452", full: true })}</div><div class="actions"><button id="validate-upc" class="button primary">Validate UPC</button></div>${resultPanel()}`;
    root.querySelector("#validate-upc").onclick = () => {
      const code = root.querySelector("#field-upc").value.replace(/\D/g, ""), panel = root.querySelector("#result");
      if (![11, 12].includes(code.length)) return showError(panel, "Enter 11 digits to calculate a check digit or 12 digits to validate a UPC-A.");
      const body = code.slice(0, 11), sum = [...body].reduce((total, digit, index) => total + num(digit) * (index % 2 === 0 ? 3 : 1), 0);
      const check = (10 - sum % 10) % 10, valid = code.length === 11 || num(code[11]) === check;
      panel.innerHTML = `<h2>${code.length === 11 ? "Check digit calculated" : valid ? "Valid UPC-A" : "Invalid UPC-A"}</h2>${metricsHtml([["Entered code", code], ["Correct check digit", check], ["Complete UPC", `${body}${check}`]])}`;
      panel.hidden = false;
    };
    root.querySelector("#validate-upc").click();
  }
  function renderVin() {
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "vin", label: "17-character VIN", type: "text", value: "1HGCM82633A004352", full: true })}</div><div class="actions"><button id="decode-vin" class="button primary">Decode VIN</button></div>${resultPanel()}`;
    root.querySelector("#decode-vin").onclick = () => {
      const vin = root.querySelector("#field-vin").value.toUpperCase().replace(/\s/g, ""), panel = root.querySelector("#result");
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return showError(panel, "A VIN must contain 17 characters and cannot include I, O, or Q.");
      const map = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9 };
      const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
      const sum = [...vin].reduce((total, char, index) => total + (num(char) || map[char] || 0) * weights[index], 0);
      const expected = sum % 11 === 10 ? "X" : String(sum % 11), valid = vin[8] === expected;
      const yearCodes = "ABCDEFGHJKLMNPRSTVWXY123456789";
      const index = yearCodes.indexOf(vin[9]);
      const base = index >= 0 ? 1980 + index : 0;
      const currentYear = new Date().getFullYear() + 1;
      const candidates = [base, base + 30, base + 60].filter((year) => year <= currentYear && year >= 1980);
      const modelYear = candidates.at(-1) || "Unknown";
      panel.innerHTML = `<h2>VIN structure</h2>${metricsHtml([["Check digit", valid ? "Valid" : `Invalid (expected ${expected})`], ["Possible model year", modelYear], ["World manufacturer ID", vin.slice(0, 3)]])}<p>Vehicle descriptor: <code>${esc(vin.slice(3, 9))}</code><br>Plant code: <code>${esc(vin[10])}</code><br>Serial: <code>${esc(vin.slice(11))}</code></p>`;
      panel.hidden = false;
    };
    root.querySelector("#decode-vin").click();
  }
  function renderBarcode() {
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "barcode", label: "Barcode value", type: "text", value: "PLAIN-TOOLS-1001", full: true })}</div><div class="actions"><button id="make-barcode" class="button primary">Generate barcode</button></div>${resultPanel()}`;
    root.querySelector("#make-barcode").onclick = async () => {
      const panel = root.querySelector("#result");
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js", "JsBarcode");
        panel.innerHTML = `<h2>CODE128 barcode</h2><svg id="barcode-output"></svg><div class="actions"><button id="download-barcode" class="button">Download SVG</button></div>`;
        panel.hidden = false;
        JsBarcode("#barcode-output", root.querySelector("#field-barcode").value, { format: "CODE128", lineColor: "#142232", width: 2, height: 90, displayValue: true, margin: 12 });
        panel.querySelector("#download-barcode").onclick = () => download(new XMLSerializer().serializeToString(panel.querySelector("svg")), "barcode.svg", "image/svg+xml");
      } catch { showError(panel, "The barcode library could not load. Check your internet connection and try again."); }
    };
  }
  function renderQr() {
    root.innerHTML = `<div class="form-grid">${fieldHtml({ id: "qr", label: "One URL or text value per line", type: "textarea", value: "https://niftyutilities.com\nNifty Utilities", full: true })}</div><div class="actions"><button id="make-qr" class="button primary">Generate QR codes</button></div>${resultPanel()}`;
    root.querySelector("#make-qr").onclick = async () => {
      const panel = root.querySelector("#result");
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js", "QRCode");
        const items = root.querySelector("#field-qr").value.split(/\r?\n/).filter(Boolean).slice(0, 50);
        panel.innerHTML = `<h2>${items.length} QR codes</h2><div id="qr-grid" class="tool-grid"></div>`;
        panel.hidden = false;
        items.forEach((item, index) => {
          const card = document.createElement("div"); card.className = "tool-card"; card.innerHTML = `<div id="qr-${index}"></div><p>${esc(item)}</p><button class="button">Download PNG</button>`;
          panel.querySelector("#qr-grid").appendChild(card);
          new QRCode(card.querySelector(`#qr-${index}`), { text: item, width: 150, height: 150, correctLevel: QRCode.CorrectLevel.M });
          card.querySelector("button").onclick = () => {
            const canvas = card.querySelector("canvas");
            if (canvas) { const link = document.createElement("a"); link.download = `qr-${index + 1}.png`; link.href = canvas.toDataURL("image/png"); link.click(); }
          };
        });
      } catch { showError(panel, "The QR library could not load. Check your internet connection and try again."); }
    };
  }
  function renderOcr() {
    root.innerHTML = `${fileInput(false, "image/*")}<p class="notice">OCR runs in your browser after a recognition library downloads. Clear, tightly cropped screenshots work best.</p><div class="actions"><button id="run-ocr" class="button primary">Extract table text</button></div>${resultPanel()}`;
    root.querySelector("#run-ocr").onclick = async () => {
      const file = root.querySelector("#file-input").files[0], panel = root.querySelector("#result");
      if (!file) return showError(panel, "Choose a screenshot first.");
      panel.hidden = false; panel.innerHTML = "<h2>Reading screenshot…</h2><p>This can take a minute on the first run.</p>";
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js", "Tesseract");
        const result = await Tesseract.recognize(file, "eng", { logger: (message) => {
          if (message.progress) panel.querySelector("p").textContent = `${titleCase(message.status)}: ${Math.round(message.progress * 100)}%`;
        }});
        const lines = result.data.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const rows = lines.map((line) => line.includes("\t") ? line.split("\t") : line.split(/\s{2,}/));
        showCsvResult(panel, rows.length ? rows : [["text"], [result.data.text]], "screenshot.csv", `${rows.length} lines extracted`);
      } catch { showError(panel, "OCR could not load or process this image. Check your connection and try a clearer screenshot."); }
    };
  }

  const pad2 = (value) => String(value).padStart(2, "0");
  const isoDate = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const compactDate = (date) => `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  const parseIso = (value) => {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return parts ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])) : null;
  };
  const addMonths = (date, months) => {
    const result = new Date(date.getTime());
    const day = result.getDate();
    result.setMonth(result.getMonth() + months);
    if (result.getDate() < day) result.setDate(0);
    return result;
  };

  function guessReceiptFields(text) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    let date = "";
    for (const line of lines) {
      let match = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/.exec(line);
      if (match) {
        let [, a, b, year] = match;
        year = year.length === 2 ? `20${year}` : year;
        const parsed = new Date(Number(year), Number(a) - 1, Number(b));
        if (!Number.isNaN(parsed.getTime())) { date = isoDate(parsed); break; }
      }
      match = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(line);
      if (match) { date = `${match[1]}-${match[2]}-${match[3]}`; break; }
      match = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i.exec(line);
      if (match) {
        const parsed = new Date(Number(match[3]), months[match[1].toLowerCase()], Number(match[2]));
        if (!Number.isNaN(parsed.getTime())) { date = isoDate(parsed); break; }
      }
    }
    let amount = "";
    const totalLine = lines.find((line) => /\b(grand\s+total|total|amount\s+due|balance\s+due)\b/i.test(line) && /\d/.test(line) && !/subtotal/i.test(line));
    const pickAmount = (line) => {
      const found = [...line.matchAll(/\$?\s?(\d[\d,]*\.\d{2})/g)].map((m) => Number(m[1].replace(/,/g, "")));
      return found.length ? Math.max(...found) : null;
    };
    if (totalLine) { const value = pickAmount(totalLine); if (value !== null) amount = value.toFixed(2); }
    if (!amount) {
      const all = lines.flatMap((line) => [...line.matchAll(/\$?\s?(\d[\d,]*\.\d{2})/g)].map((m) => Number(m[1].replace(/,/g, ""))));
      if (all.length) amount = Math.max(...all).toFixed(2);
    }
    const merchant = lines.find((line) => /[a-z]/i.test(line) && line.replace(/[^a-z]/gi, "").length >= 3 && !/receipt|invoice|order|thank/i.test(line)) || "";
    return { date, amount, merchant: titleCase(merchant.replace(/[^a-z0-9 &'.-]/gi, "").trim()).slice(0, 60) };
  }

  function renderWarranty() {
    const warrantyOptions = [["3", "3 months"], ["6", "6 months"], ["12", "1 year"], ["24", "2 years"], ["36", "3 years"], ["60", "5 years"], ["120", "10 years"]];
    root.innerHTML = `
      ${fileInput(false, "image/*")}
      <p class="notice">Optional: scan a receipt photo to pre-fill the fields below. OCR runs in your browser after a recognition library downloads. You can also skip the scan and type the details in directly.</p>
      <div class="actions"><button id="scan-receipt" class="button">Scan receipt</button></div>
      <div id="scan-status"></div>
      <div class="form-grid" style="margin-top:1rem">
        ${fieldHtml({ id: "merchant", label: "Merchant or item", type: "text", placeholder: "e.g. Acme Appliances — Washer", full: true })}
        ${fieldHtml({ id: "date", label: "Purchase date", type: "date", value: today() })}
        ${fieldHtml({ id: "amount", label: "Amount paid", type: "number", placeholder: "0.00" })}
        ${fieldHtml({ id: "length", label: "Warranty length", type: "select", options: warrantyOptions })}
      </div>
      <div class="actions"><button id="make-warranty" class="button primary">Create warranty reminder</button></div>
      ${resultPanel()}`;
    const status = root.querySelector("#scan-status");
    root.querySelector("#scan-receipt").onclick = async () => {
      const file = root.querySelector("#file-input").files[0];
      if (!file) { status.innerHTML = `<p class="notice">Choose a receipt image first.</p>`; return; }
      status.innerHTML = `<p class="notice">Reading receipt… this can take a minute on the first run.</p>`;
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js", "Tesseract");
        const result = await Tesseract.recognize(file, "eng", { logger: (message) => {
          if (message.progress) status.querySelector("p").textContent = `${titleCase(message.status)}: ${Math.round(message.progress * 100)}%`;
        }});
        const guess = guessReceiptFields(result.data.text);
        if (guess.merchant) root.querySelector("#field-merchant").value = guess.merchant;
        if (guess.date) root.querySelector("#field-date").value = guess.date;
        if (guess.amount) root.querySelector("#field-amount").value = guess.amount;
        status.innerHTML = `<p class="notice">Receipt scanned. Check the fields below and correct anything OCR misread before creating the reminder.</p>`;
      } catch { status.innerHTML = `<p class="notice">OCR could not load or read this image. You can still enter the details by hand below.</p>`; }
    };
    root.querySelector("#make-warranty").onclick = () => {
      const panel = root.querySelector("#result");
      const merchant = root.querySelector("#field-merchant").value.trim() || "Purchase";
      const amount = num(root.querySelector("#field-amount").value);
      const purchase = parseIso(root.querySelector("#field-date").value);
      if (!purchase) return showError(panel, "Enter a valid purchase date.");
      const months = num(root.querySelector("#field-length").value);
      const expires = addMonths(purchase, months);
      const reminderEnd = new Date(expires.getTime()); reminderEnd.setDate(reminderEnd.getDate() + 1);
      const title = `Warranty expires: ${merchant}`;
      const details = [
        `Warranty expiration reminder from Nifty Utilities.`,
        `Item: ${merchant}`,
        amount ? `Amount paid: ${money.format(amount)}` : "",
        `Purchased: ${isoDate(purchase)}`,
        `Warranty length: ${months} month${months === 1 ? "" : "s"}`,
        `Keep your receipt and proof of purchase to make a claim.`
      ].filter(Boolean).join("\n");
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${compactDate(expires)}/${compactDate(reminderEnd)}&details=${encodeURIComponent(details)}`;
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nifty Utilities//Warranty Tracker//EN", "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${compactDate(expires)}-${slugify(merchant) || "warranty"}@niftyutilities.com`,
        `DTSTAMP:${compactDate(new Date())}T000000Z`,
        `DTSTART;VALUE=DATE:${compactDate(expires)}`,
        `DTEND;VALUE=DATE:${compactDate(reminderEnd)}`,
        `SUMMARY:${title.replace(/([,;\\])/g, "\\$1")}`,
        `DESCRIPTION:${details.replace(/\n/g, "\\n").replace(/([,;\\])/g, "\\$1")}`,
        "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${title.replace(/([,;\\])/g, "\\$1")}`, "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      panel.innerHTML = `<h2>Warranty reminder ready</h2>${metricsHtml([
        ["Item", merchant],
        ["Purchased", isoDate(purchase)],
        ["Warranty expires", isoDate(expires)],
        ...(amount ? [["Amount paid", money.format(amount)]] : [])
      ])}<div class="actions"><a class="button primary" href="${esc(gcalUrl)}" target="_blank" rel="noopener">Add to Google Calendar</a><button id="download-ics" class="button">Download .ics file</button></div><p class="notice">The calendar event is all-day on the expiration date with a reminder 7 days earlier. The .ics file works with Apple Calendar, Outlook, and most other apps.</p>`;
      panel.hidden = false;
      panel.querySelector("#download-ics").onclick = () => download(ics, `${slugify(merchant) || "warranty"}-expires-${compactDate(expires)}.ics`, "text/calendar");
    };
  }

  function renderMeasure() {
    root.innerHTML = `
      ${fileInput(false, "image/*")}
      <p class="notice">Upload a straight-on photo or screenshot. Draw one line over something whose real length you know, enter that length, then draw more lines or a box to measure the rest. This is a flat 2D scale — it is accurate only for objects in the same plane as your reference, photographed straight on. Treat results as estimates.</p>
      <div id="measure-stage" hidden>
        <div class="form-grid" style="margin-bottom:.75rem">
          ${fieldHtml({ id: "known", label: "Known length of reference line", type: "number", value: 36, placeholder: "36" })}
          ${fieldHtml({ id: "unit", label: "Unit", type: "select", options: [["in", "inches"], ["ft", "feet"], ["cm", "centimeters"], ["m", "meters"]] })}
          ${fieldHtml({ id: "mode", label: "Drawing mode", type: "select", options: [["reference", "Set reference line"], ["line", "Measure a line"], ["area", "Measure a box (area)"]] })}
        </div>
        <div class="actions" style="margin-bottom:.75rem"><button id="measure-clear" class="button" type="button">Clear drawings</button></div>
        <div style="overflow:auto;border:1px solid var(--border,#d8dee6);border-radius:8px"><canvas id="measure-canvas" style="display:block;max-width:100%;touch-action:none;cursor:crosshair"></canvas></div>
      </div>
      ${resultPanel()}`;
    const stage = root.querySelector("#measure-stage");
    const canvas = root.querySelector("#measure-canvas");
    const ctx = canvas.getContext("2d");
    const panel = root.querySelector("#result");
    let image = null;
    let reference = null; // {a, b} in canvas pixels
    const shapes = []; // {type:'line'|'area', a, b}
    let drawing = null;
    let unitsPerPixel = 0;

    const refLen = () => num(root.querySelector("#field-known").value);
    const unit = () => root.querySelector("#field-unit").value;
    const mode = () => root.querySelector("#field-mode").value;
    const pixelLen = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

    const pointFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
    };

    const recalc = () => {
      unitsPerPixel = reference && pixelLen(reference.a, reference.b) > 0 ? refLen() / pixelLen(reference.a, reference.b) : 0;
    };

    const redraw = () => {
      if (!image) return;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const lineWidth = Math.max(2, canvas.width / 400);
      const fontSize = Math.max(14, Math.round(canvas.width / 45));
      ctx.lineWidth = lineWidth;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = "bottom";
      const label = (text, x, y, color) => {
        ctx.font = `${fontSize}px sans-serif`;
        const width = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(x, y - fontSize - 4, width + 8, fontSize + 6);
        ctx.fillStyle = color;
        ctx.fillText(text, x + 4, y - 2);
      };
      const drawSeg = (a, b, color) => {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        for (const point of [a, b]) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(point.x, point.y, lineWidth * 1.8, 0, Math.PI * 2); ctx.fill(); }
      };
      if (reference) {
        drawSeg(reference.a, reference.b, "#0085ff");
        label(`ref: ${number.format(refLen())} ${unit()}`, (reference.a.x + reference.b.x) / 2, (reference.a.y + reference.b.y) / 2, "#0085ff");
      }
      for (const shape of shapes) {
        if (shape.type === "line") {
          drawSeg(shape.a, shape.b, "#e0383e");
          const text = unitsPerPixel ? `${number.format(Math.round(pixelLen(shape.a, shape.b) * unitsPerPixel * 100) / 100)} ${unit()}` : "set reference first";
          label(text, (shape.a.x + shape.b.x) / 2, (shape.a.y + shape.b.y) / 2, "#e0383e");
        } else {
          const x = Math.min(shape.a.x, shape.b.x), y = Math.min(shape.a.y, shape.b.y);
          const w = Math.abs(shape.b.x - shape.a.x), h = Math.abs(shape.b.y - shape.a.y);
          ctx.strokeStyle = "#1c8a4d"; ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = "rgba(28,138,77,0.12)"; ctx.fillRect(x, y, w, h);
          const text = unitsPerPixel ? `${number.format(Math.round(w * unitsPerPixel * 100) / 100)} × ${number.format(Math.round(h * unitsPerPixel * 100) / 100)} ${unit()}` : "set reference first";
          label(text, x, y + fontSize + 4, "#1c8a4d");
        }
      }
      if (drawing) {
        const color = drawing.type === "reference" ? "#0085ff" : drawing.type === "area" ? "#1c8a4d" : "#e0383e";
        if (drawing.type === "area") { const x = Math.min(drawing.a.x, drawing.b.x), y = Math.min(drawing.a.y, drawing.b.y); ctx.strokeStyle = color; ctx.strokeRect(x, y, Math.abs(drawing.b.x - drawing.a.x), Math.abs(drawing.b.y - drawing.a.y)); }
        else drawSeg(drawing.a, drawing.b, color);
      }
    };

    const showResults = () => {
      recalc();
      if (!unitsPerPixel) { panel.hidden = true; redraw(); return; }
      const u = unit();
      const metrics = [];
      shapes.forEach((shape, index) => {
        if (shape.type === "line") {
          metrics.push([`Line ${index + 1}`, `${number.format(Math.round(pixelLen(shape.a, shape.b) * unitsPerPixel * 100) / 100)} ${u}`]);
        } else {
          const w = Math.abs(shape.b.x - shape.a.x) * unitsPerPixel, h = Math.abs(shape.b.y - shape.a.y) * unitsPerPixel;
          metrics.push([`Box ${index + 1}`, `${number.format(Math.round(w * 100) / 100)} × ${number.format(Math.round(h * 100) / 100)} ${u} = ${number.format(Math.round(w * h * 100) / 100)} ${u}²`]);
        }
      });
      if (!metrics.length) { panel.hidden = true; redraw(); return; }
      panel.innerHTML = `<h2>Measurements</h2>${metricsHtml(metrics)}<p class="notice">Estimates from a flat 2D scale relative to your reference line. Accuracy depends on a straight-on photo and a correct reference length.</p>`;
      panel.hidden = false;
      redraw();
    };

    root.querySelector("#file-input").onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        image = img;
        const maxWidth = 1200;
        const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        reference = null; shapes.length = 0; drawing = null; unitsPerPixel = 0;
        stage.hidden = false; panel.hidden = true;
        redraw();
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    };

    canvas.addEventListener("pointerdown", (event) => {
      if (!image) return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      drawing = { type: mode(), a: point, b: point };
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      drawing.b = pointFromEvent(event);
      redraw();
    });
    const finish = (event) => {
      if (!drawing) return;
      drawing.b = pointFromEvent(event);
      if (pixelLen(drawing.a, drawing.b) >= 4) {
        if (drawing.type === "reference") reference = { a: drawing.a, b: drawing.b };
        else shapes.push(drawing);
      }
      drawing = null;
      showResults();
    };
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", () => { drawing = null; redraw(); });

    root.querySelector("#field-known").addEventListener("input", showResults);
    root.querySelector("#field-unit").addEventListener("change", showResults);
    root.querySelector("#measure-clear").onclick = () => { reference = null; shapes.length = 0; drawing = null; unitsPerPixel = 0; panel.hidden = true; redraw(); };
  }

  const financeUploaders = new Set([
    "bank-statement-cleaner", "recurring-subscription-finder", "merchant-name-normalizer", "personal-spending-categorizer",
    "duplicate-transaction-finder", "csv-bank-format-converter", "credit-card-statement-analyzer"
  ]);
  const csvTools = new Set([
    "merge-csv-files", "split-csv-files", "remove-duplicate-rows", "compare-two-csvs", "excel-to-csv-cleaner",
    "column-mapper", "csv-formula-generator", "spreadsheet-error-finder", "delimiter-converter", "json-csv-converter"
  ]);
  const inventories = new Set(["mileage-log-generator", "equipment-inventory-generator", "business-asset-register", "home-inventory-generator", "estate-inventory-worksheet"]);
  const useful = new Set(["screenshot-to-csv", "screenshot-table-extractor", "image-dimensions-inspector", "bulk-file-renamer", "filename-cleaner", "duplicate-photo-detector", "qr-batch-generator", "barcode-generator", "upc-validator", "vin-decoder"]);

  if (calculators[slug]) renderCalculator(calculators[slug]);
  else if (financeUploaders.has(slug)) renderFinanceUploader();
  else if (csvTools.has(slug)) renderCsvTool();
  else if (slug === "debt-snowball-calculator") renderDebt("snowball");
  else if (slug === "debt-avalanche-calculator") renderDebt("avalanche");
  else if (slug === "net-worth-tracker") renderNetWorth();
  else if (slug === "roommate-expense-splitter") renderRoommateSplitter();
  else if (documentConfigs[slug]) renderDocument(documentConfigs[slug]);
  else if (inventories.has(slug)) renderInventory();
  else if (slug === "invoice-number-generator") renderInvoiceNumber();
  else if (slug === "receipt-warranty-tracker") renderWarranty();
  else if (slug === "screenshot-measurement-calculator") renderMeasure();
  else if (useful.has(slug)) renderUseful();
  else root.innerHTML = `<p class="error">This tool could not be loaded.</p>`;
})();
