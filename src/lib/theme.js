// Core surface/text colors are CSS custom properties so the same exported
// constants automatically reflect whichever theme (dark/light) is active —
// no need to touch the hundreds of components that already use them.
export const INK = "var(--ink)";
export const PANEL = "var(--panel)";
export const CARD = "var(--card)";
export const CARD_ELEVATED = "var(--card-elevated)";
export const PANEL2 = CARD; // legacy alias used across components
export const RULE = "var(--rule)";

export const PAPER = "var(--paper)";
export const MUTED = "var(--muted)";
export const FAINT = "var(--faint)";
export const DISABLED = "var(--disabled)";

// Fixed dark color for text/icons sitting on brass-colored buttons/badges —
// stays constant across light and dark themes, since gold surfaces always
// need dark contrast regardless of the overall theme.
export const ON_ACCENT = "#171207";

// Brand accents
export const BRASS = "var(--brass)";
export const VERDI = "var(--verdi)";
export const VERDI_DEEP = "var(--verdi-deep)";

// Semantic
export const SUCCESS = "var(--success)";
export const WARNING = "var(--warning)";
export const RUST = "var(--rust)"; // danger
export const INFO = "var(--info)";

// The actual hex values for both themes, applied as CSS custom properties.
// (Category-identity colors and the hashed color-coding palette below are
// intentionally left as fixed hex — they're used for things like category
// dots and tags where consistent, theme-independent recognition matters
// more than reflecting light/dark mode.)
export const THEME_VARS = {
  dark: {
    "--ink": "#0D1310", "--panel": "#141C17", "--card": "#1A2420", "--card-elevated": "#212D26",
    "--rule": "rgba(242,240,232,0.08)", "--paper": "#F2F0E8", "--muted": "#A9B0A5", "--faint": "#6B756D",
    "--disabled": "#4A524C", "--brass": "#C9A464", "--verdi": "#7BA88B", "--verdi-deep": "#3F5C4C",
    "--success": "#7BA88B", "--warning": "#D1A85A", "--rust": "#C96B63", "--info": "#7197B8",
  },
  light: {
    "--ink": "#F5F3EE", "--panel": "#FFFFFF", "--card": "#FFFFFF", "--card-elevated": "#F1EEE6",
    "--rule": "rgba(20,20,15,0.10)", "--paper": "#1C1D18", "--muted": "#66695F", "--faint": "#9B9C90",
    "--disabled": "#C7C8BE", "--brass": "#A8823C", "--verdi": "#3F7A60", "--verdi-deep": "#2E5B48",
    "--success": "#3F7A60", "--warning": "#B4832E", "--rust": "#B04E42", "--info": "#4A749A",
  },
};

// Per-module identity colors
export const CAT_TODAY = "#C9A464";
export const CAT_WORKOUT = "#7BA88B";
export const CAT_NUTRITION = "#C69A62";
export const CAT_KITCHEN = "#7BA88B";
export const CAT_FINANCE = "#C9A464";
export const CAT_REFLECT = "#7189A0";
export const CAT_ASSISTANT = "#C9A464";

// A curated palette that stays in the brand's tonal family — used to
// color-code categories, macros, moods, and account types consistently.
export const PALETTE = ["#C9A464", "#7BA88B", "#C96B63", "#7197B8", "#B08FC7", "#7BA88B", "#C69A62", "#7189A0"];

export function colorFor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

// Motion tokens — consistent timing values used across the app's
// animations instead of inventing durations ad-hoc per component.
export const MOTION = {
  FAST: 150,
  STANDARD: 280,
  EMPHASIS: 500,
  LONG: 900,
};

export const inputStyle = {
  background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "10px 12px",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "Inter",
  transition: "border-color 0.15s ease",
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export async function fetchQuote(ticker) {
  const sym = ticker.trim().toLowerCase();
  const res = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("no data");
  const cols = lines[1].split(",");
  const close = parseFloat(cols[6]);
  if (!close || Number.isNaN(close)) throw new Error("no price");
  return close;
}

// --- Dietary system ---
export const DIETARY_TYPES = ["Vegetarian", "Vegan", "Pescatarian", "Omnivore", "Halal", "Kosher", "Gluten-free", "Dairy-free", "Lactose-free", "Keto", "Low-carb", "High-protein"];
export const COMMON_ALLERGENS = ["Peanuts", "Tree nuts", "Milk", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Sesame"];

const DIET_EXCLUDES = {
  Vegetarian: ["meat", "fish", "shellfish"],
  Vegan: ["meat", "fish", "shellfish", "dairy", "eggs"],
  Pescatarian: ["meat"],
  "Dairy-free": ["dairy"],
  "Lactose-free": ["dairy"],
};

export function recipeMatchesDiet(recipe, dietTypes) {
  const tags = recipe.dietTags || [];
  for (const diet of dietTypes || []) {
    const excludes = DIET_EXCLUDES[diet];
    if (excludes && excludes.some((tag) => tags.includes(tag))) return false;
  }
  return true;
}

export function recipeMatchesAllergies(recipe, allergies) {
  const allergens = (recipe.allergens || []).map((a) => a.toLowerCase());
  return !(allergies || []).some((a) => allergens.includes(a.toLowerCase()));
}
