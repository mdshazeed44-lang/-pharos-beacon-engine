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

/* ---------------- Home: personalized marketing landing page built from the profile ---------------- */
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

  // Derive copy strictly from real profile fields — no fabricated claims/metrics.
  const company = profile.company?.trim() || null;
  const industry = profile.industry?.trim() || null;
  const offering = profile.offering?.trim() || null;
  const audience = profile.audience?.trim() || null;
  const wordmark = company || "Your workspace";

  const website = profile.website?.trim() || null;
  const websiteHref = website
    ? (/^https?:\/\//i.test(website) ? website : `https://${website}`)
    : null;
  const websiteLabel = website ? website.replace(/^https?:\/\//i, "").replace(/\/$/, "") : null;

  // Hero headline: their value proposition (offering); fall back to company name.
  const headline = offering || company || "Your workspace";
  // Subhead: "{company} — built for {audience}." with graceful fallbacks.
  let subhead: string | null = null;
  if (company && audience) subhead = `${company} — built for ${audience}.`;
  else if (audience) subhead = `Built for ${audience}.`;
  else if (company) subhead = company;

  return (
    <div className="lp">
      {/* Slim sticky top bar */}
      <header className="lp-bar">
        <div className="lp-bar-inner">
          <div className="lp-wordmark">
            <span className="lp-mark">{wordmark}</span>
            <span className="lp-hello">Welcome, {firstName}</span>
          </div>
          <div className="lp-bar-right">
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
            <button className="ghost-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            {industry && <div className="lp-eyebrow">{industry}</div>}
            <h1 className="lp-title">{headline}</h1>
            {subhead && <p className="lp-sub">{subhead}</p>}
            <div className="lp-actions">
              {websiteHref ? (
                <a className="lp-cta" href={websiteHref} target="_blank" rel="noreferrer">Get in touch</a>
              ) : (
                <a className="lp-cta" href="#contact">Get in touch</a>
              )}
              {websiteHref && (
                <a className="lp-link" href={websiteHref} target="_blank" rel="noreferrer">
                  {websiteLabel} ↗
                </a>
              )}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        {audience && (
          <section className="lp-band">
            <div className="lp-band-inner">
              <div className="lp-kicker">Who it's for</div>
              <p className="lp-band-text">{audience}</p>
            </div>
          </section>
        )}

        {/* WHAT WE DO */}
        {(offering || industry) && (
          <section className="lp-section">
            <div className="lp-section-inner">
              <div className="lp-kicker">What we do</div>
              {offering && <p className="lp-lead">{offering}</p>}
              {industry && (
                <p className="lp-context">
                  {company ? `${company} works in ${industry}.` : `Working in ${industry}.`}
                </p>
              )}
            </div>
          </section>
        )}

        {/* CLOSING CTA */}
        <section className="lp-closing" id="contact">
          <div className="lp-closing-inner">
            <h2 className="lp-closing-title">Ready when you are.</h2>
            <div className="lp-actions lp-actions-center">
              {websiteHref ? (
                <a className="lp-cta" href={websiteHref} target="_blank" rel="noreferrer">Get in touch</a>
              ) : (
                <a className="lp-cta lp-cta-static" href="#contact">Get in touch</a>
              )}
              {websiteHref && (
                <a className="lp-link lp-link-on-dark" href={websiteHref} target="_blank" rel="noreferrer">
                  {websiteLabel} ↗
                </a>
              )}
            </div>
          </div>
        </section>
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
