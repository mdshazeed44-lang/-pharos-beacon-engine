// =====================================================================
//  Data contract types — SOW §3.3 / §3.4
//  The shape of report_content (the generated jsonb) plus the resource
//  model the renderer and validator share.
// =====================================================================

/** The three vetted computation patterns. The LLM selects one and fills
 *  bounded constants — it never writes a free-form expression (§3.5, §8). */
export type PatternName = "multiply_compare" | "differential" | "divide_into_units";

export type Archetype = "calculator" | "scorecard" | "benchmark";

export interface ResourceInput {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface ResourceOutput {
  key: string;          // must match a key produced by the pattern
  label: string;
  round_to: number;     // display rounding granularity; >= 1 (no unrounded figures, §8)
  min_plausible: number;
  max_plausible: number;
  non_negative?: boolean;
}

/** mock_beacon and resource_params share this schema (§3.3). */
export interface ResourceParams {
  archetype: Archetype;
  title: string;
  subtitle: string;
  inputs: ResourceInput[];
  pattern: PatternName;
  constants: Record<string, number>;
  outputs: ResourceOutput[];
  illustrative_label: string;
}

/** The AI-generated content block (report_content). */
export interface ReportContent {
  icp_recognition_copy: string;
  signal_name: string;
  signal_hypothesis: string;
  signal_pattern_visual: string;
  signal_why_it_works: string;
  signal_detection_steps: string[];
  mock_beacon: ResourceParams;
  resource_params: ResourceParams;
  cornerstone_title: string;
  cornerstone_outline: string[];
  sequence_summary: string;
  cta_copy: string;
}

export interface ValidationFailure {
  /** which generation step to regenerate: 1 ICP, 2 signal, 3 mock, 4 resource, 0 structural */
  step: 0 | 1 | 2 | 3 | 4;
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  failures: ValidationFailure[];
}
