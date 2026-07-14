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
const ADSENSE_PUBLISHER_ID = "ca-pub-2401477533817135";

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

// Flip to true once AdSense approves the site and you're ready to show live ads.
// While false, the grey "Advertisement" placeholder boxes are not rendered, so
// neither visitors nor the AdSense reviewer see empty labeled boxes during review.
const ADS_LIVE = false;
const adWide = ADS_LIVE ? `<div class="ad-slot ad-slot-wide" aria-label="Advertisement">Advertisement</div>` : "";
const adTall = ADS_LIVE ? `<div class="ad-slot ad-slot-tall" aria-label="Advertisement">Advertisement</div>` : "";

// Long-form, topic-specific content for high-intent / high-ad-value pages, keyed by
// tool slug. When a slug has an entry here, it replaces the generic "About / How it
// works" block on that tool page (the privacy callout, "Important" disclaimer, and
// Support note still wrap around it). Pages without an entry keep the generic block.
// Section headings should mirror the tool's real calculator inputs so the article and
// the tool reinforce each other. Avoid asserting specific dollar figures as fact;
// describe cost drivers and frame any number as a range to verify.
const toolContent = {
  "real-cost-of-owning-a-pool": `
                <h2>What does it really cost to own a pool each year?</h2>
                <p>The installation price is a one-time decision, but the annual operating costs continue every year you own the pool. For many homeowners those running costs add up to more than they expected before the first swim season. This calculator totals the six main cost categories so you can see a realistic annual and monthly figure before committing to ownership.</p>
                <h2>Chemicals and supplies</h2>
                <p>Keeping water safe and balanced requires chlorine or salt, pH adjusters, algaecides, clarifiers, and test kits throughout the season. Chemical costs vary by pool volume, local water chemistry, and how frequently the pool is used. A salt chlorine generator shifts chemical purchases toward salt and cell maintenance rather than liquid or tablet chlorine, which changes the mix of costs but rarely eliminates them entirely.</p>
                <h2>Pump and heating energy</h2>
                <p>The circulation pump is typically the largest electricity draw for a pool. Variable-speed pumps run more efficiently than single-speed models and can meaningfully lower this line. Heating adds to energy costs based on fuel type, the temperature differential you target, how many months you heat, and how well the pool is covered when not in use. Energy costs vary significantly by region and utility rates.</p>
                <h2>Cleaning and service</h2>
                <p>Weekly service typically covers brushing, vacuuming, skimming, and a chemical check. Professional service is convenient but is one of the larger recurring costs. Doing your own weekly maintenance reduces this line substantially, though it shifts the time cost to you. Seasonal opening and closing services are usually separate from the weekly rate and should be budgeted on their own.</p>
                <h2>Insurance increase</h2>
                <p>A pool is considered an attractive nuisance by most insurers and typically triggers a homeowners insurance surcharge. The amount varies by insurer, your policy limits, whether you have a fence and cover, and your location. Contact your insurer for an accurate figure; the default in this calculator is a placeholder to prompt that inquiry.</p>
                <h2>Repairs reserve</h2>
                <p>Pools need periodic repairs that are hard to predict but easy to overlook in a budget. Plaster or liner resurfacing, pump or filter replacement, heater repairs, and coping or tile work are common multi-year expenses. Setting aside a repairs reserve each year prevents any one repair from being a financial surprise. Older pools and pools in climates with hard winters tend to require more frequent work.</p>
                <h2>Water</h2>
                <p>Filling a pool at startup and topping off for evaporation and splash loss adds to water utility costs each season. The amount depends on pool size, climate, and how aggressively you manage evaporation with a cover. In areas with tiered utility pricing or seasonal drought restrictions, water costs can be higher than expected.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your best estimate for each cost category. If you are researching before buying, local pool service companies can give ballpark figures for your area and pool size. The calculator produces an annual total and a monthly average you can weigh against the enjoyment and home value factors on the other side of the decision. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>How much does a pool cost per month to maintain?</h3>
                <p>Monthly operating costs depend heavily on pool size, whether you heat it, and whether you hire a service company. The range is wide, and the only way to get a number you can trust is to add up the actual costs for your specific pool type, climate, and service preferences using a calculator like this one.</p>
                <h3>Does a pool add value to a home?</h3>
                <p>A pool may add market value in climates where pools are in high demand and well-maintained properties command a premium. In other markets it can be neutral or even a drawback for buyers who do not want the maintenance obligation. Local real estate conditions matter more than any general rule.</p>
                <h3>Is it cheaper to maintain a pool yourself?</h3>
                <p>Doing your own weekly brushing, vacuuming, and chemical testing can reduce the service cost significantly compared to hiring a professional service company each week. However, you will still need to purchase chemicals and equipment, and you take on the time commitment and the learning curve. Many owners hire out seasonal opening and closing while handling weekly tasks themselves.</p>`,

  "real-cost-of-owning-an-rv": `
                <h2>What does it really cost to own an RV each year?</h2>
                <p>The sticker price is only the beginning. RV ownership comes with a recurring annual carrying cost that covers loan payments, where you store the vehicle, fuel for trips, insurance, upkeep, and campsite fees. Adding these together before you buy gives you a realistic picture of what the lifestyle actually costs each year, not just what the dealer quotes on a monthly payment.</p>
                <h2>Financing</h2>
                <p>Most RVs are financed, and loan terms can stretch long enough that the monthly payment looks manageable while the total interest paid is substantial. RV loan rates tend to be higher than mortgage rates and vary with credit score, loan term, and lender. Enter your purchase price, down payment, interest rate, and loan term to see how the financing cost fits into the overall picture. A larger down payment reduces the monthly obligation and the total interest, which is worth modeling before you finalize a purchase.</p>
                <h2>Storage</h2>
                <p>Most residential areas do not allow long-term RV parking in a driveway or on the street, which means renting storage for most of the year. Indoor climate-controlled storage costs more than outdoor covered or uncovered lots. Storage rates vary by region and facility type, and they are a fixed cost you pay whether or not you use the RV. Owners in rural areas or with enough property may be able to store at home, which removes this line entirely.</p>
                <h2>Trip fuel</h2>
                <p>RVs are among the least fuel-efficient vehicles on the road, and fuel costs scale quickly with trip distance and frequency. Mileage varies by class, size, engine, and driving conditions. Estimating your annual miles is the most important input here, because fuel can rival or exceed the loan payment for active travelers. Enter a realistic annual mileage and cost per mile to see what your travel habit actually costs.</p>
                <h2>Insurance</h2>
                <p>RV insurance covers the vehicle, its contents, and liability, and the premium depends on vehicle value, class, how many months per year you use it, and your driving history. Full-timer coverage for people who live in their RV year-round costs more than recreational policies. Rates vary by state and insurer; get a quote specific to your vehicle rather than estimating from general ranges.</p>
                <h2>Maintenance</h2>
                <p>Routine maintenance on an RV includes oil changes, tire rotation and replacement, roof seals, slide seals, and generator service, among other items. An older unit or one that sits for long periods between uses tends to need more attention. Because RVs combine automotive, plumbing, electrical, and appliance systems, repair costs can accumulate faster than with a conventional vehicle. A maintenance reserve helps absorb repairs without derailing your travel budget.</p>
                <h2>Campsites</h2>
                <p>Campsite fees range from free dispersed camping on public land to full-hookup resort sites that can cost as much per night as a hotel room. Your annual campsite cost depends entirely on how many nights you travel and where you prefer to stay. Membership programs and seasonal passes can reduce per-night rates for frequent travelers. Enter a realistic estimate based on your planned trips rather than the minimum possible cost.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your financing terms, then estimate each annual cost category honestly based on your planned usage. The result is an all-in annual and monthly cost you can compare to alternative vacation spending. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the true annual cost of RV ownership?</h3>
                <p>Total annual cost varies widely based on vehicle class, financing terms, how often you travel, and where you store and camp. The only reliable number is one built from your own financing terms, storage situation, fuel estimate, and insurance quote, which is exactly what this calculator produces.</p>
                <h3>Is renting an RV cheaper than owning one?</h3>
                <p>For occasional travelers, renting is often cheaper when you factor in all ownership costs. Renting avoids the loan payment, storage, insurance, and depreciation. Ownership generally becomes more cost-effective for those who use the RV frequently enough to spread the fixed costs across many nights.</p>
                <h3>How much does an RV depreciate?</h3>
                <p>RVs typically depreciate quickly in the first few years after purchase, similar to or faster than automobiles. Depreciation is not included in this calculator, but it is a real economic cost that matters if you plan to sell. Buying used shifts the steepest depreciation to a prior owner.</p>`,

  "rent-vs-buy-calculator": `
                <h2>Should you rent or buy a home?</h2>
                <p>The rent-versus-buy decision is one of the largest financial choices most people make, and the right answer depends on your numbers, not on the conventional wisdom that buying is always better. This calculator compares the estimated cost of renting against the net cost of buying over a period you choose, so you can see which comes out ahead under your specific circumstances.</p>
                <h2>Monthly rent</h2>
                <p>The monthly rent figure is your baseline for the renting side of the comparison. If you expect rent to increase over the comparison period, keep in mind that this calculator holds it flat; the actual renting cost may be higher if rents rise in your area. Utilities and renters insurance are separate and not included here.</p>
                <h2>Home price and down payment</h2>
                <p>The home price and down payment determine your loan amount. A larger down payment reduces your monthly mortgage and the total interest you pay, but it also represents capital that could be invested elsewhere. The opportunity cost of tying up a down payment in home equity is a real consideration, though this calculator does not model investment returns on the alternative.</p>
                <h2>Mortgage rate and loan term</h2>
                <p>These two inputs drive the monthly loan payment on the buying side. A higher rate or shorter term raises the monthly payment. The rate you can actually lock depends on your credit, lender, and market conditions at the time of purchase. Use a realistic rate from a lender quote rather than the best case.</p>
                <h2>Property tax and home insurance</h2>
                <p>Property tax and insurance are ownership costs that come on top of the mortgage payment. Property taxes vary significantly by state and county; the effective rate for your specific property is available from your county assessor. Home insurance rates depend on location, coverage level, and property characteristics.</p>
                <h2>Annual maintenance</h2>
                <p>Owners pay for repairs and upkeep that renters do not. The maintenance percentage field expresses annual maintenance as a share of home value. A one-percent estimate is a common starting point, but older homes, larger properties, and more complex systems typically cost more. This cost is sometimes overlooked by first-time buyers comparing their mortgage payment to their rent.</p>
                <h2>Home appreciation and comparison period</h2>
                <p>Appreciation is what makes buying a wealth-building exercise over time, but it is not guaranteed. The calculator applies the appreciation rate you enter to estimate the home's future value and the equity you would hold at the end of the comparison period. A longer comparison period generally favors buying because more equity accumulates and upfront costs get spread across more years.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your current or expected rent, the home you are considering, and realistic estimates for taxes, insurance, and maintenance. Adjust the comparison period to match how long you expect to stay. The result shows estimated monthly ownership cost alongside your rent and a net-cost comparison for the full period. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>How long do you need to stay in a home for buying to make financial sense?</h3>
                <p>The break-even point depends on your specific numbers, but it generally takes several years to recoup transaction costs through equity and appreciation. Areas with high prices, low appreciation, or high property taxes extend that break-even period. This calculator lets you try different time horizons to find where buying starts to come out ahead in your scenario.</p>
                <h3>Is it always better to buy than to rent?</h3>
                <p>No. In high-cost markets, with a short expected stay, or when interest rates are elevated, renting can be the more economical choice. The calculator may show renting as cheaper over your chosen period, which is a legitimate outcome based on the numbers, not a sign that something is wrong.</p>
                <h3>Does this calculator account for tax deductions?</h3>
                <p>No. Mortgage interest and property tax deductions can reduce the effective cost of owning for some buyers, but their impact depends on whether you itemize deductions, your marginal tax rate, and the standard deduction in effect. A tax professional is the right resource for modeling deduction benefit in your situation.</p>`,

  "lease-vs-buy-calculator": `
                <h2>Is it cheaper to lease or buy a vehicle?</h2>
                <p>Leasing and buying both get you into a car, but they differ in what you actually pay, what you own at the end, and how the numbers compare over the same period. This calculator works through the net cost of each option over the lease term so you can make a side-by-side comparison based on real figures rather than monthly-payment comparisons, which can be misleading.</p>
                <h2>Lease due at signing and monthly payment</h2>
                <p>Money due at signing includes the first payment, capitalized cost reduction, acquisition fee, and any other drive-off costs. The monthly payment covers the depreciation on the vehicle during the lease plus a financing charge. Lower monthly payments often reflect a longer term, a lower residual, or costs shifted into the drive-off amount, so the total of all payments is more meaningful than the monthly figure alone.</p>
                <h2>Lease term and end-of-term fees</h2>
                <p>Most leases run 24 to 39 months. At lease end, disposition fees, excess mileage charges, and wear-and-tear assessments can add to the total. Enter a realistic estimate for these end-of-term costs based on your expected mileage and driving habits. If you plan to buy the vehicle at lease end, the structure of the decision changes and this calculator is better suited to the standard return scenario.</p>
                <h2>Purchase price and down payment</h2>
                <p>The purchase price is what you negotiate with the dealer, not the MSRP. A larger down payment reduces the loan amount and the total interest paid. It also means more money out of pocket upfront, which is worth comparing to the lease's lower initial outlay.</p>
                <h2>Loan APR and term</h2>
                <p>These determine your monthly loan payment and total financing cost if you buy. Loan terms have lengthened in recent years, which lowers the payment but increases interest paid. For a fair comparison with the lease, the calculator looks at costs over the same number of months as the lease, not the full loan term.</p>
                <h2>Estimated vehicle value at end of lease term</h2>
                <p>If you buy, the vehicle has residual value at the end of the comparison period. This field captures that value. The difference between the vehicle's value and what you still owe on the loan at that point is your equity, which reduces the net cost of buying. A higher residual value tends to make buying look more favorable relative to leasing.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the lease terms you have been quoted and the purchase alternative for the same vehicle. The result shows the net cost of each option over the lease period so you can see which is lower for your specific numbers. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>Why is leasing more expensive if the payments are lower?</h3>
                <p>Monthly lease payments are lower because you are paying for depreciation only, not the full vehicle value. But at the end of the lease you own nothing, whereas a purchase builds equity. When you account for the equity you hold at the end of the term, buying often produces a lower net cost even with higher payments.</p>
                <h3>When does leasing make more financial sense than buying?</h3>
                <p>Leasing can come out ahead when the vehicle depreciates quickly relative to what you are paying in a loan, when you change vehicles frequently, or when total lease costs are structured favorably. Business owners who can deduct lease payments may also find leasing advantageous depending on their tax situation.</p>
                <h3>Should I put money down on a lease?</h3>
                <p>A larger payment at signing reduces monthly payments but does not reduce the total you pay in most cases. If you are in an accident early in the lease and the car is declared a total loss, money paid upfront may not be recoverable. Many financial advisors suggest keeping drive-off payments low on a lease for this reason.</p>`,

  "property-tax-estimator": `
                <h2>How to estimate your annual property tax</h2>
                <p>Property taxes are one of the most significant ongoing costs of homeownership, yet many buyers focus on the mortgage payment and underestimate what they will owe on their tax bill. This calculator walks through the four inputs that determine most property tax bills so you can produce a reasonable estimate before buying or budgeting for the year ahead.</p>
                <h2>Market value</h2>
                <p>Market value is what your property would reasonably sell for in an arm's-length transaction. Assessors use this as a starting point, but your property may be assessed at a different value depending on when the assessor last visited and what methodology the jurisdiction uses. If you are estimating before purchase, use the purchase price as a reasonable proxy for market value.</p>
                <h2>Assessment ratio</h2>
                <p>Most jurisdictions do not tax the full market value. Instead they apply an assessment ratio to determine the assessed value that is actually subject to tax. Assessment ratios vary widely by state and sometimes by property type. Some states assess at full market value, making the ratio effectively 100 percent; others assess at 80 percent, 40 percent, or some other fraction. Check your county assessor or your state's department of revenue for the rate that applies to your property.</p>
                <h2>Exemptions</h2>
                <p>Many jurisdictions offer exemptions that reduce the taxable assessed value. A homestead exemption for primary residences is the most common, but senior citizen exemptions, veteran exemptions, and disability exemptions also exist in many states. Exemptions are subtracted from the assessed value before the tax rate is applied, so they reduce the tax bill dollar for dollar at the margin. The exemption amounts in this calculator are placeholders; verify the actual amounts available in your jurisdiction.</p>
                <h2>Tax rate</h2>
                <p>The tax rate, sometimes expressed as a millage rate, is applied to the net taxable assessed value to produce the tax bill. Rates vary dramatically across the country and even within a single county when special levies for schools, fire districts, or other purposes are added on top of the base rate. Your county assessor's website or a recent tax bill for a comparable property in the area is the most reliable source for the actual rate.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the market value of the property, the applicable assessment ratio and any exemptions for your jurisdiction, and the combined tax rate. The result is an estimated annual and monthly tax amount. Treat this as an approximation; the actual bill from the taxing authority will reflect any adjustments, appeals, or special assessments not captured here. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is a millage rate?</h3>
                <p>A millage rate expresses the tax in dollars per thousand dollars of taxable value. A rate of 12 mills means you pay 12 dollars in tax for every 1,000 dollars of taxable assessed value. Converting to a percentage, 12 mills is 1.2 percent. Some jurisdictions publish their rate as a percentage; this calculator accepts either form as long as you enter it consistently.</p>
                <h3>Can I appeal my property tax assessment?</h3>
                <p>Yes. Most jurisdictions provide a formal appeal process if you believe your assessed value is too high. Common grounds include a recent sale at a price below the assessed value, comparable sales in your neighborhood that are lower, or errors in the property record such as incorrect square footage or features. Check with your county assessor for the deadline and procedure.</p>
                <h3>How often do assessed values change?</h3>
                <p>Assessment schedules vary by state. Some jurisdictions reassess every year, others every two to four years, and some only reassess when a property is sold. If your market has appreciated significantly since your last assessment, your future bills may increase. If values have fallen, you may have grounds to seek a lower assessment.</p>`,

  "home-maintenance-budget-calculator": `
                <h2>How much should you budget for home maintenance each year?</h2>
                <p>Home maintenance is one of the most commonly underbudgeted ownership costs. Repairs arrive on their own schedule, and without a dedicated reserve, a single plumbing failure or roof issue can create real financial stress. This calculator builds an annual maintenance budget from your home's value, age, and known near-term needs so you can set aside the right amount rather than guessing.</p>
                <h2>Home value</h2>
                <p>A common rule of thumb among housing professionals is to budget a percentage of the home's value each year for maintenance and repairs. The percentages this calculator uses are starting points based on broad experience; the actual costs depend on your property's condition, climate, and how proactively you maintain it. A higher value home tends to have larger, more expensive components to maintain, which is why value anchors the estimate.</p>
                <h2>Home age</h2>
                <p>Older homes require more maintenance spending than newer ones, all else equal. Systems and finishes that were installed decades ago are closer to the end of their useful lives, and building materials from earlier eras may need more frequent attention. This calculator increases the base rate for homes over 15 years old and again for homes over 30. If you have recently renovated major systems, you can think of those systems as newer than the home's age would suggest.</p>
                <h2>Major systems near replacement</h2>
                <p>A furnace, air conditioner, water heater, or roof that is approaching the end of its expected life is a near-term budget liability. This field lets you add a planning reserve for each such system so the impending expense is captured in the annual budget rather than treated as an emergency. One well-worn estimate for replacing a major system is in the range of one to two thousand dollars per system per year of reserve, though actual replacement costs vary widely and should be verified with local contractor quotes.</p>
                <h2>Known projects this year</h2>
                <p>If you have already identified repairs or improvements you plan to complete in the current year, enter that total here. This ensures your budget reflects real commitments rather than only statistical averages. Items might include a fence repair, exterior painting, flooring replacement, or any project you have already gotten quotes on.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your home's estimated value, its age, the number of major systems approaching replacement, and any known project costs. The result shows an annual reserve and a monthly savings target. Review and adjust these numbers each year as conditions change. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the one-percent rule for home maintenance?</h3>
                <p>The one-percent rule is a rule of thumb that suggests budgeting roughly one percent of your home's value per year for maintenance. It is a useful starting point, but it understates costs for older homes and overstates them for newer homes in good condition. This calculator adjusts the rate upward as a home ages rather than applying a flat one percent to all properties.</p>
                <h3>What are the most expensive home repairs?</h3>
                <p>The repairs that tend to carry the highest price tags include roof replacement, foundation work, HVAC system replacement, major plumbing failures, and electrical panel upgrades. These are also the categories least likely to be covered by homeowners insurance because they result from age and wear rather than a sudden event. The systems field in this calculator is intended to help you plan for these.</p>
                <h3>Should a home maintenance budget include cosmetic improvements?</h3>
                <p>That depends on how you want to use the budget. This calculator is designed around maintenance and system replacement rather than discretionary upgrades like a kitchen remodel. If you are planning improvements, add them to the known-projects field, but keep in mind that improvements are discretionary spending whereas maintenance is required to preserve the home's condition and value.</p>`,

  "moving-cost-estimator": `
                <h2>How much does it cost to move?</h2>
                <p>Moving costs are easy to underestimate because the bill arrives from multiple directions at once: labor, the truck or moving company, fuel for the drive, packing supplies, and often a night of lodging. This calculator brings all of those lines together so you can see a realistic total before you commit to a timeline or sign a lease.</p>
                <h2>Movers and labor</h2>
                <p>Professional movers are typically charged by the hour, with a rate that covers a crew of two or three people. The number of hours depends on the size of your home, how much is pre-packed, whether there are stairs or a long carry, and how organized the move is. Rates vary by city, season, and day of the week; weekends and the end of the month are typically more expensive. Enter the number of hours you expect and the hourly rate you have been quoted for a labor-based estimate.</p>
                <h2>Truck rental</h2>
                <p>If you are handling the move yourself, truck rental is the primary vehicle cost. Rental rates vary by truck size, rental company, season, and pickup location. One-way rentals to a distant city often carry a mileage surcharge or a drop fee on top of the base daily rate. Get quotes from multiple companies and confirm what is and is not included before committing.</p>
                <h2>Distance and fuel cost per mile</h2>
                <p>For a self-move, fuel is a significant variable cost that scales with distance and vehicle fuel efficiency. A large moving truck will use substantially more fuel per mile than a passenger vehicle. The cost-per-mile field is designed to capture fuel cost; you can also include per-mile truck rental fees in this field if your rental is structured that way.</p>
                <h2>Boxes and supplies</h2>
                <p>Packing materials add up quickly for a full-home move: boxes in multiple sizes, tape, bubble wrap, packing paper, markers, and furniture pads or blankets. You can reduce this cost by sourcing free boxes from grocery stores, liquor stores, or community buy-nothing groups. Professional packing services, if you use them, are a labor cost separate from supplies.</p>
                <h2>Lodging</h2>
                <p>For moves of several hundred miles or more, one or more nights in a hotel are often necessary. Enter the expected lodging cost here. Meals on the road and incidentals can be folded into the other costs field if you want to capture them.</p>
                <h2>Other costs</h2>
                <p>Moving costs that do not fit the other categories include utility setup fees, storage if there is a gap between move-out and move-in, tips for movers, cleaning services for the old or new home, and the cost of replacing items that do not survive the move. The note produced by this calculator suggests adding a ten-percent buffer as a practical cushion for these variables.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your best estimates for each category, using quotes where available and reasonable estimates where not. The result shows a total alongside the buffer recommendation. Updating the fields as actual quotes come in will bring the estimate closer to reality. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the cheapest way to move?</h3>
                <p>The lowest-cost approach is typically a self-move using a rented truck, with free or low-cost boxes, and help from friends or family instead of hired movers. The tradeoff is time, effort, and the risk of damage to belongings or injury. For long-distance moves, a portable storage container can sometimes bridge the cost between full-service movers and a DIY truck rental.</p>
                <h3>How much do movers typically charge?</h3>
                <p>Hourly rates and flat-fee structures vary considerably by region, the size of your home, and the distance of the move. Local moves are almost always priced by the hour; long-distance moves are more often priced by weight or flat fee. Get at least two or three quotes before deciding, and confirm whether insurance, fuel, and stair or elevator fees are included in the quoted rate.</p>
                <h3>When is the cheapest time to hire movers?</h3>
                <p>Demand for movers peaks at the end of the month, on weekends, and during summer. If your timeline is flexible, scheduling a weekday move in the middle of the month during fall, winter, or early spring often results in lower rates and better availability.</p>`,

  "roommate-expense-splitter": `
                <h2>How to split shared expenses with roommates</h2>
                <p>Shared housing reduces the cost of rent and utilities for everyone involved, but money disagreements are one of the most common sources of roommate conflict. Having a clear, agreed-upon split from the start eliminates most of those conversations. This tool takes your roommates' names and your list of shared expenses and calculates what each person owes.</p>
                <h2>Roommate names</h2>
                <p>Enter the names of everyone sharing the expenses, separated by commas. The tool divides the total equally among them. If you and your roommates have agreed to a different arrangement, you can use the per-person totals as a baseline and adjust outside the tool. The equal split is the most common starting point for shared housing costs.</p>
                <h2>Shared expenses</h2>
                <p>Enter each shared expense on its own line in the format "name, amount," for example "Rent, 1800" or "Electric, 130." The tool adds them together and divides by the number of roommates. Common shared expenses include rent, electricity, gas, water, internet, streaming services shared by the household, and any shared household supplies you choose to split. Expenses that only some roommates use, such as a parking spot or a personal streaming account, are typically kept separate and not entered here.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the roommates' names and the list of shared expenses, then click Split expenses. The result shows the total shared spending and the amount each person owes. Because the split is equal, you can scale it up or down by adjusting who is included. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What shared expenses should roommates split?</h3>
                <p>The standard items to split are rent, electricity, gas, water and sewer, trash, and internet. Some households also split a shared Netflix or other streaming account, common groceries, and household cleaning supplies. Personal expenses, individual food, and private subscriptions are generally kept separate. Agreeing on the list upfront prevents disagreements later.</p>
                <h3>How do you split rent when rooms are different sizes?</h3>
                <p>This calculator uses an equal split. For unequal splits based on room size or other factors, you can determine the percentage each person pays by agreement and then multiply the total rent by each person's share. The resulting per-person rent amounts can then be added to the equal split of shared utilities using this tool or tracked separately.</p>
                <h3>What is the best way to collect money from roommates?</h3>
                <p>Peer-to-peer payment apps make collection straightforward because they create a record of each transfer. Designating one person to pay all shared bills and then collecting reimbursements from the others is a common approach that keeps the number of transactions small. Agreeing on payment timing, typically a few days before the bills are due, prevents late fees from becoming a shared problem.</p>`,

  "vacation-budget-planner": `
                <h2>How to plan a vacation budget before you go</h2>
                <p>Vacations have a way of costing more than expected when individual spending categories are not estimated in advance. Booking flights and a hotel does not constitute a budget; the full cost includes food, activities, shopping, and the expenses that come up unexpectedly. This planner works through each major category so you arrive with a realistic number before you commit.</p>
                <h2>Transportation</h2>
                <p>Transportation is typically the largest single cost for trips that require air travel. Costs include flights or fuel for a road trip, rental car fees, ground transportation at the destination, and airport parking. Flight prices vary significantly with booking timing, departure city, and flexibility. If you are renting a car, include insurance, fuel, and any destination or airport surcharges in this total.</p>
                <h2>Lodging</h2>
                <p>Lodging cost depends on the destination, the type of accommodation, the number of nights, and how far in advance you book. Hotels, vacation rentals, and hostels each have different price structures and different tradeoffs in space and amenities. Include taxes and fees in your estimate; resort fees, cleaning fees, and occupancy taxes can add a meaningful amount to the advertised nightly rate.</p>
                <h2>Food</h2>
                <p>Daily food spending varies widely based on how often you eat at restaurants versus preparing your own meals, the price level of your destination, and how many people you are budgeting for. A common approach is to estimate a daily per-person food budget and multiply by the number of days and travelers. Include drinks and tips, which are easy to overlook in a per-meal estimate.</p>
                <h2>Activities</h2>
                <p>Activities include entrance fees, tours, experiences, recreation, and any ticketed events. Some destinations are activity-heavy and this line can be substantial; others are centered on scenery or relaxation where activities cost little. Research specific things you want to do in advance so the estimate reflects actual prices rather than a generic guess.</p>
                <h2>Shopping</h2>
                <p>Souvenirs, clothing, and incidental purchases are easy to underestimate and hard to cut once you are on vacation. Entering a realistic shopping budget ahead of time makes it easier to stay within it. If you are traveling internationally, factor in exchange rates and any customs limits on items you plan to bring home.</p>
                <h2>Other and contingency</h2>
                <p>The other field captures expenses that do not fit neatly elsewhere: travel insurance, visa fees, packing supplies, or any pre-trip costs. The contingency percentage adds a buffer on top of the subtotal, which is a practical way to prepare for delayed flights, unexpected meals, or anything else that comes up. Ten percent is a common starting point for the contingency; adjust based on how predictable your destination and travel style are.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your best estimate for each spending category, then set the contingency percentage to your comfort level. The result shows the subtotal, the contingency amount, and a total budget. Update the estimates as you book and confirm reservations. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>How far in advance should I plan a vacation budget?</h3>
                <p>The sooner the better, especially for destinations with expensive flights or limited accommodation. A rough budget established before you book anything helps you choose between options, avoid overspending at the start, and set savings targets if the trip is months away.</p>
                <h3>What is the biggest vacation budget mistake?</h3>
                <p>The most common error is budgeting only for the big-ticket items and ignoring the daily spending categories. Food, ground transportation, and small purchases accumulate over a multi-day trip and frequently push the actual cost well above the estimated one. Using a planner like this one that covers all categories helps avoid that gap.</p>
                <h3>How much should I set aside for contingency on a vacation?</h3>
                <p>Ten percent of the trip budget is a reasonable minimum for most domestic trips and closer to fifteen percent may be appropriate for international travel or destinations where prices are less predictable. The right amount depends on your risk tolerance, the predictability of your destination, and how much financial cushion you have if something unexpected happens.</p>`,

  "debt-snowball-calculator": `
                <h2>What is the debt snowball method and how does it work?</h2>
                <p>The debt snowball method is a debt payoff strategy in which you pay minimum payments on all of your debts and direct any extra payment toward the debt with the smallest remaining balance. When that debt is paid off, you roll its full payment into the next-smallest balance. The "snowball" grows as each eliminated debt frees up more money for the next one. This approach is not the lowest-cost mathematically, but research and financial counselors consistently find it produces strong results because the early payoff milestones build momentum and sustain motivation.</p>
                <h2>Debt name and balance</h2>
                <p>Enter each debt you want to include: the name so you can recognize it in the payoff schedule, and the current balance. The snowball orders these from smallest to largest balance, so accuracy here determines the payoff sequence. If two balances are very close, the order matters less than making sure both are included.</p>
                <h2>APR</h2>
                <p>The annual percentage rate drives the monthly interest charge on each debt. A higher APR means more of each payment goes to interest rather than reducing the balance. In the snowball method, APR does not determine the payoff order, but it still affects how long each debt takes to pay off and how much total interest you pay. Entering accurate rates produces a more reliable estimate.</p>
                <h2>Minimum payment</h2>
                <p>Enter the minimum payment required by each creditor. The calculator ensures minimums are met on all debts before applying extra funds to the snowball target. If you are above the minimums on some debts by choice, enter the amount you are actually paying, not just the stated minimum.</p>
                <h2>Total monthly debt payment</h2>
                <p>This is the total amount you plan to put toward all debts combined each month. It must be at least as large as the sum of all minimum payments, and any amount above that is the extra fuel for the snowball. Even a modest increase above the minimums can meaningfully shorten the payoff timeline.</p>
                <h2>How to use this calculator</h2>
                <p>Add each debt with its balance, APR, and minimum payment. Set your total monthly payment budget, then click Build payoff plan. The result shows the estimated month each debt is paid off and the total interest you will pay over the timeline. Adjust the monthly budget up to see how much time and interest a higher payment saves. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the difference between the debt snowball and the debt avalanche?</h3>
                <p>The snowball targets the smallest balance first, regardless of interest rate. The avalanche targets the highest interest rate first, which typically results in paying less total interest. The avalanche is cheaper mathematically, but the snowball eliminates accounts faster and provides earlier wins. Many people find the snowball easier to stick with, which makes it the more effective strategy for them personally even if the numbers favor the avalanche.</p>
                <h3>How much faster is the debt snowball than making minimum payments?</h3>
                <p>Even a small amount above the combined minimums can significantly accelerate your payoff timeline. The acceleration depends on your total debt, your interest rates, and how much extra you apply each month. This calculator lets you test different monthly payment amounts to see the impact on your specific debts.</p>
                <h3>Does the order in which debts are listed matter?</h3>
                <p>No. The calculator sorts your debts by balance automatically and applies the snowball logic regardless of the order you enter them. The payoff sequence is always smallest balance first.</p>`,

  "debt-avalanche-calculator": `
                <h2>What is the debt avalanche method and how does it work?</h2>
                <p>The debt avalanche method is a debt payoff strategy in which you pay minimum payments on all of your debts and direct any extra payment toward the debt with the highest interest rate. When that debt is eliminated, you roll its full payment into the next-highest-rate debt. Because you are consistently attacking the debt that is costing you the most in interest, the avalanche method minimizes total interest paid compared to any other fixed-payment approach. If your goal is to pay the least possible over time, the avalanche is the mathematically optimal strategy.</p>
                <h2>Debt name and balance</h2>
                <p>Enter each debt with a recognizable name and its current balance. In the avalanche method, the balance determines how long each debt takes to pay off, but the payoff order is driven by interest rate. A debt with a large balance but a high rate will receive extra payments before a smaller debt with a lower rate.</p>
                <h2>APR</h2>
                <p>The APR is the key input for the avalanche method because it determines the payoff sequence. Enter the actual annual percentage rate from your statement or loan agreement. In most cases, credit cards carry the highest rates, making them the typical avalanche starting point, followed by personal loans, auto loans, and then lower-rate installment debt.</p>
                <h2>Minimum payment</h2>
                <p>Enter the minimum payment your creditor requires. The calculator applies minimums to all debts before directing extra funds to the avalanche target. If you currently pay more than the stated minimum on any account, enter the amount you are actually paying to get a more accurate payoff estimate.</p>
                <h2>Total monthly debt payment</h2>
                <p>This is the total you plan to put toward all debts each month. The amount above the combined minimums is what the avalanche uses to accelerate the highest-rate debt. Even a modest increase above minimums can save a meaningful amount of interest over time, particularly when high-rate debt is the first target.</p>
                <h2>How to use this calculator</h2>
                <p>Add each debt with its balance, APR, and minimum payment. Enter your total monthly payment budget, then click Build payoff plan. The result shows which debts are paid off first, the estimated month each is eliminated, and the total interest over the timeline. Compare the total interest figure to what the debt snowball calculator produces with the same budget to see the difference between strategies. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the debt avalanche always save more money than the snowball?</h3>
                <p>Yes, for any given monthly payment budget and set of debts, the avalanche will pay less total interest than the snowball. The question is whether that mathematical advantage translates into real savings, which depends on whether you actually follow through with the plan. Some people find the avalanche harder to sustain because high-balance, high-rate debts take longer to eliminate, delaying the sense of progress that the snowball provides earlier.</p>
                <h3>Which strategy should I choose?</h3>
                <p>If the interest savings matter most to you and you are confident you will stay the course, the avalanche is the better financial choice. If you are concerned about motivation and you want early wins to reinforce the habit, the snowball may be worth the modestly higher interest cost. Both strategies beat making minimum payments by a wide margin.</p>
                <h3>What if two debts have the same interest rate?</h3>
                <p>When rates are equal, the calculator will target whichever appears first in your list. In practice, paying off the smaller balance first in a tie is a reasonable tiebreaker because it eliminates an account sooner, which simplifies your debt picture and ensures you do not stall on a large balance indefinitely.</p>`,

  "net-worth-tracker": `
                <h2>What is net worth and why does it matter?</h2>
                <p>Net worth is the difference between what you own and what you owe. Assets include cash, investments, retirement accounts, real estate, and any other property with value. Liabilities include mortgages, car loans, student loans, credit card balances, and any other debts. When assets exceed liabilities, net worth is positive. When liabilities exceed assets, net worth is negative, which is a common and temporary situation for people early in their financial lives. Tracking net worth over time is one of the clearest ways to see whether your overall financial position is improving.</p>
                <h2>Assets</h2>
                <p>Enter each asset on its own line in the format "name, amount," for example "Checking account, 5000" or "Retirement account, 45000." Include all meaningful sources of value: checking and savings accounts, investment brokerage accounts, retirement accounts such as 401k and IRA balances, the estimated value of any real estate you own, vehicles, and any other property worth including. Use current market values rather than what you paid. For retirement accounts, use the current balance rather than a projected future value.</p>
                <h2>Liabilities</h2>
                <p>Enter each debt on its own line using the same format: "name, amount," for example "Mortgage, 225000" or "Credit card, 2500." Include the current outstanding balance, not the original loan amount. Common liabilities include mortgage balances, home equity loan balances, auto loan balances, student loan balances, and credit card balances. Small personal debts can be included or omitted depending on how granular you want the picture to be.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your assets and liabilities, then click Calculate and save locally. The tool computes total assets, total liabilities, and your net worth. Your data is saved in your browser's local storage so it is available the next time you visit, without being sent to or stored on any server. You can clear the saved data at any time with the Clear saved data button. Nothing you enter leaves your device.</p>
                <h2>Frequently asked questions</h2>
                <h3>How often should I calculate my net worth?</h3>
                <p>Quarterly or twice a year is a common cadence for personal net worth tracking. More frequent updates can be distracting because markets and account balances fluctuate day to day. Calculating on a consistent schedule, such as January and July, lets you see meaningful trends rather than short-term noise.</p>
                <h3>Should I include my home and car in net worth?</h3>
                <p>Most financial frameworks include both, using the current market value as the asset and the outstanding loan balance as the liability. The difference is the equity you hold in each. Some people prefer to track a liquid net worth that excludes illiquid assets like real estate, which is a legitimate alternative view, especially for people who are far from retirement or from selling their home.</p>
                <h3>What is a good net worth?</h3>
                <p>Net worth benchmarks vary widely by age, income, and cost of living. Rather than comparing against an external standard, the more useful question is whether your net worth is trending in the right direction from one tracking period to the next. A net worth that is growing, even slowly, reflects spending less than you earn and letting assets appreciate or debts shrink over time.</p>`,

  "credit-card-statement-analyzer": `
                <h2>What can a credit card statement tell you about your spending?</h2>
                <p>A credit card statement contains a transaction-level record of where your money went over a billing period, but most people only look at the balance due rather than the underlying data. Analyzing the statement by category and merchant reveals patterns that a quick scan of the total misses: which spending categories are largest, which merchants appear most often, and where discretionary spending is concentrated. This tool processes a CSV statement from your card issuer and surfaces that summary without sending your data anywhere.</p>
                <h2>Spending by category</h2>
                <p>The tool assigns each transaction to a category based on keywords in the merchant description. Common categories include groceries, dining, transportation, utilities, subscriptions, shopping, and healthcare. The category breakdown shows which areas of spending account for the largest share of your total and helps identify where reduction would have the most impact. Category assignment from description text is approximate, and some transactions may land in the wrong category; the summary is a starting point rather than a precise accounting.</p>
                <h2>Spending by merchant</h2>
                <p>The merchant summary normalizes transaction descriptions to group charges from the same merchant together, which is useful because card statements often show the same merchant in multiple slightly different formats. Seeing the total spent at each merchant over the period clarifies which stores, services, and restaurants represent the largest recurring commitments.</p>
                <h2>Total activity</h2>
                <p>The tool reports total transaction volume for the period. This figure includes all charges regardless of whether they are business, personal, or reimbursable. If your statement contains credits, returns, or payments, those appear as transactions with negative amounts and are handled separately from purchases in the summary. The total is a useful sanity check against the statement balance before any payments are applied.</p>
                <h2>How to use this calculator</h2>
                <p>Export a CSV from your card issuer's website or app, then upload it here. The tool reads the file in your browser and looks for date, description, and amount columns. No file or transaction data is sent to a server or stored anywhere outside your browser. The analysis happens locally and is discarded when you close or reload the page.</p>
                <h2>Frequently asked questions</h2>
                <h3>What CSV format does this tool expect?</h3>
                <p>The tool works best with a CSV that has at least three columns: a date, a description or merchant name, and an amount. Most major card issuers offer a CSV or spreadsheet download from the account activity page. If your file has separate debit and credit columns rather than a single amount column, the tool can handle that format as well.</p>
                <h3>Is it safe to upload my credit card statement here?</h3>
                <p>Yes. The file is read by code running in your browser and never transmitted to a server. The analysis is performed locally, and nothing from the file is stored after you close the page. You can verify this by disconnecting from the internet before uploading; the tool will still function because it requires no server connection to analyze the data.</p>
                <h3>Why might some transactions be miscategorized?</h3>
                <p>Category assignment relies on matching keywords in the merchant description against a set of category rules. Transaction descriptions on card statements are often abbreviated or contain codes that do not clearly indicate the merchant type. A gas station that also sells groceries may show in transportation rather than groceries, for example. The summaries are best used to understand general spending patterns rather than as a precise budget report.</p>`,

  "lead-value-calculator": `
                <h2>What is a lead actually worth to your business?</h2>
                <p>Most businesses know their cost per lead but have never worked out what a lead is worth in revenue or profit. Without that number, it is hard to know how much to spend on advertising, what a reasonable cost per lead looks like, or whether a marketing channel is profitable. This calculator takes four numbers you likely already have and produces a clear revenue value and gross profit value for each lead that enters your pipeline.</p>
                <h2>Lead-to-customer close rate</h2>
                <p>The close rate is the percentage of leads that eventually become paying customers. If you close 20 out of every 100 leads, your close rate is 20 percent. This is the most important driver of lead value: a higher close rate directly multiplies the expected revenue per lead. If your close rate varies by channel or lead source, run the calculator separately for each to see which channels generate the most valuable leads.</p>
                <h2>Average customer revenue</h2>
                <p>Enter the average revenue a converted customer brings in. For a one-time transaction, this is the average sale value. For service businesses with repeat customers, you can use the expected revenue from a single job or the average revenue over a defined period, depending on how you want to frame the result. The lead value the calculator produces is based on this figure, so choosing the right scope for your business matters.</p>
                <h2>Gross margin</h2>
                <p>Revenue is not profit. The gross margin percentage strips out the direct cost of delivering the product or service. A higher margin means more of the converted revenue flows to the bottom line. If your margins vary by product or service type, use the margin that applies to the work this type of lead typically generates. The calculator outputs both a revenue value and a gross profit value so you can see both dimensions.</p>
                <h2>Cost per lead</h2>
                <p>Enter what you currently spend to acquire one lead, including advertising, referral fees, trade show costs, or any other lead generation expense divided by the number of leads it produces. The calculator compares this to the gross profit value of a lead to show whether you are paying more or less than your leads are worth in profit. A cost per lead below the gross profit value means you have room to scale; a cost above it means the channel is unprofitable at your current close rate and margins.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your lead-to-customer rate, the average revenue a closed customer generates, your gross margin percentage, and what you currently pay per lead. The result shows revenue value per lead, gross profit value, and the net value after subtracting your lead cost. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>How do I find my close rate?</h3>
                <p>Divide the number of customers acquired over a period by the number of leads that entered your pipeline in that same period, then multiply by 100. If your sales cycle is long, you may need to match cohorts carefully, tracking leads from the month they arrived through to when they converted or were marked lost. CRM tools typically report this directly if lead stages are tracked.</p>
                <h3>How much should I spend to acquire a lead?</h3>
                <p>A common starting point is to stay below the gross profit value per lead that this calculator produces. The exact threshold depends on your business model, whether customers have long-term value beyond the initial sale, and how much margin you need for overhead and other costs. Comparing lead cost to lead value is a more reliable frame than any general rule.</p>
                <h3>What is the difference between lead value and customer lifetime value?</h3>
                <p>Lead value estimates what a lead is worth at the point it enters your pipeline, accounting for the probability it will close. Customer lifetime value estimates the total profit a converted customer generates over their entire relationship with your business. The customer lifetime value calculator on this site covers that calculation separately.</p>`,

  "customer-lifetime-value-calculator": `
                <h2>How do you calculate customer lifetime value?</h2>
                <p>Customer lifetime value is the total gross profit a business expects to earn from a customer over the entire length of their relationship. It matters because it sets a rational ceiling on how much to spend acquiring and retaining customers. If your lifetime value is low relative to what you spend to acquire customers, no amount of volume will make the unit economics work. This calculator builds the estimate from monthly revenue, gross margin, churn rate, and acquisition cost.</p>
                <h2>Monthly revenue per customer</h2>
                <p>Enter the average revenue a single customer generates each month. For subscription businesses this is typically the monthly plan value. For service businesses with irregular billing, use the average monthly spend across your customer base, or annualize and divide by 12. The monthly figure is the foundation of the calculation because it scales with lifetime duration.</p>
                <h2>Gross margin</h2>
                <p>The gross margin percentage represents how much of each dollar of revenue is left after paying the direct costs of delivering the product or service. A software business may have very high gross margins; a field service or product-based business will have lower ones. Margins vary significantly by industry, and using your actual margin rather than an industry average produces a more meaningful lifetime value figure for your business.</p>
                <h2>Monthly churn rate</h2>
                <p>Churn is the percentage of customers who stop doing business with you each month. It is the single most powerful lever on lifetime value because it determines expected customer lifespan. A 3 percent monthly churn implies an average customer relationship of roughly 33 months; a 10 percent churn implies about 10 months. Small reductions in churn compound dramatically over time and increase lifetime value more than most other improvements a business can make.</p>
                <h2>Customer acquisition cost</h2>
                <p>Enter what you spend on average to acquire one customer, including all marketing and sales expenses attributed to new customer acquisition divided by the number of new customers those expenses produce over the same period. The calculator subtracts this from gross profit lifetime value to show the net lifetime value after acquisition costs. A common benchmark used in subscription businesses is to evaluate whether lifetime value substantially exceeds acquisition cost, but the right ratio varies by business model and growth stage.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your monthly revenue per customer, gross margin, churn rate, and acquisition cost. The result shows expected customer lifetime in months, gross profit lifetime value, and net lifetime value after acquisition cost. The LTV:CAC ratio shown in the note is a useful signal but should be compared against your own margins and payback expectations rather than treated as a universal target. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is a good LTV:CAC ratio?</h3>
                <p>Many subscription and SaaS businesses use an LTV:CAC ratio as a health indicator, but what constitutes a good ratio depends on your margins, the length of your payback period, and your growth rate. A ratio that works well for a high-margin software business may look very different for a service business with higher direct costs. Track the trend in your own ratio over time rather than comparing against a single external benchmark.</p>
                <h3>How can I improve customer lifetime value?</h3>
                <p>The two most direct levers are reducing churn and increasing average revenue per customer. Reducing churn extends the expected lifetime, which multiplies the value of everything a customer spends. Increasing revenue per customer through additional products, services, or pricing can raise both the monthly figure and the margin percentage. Improving the initial customer experience tends to affect both because satisfied customers stay longer and buy more.</p>
                <h3>Does this calculator account for discounting future revenue?</h3>
                <p>No. This calculator uses an undiscounted lifetime value model, which adds up expected monthly gross profit without applying a discount rate for the time value of money. Discounted LTV models exist and produce a more conservative figure, particularly for long customer lifespans. For most practical planning purposes, the undiscounted model is a reasonable starting point.</p>`,

  "cost-of-missed-calls-calculator": `
                <h2>How much revenue does your business lose from missed calls?</h2>
                <p>Every unanswered call to a service business is a potential customer who did not get through. Some of those callers leave a message or try again, but many move on to the next result in their search. The cost of missed calls is easy to dismiss because the lost revenue never shows up in your books. This calculator makes the invisible visible by estimating the monthly and annual revenue opportunity that slips away when calls go unanswered.</p>
                <h2>Call volume and missed call rate</h2>
                <p>Start with how many inbound calls your business receives in a typical month and what percentage of those calls go unanswered or to voicemail without a callback. If you have a phone system that logs missed calls, use that data. If not, an honest estimate from observation is a reasonable starting point. Even small missed-call rates add up quickly at high call volumes, and the calculator lets you test different scenarios to see where the threshold is for your business.</p>
                <h2>Qualified call rate</h2>
                <p>Not every missed call is a prospective customer. Some calls are from existing customers, vendors, wrong numbers, or robocalls. The qualified rate field lets you estimate what share of missed calls represent genuine new business inquiries. This prevents the calculator from overstating the loss by treating every unanswered call as a lost sale opportunity.</p>
                <h2>Close rate and average sale value</h2>
                <p>Among the qualified missed calls, only a fraction would have converted to a paying customer even if answered. Enter your typical close rate for phone leads and the average value of a closed sale. These two inputs scale the potential loss from a count of missed opportunities to a dollar figure. The result is what you would expect to earn on average if those calls had been answered and handled the same as your current inbound calls.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your monthly call volume, the percentage of calls missed, the share of those that are qualified inquiries, your close rate, and your average sale value. The result shows the estimated number of missed calls, potential lost sales per month, and the monthly and annualized revenue at risk. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What percentage of callers leave a voicemail or call back?</h3>
                <p>Call-back and voicemail rates vary widely by industry and caller demographics. Older or more urgent inquiries tend to leave messages; comparison shoppers often do not. Rather than applying a general figure, model your own business: track what percentage of voicemails actually convert versus callers who never follow up, and use that to refine the qualified rate field.</p>
                <h3>Is answering service or phone coverage worth the cost?</h3>
                <p>Compare the monthly cost of coverage to the estimated monthly revenue loss this calculator produces. If the potential loss substantially exceeds the cost of a solution, the business case is straightforward. The real calculation also includes the non-revenue cost of reputation: a caller who cannot reach you may leave a negative review or tell others about the experience.</p>
                <h3>How do I reduce my missed call rate?</h3>
                <p>Common approaches include live answering services, call routing to a mobile phone during off-hours, auto-attendant menus with after-hours options, and callback scheduling tools. The right solution depends on your call volume, hours of operation, and what callers expect when they contact a business in your industry.</p>`,

  "cost-of-employee-turnover-calculator": `
                <h2>How much does it cost to replace an employee?</h2>
                <p>Employee turnover has a real dollar cost that most businesses underestimate because the expenses arrive from several directions at once and are spread across weeks or months. The vacancy itself costs something. Finding a replacement costs something. Training the new hire costs something. And the new employee is not fully productive for some period after they start. This calculator adds those components together so you can see what a single departure actually costs the business.</p>
                <h2>Vacancy cost</h2>
                <p>When a role sits unfilled, the work either does not get done or falls to others. Enter the number of days the position typically remains open and an estimate of the daily productivity loss attributable to the vacancy. This might be expressed as a dollar value of output not produced, overtime paid to other staff covering the gap, or the portion of a manager's day absorbed by the situation. Vacancy periods vary by role complexity, labor market conditions, and how urgently the position is prioritized.</p>
                <h2>Recruiting and hiring costs</h2>
                <p>Enter the direct expenses of finding and hiring a replacement: job board fees, recruiter or agency fees, background checks, drug screens, and interview time valued at the interviewer's hourly cost. Recruiter fees for external hires can be substantial, while internal referrals or direct applications tend to be less expensive. The right number here depends on your hiring practices and the labor market for the role.</p>
                <h2>Training cost</h2>
                <p>Training cost covers the resources invested in getting a new hire to a baseline of competence: instructor or manager time, onboarding materials, required certifications, and any external training programs. This does not include the ongoing cost of the new employee's reduced productivity during their first weeks on the job, which is captured separately in the ramp-up section.</p>
                <h2>Ramp-up period and productivity loss</h2>
                <p>New employees are rarely fully productive on day one. Enter the number of months it typically takes for someone in this role to reach full productivity and the percentage of productivity that is lost during that period relative to a fully trained employee. A longer ramp or a steeper productivity gap significantly increases the total turnover cost, and this is often the largest component for knowledge-intensive or relationship-dependent roles.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the annual salary for the role, your vacancy duration and daily productivity loss estimate, direct hiring costs, training expenses, and ramp-up parameters. The result shows the estimated total cost of one turnover event and how it compares as a percentage of annual salary. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>Why do turnover cost estimates vary so widely?</h3>
                <p>Different studies and frameworks include different components and make different assumptions about vacancy duration, productivity loss during ramp-up, and what counts as a direct versus indirect cost. The figure this calculator produces reflects the inputs you provide, not a standardized formula. The most meaningful number for your business is one built from your own hiring timelines and direct cost data.</p>
                <h3>What role types tend to have the highest turnover costs?</h3>
                <p>Positions with longer ramp-up periods, higher salaries, specialized skill requirements, or strong client relationships tend to carry the highest replacement costs. Roles where the departing employee holds institutional knowledge or customer relationships can also have significant indirect costs that are difficult to quantify but real in their impact.</p>
                <h3>How do businesses reduce employee turnover costs?</h3>
                <p>The most effective approach is reducing turnover itself through better hiring practices, competitive compensation, clear career paths, and a work environment that retains people. When turnover does occur, having a documented onboarding process, cross-training among existing staff, and a pipeline of candidates shortens the vacancy and ramp-up periods that drive much of the cost.</p>`,

  "hourly-rate-calculator": `
                <h2>How do you calculate a sustainable freelance or consulting hourly rate?</h2>
                <p>Setting an hourly rate by looking at what competitors charge or guessing what clients will accept is a common approach that frequently leaves self-employed professionals underpaid. The more reliable method is to work backward from what you need to earn, what you spend running your business, and how many hours you can realistically bill. This calculator does that math and shows you the minimum rate you need to charge to hit your income goal after taxes and expenses.</p>
                <h2>Desired annual take-home income</h2>
                <p>Start with the net income you want to take home after taxes and business expenses. This is your personal financial goal: the amount you need to cover your personal expenses, savings, and quality of life. Be honest about this number rather than underestimating it. The calculator builds everything else around it, so starting too low produces a rate that will not actually support your financial needs over time.</p>
                <h2>Annual business expenses</h2>
                <p>These are the costs of operating your business that are separate from your personal take-home: software subscriptions, equipment, professional development, insurance, accounting fees, a portion of phone or internet, workspace costs, and any other business overhead. Self-employed professionals often undercount expenses in this category, which leads to underpricing. If you are not sure of the exact figure, reviewing last year's business spending is a useful starting point.</p>
                <h2>Tax reserve</h2>
                <p>Self-employed individuals pay both the employee and employer portions of payroll taxes in addition to income tax, which means the effective tax rate is higher than what a salaried employee pays at the same gross income. Enter a tax reserve percentage to account for this. The right percentage depends on your total income, filing status, deductions, and state taxes. A tax professional can give you a more precise figure; using a conservative estimate here is generally safer than a low one.</p>
                <h2>Billable hours and working weeks</h2>
                <p>Not every working hour is a billable hour. Client work competes with time spent on proposals, invoicing, marketing, administrative tasks, and professional development. Enter your realistic estimated billable hours per week, not your total working hours. Fewer working weeks accounts for vacations, sick days, and any time you plan to take off. Overestimating billable capacity is a common mistake that results in a rate that cannot actually be sustained at your real-world working pace.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your target take-home, business expenses, tax reserve percentage, expected billable hours per week, and working weeks per year. The result shows the minimum hourly rate required to meet your income goal, the required annual revenue before taxes, and your total annual billable hours. Adding a pricing buffer above the minimum is advisable to create room for slower months and unexpected costs. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>Why is my minimum rate higher than what I currently charge?</h3>
                <p>The most common reasons are underestimating business expenses, overestimating billable hours, or not accounting for the self-employment tax load. Run the calculator with your real numbers and compare the result to your current rate. If there is a meaningful gap, you either need to raise rates, reduce expenses, increase billable capacity, or some combination of the three.</p>
                <h3>Should I charge by the hour or by the project?</h3>
                <p>Project-based pricing can be more profitable if you work efficiently, because clients pay for the result rather than the time. But an hourly rate is still useful as a foundation: knowing your floor rate tells you whether a fixed-price project is worth taking and helps you price project work at a level that meets your income needs. Many self-employed professionals use both, depending on the client and type of work.</p>
                <h3>How often should I revisit my rate?</h3>
                <p>At minimum once a year, and whenever your expenses, income goals, or workload change significantly. Rates also need to keep pace with rising costs of living and business overhead. If you have not raised your rate in several years, running the calculator with current numbers is a straightforward way to see whether your current rate still supports your financial situation.</p>`,

  "profit-margin-calculator": `
                <h2>What is profit margin and how is it calculated?</h2>
                <p>Profit margin expresses profit as a percentage of revenue. It tells you how many cents of every sales dollar flow through to profit after covering the cost of what you sold. Margin and markup are related but different, and the distinction matters when setting prices: margin is profit divided by revenue, while markup is profit divided by cost. Confusing the two is a common pricing error that leads to margins lower than intended. This calculator shows both figures and also tells you what price you need to charge to hit a target margin.</p>
                <h2>Sale price and cost</h2>
                <p>Enter the price you charge and the direct cost of the product or service being sold. The cost field should reflect the direct cost of goods or service delivery, not overhead or operating expenses, which are typically accounted for separately in a business profit and loss statement. If you are pricing a physical product, cost includes materials, manufacturing, and any inbound shipping. For a service, it includes the direct labor and materials for that engagement.</p>
                <h2>Gross profit and margin</h2>
                <p>Gross profit is the dollar difference between revenue and direct cost. Gross margin is that dollar amount expressed as a percentage of revenue. What constitutes a reasonable gross margin varies considerably by industry: software and information products tend to have very high gross margins because the cost to deliver an additional unit is low; product distribution and food service tend to have much lower margins because direct costs are high. Comparing your margin to others in your specific industry is more useful than evaluating it against a general benchmark.</p>
                <h2>Target margin and price calculator</h2>
                <p>If you know the margin you need to achieve and the cost of delivery, the calculator works in reverse to tell you the minimum price to charge. Enter your target margin percentage and the calculator shows the price required to hit it. This is useful when you are building a price quote and want to ensure the job meets your margin requirement before you send it to the client.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the sale price and direct cost to see gross profit, margin, and markup for a given transaction. Then enter a target margin percentage to see the price that would achieve it for the same cost. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the difference between margin and markup?</h3>
                <p>Margin is profit divided by the selling price. Markup is profit divided by the cost. A 40 percent margin and a 40 percent markup describe different situations. If your cost is 60 dollars and you add a 40 percent markup, the price is 84 dollars, and the margin is about 28.6 percent, not 40. If you want a 40 percent margin on a 60-dollar cost, the required price is 100 dollars. Many pricing errors come from applying a desired margin percentage as though it were a markup.</p>
                <h3>What is a good profit margin for a small business?</h3>
                <p>This varies significantly by industry, business model, and stage of growth. A retail or distribution business may operate at gross margins in the range of 20 to 40 percent, while a professional services firm may see margins well above 50 percent. Net profit margins after overhead and operating expenses are typically much lower than gross margins. Reviewing financial benchmarks for your specific industry from trade associations or financial data providers gives a more useful comparison than a general rule.</p>
                <h3>How do I improve my profit margin?</h3>
                <p>The two basic levers are increasing revenue per sale and reducing the direct cost per sale. On the revenue side, this means raising prices or shifting the mix toward higher-margin offerings. On the cost side, it means negotiating better supplier pricing, improving delivery efficiency, or reducing waste in the production or service process. Raising prices is often the faster path if your business has pricing power and customers have not demonstrated strong price sensitivity.</p>`,

  "break-even-calculator": `
                <h2>How do you find your business break-even point?</h2>
                <p>The break-even point is the level of sales at which total revenue exactly covers total costs, producing neither profit nor loss. Understanding it tells you the minimum you must sell before any money flows to profit and gives you a concrete sales target to evaluate whether a business, product, or pricing model is viable. This calculator finds the break-even point in both units sold and total revenue using three inputs: your fixed costs, your price per unit, and your variable cost per unit.</p>
                <h2>Fixed costs</h2>
                <p>Fixed costs are the expenses your business incurs regardless of how much you sell: rent, salaries, insurance, software subscriptions, loan payments, and similar obligations that stay roughly constant over a period. Enter your total monthly or annual fixed costs, making sure to use the same time period as your price and variable cost inputs. The break-even calculation is only as accurate as the fixed cost figure, so including all fixed obligations matters.</p>
                <h2>Price per unit</h2>
                <p>Enter the price at which you sell one unit of the product or service. For businesses with a single offering or consistent pricing this is straightforward. For businesses with multiple products or service types, you can calculate a weighted average price based on your sales mix, or run the calculator separately for each major offering to see the break-even for each individually.</p>
                <h2>Variable cost per unit</h2>
                <p>Variable costs change with each unit you produce or sell: raw materials, direct labor tied to production, merchant processing fees, packaging, shipping, and similar costs that only occur when a sale happens. Subtracting the variable cost from the price gives you the contribution margin per unit, which is the amount each sale contributes toward covering fixed costs. The higher the contribution margin, the fewer units you need to sell to break even.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your fixed costs for the period, your price per unit, and the variable cost per unit. The result shows the number of units needed to break even, the total revenue at that point, and the contribution margin per unit. If you are evaluating a price change, adjust the price field to see how it affects the break-even volume. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What happens to the break-even point if I raise my price?</h3>
                <p>Raising the price increases the contribution margin per unit, which means each sale covers more of your fixed costs. The result is a lower break-even volume in units. However, a higher price may also reduce the number of units customers are willing to buy, so the relationship between price, volume, and profitability requires judgment about customer price sensitivity alongside the break-even math.</p>
                <h3>What if I cannot identify a per-unit variable cost?</h3>
                <p>Service businesses and some professional practices often have costs that do not vary cleanly with individual transactions. In those cases, you can estimate variable costs as a percentage of revenue using a gross margin figure, or model the break-even in terms of revenue needed to cover fixed costs assuming a consistent margin. The calculator works in that mode if you set price to 1 and variable cost to the complement of your gross margin percentage.</p>
                <h3>How is the break-even point used in pricing decisions?</h3>
                <p>Knowing the break-even volume at a given price lets you judge whether that price and volume are realistic. If your market research suggests you can sell 500 units per month and the break-even at your target price requires 800 units, the pricing model needs adjustment. Break-even analysis is also useful when considering adding a new product or service, because it forces a clear view of the fixed cost commitment and the volume required to justify it.</p>`,

  "job-cost-calculator": `
                <h2>How do you calculate the true cost of a job?</h2>
                <p>Quoting a job accurately requires accounting for more than labor and materials. Overhead, the cost of running the business that cannot be tied to a specific job, eats into profit if it is not built into every quote. And the markup above cost is what produces the gross profit that pays overhead and generates a return. This calculator works through all four layers: direct labor, materials and other direct costs, overhead allocation, and markup, producing both the total job cost and a suggested price.</p>
                <h2>Labor hours and loaded labor rate</h2>
                <p>Enter the number of hours of labor required for the job and the loaded labor rate, which is the fully burdened cost of labor per hour including wages, payroll taxes, workers compensation, benefits, and any other employer-side costs. A common mistake is to use the hourly wage rather than the loaded rate, which understates labor cost and compresses margins. If you are not sure of your loaded rate, a rough starting point is to multiply the wage rate by 1.25 to 1.35, though the right multiplier depends on your specific benefit and tax costs.</p>
                <h2>Materials and other direct costs</h2>
                <p>Enter the cost of materials consumed in completing the job, plus any other direct costs that are specific to this job: subcontractor fees, equipment rental, permits, special tools or supplies, and any other job-specific expenditure. These are costs that would not be incurred if the job were not undertaken, distinguishing them from overhead, which continues regardless of volume.</p>
                <h2>Overhead</h2>
                <p>Overhead is the portion of fixed and semi-fixed business costs allocated to this job. The overhead percentage field applies that allocation as a percentage of direct costs. If your business overhead totals 15 percent of total job costs historically, entering 15 here allocates that share to the current job. Setting this to zero produces a job cost that excludes overhead, which will overstate the apparent margin when the job is priced.</p>
                <h2>Markup</h2>
                <p>Markup is applied on top of the fully loaded job cost to produce the price. Enter the markup percentage you want to achieve. The calculator applies markup to the total cost after overhead, producing a suggested price and showing the expected gross profit and margin at that price. The appropriate markup varies by industry, market conditions, and your competitive positioning.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your labor hours and loaded rate, materials and other direct costs, overhead percentage, and desired markup. The result shows total job cost, suggested price, and expected gross profit. Adjust the markup to see different pricing scenarios. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the difference between markup and margin?</h3>
                <p>Markup is the percentage added to cost to arrive at price. Margin is the profit expressed as a percentage of the price. A 30 percent markup on a 100-dollar cost produces a 130-dollar price and a margin of about 23 percent, not 30 percent. Knowing which one a target refers to matters when quoting jobs: if a client relationship requires a certain margin, the markup needed to achieve it is higher than the margin percentage itself.</p>
                <h3>How do I determine my overhead rate?</h3>
                <p>Divide your total overhead for a period by the total direct costs or total revenue for that same period, then multiply by 100. Common overhead items include rent, utilities, insurance, administrative salaries, vehicles, and equipment not directly tied to a specific job. Reviewing your profit and loss statement and separating direct costs from operating costs is the clearest way to arrive at a consistent overhead rate.</p>
                <h3>What should I do if the suggested price seems too high for the market?</h3>
                <p>If the required price to cover costs and margin exceeds what the market will bear, the options are to reduce direct costs, improve labor efficiency, reduce overhead, accept a lower markup, or decline to quote. Winning a job at a price below full cost is not profitable and erodes the business over time. The calculator helps you see clearly when a job is marginal before you submit a quote.</p>`,

  "service-pricing-calculator": `
                <h2>How do you price a service to cover costs and earn a profit?</h2>
                <p>Many service businesses set prices based on what competitors charge or what feels like a reasonable number, without verifying that the price actually covers costs and generates the intended profit. This calculator takes the actual cost of delivering a service, including labor, materials, and overhead, and works forward to a recommended price at your target profit margin. The result is a price grounded in your specific cost structure rather than a guess.</p>
                <h2>Service hours and labor cost per hour</h2>
                <p>Enter the number of hours required to deliver the service and the direct labor cost per hour for the person or team performing the work. Use the actual cost to the business, not what you bill the client: wages, payroll taxes, and related costs for employees, or the subcontractor rate if using outside labor. Labor is typically the largest cost component for service businesses, so accuracy here matters more than any other field.</p>
                <h2>Materials and direct costs</h2>
                <p>Enter the cost of any materials, supplies, or other direct expenses consumed in delivering this specific service. For a cleaning service this might be supplies used on-site. For a contractor it would be materials specific to the job. For a purely advisory or knowledge-based service, this field may be zero or close to it. Include only costs that are specific to this service delivery, not general business overhead.</p>
                <h2>Overhead allocation</h2>
                <p>Overhead is the portion of your fixed operating costs assigned to this service. Rather than a percentage, this calculator takes a dollar amount for the overhead to allocate to this job, which keeps the input flexible. You can estimate this as a share of your monthly fixed costs based on how many billable service hours this job represents, or use a flat allocation per job if that is how your business tracks overhead.</p>
                <h2>Desired profit margin</h2>
                <p>Enter the profit margin percentage you want to earn on this service after all costs. The calculator computes the recommended price by working backward from margin: price equals total cost divided by one minus the margin percentage. This ensures the margin is calculated correctly as a percentage of price rather than cost. What a reasonable margin looks like varies by service type, market conditions, and the competitive environment in your area.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the service hours and labor cost, materials and direct costs, overhead allocation, and your target margin. The result shows the total service cost, the recommended price, and the profit per service delivery. The note also shows the effective per-hour rate the client pays, which can be useful when comparing your pricing to competitors who quote hourly. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>How is this different from the hourly rate calculator?</h3>
                <p>The hourly rate calculator starts with your income goals and works backward to the minimum rate you need to charge. This calculator starts with the costs of a specific service and works forward to the price needed to cover those costs at a target margin. They serve different purposes: the hourly rate calculator answers "what do I need to charge per hour," while this one answers "what should I charge for this specific job."</p>
                <h3>Should I include my time doing estimates and admin in the service hours?</h3>
                <p>How you handle this depends on your business model. Some service businesses include a portion of estimate, admin, and travel time in every job's hours to ensure those unbillable activities are recovered in the price. Others maintain a separate overhead allocation for that time. Either approach can work as long as you are consistent and all real costs are captured somewhere in the price.</p>
                <h3>What if my recommended price is higher than what customers in my market pay?</h3>
                <p>If your full-cost price exceeds market rates, you face a real cost structure problem, not a pricing problem. The options are to reduce direct costs, improve efficiency so fewer hours are needed, reduce overhead, or target a different segment of the market willing to pay for quality or specialization. Discounting below full cost to match a lower competitor erodes profit and is not a sustainable long-term strategy.</p>`,

  "sales-commission-calculator": `
                <h2>How are sales commissions calculated?</h2>
                <p>Sales commissions are the variable compensation paid to salespeople as a percentage of the revenue or profit they generate. Most commission plans use one of two structures: a flat rate applied to all sales, or a tiered structure where a higher rate applies once a threshold is crossed. The tiered approach is designed to accelerate incentives and reward higher performers with a disproportionately larger payout on the sales above the threshold. This calculator handles both structures and shows the breakdown between base-rate and accelerated commission earnings.</p>
                <h2>Sales amount</h2>
                <p>Enter the total sales amount for the period being calculated. This might be a monthly, quarterly, or deal-specific figure depending on how your commission plan is structured. The calculator applies commission rates to this total and computes the payout across the tiers you define. If you are calculating commission on margin rather than revenue, enter the margin amount here and use margin-based rates in the fields below.</p>
                <h2>Base commission rate</h2>
                <p>The base rate is the commission percentage that applies to all sales up to the accelerator threshold. Enter this as a percentage. For plans without an accelerator, this rate applies to all sales and the threshold and accelerator fields can be set to any amount above the expected sales total. Commission rates vary significantly by industry, product type, and whether the role requires prospecting, account management, or both.</p>
                <h2>Accelerator threshold and rate</h2>
                <p>The accelerator threshold is the sales level above which a higher commission rate kicks in. Sales below the threshold earn the base rate; sales above earn the accelerated rate. This structure is designed to cost-effectively pay higher incentives on incremental performance while keeping payout reasonable on baseline sales. Enter the threshold in dollars and the higher rate that applies above it. If your plan does not use an accelerator, set the threshold above the expected sales total so the base rate applies to everything.</p>
                <h2>How to use this calculator</h2>
                <p>Enter the total sales amount, the base commission rate, the accelerator threshold, and the rate that applies above it. The result shows the total commission, the base-tier portion, the accelerated portion, and the effective overall commission rate for the period. To model different sales scenarios, adjust the sales amount and observe how the payout changes at different performance levels. Everything is calculated in your browser; nothing you enter is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is a typical sales commission rate?</h3>
                <p>Commission rates vary widely by industry, deal size, sales cycle, and what other compensation is included. High-volume, transactional sales roles may have lower percentage rates but higher volume. Complex, enterprise sales roles may carry higher rates but close fewer deals. The rate that makes sense for a role also depends on the base salary, whether there is a draw, and the overall on-target earnings expected for the position. Benchmarking against your specific industry and role type is more useful than a single general figure.</p>
                <h3>How does a commission accelerator work?</h3>
                <p>An accelerator pays a higher commission rate on sales that exceed a set threshold. For example, a plan might pay 5 percent on the first 50,000 dollars in sales and 8 percent on everything above that. This creates a stepped incentive: the salesperson earns more per dollar on each incremental sale above the threshold, which motivates overperformance beyond a quota or baseline target.</p>
                <h3>Should commissions be calculated on revenue or gross profit?</h3>
                <p>Both approaches are used in practice. Revenue-based commissions are simpler to calculate and easier for salespeople to track, but they create an incentive to discount heavily to close deals, since the salesperson earns the same commission regardless of margin. Gross-profit-based commissions align the salesperson's incentive with the business's profitability, but they require that cost data be shared with the salesperson and the calculation is more complex. Many businesses use revenue-based plans with discount approval policies to balance simplicity with margin protection.</p>`,

  "real-cost-of-owning-a-boat": `
                <h2>What it really costs to own a boat</h2>
                <p>The purchase price is the smallest decision you will make. The real cost of owning a boat is the recurring annual spend, and for many owners the yearly carrying cost adds up to a meaningful share of the boat's value before the loan payment is even counted. This calculator totals the categories below so you can see that number before you buy rather than discover it afterward.</p>
                <h2>Financing</h2>
                <p>If you borrow to buy, the monthly payment is usually the largest single line in the budget. Boat loans often run longer than car loans, which lowers the payment but increases total interest, and boats tend to depreciate, so it is common to owe more than the boat is worth for the first few years. Enter your loan amount, rate, and term to see the financed cost alongside the running costs instead of in isolation.</p>
                <h2>Storage or slip fees</h2>
                <p>Where you keep the boat frequently costs more than fuel. A wet slip at a marina in a high-demand coastal area sits at the expensive end, dry-stack storage is in the middle, and keeping a trailerable boat at home is the cheapest option. Liveaboard fees, winter haul-out, and shrink-wrapping add to this category in colder climates.</p>
                <h2>Fuel</h2>
                <p>Fuel depends on engine size, how many hours you run each season, and cruising speed. Larger engines and faster cruising burn disproportionately more, so two owners with the same boat can spend very differently. Estimating realistic hours on the water is the single biggest lever on this line.</p>
                <h2>Insurance, registration, and taxes</h2>
                <p>Insurance varies with hull value, horsepower, your boating history, and where and how far you cruise. Registration fees and, in some states, annual personal-property or use taxes are separate from insurance and are easy to forget. Check your own state and marina, because these differ widely by location.</p>
                <h2>Maintenance and the costs owners forget</h2>
                <p>Routine maintenance includes oil and impeller changes, bottom paint, zinc anodes, detailing, and end-of-season winterization, and an older boat or a saltwater environment raises all of them. A widely cited rule of thumb among boaters is to budget roughly ten percent of the boat's value per year for upkeep, but treat that as a starting point and adjust it to your boat's age, size, and use. Set aside a repairs reserve so a failed pump or a gelcoat repair is a budgeted event rather than a surprise.</p>
                <h2>How to use this calculator</h2>
                <p>Enter your best estimate for each category and adjust the financing inputs to match your loan. The tool adds them into an annual and monthly figure you can compare against your budget. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the most expensive part of owning a boat?</h3>
                <p>For most owners it is either the loan payment or storage, not fuel. Owners who pay cash and trailer the boat at home shift the largest cost to maintenance instead.</p>
                <h3>How much should I budget for boat maintenance each year?</h3>
                <p>A common starting point is around ten percent of the boat's value annually, adjusted up for older boats, larger engines, and saltwater use, and down for newer, smaller, freshwater boats. Use the maintenance and repairs fields to set your own figure.</p>
                <h3>Is owning a boat worth it?</h3>
                <p>That depends on how often you will realistically use it against the total annual cost this calculator produces. Comparing the all-in yearly number to the cost of renting or a peer-to-peer charter for the days you would actually be on the water is the clearest way to decide.</p>`,

  "bill-of-sale-generator": `
                <h2>What is a bill of sale and when do you need one?</h2>
                <p>A bill of sale is a written record that documents the transfer of personal property from a seller to a buyer. It identifies the item being sold, the parties involved, the purchase price, and the date and location of the sale. While informal private transactions often happen without any paperwork, having a bill of sale creates a clear record for both parties. It can support a title transfer, satisfy a registration requirement, or simply serve as proof that an exchange took place. Requirements for bills of sale vary by state and by the type of property involved, so review the rules in your jurisdiction for vehicles or regulated goods.</p>
                <h2>What to include in a bill of sale</h2>
                <p>This generator covers the core fields used in a general-purpose bill of sale: the seller's full name, the buyer's full name, a description of the item being sold including any identifying details such as a vehicle identification number or serial number, the agreed sale price, the date of the transaction, and the city and state where the sale takes place. The finished document includes signature lines for both the seller and the buyer. Some transactions may call for additional language around warranties, liens, or condition disclosures depending on local law and the nature of the property.</p>
                <h2>When you need a bill of sale</h2>
                <p>Private vehicle sales are the most common situation requiring a bill of sale, and many states list it as part of the title-transfer paperwork. Bills of sale are also used for boats, trailers, livestock, firearms, heavy equipment, and other high-value personal property where both parties want a dated written record of the exchange. Even for lower-value transactions, having a signed document can prevent disputes about what was sold, at what price, and in what condition.</p>
                <h2>How to use this generator</h2>
                <p>Enter the seller's name, the buyer's name, a clear description of the item, the sale price, the sale date, and the city and state. The preview updates as you type. When the document looks correct, use the Print button to send it to your printer or save it as a PDF using your browser's print dialog. Print two copies so each party keeps a signed original. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <p>This generator produces a general-purpose draft. Requirements for bills of sale vary by state and by the type of property being transferred. For vehicles, boats, and other titled or regulated property, verify the requirements with your state's department of motor vehicles or equivalent agency. If the transaction involves significant value or legal complexity, have the document reviewed by a qualified professional.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does a bill of sale need to be notarized?</h3>
                <p>Notarization requirements vary by state and by the type of property. Some states require a notarized bill of sale for vehicle title transfers; others do not. Check the requirements for your specific state and transaction type before finalizing the document.</p>
                <h3>Can I use a bill of sale to prove ownership?</h3>
                <p>A bill of sale is evidence of a transaction, not a title document. For vehicles, boats, and other titled property, the official title is the primary proof of ownership. A bill of sale supports the title transfer and provides a paper trail, but it does not replace a properly transferred title in your name.</p>
                <h3>What does "sold as-is" mean on a bill of sale?</h3>
                <p>An as-is clause indicates that the buyer accepts the property in its current condition and that the seller makes no warranties about the item's fitness or future performance beyond what is stated in writing. This is common in private sales but does not necessarily eliminate all seller obligations under state consumer protection laws. If the scope of an as-is sale matters for your transaction, consult a qualified professional.</p>`,

  "rent-receipt-generator": `
                <h2>What is a rent receipt and why does it matter?</h2>
                <p>A rent receipt is a written acknowledgment from a landlord or property manager confirming that a tenant has made a rent payment. It records the amount paid, the period covered, the payment method, the property address, and the date the payment was received. Rent receipts serve as proof of payment for tenants and as a simple transaction record for landlords. Some states require landlords to provide a receipt upon request, particularly when payment is made in cash. Even where not legally required, receipts help prevent disputes and keep rental records organized.</p>
                <h2>What a rent receipt should include</h2>
                <p>This generator captures the fields that make a rent receipt useful: the landlord or property management company name, the tenant's name, the amount paid, the rental period the payment covers, the payment method, the property address, and the date the payment was received. The finished document includes a signature line for the landlord or authorized agent. A complete receipt clearly ties a specific payment to a specific period, which matters when questions arise about whether a particular month was paid on time.</p>
                <h2>When rent receipts are useful</h2>
                <p>Cash payments are the clearest case where a receipt is essential, since there is no bank record to fall back on. But receipts are also useful for money order, check, and electronic payments, particularly for tenants who want a paper record that does not depend on a bank statement. Landlords benefit from issuing receipts consistently because it creates a clear payment history that can resolve disputes quickly. Receipts are also useful at move-out when accounting for the final month's rent and deposit.</p>
                <h2>How to use this generator</h2>
                <p>Enter the landlord or manager name, the tenant's name, the amount paid, the rental period, the payment method, the property address, and the date payment was received. The receipt preview updates as you type. When the information is correct, click Print to send it to your printer or save it as a PDF through your browser's print dialog. Print two copies so both the landlord and tenant retain a signed record. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Are landlords required to provide rent receipts?</h3>
                <p>Requirements vary by state. Some states require landlords to provide a written receipt for cash payments and in some cases for all payments. Check the landlord-tenant laws in your state to understand the specific obligation where your rental property is located.</p>
                <h3>How long should I keep rent receipts?</h3>
                <p>Tenants are generally well served by keeping receipts for at least a year after the tenancy ends, as they may be needed if deposit disputes arise. Landlords maintaining rental income records for tax purposes should retain payment records in line with their record-keeping practices for business income, which often means several years. A tax professional can advise on the retention period appropriate for your situation.</p>
                <h3>Can a rent receipt be used as proof of residency?</h3>
                <p>A rent receipt showing the tenant's name and property address is sometimes accepted as evidence of residency for government forms, utility accounts, or school enrollment. Whether it satisfies a specific requirement depends on the requesting organization. Some entities accept rent receipts; others require a signed lease agreement or official mail at the address.</p>`,

  "mileage-log-generator": `
                <h2>What is a mileage log and what should it include?</h2>
                <p>A mileage log is a record of business-related vehicle trips. It documents each trip's date, purpose, starting odometer reading, ending odometer reading, and total miles driven. Keeping a contemporaneous log is the standard way to substantiate a business mileage deduction when using a personal vehicle for work. Tax guidance commonly expects records to show the date, destination, business purpose, and miles for each trip. Consult current IRS guidance or a tax professional to understand the substantiation requirements that apply to your situation, as rules can change.</p>
                <h2>What columns the mileage log contains</h2>
                <p>This generator creates a log with five columns: Date, Purpose, Start (beginning odometer reading), End (ending odometer reading), and Miles driven for that trip. You add one row per business trip. The downloaded CSV file can be opened in any spreadsheet application, where you can sort by date, filter by purpose, and sum the miles column to get a total for any time period. Keeping the log current throughout the year is more reliable than reconstructing trips from memory at tax time.</p>
                <h2>When you need a mileage log</h2>
                <p>Business owners, self-employed individuals, and employees who use a personal vehicle for work and claim the standard mileage rate or actual expenses on their taxes are the primary users of a mileage log. Independent contractors, real estate professionals, delivery drivers, and tradespeople driving between job sites are common examples. A log is also useful for reimbursement purposes if your employer pays a per-mile rate for work travel. The log provides the documentation needed to support whatever claim or reimbursement is calculated.</p>
                <h2>How to use this generator</h2>
                <p>Each row represents one business trip. Enter the date, the purpose of the trip, the odometer reading at the start, and the reading at the end. The miles column is for you to fill in the calculated distance for that trip. Add as many rows as needed using the Add Row button. When your log is ready, click Download CSV to save the file. Open it in a spreadsheet application to total the miles and format the log for your records. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Can I use a mileage log for tax deductions?</h3>
                <p>A mileage log is the standard supporting document for claiming a business mileage deduction. The deduction is based on either the standard mileage rate, which the IRS sets annually, or actual vehicle expenses. Consult current IRS guidance and a tax professional to confirm what substantiation is required and which method applies to your situation.</p>
                <h3>What counts as business mileage?</h3>
                <p>Generally, driving between your regular place of business and client or work locations qualifies. Commuting from home to a fixed regular workplace typically does not. If your home is your principal place of business, different rules may apply. Because the distinction between commuting and business travel depends on specific facts and applicable tax rules, verify your situation with a tax professional.</p>
                <h3>How do I total miles in the downloaded CSV?</h3>
                <p>Open the CSV file in a spreadsheet application such as Excel or Google Sheets. Click on an empty cell below the Miles column and use the SUM function to add all entries in that column. You can also filter by a date range or by purpose to subtotal specific categories of trips.</p>`,

  "equipment-inventory-generator": `
                <h2>What is an equipment inventory and why should you keep one?</h2>
                <p>An equipment inventory is a structured list of the physical tools, machines, and devices a business or organization owns or manages. It records what the equipment is, its identifying information, where it is located, and its estimated value. Maintaining an accurate equipment inventory supports insurance claims, asset depreciation tracking, audits, and the practical task of knowing where things are. Without a written record, accounting for equipment during a move, a theft, or a loss event becomes significantly harder.</p>
                <h2>What the equipment inventory tracks</h2>
                <p>This generator creates a four-column log: Equipment (the item name or description), Serial Number (the manufacturer's serial number or internal asset tag), Location (where the item is currently assigned or stored), and Value (the estimated current or replacement value). Each row represents one piece of equipment. The downloaded CSV can be opened in any spreadsheet application to sort by location, filter by value, or maintain ongoing updates as equipment is added, moved, or retired.</p>
                <h2>When an equipment inventory is useful</h2>
                <p>Small businesses, contractors, schools, nonprofits, and property managers are common users. An inventory is particularly useful at the start of a new fiscal year, before and after a facility move, after a loss or theft event when filing an insurance claim, and during a business sale or valuation where assets need to be documented. IT departments often maintain equipment inventories to track computers, peripherals, and network hardware across multiple locations or staff assignments.</p>
                <h2>How to use this generator</h2>
                <p>Add one row per piece of equipment. Enter the equipment name, its serial number or asset tag, the location where it is currently kept, and an estimated value. Use the Add Row button to add more rows as needed. When the list is complete, click Download CSV to save the file. Open it in a spreadsheet to sort, filter, or calculate totals. Keeping the file updated after each change to your equipment holdings keeps the inventory useful over time. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>What is the difference between an equipment inventory and an asset register?</h3>
                <p>The terms overlap, but an equipment inventory typically focuses on physical items organized by description and location, while a business asset register often includes additional financial columns such as purchase date, depreciation method, and book value. This generator covers the physical inventory side; the Business Asset Register tool on this site covers the financial accounting side.</p>
                <h3>Should I include equipment I do not own, such as leased items?</h3>
                <p>It depends on the purpose of the inventory. For insurance coverage, you generally list only items you own. For an operational record of what equipment your staff has access to, including leased items may be useful. Adding a column in your spreadsheet for ownership status after downloading is a simple way to distinguish owned from leased assets.</p>
                <h3>How often should I update an equipment inventory?</h3>
                <p>Any time equipment is added, relocated, disposed of, or changes in value significantly. Many organizations reconcile the inventory at least once a year, often at fiscal year end or before renewing equipment insurance. Regular updates reduce the effort required to reconstruct the list after a loss event when accurate information matters most.</p>`,

  "invoice-number-generator": `
                <h2>What is an invoice number and how should you format one?</h2>
                <p>An invoice number is a unique identifier assigned to each invoice you issue. It distinguishes one invoice from another in your records, helps clients reference a specific bill in correspondence, and makes reconciliation straightforward during bookkeeping. Invoice numbers are typically sequential so that every new invoice gets the next number in a series, though date-based formats that include the year and month are also common. A consistent numbering scheme reduces errors, prevents duplicate numbers, and makes it easy to identify which invoices are outstanding.</p>
                <h2>What this generator produces</h2>
                <p>This generator creates a list of invoice numbers based on a prefix, a starting number, and a count you specify. You can also choose to include the current date in each number. The output is a CSV file containing one column of formatted invoice numbers you can paste into your invoicing system, spreadsheet, or accounting software. Common prefix choices include your initials, a client code, or a short business abbreviation. The date option adds the current date in compact numeric format between the prefix and the sequential number, which is useful if you want to know at a glance which period an invoice belongs to.</p>
                <h2>When to generate invoice numbers in advance</h2>
                <p>Businesses that create invoices outside of a dedicated accounting system often benefit from generating a block of invoice numbers at the start of a project, a month, or a quarter. Freelancers and small businesses using spreadsheet-based invoicing use pre-generated numbers to ensure they stay sequential without manually tracking the last number used. You can also use this generator to fill a numbering gap if you are migrating from one system to another and need to continue from a specific starting point.</p>
                <h2>How to use this generator</h2>
                <p>Enter your desired prefix, the number you want to start from, how many invoice numbers to generate, and whether to include the current date in each number. The generator immediately shows a preview and makes a CSV file available for download. Open the downloaded file in any spreadsheet application to copy the numbers into your workflow. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Do invoice numbers need to be sequential?</h3>
                <p>Sequential numbering is a common practice and simplifies record-keeping, but there is generally no legal requirement for invoices to be consecutively numbered in most jurisdictions. Some tax authorities and accounting standards do recommend or require sequential numbering for audit purposes. Check the invoicing requirements in your jurisdiction if you are uncertain.</p>
                <h3>Can I restart my invoice numbering each year?</h3>
                <p>Many businesses reset their invoice sequence at the start of each fiscal year, often incorporating the year into the prefix (such as 2026-001). This is a common practice and makes it easy to identify which year an invoice belongs to. As long as each invoice number is unique within your records, either continuous or annual reset numbering can work depending on your accounting setup.</p>
                <h3>What if I have already issued some invoices and need to continue from a specific number?</h3>
                <p>Set the starting number field to the next number after the last invoice you issued. If your most recent invoice was INV-1047, enter 1048 as the starting number. The generator will produce numbers in sequence from that point forward, keeping your numbering continuous without gaps or duplicates.</p>`,

  "business-asset-register": `
                <h2>What is a business asset register and why do businesses keep one?</h2>
                <p>A business asset register is a record of the fixed assets a business owns, including the asset name, its category, the date it was purchased, and the cost. It provides a central reference for what the business has acquired, when, and at what price. Asset registers support financial reporting, depreciation calculations, insurance coverage decisions, and due diligence during a business sale or audit. For small businesses and sole proprietors, a clear register of business assets also simplifies tax preparation by making it easy to identify assets that may be eligible for depreciation deductions.</p>
                <h2>What the asset register tracks</h2>
                <p>This generator creates a four-column record: Asset (the name or description of the item), Category (such as equipment, furniture, vehicle, or technology), Purchase Date (when the asset was acquired), and Cost (the original purchase price). Each row is one asset. The downloaded CSV can be maintained in a spreadsheet where additional columns can be added for depreciation method, accumulated depreciation, book value, or disposal date as your needs grow.</p>
                <h2>When a business asset register is useful</h2>
                <p>Startups often create an initial asset register when they make their first equipment purchases. Established businesses use them during tax season to identify depreciable assets, when renewing commercial property or equipment insurance, during a business valuation, and when preparing for an audit. A register is also useful when a business is acquired or when ownership is transferred, as it documents what physical assets are included in the transaction.</p>
                <h2>How to use this generator</h2>
                <p>Add one row per business asset. Enter the asset name, select or type a category, record the purchase date, and enter the original cost. Use the Add Row button to add more assets. When the list is ready, click Download CSV to save the file. Open it in a spreadsheet application to sort by category, calculate totals, or add depreciation columns. Keep the register updated when assets are purchased or disposed of. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>What types of assets belong in a business asset register?</h3>
                <p>Fixed assets that the business owns and uses over multiple years are the primary candidates: office equipment, computers, vehicles, machinery, furniture, and leasehold improvements. Inventory and consumable supplies are typically handled separately. The line between what belongs in a fixed asset register versus what is expensed directly often depends on the cost threshold your business uses, which may also align with tax rules in your jurisdiction.</p>
                <h3>Does a business asset register calculate depreciation?</h3>
                <p>This generator records the information needed as a starting point for depreciation calculations, but it does not compute depreciation itself. Depreciation method, useful life, and applicable tax rules vary by asset type and jurisdiction. A spreadsheet built from this CSV can be extended with depreciation columns, or the data can be imported into accounting software that handles depreciation automatically.</p>
                <h3>How is a business asset register different from an equipment inventory?</h3>
                <p>An equipment inventory typically focuses on physical location and operational tracking, including serial numbers and where items are assigned. A business asset register focuses on financial and accounting information: what was paid, when, and how it is categorized. The two serve different purposes and together provide a more complete picture of a business's fixed assets than either does alone.</p>`,

  "home-inventory-generator": `
                <h2>What is a home inventory and why do you need one?</h2>
                <p>A home inventory is a documented list of your household belongings and their estimated replacement values. It provides the information you need to file an accurate insurance claim after a theft, fire, flood, or other covered loss. Without a record, estimating the value of everything lost is difficult and often results in a smaller settlement than you are entitled to. A home inventory also helps you verify that your current coverage limits are adequate for what you actually own, which is a useful check to do periodically as possessions accumulate over time.</p>
                <h2>What the home inventory tracks</h2>
                <p>This generator creates a four-column log: Item (the name or description of the belonging), Room (where in the home the item is kept), Serial or Notes (manufacturer serial number, model number, or identifying details), and Replacement Value (the estimated cost to replace the item new today). Each row is one item or group of similar items. The downloaded CSV can be opened in a spreadsheet to total values by room, filter by category, or sort by value to identify the highest-value possessions.</p>
                <h2>When to create or update a home inventory</h2>
                <p>The best time to create a home inventory is before you need it. Common prompts include moving into a new home, purchasing or renewing a homeowners or renters insurance policy, making significant new purchases, or receiving valuable items as gifts or an inheritance. After a major renovation or acquisition, updating the existing inventory is faster than starting from scratch and keeps your coverage needs current.</p>
                <h2>How to use this generator</h2>
                <p>Work through your home room by room, adding one row per item or category of items. Enter the item name, the room where it is located, any serial or model numbers, and an estimated replacement value. Use the Add Row button to continue adding items. When the list is complete, click Download CSV to save the file. Store the file in a location separate from your home, such as cloud storage or email it to yourself, so it is accessible after a loss event. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Should I include everything or just high-value items?</h3>
                <p>Including everything is more thorough and produces the most accurate picture of total replacement cost, but starting with higher-value items such as electronics, appliances, jewelry, artwork, and furniture gives you most of the dollar value with less initial effort. Lower-value miscellaneous items can be grouped by category with an estimated total rather than listed individually.</p>
                <h3>How do I estimate replacement value?</h3>
                <p>Replacement value is the cost to buy a new equivalent item at today's prices, not what you originally paid or what the item is worth used. For common items, checking a current retailer's price is the simplest method. For antiques, collectibles, or jewelry, a professional appraisal may produce a more defensible estimate for insurance purposes.</p>
                <h3>Where should I store the home inventory file?</h3>
                <p>A copy should be stored somewhere other than your home so it is accessible after a loss that affects your house or its contents. Cloud storage, a secure email attachment to yourself, or a copy kept by a trusted person outside the home are common approaches. Some people also take photos or video of rooms and possessions to accompany the written inventory.</p>`,

  "estate-inventory-worksheet": `
                <h2>What is an estate inventory and what does it cover?</h2>
                <p>An estate inventory is a comprehensive listing of the assets and debts belonging to a person's estate, typically prepared after the person's death as part of the probate or estate settlement process. It identifies real property, financial accounts, personal property, and outstanding debts or liabilities, along with their estimated values and locations. An accurate estate inventory helps executors, administrators, and beneficiaries understand the scope of the estate, fulfill legal filing requirements, and ensure assets are distributed or debts settled in an orderly way. Requirements for formal estate inventories vary by jurisdiction; in many states a formal inventory must be filed with the probate court within a set timeframe.</p>
                <h2>What the estate inventory worksheet tracks</h2>
                <p>This generator creates a four-column worksheet: Asset or Debt (the description of the item), Type (such as real estate, bank account, investment account, personal property, vehicle, or debt), Institution or Location (where the asset is held or where the property is located), and Estimated Value (the approximate value at the time of death). Each row is one asset or liability. The downloaded CSV can be organized in a spreadsheet to separate assets from debts and calculate a net estate value.</p>
                <h2>When an estate inventory worksheet is used</h2>
                <p>This worksheet is a working document for executors, personal representatives, or family members helping to organize an estate before formal legal proceedings begin. It is also useful for estate planning purposes, allowing individuals to document what they own and where it is held so that survivors can locate assets after death. Professional advisors such as estate attorneys and accountants often ask for a preliminary asset list early in the probate process.</p>
                <h2>How to use this generator</h2>
                <p>Add one row per asset or debt. Include real property, financial accounts, retirement accounts, vehicles, valuable personal property, and known debts or liabilities. Enter a type category, the institution or physical location, and an estimated value. Use the Add Row button to continue adding rows. When the list is complete, click Download CSV to save the file. This worksheet is a general-purpose organizational tool. Estate settlement requirements vary significantly by state and by the size and nature of the estate. Consult a qualified estate attorney for guidance on formal inventory and probate requirements in your jurisdiction. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Is this worksheet a legally valid estate inventory?</h3>
                <p>This is a general-purpose organizational worksheet, not a legally binding court document. Formal probate inventories typically must follow specific formats required by the court in the jurisdiction where the estate is administered, and they may need to be signed under oath or accompanied by a formal appraisal. Work with an estate attorney to prepare the formal inventory required by your state's probate court.</p>
                <h3>What if I do not know the value of all the assets?</h3>
                <p>Estimated values are sufficient for a preliminary worksheet. For assets where precise value matters, such as real estate, business interests, or collectibles, a formal appraisal may be needed for tax or court purposes. Bank and investment account balances can be obtained from statements or by contacting the institution. Real property value can be estimated from a county assessor's record as a starting point, though a formal appraisal may ultimately be required.</p>
                <h3>Who is responsible for preparing an estate inventory?</h3>
                <p>The executor or personal representative named in the will, or an administrator appointed by the court if there is no will, is generally responsible for preparing and filing the formal estate inventory. Family members and beneficiaries often assist by identifying and locating assets. An estate attorney or accountant can help ensure the inventory is complete and meets the court's requirements.</p>`,

  "affidavit-generator": `
                <h2>What is an affidavit and what is it used for?</h2>
                <p>An affidavit is a written statement of facts made voluntarily under oath by the person making it, who is called the affiant. The affiant swears or affirms that the contents are true and correct to the best of their knowledge. Affidavits are used in legal proceedings, administrative processes, and private matters where a party needs to formally document a set of facts in a sworn written form. Common uses include financial affidavits, residency affidavits, heirship affidavits, and affidavits submitted as evidence in court proceedings. The specific requirements for a valid affidavit, including notarization and witness requirements, vary by jurisdiction and by the context in which the affidavit will be used.</p>
                <h2>What an affidavit contains</h2>
                <p>This generator creates an affidavit document with the affiant's full name, home or mailing address, the county and state, the body of the affidavit containing the statement of facts in the affiant's own words, and the date. The document includes a signature line for the affiant and a line for a notary public. The statement of facts should be written in plain, direct language describing only what the affiant personally knows to be true, without legal argument or conclusions. Each factual statement is typically presented as a numbered paragraph in formal affidavits, though the format of this generator uses a single text block that you can format as needed.</p>
                <h2>When you need an affidavit</h2>
                <p>Affidavits are used in a wide range of situations: supporting a name change application, confirming identity or residency, documenting the heirs of an estate, attesting that a business is operating, or providing sworn testimony outside of court when in-person testimony is not practical. Courts and government agencies specify the format and contents they require, so the purpose for which the affidavit will be used should guide what you include and how the document is finalized.</p>
                <h2>How to use this generator</h2>
                <p>Enter the affiant's full name, address, county and state, and the statement of facts. Review the preview carefully before printing. Use the Print button to send the document to your printer or save it as a PDF through your browser's print dialog. The affiant should sign the document in the presence of a notary public, who will acknowledge the signature and affix their seal. Do not sign the affidavit before appearing before a notary, as the notarization confirms the signature was made under oath in the notary's presence. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <p>This generator produces a general-purpose draft. Affidavit requirements vary by state, court, and the specific proceeding. Review the applicable requirements for your jurisdiction and have the document reviewed by a qualified legal professional before relying on it for any legal or official purpose.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does an affidavit need to be notarized?</h3>
                <p>In most jurisdictions and for most uses, yes. Notarization confirms that the affiant appeared before the notary, was identified, and signed the document under oath or affirmation. Some jurisdictions also allow a sworn affidavit to be signed before a judge, court clerk, or other authorized official rather than a notary. The specific requirement depends on how and where the affidavit will be used.</p>
                <h3>What is the difference between an affidavit and a sworn statement?</h3>
                <p>The terms are often used interchangeably. An affidavit is typically a formal written document signed under oath before an authorized official such as a notary. A sworn statement may refer to the same type of document or may be used more loosely to describe any statement made under penalty of perjury. The distinction, if any, depends on the jurisdiction and the context in which the document is being submitted.</p>
                <h3>Can I write my own affidavit or do I need an attorney?</h3>
                <p>Affiants can write their own affidavit statements in many situations. The key is that the facts stated must be within the affiant's personal knowledge and that the document must be properly signed and notarized as required by the jurisdiction. For affidavits that will be used in litigation, probate proceedings, or other formal legal contexts, having an attorney review or prepare the document reduces the risk of errors that could affect its legal effect.</p>`,

  "printable-receipt-generator": `
                <h2>What is a printable receipt and when should you use one?</h2>
                <p>A printable receipt is a simple written record documenting that a payment was received from one party by another. It records who paid, who received the payment, the amount, what the payment was for, the payment method, and the date. Unlike a formal invoice, which is a request for payment, a receipt confirms that payment has already been made. Printable receipts are useful for cash transactions, informal sales, donations, and any payment where no electronic record is automatically generated by a payment system.</p>
                <h2>What the receipt includes</h2>
                <p>This generator creates a receipt capturing: Received From (the name of the person making the payment), Received By (the name of the person or business accepting payment), the Amount, a description of what the Payment is For, the Payment Method, the Date, and a Receipt Number for tracking. The document includes a signature line for the authorized recipient. Every receipt gets a unique receipt number, which helps with record-keeping when you issue multiple receipts over time.</p>
                <h2>When a printable receipt is useful</h2>
                <p>Cash sales are the clearest use case, since there is no bank or card record to confirm the transaction. Garage sales, market vendors, service businesses accepting cash, and landlords receiving cash rent payments are common scenarios. Receipts are also useful for internal record-keeping when accepting payments on behalf of a club, church, sports league, or other organization. A written receipt gives both the payer and the payee a reference document without requiring any specialized software or payment processing account.</p>
                <h2>How to use this generator</h2>
                <p>Enter the name of the person making the payment, the name of the business or person receiving it, the amount, what the payment is for, the payment method, and the date. The receipt number is generated automatically but can be changed to match your own numbering sequence. The preview updates as you type. When the receipt looks correct, click Print to send it to your printer or save it as a PDF through your browser's print dialog. Print two copies so both parties keep a signed record. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Is a handwritten receipt legally valid?</h3>
                <p>A written receipt, whether printed or handwritten, is generally valid as evidence of a payment transaction. There is no general legal requirement that a receipt take a specific form or be generated by a particular system. What matters is that it accurately records the transaction details and is signed by the receiving party. For transactions where legal enforceability might matter, keeping a copy and having both parties sign is a good practice.</p>
                <h3>What payment methods should I list on a receipt?</h3>
                <p>List the method the payer actually used: cash, check (including the check number if you want), money order, electronic transfer, or any other method. Recording the payment method helps if a dispute arises later about how a payment was made. For check payments, noting the check number on the receipt gives both parties an additional reference point.</p>
                <h3>Can I use this generator for business receipts?</h3>
                <p>Yes, for basic transactions. This generator is well suited for simple cash sales, informal service payments, and internal organizational receipts. For higher-volume businesses, dedicated point-of-sale or accounting software will typically be more efficient and will produce records that integrate directly with bookkeeping. For any transaction where tax or legal documentation requirements apply, verify that the receipt format meets those requirements.</p>`,

  "merge-csv-files": `
                <h2>How do you combine multiple CSV files into one?</h2>
                <p>When the same data comes in as separate monthly exports, regional files, or batch outputs that all share the same column structure, merging them by hand in a spreadsheet is tedious and error-prone. This tool combines two or more CSV files that share the same columns into a single file in one step, keeping the header row from the first file and stacking the data rows from all subsequent files.</p>
                <h2>How to use it</h2>
                <p>Select two or more CSV files using the file picker. The files should have the same columns in the same order. Click Process files and the tool merges them in the order you selected, dropping duplicate header rows if the other files include them. A preview of the merged data appears, and you can download the result as a single CSV. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Column order must be consistent across all files for the merge to produce useful results. If your files were exported from different systems or time periods where a column was added or removed, align the columns first using the Column Mapper tool before merging. Files with different delimiters, such as one comma-separated and one tab-separated, should be converted to the same delimiter first using the Delimiter Converter tool.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool handle files with different column orders?</h3>
                <p>No. The merge stacks rows directly and uses the column order from the first file. If your files have the same columns but in a different order, the data will land in the wrong columns. Standardize column order before merging.</p>
                <h3>What happens if multiple files all include a header row?</h3>
                <p>The tool detects when a subsequent file's first row matches the header from the first file and skips it. If headers do not match exactly but are still column headers, they may be included as data rows, so review the result before use.</p>`,

  "split-csv-files": `
                <h2>How do you split a large CSV file into smaller files?</h2>
                <p>Many systems impose row limits on imports, or a file is simply too large to open comfortably in a spreadsheet application. This tool breaks a single large CSV into smaller files by row count, each containing the original header row plus the specified number of data rows.</p>
                <h2>How to use it</h2>
                <p>Upload your CSV file and enter how many data rows you want in each output file. The default is 500 rows. Click Process file and the tool calculates how many output files are needed and shows a download button for each part. Each file includes the original header row so it opens correctly on its own. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Choose a row count that fits within the import limit of whatever system you are feeding the files into. If you are splitting a file to upload into a tool with a 1,000-row limit, set the rows-per-file value to something comfortably below that limit to leave room for variation. The last output file will typically have fewer rows than the others if the total does not divide evenly.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does each split file include the header row?</h3>
                <p>Yes. Every output file starts with the original header row from your source file, so each piece is independently usable and will open correctly in a spreadsheet application or import correctly into another system.</p>
                <h3>Can I rejoin the split files later?</h3>
                <p>Yes. Use the Merge CSV Files tool on this site. Select all the split files and merge them back into one, and the tool will handle the duplicate header rows automatically.</p>`,

  "remove-duplicate-rows": `
                <h2>How do you remove duplicate rows from a CSV file?</h2>
                <p>Duplicate rows accumulate when data is exported multiple times, merged from overlapping sources, or collected through a process that occasionally logs the same record twice. This tool scans your CSV and removes rows where every column value is identical to a row already seen, giving you a clean file with only unique records.</p>
                <h2>How to use it</h2>
                <p>Upload your CSV file and click Process file. The tool compares rows across all columns, treating a row as a duplicate when every cell matches after trimming surrounding whitespace. A preview of the deduplicated data appears along with a count of how many duplicate rows were removed, and you can download the clean result. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Comparison is exact and case-sensitive, so "Apple" and "apple" in the same column are treated as different values. If inconsistent capitalization is causing rows that should be duplicates to survive the dedup, standardize the text in those columns first. Similarly, extra spaces inside cell values, not just surrounding them, will prevent a match, so check for internal spacing differences if you expect more duplicates to be removed than the tool finds.</p>
                <h2>Frequently asked questions</h2>
                <h3>Can I deduplicate based on just one or two columns instead of all columns?</h3>
                <p>This tool uses all columns for the comparison. If you need to deduplicate on a subset of columns, such as removing rows with a repeated ID column regardless of what other columns say, that requires a different approach such as a spreadsheet formula or a scripted solution.</p>
                <h3>Which duplicate is kept when there are multiple copies of a row?</h3>
                <p>The first occurrence is kept and all subsequent duplicates are removed. Rows are processed in the order they appear in the file, so the earliest copy survives.</p>`,

  "compare-two-csvs": `
                <h2>How do you compare two CSV files to find what changed?</h2>
                <p>When a CSV export is updated over time, it can be useful to know exactly which rows were added and which were removed between two versions. This tool compares two CSV files and produces a single output file that labels each changed row as either added or removed, so you can see precisely what is different.</p>
                <h2>How to use it</h2>
                <p>Select both CSV files using the file picker. The tool treats the first file as the baseline and the second as the updated version. It compares rows across all columns and identifies rows that appear in the baseline but not the updated file (removed) and rows that appear in the updated file but not the baseline (added). The output CSV includes a status column for each changed row. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The comparison is row-level and exact. A row that changed even one character in any column will appear as both a removal of the old version and an addition of the new version. Rows that are identical in both files do not appear in the output at all. This is useful for spotting discrete additions and deletions but is not designed to highlight edits within a row as individual field changes.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the output show rows that stayed the same in both files?</h3>
                <p>No. Only rows that changed are included in the output. A row with the same values in both files is treated as unchanged and does not appear in the comparison result.</p>
                <h3>Does column order matter for the comparison?</h3>
                <p>Yes. The tool compares cells in positional order. If the two files have the same columns but in a different arrangement, the comparison will not produce meaningful results. Make sure the column order is consistent before comparing.</p>`,

  "excel-to-csv-cleaner": `
                <h2>How do you convert an Excel file to CSV in your browser?</h2>
                <p>Many data workflows require CSV but start with an Excel workbook. This tool converts the first sheet of an Excel file directly to a clean CSV in your browser, stripping the binary spreadsheet format and producing a plain-text comma-separated file you can use with any data tool, import process, or script.</p>
                <h2>How to use it</h2>
                <p>Upload an Excel file in .xlsx or .xls format. You can also upload a CSV directly if you want it cleaned of blank rows. Click Process file and the tool reads the first worksheet, removes entirely blank rows, and presents a preview of the result with a row count. Download the CSV when you are satisfied with the output. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Only the first worksheet is converted. If your workbook has multiple sheets and you need a different one, rearrange the tabs in Excel to put the target sheet first before uploading. Formulas in Excel cells are evaluated to their current values in the output, not exported as formula text. Merged cells may not translate cleanly; unmerge them in Excel before converting if you need precise column alignment in the CSV.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool convert all sheets in the workbook?</h3>
                <p>No. Only the first sheet is converted. If you need multiple sheets as separate CSVs, move each sheet to the first position in turn and convert them one at a time.</p>
                <h3>What happens to dates and numbers formatted in Excel?</h3>
                <p>Dates and numbers are exported as the values Excel has stored, which may appear as serial numbers for dates or with different decimal formatting than what you see on screen. If date formats matter, verify them in the downloaded CSV and reformat as needed in a spreadsheet application.</p>`,

  "column-mapper": `
                <h2>How do you rename CSV columns to match a target schema?</h2>
                <p>When you receive data from one system and need to import it into another, the column names rarely match. This tool renames the columns in your CSV to whatever names you provide, in the order you provide them, so the output matches the header row your target system expects.</p>
                <h2>How to use it</h2>
                <p>Upload your CSV file. In the column names field, enter the new column names separated by commas in the order you want them to appear, for example: Date, Description, Amount. Click Process file and the tool applies your names to the columns in positional order, left to right. If you provide fewer names than columns, the extra columns are dropped. If you provide more, the extra names get empty columns. Download the remapped CSV when done. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The mapping is purely positional: the first name you enter replaces the first column header, the second name replaces the second, and so on. This means you can also use the tool to reduce a wide file to only the columns you need by entering fewer names than the file has. To see the current column names before entering your replacements, leave the field blank and click Process file once; the tool will populate the field with the existing headers for you to edit.</p>
                <h2>Frequently asked questions</h2>
                <h3>Can I reorder columns, not just rename them?</h3>
                <p>Reordering is not supported by this tool. It renames columns in their existing order. If you also need to change column order, do that in a spreadsheet application before using this tool, or after downloading the remapped file.</p>
                <h3>What if my file has more columns than I want to keep?</h3>
                <p>Enter only the names for the columns you want to keep. The tool drops any columns beyond the number of names you provide, so supplying fewer names than columns is the intended way to reduce the column set.</p>`,

  "csv-formula-generator": `
                <h2>How do you build spreadsheet formulas without memorizing syntax?</h2>
                <p>Spreadsheet formulas like XLOOKUP and IFERROR have unfamiliar argument orders that are easy to get wrong. This tool generates ready-to-paste formulas from plain-English inputs: you choose the formula type, enter your cell references, and the tool produces the correct syntax you can copy directly into Excel or Google Sheets.</p>
                <h2>How to use it</h2>
                <p>Select the formula type from the dropdown: Sum a range, If/then, XLOOKUP, Join text, or Percent change. Enter your primary cell reference or range in the first field, a second value or range in the second field, and a condition if the formula type uses one. Click Generate formula and the result appears below, ready to copy. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Use standard spreadsheet range notation in the fields, such as A2:A100 for a column range or B2 for a single cell. The generator produces a formula using those references literally, so double-check that your column and row references match your actual spreadsheet layout before pasting. For the XLOOKUP formula, the tool uses a third column C as the return range by default; edit the generated formula in your spreadsheet if your return values are in a different column.</p>
                <h2>Frequently asked questions</h2>
                <h3>Which spreadsheet applications will these formulas work in?</h3>
                <p>SUM, IF, and TEXTJOIN work in both Excel and Google Sheets. XLOOKUP requires Excel 2019 or later, Microsoft 365, or a modern version of Google Sheets. The percent change formula uses IFERROR, which works in both applications.</p>
                <h3>Can I add custom formulas not in the list?</h3>
                <p>The tool supports the five formula types in the dropdown. For other formula types, the generated output for a similar formula type may give you a useful starting point to edit manually in your spreadsheet.</p>`,

  "spreadsheet-error-finder": `
                <h2>How do you find errors and data quality problems in a CSV file?</h2>
                <p>Bad data in a CSV can break imports, skew calculations, and cause failures that are hard to trace back to their source. This tool scans your CSV for common structural and data quality problems: blank cells, rows with the wrong number of columns, and cells containing spreadsheet error values such as those that appear when a formula fails.</p>
                <h2>How to use it</h2>
                <p>Upload your CSV file and click Process file. The tool checks every row and every cell against the expected column count and flags anything that looks wrong. The output is a separate CSV listing each issue with its row number, column name, the type of issue, and the cell value. A count of total issues found appears as a summary. Download the issues file to review in a spreadsheet. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The tool flags blank cells as potential issues, but not all blank cells are errors depending on your data. Use the downloaded issues file to review each flagged item in context rather than treating every finding as a definitive problem. A high count of blank cells in one column often points to an optional field or a systematic data gap worth investigating. Spreadsheet error values like division-by-zero errors or broken references are flagged unconditionally, as they almost never belong in a data file.</p>
                <h2>Frequently asked questions</h2>
                <h3>What specific error values does the tool detect?</h3>
                <p>The tool flags cells containing common spreadsheet error strings including REF, VALUE, DIV/0, N/A, and NAME errors. These patterns indicate formula errors that were pasted as values when the CSV was exported from a spreadsheet.</p>
                <h3>Does the tool fix the errors it finds?</h3>
                <p>No. The tool identifies and reports issues; it does not modify your data. Use the issues report to locate the problems in your source data and fix them before reprocessing.</p>`,

  "delimiter-converter": `
                <h2>How do you convert between comma, tab, semicolon, and pipe-delimited files?</h2>
                <p>CSV is the most common format, but many systems export with a tab, semicolon, or pipe as the separator instead of a comma. Other tools may require a specific delimiter to import correctly. This tool detects the delimiter in your file and converts the data to whichever output delimiter you choose.</p>
                <h2>How to use it</h2>
                <p>Upload your delimited text file. Choose the output delimiter from the dropdown: Comma, Tab, Semicolon, or Pipe. Click Process file and the tool parses your file using its detected delimiter and rewrites it using the one you selected. The converted data appears in a text area you can copy or download. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The tool auto-detects the input delimiter by scanning the file, so you do not need to specify it manually. If your data contains the target delimiter as a character within a field value, those values should be enclosed in quotes in the output to avoid breaking the format. Review the converted result before use, particularly if your data contains special characters or embedded line breaks.</p>
                <h2>Frequently asked questions</h2>
                <h3>Why would I need a tab-delimited file instead of CSV?</h3>
                <p>Some database tools, older import systems, and certain government data formats use tab-delimited files. Tab-delimited format also avoids issues with comma characters appearing inside field values, which require quoting in CSV. If an import is failing because of commas in your data, switching to tab-delimited often resolves it.</p>
                <h3>Can the tool handle files where values contain the delimiter character?</h3>
                <p>Yes, as long as those values are properly quoted in the source file. The parser respects standard CSV quoting rules, where a field value containing the delimiter is wrapped in double quotes. Unquoted delimiter characters inside values will cause parsing errors regardless of the tool used.</p>`,

  "json-csv-converter": `
                <h2>How do you convert JSON to CSV or CSV to JSON?</h2>
                <p>JSON and CSV are the two most common formats for moving structured data between systems. APIs often return JSON while spreadsheet tools and import forms expect CSV, and vice versa. This tool converts in both directions: paste a JSON array of objects to get a CSV, or paste a CSV to get a JSON array.</p>
                <h2>How to use it</h2>
                <p>Paste your JSON or CSV text into the text area. Click JSON to CSV to convert a JSON array of objects into a comma-separated file with a header row derived from the object keys, or click CSV to JSON to convert a CSV with a header row into an array of JSON objects. The result appears in a text area you can copy or download. Everything happens in your browser; nothing you enter is sent to or stored by this site.</p>
                <h2>Tips</h2>
                <p>For the JSON to CSV direction, your input must be an array of objects at the top level, such as a list of records enclosed in square brackets. A single object or a nested structure will not convert correctly. For CSV to JSON, the first row is treated as the header and becomes the key names in each output object. Any missing values in a row become empty strings in the JSON output.</p>
                <h2>Frequently asked questions</h2>
                <h3>What JSON structure does the converter expect?</h3>
                <p>The tool expects a flat array of objects where each object represents one row and all objects share the same set of keys. Nested objects, arrays within arrays, and non-uniform key sets will produce incomplete or unexpected output. Flatten your JSON before converting if your data has nested structures.</p>
                <h3>Does the CSV to JSON direction support different delimiters?</h3>
                <p>The tool auto-detects the delimiter in the pasted CSV text, so comma, tab, semicolon, and pipe-separated input all work without any manual configuration.</p>`,

  "bank-statement-cleaner": `
                <h2>How do you clean a bank statement CSV for analysis?</h2>
                <p>Bank statement exports are rarely ready to use without some cleanup. Column names vary by institution, amounts may include currency symbols, description fields often contain trailing spaces, and blank rows appear between sections. This tool normalizes a bank statement CSV into a clean three-column format with a consistent date, description, and amount column, stripping noise and dropping blank rows so the data is ready to sort, filter, or import.</p>
                <h2>How to use it</h2>
                <p>Upload your bank statement CSV file. The tool automatically detects your date, description, and amount columns by scanning the header names. It strips currency symbols and commas from amount values, trims whitespace from descriptions, and removes rows with no content. The clean output uses standard lowercase column names and can be downloaded as a new CSV. Your financial data is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Banks use many different column name conventions. The tool looks for common patterns such as "date," "posted," "description," "memo," "amount," "debit," and "credit." If your file uses very unusual column names, the tool may map the wrong column; review the preview before downloading. Files with separate debit and credit columns are supported: the tool combines them into a single signed amount column.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool reformat the date values in the output?</h3>
                <p>No. Date values are passed through as they appear in the source file. The tool standardizes the column structure but does not reparse or reformat date strings. If you need a specific date format, reformat the date column in a spreadsheet application after downloading the cleaned file.</p>
                <h3>Is it safe to upload bank data to this tool?</h3>
                <p>Your file is never uploaded anywhere. All processing happens locally in your browser using JavaScript, and the data does not leave your device. No information from the file is sent to any server.</p>`,

  "recurring-subscription-finder": `
                <h2>How do you find recurring charges in a bank statement CSV?</h2>
                <p>Subscription charges can accumulate quietly over time, and a year-end review of a bank statement often turns up services you forgot you were paying for. This tool scans your transaction CSV and surfaces merchants that appear more than once with the same amount, grouping them so you can see what you are being charged, how often, and on which dates.</p>
                <h2>How to use it</h2>
                <p>Upload your bank statement or transaction CSV. The tool normalizes merchant names by removing common noise words and transaction codes, then groups transactions by merchant and amount. Any combination that appears two or more times is listed in the output with the merchant name, typical charge amount, number of occurrences, and the dates it appeared. Your financial data is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The tool groups on normalized merchant name and amount together, so a service that changes its price mid-year will appear as two separate groups. Charges that appear only once do not appear in the output. If the merchant name column in your file is very noisy, with long transaction codes, some charges may not group as expected; cleaning the file with the Bank Statement Cleaner first often improves grouping accuracy.</p>
                <h2>Frequently asked questions</h2>
                <h3>How does the tool decide what counts as a recurring charge?</h3>
                <p>Any merchant-and-amount combination that appears in two or more transactions is flagged. The tool does not verify that the charges happen on a predictable calendar schedule; it identifies repetition, which is a reliable signal even when billing dates drift slightly month to month.</p>
                <h3>Will it catch annual subscriptions that charge once a year?</h3>
                <p>Only if your statement covers more than one year of transactions. If the file spans a single year, an annual charge appears only once and will not be flagged. Combining multiple years of statements using the Merge CSV Files tool before running this tool will help catch annual charges.</p>`,

  "merchant-name-normalizer": `
                <h2>How do you clean up messy merchant names in a bank statement CSV?</h2>
                <p>Transaction descriptions exported from a bank are often cluttered with authorization codes, location numbers, and transaction type prefixes that make the same merchant appear as dozens of different entries. This tool strips that noise and produces a normalized merchant name alongside the original description, making grouping and analysis far easier.</p>
                <h2>How to use it</h2>
                <p>Upload your transaction CSV. The tool reads the description column, removes common bank transaction codes and prefixes such as POS, DEBIT, PURCHASE, and ACH, strips standalone number sequences, and collapses extra spaces to produce a cleaner name. The output CSV contains the original date, the original description, the normalized merchant name, and the amount. Your financial data is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Normalization removes common noise but cannot perfectly interpret every bank's proprietary transaction format. Review the normalized column for any entries that still look garbled, and treat the output as a starting point for analysis rather than a definitive merchant name. The normalized names are in uppercase, which makes grouping in a spreadsheet more consistent since case differences no longer cause the same merchant to appear as two different entries.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does normalization change the original transaction data?</h3>
                <p>No. The original description is preserved in its own column in the output. The normalized merchant name is added as a separate column. You can compare the two columns to verify the normalization looks reasonable for your data.</p>
                <h3>Can I use the normalized output with other tools on this site?</h3>
                <p>Yes. The output format is a standard CSV with date, description, normalized merchant name, and amount columns. It works well as input for the Recurring Subscription Finder and the Personal Spending Categorizer.</p>`,

  "personal-spending-categorizer": `
                <h2>How do you categorize bank transactions by spending type?</h2>
                <p>Seeing a total for each spending category is one of the most useful things you can do with a bank statement, but assigning categories by hand is slow. This tool scans your transaction descriptions and assigns each one to a spending category using keyword matching, adding a category column to your CSV so you can filter and sum by type in a spreadsheet.</p>
                <h2>How to use it</h2>
                <p>Upload your bank statement or transaction CSV. The tool reads the description column and matches each transaction against keyword rules for ten categories: Housing, Groceries, Dining, Transportation, Utilities, Subscriptions, Shopping, Healthcare, Income, and Transfer. Transactions that do not match any keyword are labeled Other. The output CSV adds a category column alongside date, description, and amount. Your financial data is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Category assignment is based on fixed keyword patterns in the description text. A transaction from a grocery store that uses an unusual name may be categorized as Other if the name does not match the built-in keywords. Cleaning descriptions with the Merchant Name Normalizer or Bank Statement Cleaner first can improve match rates. After downloading the categorized file, you can manually reassign any transactions the tool miscategorized by editing the category column in a spreadsheet.</p>
                <h2>Frequently asked questions</h2>
                <h3>What keywords does each category use?</h3>
                <p>The categories use common merchant names and transaction terms. Groceries matches words like "grocery," major supermarket names, and "walmart." Dining matches restaurant-related terms and food delivery services. Transportation matches fuel-related terms and ride-share names. You can see the full pattern by reviewing the output and noting which descriptions matched each category.</p>
                <h3>Can I change the category rules?</h3>
                <p>The keyword rules are fixed in this tool. To apply custom rules, download the output CSV and use a spreadsheet formula referencing a table of your own keywords, which gives you full control over the mapping.</p>`,

  "duplicate-transaction-finder": `
                <h2>How do you find duplicate transactions in a bank statement CSV?</h2>
                <p>Duplicate charges sometimes appear in bank exports due to processing errors, double imports, or statement overlaps when you concatenate multiple exports. This tool flags any transaction where the date, description, and amount all match a transaction that appeared earlier in the file, so you can review them and decide which to remove.</p>
                <h2>How to use it</h2>
                <p>Upload your transaction CSV. The tool compares each row to all previous rows on the combination of date, description, and amount. When all three match, the later row is flagged as a potential duplicate and the output records which earlier row it duplicates. The output CSV includes all flagged rows with a column showing the row number of the first occurrence. Your financial data is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The comparison is exact on all three fields, so a transaction with the same amount and description but a one-day difference in the date will not be flagged. If you are merging statements that slightly differ in how they record the date, clean and standardize dates first. Not every flagged row is a genuine error; some merchants legitimately charge the same amount on the same day (for example, two separate purchases at the same store). Review each flagged transaction in context before removing it.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool remove the duplicates automatically?</h3>
                <p>No. The output shows which rows are potential duplicates without altering your data. Review the flagged rows and remove the ones you confirm are genuine duplicates using a spreadsheet application.</p>
                <h3>What if my file has legitimate repeat charges on the same day?</h3>
                <p>Those will be flagged if date, description, and amount all match. Use the row reference in the output to compare the flagged transaction against the first occurrence and decide whether it is a real duplicate or a valid separate charge.</p>`,

  "csv-bank-format-converter": `
                <h2>How do you convert a bank CSV into a standard date, description, amount format?</h2>
                <p>Every bank exports statement data with slightly different column names, column orders, and formatting conventions. When you want to combine statements from multiple banks or import into a tool that expects a specific layout, the inconsistencies get in the way. This tool maps your bank's CSV to a clean three-column format with a date column, a description column, and a single signed amount column, regardless of what your source file calls those fields.</p>
                <h2>How to use it</h2>
                <p>Upload your bank statement CSV. The tool scans the header row for column names that match common bank conventions for date, description, and amount, including files with separate debit and credit columns. It maps those columns to the standardized output format, strips currency symbols from amounts, trims description whitespace, and drops blank rows. Your financial data is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>This tool and the Bank Statement Cleaner use the same column detection and produce the same output format. Use either one based on which label makes more sense for your workflow. If your file uses column names that are very different from the common conventions, the tool may pick the wrong columns; check the preview before downloading. After converting, the standardized output works as consistent input for the other finance CSV tools on this site.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool work with statements from any bank?</h3>
                <p>It works with any CSV that has column headers recognizable as date, description, and amount fields. Very unusual or proprietary column names may not be detected automatically. If detection fails, rename the columns to Date, Description, and Amount in a text editor or spreadsheet before uploading.</p>
                <h3>How does the tool handle files with separate debit and credit columns?</h3>
                <p>Files with separate debit and credit columns are supported. The tool combines them into a single signed amount: credit values become positive and debit values become negative in the output.</p>`,

  "screenshot-to-csv": `
                <h2>How do you extract text from a screenshot and turn it into a CSV?</h2>
                <p>When data is trapped in a screenshot or image, retyping it by hand is tedious and error-prone. This tool uses in-browser OCR to read text from your image and arranges the detected lines as rows in a downloadable CSV file, so you can work with the data in a spreadsheet or script without any manual transcription.</p>
                <h2>How to use it</h2>
                <p>Upload a screenshot or image file, then click Extract table text. The tool downloads a recognition library on first use and processes the image locally on your device. Lines of text that contain multiple whitespace-separated columns are split into separate CSV fields. When processing is complete, you can preview the extracted rows and download the CSV. Your image is processed entirely in your browser and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Clear, high-contrast screenshots work best. Crop the image tightly to the data you want before uploading, removing headers, footers, and surrounding chrome that would add noise to the output. The first OCR run on a new session takes longer while the library loads. If a cell value gets split incorrectly, the downloaded CSV is easy to clean up in a spreadsheet application.</p>
                <h2>Frequently asked questions</h2>
                <h3>How accurate is the text extraction?</h3>
                <p>Accuracy depends on image quality, font size, and contrast. Clean screenshots of digital content tend to produce good results. Handwriting, stylized fonts, and low-resolution images reduce accuracy. Check the preview before using the output in anything critical.</p>
                <h3>What image formats are supported?</h3>
                <p>Any image format your browser can display works, including PNG, JPG, GIF, and WebP. Screenshots saved directly from your operating system are typically PNG and work well.</p>`,

  "screenshot-table-extractor": `
                <h2>How do you turn a table in a screenshot into editable rows?</h2>
                <p>Tables in screenshots are common when data comes from a web page, a PDF viewer, or a shared screen recording. This tool uses in-browser OCR to read the text in your image and converts the detected lines into structured rows you can download as a CSV and open in any spreadsheet application.</p>
                <h2>How to use it</h2>
                <p>Upload your screenshot and click Extract table text. A recognition library loads in your browser on first use, then the image is processed locally. Detected lines with multiple spaced columns are split into CSV fields. When done, a preview shows the extracted rows and a download link appears for the CSV. Your image stays on your device and is never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Crop the screenshot to include only the table before uploading. Extra content around the table, such as page navigation or surrounding paragraphs, will appear as additional rows in the output and require cleanup. Larger text and higher screen resolution generally produce cleaner results than small or compressed images.</p>
                <h2>Frequently asked questions</h2>
                <h3>Can it handle tables with merged cells or complex formatting?</h3>
                <p>The OCR reads text line by line. Merged cells and multi-row headers may not map cleanly to a flat CSV. You will likely need to review and adjust those areas of the output in your spreadsheet application.</p>
                <h3>Does this tool work without an internet connection?</h3>
                <p>The recognition library loads from a CDN on first use, so an internet connection is required for that initial download. Once loaded, the OCR processing itself runs locally in your browser.</p>`,

  "image-dimensions-inspector": `
                <h2>How do you check the pixel dimensions and file size of multiple images at once?</h2>
                <p>Verifying image dimensions before uploading to a website, resizing for print, or handing off to a developer usually means opening each file individually. This tool reads the width, height, aspect ratio, file type, and file size of multiple images in one pass and produces a CSV summary you can sort and filter.</p>
                <h2>How to use it</h2>
                <p>Select one or more image files using the file picker and click Inspect images. The tool reads each file in your browser, extracts its pixel dimensions and metadata, and displays the results as a table. You can download the data as a CSV with columns for filename, width, height, aspect ratio, file type, and size in bytes. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Common uses</h2>
                <p>Use this tool to audit a batch of images before a web upload, to check that exported assets meet a required pixel size, or to find oversized files that should be compressed before use. The CSV output makes it easy to sort by dimension or file size across a large set of images in one view.</p>
                <h2>Frequently asked questions</h2>
                <h3>What image formats does it support?</h3>
                <p>Any image format your browser can render, including PNG, JPG, GIF, WebP, and SVG. Formats the browser cannot decode will report an error for that file and continue with the rest.</p>
                <h3>Does the tool change or resize the images?</h3>
                <p>No. It only reads and reports the dimensions and metadata. The original files are not modified in any way.</p>`,

  "bulk-file-renamer": `
                <h2>How do you rename a batch of files with a consistent numbered prefix?</h2>
                <p>Organizing a folder of files with consistent, sequential names is a common task before uploading assets, archiving documents, or handing a set of files to someone else. This tool lets you define a prefix and a starting number, then previews the new names as a CSV so you can confirm them before downloading renamed copies.</p>
                <h2>How to use it</h2>
                <p>Select the files you want to rename and enter a prefix and a starting number. Click Preview renamed files to see a CSV mapping each original filename to its new name. The new names follow the pattern prefix-001.ext, prefix-002.ext, and so on, with the original file extension preserved in lowercase. Everything runs in your browser and your files are never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The preview CSV shows both the original and new names side by side, which is useful as a reference log after the rename. Files are numbered in the order they were selected, so organize or sort them in your file picker before selecting if order matters. The prefix is automatically converted to a URL-friendly slug, so spaces and special characters are replaced with dashes.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool download renamed copies of the files?</h3>
                <p>The current version previews the new names as a downloadable CSV. You can use the CSV as a reference to rename the files using your operating system or a script. This approach lets you verify the mapping before committing any changes.</p>
                <h3>What happens if two files end up with the same new name?</h3>
                <p>Because files are numbered sequentially, each new name is unique as long as each selected file gets its own position in the list. The CSV preview makes it easy to spot any collisions before acting on the output.</p>`,

  "filename-cleaner": `
                <h2>How do you clean up messy filenames quickly?</h2>
                <p>Files accumulate cluttered names over time: copies, version markers, parenthetical numbers, and inconsistent capitalization. This tool takes a list of filenames, removes common noise words and formatting artifacts, and outputs clean names in your choice of lowercase-dashes, lowercase-underscores, or Title Case style.</p>
                <h2>How to use it</h2>
                <p>Paste one filename per line into the text area, choose a name style, and click Clean filenames. The tool strips words like "copy", "final", and "img", removes parenthetical numbers such as "(1)", and normalizes spacing and separators. The cleaned names appear in a text result you can copy or download. Everything is processed in your browser and never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>File extensions are preserved and lowercased in the output. The tool operates on the names you paste, so you can clean names from any source without needing the actual files present. If you are cleaning names before a bulk rename, combine this tool with the Bulk File Renamer for a two-step workflow: clean the names here, then apply them to your files.</p>
                <h2>Frequently asked questions</h2>
                <h3>What noise words does the tool remove?</h3>
                <p>The tool removes "copy", "final", and "img" as standalone words, and strips parenthetical numbers like "(1)" or "(2)". Other words are preserved.</p>
                <h3>Can I clean names that include a full folder path?</h3>
                <p>The tool is designed for bare filenames, not full paths. Paste just the filename portion, not the directory path, for best results.</p>`,

  "duplicate-photo-detector": `
                <h2>How do you find exact duplicate photos in a folder?</h2>
                <p>Duplicate images accumulate from repeated downloads, device backups, and copying files between locations. This tool computes a cryptographic hash of each image file you select and identifies files with identical content, even if they have different names, giving you a report of which files are duplicates and which original they match.</p>
                <h2>How to use it</h2>
                <p>Select a batch of image files using the file picker and click Find exact duplicates. The tool computes a SHA-256 hash of each file entirely in your browser, compares all hashes, and produces a CSV listing each duplicate file alongside the earlier file it matches and the file size. Your images are never uploaded to or stored by this site.</p>
                <h2>Tips</h2>
                <p>The comparison is based on file content, not filename. Two files with different names but identical bytes will be flagged as duplicates. Files that look visually similar but have different content, for example a re-exported or lightly edited copy, will not be matched. This tool finds exact byte-for-byte duplicates only.</p>
                <h2>Frequently asked questions</h2>
                <h3>How many files can I check at once?</h3>
                <p>There is no fixed limit enforced by the tool, but hashing large numbers of large image files takes time and memory. For very large batches, selecting a few hundred files at a time is practical.</p>
                <h3>Does the tool delete the duplicates it finds?</h3>
                <p>No. It only identifies duplicates and reports them in a CSV. You decide which files to keep or remove using your file manager.</p>`,

  "qr-batch-generator": `
                <h2>How do you generate multiple QR codes at once?</h2>
                <p>Creating QR codes one at a time is manageable for a handful of URLs, but when you need codes for a product catalog, event schedule, or signage batch, a one-at-a-time approach does not scale. This tool generates up to 50 QR codes in a single pass from a list of URLs or text values, with a PNG download button for each one.</p>
                <h2>How to use it</h2>
                <p>Enter one URL or text value per line in the text area, then click Generate QR codes. The tool loads a QR library in your browser and renders a labeled code for each line. Each code has its own download button to save a PNG. Everything runs in your browser and no data is sent to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Up to 50 values are processed per run. QR codes can encode URLs, plain text, phone numbers, email addresses, or any other short string. Keep values concise, as longer strings produce denser codes that are harder for some scanners to read. Test each code with a phone camera before printing or publishing.</p>
                <h2>Frequently asked questions</h2>
                <h3>What size are the generated QR code images?</h3>
                <p>Each code is rendered at 150 by 150 pixels. For print use, download the PNG and scale it up in an image editor or design tool, keeping in mind that very small codes or very dense codes may scan less reliably.</p>
                <h3>Can I download all the QR codes at once?</h3>
                <p>Each code has its own individual download button. There is no bulk-download option, so for large batches you will need to save each code separately.</p>`,

  "barcode-generator": `
                <h2>How do you generate a CODE128 barcode in your browser?</h2>
                <p>CODE128 is a widely supported linear barcode format that can encode the full ASCII character set and is used on shipping labels, product packaging, and internal documents. This tool generates a CODE128 barcode from any text or number you provide and lets you download it as an SVG file ready for print.</p>
                <h2>How to use it</h2>
                <p>Enter the value you want to encode in the input field and click Generate barcode. The tool loads a barcode library in your browser and renders a scalable SVG barcode with the encoded value displayed beneath the bars. Click Download SVG to save the file. Everything runs in your browser and no data is sent to or stored by this site.</p>
                <h2>Tips</h2>
                <p>SVG barcodes scale to any size without losing sharpness, which makes them suitable for both screen display and print. Import the SVG into a word processor, design tool, or label-printing application and resize as needed. Verify that your barcode scanner can read the printed output before committing to a large print run.</p>
                <h2>Frequently asked questions</h2>
                <h3>What values can a CODE128 barcode encode?</h3>
                <p>CODE128 supports letters, numbers, and standard ASCII symbols. It is flexible enough for internal SKUs, order numbers, tracking codes, and similar alphanumeric strings.</p>
                <h3>Can I use this barcode for retail UPC or EAN product labeling?</h3>
                <p>This tool generates CODE128 format, not UPC-A or EAN-13. For retail product barcodes that scanners at a point of sale expect, you need to use the appropriate format. Use the UPC Validator tool on this site to check a UPC-A digit, and generate the barcode in the correct format using a tool or library that supports that standard.</p>`,

  "upc-validator": `
                <h2>How do you validate a UPC-A check digit?</h2>
                <p>Every UPC-A barcode includes a twelfth check digit calculated from the first eleven digits. A single transposition or misprint in a barcode makes the check digit wrong, which causes scanners to reject the code. This tool validates whether a 12-digit UPC-A has the correct check digit, or calculates the correct check digit from 11 digits when you are building or verifying a barcode before printing.</p>
                <h2>How to use it</h2>
                <p>Enter a UPC-A code in the input field. Enter 12 digits to validate an existing code, or enter 11 digits to calculate what the check digit should be. Click Validate UPC and the tool shows whether the code is valid, displays the correct check digit, and shows the complete 12-digit UPC. Everything runs in your browser and nothing you enter is sent to or stored by this site.</p>
                <h2>Tips</h2>
                <p>Non-digit characters are stripped automatically, so you can paste a code with spaces or dashes without cleaning it first. The check digit calculation uses the standard UPC-A algorithm: multiply alternating digits by 3 and 1, sum them, and take the complement to 10. If a barcode is scanning incorrectly, verifying the check digit is a quick first diagnostic step.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the tool look up the product associated with a UPC?</h3>
                <p>No. This tool only validates or calculates the check digit using the UPC-A algorithm. It does not connect to any product database or return product names, brands, or other details.</p>
                <h3>Does this work for EAN-13 barcodes?</h3>
                <p>EAN-13 uses the same check digit algorithm as UPC-A, and a UPC-A is a subset of EAN-13. Entering the 12-digit UPC-A validates it correctly. Full 13-digit EAN validation would require entering all 13 digits, but this tool is designed for 11 or 12 digit inputs.</p>`,

  "vin-decoder": `
                <h2>How do you validate a VIN and decode its basic structure?</h2>
                <p>A Vehicle Identification Number is a 17-character code that identifies a specific vehicle. Each position in the VIN encodes structured information, and the ninth character is a check digit calculated from the others. This tool validates that check digit and decodes the VIN's world manufacturer identifier, vehicle descriptor section, model year, plant code, and serial number locally in your browser.</p>
                <h2>How to use it</h2>
                <p>Enter a 17-character VIN and click Decode VIN. The tool validates the format, checks the ninth-position check digit against the standard algorithm, and displays the decoded structure including the possible model year derived from position ten. If the check digit does not match, the result shows what the expected value should be. Everything runs in your browser and nothing you enter is sent to or stored by this site.</p>
                <h2>Tips</h2>
                <p>VINs cannot contain the letters I, O, or Q. If validation fails, check for those characters, which are sometimes confused with the digits 1 and 0. The model year decoded from position ten may show more than one candidate year because the same code repeats on a 30-year cycle; the tool displays the most recent plausible year. This decoder works from the VIN structure alone and does not connect to any external vehicle database.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does this tool look up vehicle details like make, model, or trim?</h3>
                <p>No. The tool decodes the structural sections of the VIN and validates the check digit using the standard algorithm. It does not connect to any manufacturer or government database, so it cannot return vehicle specifications, recall information, ownership history, or title status.</p>
                <h3>What does it mean if the check digit is invalid?</h3>
                <p>An invalid check digit means either the VIN was entered incorrectly, contains a typo, or the VIN itself is not genuine. It is a useful first signal that something is wrong, but a valid check digit does not guarantee the VIN is authentic or has not been altered.</p>`,

  "property-tax-appeal-estimator": `
                <h2>Should you appeal your property tax assessment?</h2>
                <p>Local assessors value thousands of homes at once, often with limited information about any single property, so over-assessments are common. If your assessed value is higher than what your home would realistically sell for, you may be paying more tax than your fair share. This estimator compares your assessment against the evidence you can actually document, then gives you a rough sense of whether an appeal is worth the effort and what it might save.</p>
                <h2>Current assessed value</h2>
                <p>This is the value your county or municipality has placed on your home, shown on your assessment notice or property tax bill. It is the number an appeal seeks to lower. Make sure you are entering the assessed or appraised market value the tax is based on, not the separate "taxable value" after exemptions, since this tool compares the assessment to market evidence.</p>
                <h2>Recent purchase price</h2>
                <p>If you bought the home recently, the price you paid in an arm's-length sale is some of the strongest evidence of its market value. Assessors and appeal boards give recent sale prices significant weight. If you have owned the home for many years, a recent purchase price is less relevant and comparable sales matter more, so you can leave it at zero and rely on comparables instead.</p>
                <h2>Average value of comparable homes</h2>
                <p>Comparable homes, or "comps," are similar properties near yours in size, age, condition, and location that sold recently. The average of several good comps is the backbone of most successful appeals. Pull three to five genuine matches and average their sale prices. The closer the comps are to your home in characteristics and the more recent the sales, the more persuasive your case will be.</p>
                <h2>Effective tax rate</h2>
                <p>Your effective tax rate is your annual property tax divided by your assessed value, expressed as a percent. It converts a reduction in assessed value into real dollar savings. You can find it on your tax bill or calculate it directly. The estimator uses it to turn any over-assessment into an estimated annual and three-year savings figure.</p>
                <h2>How the likelihood estimate works</h2>
                <p>The tool averages whatever evidence you provide, your purchase price and your comparable average, into a single supported market value, then measures how far your assessment sits above it. A larger, well-documented gap generally means a stronger appeal, so the likelihood label rises from Unlikely to Low, Moderate, and High as the percentage gap grows. This is a simplified guide, not a prediction; real outcomes depend on local rules, the quality of your evidence, and the board reviewing your case.</p>
                <h2>How to use this estimator</h2>
                <p>Enter your assessed value, your purchase price if recent, and the average value of solid comparable homes, then your effective tax rate. Review the supported value, the possible over-assessment, and the estimated savings. Everything is calculated in your browser; nothing you type is sent to us or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>Is appealing my property taxes worth it?</h3>
                <p>It depends on the size of the over-assessment and the savings against the time and any filing cost involved. A small gap may not justify the effort, while a large, well-documented gap can pay off for years because the lower assessment carries forward. Use the estimated savings here to weigh it against the work of assembling evidence and filing.</p>
                <h3>What evidence do I need for a property tax appeal?</h3>
                <p>The most persuasive evidence is recent comparable sales of similar nearby homes and, if applicable, your own recent purchase price. Photos documenting condition issues, a recent independent appraisal, and corrections to any factual errors on your property record can also help. Check your jurisdiction's specific requirements and deadlines before filing.</p>
                <h3>Can my assessment go up if I appeal?</h3>
                <p>In most jurisdictions an appeal reviews whether your assessment is too high, but the board can also conclude it is correct or, occasionally, too low. If your supported value is at or above your assessment, this tool flags that an appeal is unlikely to help and could invite a closer review. Appeal when the evidence clearly supports a lower value.</p>`,

  "receipt-warranty-tracker": `
                <h2>Never miss a warranty expiration again</h2>
                <p>Manufacturer and store warranties are easy to forget until something breaks the week after coverage ends. This tool reads a photo of your receipt, pulls out the merchant, purchase date, and amount, and turns them into a calendar reminder set for the day your warranty expires, with an alert a week before. You keep the proof of purchase organized and get a nudge while you can still make a claim.</p>
                <h2>Scanning the receipt</h2>
                <p>Upload a clear, well-lit photo or screenshot of your receipt and the tool runs optical character recognition entirely in your browser to read the text. It then makes its best guess at the merchant name, the purchase date, and the total amount. OCR is never perfect, especially on faded thermal receipts, so every field stays editable. Always check the extracted details and correct anything that came through wrong before creating the reminder. You can also skip scanning and type the details in by hand.</p>
                <h2>Choosing a warranty length</h2>
                <p>Pick the coverage period that matches your product, from ninety days to ten years. Standard manufacturer warranties are often one year, while appliances, electronics, and tools sometimes carry longer terms or extended plans you purchased separately. The tool adds the period you choose to the purchase date to calculate the exact expiration date.</p>
                <h2>Adding the reminder to your calendar</h2>
                <p>Once the details are set, you get two options. "Add to Google Calendar" opens a prefilled all-day event on the expiration date in your Google account, with a reminder seven days earlier. The "Download .ics file" option produces a standard calendar file that imports into Apple Calendar, Outlook, and most other calendar apps. Either way, the event includes the item, amount, and purchase date so you have the key details when a claim comes up.</p>
                <h2>Your receipt stays on your device</h2>
                <p>The receipt image is read inside your browser using a recognition library that downloads to your device; the photo itself is never uploaded to us. The Google Calendar link is just a prefilled web address built in your browser, and the .ics file is generated locally and downloaded directly to your device. Nothing you scan or enter is sent to or stored on a server.</p>
                <h2>How to use this tool</h2>
                <p>Upload a receipt and scan it, or enter the details by hand. Confirm the merchant, date, and amount, choose the warranty length, and create the reminder. Then add it to Google Calendar or download the .ics file for your calendar app.</p>
                <h2>Frequently asked questions</h2>
                <h3>Does the receipt photo get uploaded anywhere?</h3>
                <p>No. The optical character recognition runs in your browser after a recognition library loads, and the image is processed on your device. The calendar link and .ics file are also created locally, so your receipt and its details are never sent to or stored on our servers.</p>
                <h3>Why didn't it read my receipt correctly?</h3>
                <p>Faded thermal paper, wrinkles, glare, and unusual fonts all make OCR harder, so some receipts read poorly. Try a flatter, brighter, more tightly cropped photo, and correct any fields by hand. The merchant, date, and amount are always editable before you create the reminder.</p>
                <h3>Will the reminder work in calendars other than Google?</h3>
                <p>Yes. Use the "Download .ics file" button to get a standard calendar file that imports into Apple Calendar, Microsoft Outlook, and most other calendar applications. The Google Calendar button is a convenience for people who use Google Calendar.</p>`,

  "screenshot-measurement-calculator": `
                <h2>Measure real-world distances from a photo</h2>
                <p>When you have a photo of a room, a wall, or an object but no tape measure handy, you can still estimate real dimensions if you know the size of one thing in the image. This tool lets you draw a line over something whose length you already know, tell it that length, and then measure anything else in the same photo by drawing more lines or a box. It is a quick way to estimate wall lengths, object dimensions, and floor area without being on site.</p>
                <h2>Setting a reference line</h2>
                <p>Accuracy starts with the reference. Draw a line over an object whose real length you know with confidence, a standard doorway, a countertop, a piece of trim, or anything you can verify. Then enter that exact length and choose the unit. The tool uses the pixel length of your reference line and its real length to work out a scale, so a longer, more carefully placed reference line generally gives better results than a short one.</p>
                <h2>Measuring lines and area</h2>
                <p>Switch to line mode to measure distances such as wall lengths or the width of a window, and the tool reports each line's estimated real length. Switch to box mode to drag a rectangle over a floor or surface, and it reports the width, height, and area. You can place several measurements on the same photo, and the reference line stays in place so every measurement uses the same scale.</p>
                <h2>Why this is an estimate, not a survey</h2>
                <p>This is a flat two-dimensional scale, not a perspective-corrected measurement. It is most accurate when the photo is taken straight on and the things you measure lie in the same plane as your reference, like a single flat wall photographed face-on. Objects at different depths, wide-angle lens distortion, and angled shots all introduce error. Treat the numbers as useful estimates for planning, not as exact figures for ordering materials or construction.</p>
                <h2>Useful for contractors, DIYers, and real estate</h2>
                <p>Contractors and tradespeople can rough out measurements from a customer's photo before an on-site visit. DIYers can check whether furniture will fit or estimate paint and flooring needs. Real estate professionals can sanity-check room dimensions from listing photos. In every case the result is a fast estimate that should be confirmed with a real measurement before any commitment.</p>
                <h2>How to use this tool</h2>
                <p>Upload a straight-on photo, draw your reference line and enter its known length, then draw additional lines or boxes to measure. Everything runs in your browser; the image is never uploaded to us, and nothing you measure is sent to or stored on a server.</p>
                <h2>Frequently asked questions</h2>
                <h3>How accurate is measuring from a photo?</h3>
                <p>Accuracy depends almost entirely on the photo and the reference. A straight-on shot with a long, well-placed reference line over an object whose length you know precisely can give surprisingly good estimates for things in the same plane. Angled photos, lens distortion, and objects at different depths reduce accuracy, so always verify important measurements in person.</p>
                <h3>Does the photo get uploaded to a server?</h3>
                <p>No. The image is loaded into a canvas in your browser and all measuring happens on your device. The photo is never sent to or stored on our servers.</p>
                <h3>Can it measure area for flooring or paint?</h3>
                <p>It can estimate the area of a rectangular region you draw, which is helpful for rough planning. Because it is a flat 2D scale, treat the result as an estimate and confirm with an on-site measurement before buying materials.</p>`
};

