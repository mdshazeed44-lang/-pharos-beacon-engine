-- =====================================================================
--  Seed data — two sample Beacons (run AFTER schema.sql).
--  Paste into Supabase SQL Editor. Proves: different slug => different page.
-- =====================================================================

insert into public.beacons
  (beacon_slug, beacon_url, hubspot_company_id, company_name, company_website,
   round_type, round_amount, round_date, investor_names, hire_title, hire_name,
   hire_start_date, employee_count, icp_industry, icp_size, icp_buyer_titles,
   use_case, hubspot_confirmed, generation_status, report_content)
values
-- ---- Account 1 : Northwind ------------------------------------------------
('nw-7f3a9c21e8', 'https://beacon.example.com/nw-7f3a9c21e8', '1180042337',
 'Northwind', 'https://northwind.example.com',
 'Series A', 4200000, '2026-04-20', array['Acel Partners','Northgate'],
 'VP of Sales', 'Sarah Chen', '2026-05-12', 60,
 'HR Tech · Workforce Analytics', '200–1,000 employees',
 array['CHRO','VP People','Head of People Ops'],
 'turning scattered workforce data into retention decisions', true, 'complete',
 '{
   "icp_recognition_copy": "You sell workforce analytics to people-first teams — and your commercial engine is being built right now.",
   "signal_name": "The Retention Cliff Signal",
   "signal_hypothesis": "A 200–1,000 person company hiring hard into one team while sentiment in that team slips is weeks from a retention problem it cannot yet see — and is in-market for exactly what Northwind sells.",
   "signal_pattern_visual": "Hiring surge in one team → Sentiment slips in that team → Cliff forms before HR sees it",
   "signal_why_it_works": "It catches the buyer before the pain is internally obvious — you arrive with the diagnosis, not another pitch.",
   "signal_detection_steps": [
     "Track companies in the 200–1,000 band publishing 3+ open roles inside a single team within a 30-day window.",
     "Cross-reference public review platforms for a rising share of comments tagged workload or burnout that quarter.",
     "Read public org-chart movement for a widening manager-to-individual-contributor ratio in that team.",
     "Confirm a people leader is in seat with a clear remit over retention outcomes.",
     "Flag the account only where hiring velocity and sentiment decline diverge — the cliff itself."
   ],
   "mock_beacon": {
     "archetype": "scorecard", "title": "People Risk Scorecard",
     "subtitle": "What a CHRO sees the second they open the Beacon you''d send them.",
     "illustrative_label": "Illustrative — populated from each prospect''s own signals",
     "pattern": "multiply_compare", "inputs": [], "constants": {}, "outputs": [],
     "risk_index": 72,
     "metrics": [
       {"label": "Hiring/sentiment divergence", "value": "High", "pct": 82, "tone": "bad"},
       {"label": "Backfill share of open roles", "value": "61%", "pct": 61, "tone": "warn"},
       {"label": "Manager span drift (12 mo)", "value": "+0.9", "pct": 45, "tone": "warn"},
       {"label": "Glassdoor workload mentions", "value": "↑ 2.4×", "pct": 74, "tone": "bad"}
     ]
   },
   "resource_params": {
     "archetype": "calculator", "title": "Workforce Retention Cost Calculator",
     "subtitle": "What unmanaged churn costs this team each year.",
     "illustrative_label": "Illustrative — based on your inputs",
     "pattern": "multiply_compare",
     "inputs": [
       {"key": "volume", "label": "Workforce size", "min": 200, "max": 1000, "step": 10, "default": 450},
       {"key": "rate_pct", "label": "Annual attrition", "min": 5, "max": 30, "step": 1, "default": 18},
       {"key": "unit_value", "label": "Cost to replace one person", "min": 25000, "max": 75000, "step": 1000, "default": 42000}
     ],
     "constants": {"floor_rate_pct": 11},
     "outputs": [
       {"key": "primary_total", "label": "Current annual cost of churn", "round_to": 1000, "min_plausible": 0, "max_plausible": 25000000, "non_negative": true, "prefix": "£", "tone": "cost"},
       {"key": "delta", "label": "Recoverable each year", "round_to": 1000, "min_plausible": 0, "max_plausible": 25000000, "non_negative": true, "prefix": "£", "tone": "save"}
     ],
     "funds_line": "Recovering that is roughly {save} a year — enough to fund several senior hires, or your entire analytics rollout twice over."
   },
   "cornerstone_title": "The 90-Day Retention Cliff: a field guide for People leaders",
   "cornerstone_outline": [
     "The three public signals that predict churn before exit interviews do",
     "How to read hiring velocity against sentiment — a worked example",
     "A 30/60/90 intervention model leaders can run without new headcount"
   ],
   "sequence_summary": "3-touch opener referencing the signal trigger, then the gap, then a clean break — no chasing.",
   "voc_summary": "Always-on listening across review sites and communities, surfacing the language your buyers use about churn.",
   "cta_copy": "Our signal found Northwind. This page generated itself. Imagine it running on your pipeline — book the workshop."
 }'::jsonb),

