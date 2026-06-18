// Auth helpers (Supabase Auth). Session persists in localStorage by default.
import { supabase } from "./supabase.ts";

export type Role = "admin" | "rep";
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  theme?: string;
  company: string | null;
  website: string | null;
  industry: string | null;
  offering: string | null;
  audience: string | null;
  onboarded: boolean;
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth unavailable (no Supabase credentials configured)." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

/** Create an account. Signups are auto-confirmed, so this logs the user straight in. */
export async function signUp(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth unavailable (no Supabase credentials configured)." };
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** The logged-in user's profile. */
export async function getProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, theme, company, website, industry, offering, audience, onboarded")
    .eq("id", uid)
    .single();
  if (error) { console.error("profile load failed", error); return null; }
  return data as Profile;
}

/** Persist onboarding details for the signed-in user and mark them onboarded. */
export async function saveOnboarding(d: {
  full_name: string;
  company: string;
  website: string;
  industry: string;
  offering: string;
  audience: string;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth unavailable (no Supabase credentials configured)." };
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) return { error: "Not signed in." };
  const { error } = await supabase
    .from("profiles")
    .update({ ...d, onboarded: true })
    .eq("id", uid);
  return { error: error?.message ?? null };
}

/** Persist the signed-in user's theme preference. */
export async function setTheme(theme: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) return;
  await supabase.from("profiles").update({ theme }).eq("id", uid);
}

export function onAuthChange(cb: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}