// --- Per-tool rich content + layout, authored as standalone files ---------------
// Each content/<slug>.html file holds one tool's article. It may begin with a
// metadata comment that controls hero media, accent color, and structure:
//   <!--meta {"hero":{"type":"emoji","value":"🐴"},"heroPosition":"top","accent":"#a0522d","layout":"feature"}-->
// An optional <!--more--> marker inside the article splits it: everything before the
// marker renders as a short intro ABOVE the calculator; everything after renders as
// the deep-dive BELOW it. With no marker the whole article renders below the tool.
// Files here populate the same `toolContent` map used above, so inline entries keep
// working and each new tool can be one self-contained file — which lets parallel
// content agents each own a single file with zero merge conflicts.
// Inline layout/hero defaults for existing tools whose articles live in the
// toolContent map above. A content/<slug>.html file (with its own <!--meta-->) will
// override the matching entry here.
const toolMeta = {
  "real-cost-of-owning-a-boat": { hero: { type: "emoji", value: "⛵" }, heroPosition: "top", accent: "#1f6f8b", layout: "feature" },
  "real-cost-of-owning-an-rv": { hero: { type: "emoji", value: "🚐" }, heroPosition: "bottom", accent: "#9a6a2f" },
  "real-cost-of-owning-a-pool": { hero: { type: "emoji", value: "🏊" }, heroPosition: "top", accent: "#2f8fa6" },
  "property-tax-appeal-estimator": { hero: { type: "svg", id: "house" }, heroPosition: "top", accent: "#3a6ea5" },
  "property-tax-estimator": { hero: { type: "svg", id: "coins" }, heroPosition: "bottom", accent: "#3a6ea5" },
  "receipt-warranty-tracker": { hero: { type: "svg", id: "calendar" }, heroPosition: "top", accent: "#7a5cad" },
  "screenshot-measurement-calculator": { hero: { type: "emoji", value: "📐" }, heroPosition: "top", accent: "#c2693a" }
};
const CONTENT_DIR = "content";
if (fs.existsSync(CONTENT_DIR)) {
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (!file.endsWith(".html")) continue;
    const slug = file.replace(/\.html$/, "");
    let raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const metaMatch = raw.match(/^﻿?\s*<!--meta([\s\S]*?)-->/);
    if (metaMatch) {
      try { toolMeta[slug] = JSON.parse(metaMatch[1].trim()); }
      catch (error) { throw new Error(`Invalid <!--meta--> JSON in content/${file}: ${error.message}`); }
      raw = raw.slice(metaMatch.index + metaMatch[0].length);
    } else {
      toolMeta[slug] = {};
    }
    toolContent[slug] = raw.trim();
  }
}

