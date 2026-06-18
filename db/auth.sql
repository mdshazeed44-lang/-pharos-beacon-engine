-- =====================================================================
--  Auth + roles — run AFTER schema.sql
--  Adds: profiles (role per user), beacon assignment, role-aware RLS.
--  Public Beacon rendering is unaffected (anon still uses get_beacon RPC).
-- =====================================================================

-- profile per auth user, carrying the role that drives the dashboard
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'rep' check (role in ('admin','rep')),
  theme       text not null default 'ocean',   -- per-user color scheme (drives the personalised UI)
  created_at  timestamptz not null default now()
);

-- which rep owns a beacon (drives the rep's filtered view + rep notifications)
alter table public.beacons add column if not exists assigned_to uuid references auth.users(id);
create index if not exists beacons_assigned_idx on public.beacons (assigned_to);

-- auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'rep')
  on conflict (id) do nothing;
  return new;
end; $fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- role check that bypasses RLS (security definer) — no recursion
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $fn$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$fn$;

-- ---------------- RLS ----------------
alter table public.profiles enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "admin reads all profiles" on public.profiles;
create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "admin reads all profiles" on public.profiles for select to authenticated using (public.is_admin());

-- beacons: authenticated dashboard access (anon still has no table policy — uses RPC)
drop policy if exists "admin reads all beacons" on public.beacons;
drop policy if exists "rep reads assigned beacons" on public.beacons;
create policy "admin reads all beacons"     on public.beacons for select to authenticated using (public.is_admin());
create policy "rep reads assigned beacons"  on public.beacons for select to authenticated using (assigned_to = auth.uid());

grant select on public.profiles to authenticated;
grant update (theme) on public.profiles to authenticated;  -- users can change their own color scheme
grant select on public.beacons  to authenticated;
