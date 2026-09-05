// Zero-backend data layer. Everything lives in this browser's localStorage —
// nothing is shared between devices or people.

import { uid } from "./theme";

const KEY = "auren-data-v1";
const LEGACY_KEY = "ledger-data-v1";

function migrateLegacyData() {
  try {
    if (localStorage.getItem(KEY)) return; // already migrated or fresh install
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) localStorage.setItem(KEY, legacy);
  } catch {}
}
migrateLegacyData();

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function getTable(table) {
  const data = readAll();
  return data[table] || [];
}

function setTable(table, rows) {
  const data = readAll();
  data[table] = rows;
  writeAll(data);
}

export async function fetchTable(table) {
  return getTable(table).slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function insertRow(table, row) {
  const full = { id: uid(), created_at: new Date().toISOString(), ...row };
  const rows = getTable(table);
  setTable(table, [full, ...rows]);
  return full;
}

export async function updateRow(table, id, patch) {
  const rows = getTable(table);
  const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
  setTable(table, next);
  return next.find((r) => r.id === id);
}

export async function deleteRow(table, id) {
  setTable(table, getTable(table).filter((r) => r.id !== id));
}

export async function fetchChecklistItems() {
  return getTable("checklist_items");
}

export async function fetchCompletionsForDate(date) {
  return getTable("checklist_completions").filter((c) => c.date === date).map((c) => c.item_id);
}

export async function toggleCompletion(itemId, date, isDone) {
  const rows = getTable("checklist_completions");
  if (isDone) {
    setTable("checklist_completions", rows.filter((c) => !(c.item_id === itemId && c.date === date)));
  } else {
    setTable("checklist_completions", [...rows, { id: uid(), item_id: itemId, date }]);
  }
}

export async function fetchNutritionTargets() {
  const data = readAll();
  return data.nutrition_targets || null;
}

export async function upsertNutritionTargets(targets) {
  const data = readAll();
  data.nutrition_targets = targets;
  writeAll(data);
  return targets;
}

export function getSetting(key, fallback = "") {
  const data = readAll();
  return (data.settings || {})[key] ?? fallback;
}

export function setSetting(key, value) {
  const data = readAll();
  data.settings = { ...(data.settings || {}), [key]: value };
  writeAll(data);
}

export function exportAll() {
  return JSON.stringify(readAll(), null, 2);
}

export function importAll(json) {
  const parsed = JSON.parse(json);
  writeAll(parsed);
}
