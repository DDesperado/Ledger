// wger.de is an open-source workout tracker with a free, keyless public API.
// This is a best-effort name match — their exercise names don't always line
// up with common gym terminology, so misses are expected and handled
// silently by falling back to no image rather than showing something wrong.

const BASE = "https://wger.de/api/v2";
const cache = new Map();

export async function fetchExerciseImage(name) {
  if (cache.has(name)) return cache.get(name);
  try {
    const searchRes = await fetch(`${BASE}/exercise/search/?term=${encodeURIComponent(name)}&language=english&format=json`);
    const searchData = await searchRes.json();
    const hit = (searchData.suggestions || [])[0];
    const baseId = hit?.data?.base_id;
    if (!baseId) { cache.set(name, null); return null; }

    const imgRes = await fetch(`${BASE}/exerciseimage/?exercise_base=${baseId}&format=json`);
    const imgData = await imgRes.json();
    const image = (imgData.results || [])[0]?.image || null;
    cache.set(name, image);
    return image;
  } catch {
    cache.set(name, null);
    return null;
  }
}
