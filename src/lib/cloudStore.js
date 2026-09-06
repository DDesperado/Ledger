import { db } from "./firebase";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc,
  query, where,
} from "firebase/firestore";
import { uid as genId } from "./theme";

let currentUid = null;
export function setCurrentUser(uid) {
  currentUid = uid;
}

function col(table) {
  return collection(db, "users", currentUid, table);
}

export async function fetchTable(table) {
  const snap = await getDocs(col(table));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function insertRow(table, row) {
  const full = { ...row, created_at: new Date().toISOString() };
  const ref = await addDoc(col(table), full);
  return { id: ref.id, ...full };
}

export async function updateRow(table, id, patch) {
  const ref = doc(db, "users", currentUid, table, id);
  await updateDoc(ref, patch);
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
}

export async function deleteRow(table, id) {
  await deleteDoc(doc(db, "users", currentUid, table, id));
}

// --- checklist ---

export async function fetchChecklistItems() {
  return fetchTable("checklist_items");
}

export async function fetchCompletionsForDate(date) {
  const snap = await getDocs(query(col("checklist_completions"), where("date", "==", date)));
  return snap.docs.map((d) => d.data().item_id);
}

export async function toggleCompletion(itemId, date, isDone) {
  if (isDone) {
    const snap = await getDocs(query(col("checklist_completions"), where("date", "==", date), where("item_id", "==", itemId)));
    for (const d of snap.docs) await deleteDoc(d.ref);
  } else {
    await addDoc(col("checklist_completions"), { item_id: itemId, date });
  }
}

// --- nutrition targets (single doc) ---

export async function fetchNutritionTargets() {
  const snap = await getDoc(doc(db, "users", currentUid, "meta", "nutritionTargets"));
  return snap.exists() ? snap.data() : null;
}

export async function upsertNutritionTargets(targets) {
  await setDoc(doc(db, "users", currentUid, "meta", "nutritionTargets"), targets, { merge: true });
  return targets;
}

// --- settings (single doc holding all key/value settings) ---

export async function fetchSettings() {
  const snap = await getDoc(doc(db, "users", currentUid, "meta", "settings"));
  return snap.exists() ? snap.data() : {};
}

export async function setSettingField(key, value) {
  await setDoc(doc(db, "users", currentUid, "meta", "settings"), { [key]: value }, { merge: true });
}

// --- one-time migration from a local (pre-login) device's data blob ---

const TABLES = [
  "checklist_items", "workouts", "nutrition_entries", "reflections", "spending",
  "accounts", "holdings", "research_notes", "chat_messages", "kitchen",
  "shopping_list", "recipes", "reminders", "debts", "debt_payments",
];

export async function migrateLocalDataToCloud(localData) {
  for (const table of TABLES) {
    const rows = localData[table] || [];
    for (const row of rows) {
      const { id, ...rest } = row;
      await addDoc(col(table), rest);
    }
  }
  if (localData.nutrition_targets) {
    await setDoc(doc(db, "users", currentUid, "meta", "nutritionTargets"), localData.nutrition_targets, { merge: true });
  }
  if (localData.settings) {
    await setDoc(doc(db, "users", currentUid, "meta", "settings"), localData.settings, { merge: true });
  }
  // checklist_completions carry item ids that were just re-created with new
  // Firestore ids above, so a byte-for-byte copy isn't meaningful — habit
  // completion history doesn't carry over, everything else does.
}
