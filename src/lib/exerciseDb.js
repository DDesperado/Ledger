// free-exercise-db is an open-source, MIT-licensed dataset of 800+ exercises
// with real photos bundled in the same repo — no API key, no signup, no
// rate limits. Fetched once and cached for the session. If it's ever
// unreachable or its shape changes, everything falls back silently to the
// smaller built-in list rather than breaking anything.

const JSON_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

let cache = null;
let loadPromise = null;

export function loadExerciseDb() {
  if (cache) return Promise.resolve(cache);
  if (loadPromise) return loadPromise;
  loadPromise = fetch(JSON_URL)
    .then((res) => res.json())
    .then((data) => {
      cache = Array.isArray(data) ? data : [];
      return cache;
    })
    .catch(() => {
      cache = [];
      return cache;
    });
  return loadPromise;
}

export function exerciseNames(db) {
  return (db || []).map((e) => e.name).filter(Boolean);
}

export function findExerciseImage(db, name) {
  if (!db || !name) return null;
  const lower = name.toLowerCase();
  const match = db.find((e) => e.name?.toLowerCase() === lower) || db.find((e) => e.name?.toLowerCase().includes(lower));
  if (match?.images?.length) return IMAGE_BASE + match.images[0];
  return null;
}