-- ---- Account 2 : Cadence --------------------------------------------------
('cd-2b8f4d9011', 'https://beacon.example.com/cd-2b8f4d9011', '1180099812',
 'Cadence', 'https://cadence.example.com',
 'Series B', 18000000, '2026-03-30', array['Index','Balderton'],
 'CRO', 'James Okoro', '2026-04-28', 80,
 'Fintech · Payments Infrastructure', '500–2,000 employees',
 array['VP Payments','Head of Finance Ops','Director of Treasury'],
 'cutting failed-payment leakage for subscription businesses', true, 'complete',
 '{
   "icp_recognition_copy": "You sell payment-recovery infrastructure to subscription finance teams — and your go-to-market is scaling fast.",
   "signal_name": "The Silent Leakage Signal",
   "signal_hypothesis": "A subscription business whose published pricing tiers grow faster than its support headcount is quietly losing revenue to failed payments — and does not yet have a recovery layer.",
   "signal_pattern_visual": "Pricing tiers expand → Support headcount flat → Failed-payment backlog grows unseen",
   "signal_why_it_works": "The leak never shows on a dashboard until churn spikes — you name a loss the finance team already feels but cannot quantify.",
   "signal_detection_steps": [
     "Track subscription businesses adding 2+ new public pricing tiers in two quarters.",
     "Compare against published support and operations team size over the same period.",
     "Scan status pages and community threads for recurring billing or dunning complaints.",
     "Confirm a finance or payments leader owns revenue operations.",
     "Flag accounts where tier expansion outpaces operational capacity — the leakage gap."
   ],
   "mock_beacon": {
     "archetype": "scorecard", "title": "Revenue Leakage Scorecard",
     "subtitle": "What a VP of Payments sees the moment they open their Beacon.",
     "illustrative_label": "Illustrative — populated from each prospect''s own signals",
     "pattern": "divide_into_units", "inputs": [], "constants": {}, "outputs": [],
     "risk_index": 64,
     "metrics": [
       {"label": "Tier growth vs ops capacity", "value": "2.3×", "pct": 70, "tone": "bad"},
       {"label": "Est. involuntary churn", "value": "Elevated", "pct": 58, "tone": "warn"},
       {"label": "Dunning coverage", "value": "Partial", "pct": 40, "tone": "warn"}
     ]
   },
   "resource_params": {
     "archetype": "calculator", "title": "Failed-Payment Recovery Estimator",
     "subtitle": "How much recoverable revenue is leaking through failed charges.",
     "illustrative_label": "Illustrative — based on your inputs",
     "pattern": "multiply_compare",
     "inputs": [
       {"key": "volume", "label": "Monthly transactions", "min": 10000, "max": 500000, "step": 5000, "default": 120000},
       {"key": "rate_pct", "label": "Failed-payment rate", "min": 2, "max": 15, "step": 1, "default": 7},
       {"key": "unit_value", "label": "Average transaction value", "min": 20, "max": 500, "step": 10, "default": 90}
     ],
     "constants": {"floor_rate_pct": 3},
     "outputs": [
       {"key": "primary_total", "label": "Monthly revenue at risk", "round_to": 1000, "min_plausible": 0, "max_plausible": 50000000, "non_negative": true, "prefix": "$", "tone": "cost"},
       {"key": "delta", "label": "Recoverable with a dunning layer", "round_to": 1000, "min_plausible": 0, "max_plausible": 50000000, "non_negative": true, "prefix": "$", "tone": "save"}
     ],
     "funds_line": "That is about {save} a month back into the business — recovered automatically, before churn ever shows up."
   },
   "cornerstone_title": "The Silent Leak: quantifying failed-payment churn in subscription finance",
   "cornerstone_outline": [
     "Why failed payments never surface on the revenue dashboard",
     "Tier expansion vs operational capacity — the hidden ratio",
     "A recovery model that runs without adding headcount"
   ],
   "sequence_summary": "3-touch opener naming the leak, then the quantified gap, then a clean break.",
   "voc_summary": "Always-on listening across status pages and finance communities for billing-failure language.",
   "cta_copy": "Our signal found Cadence. This page generated itself. See it run on your pipeline — book the workshop."
 }'::jsonb);
