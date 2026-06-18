// Generic resource renderer (SOW §4.3, Phase 2 deliverable).
// Takes any resource_params object and renders the right micro-app.
// Calculator runs vetted patterns only; scorecard renders illustrative metrics.
import { useMemo, useState } from "react";
import type { ResourceParams } from "./types.ts";
import { computePattern, roundTo, fmt } from "./compute.ts";

function toneColor(t: "good" | "warn" | "bad") {
  return t === "bad" ? "var(--bad)" : t === "warn" ? "var(--warn)" : "var(--good)";
}

/** Scorecard (used for the Mock Beacon, §4.2) — illustrative, framed. */
export function Scorecard({ res, url }: { res: ResourceParams; url: string }) {
  return (
    <div className="mock-frame">
      <span className="mock-illus">{res.illustrative_label || "Illustrative"}</span>
      <div className="mock-inner">
        <div className="mock-head">
          <div className="win"><i /><i /><i /></div>
          <div className="url">{url}</div>
        </div>
        <div className="mock-title">{res.title}</div>
        <div className="mock-sub">{res.subtitle}</div>
        <div className="score-row">
          <div className="ring" style={{ ["--p" as any]: res.risk_index ?? 0 }}>
            <b>{res.risk_index ?? 0}</b><small>RISK<br />INDEX</small>
          </div>
          <div className="metrics">
            {(res.metrics ?? []).map((m, i) => (
              <div className="metric" key={i}>
                <span className="lab">{m.label}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="bar"><i style={{ width: `${m.pct}%`, background: toneColor(m.tone) }} /></span>
                  <span className="val" style={{ color: toneColor(m.tone) }}>{m.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Calculator (§4.3) — sliders drive a vetted pattern, full-range safe. */
export function Calculator({ res, onUse }: { res: ResourceParams; onUse: (touches: number) => void }) {
  const [vals, setVals] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    for (const inp of res.inputs) v[inp.key] = inp.default;
    return v;
  });
  const [touches, setTouches] = useState(0);

  const computed = useMemo(() => computePattern(res.pattern, vals, res.constants), [vals, res]);

  function onInput(key: string, value: number) {
    setVals((prev) => ({ ...prev, [key]: value }));
    const t = touches + 1; setTouches(t); onUse(t);
  }

  const out: Record<string, number> = {};
  for (const o of res.outputs) out[o.key] = roundTo(computed[o.key], o.round_to);
  const fundsLine = res.funds_line
    ? res.funds_line.replace("{save}", fmt(out.delta ?? 0, res.outputs.find(o => o.key === "delta")?.prefix ?? ""))
    : "";

  return (
    <div className="card">
      <div className="calc-title">{res.title}</div>
      <div className="calc-sub">{res.subtitle} Drag the sliders — every figure recomputes live, validated edge-to-edge.</div>

      {res.inputs.map((inp) => (
        <div className="slider-row" key={inp.key}>
          <div className="lab">
            <span className="k">{inp.label}</span>
            <span className="v">{inp.key.includes("rate") ? `${vals[inp.key]}%` : (inp.min >= 1000 ? fmt(vals[inp.key], inp.key === "unit_value" || inp.key === "volume" && inp.min >= 1000 ? "" : "") : vals[inp.key].toLocaleString("en-GB"))}</span>
          </div>
          <input type="range" min={inp.min} max={inp.max} step={inp.step}
            value={vals[inp.key]} onChange={(e) => onInput(inp.key, Number(e.target.value))} />
        </div>
      ))}

      <div className="calc-out">
        {res.outputs.map((o) => (
          <div className={`out ${o.tone ?? ""}`} key={o.key}>
            <div className="k">{o.label}</div>
            <div className="big">{fmt(out[o.key], o.prefix ?? "", o.suffix ?? "")}</div>
          </div>
        ))}
      </div>
      {fundsLine && <div className="funds" dangerouslySetInnerHTML={{ __html: fundsLine.replace(/(\$[\d,]+|£[\d,]+)/g, "<b>$1</b>") }} />}
    </div>
  );
}
