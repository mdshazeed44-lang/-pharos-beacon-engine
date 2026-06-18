// Auth helpers (Supabase Auth). Session persists in localStorage by default.
import { supabase } from "./supabase.ts";

export type Role = "admin" | "rep";
export interface Profile { id: string; email: string; full_name: string | null; role: Role; }

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth unavailable (no Supabase credentials configured)." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
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

/** The logged-in user's profile (role drives the dashboard). */
export async function getProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", uid)
    .single();
  if (error) { console.error("profile load failed", error); return null; }
  return data as Profile;
}

export function onAuthChange(cb: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}
