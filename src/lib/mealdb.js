// TheMealDB's free tier is genuinely public — the "1" below is their published
// test key, not a secret, and works with no signup or account of any kind.
// Real limitation: it has no nutrition data, so imported recipes come in with
// macros at 0 — you'll want to fill those in (or ask the AI assistant to
// estimate them once you've added one).

const BASE = "https://www.themealdb.com/api/json/v1/1";

export async function fetchCuisineList() {
  const res = await fetch(`${BASE}/list.php?a=list`);
  const data = await res.json();
  return (data.meals || []).map((m) => m.strArea).sort();
}

export async function searchMealsByName(query) {
  const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function fetchMealsByCuisine(area) {
  const res = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function fetchMealDetail(id) {
  const res = await fetch(`${BASE}/lookup.php?i=${id}`);
  const data = await res.json();
  return (data.meals || [])[0] || null;
}

// Converts TheMealDB's 20 loose ingredient/measure fields into our
// {name, qty, unit} shape. Measures are free text ("1 cup", "a pinch"), so
// this is a best-effort parse — qty defaults to 1 when no number is found.
export function parseIngredients(meal) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (!name || !name.trim()) continue;
    const match = (measure || "").match(/([\d.]+)\s*(\w+)?/);
    const qty = match ? parseFloat(match[1]) || 1 : 1;
    const unit = (match && match[2]) || (measure || "").trim() || "";
    out.push({ name: name.trim(), qty, unit: unit.length > 10 ? "" : unit });
  }
  return out;
}
