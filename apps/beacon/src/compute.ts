// Renderer-side pattern execution — mirrors @pharos/beacon-engine patterns.
// The renderer ONLY runs these fixed templates, never arbitrary expressions (§3.5).
import type { PatternName } from "./types.ts";

export function computePattern(
  pattern: PatternName,
  values: Record<string, number>,
  constants: Record<string, number>,
): Record<string, number> {
  switch (pattern) {
    case "multiply_compare": {
      const volume = values.volume ?? 0;
      const rate_pct = values.rate_pct ?? 0;
      const unit_value = values.unit_value ?? 0;
      const floor_rate_pct = constants.floor_rate_pct ?? 0;
      const primary_total = volume * (rate_pct / 100) * unit_value;
      const floor_total = volume * (floor_rate_pct / 100) * unit_value;
      return { primary_total, floor_total, delta: Math.max(0, primary_total - floor_total) };
    }
    case "differential": {
      const current_value = values.current_value ?? 0;
      const benchmark_value = values.benchmark_value ?? 0;
      const unit_value = constants.unit_value ?? 1;
      const gap = current_value - benchmark_value;
      return { gap, gap_value: gap * unit_value };
    }
    case "divide_into_units": {
      const total = values.total ?? 0;
      const unit_size = constants.unit_size ?? 0;
      return { units: unit_size === 0 ? NaN : total / unit_size };
    }
  }
}

export function roundTo(v: number, g: number): number {
  return g <= 0 ? v : Math.round(v / g) * g;
}

export function fmt(v: number, prefix = "", suffix = ""): string {
  if (!Number.isFinite(v)) return "—";
  return `${prefix}${Math.round(v).toLocaleString("en-GB")}${suffix}`;
}
