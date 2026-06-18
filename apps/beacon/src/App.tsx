// App shell — resolve slug from URL, fetch the Beacon, render or 404.
// /beacon/<slug>  or  ?slug=<slug>  ;  defaults to dev seed when neither given.
import { useEffect, useMemo, useState } from "react";
import type { BeaconRow } from "./types.ts";
import { getBeacon, LIVE } from "./supabase.ts";
import { DEFAULT_SLUG } from "./seed.ts";
import { createTracker, type TrackedEvent } from "./tracking.ts";
import Beacon from "./Beacon.tsx";
import AdminApp from "./Admin.tsx";

function resolveSlug(): string {
  const path = window.location.pathname.match(/\/beacon\/([^/?#]+)/);
  if (path) return decodeURIComponent(path[1]);
  const q = new URLSearchParams(window.location.search).get("slug");
  return q || DEFAULT_SLUG;
}

function AttributionPanel({ events }: { events: TrackedEvent[] }) {
  const [min, setMin] = useState(false);
  const clock = (ms: number) => { const s = Math.floor(ms / 1000); return s < 60 ? s + "s" : Math.floor(s / 60) + "m" + (s % 60) + "s"; };
  return (
    <div className={`track ${min ? "min" : ""}`}>
      <div className="hd" onClick={() => setMin((m) => !m)}>
        <span className="live"><i /> ATTRIBUTION · LIVE</span><span>{min ? "▸" : "▾"}</span>
      </div>
      <div className="body">
        {events.length === 0 && <div className="empty">Interact with the page — every event posts to the matching HubSpot Company record.</div>}
        {events.slice().reverse().map((e, i) => (
          <div className={`ev ${e.alert ? "fire" : ""}`} key={i}>
            <span className="time">{clock(e.ts)}</span>
            <span className="t">{e.alert ? "⚡ REP ALERT" : e.name}</span>
            <span className="hs">→ {e.alert ? e.alert : `HubSpot · Company · ${e.prop}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  // /admin and /login → team dashboard (auth-gated). Everything else = public Beacon.
  const path = window.location.pathname;
  if (path.startsWith("/admin") || path.startsWith("/login")) return <AdminApp />;

  const slug = useMemo(resolveSlug, []);
  const tracker = useMemo(() => createTracker(slug), [slug]);
  const [row, setRow] = useState<BeaconRow | null | undefined>(undefined);
  const [events, setEvents] = useState<TrackedEvent[]>([]);

  useEffect(() => { tracker.subscribe((e) => setEvents((prev) => [...prev, e])); }, [tracker]);
  useEffect(() => { getBeacon(slug).then(setRow); }, [slug]);

  if (row === undefined) return <div className="state">Loading Beacon…</div>;
  if (row === null) return (
    <div className="state">
      <h2>Beacon not found</h2>
      <p>No record for slug <code>{slug}</code>{LIVE ? "" : " (dev mode — try /?slug=nw-7f3a9c21e8 or cd-2b8f4d9011)"}.</p>
    </div>
  );

  return (<><Beacon row={row} tracker={tracker} /><AttributionPanel events={events} /></>);
}
