// Runnable proof of the spine: a clean report passes; a poisoned report
// fails with the precise step to regenerate.  Run: node test/validator.test.ts
import { validateReport } from "../src/validator.ts";
import type { ReportContent, ResourceParams } from "../src/contract.ts";

const goodResource: ResourceParams = {
  archetype: "calculator",
  title: "Workforce Retention Cost Calculator",
  subtitle: "What unmanaged churn costs this team each year.",
  illustrative_label: "Illustrative — based on your inputs",
  pattern: "multiply_compare",
  inputs: [
    { key: "volume", label: "Workforce size", min: 200, max: 1000, step: 10, default: 450 },
    { key: "rate_pct", label: "Annual attrition", min: 5, max: 30, step: 1, default: 18 },
    { key: "unit_value", label: "Cost to replace one person", min: 25000, max: 75000, step: 1000, default: 42000 },
  ],
  constants: { floor_rate_pct: 11 },
  outputs: [
    { key: "primary_total", label: "Current annual cost", round_to: 1000, min_plausible: 0, max_plausible: 25_000_000, non_negative: true },
    { key: "delta",         label: "Recoverable",         round_to: 1000, min_plausible: 0, max_plausible: 25_000_000, non_negative: true },
  ],
};

const goodReport: ReportContent = {
  icp_recognition_copy: "You sell workforce analytics to people-first teams.",
  signal_name: "The Retention Cliff Signal",
  signal_hypothesis: "Teams scaling headcount while sentiment slips are weeks from a churn problem.",
  signal_pattern_visual: "Open-role surge vs. sentiment decline divergence.",
  signal_why_it_works: "It catches the buyer before the pain is internally obvious.",
  signal_detection_steps: [
    "Track companies publishing 3+ open roles inside a single team within 30 days.",
    "Cross-reference public review platforms for rising workload mentions that quarter.",
    "Flag accounts where hiring velocity and sentiment decline diverge — the cliff.",
  ],
  mock_beacon: { ...goodResource, archetype: "scorecard", title: "People Risk Scorecard" },
  resource_params: goodResource,
  cornerstone_title: "The 90-Day Retention Cliff: a field guide",
  cornerstone_outline: ["Public signals that predict churn", "Reading velocity vs sentiment"],
  sequence_summary: "3-touch opener, the gap, a clean break.",
  cta_copy: "Our signal found you. This page generated itself.",
};

// poisoned: placeholder token, a mechanic-leak word, and a divide-by-zero resource
const badReport: ReportContent = {
  ...goodReport,
  icp_recognition_copy: "Hello {company}, welcome.",                       // placeholder
  signal_detection_steps: [
    "Detect a recent Series A raise and the first senior hire.",           // mechanic leak x3
  ],
  resource_params: {
    ...goodResource,
    pattern: "divide_into_units",
    inputs: [{ key: "total", label: "Total", min: 0, max: 1000, step: 10, default: 500 }],
    constants: { unit_size: 0 },                                           // forces NaN
    outputs: [{ key: "units", label: "Units", round_to: 1, min_plausible: 0, max_plausible: 1000 }],
  },
};

function show(name: string, r: ReturnType<typeof validateReport>) {
  console.log(`\n=== ${name} ===`);
  console.log(r.ok ? "PASS ✅ (clears for Supabase write)" : `FAIL ❌ (${r.failures.length} issue(s))`);
  for (const f of r.failures) console.log(`  · [step ${f.step}] ${f.field}: ${f.message}`);
}

const a = validateReport(goodReport);
const b = validateReport(badReport);
show("Clean Northwind report", a);
show("Poisoned report", b);

const passOk = a.ok === true;
const failOk = b.ok === false
  && b.failures.some(f => f.message.includes("placeholder"))
  && b.failures.some(f => f.field === "signal_detection_steps")
  && b.failures.some(f => f.message.includes("non-finite"));

console.log(`\nSELF-CHECK: clean passes = ${passOk}, poisoned caught = ${failOk}`);
process.exit(passOk && failOk ? 0 : 1);
