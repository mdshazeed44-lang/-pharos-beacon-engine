// =====================================================================
//  Deterministic post-generation validator — SOW §3.6 / §8
//
//  Runs BEFORE any write to Supabase. This is what makes autonomous
//  generation commercially viable: without it every Beacon needs human
//  review, which breaks the volume model. On failure the offending step
//  is regenerated (up to 2 retries) then flagged for manual review.
// =====================================================================
import type {
  ReportContent,
  ResourceParams,
  ValidationFailure,
  ValidationResult,
} from "./contract.ts";
import { computePattern, fullRangeSamples, roundTo } from "./patterns.ts";

// Pharos's own mechanic is funding-plus-hire. The signal designed FOR the
// prospect must never leak it (§8). Whole-word match so legitimate words
// like "hiring velocity" (a churn predictor) are not false-positives,
// while "hire", "funding", "Series A" etc. are caught.
const MECHANIC_LEAK = [
  "funding", "funded", "raise", "raised", "fundraise",
  "series a", "series b", "round", "investor", "investors",
  "seed", "hire", "hires", "hired", "valuation",
];

// placeholder tokens that must never survive into a delivered Beacon (§8)
const PLACEHOLDER_RE = /\{[a-z_]+\}|\{\{.*?\}\}|\[(?:company|name|title|insert|todo)[^\]]*\]/i;

const REQUIRED_TEXT: (keyof ReportContent)[] = [
  "icp_recognition_copy", "signal_name", "signal_hypothesis",
  "signal_pattern_visual", "signal_why_it_works",
  "cornerstone_title", "sequence_summary", "cta_copy",
];

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/** Recursively collect every string value in an object (for placeholder scan). */
function collectStrings(node: unknown, out: string[]): void {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const x of node) collectStrings(x, out);
  else if (node && typeof node === "object")
    for (const v of Object.values(node)) collectStrings(v, out);
}

/** Validate one resource (mock_beacon or resource_params) across the full
 *  input range: finite, non-negative where required, within plausible
 *  bounds, and cleanly rounded — no NaN / negatives / impossible magnitudes. */
function validateResource(
  res: ResourceParams,
  step: 3 | 4,
  label: string,
  fail: (f: ValidationFailure) => void,
): void {
  if (isBlank(res?.illustrative_label)) {
    fail({ step, field: `${label}.illustrative_label`, message: "illustrative_label is required on all resource outputs" });
  }
  if (!res?.inputs?.length || !res?.outputs?.length) {
    fail({ step, field: label, message: "resource must declare inputs and outputs" });
    return;
  }
  for (const out of res.outputs) {
    if (out.round_to < 1) {
      fail({ step, field: `${label}.${out.key}.round_to`, message: "round_to must be >= 1 (no unrounded figures)" });
    }
  }

  const samples = fullRangeSamples(res);
  for (const values of samples) {
    const computed = computePattern(res.pattern, values, res.constants);
    for (const out of res.outputs) {
      const raw = computed[out.key];
      if (raw === undefined) {
        fail({ step, field: `${label}.${out.key}`, message: `pattern "${res.pattern}" produced no output "${out.key}"` });
        continue;
      }
      const v = roundTo(raw, out.round_to);
      const at = JSON.stringify(values);
      if (!Number.isFinite(v)) {
        fail({ step, field: `${label}.${out.key}`, message: `non-finite (NaN/Infinity) at inputs ${at}` });
      } else if (out.non_negative && v < 0) {
        fail({ step, field: `${label}.${out.key}`, message: `negative value ${v} at inputs ${at}` });
      } else if (v < out.min_plausible || v > out.max_plausible) {
        fail({ step, field: `${label}.${out.key}`, message: `implausible magnitude ${v} (bounds ${out.min_plausible}..${out.max_plausible}) at inputs ${at}` });
      }
    }
  }
}

/** Full post-generation validation. Returns ok + the precise step to
 *  regenerate for each failure. */
export function validateReport(report: ReportContent): ValidationResult {
  const failures: ValidationFailure[] = [];
  const fail = (f: ValidationFailure) => failures.push(f);

  // 1) required fields present and non-empty
  for (const key of REQUIRED_TEXT) {
    if (isBlank(report[key])) fail({ step: 0, field: key, message: "required field is empty" });
  }
  if (!report.signal_detection_steps?.length) {
    fail({ step: 2, field: "signal_detection_steps", message: "detection steps are empty" });
  }
  if (!report.cornerstone_outline?.length) {
    fail({ step: 0, field: "cornerstone_outline", message: "cornerstone outline is empty" });
  }

  // 2) no placeholder tokens anywhere
  const strings: string[] = [];
  collectStrings(report, strings);
  for (const s of strings) {
    const m = s.match(PLACEHOLDER_RE);
    if (m) { fail({ step: 0, field: "report_content", message: `placeholder token "${m[0]}" found in: "${s.slice(0, 60)}"` }); break; }
  }

  // 3) mechanic-leak filter on the generated signal (§8)
  const stepsText = (report.signal_detection_steps ?? []).join(" • ").toLowerCase();
  for (const kw of MECHANIC_LEAK) {
    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(stepsText)) {
      fail({ step: 2, field: "signal_detection_steps", message: `mechanic-leak keyword "${kw}" — signal must not expose funding-plus-hire` });
    }
  }

  // 4) resources compute cleanly across full input range
  if (report.mock_beacon) validateResource(report.mock_beacon, 3, "mock_beacon", fail);
  if (report.resource_params) validateResource(report.resource_params, 4, "resource_params", fail);

  return { ok: failures.length === 0, failures };
}
