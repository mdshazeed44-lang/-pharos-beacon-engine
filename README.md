# Pharos · Beacon Generation Engine (Workstream B)

> Outbound that shows, not tells. An engine that detects a qualified account,
> stores a verified row, **generates a fully bespoke Beacon with no human
> authoring per account**, and attributes every interaction back to HubSpot.
>
> **This is an engine, not a page.** Reusability (data contract, generation
> pipeline, archetype library, deployment checklist) is a hard requirement.

## Architecture (4 layers — SOW §3)

```
Clay waterfall ──> Supabase ──> Generation pass ──> Validator ──> Beacon (React) ──> HubSpot
  (detect)         (store,        (4 LLM steps,      (deterministic   (render by      (slug-based
                    slug-keyed)    schema-enforced)    gate)            slug)           attribution)
```

| Layer | Tool | This repo |
|---|---|---|
| Detection | Clay (Pro+) — *Pharos* | `clay/` waterfall spec (8 steps) |
| Store | Supabase — *contractor* | `db/schema.sql` — universal data contract |
| Generation | n8n + LLM — *contractor build, Pharos key* | `packages/engine/src/generation/` |
| **Validator** | pure code | `packages/engine/src/validator.ts` ✅ built + tested |
| Frontend | **custom React/Vite + Vercel** *(replaces Lovable — see note)* | `apps/beacon/` |
| Attribution | n8n → HubSpot — *contractor* | `n8n/` + `db` event log |

### Tool substitution (SOW §3, §9.3 — flagged explicitly)
Lovable is replaced with a **hand-built React/Vite app on Vercel**. Why preferred:
full control over runtime Supabase reads by slug, the resource renderer executes
**only vetted pattern templates** (never arbitrary expressions), custom domain is
native, and the documented codebase satisfies the reusability gate directly. This
removes the SOW's highest Lovable risk ("dynamic Supabase read at runtime").

## What's built and verified now (no credentials needed)
- ✅ **Supabase data contract** — `db/schema.sql` (typed columns, `report_content` jsonb,
  tracking rollups, slug-secured `get_beacon` / `log_beacon_event` RPCs, RLS, event log)
- ✅ **Data contract types** — `packages/engine/src/contract.ts`
- ✅ **Vetted computation patterns** — `packages/engine/src/patterns.ts`
  (`multiply_compare`, `differential`, `divide_into_units` + full-range sampler)
- ✅ **Deterministic validator** — `packages/engine/src/validator.ts`
  (required fields · placeholder scan · mechanic-leak filter · full-range resource
  check: NaN / negative / impossible / unrounded) — **run `npm test` to prove it**

```
cd packages/engine && npm test
# Clean report PASS · poisoned report caught with exact regenerate-step
```

## Blocked on Pharos (SOW §9.2 — required at kickoff)
SOPs + Signal #1 spec · HubSpot private-app token · brand assets · custom-domain DNS ·
Clay workspace access · LLM API key · 48-hour review feedback.

## Build plan (SOW phases / milestones)
- **Phase 1 (wk 1–2) · M1 25%** — Clay waterfall, Supabase schema, generation pass + validator, 3 real Beacons
- **Phase 2 (wk 3–4) · M2 30%** — client-zero Beacon in React, generic resource renderer, custom domain, <2s mobile
- **Phase 3 (wk 5) · M3 20%** — 7 tracking events → n8n → HubSpot, slug attribution, 3 rep triggers
- **Phase 4 (wk 6) · M4 25%** — 5-account QA, 2 prompt-tuning cycles, engine documentation
- **Phase 5 (optional)** — HubSpot email sequence (quoted separately)

## Layout
```
db/schema.sql                 Supabase data contract (§3.3)
packages/engine/              generation + validation core (pure TS)
  src/contract.ts             data contract types
  src/patterns.ts             3 vetted computation patterns (§3.5)
  src/validator.ts            deterministic post-gen validator (§3.6, §8)
  test/validator.test.ts      runnable proof
apps/beacon/                  React/Vite Beacon (renderer)            [next]
clay/                         8-step detection waterfall spec          [next]
n8n/                          generation + attribution workflows       [next]
docs/                         engine documentation (M4 deliverable)    [next]
```