// Inline SVG hero illustrations, keyed by id and driven by currentColor so each
// tool's accent flows through. Emoji heroes need no entry here. Add ids as needed.
const heroSvgs = {
  house: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="M14 44 60 12l46 32"/><path d="M24 40v36h72V40"/><rect x="50" y="52" width="20" height="24"/><path d="M82 30V18h10v19"/></svg>`,
  paw: `<svg viewBox="0 0 120 90" role="img" fill="currentColor"><ellipse cx="60" cy="62" rx="22" ry="17"/><circle cx="34" cy="40" r="9"/><circle cx="52" cy="28" r="9"/><circle cx="68" cy="28" r="9"/><circle cx="86" cy="40" r="9"/></svg>`,
  wheel: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4"><circle cx="60" cy="45" r="30"/><circle cx="60" cy="45" r="9" fill="currentColor"/><path d="M60 15v12M60 63v12M30 45h12M78 45h12M39 24l8 8M73 58l8 8M81 24l-8 8M47 58l-8 8"/></svg>`,
  document: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="M40 10h28l16 16v54H40z"/><path d="M68 10v16h16"/><path d="M48 40h28M48 52h28M48 64h18"/></svg>`,
  calendar: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="28" y="20" width="64" height="56" rx="4"/><path d="M28 36h64M44 12v14M76 12v14"/><circle cx="48" cy="52" r="4" fill="currentColor" stroke="none"/><circle cx="72" cy="52" r="4" fill="currentColor" stroke="none"/></svg>`,
  coins: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4"><ellipse cx="60" cy="30" rx="26" ry="11"/><path d="M34 30v14c0 6 12 11 26 11s26-5 26-11V30"/><path d="M34 44v14c0 6 12 11 26 11s26-5 26-11V44"/></svg>`
  ,benefitCard: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><rect x="14" y="18" width="92" height="56" rx="6"/><circle cx="39" cy="45" r="12"/><path d="M58 35h34M58 47h26M58 59h19"/><path d="M34 45h10M39 40v10"/></svg>`
  ,hourglass: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M34 12h52M34 78h52M40 14c0 16 6 23 20 31-14 8-20 15-20 31M80 14c0 16-6 23-20 31 14 8 20 15 20 31"/><path d="M48 27h24M46 68h28"/></svg>`
  ,passportStamp: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><rect x="22" y="10" width="70" height="68" rx="5"/><circle cx="57" cy="38" r="16"/><path d="M41 38h32M57 22c6 6 9 11 9 16s-3 10-9 16c-6-6-9-11-9-16s3-10 9-16M72 62h28v16H72z"/></svg>`
  ,court: `<svg viewBox="0 0 120 90" role="img" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="M14 30 60 10l46 20zM20 76h80M26 34v34M48 34v34M72 34v34M94 34v34M16 70h88"/></svg>`
};

// Curated decorative spot illustrations for breaking up long-form article copy.
// Inserted into article HTML via {{svg:id}} tokens; never hand-authored by content
// writers. All are stroke-based on currentColor so each tool's accent flows through.
const articleSvgs = {
  coins: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="42" cy="30" rx="22" ry="9"/><path d="M20 30v12c0 5 10 9 22 9s22-4 22-9V30"/><path d="M20 42v12c0 5 10 9 22 9s22-4 22-9V42"/><circle cx="86" cy="46" r="20"/><path d="M86 37v18M80 43h9a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h9"/></svg>`,
  chart: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 14v52h84"/><rect x="30" y="44" width="12" height="22"/><rect x="52" y="32" width="12" height="34"/><rect x="74" y="22" width="12" height="44"/><path d="M30 40 56 26l18 6 22-15"/><path d="M90 17h8v8"/></svg>`,
  calendar: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="28" y="18" width="64" height="50" rx="5"/><path d="M28 32h64M44 12v12M76 12v12"/><circle cx="46" cy="46" r="3" fill="currentColor" stroke="none"/><circle cx="60" cy="46" r="3" fill="currentColor" stroke="none"/><circle cx="74" cy="46" r="3" fill="currentColor" stroke="none"/><circle cx="46" cy="58" r="3" fill="currentColor" stroke="none"/><circle cx="60" cy="58" r="3" fill="currentColor" stroke="none"/></svg>`,
  clock: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="40" r="26"/><path d="M60 25v15l11 7"/></svg>`,
  house: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 40 60 14l36 26"/><path d="M32 36v30h56V36"/><rect x="52" y="48" width="16" height="18"/></svg>`,
  gear: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="40" r="13"/><path d="M60 18v8M60 54v8M82 40h-8M46 40h-8M75.6 24.4l-5.7 5.7M50.1 49.9l-5.7 5.7M75.6 55.6l-5.7-5.7M50.1 30.1l-5.7-5.7"/></svg>`,
  shield: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M60 12l26 9v18c0 18-12 26-26 31-14-5-26-13-26-31V21z"/><path d="M50 39l8 8 14-15"/></svg>`,
  paw: `<svg viewBox="0 0 120 80" role="img" fill="currentColor"><ellipse cx="60" cy="52" rx="18" ry="14"/><circle cx="38" cy="34" r="7"/><circle cx="52" cy="24" r="7"/><circle cx="68" cy="24" r="7"/><circle cx="82" cy="34" r="7"/></svg>`,
  car: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 50l6-18a8 8 0 0 1 7-5h46a8 8 0 0 1 7 5l6 18"/><rect x="18" y="50" width="84" height="12"/><circle cx="38" cy="62" r="7"/><circle cx="82" cy="62" r="7"/></svg>`,
  boat: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M60 14v34M60 20l20 26H60M56 24 42 46h14"/><path d="M28 52h64l-10 16H38z"/></svg>`,
  piggy: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M50 26h14M44 64v-6M76 64v-6"/><path d="M82 44c0-11-11-18-24-18s-24 7-24 18c0 6 3 10 8 14h32c5-4 8-8 8-14z"/><circle cx="50" cy="42" r="2.5" fill="currentColor" stroke="none"/><path d="M82 40l8-3"/></svg>`,
  scale: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M60 16v48M44 64h32M34 26h52"/><path d="M34 26 24 46h20zM86 26 76 46h20"/><path d="M24 46a10 6 0 0 0 20 0M76 46a10 6 0 0 0 20 0"/></svg>`,
  route: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M28 60h28a12 12 0 0 0 0-24H42" stroke-dasharray="2 8"/><path d="M84 22c-8 0-14 6-14 14 0 10 14 22 14 22s14-12 14-22c0-8-6-14-14-14z"/><circle cx="84" cy="36" r="5"/></svg>`,
  spark: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M56 16l6 16 16 6-16 6-6 16-6-16-16-6 16-6z"/><path d="M90 20l2.5 6 6 2.5-6 2.5L90 38l-2.5-6-6-2.5 6-2.5z"/></svg>`,
  document: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M44 12h26l16 16v40H44z"/><path d="M70 12v16h16"/><path d="M52 42h26M52 52h26M52 62h16"/></svg>`,
  checklist: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="34" y="14" width="52" height="56" rx="5"/><path d="M44 30l4 4 7-8M44 48l4 4 7-8M62 30h14M62 50h14"/></svg>`,
  receipt: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M44 12h32v56l-6-5-6 5-6-5-7 5-7-5V12z"/><path d="M52 28h16M52 38h16M52 48h10"/></svg>`,
  leaf: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M40 62c0-26 22-46 46-46 0 26-22 46-46 46z"/><path d="M40 62c9-15 22-26 38-32"/></svg>`,
  bolt: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M66 12 42 46h16l-6 22 26-36H62z"/></svg>`,
  drop: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M60 14c11 15 19 23 19 34a19 19 0 0 1-38 0c0-11 8-19 19-34z"/><path d="M52 50a8 8 0 0 0 8 8"/></svg>`,
  briefcase: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="30" y="28" width="60" height="38" rx="4"/><path d="M48 28v-6a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v6M30 44h60"/></svg>`,
  tag: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M58 18H36v22l30 30 22-22z"/><circle cx="46" cy="30" r="4"/></svg>`,
  users: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="48" cy="34" r="11"/><path d="M30 64c0-12 8-18 18-18s18 6 18 18"/><circle cx="80" cy="38" r="8"/><path d="M74 64c0-10 4-16 12-16s12 6 12 14"/></svg>`,
  heart: `<svg viewBox="0 0 120 80" role="img" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M60 64S34 48 34 32a14 14 0 0 1 26-7 14 14 0 0 1 26 7c0 16-26 32-26 32z"/></svg>`
};

