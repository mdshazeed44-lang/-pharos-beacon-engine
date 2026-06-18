// The Beacon page — renders the fixed 4-section layout (SOW §4) dynamically
// from a single Supabase row. Structure fixed; content fully data-driven.
import { useEffect } from "react";
import type { BeaconRow } from "./types.ts";
import type { Tracker } from "./tracking.ts";
import { Calculator, Scorecard } from "./ResourceRenderer.tsx";

const Brand = () => (
  <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ filter: "drop-shadow(0 3px 8px rgba(122,170,206,.35))" }}>
    <path d="M11 1L8 7H14L11 1Z" fill="#9cd5ff" />
    <path d="M8.5 7H13.5L14.5 24H7.5L8.5 7Z" fill="#7aaace" />
    <rect x="7" y="13" width="8" height="3" fill="#355872" />
    <path d="M6 24H16V25.5H6V24Z" fill="#3c6f92" />
    <path d="M14 9L20 6.5" stroke="#9cd5ff" strokeWidth="1" opacity="0.7" />
    <path d="M8 9L2 6.5" stroke="#9cd5ff" strokeWidth="1" opacity="0.7" />
  </svg>
);

export default function Beacon({ row, tracker }: { row: BeaconRow; tracker: Tracker }) {
  const r = row.report_content;

  // scroll + dwell tracking
  useEffect(() => {
    tracker.opened();
    const onScroll = () => {
      const pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      tracker.scroll(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const dwell = setInterval(() => { if (!document.hidden) tracker.tickDwell(); }, 1000);
    return () => { window.removeEventListener("scroll", onScroll); clearInterval(dwell); };
  }, [tracker]);

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <div className="brand"><Brand /><span className="name">Pharos<small>BEACON</small></span></div>
          <div className="genfor">Generated for <b>{row.company_name}</b> · {row.generated_date}</div>
        </div>
      </header>

      <div className="hero">
        <div className="beam" />
        <div className="wrap">
          <div className="eyebrow"><span className="pulse" /><span>A signal fired</span></div>
          <h1 className="hero-title">This page <span className="hl">built itself</span><br />around {row.company_name}.</h1>
          <p>No template. No mail-merge. Our own signal detected your moment, and an engine generated everything below from a single verified record — specifically for you.</p>
        </div>
      </div>

      {/* SECTION A — Intelligence */}
      <section className="block">
        <div className="wrap">
          <div className="sec-label"><span className="num">A</span><span className="t">The Intelligence</span></div>
          <div className="card" onClick={() => tracker.panel()}>
            <div className="recog-tag">This is you</div>
            <h2>{r.icp_recognition_copy}</h2>
            <div className="grid cols-2">
              <div className="kv"><div className="k">Industry</div><div className="v">{row.icp_industry}</div></div>
              <div className="kv"><div className="k">Company size band</div><div className="v">{row.icp_size}</div></div>
            </div>
            <div className="kv" style={{ marginTop: 14 }}>
              <div className="k">Who you sell to</div>
              <div className="v chips">{(row.icp_buyer_titles ?? []).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
            </div>
            <div className="whynow"><b>Why now:</b> {row.round_type} closed and your first {row.hire_title} is in seat — the commercial engine is being built from scratch, right now.</div>
          </div>

          <div className="card" onClick={() => tracker.panel()}>
            <div className="signal-name"><span>{r.signal_name}</span><span className="badge">Built for your market</span></div>
            <p className="muted">{r.signal_hypothesis}</p>
            <div className="pattern">
              <div className="flow">
                {r.signal_pattern_visual.split("→").map((n, i, arr) => (
                  <span key={i}><span className="node">{n.trim()}</span>{i < arr.length - 1 && <span className="arrow"> → </span>}</span>
                ))}
              </div>
            </div>
            <p className="muted"><b style={{ color: "var(--ink)" }}>Why it works:</b> {r.signal_why_it_works}</p>
            <div className="steps">
              {r.signal_detection_steps.map((s, i) => <div className="step" key={i}><span>{s}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B — Mock Beacon */}
      <section className="block">
        <div className="wrap">
          <div className="sec-label"><span className="num">B</span><span className="t">The Destination · what your buyer would see</span></div>
          <Scorecard res={r.mock_beacon} url={`beacon.${row.company_name.toLowerCase()}.io/your-prospect`} />
        </div>
      </section>

      {/* SECTION C — Extras */}
      <section className="block">
        <div className="wrap">
          <div className="sec-label"><span className="num">C</span><span className="t">A working resource · built for your buyer</span></div>
          <Calculator res={r.resource_params} onUse={(t) => { tracker.resourceOpened(); if (t >= 8) tracker.resourceCompleted(); }} />
          <div className="extras-grid" style={{ marginTop: 16 }}>
            <div className="extra" onClick={() => tracker.panel()}>
              <div className="tag">Cornerstone content · outlined</div>
              <h4>{r.cornerstone_title}</h4>
              <ul>{r.cornerstone_outline.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            <div className="extra" onClick={() => tracker.panel()}>
              <div className="tag">Also in the full build</div>
              <h4>Outreach &amp; listening</h4>
              <ul>
                <li><b className="built-tag">Sequence:</b> {r.sequence_summary}</li>
                <li><b className="built-tag">Voice-of-customer:</b> {r.voc_summary}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D — CTA */}
      <section className="block">
        <div className="wrap">
          <div className="cta">
            <h3>{r.cta_copy}</h3>
            <a href="#" className="btn" onClick={(e) => { e.preventDefault(); tracker.cta(); }}>Book the workshop →</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="badge">Rendered live from a single Supabase record · slug-keyed</div>
          <div>PHAROS — Outbound that shows, not tells.</div>
        </div>
      </footer>
    </>
  );
}
