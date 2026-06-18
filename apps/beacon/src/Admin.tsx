// Self-serve product shell at the root URL — no slugs, no admin/rep concept.
// Auth (sign in OR create account) → Onboarding (if not onboarded) → personalized Home.
import { useEffect, useState } from "react";
import { supabase } from "./supabase.ts";
import { signIn, signUp, signOut, getProfile, saveOnboarding, onAuthChange, type Profile } from "./auth.ts";
import { applyTheme, pickTheme } from "./themes.ts";

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
  // Color is auto-decided per user from a stable seed — no theme-switcher UI.
  useEffect(() => {
    applyTheme(pickTheme(profile.company || profile.email || profile.id));
  }, [profile.company, profile.email, profile.id]);

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
  // Subhead: "{company} helps {audience}." with graceful fallbacks.
  let subhead: string | null = null;
  if (company && audience) subhead = `${company} helps ${audience}.`;
  else if (company && offering) subhead = `${company} — what we do, made clear.`;
  else if (audience) subhead = `Built for ${audience}.`;
  else if (company) subhead = company;

  // Positioning one-liner for the value band.
  let positioning: string | null = null;
  if (audience) positioning = `Built for ${audience}.`;
  else if (industry) positioning = `Built for ${industry}.`;
  else if (company) positioning = `This is ${company}.`;

  // Three honest benefit angles, only included when their source field exists.
  const benefits: { n: string; title: string; body: string }[] = [];
  if (audience) benefits.push({ n: "01", title: "Made for you", body: `Focused on ${audience}.` });
  if (industry) benefits.push({ n: "02", title: `Rooted in ${industry}`, body: `We work in ${industry} and build around it.` });
  if (offering) benefits.push({ n: "03", title: company ? `From ${company}` : "What we offer", body: offering });
  // Backfill so the grid always shows 3 when we have any data to show.
  if (benefits.length > 0) {
    if (benefits.length < 3 && company) benefits.push({ n: String(benefits.length + 1).padStart(2, "0"), title: company, body: `Get in touch to learn more about ${company}.` });
    if (benefits.length < 3 && offering) benefits.push({ n: String(benefits.length + 1).padStart(2, "0"), title: "What we offer", body: offering });
  }
  const benefits3 = benefits.slice(0, 3);

  // "Who it's for" supportive bullets, derived honestly.
  const forBullets: string[] = [];
  if (audience) forBullets.push(`If you're ${audience}, this is built with you in mind.`);
  if (offering) forBullets.push("Clear about what we do — no guesswork.");
  if (industry) forBullets.push(`Grounded in ${industry}.`);

  // "How it works" numbered points.
  const steps: string[] = ["Understand your needs"];
  if (industry) steps.push(`Tailored to ${industry}`);
  if (audience) steps.push(`Built around ${audience}`);
  else if (offering) steps.push("Delivered through what we do best");
  while (steps.length < 3) steps.push("Stay in touch as things grow");
  const steps3 = steps.slice(0, 3);

  function Cta({ label = "Get in touch", secondary = false }: { label?: string; secondary?: boolean }) {
    const cls = secondary ? "lp-cta lp-cta-secondary" : "lp-cta";
    return websiteHref
      ? <a className={cls} href={websiteHref} target="_blank" rel="noreferrer">{label}</a>
      : <a className={cls} href="#contact">{label}</a>;
  }

  return (
    <div className="lp">
      {/* Sticky top nav */}
      <header className="lp-bar">
        <div className="lp-bar-inner">
          <div className="lp-wordmark">
            <span className="lp-mark">{wordmark}</span>
          </div>
          <nav className="lp-bar-right">
            <Cta />
            <button className="lp-signout" onClick={() => signOut()}>Sign out</button>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-bg" aria-hidden="true" />
          <div className="lp-hero-inner">
            {industry && <div className="lp-eyebrow">{industry}</div>}
            <h1 className="lp-title">{headline}</h1>
            {subhead && <p className="lp-sub">{subhead}</p>}
            <div className="lp-actions">
              <Cta />
              <a className="lp-cta lp-cta-secondary" href="#what">See how</a>
            </div>
          </div>
        </section>

        {/* VALUE BAND */}
        {positioning && (
          <section className="lp-value">
            <div className="lp-value-inner">
              <p className="lp-value-text">{positioning}</p>
            </div>
          </section>
        )}

        {/* WHAT WE DO */}
        {(offering || industry) && (
          <section className="lp-section" id="what">
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

        {/* BENEFITS */}
        {benefits3.length > 0 && (
          <section className="lp-section lp-section-alt">
            <div className="lp-section-inner lp-wide">
              <div className="lp-kicker">Why it works</div>
              <div className="lp-cards">
                {benefits3.map(b => (
                  <article className="lp-card" key={b.n}>
                    <div className="lp-card-num">{b.n}</div>
                    <h3 className="lp-card-title">{b.title}</h3>
                    <p className="lp-card-body">{b.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* WHO IT'S FOR */}
        {(audience && forBullets.length > 0) && (
          <section className="lp-section">
            <div className="lp-section-inner">
              <div className="lp-kicker">Who it's for</div>
              <p className="lp-lead">{audience}</p>
              <ul className="lp-bullets">
                {forBullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section className="lp-section lp-section-alt">
          <div className="lp-section-inner">
            <div className="lp-kicker">{company ? `Why ${company}` : "How it works"}</div>
            <ol className="lp-steps">
              {steps3.map((s, i) => (
                <li className="lp-step" key={i}>
                  <span className="lp-step-num">{i + 1}</span>
                  <span className="lp-step-text">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-closing" id="contact">
          <div className="lp-closing-inner">
            <h2 className="lp-closing-title">Ready to get started?</h2>
            <div className="lp-actions lp-actions-center">
              <Cta />
              {websiteHref && (
                <a className="lp-link lp-link-on-dark" href={websiteHref} target="_blank" rel="noreferrer">
                  {websiteLabel} ↗
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-mark">{wordmark}</span>
          <div className="lp-footer-meta">
            {websiteHref && (
              <a className="lp-footer-link" href={websiteHref} target="_blank" rel="noreferrer">{websiteLabel} ↗</a>
            )}
            {company && <span className="lp-footer-copy">© 2026 {company}</span>}
            <button className="lp-signout" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </footer>
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
