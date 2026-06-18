// Client-side tracking → log_beacon_event RPC (the 7 events of SOW §5).
// Also exposes a small subscribe() so the on-page attribution panel can mirror
// each event live (used in the dev/demo view).
import { logEvent } from "./supabase.ts";

export interface TrackedEvent { name: string; prop: string; alert?: string; ts: number; }
type Listener = (e: TrackedEvent) => void;

export function createTracker(slug: string) {
  const fired: Record<string, boolean> = {};
  const listeners: Listener[] = [];
  const start = Date.now();
  let maxScroll = 0;
  let dwell = 0;

  const emit = (name: string, prop: string, type: string, payload: Record<string, unknown>, alert?: string) => {
    listeners.forEach((l) => l({ name, prop, alert, ts: Date.now() - start }));
    logEvent(slug, type, payload);
  };

  function checkAlert() {
    if (maxScroll >= 75 && dwell >= 90 && !fired.alert2) {
      fired.alert2 = true;
      emit("Trigger 2", "high engagement", "rep_alert", { trigger: 2 }, "Slack → rep: 75%+ read, 90s+ dwell");
    }
  }

  return {
    subscribe(l: Listener) { listeners.push(l); },
    opened() { emit("Beacon Opened", "beacon_first_opened", "beacon_opened", {}); },
    scroll(pct: number) {
      [25, 50, 75, 100].forEach((th) => {
        if (pct >= th && !fired["sc" + th]) {
          fired["sc" + th] = true; maxScroll = th;
          emit(`Scroll ${th}%`, "beacon_max_scroll_depth = " + th, "scroll_depth", { depth: th });
          checkAlert();
        }
      });
    },
    tickDwell() {
      dwell++;
      if (dwell % 30 === 0) emit(`Dwell ${dwell}s`, "beacon_total_dwell_seconds = " + dwell, "dwell", { seconds: dwell });
      checkAlert();
    },
    panel() { if (!fired.panel) { fired.panel = true; emit("Panel Engaged", "beacon_panels_engaged []", "panel_engaged", {}); } },
    resourceOpened() { if (!fired.resOpen) { fired.resOpen = true; emit("Resource Opened", "beacon_resource_opened = true", "resource_opened", {}); } },
    resourceCompleted() {
      if (!fired.resDone) {
        fired.resDone = true;
        emit("Resource Completed", "beacon_resource_completed = true", "resource_completed", {});
        emit("Trigger 3", "resource completion", "rep_alert", { trigger: 3 }, "Slack → rep: prospect ran the full calculator");
      }
    },
    cta() {
      if (!fired.cta) {
        fired.cta = true;
        emit("CTA Clicked", "beacon_cta_clicked = true", "cta_clicked", {});
        emit("Trigger 1", "CTA click", "rep_alert", { trigger: 1 }, "Slack → rep: prospect clicked CTA — call now");
      }
    },
  };
}
export type Tracker = ReturnType<typeof createTracker>;
