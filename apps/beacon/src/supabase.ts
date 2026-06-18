// Supabase data layer — slug-based, deterministic (SOW §3.7).
// Dual-mode: if env creds exist, fetch live via the get_beacon RPC;
// otherwise fall back to the local dev seed so the app always runs.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BeaconRow } from "./types.ts";
import { SEED } from "./seed.ts";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const LIVE = Boolean(url && anon);
const client: SupabaseClient | null = LIVE ? createClient(url!, anon!) : null;

/** Resolve a Beacon by its unguessable slug. */
export async function getBeacon(slug: string): Promise<BeaconRow | null> {
  if (!LIVE || !client) return SEED[slug] ?? null;
  const { data, error } = await client.rpc("get_beacon", { p_slug: slug });
  if (error) { console.error("get_beacon failed", error); return null; }
  return (data as BeaconRow) ?? null;
}

/** Fire a tracking event for the slug (ingested into beacon_events). */
export async function logEvent(slug: string, type: string, payload: Record<string, unknown>): Promise<void> {
  if (!LIVE || !client) { console.debug("[event]", type, payload); return; }
  const { error } = await client.rpc("log_beacon_event", { p_slug: slug, p_type: type, p_payload: payload });
  if (error) console.error("log_beacon_event failed", error);
}
