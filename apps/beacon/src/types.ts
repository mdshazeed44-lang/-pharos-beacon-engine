// Mirror of the engine data contract (SOW §3.3/§3.4) — the render-safe shape
// returned by the get_beacon(slug) RPC.

export type PatternName = "multiply_compare" | "differential" | "divide_into_units";
export type Archetype = "calculator" | "scorecard" | "benchmark";

export interface ResourceInput {
  key: string; label: string; min: number; max: number; step: number; default: number;
}
export interface ResourceOutput {
  key: string; label: string; round_to: number;
  min_plausible: number; max_plausible: number; non_negative?: boolean;
  prefix?: string; suffix?: string; tone?: "neutral" | "cost" | "save";
}
export interface ResourceParams {
  archetype: Archetype;
  title: string; subtitle: string;
  inputs: ResourceInput[];
  pattern: PatternName;
  constants: Record<string, number>;
  outputs: ResourceOutput[];
  illustrative_label: string;
  // scorecard archetype extras (illustrative, labelled)
  risk_index?: number;
  metrics?: { label: string; value: string; pct: number; tone: "good" | "warn" | "bad" }[];
  funds_line?: string;
}
export interface ReportContent {
  icp_recognition_copy: string;
  signal_name: string;
  signal_hypothesis: string;
  signal_pattern_visual: string;       // " → " separated flow
  signal_why_it_works: string;
  signal_detection_steps: string[];
  mock_beacon: ResourceParams;
  resource_params: ResourceParams;
  cornerstone_title: string;
  cornerstone_outline: string[];
  sequence_summary: string;
  voc_summary: string;
  cta_copy: string;
}

// Row returned by get_beacon(slug): injected display fields + report_content.
export interface BeaconRow {
  company_name: string;
  company_website?: string;
  round_type?: string;
  round_amount?: number;
  round_date?: string;
  investor_names?: string[];
  hire_title?: string;
  hire_name?: string;
  employee_count?: number;
  icp_industry?: string;
  icp_size?: string;
  icp_buyer_titles?: string[];
  use_case?: string;
  generated_date?: string;
  report_content: ReportContent;
}
