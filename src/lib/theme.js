// Layered dark surfaces
export const INK = "#101312";
export const PANEL = "#171B19";
export const CARD = "#1D2320";
export const CARD_ELEVATED = "#242B27";
export const PANEL2 = CARD; // legacy alias used across components
export const RULE = "rgba(242,240,232,0.08)";

// Typography
export const PAPER = "#F2F0E8";
export const MUTED = "#B8B9AE";
export const FAINT = "#777C75";
export const DISABLED = "#555B55";

// Brand accents
export const BRASS = "#C6A15B";
export const VERDI = "#5F9F8B";
export const VERDI_DEEP = "#376B60";

// Semantic
export const SUCCESS = "#6FAF8B";
export const WARNING = "#D1A85A";
export const RUST = "#C96B63"; // danger
export const INFO = "#7197B8";

// Per-module identity colors
export const CAT_TODAY = "#C6A15B";
export const CAT_WORKOUT = "#5F9F8B";
export const CAT_NUTRITION = "#C69A62";
export const CAT_KITCHEN = "#789B78";
export const CAT_FINANCE = "#C6A15B";
export const CAT_REFLECT = "#7189A0";
export const CAT_ASSISTANT = "#8B7FA6";

// A curated palette that stays in the Ledger tonal family — used to
// color-code categories, macros, moods, and account types consistently.
export const PALETTE = ["#C6A15B", "#5F9F8B", "#C96B63", "#7197B8", "#8B7FA6", "#789B78", "#C69A62", "#7189A0"];

export function colorFor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

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

// Hard-exclusion rule: if the user holds `dietType`, a recipe tagged with any of
// these ingredient-tags is not compatible and should be hard-filtered out.
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
