// Admin area — login gate + a dashboard whose layout AND data change by role.
// admin: every beacon + generate + stats.  rep: only their assigned beacons.
import { useEffect, useState } from "react";
import { supabase } from "./supabase.ts";
import { signIn, signOut, getProfile, onAuthChange, setTheme, type Profile } from "./auth.ts";
import { applyTheme, THEME_KEYS, THEME_LABELS, THEMES, type ThemeKey } from "./themes.ts";

interface BeaconRow {
  beacon_slug: string; company_name: string; generation_status: string;
  assigned_to: string | null;
  beacon_cta_clicked: boolean; beacon_max_scroll_depth: number; beacon_total_dwell_seconds: number;
  report_content: { signal_name?: string } | null;
}

function Login() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { applyTheme("ocean"); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await signIn(email.trim(), pw);
    setBusy(false); if (error) setErr(error);
  }
  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">PHAROS <span>BEACON</span></div>
        <h1>Sign in</h1>
        <p className="auth-sub">Team access to the Beacon dashboard.</p>
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@pharos.io" required /></label>
        <label>Password<input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required /></label>
        {err && <div className="auth-err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in →"}</button>
      </form>
    </div>
  );
}

function Dashboard({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<BeaconRow[] | null>(null);
  const [theme, setThemeState] = useState<string>(profile.theme || "ocean");
  const isAdmin = profile.role === "admin";
  const firstName = (profile.full_name || profile.email || "").trim().split(/[\s@]+/)[0] || "there";

  useEffect(() => { applyTheme(profile.theme || "ocean"); setThemeState(profile.theme || "ocean"); }, [profile.theme]);

  async function pickTheme(key: ThemeKey) {
    applyTheme(key);
    setThemeState(key);
    await setTheme(key);
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.from("beacons")
      .select("beacon_slug, company_name, generation_status, assigned_to, beacon_cta_clicked, beacon_max_scroll_depth, beacon_total_dwell_seconds, report_content")
      .order("company_name")
      .then(({ data }) => setRows((data as BeaconRow[]) ?? []));
  }, []);

  const origin = window.location.origin;
  const total = rows?.length ?? 0;
  const engaged = rows?.filter(r => r.beacon_cta_clicked || r.beacon_max_scroll_depth >= 50).length ?? 0;

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="brand"><span className="brand-name">Pharos<small>BEACON</small></span></div>
        <div className="dash-user">
          <div className="theme-switch" role="group" aria-label="Color theme">
            {THEME_KEYS.map(key => (
              <button
                key={key}
                type="button"
                className={`swatch ${theme === key ? "active" : ""}`}
                style={{ background: THEMES[key]["--primary"] }}
                title={THEME_LABELS[key]}
                aria-label={THEME_LABELS[key]}
                aria-pressed={theme === key}
                onClick={() => pickTheme(key)}
              />
            ))}
          </div>
          <span className="role-chip" data-role={profile.role}>{profile.role === "admin" ? "Admin" : "Sales Rep"}</span>
          <span className="dash-name">{profile.full_name || profile.email}</span>
          <button className="ghost-btn" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>

      <main className="wrap dash-main">
        {/* ----- role-specific heading ----- */}
        <div className="dash-head">
          <div className="greeting">Welcome back, {firstName}</div>
          <h1>{isAdmin ? "All Beacons" : "Your assigned Beacons"}</h1>
          <p>{isAdmin
            ? "Every account in the engine. Generate, monitor and attribute."
            : "Accounts assigned to you. Watch engagement and follow up on intent."}</p>
        </div>

        {/* ----- admin-only stats + generate ----- */}
        {isAdmin && (
          <div className="stat-row">
            <div className="stat"><div className="stat-n">{total}</div><div className="stat-l">Beacons</div></div>
            <div className="stat"><div className="stat-n">{engaged}</div><div className="stat-l">Engaged</div></div>
            <button className="btn gen-btn" onClick={() => alert("Generation pass runs once an LLM API key is configured — wires straight into this button.")}>+ Generate new Beacon</button>
          </div>
        )}

        {rows === null && <div className="muted">Loading…</div>}
        {rows && rows.length === 0 && (
          <div className="empty-state">{isAdmin ? "No beacons yet." : "No beacons are assigned to you yet. An admin assigns accounts to reps."}</div>
        )}

        {/* ----- list (same query, role-filtered by RLS) ----- */}
        <div className="beacon-list">
          {rows?.map(r => (
            <div className="beacon-row" key={r.beacon_slug}>
              <div className="br-main">
                <div className="br-name">{r.company_name}</div>
                <div className="br-signal">{r.report_content?.signal_name ?? "—"}</div>
              </div>
              <div className="br-meta">
                <span className={`pill ${r.beacon_cta_clicked ? "hot" : ""}`}>{r.beacon_cta_clicked ? "CTA clicked" : `${r.beacon_max_scroll_depth}% read`}</span>
                <span className="muted small">{r.beacon_total_dwell_seconds}s dwell</span>
                <a className="open-link" href={`${origin}/?slug=${r.beacon_slug}`} target="_blank" rel="noreferrer">Open ↗</a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function AdminApp() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const load = () => getProfile().then(setProfile);
  useEffect(() => { load(); const off = onAuthChange(load); return off; }, []);

  if (!supabase) return <div className="state"><h2>Auth unavailable</h2><p>Supabase credentials are not configured for this build.</p></div>;
  if (profile === undefined) return <div className="state">Loading…</div>;
  if (profile === null) return <Login />;
  return <Dashboard profile={profile} />;
}
