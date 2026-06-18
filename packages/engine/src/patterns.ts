// =====================================================================
//  Vetted computation patterns — SOW §3.5
//  The renderer and validator BOTH call these. The LLM never writes math;
//  it only chooses a pattern name and supplies bounded constants. Each
//  pattern is a fixed, deterministic function over named inputs/constants.
// =====================================================================
import type { PatternName, ResourceParams } from "./contract.ts";

/** Compute a pattern's named outputs from input values + constants.
 *  Returns a flat map of output-key -> raw number (rounding happens later). */
export function computePattern(
  pattern: PatternName,
  values: Record<string, number>,
  constants: Record<string, number>,
): Record<string, number> {
  switch (pattern) {
    // current vs. floor of a volume × rate × unit_value quantity
    case "multiply_compare": {
      const volume = values.volume ?? 0;
      const rate_pct = values.rate_pct ?? 0;
      const unit_value = values.unit_value ?? 0;
      const floor_rate_pct = constants.floor_rate_pct ?? 0;
      const primary_total = volume * (rate_pct / 100) * unit_value;
      const floor_total = volume * (floor_rate_pct / 100) * unit_value;
      const delta = Math.max(0, primary_total - floor_total);
      return { primary_total, floor_total, delta };
    }
    // gap between a current value and a benchmark, valued per unit
    case "differential": {
      const current_value = values.current_value ?? 0;
      const benchmark_value = values.benchmark_value ?? 0;
      const unit_value = constants.unit_value ?? 1;
      const gap = current_value - benchmark_value;
      const gap_value = gap * unit_value;
      return { gap, gap_value };
    }
    // divide a total into bounded units
    case "divide_into_units": {
      const total = values.total ?? 0;
      const unit_size = constants.unit_size ?? 0;
      const units = unit_size === 0 ? NaN : total / unit_size;
      return { units };
    }
  }
}

/** Deterministic sample set across the full input range (§3.5/§3.6):
 *  every input at min, max, and 3 midpoints (others held at default),
 *  plus the all-min and all-max corners. */
export function fullRangeSamples(params: ResourceParams): Record<string, number>[] {
  const base: Record<string, number> = {};
  for (const inp of params.inputs) base[inp.key] = inp.default;

  const samples: Record<string, number>[] = [];
  for (const inp of params.inputs) {
    const mid = (inp.min + inp.max) / 2;
    const points = [
      inp.min,
      (inp.min + mid) / 2,
      mid,
      (mid + inp.max) / 2,
      inp.max,
    ];
    for (const p of points) samples.push({ ...base, [inp.key]: p });
  }

  const allMin: Record<string, number> = {};
  const allMax: Record<string, number> = {};
  for (const inp of params.inputs) {
    allMin[inp.key] = inp.min;
    allMax[inp.key] = inp.max;
  }
  samples.push(allMin, allMax);
  return samples;
}

/** Round a raw value to the output's display granularity. */
export function roundTo(value: number, granularity: number): number {
  if (granularity <= 0) return value;
  return Math.round(value / granularity) * granularity;
}
