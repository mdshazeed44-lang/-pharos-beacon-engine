// Self-serve product shell at the root URL — no slugs, no admin/rep concept.
// Auth (sign in OR create account) → Onboarding (if not onboarded) → personalized Home.
import { useEffect, useState } from "react";
import { supabase } from "./supabase.ts";
import { signIn, signUp, signOut, getProfile, saveOnboarding, onAuthChange, setTheme, type Profile } from "./auth.ts";
import { applyTheme, THEME_KEYS, THEME_LABELS, THEMES, type ThemeKey } from "./themes.ts";

/* ---------------- Auth: sign in OR create account ---------------- */
function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { applyTheme("ocean"); }, []);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = isSignup ? await signUp(email.trim(), pw) : await signIn(email.trim(), pw);
    setBusy(false);
    if (error) setErr(error);
    // On success, onAuthChange fires and the app re-renders into onboarding/home.
  }

  function switchTo(next: "signin" | "signup") {
    setMode(next); setErr(null);
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">PHAROS</div>
        <div className="auth-toggle" role="tablist" aria-label="Sign in or create account">
          <button type="button" role="tab" aria-selected={!isSignup}
            className={`auth-tab ${!isSignup ? "active" : ""}`} onClick={() => switchTo("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={isSignup}
            className={`auth-tab ${isSignup ? "active" : ""}`} onClick={() => switchTo("signup")}>Create account</button>
        </div>
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">{isSignup ? "Set up your workspace in a minute." : "Sign in to your workspace."}</p>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required /></label>
        <label>Password<input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" required /></label>
        {err && <div className="auth-err">{err}</div>}
        <button className="btn" disabled={busy}>
          {busy ? (isSignup ? "Creating…" : "Signing in…") : (isSignup ? "Create account →" : "Sign in →")}
        </button>
      </form>
    </div>
  );
}

/* ---------------- Onboarding: collect the user's details ---------------- */
function Onboarding({ onDone }: { onDone: () => void }) {
  const [full_name, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [offering, setOffering] = useState("");
  const [audience, setAudience] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep the current theme applied; default to ocean on a fresh load.
  useEffect(() => { applyTheme("ocean"); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await saveOnboarding({
      full_name: full_name.trim(),
      company: company.trim(),
      website: website.trim(),
      industry: industry.trim(),
      offering: offering.trim(),
      audience: audience.trim(),
    });
    setBusy(false);
    if (error) { setErr(error); return; }
    onDone();
  }

  return (
    <div className="auth-wrap">
      <form className="onboard-card" onSubmit={submit}>
        <div className="auth-brand">PHAROS</div>
        <h1>Tell us about you</h1>
        <p className="auth-sub">This personalises your workspace.</p>
        <label>Your name<input value={full_name} onChange={e => setFullName(e.target.value)} placeholder="Alex Rivera" required /></label>
        <label>Company<input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." required /></label>
        <label>Website<input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" /></label>
        <label>Industry<input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="SaaS, retail, healthcare…" required /></label>
        <label>What do you offer?<textarea value={offering} onChange={e => setOffering(e.target.value)} placeholder="Describe your product or service." rows={3} required /></label>
        <label>Who are your customers?<textarea value={audience} onChange={e => setAudience(e.target.value)} placeholder="Describe the people or businesses you serve." rows={3} required /></label>
        {err && <div className="auth-err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? "Saving…" : "Continue →"}</button>
      </form>
    </div>
  );
}

/* ---------------- Home: personalized page built from the profile ---------------- */
function Home({ profile }: { profile: Profile }) {
  const [theme, setThemeState] = useState<string>(profile.theme || "ocean");
  const firstName = (profile.full_name || profile.email || "").trim().split(/[\s@]+/)[0] || "there";

  useEffect(() => {
    const t = profile.theme || "ocean";
    applyTheme(t);
    setThemeState(t);
  }, [profile.theme]);

  async function pickTheme(key: ThemeKey) {
    applyTheme(key);
    setThemeState(key);
    await setTheme(key);
  }

  const website = profile.website?.trim() || null;
  const websiteHref = website
    ? (/^https?:\/\//i.test(website) ? website : `https://${website}`)
    : null;

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="brand"><span className="brand-name">Pharos</span></div>
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
          <span className="dash-name">{profile.full_name || profile.email}</span>
          <button className="ghost-btn" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>

      <main className="wrap dash-main">
        <div className="home-hero">
          <div className="greeting">Welcome, {firstName}</div>
          <h1>
            {profile.company || "Your workspace"}
            {profile.industry ? <span className="hero-industry"> · {profile.industry}</span> : null}
          </h1>
          <p>Your personalised workspace, tuned to what you do and who you serve.</p>
        </div>

        <div className="home-grid">
          <div className="home-card">
            <div className="hc-label">Your company</div>
            <div className="hc-value">{profile.company || "—"}</div>
            {websiteHref && (
              <a className="hc-link" href={websiteHref} target="_blank" rel="noreferrer">{website} ↗</a>
            )}
          </div>

          <div className="home-card">
            <div className="hc-label">Your industry</div>
            <div className="hc-value">{profile.industry || "—"}</div>
          </div>

          <div className="home-card">
            <div className="hc-label">What you offer</div>
            <div className="hc-text">{profile.offering || "—"}</div>
          </div>

          <div className="home-card">
            <div className="hc-label">Who you serve</div>
            <div className="hc-text">{profile.audience || "—"}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- App shell ---------------- */
export default function AdminApp() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const load = () => getProfile().then(setProfile);
  useEffect(() => { load(); const off = onAuthChange(load); return off; }, []);

  if (!supabase) return <div className="state"><h2>Auth unavailable</h2><p>Supabase credentials are not configured for this build.</p></div>;
  if (profile === undefined) return <div className="state">Loading…</div>;
  if (profile === null) return <AuthScreen />;
  if (!profile.onboarded) return <Onboarding onDone={load} />;
  return <Home profile={profile} />;
}
