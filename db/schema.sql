-- =====================================================================
--  PHAROS · Beacon Generation Engine — Supabase data contract
--  SOW §3.3 (universal data contract) · §3.7 (attribution) · §5 (tracking)
--
--  This contract is identical across all clients and signals. It is the
--  reusable foundation for Workstreams C and D. Do NOT fork per client.
--
--  Layout:
--    - identity / attribution      : typed columns (queried + joined)
--    - injected fields             : typed columns (verified, never null-filled)
--    - report_content              : jsonb (everything the AI generates)
--    - tracking rollups            : typed columns (written back from events)
--    - metadata                    : generation lifecycle
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- beacons : one row per qualified account, keyed by an unguessable slug
-- ---------------------------------------------------------------------
create table if not exists public.beacons (
  id                  uuid primary key default gen_random_uuid(),

  -- identity / attribution (§3.7 — stamped at Clay→HubSpot push)
  beacon_slug         text unique not null,                 -- unguessable; the access key
  beacon_url          text,
  hubspot_company_id  text not null,                         -- deterministic attribution target

  -- injected fields (§3.3 — verified from signal, NEVER placeholdered)
  company_name        text not null,
  company_website     text not null,
  company_description  text,
  round_type          text check (round_type in ('Series A','Series B')),
  round_amount        numeric,
  round_date          date,
  investor_names      text[],
  hire_title          text,
  hire_name           text,
  hire_start_date     date,
  employee_count      integer check (employee_count between 25 and 100),
  icp_industry        text,
  icp_size            text,
  icp_buyer_titles    text[],
  use_case            text,
  hubspot_confirmed   boolean not null default false,

  -- generated content (§3.4 — produced by the multi-step AI generation pass)
  -- holds: icp_recognition_copy, signal_* , mock_beacon, resource_params,
  --        cornerstone_title, cornerstone_outline, sequence_summary, cta_copy
  report_content      jsonb,

  -- tracking rollups (§5 — written back from beacon events via n8n)
  beacon_first_opened       timestamptz,
  beacon_last_opened        timestamptz,
  beacon_max_scroll_depth   integer not null default 0,
  beacon_total_dwell_seconds integer not null default 0,
  beacon_panels_engaged     text[] not null default '{}',
  beacon_resource_opened    boolean not null default false,
  beacon_resource_completed boolean not null default false,
  beacon_cta_clicked        boolean not null default false,

  -- metadata (§3.3)
  generation_status   text not null default 'pending'
                        check (generation_status in ('pending','generating','complete','failed')),
  generation_version  integer not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists beacons_company_idx on public.beacons (hubspot_company_id);
create index if not exists beacons_status_idx  on public.beacons (generation_status);

-- ---------------------------------------------------------------------
-- beacon_events : raw, append-only event log (audit + dead-letter source)
-- ---------------------------------------------------------------------
create table if not exists public.beacon_events (
  id            bigint generated always as identity primary key,
  beacon_slug   text not null references public.beacons(beacon_slug) on delete cascade,
  event_type    text not null check (event_type in
                  ('beacon_opened','scroll_depth','dwell','panel_engaged',
                   'resource_opened','resource_completed','cta_clicked')),
  payload       jsonb,
  hubspot_synced boolean not null default false,            -- false = sits in dead-letter
  created_at    timestamptz not null default now()
);
create index if not exists beacon_events_slug_idx   on public.beacon_events (beacon_slug);
create index if not exists beacon_events_unsynced_idx on public.beacon_events (hubspot_synced) where hubspot_synced = false;

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists beacons_touch on public.beacons;
create trigger beacons_touch before update on public.beacons
  for each row execute function public.touch_updated_at();

-- =====================================================================
--  SECURITY — the slug is the secret (§1.1 "unguessable slug")
--  Anon clients must NOT be able to read the table directly or enumerate
--  rows. They fetch exactly one beacon, by slug, via a SECURITY DEFINER
--  RPC that returns only render-safe fields (hubspot_company_id stays
--  server-side — attribution is resolved in n8n, not the browser).
-- =====================================================================
alter table public.beacons       enable row level security;
alter table public.beacon_events enable row level security;
-- (no anon policies created → anon has no direct table access)

create or replace function public.get_beacon(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'company_name',     b.company_name,
    'company_website',  b.company_website,
    'round_type',       b.round_type,
    'round_amount',     b.round_amount,
    'round_date',       b.round_date,
    'investor_names',   b.investor_names,
    'hire_title',       b.hire_title,
    'hire_name',        b.hire_name,
    'employee_count',   b.employee_count,
    'icp_industry',     b.icp_industry,
    'icp_size',         b.icp_size,
    'icp_buyer_titles', b.icp_buyer_titles,
    'use_case',         b.use_case,
    'report_content',   b.report_content
  )
  from public.beacons b
  where b.beacon_slug = p_slug
    and b.generation_status = 'complete';
$$;

grant execute on function public.get_beacon(text) to anon, authenticated;

-- ingest a tracking event (anon, by slug only) — used by the Beacon page
create or replace function public.log_beacon_event(p_slug text, p_type text, p_payload jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.beacon_events (beacon_slug, event_type, payload)
  select p_slug, p_type, p_payload
  where exists (select 1 from public.beacons where beacon_slug = p_slug);
$$;

grant execute on function public.log_beacon_event(text, text, jsonb) to anon, authenticated;
