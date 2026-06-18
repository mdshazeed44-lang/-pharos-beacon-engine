// Color themes — each overrides ONLY the brand/background CSS variables.
// applyTheme writes them onto :root so the whole app re-themes instantly.

export type ThemeKey = "ocean" | "forest" | "sunset" | "royal" | "slate" | "rose";

export const THEMES: Record<ThemeKey, Record<string, string>> = {
  ocean: {
    "--primary": "#355872",
    "--primary-2": "#42718f",
    "--primary-ink": "#2a4659",
    "--secondary": "#7aaace",
    "--secondary-2": "#9cd5ff",
    "--secondary-deep": "#3c6f92",
    "--bg": "#f7f8f0",
    "--bg-2": "#eef0e6",
  },
  forest: {
    "--primary": "#2f5d50",
    "--primary-2": "#3d7a68",
    "--primary-ink": "#244a40",
    "--secondary": "#7fb89f",
    "--secondary-2": "#a8e0c4",
    "--secondary-deep": "#357a5b",
    "--bg": "#f4f7f2",
    "--bg-2": "#e9efe6",
  },
  sunset: {
    "--primary": "#9a4a2f",
    "--primary-2": "#c26239",
    "--primary-ink": "#7a3a25",
    "--secondary": "#e8a06a",
    "--secondary-2": "#ffc890",
    "--secondary-deep": "#c2702f",
    "--bg": "#faf6f0",
    "--bg-2": "#f2eae0",
  },
  royal: {
    "--primary": "#4b3b8f",
    "--primary-2": "#6450b3",
    "--primary-ink": "#3a2e70",
    "--secondary": "#9d8be0",
    "--secondary-2": "#c3b3ff",
    "--secondary-deep": "#5d49a8",
    "--bg": "#f7f6fb",
    "--bg-2": "#efecf7",
  },
  slate: {
    "--primary": "#3a3f4b",
    "--primary-2": "#525866",
    "--primary-ink": "#2b2f38",
    "--secondary": "#8a93a3",
    "--secondary-2": "#b9c2d0",
    "--secondary-deep": "#5a616f",
    "--bg": "#f6f7f8",
    "--bg-2": "#ebedf0",
  },
  rose: {
    "--primary": "#8f3a5e",
    "--primary-2": "#b34f77",
    "--primary-ink": "#6f2e49",
    "--secondary": "#e08bab",
    "--secondary-2": "#ffb3ce",
    "--secondary-deep": "#b3496f",
    "--bg": "#fbf5f7",
    "--bg-2": "#f4e8ee",
  },
};

export const THEME_KEYS: ThemeKey[] = ["ocean", "forest", "sunset", "royal", "slate", "rose"];

export const THEME_LABELS: Record<ThemeKey, string> = {
  ocean: "Ocean",
  forest: "Forest",
  sunset: "Sunset",
  royal: "Royal",
  slate: "Slate",
  rose: "Rose",
};

export function applyTheme(key: string) {
  const t = THEMES[(key as ThemeKey)] ?? THEMES.ocean;
  for (const [k, v] of Object.entries(t)) document.documentElement.style.setProperty(k, v);
}

// Deterministically pick a theme from a seed string (auto-decided per user, no UI).
export function pickTheme(seed: string): ThemeKey { let h=0; const s=(seed||"default"); for(let i=0;i<s.length;i++){ h=(h*31 + s.charCodeAt(i))>>>0; } return THEME_KEYS[h % THEME_KEYS.length]; }

// Color now depends on gender (warm/cool family) + age (offset within family) + company (stable hash).
const WARM: ThemeKey[] = ["sunset","rose","royal"];
const COOL: ThemeKey[] = ["ocean","forest","slate"];
const AGE_INDEX: Record<string, number> = {"18-24":0,"25-34":1,"35-44":2,"45-54":3,"55+":4};
export function pickThemeFor(p: {gender?:string|null; age_group?:string|null; company?:string|null; email?:string|null; id?:string}): ThemeKey {
  const group = p.gender==="female" ? WARM : p.gender==="male" ? COOL : THEME_KEYS;
  const ageIdx = AGE_INDEX[p.age_group||""] ?? 2;
  let h=0; const s=(p.company||p.email||p.id||"default"); for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}
  return group[(ageIdx + h) % group.length];
}