// Replace {{svg:id}} tokens in article HTML with the matching curated illustration,
// wrapped in a decorative figure. Unknown ids are dropped silently.
const expandArticleSvgs = (html) => html.replace(/\{\{svg:([a-z0-9-]+)\}\}/g, (_match, id) =>
  articleSvgs[id] ? `<figure class="article-figure" aria-hidden="true">${articleSvgs[id]}</figure>` : "");

const heroHtml = (meta) => {
  const hero = meta && meta.hero;
  if (!hero) return "";
  const position = meta.heroPosition === "bottom" ? " tool-hero-bottom" : " tool-hero-top";
  // Emoji heroes retired 2026-07: platform-rendered emoji looked low-quality at banner size.
  if (hero.type === "svg" && heroSvgs[hero.id]) {
    return `<div class="tool-hero tool-hero-svg${position}" aria-hidden="true">${heroSvgs[hero.id]}</div>`;
  }
  return "";
};

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
    slug: "convert",
    name: "Convert Files",
    description: "Convert images, PDFs, audio, and documents right in your browser — no uploads, no watermarks, no sign-up.",
    tools: [
      ["image-format-converter", "Image Format Converter", "Convert HEIC, PNG, JPG, WebP, and AVIF photos to PNG, JPG, or WebP."],
      ["image-compressor", "Image Compressor", "Shrink JPG, PNG, and WebP file sizes with a quality slider and a live before-and-after comparison."],
      ["image-resizer", "Image Resizer", "Resize images to exact pixels, a percentage, or common social-media sizes."],
      ["images-to-pdf", "Images to PDF Converter", "Combine JPG, PNG, and WebP images into one PDF with selectable page size."],
      ["pdf-merge-split", "PDF Merger & Splitter", "Merge PDFs into one file, or pull out the pages you need from a single PDF."],
      ["pdf-to-images", "PDF to Image Converter", "Render every page of a PDF as a downloadable PNG or JPG image."],
      ["pdf-word-text-extractor", "PDF & Word Text Extractor", "Pull clean text out of PDF and DOCX files with instant word and character counts."],
      ["markdown-html-converter", "Markdown to HTML Converter", "Convert Markdown to clean HTML with a live preview, or turn HTML back into Markdown."],
      ["svg-to-png-converter", "SVG to PNG Converter", "Rasterize an SVG to PNG at any size, or generate a full favicon size set."],
      ["exif-viewer-remover", "EXIF Viewer & Remover", "See the hidden metadata in a photo — including GPS location — and download a clean copy."],
      ["audio-converter", "Audio Converter & Trimmer", "Convert audio files to MP3 or WAV and trim the start and end."],
      ["csv-to-excel-converter", "CSV to Excel Converter", "Turn one or more CSV files into a downloadable Excel workbook."]
    ]
  },
  {
    slug: "calculators",
    name: "Everyday Calculators",
    description: "Fast, free calculators for dates, money, health, and school — instant answers, no sign-up.",
    tools: [
      ["percentage-calculator", "Percentage Calculator", "Work out X% of Y, what percent one number is of another, and percent change."],
      ["age-calculator", "Age Calculator", "Find an exact age in years, months, and days, plus weeks, days, and the next birthday."],
      ["date-calculator", "Date Calculator", "Count days between dates, add or subtract time, or count business days."],
      ["tip-calculator", "Tip Calculator", "Split a bill, set a tip percentage, and get the per-person total with optional rounding."],
      ["loan-payment-calculator", "Loan & Mortgage Calculator", "Estimate a monthly payment, total interest, and a full amortization schedule."],
      ["salary-to-hourly-calculator", "Salary to Hourly Calculator", "Convert between hourly, weekly, monthly, and annual pay from any starting figure."],
      ["bmi-calculator", "BMI Calculator", "Estimate body mass index from height and weight in metric or imperial units."],
      ["gpa-calculator", "GPA Calculator", "Add your courses, grades, and credits for a weighted and unweighted GPA."],
      ["due-date-calculator", "Pregnancy Due Date Calculator", "Estimate a due date and current week from a last period, conception, or IVF date."],
      ["time-zone-meeting-planner", "Time Zone Meeting Planner", "Compare one meeting time across several time zones with daylight-saving handled."]
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
      ["real-cost-of-owning-a-horse", "Real Cost of Owning a Horse", "Estimate annual boarding, feed, farrier, vet, and training costs."],
      ["real-cost-of-owning-a-dog", "Real Cost of Owning a Dog", "Estimate annual food, vet, grooming, insurance, and boarding costs."],
      ["real-cost-of-owning-a-cat", "Real Cost of Owning a Cat", "Estimate annual food, litter, vet, and supply costs for a cat."],
      ["real-cost-of-owning-a-hot-tub", "Real Cost of Owning a Hot Tub", "Estimate annual energy, chemicals, water, and service costs."],
      ["real-cost-of-owning-a-car", "Real Cost of Owning a Car", "Estimate financing, fuel, insurance, maintenance, and registration costs."],
      ["real-cost-of-raising-backyard-chickens", "Real Cost of Raising Backyard Chickens", "Estimate annual feed, bedding, health, and coop costs for a flock."],
      ["real-cost-of-lawn-care", "Real Cost of Lawn Care", "Estimate annual mowing, fertilizer, irrigation, and equipment costs."],
      ["real-cost-of-owning-a-septic-system", "Real Cost of Owning a Septic System", "Estimate annual pumping, inspection, repair, and drainfield reserve costs."],
      ["real-cost-of-owning-a-motorcycle", "Real Cost of Owning a Motorcycle", "Estimate financing, fuel, insurance, tires, gear, and registration costs."],
      ["solar-panel-payback-calculator", "Solar Panel Payback Calculator", "Estimate net system cost after incentives, annual savings, and payback period."],
      ["real-cost-of-owning-a-rental-property", "Real Cost of Owning a Rental Property", "Estimate mortgage, operating costs, vacancy, and annual rental cash flow."],
      ["real-cost-of-owning-an-electric-car", "Real Cost of Owning an Electric Car", "Estimate financing, charging, insurance, tires, maintenance, and registration costs."],
      ["real-cost-of-owning-a-jet-ski", "Real Cost of Owning a Jet Ski", "Estimate annual storage, fuel, insurance, winterization, and registration costs."],
      ["real-cost-of-owning-a-second-home", "Real Cost of Owning a Second Home", "Estimate mortgage, property tax, insurance, utilities, upkeep, and travel costs."],
      ["real-cost-of-owning-a-classic-car", "Real Cost of Owning a Classic Car", "Estimate agreed-value insurance, storage, upkeep, and appreciation for a collector car."],
      ["real-cost-of-owning-a-vacation-rental", "Real Cost of Owning a Vacation Rental", "Estimate mortgage, operating costs, platform fees, and net short-term rental income."],
      ["moving-cost-estimator", "Moving Cost Estimator", "Estimate truck, movers, mileage, supplies, lodging, and other costs."],
      ["roommate-expense-splitter", "Roommate Expense Splitter", "Split shared expenses evenly or by custom percentages."],
      ["home-maintenance-budget-calculator", "Home Maintenance Budget Calculator", "Build an annual maintenance reserve from home value, age, and systems."],
      ["property-tax-estimator", "Property Tax Estimator", "Estimate annual and monthly property tax from assessed value and rate."],
      ["property-tax-appeal-estimator", "Property Tax Appeal Estimator", "Gauge appeal success odds and tax savings from your assessment, purchase price, and comparable homes."],
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
    slug: "government",
    name: "Government & Deadlines",
    description: "Turn federal eligibility rules and user-verified filing periods into clear planning dates and checklists.",
    tools: [
      ["social-security-claiming-age-calculator", "Social Security Claiming Age Calculator", "Compare a planned claiming age with full retirement age and estimate the monthly adjustment."],
      ["rmd-calculator", "Required Minimum Distribution Calculator", "Estimate an owner RMD using the IRS Uniform Lifetime Table and a prior year-end balance."],
      ["tax-refund-timing-estimator", "Tax Refund Timing Estimator", "Build a typical federal refund processing window from the return type and accepted date."],
      ["fmla-eligibility-calculator", "FMLA Eligibility Calculator", "Screen the four basic federal employee-eligibility requirements for FMLA leave."],
      ["naturalization-residency-date-calculator", "Naturalization Residency Date Calculator", "Estimate the 90-day early-filing date and screen residence and physical-presence inputs."],
      ["i94-overstay-date-calculator", "I-94 Admit Until Date Calculator", "Compare a planned departure or current date with a date-certain I-94 admission record."],
      ["small-claims-deadline-calculator", "Small Claims Deadline Calculator", "Apply a locally verified limitation period and personal safety margin to a claim date."]
    ]
  },
  {
    slug: "useful",
    name: "Weirdly Useful",
    description: "Small browser utilities for images, filenames, codes, and awkward one-off jobs.",
    tools: [
      ["screenshot-measurement-calculator", "Screenshot Measurement Calculator", "Draw on a photo, set one known length, and estimate wall lengths, dimensions, and floor area."],
      ["receipt-warranty-tracker", "Receipt Scanner & Warranty Tracker", "Scan a receipt, capture the purchase, and create a warranty expiration reminder for your calendar."],
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
  },
  {
    slug: "quizzes",
    name: "Quizzes & Tests",
    description: "Free self-assessments, skill tests, and just-for-fun quizzes with instant results: an original reasoning (IQ-style) test, typing and reaction speed tests, a memory test, a personality profiler, a color-blindness screening, and more. No sign-up, no email, nothing stored.",
    tools: [
      ["iq-test", "IQ Test", "Estimate your reasoning ability with an original, timed test spanning pattern, number, verbal, and spatial puzzles."],
      ["typing-speed-test", "Typing Speed Test", "Type a passage and measure your live WPM and accuracy in 15, 30, or 60 second modes — nothing saved."],
      ["reaction-time-test", "Reaction Time Test", "Click the moment the pad turns green across five rounds to measure your average reaction time in milliseconds."],
      ["click-speed-test", "Click Speed Test", "Click a pad as fast as you can in 5, 10, or 30 seconds to find your clicks-per-second (CPS) score."],
      ["memory-test", "Memory Test", "See how many digits your working memory can hold with a progressive digit-span recall test."],
      ["color-blindness-test", "Color Blindness Test", "Take a free at-home Ishihara-style red-green color-vision screening with plates drawn fresh in your browser."],
      ["love-calculator", "Love Calculator", "Enter two names for an instant, just-for-fun compatibility score — the same pair always gives the same result."],
      ["personality-type-test", "Personality Type Test", "Find your dominant personality type and your affinity for every type with an original color-style profiler."],
      ["zodiac-compatibility", "Zodiac Compatibility", "See how any two star signs work together, with an in-depth strengths breakdown and a few things to watch."]
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

// Search-result <title>: lead with FREE + tool name, then as much of the
// capability as fits in a Google-friendly length, cut on a word boundary.
const seoTitle = (name, description = "", max = 70) => {
  const base = `FREE ${name}`;
  let cap = String(description).trim().replace(/\.$/, "");
  const room = max - base.length - 3; // " – "
  if (!cap || room < 24) return base; // long name; keep the title clean
  if (cap.length > room) {
    cap = cap.slice(0, room);
    const lastSpace = cap.lastIndexOf(" ");
    if (lastSpace > 0) cap = cap.slice(0, lastSpace);
  }
  // Avoid ending on a dangling preposition/conjunction or stray punctuation.
  const trimEnds = (s) => s.replace(/[\s,;:–-]+$/, "");
  cap = trimEnds(cap).replace(/\s+(?:and|or|for|with|of|to|in|on|by|a|an|the|using|from|that)$/i, "");
  cap = trimEnds(cap);
  if (cap.length < 12) return base;
  return `${base} – ${cap}`;
};

const header = (prefix = "") => `
  <header class="site-header">
    <a class="brand" href="${prefix}index.html" aria-label="${SITE_NAME} home">
      <img src="${prefix}assets/brand/nifty-utilities-logo-512.png" width="512" height="256" alt="${SITE_NAME}">
    </a>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" class="site-nav" aria-label="Main navigation">
      <div class="nav-dropdown">
        <button class="nav-drop-button" type="button" aria-expanded="false" aria-controls="nav-categories" aria-haspopup="true">Categories<span class="nav-caret" aria-hidden="true">▾</span></button>
        <div id="nav-categories" class="nav-drop-menu">
          <a href="${prefix}index.html">All tools</a>
          ${categories.map((category) => `<a href="${prefix}${category.slug}/index.html">${escapeHtml(category.name.replace(" / CSV", "").replace(" / Data", ""))}</a>`).join("\n          ")}
        </div>
      </div>
    </nav>
  </header>`;

const footer = (prefix = "") => `
  <footer class="site-footer">
    <div><strong>${SITE_NAME}</strong><br><span>Everything runs in your browser. We never see your data and can't save it.</span><br><a class="footer-badge" href="${prefix}promise.html"><span class="status-light"></span>All data stays on your device</a></div>
    <div class="footer-links"><a href="${prefix}about.html">About</a><a href="${prefix}promise.html">Our promise</a><a href="${prefix}privacy.html">Privacy</a><a href="${prefix}terms.html">Terms</a><a href="${prefix}contact.html">Contact</a></div>
  </footer>`;

const page = ({ title, description, body, pathname, prefix = "", scripts = "", pageType = "WebPage", extraSchema = [], indexable = true, titleTag, ogImage }) => {
  const canonical = `${SITE_URL}${pathname}`;
  const socialImage = ogImage || `${SITE_URL}/assets/brand/nifty-utilities-social-card.png`;
  // titleTag, when provided, is the verbatim <title>/social title (no brand suffix appended).
  const metaTitle = titleTag || `${title} | ${SITE_NAME}`;
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
  <meta name="theme-color" content="#0f1720">
  <meta name="application-name" content="${SITE_NAME}">
  <meta name="apple-mobile-web-app-title" content="${SITE_NAME}">
  <meta name="msapplication-config" content="${prefix}browserconfig.xml">
  <meta name="msapplication-TileColor" content="#0f1720">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(metaTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${socialImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(ogImage ? `${title} — ${SITE_NAME}` : `${SITE_NAME} toolbox logo`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${socialImage}">
  <title>${escapeHtml(metaTitle)}</title>
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en-US" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="icon" href="${prefix}favicon.ico" sizes="any">
  <link rel="icon" href="${prefix}assets/icons/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="${prefix}assets/icons/favicon-16x16.png" type="image/png" sizes="16x16">
  <link rel="apple-touch-icon" href="${prefix}assets/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="mask-icon" href="${prefix}assets/icons/safari-pinned-tab.svg" color="#2dd4bf">
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

// FAQ. Every tool's article already ends in a visible "Frequently asked
// questions" section (<h3> question / <p> answer pairs). extractFaq() harvests
// those into structured [{q, a}] pairs so we can emit FAQPage JSON-LD that
// mirrors the on-page text exactly — no duplicate visible block, no authoring.
// faqSection() remains available to render a visible block for any future tool
// that supplies an authored `faq` array in its meta but has no article FAQ.
const normalizeFaq = (faq) =>
  (Array.isArray(faq) ? faq : []).filter((item) => item && item.q && item.a);

const stripTags = (html) => html
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Pull the <h3>/<p> pairs out of an article's "Frequently asked questions"
// <h2> section. Returns [] when the article has no such section.
const extractFaq = (html) => {
  const heading = html.match(/<h2[^>]*>\s*Frequently asked questions\s*<\/h2>/i);
  if (!heading) return [];
  let region = html.slice(heading.index + heading[0].length);
  const nextH2 = region.search(/<h2[\s>]/i);
  if (nextH2 >= 0) region = region.slice(0, nextH2);
  const items = [];
  // Layout A (most tools): <h3>question</h3> followed by one or more <p>answers.
  const pair = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[\s>]|$)/gi;
  let match;
  while ((match = pair.exec(region))) {
    const q = stripTags(match[1]);
    const a = [...match[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((p) => stripTags(p[1]))
      .filter(Boolean)
      .join(" ");
    if (q && a) items.push({ q, a });
  }
  if (items.length) return items;
  // Layout B (quizzes): <p><strong>question?</strong> answer</p> per Q&A.
  const inline = /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/gi;
  while ((match = inline.exec(region))) {
    const q = stripTags(match[1]);
    const a = stripTags(match[2]);
    if (q && a) items.push({ q, a });
  }
  return items;
};

const faqSection = (faq) => {
  const items = normalizeFaq(faq);
  if (!items.length) return "";
  return `
                <section class="tool-faq" aria-labelledby="faq-heading">
                  <h2 id="faq-heading">Frequently asked questions</h2>${items.map(({ q, a }) => `
                  <div class="faq-item">
                    <h3>${escapeHtml(q)}</h3>
                    <p>${escapeHtml(a)}</p>
                  </div>`).join("")}
                </section>`;
};

const faqSchema = (faq, url) => {
  const items = normalizeFaq(faq);
  if (!items.length) return [];
  return [{
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  }];
};

const toolCards = (tools, prefix = "../") => tools.map(([slug, name, description]) => `
  <a class="tool-card" href="${prefix}${slug}.html">
    <span class="tool-arrow" aria-hidden="true">↗</span>
    <h3>${escapeHtml(name)}</h3>
    <p>${escapeHtml(description)}</p>
  </a>`).join("");

// Quizzes highlighted on every individual tool page for internal backlinking.
const FEATURED_QUIZ_SLUGS = ["iq-test", "typing-speed-test", "reaction-time-test", "love-calculator"];

const toolBySlug = new Map(allTools.map((tool) => [tool.slug, tool]));

// Tools that specifically handle real-world, messy tabular input (currency
// symbols, stray whitespace, blank rows, mismatched columns). They get a
// "Built for real, messy CSVs" capability badge in the hero.
const messyCsvTools = new Set([
  "bank-statement-cleaner", "excel-to-csv-cleaner", "remove-duplicate-rows",
  "merchant-name-normalizer", "personal-spending-categorizer", "credit-card-statement-analyzer",
  "csv-bank-format-converter", "column-mapper", "delimiter-converter",
  "compare-two-csvs", "duplicate-transaction-finder"
]);
for (const slug of messyCsvTools) {
  if (!toolBySlug.has(slug)) throw new Error(`messyCsvTools slug "${slug}" is not a registered tool`);
}

// Curated cross-category "related tools" pairs. Same-category siblings already get a
// full link mesh, so only list genuinely related tools that live in a DIFFERENT
// category. Links are made symmetric at build time (list a pair once, both pages get
// it) and capped per page. Unknown slugs fail the build so typos can't ship.
const crossLinks = {
  "image-format-converter": ["image-dimensions-inspector", "duplicate-photo-detector"],
  "image-compressor": ["image-dimensions-inspector"],
  "image-resizer": ["image-dimensions-inspector", "screenshot-measurement-calculator"],
  "images-to-pdf": ["printable-receipt-generator", "receipt-warranty-tracker"],
  "pdf-merge-split": ["printable-receipt-generator"],
  "pdf-to-images": ["screenshot-table-extractor", "screenshot-to-csv"],
  "pdf-word-text-extractor": ["screenshot-to-csv", "screenshot-table-extractor"],
  "markdown-html-converter": ["json-csv-converter", "csv-formula-generator"],
  "svg-to-png-converter": ["qr-batch-generator", "barcode-generator", "image-dimensions-inspector"],
  "exif-viewer-remover": ["duplicate-photo-detector", "image-dimensions-inspector", "filename-cleaner"],
  "audio-converter": ["bulk-file-renamer", "filename-cleaner"],
  "csv-to-excel-converter": ["excel-to-csv-cleaner", "json-csv-converter", "delimiter-converter", "bank-statement-cleaner"],
  "personal-spending-categorizer": ["csv-to-excel-converter"],
  "credit-card-statement-analyzer": ["csv-to-excel-converter"],
  "bank-statement-cleaner": ["excel-to-csv-cleaner", "remove-duplicate-rows"],
  "csv-bank-format-converter": ["column-mapper", "delimiter-converter"],
  "duplicate-transaction-finder": ["remove-duplicate-rows", "compare-two-csvs"],
  "net-worth-tracker": ["estate-inventory-worksheet", "rmd-calculator"],
  "social-security-claiming-age-calculator": ["net-worth-tracker"],
  "mileage-log-generator": ["real-cost-of-owning-a-car"],
  "bill-of-sale-generator": ["vin-decoder"],
  "home-inventory-generator": ["home-maintenance-budget-calculator", "moving-cost-estimator"],
  "rent-receipt-generator": ["rent-vs-buy-calculator"],
  "real-cost-of-owning-a-rental-property": ["rent-receipt-generator"],
  "invoice-number-generator": ["service-pricing-calculator", "hourly-rate-calculator"],
  "equipment-inventory-generator": ["job-cost-calculator"],
  "affidavit-generator": ["small-claims-deadline-calculator"],
  "receipt-warranty-tracker": ["printable-receipt-generator"],
  "vin-decoder": ["real-cost-of-owning-a-car", "lease-vs-buy-calculator"],
  "loan-payment-calculator": ["rent-vs-buy-calculator", "debt-avalanche-calculator", "debt-snowball-calculator", "real-cost-of-owning-a-rental-property"],
  "salary-to-hourly-calculator": ["hourly-rate-calculator", "net-worth-tracker"],
  "tip-calculator": ["roommate-expense-splitter"],
  "percentage-calculator": ["profit-margin-calculator", "sales-commission-calculator"],
  "date-calculator": ["small-claims-deadline-calculator", "naturalization-residency-date-calculator"],
  "age-calculator": ["social-security-claiming-age-calculator", "rmd-calculator"],
  "gpa-calculator": ["iq-test"],
  "due-date-calculator": ["home-inventory-generator"],
  "bmi-calculator": ["reaction-time-test"],
  "time-zone-meeting-planner": ["invoice-number-generator"]
};

const relatedBySlug = new Map();
const addRelated = (from, to) => {
  if (from === to) return;
  if (!relatedBySlug.has(from)) relatedBySlug.set(from, new Set());
  relatedBySlug.get(from).add(to);
};
for (const [slug, targets] of Object.entries(crossLinks)) {
  if (!toolBySlug.has(slug)) throw new Error(`crossLinks key "${slug}" is not a registered tool`);
  for (const target of targets) {
    if (!toolBySlug.has(target)) throw new Error(`crossLinks target "${target}" (under "${slug}") is not a registered tool`);
    addRelated(slug, target);
    addRelated(target, slug);
  }
}

// "More tools" block injected into each individual tool page (never hub pages).
// Lists every same-category sibling as a compact link (full internal mesh), curated
// cross-category related tools as badged cards, plus a highlighted set of quizzes.
// Never self-links; skips anything already shown higher in the section.
const relatedToolsSection = (category, currentSlug) => {
  const cleanCat = category.name.replace(" / CSV", "").replace(" / Data", "");
  const siblings = category.tools.filter(([slug]) => slug !== currentSlug);
  const shown = new Set(siblings.map(([slug]) => slug));
  const siblingLinks = siblings
    .map(([slug, name]) => `<a class="related-link" href="${slug}.html">${escapeHtml(name)}</a>`)
    .join("");

  const crossCards = [...(relatedBySlug.get(currentSlug) || [])]
    .filter((slug) => !shown.has(slug))
    .slice(0, 4)
    .map((slug) => {
      const tool = toolBySlug.get(slug);
      shown.add(slug);
      const href = tool.category === category.slug ? `${slug}.html` : `../${tool.category}/${slug}.html`;
      const badge = tool.categoryName.replace(" / CSV", "").replace(" / Data", "");
      return `
                  <a class="tool-card tool-card-related" href="${href}">
                    <span class="tool-badge tool-badge-related">${escapeHtml(badge)}</span>
                    <span class="tool-arrow" aria-hidden="true">↗</span>
                    <h3>${escapeHtml(tool.name)}</h3>
                    <p>${escapeHtml(tool.description)}</p>
                  </a>`;
    })
    .join("");

  const quizTools = categories.find((c) => c.slug === "quizzes").tools;
  const quizPrefix = category.slug === "quizzes" ? "" : "../quizzes/";
  const featuredCards = FEATURED_QUIZ_SLUGS
    .map((qs) => quizTools.find(([slug]) => slug === qs))
    .filter(Boolean)
    .filter(([slug]) => slug !== currentSlug && !shown.has(slug))
    .map(([slug, name, description]) => `
                  <a class="tool-card tool-card-featured" href="${quizPrefix}${slug}.html">
                    <span class="tool-badge">Quiz</span>
                    <span class="tool-arrow" aria-hidden="true">↗</span>
                    <h3>${escapeHtml(name)}</h3>
                    <p>${escapeHtml(description)}</p>
                  </a>`)
    .join("");

  if (!siblingLinks && !crossCards && !featuredCards) return "";
  return `
              <section class="related-tools" aria-label="More tools you might like">
                ${siblingLinks ? `<h2>Try these other ${escapeHtml(cleanCat)} tools</h2>
                <div class="related-links">${siblingLinks}</div>` : ""}
                ${crossCards ? `<h2>Pairs well with this tool</h2>
                <div class="tool-grid related-quizzes">${crossCards}</div>` : ""}
                ${featuredCards ? `<h2>Popular quizzes</h2>
                <div class="tool-grid related-quizzes">${featuredCards}</div>` : ""}
              </section>`;
};

// Tool-chaining CTA: a single, prominent "Next step" link shown right under the
// tool workspace. Picks the most-relevant curated cross-link (first entry in
// relatedBySlug), falling back to the first same-category sibling. Turns one
// tool-use into the start of a workflow.
const nextStepCta = (category, slug) => {
  const related = [...(relatedBySlug.get(slug) || [])];
  let target = related.length ? toolBySlug.get(related[0]) : null;
  if (!target) {
    const sibling = category.tools.find(([s]) => s !== slug);
    target = sibling ? toolBySlug.get(sibling[0]) : null;
  }
  if (!target) return "";
  const href = target.category === category.slug
    ? `${target.slug}.html`
    : `../${target.category}/${target.slug}.html`;
  return `
              <a class="next-step" href="${href}">
                <span class="next-step-label">Next step</span>
                <span class="next-step-name">${escapeHtml(target.name)} <span class="next-step-arrow" aria-hidden="true">→</span></span>
                <span class="next-step-desc">${escapeHtml(target.description)}</span>
              </a>`;
};

fs.mkdirSync("assets", { recursive: true });

const homeBody = `
<main id="main">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Browser tools for work that keeps moving</p>
      <h1>Nifty little tools that just work.</h1>
      <p class="hero-lede">Clean up a spreadsheet, check a deadline, or print a form in seconds. Everything runs right in your browser, and nothing you type ever leaves your device.</p>
      <div class="search-wrap">
        <label class="search-box">
          <span class="sr-only">Search all tools</span>
          <input id="tool-search" type="search" placeholder="Search ${allTools.length} tools, e.g. boat, CSV, mileage…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="search-results">
          <kbd>/</kbd>
        </label>
        <div id="search-results" class="search-results" hidden></div>
      </div>
    </div>
  </section>
  <section id="recent-tools" class="recent-tools" aria-label="Recently used tools" hidden></section>
  ${adWide}
  <section class="proof-strip" aria-label="Site trust points">
    <div class="proof-item">
      <strong>Browser-only processing</strong>
      <p>Calculations and file handling happen on your device, not on a server.</p>
    </div>
    <div class="proof-item">
      <strong>No account to create</strong>
      <p>Open a tool, use it, and leave without signing up or handing over an email.</p>
    </div>
    <div class="proof-item">
      <strong>Made for practical output</strong>
      <p>Most tools produce cleaned data, printable forms, or a clear next step.</p>
    </div>
    <div class="proof-item">
      <strong>Built for messy inputs</strong>
      <p>Statement exports, receipts, CSVs, deadlines, and rough estimates are the point.</p>
    </div>
  </section>

  <section class="feature-strip" aria-labelledby="why-title">
    <div class="feature-panel">
      <p class="eyebrow">Why it feels different</p>
      <h2 id="why-title">A quiet toolbox, not a crowded product tour.</h2>
      <p>Nifty Utilities is aimed at the work people do in between bigger apps: cleaning a file before import, checking the cost of a decision, or generating something printable without setting up software.</p>
      <ul class="feature-list">
        <li>
          <div>
            <strong>Fast to understand</strong>
            <span>Each page names the job plainly and shows the inputs in the order people already think about them.</span>
          </div>
        </li>
        <li>
          <div>
            <strong>Designed for imperfect data</strong>
            <span>Most tools accept rough estimates, inconsistent CSVs, or browser-side files that need a little rescue.</span>
          </div>
        </li>
        <li>
          <div>
            <strong>Portable output</strong>
            <span>Results are meant to be copied, printed, downloaded, or checked against a next step.</span>
          </div>
        </li>
      </ul>
      <div class="ph-badges">
        <a class="ph-badge" href="https://www.producthunt.com/products/nifty-utilities?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-nifty-utilities" target="_blank" rel="noopener noreferrer"><img alt="Nifty Utilities - 100+ everyday tools that never upload your files | Product Hunt" width="250" height="54" loading="lazy" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1194559&amp;theme=light&amp;t=1783885492202"></a>
        <a class="ph-badge" href="https://backlinklog.com/listing/niftyutilities.com?utm_source=backlinklog&amp;utm_medium=badge" target="_blank" rel="noopener noreferrer"><img alt="Listed on BacklinkLog" width="160" height="40" loading="lazy" src="https://backlinklog.com/badge/niftyutilities.com.svg"></a>
      </div>
    </div>
    <div class="feature-panel">
      <p class="eyebrow">Best starting points</p>
      <h2>Start with the task you actually have.</h2>
      <div class="workflow-grid">
        <article class="workflow-card">
          <h3>Clean a CSV</h3>
          <p>Normalize statements, remove duplicates, convert delimiters, or compare two files side by side.</p>
          <a href="spreadsheet/index.html">Open spreadsheet tools</a>
        </article>
        <article class="workflow-card">
          <h3>Check the cost</h3>
          <p>Estimate debt payoff, home expenses, business pricing, or a purchase you have not committed to yet.</p>
          <a href="homeowner/index.html">Open cost calculators</a>
        </article>
        <article class="workflow-card">
          <h3>Make a document</h3>
          <p>Generate receipts, logs, inventory sheets, and printable records without a separate template app.</p>
          <a href="documents/index.html">Open document tools</a>
        </article>
        <article class="workflow-card">
          <h3>Take a test</h3>
          <p>Try the timed IQ test, check your typing speed or reaction time, or find your personality type — original tests, instant results.</p>
          <a href="quizzes/iq-test.html">Start the IQ test</a>
        </article>
      </div>
    </div>
  </section>

  <section class="directory" aria-labelledby="directory-title">
    <div class="section-heading">
      <div><p class="eyebrow">Tool directory</p><h2 id="directory-title">Browse by category</h2></div>
      <p id="search-status">${allTools.length} tools, zero sign-ups</p>
    </div>
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
  title: `${allTools.length} Browser Tools for Everyday Work`,
  titleTag: `FREE Online Tools – ${allTools.length} Browser Utilities, No Sign-Up | ${SITE_NAME}`,
  description: "Practical browser tools for CSV files, finance, documents, home costs, and business math, plus a free IQ test and quizzes. No sign-up; data stays on your device.",
  pathname: "/",
  pageType: "CollectionPage",
  body: homeBody,
  scripts: `<script>window.PLAINTOOLS=${JSON.stringify(allTools)};</script>`
}));

for (const category of categories) {
  fs.mkdirSync(category.slug, { recursive: true });
  const commonTasks = category.tools.slice(0, 3).map(([slug, name, description]) => `
            <li>
              <div>
                <strong>${escapeHtml(name)}</strong>
                <span>${escapeHtml(description)}</span>
              </div>
            </li>`).join("");
  fs.writeFileSync(path.join(category.slug, "index.html"), page({
    title: `Free ${category.name} Tools`,
    titleTag: seoTitle(`${category.name} Tools`, `${category.tools.length} free utilities, no sign-up`),
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
        <section class="category-intro">
          <div class="category-note">
            <strong>What this category is for</strong>
            <p>${escapeHtml(category.description)} These tools are meant for local, browser-first work: cleaning, comparing, estimating, and generating something you can use right away.</p>
          </div>
          <div class="category-note">
            <strong>Common starting points</strong>
            <ul class="feature-list">${commonTasks}</ul>
          </div>
        </section>
        ${adWide}
        <section class="directory compact-directory">
          <div class="tool-grid">${toolCards(category.tools, "")}</div>
        </section>
      </main>`
  }));

  for (const [slug, name, description] of category.tools) {
    const meta = toolMeta[slug] || {};
    const accentStyle = meta.accent ? ` style="--tool-accent:${meta.accent}"` : "";
    const layoutClass = meta.layout ? ` layout-${meta.layout}` : "";
    const hero = heroHtml(meta);
    const heroTop = meta.heroPosition !== "bottom" ? hero : "";
    const heroBottom = meta.heroPosition === "bottom" ? hero : "";
    // Optional <!--more--> split: lead paragraph(s) above the tool, deep dive below.
    const article = toolContent[slug] || `
                <h2>About this ${escapeHtml(name).toLowerCase()}</h2>
                <p>${escapeHtml(description)} Use it free without creating an account or uploading data to ${SITE_NAME}.</p>
                <h2>How it works</h2>
                <p>Enter or select your information, review the result, then download or print it when available. Inputs remain on this device.</p>`;
    const splitIndex = article.indexOf("<!--more-->");
    const introHtml = splitIndex >= 0 ? `<section class="tool-intro">${expandArticleSvgs(article.slice(0, splitIndex))}</section>` : "";
    const bodyHtml = expandArticleSvgs(splitIndex >= 0 ? article.slice(splitIndex + "<!--more-->".length) : article);
    // Harvest the article's existing "Frequently asked questions" section into
    // FAQPage JSON-LD. If a tool has no article FAQ but supplies an authored
    // meta.faq, render a visible block from that instead. The two are mutually
    // exclusive so the visible FAQ is never duplicated.
    const articleFaq = extractFaq(article);
    const authoredFaq = normalizeFaq(meta.faq);
    const faq = articleFaq.length ? articleFaq : authoredFaq;
    const authoredFaqSection = articleFaq.length ? "" : faqSection(authoredFaq);
    // Per-tool OG image (built by scripts/generate-og-images.mjs). Falls back to
    // the generic social card when the tool's image hasn't been rendered yet.
    const ogImagePath = path.join("assets", "og", `${slug}.jpg`);
    const ogImage = fs.existsSync(ogImagePath) ? `${SITE_URL}/assets/og/${slug}.jpg` : undefined;
    fs.writeFileSync(path.join(category.slug, `${slug}.html`), page({
      title: `Free ${name}`,
      titleTag: meta.titleTag || seoTitle(name, description),
      description: meta.metaDescription || `Free online ${name.toLowerCase()}. ${description} No sign-up; processing stays in your browser.`,
      pathname: `/${category.slug}/${slug}.html`,
      prefix: "../",
      ogImage,
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
        },
        ...faqSchema(faq, `${SITE_URL}/${category.slug}/${slug}.html`)
      ],
      body: `
        <main id="main">
          <section class="category-hero tool-hero-band${layoutClass}"${accentStyle}>
            <p class="breadcrumbs"><a href="../index.html">All tools</a><span>/</span><a href="index.html">${escapeHtml(category.name)}</a></p>
            <p class="eyebrow">${escapeHtml(category.name)}</p>
            <h1>${escapeHtml(name)}</h1>
            <p>${escapeHtml(description)}</p>
            <div class="hero-badges"><div class="local-badge"><span class="status-light"></span>No data sent or stored</div>${messyCsvTools.has(slug) ? `<div class="messy-badge">Built for real, messy CSVs</div>` : ""}</div>
          </section>
          <div class="tool-layout">
            <article class="tool-page${layoutClass}"${accentStyle}>
              ${heroTop}
              ${introHtml}
              <section id="tool-root" class="tool-workspace" data-tool="${slug}" data-tool-name="${escapeHtml(name)}" data-tool-cat="${escapeHtml(category.name)}">
                <div class="loading-state">Loading tool…</div>
              </section>
              ${nextStepCta(category, slug)}
              ${heroBottom}
              ${relatedToolsSection(category, slug)}
              <section class="tool-help">
                <div class="privacy-callout">
                  <h2>Your data never reaches us</h2>
                  <p>${SITE_NAME} has no backend server, database, user accounts, or endpoint capable of receiving your tool inputs. Files and entries are processed inside your browser. We cannot view, capture, or store them.</p>
                </div>
                ${bodyHtml}
                ${authoredFaqSection}
                <h2>Important</h2>
                <p>${meta.disclaimer || "This tool provides estimates and general-purpose documents, not financial, tax, legal, or professional advice. Verify important results before relying on them."}</p>
                <h2>Support</h2>
                ${toolSupportNote}
              </section>
            </article>
            <aside class="tool-sidebar">
              ${adTall}
            </aside>
          </div>
        </main>`,
      scripts: `<script src="../assets/${meta.script || "tool.js"}" defer></script>`
    }));
  }
}

fs.writeFileSync("privacy.html", page({
  title: "Privacy",
  description: `${SITE_NAME} privacy information and local browser processing policy.`,
  pathname: "/privacy.html",
  body: `<main id="main" class="prose-page"><p class="eyebrow">${SITE_NAME}</p><h1>Your data never reaches us.</h1><p>${SITE_NAME} is a static website. It has no application backend, database, user accounts, upload service, or form submission endpoint. There is no ${SITE_NAME} system capable of receiving, viewing, capturing, or storing the files and information you enter into these tools.</p><p>Calculations and file processing happen inside your web browser on your device. Your inputs are not transmitted to ${SITE_NAME}.</p><h2>Local storage</h2><p>The Net Worth Tracker can save information in your browser's local storage so it remains available on that device. That information still does not leave your browser. You can remove it with the tool's clear button or your browser settings.</p><h2>Downloaded libraries</h2><p>A few advanced tools download software libraries from a public content delivery network. The libraries run in your browser; ${SITE_NAME} does not send your tool inputs or files to those providers.</p><h2>Security and script policy</h2><p>${SITE_NAME} loads a deliberately small, fixed set of code, and none of it has any channel back to us for your data. This is the complete list of what any page is allowed to load:</p><ul><li><strong>Our own files</strong> (scripts, styles, images) served from <code>niftyutilities.com</code>.</li><li><strong>Google Analytics and Google AdSense</strong> — from <code>googletagmanager.com</code> and <code>googlesyndication.com</code> — for anonymous traffic measurement and the ads that keep the tools free. They load with consent controls and operate at the page level; they never receive the contents of what you type, upload, or calculate.</li><li><strong>One code library host</strong>, <code>cdn.jsdelivr.net</code>, used only by a few advanced tools (for example PDF and audio conversion) to load open-source libraries that then run entirely in your browser.</li></ul><p>There are no other third-party scripts, no external trackers beyond the two Google services above, and no web fonts or beacons. Expressed as a Content Security Policy, the intended posture is:</p><pre class="code-block">default-src 'self';
script-src 'self' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://cdn.jsdelivr.net;
connect-src 'self' https://www.google-analytics.com;
img-src 'self' data: https:;
style-src 'self' 'unsafe-inline';
frame-src https://googleads.g.doubleclick.net;
object-src 'none'; base-uri 'self'</pre><p>Because the site is hosted as static files, this policy is published here rather than sent as a server header — but you can verify it holds at any time in your browser's developer tools under the Network tab: no request ever carries your tool input off your device.</p>${privacyAnalyticsSection}</main>`
}));

fs.writeFileSync("about.html", page({
  title: "About",
  description: `About ${SITE_NAME}, a free collection of private, browser-based utilities for finance, home, document, and business tasks.`,
  pathname: "/about.html",
  pageType: "AboutPage",
  extraSchema: [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Jacob Briggs",
      jobTitle: "Founder & Developer",
      url: `${SITE_URL}/about.html`,
      worksFor: { "@id": `${SITE_URL}/#organization` }
    }
  ],
  body: `<main id="main" class="prose-page">
    <p class="eyebrow">About ${SITE_NAME}</p>
    <h1>Useful tools that keep your data on your device.</h1>
    <p>${SITE_NAME} is a growing collection of free, browser-based utilities for the small jobs that come up in everyday financial, home, business, and document work: cleaning a messy bank-statement CSV, estimating what a boat or a dog truly costs per year, splitting expenses with roommates, generating a printable bill of sale, or checking a filing deadline. Every tool runs entirely inside your web browser.</p>

    <h2>For when you almost opened Excel — but didn't want to</h2>
    <p>Most of these tools live in the gap between "too small to open a big app for" and "too annoying to do by hand." You almost launched Excel to dedupe a list, almost fired up an accounting suite to tidy one statement, almost installed something to resize an image — and then didn't want the friction. ${SITE_NAME} is the quiet toolbox for exactly those moments: open a page, do the one thing, close the tab.</p>

    <h2>Why this site exists</h2>
    <p>Most "free online tools" ask you to upload your spreadsheet, your statement, or your photo to a server you know nothing about. For the kinds of files these tools handle — bank exports, receipts, personal inventories — that always felt like the wrong trade. ${SITE_NAME} was built around the opposite default: the tool comes to your data, not the other way around. There is no account to create, nothing to install, and no upload step, because there is no server on our side that could receive your files in the first place.</p>

    <h2>How it works</h2>
    <p>${SITE_NAME} is a static website. Calculations and file processing happen in JavaScript on your own device. When you drop a CSV into a cleaner or type figures into a calculator, that information is read, processed, and displayed by your browser and is never transmitted to us. A handful of advanced tools load an open-source library from a public CDN so it can run in your browser; even then, your inputs stay local. The full detail is on our <a href="privacy.html">privacy page</a>.</p>

    <h2>How the estimates are built</h2>
    <p>The cost calculators — the "real cost of owning a…" series and the rest — are designed to total the recurring expenses people most often forget, not to hand you a single national average. We deliberately avoid presenting specific dollar figures as fact, because real costs vary enormously by region, size, age, and usage. Instead, each tool breaks a decision into its true cost categories and asks you to supply the figures for your own situation, while the accompanying article explains what drives each line and where to find a local number you can trust. The goal is a realistic estimate you built yourself, not a guess we made for you.</p>

    <h2>Who builds it</h2>
    <p>${SITE_NAME} is built and maintained by Jacob Briggs, an independent developer. It started as a handful of personal utilities and grew into a public toolbox. Tools are added and revised regularly, and reader email genuinely shapes what gets built and fixed next.</p>

    <h2>Accuracy and limits</h2>
    <p>These tools provide estimates and general-purpose documents, not financial, tax, legal, or professional advice. They are a strong starting point for a decision or a draft, but important results and documents should be reviewed with a qualified professional before you rely on them.</p>

    <h2>Contact</h2>
    <p>Found a problem with a tool, spotted a number that looks off, or have an idea for one we should build? Email ${mailtoLink}. Every message reaches a real person.</p>
  </main>`
}));

fs.writeFileSync("promise.html", page({
  title: "Our Promise",
  titleTag: `We Will Never — The ${SITE_NAME} Promise`,
  description: `The ${SITE_NAME} promise: never a login, never an upload, never a tool that sees or stores your data. A plain-language list of the things we will never do.`,
  pathname: "/promise.html",
  body: `<main id="main" class="prose-page">
    <p class="eyebrow">${SITE_NAME}</p>
    <h1>We will never.</h1>
    <p>Most "free online tools" quietly cost you something — an account, an upload, an inbox full of email, or your data sold on to someone you never agreed to. ${SITE_NAME} is built on the opposite promise. Here, in plain language, is what we will never do. These are not aspirations; they are baked into how the site is built.</p>

    <h2>We will never require a login or account</h2>
    <p>There is no sign-up, no password, and no profile. Every tool works the moment the page loads. We could not build an account system into these pages even if we wanted to, because there is no server on our side to hold one.</p>

    <h2>We will never make you upload your files</h2>
    <p>When you drop a CSV, a bank statement, or a photo into a tool, it is read and processed by code running inside your own browser. The file never travels to us. You can prove it: disconnect from the internet after the page loads and the tools still work.</p>

    <h2>We will never see or store what you enter</h2>
    <p>${SITE_NAME} is a static website with no application backend, database, or upload endpoint capable of receiving your tool inputs. We have no copy of your numbers, your files, or your results — not because we promise to delete them, but because they never reach us in the first place.</p>

    <h2>We will never sell or broker your data</h2>
    <p>Selling your tool data is impossible here by design: we never receive it, so there is nothing to sell, share, or hand to a data broker. The one exception people ask about — tools like the Net Worth Tracker that remember figures between visits — save that information only in your own browser's local storage, which you can clear at any time.</p>

    <h2>We will never paywall a tool you're using</h2>
    <p>No tool is a free trial that later demands payment, and no result is blurred until you subscribe. If a utility is on the site, it is free to use in full, for personal or commercial work.</p>

    <h2>We will never gate a tool behind your email</h2>
    <p>You will never have to "enter your email to see your result," and we will not throw up exit-intent pop-ups or nag walls to catch you on the way out. The tool is the point; you should be able to use it and leave.</p>

    <h2>What about ads and analytics?</h2>
    <p>To keep the tools free, some pages show ads and we measure basic, privacy-respecting traffic statistics — and we would rather tell you plainly than pretend otherwise. Those systems load with consent controls and are used only to count visits and keep the lights on. Crucially, they operate at the page level and never receive the contents of what you type, upload, or calculate. Your tool inputs stay between you and your browser. The full detail lives on our <a href="privacy.html">privacy page</a>.</p>

    <h2>What we will always do</h2>
    <p>Keep the tools fast and free, keep your data on your device, explain what each tool does in plain language, and answer real email from real people. Have a question about any promise on this page? Email ${mailtoLink}.</p>
  </main>`
}));

fs.writeFileSync("terms.html", page({
  title: "Terms of Use",
  description: `Terms of use for ${SITE_NAME}: free browser-based tools provided as-is, with estimates and generated documents that are not professional advice.`,
  pathname: "/terms.html",
  body: `<main id="main" class="prose-page">
    <p class="eyebrow">${SITE_NAME}</p>
    <h1>Terms of use.</h1>
    <p>These terms describe the basis on which ${SITE_NAME} makes its tools available. By using this website you agree to them. They are written in plain language on purpose; there is no separate legalese version that says something different.</p>

    <h2>What the site provides</h2>
    <p>${SITE_NAME} offers free utilities — calculators, file cleaners, document generators, and quizzes — that run in your web browser. No account is required and no payment is collected. You may use the tools for personal or commercial work.</p>

    <h2>Estimates, documents, and quizzes are not professional advice</h2>
    <p>The calculators produce estimates built from the figures you enter. The document generators produce general-purpose drafts. The quizzes are recreational and educational. None of this output is financial, tax, legal, medical, or other professional advice, and the IQ and personality quizzes are not clinical or psychometric instruments. Before relying on a result that matters — a filing deadline, a legal document, a large purchase decision — verify it with a qualified professional or an authoritative source.</p>

    <h2>No warranty</h2>
    <p>The tools are provided "as is" and "as available," without warranties of any kind, express or implied, including fitness for a particular purpose and accuracy of results. We work to keep the tools correct and available, but we do not guarantee that they are error-free or uninterrupted. To the fullest extent permitted by law, ${SITE_NAME} and its operator are not liable for any damages arising from your use of, or inability to use, this website or its output.</p>

    <h2>Your data</h2>
    <p>Tool inputs are processed in your browser and are not transmitted to us; the details are on the <a href="privacy.html">privacy page</a>. Because processing is local, you are responsible for keeping copies of anything you generate — we have no copy to recover for you.</p>

    <h2>Acceptable use</h2>
    <p>Don't use the site to break the law, don't attempt to disrupt or overload it, and don't scrape it in a way that degrades it for others. Automated access that respects <a href="robots.txt">robots.txt</a> is fine.</p>

    <h2>Content and ownership</h2>
    <p>The site's design, articles, and code that delivers the tools belong to ${SITE_NAME}. Everything you create with the tools — the documents, cleaned files, and results built from your own inputs — is yours.</p>

    <h2>Third-party services</h2>
    <p>Pages may load open-source libraries from public CDNs so tools can run locally, and the site uses Google services for analytics and advertising as described in the <a href="privacy.html">privacy policy</a>. Those services operate under their own terms.</p>

    <h2>Changes</h2>
    <p>Tools are added and revised regularly, and these terms may be updated as the site evolves. The date stamp in this page's metadata reflects the last revision. Continued use after a change means you accept the updated terms.</p>

    <h2>Contact</h2>
    <p>Questions about these terms? Email ${mailtoLink} or use the <a href="contact.html">contact page</a>.</p>
  </main>`
}));

fs.writeFileSync("contact.html", page({
  title: "Contact",
  pageType: "ContactPage",
  description: `Contact ${SITE_NAME} — report a problem with a tool, suggest a new utility, or ask a question. Every email reaches a real person.`,
  pathname: "/contact.html",
  body: `<main id="main" class="prose-page">
    <p class="eyebrow">${SITE_NAME}</p>
    <h1>Get in touch.</h1>
    <p>The best way to reach us is email: ${mailtoLink}. Every message is read by a real person — usually within a couple of days — and reader email genuinely shapes which tools get built and fixed next.</p>

    <h2>Reporting a problem with a tool</h2>
    <p>If a calculator gives a result that looks wrong or a tool won't accept your file, include the tool's name (or paste its web address), what you entered or what kind of file you used, what you expected, and what happened instead. Because the tools run entirely in your browser and nothing you enter reaches us, we can't look up your session — those details are the only way we can reproduce the issue.</p>

    <h2>Suggesting a new tool</h2>
    <p>Ideas are welcome. The most useful suggestions describe the job you were trying to get done — "I needed to split one big CSV into files per region" — rather than a feature name. If it can run privately in a browser, there's a good chance it fits here.</p>

    <h2>Why there's no contact form</h2>
    <p>${SITE_NAME} is a static site with no backend server, which is the same reason your tool inputs never leave your device. A contact form would need a server to receive it, so plain email it is.</p>

    <h2>Everything else</h2>
    <p>For questions about how the site handles data, see the <a href="privacy.html">privacy page</a>. For the ground rules, see the <a href="terms.html">terms of use</a>. For who builds this and why, see the <a href="about.html">about page</a>.</p>
  </main>`
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
  "promise.html",
  "privacy.html",
  "terms.html",
  "contact.html",
  ...categories.flatMap((category) => [
    `${category.slug}/`,
    ...category.tools.map(([slug]) => `${category.slug}/${slug}.html`)
  ])
];

fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map((url) => `  <url><loc>${SITE_URL}/${url}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join("\n")}\n</urlset>\n`);

fs.writeFileSync("robots.txt", `User-agent: *
Allow: /
Disallow: /content/

User-agent: OAI-SearchBot
Allow: /
Disallow: /content/

User-agent: ChatGPT-User
Allow: /
Disallow: /content/

User-agent: GPTBot
Allow: /
Disallow: /content/

User-agent: ClaudeBot
Allow: /
Disallow: /content/

User-agent: Claude-SearchBot
Allow: /
Disallow: /content/

Sitemap: ${SITE_URL}/sitemap.xml

# Machine-readable index of interactive tools (2026 tools.txt / tools.json convention):
# ${SITE_URL}/tools.txt
# ${SITE_URL}/tools.json
`);

fs.writeFileSync("site.webmanifest", JSON.stringify({
  name: SITE_NAME,
  short_name: "Nifty",
  description: "Free private browser-based utilities for files, finances, documents, business, and everyday tasks.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#0f1720",
  theme_color: "#0f1720",
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
      <TileColor>#0f1720</TileColor>
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
- [Terms](${SITE_URL}/terms.html): Terms of use for the tools.
- [Contact](${SITE_URL}/contact.html): How to reach the site operator.

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

// Machine-readable tool index for AI/LLM crawlers and programmatic clients.
// tools.json is the structured source of truth; tools.txt is a lean plaintext
// manifest that points to it and lists every tool URL.
const toolsIndex = {
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: "Free browser-based utilities for CSV/spreadsheet data, personal finance, documents, home and life decisions, business math, images, and everyday tasks.",
  updated: BUILD_DATE,
  count: allTools.length,
  privacy: "Every tool runs locally in the visitor's browser. There is no backend, upload endpoint, database, or account — tool inputs are never transmitted to or stored by the site.",
  license: "Free to use, no sign-up.",
  categories: categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    url: `${SITE_URL}/${category.slug}/`,
    count: category.tools.length
  })),
  tools: allTools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    categoryName: tool.categoryName,
    url: `${SITE_URL}/${tool.category}/${tool.slug}.html`
  }))
};
fs.writeFileSync("tools.json", JSON.stringify(toolsIndex, null, 2) + "\n");

fs.writeFileSync("tools.txt", `# ${SITE_NAME} — tools.txt
# Machine-readable index of interactive browser tools. Structured data: ${SITE_URL}/tools.json
# All tools run locally in the visitor's browser: no uploads, no accounts, no data stored.
# Updated: ${BUILD_DATE} | ${allTools.length} tools

${categories.map((category) => `## ${category.name}
${category.tools.map(([slug, name, description]) => `- ${name}: ${description} — ${SITE_URL}/${category.slug}/${slug}.html`).join("\n")}`).join("\n\n")}
`);

// Service worker: makes the site installable and lets visited tools work
// offline. Cache is versioned by build date so a deploy fully refreshes it.
// Navigations are network-first (fresh content wins; cache is the offline
// fallback); same-origin assets are stale-while-revalidate. Cross-origin
// requests (Google ads/analytics, CDN libs) are never intercepted.
fs.writeFileSync("sw.js", `// Generated by generate-site.mjs — do not edit by hand.
const VERSION = ${JSON.stringify(BUILD_DATE)};
const CACHE = "nifty-" + VERSION;
const PRECACHE = ["/", "/offline.html", "/assets/styles.css", "/assets/site.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch ads/analytics/CDN

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("/offline.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => { if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
`);

fs.writeFileSync("offline.html", page({
  title: "Offline",
  description: `${SITE_NAME} is offline.`,
  pathname: "/offline.html",
  indexable: false,
  body: `<main id="main" class="prose-page">
    <p class="eyebrow">${SITE_NAME}</p>
    <h1>You're offline.</h1>
    <p>It looks like your device isn't connected to the internet right now. ${SITE_NAME} is a browser-based toolbox, so any tool page you've already opened will keep working offline — check back to a tool you've used recently.</p>
    <p>Once you're back online, everything loads normally. Nothing you entered was ever sent anywhere, so there's nothing to recover or resend.</p>
    <p><a href="/">Return to all tools</a></p>
  </main>`
}));

fs.writeFileSync("CNAME", "niftyutilities.com\n");
fs.writeFileSync(".nojekyll", "");

// AdSense requires an ads.txt at the domain root declaring authorized sellers.
// The publisher line is generated only once a real publisher ID is configured.
if (ADSENSE_PUBLISHER_ID) {
  const pubId = ADSENSE_PUBLISHER_ID.replace(/^ca-/, "");
  fs.writeFileSync("ads.txt", `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
}

console.log(`Generated ${allTools.length} tool pages across ${categories.length} categories.`);
