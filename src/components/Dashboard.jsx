import { useEffect, useMemo, useState, useRef } from "react";
import {
  Check, Plus, Trash2, Send, Dumbbell, UtensilsCrossed, NotebookPen,
  Sparkles, ListChecks, Loader2, Wallet, ShoppingCart, Landmark, TrendingUp, BookOpen, RefreshCw, Settings, Download, Upload,
  ChefHat, MoreHorizontal, AlertTriangle, CheckCircle2, X, Bell, Mic, Volume2, VolumeX, CreditCard, Search,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as db from "../lib/store";
import { getSetting, setSetting, exportAll, importAll } from "../lib/store";
import * as gmail from "../lib/gmail";
import { EXERCISES } from "../lib/exercises";
import * as mealdb from "../lib/mealdb";
import { fetchExerciseImage } from "../lib/exerciseImages";
import { INK, PANEL, PANEL2, CARD, CARD_ELEVATED, RULE, PAPER, MUTED, FAINT, BRASS, VERDI, RUST, SUCCESS, WARNING, INFO, CAT_NUTRITION as CAT_NUTRITION_COLOR, inputStyle, uid, todayStr, fmtDate, fetchQuote, colorFor, DIETARY_TYPES, COMMON_ALLERGENS, recipeMatchesDiet, recipeMatchesAllergies } from "../lib/theme";

const DEFAULT_ITEMS = [
  { category: "Morning", label: "Clear inbox & plan the day" },
  { category: "Morning", label: "Review calendar & priorities" },
  { category: "Deep Work", label: "Study / coursework block" },
  { category: "Movement", label: "Workout" },
  { category: "Reflect", label: "Read 15–20 minutes" },
  { category: "Wind Down", label: "Screens off & journal" },
];

const SPENDING_CATEGORIES = ["Groceries", "Rent", "Transport", "Dining", "Subscriptions", "School", "Fun", "Other"];
const KITCHEN_CATEGORIES = ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Snacks", "Spices", "Other"];
const KITCHEN_UNITS = ["", "g", "kg", "ml", "L", "pcs", "slices"];

const DEFAULT_RECIPES = [
  {
    name: "Egg & Cheese Sandwich", prepTime: 10, calories: 380, protein: 22, carbs: 32, fat: 18,
    ingredients: [{ name: "Eggs", qty: 2, unit: "pcs" }, { name: "Bread", qty: 2, unit: "slices" }, { name: "Cheese", qty: 40, unit: "g" }],
    dietTags: ["vegetarian", "dairy", "eggs"], allergens: ["Eggs", "Milk", "Wheat"],
  },
  {
    name: "Chicken Rice Bowl", prepTime: 20, calories: 610, protein: 42, carbs: 72, fat: 14,
    ingredients: [{ name: "Chicken", qty: 150, unit: "g" }, { name: "Rice", qty: 200, unit: "g" }, { name: "Vegetables", qty: 100, unit: "g" }],
    dietTags: ["meat"], allergens: [],
  },
  {
    name: "Protein Oats", prepTime: 8, calories: 420, protein: 32, carbs: 48, fat: 10,
    ingredients: [{ name: "Oats", qty: 60, unit: "g" }, { name: "Protein Powder", qty: 30, unit: "g" }, { name: "Milk", qty: 250, unit: "ml" }],
    dietTags: ["vegetarian", "dairy"], allergens: ["Milk"],
  },
];

function AurenMark({ size = 56, color = BRASS }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="30" stroke={color} strokeWidth="2.2" />
      <circle cx="50" cy="26" r="2.6" fill={color} />
      <line x1="50" y1="29" x2="50" y2="66" stroke={color} strokeWidth="2.2" />
      <path d="M50 55 C 40 55, 33 50, 30 41 C 40 41, 47 46, 50 55 Z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <path d="M50 55 C 60 55, 67 50, 70 41 C 60 41, 53 46, 50 55 Z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressBar({ done, total, label, color = BRASS }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          <LedgerNum value={done} /> <span style={{ color: MUTED, fontWeight: 400 }}>/ {total} completed</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color }}>{pct}%</div>
      </div>
      {label && <div style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>{label}</div>}
      <div style={{ height: 8, background: RULE, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 5, transition: "width 0.25s ease" }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: 20,
      boxShadow: "0 1px 2px rgba(0,0,0,0.2), 0 6px 20px -10px rgba(0,0,0,0.35)",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

function ExerciseThumb({ name, size = 32 }) {
  const [image, setImage] = useState(undefined); // undefined = loading, null = no match found
  useEffect(() => {
    let active = true;
    fetchExerciseImage(name).then((img) => { if (active) setImage(img); });
    return () => { active = false; };
  }, [name]);

  if (image) {
    return <img src={image} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: PANEL2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Dumbbell size={size * 0.5} color={FAINT} />
    </div>
  );
}

function SearchSelect({ value, onChange, options, placeholder, style }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    if (!value.trim()) return options.slice(0, 8);
    const q = value.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
  }, [value, options]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={style}
      />
      {open && matches.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: CARD_ELEVATED, border: `1px solid ${RULE}`, borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: "auto", zIndex: 25, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {matches.map((m) => (
            <div
              key={m}
              onMouseDown={() => { onChange(m); setOpen(false); }}
              style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", color: PAPER, borderBottom: `1px solid ${RULE}` }}
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 12px" }}>
      {Icon && <Icon size={20} color={FAINT} style={{ marginBottom: 8 }} />}
      <div style={{ color: MUTED, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: onAction ? 12 : 0 }}>{title}</div>
      {onAction && (
        <button onClick={onAction} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: BRASS, borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Plus size={13} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function LedgerNum({ value, positive }) {
  return <span style={{ fontFamily: "IBM Plex Mono", fontVariantNumeric: "tabular-nums", color: positive === undefined ? PAPER : positive ? VERDI : RUST }}>{value}</span>;
}

const ASSISTANT_TOOLS = [
  {
    name: "add_shopping_item",
    description: "Add an item to the user's shopping list.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Item name, e.g. 'Eggs'" },
        category: { type: "string", enum: KITCHEN_CATEGORIES },
      },
      required: ["name", "category"],
    },
  },
  {
    name: "log_meal",
    description: "Log a meal the user just ate to their Nutrition tab.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" },
      },
      required: ["name", "calories", "protein", "carbs", "fat"],
    },
  },
  {
    name: "add_reminder",
    description: "Create a reminder/task for the user with a due date.",
    input_schema: {
      type: "object",
      properties: { title: { type: "string" }, dueDate: { type: "string", description: "YYYY-MM-DD" } },
      required: ["title", "dueDate"],
    },
  },
  {
    name: "log_expense",
    description: "Log a spending entry to Finance.",
    input_schema: {
      type: "object",
      properties: {
        merchant: { type: "string" }, category: { type: "string", enum: SPENDING_CATEGORIES }, amount: { type: "number" },
      },
      required: ["merchant", "category", "amount"],
    },
  },
];

function buildAssistantSystemPrompt(context) {
  const day = todayStr();
  const doneToday = (context.doneToday || []).length;
  const totalItems = (context.items || []).length;
  const cals = (context.meals || []).filter((m) => m.date === day).reduce((s, m) => s + m.calories, 0);
  const spentToday = (context.spending || []).filter((s) => s.date === day).reduce((s, e) => s + e.amount, 0);
  const netWorth = (context.accounts || []).reduce((s, a) => s + a.balance, 0);
  const lastWorkout = (context.workouts || [])[0];
  const lastReflection = (context.reflections || [])[0];
  const holdingsSummary = (context.holdings || []).map((h) => `${h.shares}x ${h.ticker}`).join(", ") || "none";
  const name = context.displayName || "there";
  const lowStock = (context.kitchen || []).filter((k) => k.qty <= k.threshold).map((k) => k.name);
  const dietLine = context.dietTypes?.length ? `Diet: ${context.dietTypes.join(", ")}.` : "";
  const allergyLine = context.allergies?.length ? `Allergies (never suggest these): ${context.allergies.join(", ")}.` : "";

  return `You are the assistant embedded in ${name}'s personal "AUREN" app — a calm, direct daily-accounting coach covering habits, fitness, nutrition, kitchen, and personal finance. Keep replies short (2-5 sentences) unless asked for more. Today's snapshot: ${doneToday}/${totalItems} checklist items done, ${cals} calories logged, $${spentToday.toFixed(2)} spent today, last workout: ${lastWorkout ? `${lastWorkout.exercise} ${lastWorkout.weight}lb on ${lastWorkout.date}` : "none logged"}, last reflection mood: ${lastReflection ? lastReflection.mood : "none"}, net worth: $${netWorth.toFixed(2)}, holdings: ${holdingsSummary}, low stock: ${lowStock.join(", ") || "none"}. ${dietLine} ${allergyLine} You are not a licensed financial advisor — give factual, educational perspective rather than confident buy/sell recommendations. When the user asks you to add, log, or remind something, use the matching tool rather than just saying you will.`;
}

async function callAssistantRaw(apiMessages, system, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system,
      tools: ASSISTANT_TOOLS,
      messages: apiMessages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Anthropic API error");
  }
  return res.json();
}

// Returns either { type: "text", text } or { type: "tool_use", toolUse, rawContent }
async function callAssistant(messages, context, apiKey) {
  const system = buildAssistantSystemPrompt(context);
  const apiMessages = messages.map((m) => ({ role: m.role, content: m.content }));
  const data = await callAssistantRaw(apiMessages, system, apiKey);
  const toolUseBlock = (data.content || []).find((b) => b.type === "tool_use");
  if (toolUseBlock) {
    return { type: "tool_use", toolUse: toolUseBlock, rawContent: data.content, system, apiMessages };
  }
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "…";
  return { type: "text", text };
}

// After the user confirms/cancels an action, send the tool_result back so the
// assistant can give a natural closing reply, without persisting the tool_use
// turn into the visible chat history.
async function continueAfterTool({ system, apiMessages, rawContent, toolUse }, resultText, apiKey) {
  const followUp = [
    ...apiMessages,
    { role: "assistant", content: rawContent },
    { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: resultText }] },
  ];
  const data = await callAssistantRaw(followUp, system, apiKey);
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "Done.";
}

function describeAction(toolUse) {
  const { name, input } = toolUse;
  switch (name) {
    case "add_shopping_item": return `Add "${input.name}" to your shopping list (${input.category})`;
    case "log_meal": return `Log "${input.name}" — ${input.calories} cal, ${input.protein}g protein`;
    case "add_reminder": return `Remind you: "${input.title}" on ${input.dueDate}`;
    case "log_expense": return `Log $${input.amount} at ${input.merchant} (${input.category})`;
    default: return name;
  }
}

export default function Dashboard() {
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState(getSetting("displayName", ""));
  const [nameInput, setNameInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(getSetting("apiKey", ""));

  const [items, setItems] = useState([]);
  const [doneToday, setDoneToday] = useState([]);
  const [allCompletions, setAllCompletions] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [targets, setTargets] = useState({ calories: 2200, protein: 150, carbs: 220, fat: 70 });
  const [meals, setMeals] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [spending, setSpending] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [research, setResearch] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtPayments, setDebtPayments] = useState([]);
  const [chat, setChat] = useState([]);
  const [kitchen, setKitchen] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showReminders, setShowReminders] = useState(false);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dietTypes, setDietTypes] = useState(JSON.parse(getSetting("dietTypes", "[]")));
  const [allergies, setAllergies] = useState(JSON.parse(getSetting("allergies", "[]")));
  const [showDietSettings, setShowDietSettings] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(getSetting("googleClientId", ""));
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailError, setGmailError] = useState("");

  useEffect(() => {
    if (!displayName) { setLoading(false); return; }
    (async () => {
      let it = await db.fetchChecklistItems();
      if (it.length === 0) {
        for (const d of DEFAULT_ITEMS) await db.insertRow("checklist_items", d);
        it = await db.fetchChecklistItems();
      }
      setItems(it);
      setDoneToday(await db.fetchCompletionsForDate(todayStr()));
      setAllCompletions(await db.fetchTable("checklist_completions"));
      setWorkouts(await db.fetchTable("workouts"));
      const t = await db.fetchNutritionTargets();
      if (t) setTargets(t);
      setMeals(await db.fetchTable("nutrition_entries"));
      setReflections(await db.fetchTable("reflections"));
      setSpending(await db.fetchTable("spending"));
      setAccounts(await db.fetchTable("accounts"));
      setHoldings(await db.fetchTable("holdings"));
      setResearch(await db.fetchTable("research_notes"));
      setDebts(await db.fetchTable("debts"));
      setDebtPayments(await db.fetchTable("debt_payments"));
      setChat(await db.fetchTable("chat_messages"));
      setKitchen(await db.fetchTable("kitchen"));
      setShoppingList(await db.fetchTable("shopping_list"));
      let rec = await db.fetchTable("recipes");
      if (rec.length === 0) {
        for (const r of DEFAULT_RECIPES) await db.insertRow("recipes", r);
        rec = await db.fetchTable("recipes");
      }
      setRecipes(rec);
      setReminders(await db.fetchTable("reminders"));
      if (!getSetting("onboarded", "")) setShowOnboarding(true);
      setLoading(false);
    })();
  }, [displayName]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const percent = items.length ? (doneToday.length / items.length) * 100 : 0;
  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);

  const lowStockItems = useMemo(() => kitchen.filter((k) => k.qty <= k.threshold), [kitchen]);

  const streak = useMemo(() => {
    if (items.length === 0) return 0;
    const byDate = {};
    for (const c of allCompletions) (byDate[c.date] = byDate[c.date] || new Set()).add(c.item_id);
    let count = 0;
    let d = new Date();
    // Only count today if it's already fully complete; otherwise start from yesterday.
    if (!((byDate[todayStr()]?.size || 0) >= items.length)) d.setDate(d.getDate() - 1);
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if ((byDate[key]?.size || 0) >= items.length) { count++; d.setDate(d.getDate() - 1); }
      else break;
      if (count > 365) break;
    }
    return count;
  }, [allCompletions, items.length]);
  const alerts = useMemo(() => {
    const list = [];
    const today = todayStr();
    for (const item of lowStockItems) {
      list.push({ id: `stock-${item.id}`, kind: "stock", text: `${item.name} is running low (${item.qty}${item.unit} left)` });
    }
    for (const r of reminders) {
      if (r.done) continue;
      if (r.dueDate < today) list.push({ id: `rem-${r.id}`, kind: "overdue", text: `Overdue: ${r.title}` });
      else if (r.dueDate === today) list.push({ id: `rem-${r.id}`, kind: "today", text: `Due today: ${r.title}` });
    }
    return list;
  }, [lowStockItems, reminders]);

  useEffect(() => {
    if (notifPermission === "granted" && alerts.length > 0 && !loading) {
      const key = "lastNotifiedCount";
      const last = getSetting(key, "0");
      if (String(alerts.length) !== last) {
        new Notification("AUREN", { body: alerts.length === 1 ? alerts[0].text : `${alerts.length} things need your attention` });
        setSetting(key, String(alerts.length));
      }
    }
  }, [alerts, notifPermission, loading]);

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const toggleItem = async (itemId) => {
    const isDone = doneToday.includes(itemId);
    await db.toggleCompletion(itemId, todayStr(), isDone);
    setDoneToday(isDone ? doneToday.filter((x) => x !== itemId) : [...doneToday, itemId]);
  };

  const addItem = async (category, label) => {
    if (!label.trim()) return;
    const row = await db.insertRow("checklist_items", { category, label: label.trim() });
    setItems([...items, row]);
  };

  const removeItem = async (id) => {
    await db.deleteRow("checklist_items", id);
    setItems(items.filter((i) => i.id !== id));
  };

  const addReminder = async (title, dueDate) => {
    if (!title.trim() || !dueDate) return;
    const row = await db.insertRow("reminders", { title: title.trim(), dueDate, done: false });
    setReminders([row, ...reminders]);
  };

  const toggleReminder = async (id) => {
    const r = reminders.find((x) => x.id === id);
    const row = await db.updateRow("reminders", id, { done: !r.done });
    setReminders(reminders.map((x) => (x.id === id ? row : x)));
  };

  const removeReminder = async (id) => {
    await db.deleteRow("reminders", id);
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const finishOnboarding = () => {
    setSetting("onboarded", "true");
    setShowOnboarding(false);
  };

  const executeAssistantAction = async (toolUse) => {
    const { name, input } = toolUse;
    switch (name) {
      case "add_shopping_item": {
        const row = await db.insertRow("shopping_list", { name: input.name, category: input.category, purchased: false });
        setShoppingList((prev) => [row, ...prev]);
        return `Added "${input.name}" to the shopping list.`;
      }
      case "log_meal": {
        const row = await db.insertRow("nutrition_entries", { date: todayStr(), name: input.name, calories: input.calories, protein: input.protein, carbs: input.carbs, fat: input.fat });
        setMeals((prev) => [row, ...prev]);
        return `Logged "${input.name}": ${input.calories} cal, ${input.protein}g protein.`;
      }
      case "add_reminder": {
        const row = await db.insertRow("reminders", { title: input.title, dueDate: input.dueDate, done: false });
        setReminders((prev) => [row, ...prev]);
        return `Reminder set: "${input.title}" on ${input.dueDate}.`;
      }
      case "log_expense": {
        const row = await db.insertRow("spending", { date: todayStr(), merchant: input.merchant, category: input.category, amount: input.amount });
        setSpending((prev) => [row, ...prev]);
        return `Logged $${input.amount} at ${input.merchant} under ${input.category}.`;
      }
      default:
        return "Unknown action.";
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    setSetting("apiKey", key);
  };

  const toggleDietType = (type) => {
    const next = dietTypes.includes(type) ? dietTypes.filter((d) => d !== type) : [...dietTypes, type];
    setDietTypes(next);
    setSetting("dietTypes", JSON.stringify(next));
  };

  const toggleAllergy = (allergy) => {
    const next = allergies.includes(allergy) ? allergies.filter((a) => a !== allergy) : [...allergies, allergy];
    setAllergies(next);
    setSetting("allergies", JSON.stringify(next));
  };

  const saveGoogleClientId = (id) => {
    setGoogleClientId(id);
    setSetting("googleClientId", id);
  };

  const connectGmail = async () => {
    setGmailError("");
    try {
      await gmail.requestGmailAccess(googleClientId.trim());
      setGmailConnected(true);
    } catch (e) {
      setGmailError(e.message);
    }
  };

  const disconnectGmail = () => {
    gmail.disconnectGmail();
    setGmailConnected(false);
  };

  const downloadBackup = () => {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAll(reader.result);
        window.location.reload();
      } catch {
        alert("That file doesn't look like a valid AUREN backup.");
      }
    };
    reader.readAsText(file);
  };

  if (!displayName) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter" }}>
        <div style={{ width: 320, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><AurenMark size={64} /></div>
          <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 32, color: PAPER, marginBottom: 6, letterSpacing: "0.08em" }}>AUREN</div>
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>Your life. In balance.</div>
          <input
            autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && nameInput.trim()) { setSetting("displayName", nameInput.trim()); setDisplayName(nameInput.trim()); } }}
            placeholder="Your name"
            style={{ width: "100%", background: PANEL, border: `1px solid ${RULE}`, borderRadius: 10, padding: "12px 14px", color: PAPER, fontFamily: "IBM Plex Mono", fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
          />
          <button
            onClick={() => { if (nameInput.trim()) { setSetting("displayName", nameInput.trim()); setDisplayName(nameInput.trim()); } }}
            style={{ width: "100%", background: BRASS, color: INK, border: "none", borderRadius: 10, padding: "12px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Enter AUREN
          </button>
          <div style={{ color: MUTED, fontSize: 11, marginTop: 20, lineHeight: 1.5 }}>
            Everything you enter stays on this device only — nothing is sent anywhere except the Assistant tab, if you add your own API key.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin" color={MUTED} size={22} /></div>;
  }

  const PRIMARY_TABS = [
    { id: "today", label: "Today", icon: ListChecks },
    { id: "kitchen", label: "Kitchen", icon: ChefHat },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "finance", label: "Finance", icon: Wallet },
  ];
  const MORE_TABS = [
    { id: "nutrition", label: "Nutrition", icon: UtensilsCrossed },
    { id: "reflect", label: "Reflect", icon: NotebookPen },
    { id: "assistant", label: "Assistant", icon: Sparkles },
  ];
  const ALL_TABS = [...PRIMARY_TABS, ...MORE_TABS];
  const lowStockCount = kitchen.filter((k) => k.qty <= k.threshold).length;

  return (
    <div style={{ minHeight: "100vh", background: INK, fontFamily: "Inter", color: PAPER }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: "0.14em", color: BRASS, marginBottom: 8 }}>{dateLabel.toUpperCase()}</div>
            <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 30, lineHeight: 1.15 }}>
              {greeting}, <span style={{ fontStyle: "italic", fontWeight: 500 }}>{displayName}</span>.
            </div>
            {tab === "today" && items.length > 0 && (
              <div style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>{items.length} thing{items.length !== 1 ? "s" : ""} today · {doneToday.length} completed</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowReminders(true)} style={{ position: "relative", background: "transparent", border: `1px solid ${RULE}`, borderRadius: 20, padding: "6px 10px", display: "flex", alignItems: "center", color: MUTED, cursor: "pointer" }}>
              <Bell size={14} />
              {alerts.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: RUST, color: PAPER, borderRadius: 10, fontSize: 9, minWidth: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IBM Plex Mono" }}>{alerts.length}</span>
              )}
            </button>
            <button onClick={() => setShowSettings((v) => !v)} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 20, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, color: MUTED, cursor: "pointer", fontSize: 12 }}>
              <Settings size={13} /> settings
            </button>
          </div>
        </div>

        {showSettings && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <SectionLabel>Food & Dietary Preferences</SectionLabel>
              <button onClick={() => setShowDietSettings((v) => !v)} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 12, color: MUTED, fontSize: 11, padding: "3px 10px", cursor: "pointer" }}>{showDietSettings ? "close" : "edit"}</button>
            </div>
            {(dietTypes.length > 0 || allergies.length > 0) && !showDietSettings && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {dietTypes.map((d) => <span key={d} style={{ background: PANEL2, color: BRASS, borderRadius: 12, padding: "3px 10px", fontSize: 11 }}>{d}</span>)}
                {allergies.map((a) => <span key={a} style={{ background: PANEL2, color: RUST, borderRadius: 12, padding: "3px 10px", fontSize: 11 }}>No {a}</span>)}
              </div>
            )}
            {dietTypes.length === 0 && allergies.length === 0 && !showDietSettings && (
              <div style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>No preferences set — all recipes will be shown.</div>
            )}
            {showDietSettings && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: MUTED, fontSize: 11, marginBottom: 8 }}>Diet type</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {DIETARY_TYPES.map((d) => (
                    <button key={d} onClick={() => toggleDietType(d)} style={{ background: dietTypes.includes(d) ? BRASS : "transparent", color: dietTypes.includes(d) ? INK : MUTED, border: `1px solid ${dietTypes.includes(d) ? BRASS : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>{d}</button>
                  ))}
                </div>
                <div style={{ color: MUTED, fontSize: 11, marginBottom: 8 }}>Allergies — recipes containing these are hidden entirely</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {COMMON_ALLERGENS.map((a) => (
                    <button key={a} onClick={() => toggleAllergy(a)} style={{ background: allergies.includes(a) ? RUST : "transparent", color: allergies.includes(a) ? PAPER : MUTED, border: `1px solid ${allergies.includes(a) ? RUST : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>{a}</button>
                  ))}
                </div>
              </div>
            )}

            <SectionLabel>Integrations — Gmail</SectionLabel>
            <div style={{ color: MUTED, fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>
              Read-only access to find bills and receipts. AUREN never sees your password, and you can disconnect anytime.
            </div>
            <input
              value={googleClientId} onChange={(e) => saveGoogleClientId(e.target.value)}
              placeholder="Google OAuth Client ID" style={{ ...inputStyle, marginBottom: 8 }}
            />
            <div style={{ color: FAINT, fontSize: 10, lineHeight: 1.5, marginBottom: 10 }}>
              Create one free at console.cloud.google.com — new project → enable Gmail API → OAuth consent screen (Testing) → Credentials → OAuth client ID → Web application. This ID isn't secret, safe to store here.
            </div>
            {gmailConnected ? (
              <button onClick={disconnectGmail} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: RUST, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>Disconnect Gmail</button>
            ) : (
              <button onClick={connectGmail} disabled={!googleClientId.trim()} style={{ background: googleClientId.trim() ? PANEL2 : "transparent", border: `1px solid ${RULE}`, color: googleClientId.trim() ? PAPER : FAINT, borderRadius: 10, padding: "8px 14px", cursor: googleClientId.trim() ? "pointer" : "not-allowed", fontSize: 12, marginBottom: 8 }}>Connect Gmail</button>
            )}
            {gmailError && <div style={{ color: RUST, fontSize: 11, marginBottom: 8 }}>{gmailError}</div>}
            {gmailConnected && <div style={{ color: SUCCESS, fontSize: 11, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Connected — scan for bills from Finance → Spending.</div>}

            <SectionLabel>Notifications</SectionLabel>
            {notifPermission === "granted" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: VERDI, fontSize: 12, marginBottom: 16 }}>
                <Check size={13} /> Enabled — you'll see alerts for low stock and due reminders when you open AUREN.
              </div>
            ) : notifPermission === "denied" ? (
              <div style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>Blocked in your browser settings. You can still check the bell icon for alerts.</div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <button onClick={requestNotifications} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 12, marginBottom: 6 }}>Enable notifications</button>
                <div style={{ color: MUTED, fontSize: 11, lineHeight: 1.5 }}>Only fires while AUREN is open — this isn't a background push service, so it won't reach you if the tab is closed.</div>
              </div>
            )}
            <SectionLabel>Anthropic API key (for the Assistant tab)</SectionLabel>
            <input
              type="password" value={apiKey} onChange={(e) => saveApiKey(e.target.value)}
              placeholder="sk-ant-…" style={{ ...inputStyle, marginBottom: 8 }}
            />
            <div style={{ color: MUTED, fontSize: 11, lineHeight: 1.5, marginBottom: 16 }}>
              Stored only in this browser. Get one at console.anthropic.com — set a small spend cap there. Leave blank to skip the Assistant tab.
            </div>
            <SectionLabel>Backup</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={downloadBackup} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "8px", cursor: "pointer", fontSize: 12 }}>
                <Download size={13} /> Download backup
              </button>
              <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "8px", cursor: "pointer", fontSize: 12 }}>
                <Upload size={13} /> Restore backup
                <input type="file" accept="application/json" onChange={uploadBackup} style={{ display: "none" }} />
              </label>
            </div>
          </Card>
        )}

        <style>{`
          .ledger-top-nav { display: flex; }
          .ledger-bottom-nav { display: none; }
          @media (max-width: 680px) {
            .ledger-top-nav { display: none; }
            .ledger-bottom-nav { display: flex; }
            .ledger-page-content { padding-bottom: 76px; }
          }
          @keyframes ledgerFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          .ledger-page-content > div { animation: ledgerFadeIn 0.2s ease; }
          button { transition: transform 0.1s ease, opacity 0.15s ease; }
          button:active { transform: scale(0.97); }
        `}</style>

        <div className="ledger-top-nav" style={{ flexWrap: "wrap", gap: 4, borderBottom: `1px solid ${RULE}`, marginBottom: 24 }}>
          {ALL_TABS.map((t) => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
                borderBottom: active ? `2px solid ${BRASS}` : "2px solid transparent",
                color: active ? PAPER : MUTED, padding: "10px 12px", cursor: "pointer", fontWeight: 500, fontSize: 13, whiteSpace: "nowrap",
                transition: "color 0.15s ease, border-color 0.15s ease", position: "relative",
              }}>
                <Icon size={14} /> {t.label}
                {t.id === "kitchen" && lowStockCount > 0 && (
                  <span style={{ background: RUST, color: PAPER, borderRadius: 10, fontSize: 10, padding: "1px 6px", fontFamily: "IBM Plex Mono" }}>{lowStockCount}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="ledger-page-content">

        {tab === "today" && (
          <TodayTab items={items} categories={categories} doneToday={doneToday} percent={percent} toggleItem={toggleItem} addItem={addItem} removeItem={removeItem} targets={targets} meals={meals} alerts={alerts} onOpenReminders={() => setShowReminders(true)} workouts={workouts} streak={streak} />
        )}
        {tab === "workout" && <WorkoutTab workouts={workouts} setWorkouts={setWorkouts} />}
        {tab === "nutrition" && <NutritionTab targets={targets} setTargets={setTargets} meals={meals} setMeals={setMeals} />}
        {tab === "reflect" && <ReflectTab reflections={reflections} setReflections={setReflections} />}
        {tab === "finance" && (
          <FinanceTab spending={spending} setSpending={setSpending} accounts={accounts} setAccounts={setAccounts} holdings={holdings} setHoldings={setHoldings} research={research} setResearch={setResearch} kitchen={kitchen} setKitchen={setKitchen} debts={debts} setDebts={setDebts} debtPayments={debtPayments} setDebtPayments={setDebtPayments} />
        )}
        {tab === "kitchen" && (
          <KitchenTab
            kitchen={kitchen} setKitchen={setKitchen}
            shoppingList={shoppingList} setShoppingList={setShoppingList}
            recipes={recipes} setRecipes={setRecipes}
            meals={meals} setMeals={setMeals}
            spending={spending}
            dietTypes={dietTypes} allergies={allergies} onEditDiet={() => { setShowSettings(true); setShowDietSettings(true); }}
            apiKey={apiKey}
          />
        )}
        {tab === "assistant" && (
          <AssistantTab
            chat={chat} setChat={setChat}
            context={{ items, doneToday, workouts, meals, targets, reflections, spending, accounts, holdings, displayName, kitchen, dietTypes, allergies }}
            apiKey={apiKey} executeAction={executeAssistantAction}
          />
        )}
        </div>

        {tab !== "assistant" && (
          <button
            className="ledger-bottom-nav"
            onClick={() => setTab("assistant")}
            style={{
              position: "fixed", bottom: 86, right: 16, width: 50, height: 50, borderRadius: 25,
              background: "#8B7FA6", border: "none", boxShadow: "0 4px 16px rgba(139,127,166,0.4)",
              alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 15,
            }}
          >
            <Sparkles size={20} color="#101312" />
          </button>
        )}

        <div className="ledger-bottom-nav" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: PANEL, borderTop: `1px solid ${RULE}`,
          padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", justifyContent: "space-around", zIndex: 20,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.3)",
        }}>
          {PRIMARY_TABS.map((t) => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent",
                border: "none", color: active ? BRASS : MUTED, cursor: "pointer", fontSize: 10, padding: "4px 8px",
                position: "relative", transition: "color 0.15s ease",
              }}>
                <Icon size={19} />
                {t.label}
                {t.id === "kitchen" && lowStockCount > 0 && (
                  <span style={{ position: "absolute", top: 0, right: 2, background: RUST, width: 7, height: 7, borderRadius: "50%" }} />
                )}
              </button>
            );
          })}
          <button onClick={() => setShowMore(true)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent",
            border: "none", color: MORE_TABS.some((t) => t.id === tab) ? BRASS : MUTED, cursor: "pointer", fontSize: 10, padding: "4px 8px",
          }}>
            <MoreHorizontal size={19} />
            More
          </button>
        </div>

        {showMore && (
          <div onClick={() => setShowMore(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: PANEL, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: "20px 16px calc(20px + env(safe-area-inset-bottom))", width: "100%" }}>
              <div style={{ width: 36, height: 4, background: RULE, borderRadius: 2, margin: "0 auto 16px" }} />
              {MORE_TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setShowMore(false); }} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: "none",
                    color: PAPER, padding: "14px 8px", cursor: "pointer", fontSize: 15, borderBottom: `1px solid ${RULE}`,
                  }}>
                    <Icon size={18} color={BRASS} /> {t.label}
                  </button>
                );
              })}
              <button onClick={() => { setShowSettings(true); setShowMore(false); }} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: "none",
                color: PAPER, padding: "14px 8px", cursor: "pointer", fontSize: 15,
              }}>
                <Settings size={18} color={BRASS} /> Settings
              </button>
            </div>
          </div>
        )}

        {showReminders && (
          <RemindersPanel
            alerts={alerts} reminders={reminders} onClose={() => setShowReminders(false)}
            addReminder={addReminder} toggleReminder={toggleReminder} removeReminder={removeReminder}
          />
        )}

        {showOnboarding && (
          <Onboarding onFinish={finishOnboarding} setTargets={setTargets} requestNotifications={requestNotifications} dietTypes={dietTypes} toggleDietType={toggleDietType} allergies={allergies} toggleAllergy={toggleAllergy} />
        )}
      </div>
    </div>
  );
}

function RemindersPanel({ alerts, reminders, onClose, addReminder, toggleReminder, removeReminder }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 30, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PANEL, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: "20px 16px calc(20px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 720, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: RULE, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "Inter", fontSize: 18, fontWeight: 600 }}>Alerts & reminders</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><X size={18} /></button>
        </div>

        {alerts.length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
                <AlertTriangle size={13} color={a.kind === "overdue" ? RUST : BRASS} />
                {a.text}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>Nothing needs attention right now.</div>
        )}

        <SectionLabel>Your reminders</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto", gap: 8, marginBottom: 16 }}>
          <input placeholder="Remind me to…" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
          <button onClick={() => { addReminder(title, dueDate); setTitle(""); }} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
        {reminders.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
            <button onClick={() => toggleReminder(r.id)} style={{ width: 20, height: 20, borderRadius: 10, border: `1px solid ${r.done ? BRASS : MUTED}`, background: r.done ? BRASS : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {r.done && <Check size={13} color={INK} strokeWidth={3} />}
            </button>
            <span style={{ flex: 1, fontSize: 13, textDecoration: r.done ? "line-through" : "none", color: r.done ? MUTED : PAPER }}>{r.title}</span>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: "IBM Plex Mono" }}>{fmtDate(r.dueDate)}</span>
            <button onClick={() => removeReminder(r.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
          </div>
        ))}
        {reminders.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No reminders yet.</div>}
      </div>
    </div>
  );
}

function Onboarding({ onFinish, setTargets, requestNotifications, dietTypes, toggleDietType, allergies, toggleAllergy }) {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState({ Health: true, Fitness: true, Food: true, Finance: true, Tasks: true });
  const [proteinGoal, setProteinGoal] = useState("150");

  const toggleFocus = (k) => setFocus({ ...focus, [k]: !focus[k] });

  const finishSetup = async () => {
    await db.upsertNutritionTargets({ calories: 2200, protein: Number(proteinGoal) || 150, carbs: 220, fat: 70 });
    setTargets((t) => ({ ...t, protein: Number(proteinGoal) || 150 }));
    onFinish();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: INK, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter" }}>
      <div style={{ width: 340, textAlign: "center" }}>
        {step === 0 && (
          <>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 32, color: PAPER, marginBottom: 6 }}>Welcome to AUREN</div>
            <div style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>Your personal operating system.</div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 20, textAlign: "left" }}>What do you want AUREN to help manage?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {Object.keys(focus).map((k) => (
                <button key={k} onClick={() => toggleFocus(k)} style={{
                  display: "flex", alignItems: "center", gap: 10, background: focus[k] ? PANEL2 : "transparent",
                  border: `1px solid ${focus[k] ? BRASS : RULE}`, borderRadius: 6, padding: "10px 14px", cursor: "pointer", color: PAPER, fontSize: 14,
                }}>
                  <span style={{ width: 16, height: 16, borderRadius: 10, border: `1px solid ${focus[k] ? BRASS : MUTED}`, background: focus[k] ? BRASS : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {focus[k] && <Check size={11} color={INK} strokeWidth={3} />}
                  </span>
                  {k}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ width: "100%", background: BRASS, color: INK, border: "none", borderRadius: 10, padding: "12px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Continue</button>
            <button onClick={onFinish} style={{ width: "100%", background: "transparent", color: MUTED, border: "none", padding: "8px", fontSize: 13, cursor: "pointer" }}>Skip for now</button>
          </>
        )}
        {step === 1 && (
          <>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 24, color: PAPER, marginBottom: 6 }}>How do you eat?</div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>This shapes which recipes Kitchen shows you. Editable later in Settings.</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20 }}>
              {DIETARY_TYPES.map((d) => (
                <button key={d} onClick={() => toggleDietType(d)} style={{ background: dietTypes.includes(d) ? BRASS : "transparent", color: dietTypes.includes(d) ? INK : MUTED, border: `1px solid ${dietTypes.includes(d) ? BRASS : RULE}`, borderRadius: 12, padding: "5px 11px", fontSize: 12, cursor: "pointer" }}>{d}</button>
              ))}
            </div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 8, textAlign: "left" }}>Anything to avoid?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
              {COMMON_ALLERGENS.map((a) => (
                <button key={a} onClick={() => toggleAllergy(a)} style={{ background: allergies.includes(a) ? RUST : "transparent", color: allergies.includes(a) ? PAPER : MUTED, border: `1px solid ${allergies.includes(a) ? RUST : RULE}`, borderRadius: 12, padding: "5px 11px", fontSize: 12, cursor: "pointer" }}>{a}</button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", background: BRASS, color: INK, border: "none", borderRadius: 10, padding: "12px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Continue</button>
            <button onClick={onFinish} style={{ width: "100%", background: "transparent", color: MUTED, border: "none", padding: "8px", fontSize: 13, cursor: "pointer" }}>Skip for now</button>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 24, color: PAPER, marginBottom: 20 }}>Daily protein target</div>
            <input type="number" value={proteinGoal} onChange={(e) => setProteinGoal(e.target.value)} style={{ width: "100%", background: PANEL, border: `1px solid ${RULE}`, borderRadius: 10, padding: "12px 14px", color: PAPER, fontFamily: "IBM Plex Mono", fontSize: 14, outline: "none", marginBottom: 24, boxSizing: "border-box", textAlign: "center" }} />
            <button onClick={() => setStep(3)} style={{ width: "100%", background: BRASS, color: INK, border: "none", borderRadius: 10, padding: "12px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Continue</button>
            <button onClick={onFinish} style={{ width: "100%", background: "transparent", color: MUTED, border: "none", padding: "8px", fontSize: 13, cursor: "pointer" }}>Skip for now</button>
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 24, color: PAPER, marginBottom: 12 }}>Stay on top of things</div>
            <div style={{ color: MUTED, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              Get alerted when you're low on groceries or a reminder's due — only while AUREN is open.
            </div>
            <button onClick={async () => { await requestNotifications(); finishSetup(); }} style={{ width: "100%", background: BRASS, color: INK, border: "none", borderRadius: 10, padding: "12px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Enable notifications</button>
            <button onClick={finishSetup} style={{ width: "100%", background: "transparent", color: MUTED, border: "none", padding: "8px", fontSize: 13, cursor: "pointer" }}>Skip for now</button>
          </>
        )}
      </div>
    </div>
  );
}

function TodayTab({ items, categories, doneToday, percent, toggleItem, addItem, removeItem, targets, meals, alerts, onOpenReminders, workouts, streak }) {
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState(categories[0] || "General");

  const todayProtein = meals.filter((m) => m.date === todayStr()).reduce((s, m) => s + m.protein, 0);
  const proteinPct = targets.protein ? Math.min(100, (todayProtein / targets.protein) * 100) : 0;
  const todayWorkout = (workouts || []).find((w) => w.date === todayStr());
  const thingsRemaining = items.length - doneToday.length;

  return (
    <div>
      {alerts && alerts.length > 0 && (
        <Card style={{ marginBottom: 16, cursor: "pointer" }} onClick={onOpenReminders}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Bell size={14} color={BRASS} />
            <SectionLabel>Priorities</SectionLabel>
          </div>
          {alerts.slice(0, 4).map((a) => (
            <div key={a.id} style={{ fontSize: 13, marginBottom: 4, color: a.kind === "overdue" ? RUST : PAPER }}>{a.text}</div>
          ))}
          {alerts.length > 4 && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>+{alerts.length - 4} more — tap to see all</div>}
        </Card>
      )}
      <Card style={{ marginBottom: 16 }}>
        <ProgressBar done={doneToday.length} total={items.length} />
        {streak > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${RULE}`, display: "flex", alignItems: "center", gap: 6, color: BRASS, fontSize: 12, fontWeight: 600 }}>
            🔥 {streak} day{streak !== 1 ? "s" : ""} at 100%
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 16 }}>
          <SectionLabel>Protein</SectionLabel>
          {targets.protein > 0 ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}><LedgerNum value={todayProtein} positive={todayProtein <= targets.protein} /><span style={{ color: MUTED, fontSize: 13, fontWeight: 400 }}> / {targets.protein}g</span></div>
              <div style={{ color: MUTED, fontSize: 11, marginBottom: 8 }}>{Math.max(0, targets.protein - todayProtein)}g remaining</div>
              <div style={{ height: 5, background: RULE, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${proteinPct}%`, height: "100%", background: CAT_NUTRITION_COLOR, transition: "width 0.25s ease" }} />
              </div>
            </>
          ) : (
            <div style={{ color: FAINT, fontSize: 12 }}>Set a target in Nutrition</div>
          )}
        </Card>
        <Card style={{ padding: 16 }}>
          <SectionLabel>Workout</SectionLabel>
          {todayWorkout ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{todayWorkout.exercise}</div>
              <div style={{ color: SUCCESS, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Logged today</div>
            </>
          ) : (
            <div style={{ color: FAINT, fontSize: 12 }}>Not logged yet</div>
          )}
        </Card>
      </div>

      {categories.map((cat) => (
        <Card key={cat} style={{ marginBottom: 16 }}>
          <SectionLabel>{cat}</SectionLabel>
          {items.filter((i) => i.category === cat).map((item) => {
            const done = doneToday.includes(item.id);
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
                <button onClick={() => toggleItem(item.id)} style={{ width: 20, height: 20, borderRadius: 10, border: `1px solid ${done ? BRASS : MUTED}`, background: done ? BRASS : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s ease" }}>
                  {done && <Check size={13} color={INK} strokeWidth={3} />}
                </button>
                <span style={{ flex: 1, fontSize: 14, textDecoration: done ? "line-through" : "none", color: done ? MUTED : PAPER }}>{item.label}</span>
                <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
              </div>
            );
          })}
        </Card>
      ))}
      <Card>
        <SectionLabel>Add entry</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "8px 10px", fontSize: 13 }}>
            {[...categories, "General"].filter((v, i, a) => a.indexOf(v) === i).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addItem(newCat, newLabel); setNewLabel(""); } }} placeholder="e.g. Stretch for 10 minutes" style={{ flex: 1, background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "8px 10px", fontSize: 13, outline: "none" }} />
          <button onClick={() => { addItem(newCat, newLabel); setNewLabel(""); }} style={{ background: BRASS, border: "none", borderRadius: 10, padding: "0 12px", cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>
    </div>
  );
}

function WorkoutTab({ workouts, setWorkouts }) {
  const [form, setForm] = useState({ exercise: "", sets: "", reps: "", weight: "" });
  const [chartExercise, setChartExercise] = useState("");
  const exercises = useMemo(() => [...new Set(workouts.map((w) => w.exercise))], [workouts]);
  useEffect(() => { if (!chartExercise && exercises.length) setChartExercise(exercises[0]); }, [exercises]);

  const addWorkout = async () => {
    if (!form.exercise.trim() || !form.weight) return;
    const row = await db.insertRow("workouts", { date: todayStr(), exercise: form.exercise.trim(), sets: Number(form.sets) || 0, reps: Number(form.reps) || 0, weight: Number(form.weight) || 0 });
    setWorkouts([row, ...workouts]);
    setForm({ exercise: "", sets: "", reps: "", weight: "" });
  };
  const removeWorkout = async (id) => { await db.deleteRow("workouts", id); setWorkouts(workouts.filter((w) => w.id !== id)); };

  const chartData = useMemo(() => workouts.filter((w) => w.exercise === chartExercise).slice().reverse().map((w) => ({ date: fmtDate(w.date), weight: w.weight })), [workouts, chartExercise]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Log a lift</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8 }}>
          <SearchSelect value={form.exercise} onChange={(v) => setForm({ ...form, exercise: v })} options={EXERCISES} placeholder="Search exercise…" style={inputStyle} />
          <input placeholder="Sets" type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} style={inputStyle} />
          <input placeholder="Reps" type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} style={inputStyle} />
          <input placeholder="Weight" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={inputStyle} />
          <button onClick={addWorkout} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>
      {exercises.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>Progression</SectionLabel>
            <select value={chartExercise} onChange={(e) => setChartExercise(e.target.value)} style={{ background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "4px 8px", fontSize: 12 }}>
              {exercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke={RULE} vertical={false} />
                <XAxis dataKey="date" stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={{ background: PANEL, border: `1px solid ${RULE}`, fontSize: 12 }} labelStyle={{ color: PAPER }} />
                <Line type="monotone" dataKey="weight" stroke={VERDI} strokeWidth={2} dot={{ r: 3, fill: VERDI }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Card>
        <SectionLabel>History — {workouts.length} entries</SectionLabel>
        {workouts.slice(0, 25).map((w) => (
          <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
            <ExerciseThumb name={w.exercise} />
            <span style={{ color: MUTED, fontFamily: "IBM Plex Mono", fontSize: 11, width: 54 }}>{fmtDate(w.date)}</span>
            <span style={{ flex: 1 }}>{w.exercise}</span>
            <span style={{ fontFamily: "IBM Plex Mono", color: MUTED }}>{w.sets}×{w.reps}</span>
            <span style={{ fontFamily: "IBM Plex Mono", width: 60, textAlign: "right" }}>{w.weight}lb</span>
            <button onClick={() => removeWorkout(w.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={12} /></button>
          </div>
        ))}
        {workouts.length === 0 && <EmptyState icon={Dumbbell} title="No workout logged" />}
      </Card>
    </div>
  );
}

function NutritionTab({ targets, setTargets, meals, setMeals }) {
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [editTargets, setEditTargets] = useState(false);
  const [targetsForm, setTargetsForm] = useState(targets);
  useEffect(() => setTargetsForm(targets), [targets]);

  const todayMeals = meals.filter((m) => m.date === todayStr());
  const totals = todayMeals.reduce((acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const addEntry = async () => {
    if (!form.name.trim()) return;
    const row = await db.insertRow("nutrition_entries", { date: todayStr(), name: form.name.trim(), calories: Number(form.calories) || 0, protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0 });
    setMeals([row, ...meals]);
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };
  const removeEntry = async (id) => { await db.deleteRow("nutrition_entries", id); setMeals(meals.filter((m) => m.id !== id)); };
  const saveTargets = async () => {
    const patch = { calories: Number(targetsForm.calories) || 0, protein: Number(targetsForm.protein) || 0, carbs: Number(targetsForm.carbs) || 0, fat: Number(targetsForm.fat) || 0 };
    const row = await db.upsertNutritionTargets(patch);
    setTargets(row);
    setEditTargets(false);
  };

  const rows = [{ k: "calories", label: "Calories", unit: "" }, { k: "protein", label: "Protein", unit: "g" }, { k: "carbs", label: "Carbs", unit: "g" }, { k: "fat", label: "Fat", unit: "g" }];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionLabel>Today's balance</SectionLabel>
          <button onClick={() => setEditTargets((v) => !v)} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 12, color: MUTED, fontSize: 11, padding: "3px 10px", cursor: "pointer" }}>{editTargets ? "close" : "edit targets"}</button>
        </div>
        {editTargets && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 14 }}>
            {rows.map((r) => <input key={r.k} type="number" value={targetsForm[r.k]} onChange={(e) => setTargetsForm({ ...targetsForm, [r.k]: e.target.value })} placeholder={r.label} style={inputStyle} />)}
            <button onClick={saveTargets} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Save</button>
          </div>
        )}
        {rows.map((r) => {
          const actual = totals[r.k], target = targets[r.k] || 1, pct = Math.min(100, (actual / target) * 100), over = actual > target;
          const hue = colorFor(r.k);
          return (
            <div key={r.k} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: MUTED, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: hue, display: "inline-block" }} />
                  {r.label}
                </span>
                <span><LedgerNum value={actual} positive={!over} /> <span style={{ color: MUTED }}>/ {target}{r.unit}</span></span>
              </div>
              <div style={{ height: 5, background: RULE, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: over ? RUST : hue, transition: "width 0.3s ease" }} /></div>
            </div>
          );
        })}
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Log a meal</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="Meal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Cal" type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} style={inputStyle} />
          <input placeholder="Protein" type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} style={inputStyle} />
          <input placeholder="Carbs" type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} style={inputStyle} />
          <input placeholder="Fat" type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} style={inputStyle} />
          <button onClick={addEntry} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>
      <Card>
        <SectionLabel>Today's entries</SectionLabel>
        {todayMeals.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
            <span style={{ flex: 1 }}>{e.name}</span>
            <span style={{ fontFamily: "IBM Plex Mono", color: MUTED, width: 70, textAlign: "right" }}>{e.calories} cal</span>
            <button onClick={() => removeEntry(e.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={12} /></button>
          </div>
        ))}
        {todayMeals.length === 0 && <EmptyState icon={UtensilsCrossed} title="Nothing logged yet" />}
      </Card>
    </div>
  );
}

function ReflectTab({ reflections, setReflections }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("steady");
  const moods = ["steady", "energized", "tired", "stressed", "grateful"];

  const addEntry = async () => {
    if (!text.trim()) return;
    const row = await db.insertRow("reflections", { date: todayStr(), mood, text: text.trim() });
    setReflections([row, ...reflections]);
    setText("");
  };
  const removeEntry = async (id) => { await db.deleteRow("reflections", id); setReflections(reflections.filter((r) => r.id !== id)); };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>New entry — {fmtDate(todayStr())}</SectionLabel>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened today? What's on your mind?" rows={4} style={{ width: "100%", background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {moods.map((m) => <button key={m} onClick={() => setMood(m)} style={{ background: mood === m ? colorFor(m) : "transparent", color: mood === m ? INK : MUTED, border: `1px solid ${mood === m ? colorFor(m) : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer", transition: "all 0.15s ease" }}>{m}</button>)}
          </div>
          <button onClick={addEntry} style={{ background: BRASS, border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save</button>
        </div>
      </Card>
      {reflections.map((r) => (
        <Card key={r.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: MUTED }}>{fmtDate(r.date)} · <span style={{ color: colorFor(r.mood) }}>{r.mood}</span></span>
            <button onClick={() => removeEntry(r.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={12} /></button>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.text}</div>
        </Card>
      ))}
      {reflections.length === 0 && <EmptyState icon={NotebookPen} title="Nothing reflected yet" />}
    </div>
  );
}

function KitchenTab({ kitchen, setKitchen, shoppingList, setShoppingList, recipes, setRecipes, meals, setMeals, spending, dietTypes, allergies, onEditDiet, apiKey }) {
  const [sub, setSub] = useState("inventory");
  const low = kitchen.filter((k) => k.qty <= k.threshold);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const grocerySpend = spending.filter((s) => s.category === "Groceries" && s.date.startsWith(thisMonth)).reduce((sum, s) => sum + s.amount, 0);

  return (
    <div>
      {(dietTypes.length > 0 || allergies.length > 0) && (
        <div onClick={onEditDiet} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
          <span style={{ fontSize: 10, color: FAINT, letterSpacing: "0.1em", textTransform: "uppercase" }}>Food profile</span>
          {dietTypes.map((d) => <span key={d} style={{ background: PANEL2, color: BRASS, borderRadius: 12, padding: "2px 8px", fontSize: 10 }}>{d}</span>)}
          {allergies.map((a) => <span key={a} style={{ background: PANEL2, color: RUST, borderRadius: 12, padding: "2px 8px", fontSize: 10 }}>No {a}</span>)}
          <span style={{ fontSize: 10, color: MUTED }}>Edit</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "inventory", label: "Inventory" },
          { id: "recipes", label: "Recipes" },
          { id: "shopping", label: `Shopping${shoppingList.filter((s) => !s.purchased).length ? ` (${shoppingList.filter((s) => !s.purchased).length})` : ""}` },
        ].map((s) => {
          const active = sub === s.id;
          return (
            <button key={s.id} onClick={() => setSub(s.id)} style={{
              background: active ? PANEL2 : "transparent", border: `1px solid ${active ? BRASS : RULE}`,
              color: active ? PAPER : MUTED, borderRadius: 16, padding: "5px 12px", cursor: "pointer", fontSize: 12,
            }}>{s.label}</button>
          );
        })}
      </div>

      {grocerySpend > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel>Grocery spend this month</SectionLabel>
          <div style={{ fontFamily: "Inter", fontSize: 24, fontWeight: 600 }}><LedgerNum value={`$${grocerySpend.toFixed(2)}`} /></div>
        </Card>
      )}

      {sub === "inventory" && <InventorySub kitchen={kitchen} setKitchen={setKitchen} shoppingList={shoppingList} setShoppingList={setShoppingList} low={low} />}
      {sub === "recipes" && <RecipesSub recipes={recipes} setRecipes={setRecipes} kitchen={kitchen} setKitchen={setKitchen} meals={meals} setMeals={setMeals} dietTypes={dietTypes} allergies={allergies} apiKey={apiKey} />}
      {sub === "shopping" && <ShoppingListSub shoppingList={shoppingList} setShoppingList={setShoppingList} kitchen={kitchen} setKitchen={setKitchen} dietTypes={dietTypes} allergies={allergies} />}
    </div>
  );
}

function RecipesSub({ recipes, setRecipes, kitchen, setKitchen, meals, setMeals, dietTypes, allergies, apiKey }) {
  const [confirmingId, setConfirmingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [cuisines, setCuisines] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseResults, setBrowseResults] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [previewMeal, setPreviewMeal] = useState(null);
  const [estimatingId, setEstimatingId] = useState(null);
  const [form, setForm] = useState({ name: "", prepTime: "", calories: "", protein: "", carbs: "", fat: "", ingredients: [{ name: "", qty: "", unit: "" }], dietTags: [], allergens: [] });

  const estimateMacros = async (recipe) => {
    if (!apiKey) return;
    setEstimatingId(recipe.id);
    try {
      const ingredientList = recipe.ingredients.map((i) => `${i.qty}${i.unit} ${i.name}`).join(", ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 200,
          system: "Estimate rough nutrition for a home-cooked serving of the given recipe. Reply with ONLY a JSON object, no other text: {\"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number}",
          messages: [{ role: "user", content: `Recipe: ${recipe.name}. Ingredients: ${ingredientList}` }],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      const row = await db.updateRow("recipes", recipe.id, {
        calories: Math.round(parsed.calories) || 0, protein: Math.round(parsed.protein) || 0,
        carbs: Math.round(parsed.carbs) || 0, fat: Math.round(parsed.fat) || 0,
      });
      setRecipes(recipes.map((r) => (r.id === recipe.id ? row : r)));
    } catch {
      // silently leave macros as-is if estimation fails — never show wrong numbers as if they were reliable
    }
    setEstimatingId(null);
  };

  useEffect(() => {
    if (showBrowse && cuisines.length === 0) {
      mealdb.fetchCuisineList().then(setCuisines).catch(() => setCuisines([]));
    }
  }, [showBrowse]);

  const runCuisineBrowse = async (area) => {
    setSelectedCuisine(area);
    setBrowseLoading(true);
    try {
      const results = await mealdb.fetchMealsByCuisine(area);
      setBrowseResults(results.slice(0, 20));
    } catch {
      setBrowseResults([]);
    }
    setBrowseLoading(false);
  };

  const runNameSearch = async () => {
    if (!browseQuery.trim()) return;
    setBrowseLoading(true);
    setSelectedCuisine("");
    try {
      const results = await mealdb.searchMealsByName(browseQuery.trim());
      setBrowseResults(results || []);
    } catch {
      setBrowseResults([]);
    }
    setBrowseLoading(false);
  };

  const openPreview = async (basic) => {
    const detail = await mealdb.fetchMealDetail(basic.idMeal);
    setPreviewMeal(detail);
  };

  const importMeal = async () => {
    if (!previewMeal) return;
    const ingredients = mealdb.parseIngredients(previewMeal);
    const row = await db.insertRow("recipes", {
      name: previewMeal.strMeal, prepTime: 30, calories: 0, protein: 0, carbs: 0, fat: 0,
      ingredients, dietTags: [], allergens: [], source: "TheMealDB", image: previewMeal.strMealThumb || null,
    });
    setRecipes([...recipes, row]);
    setPreviewMeal(null);
    setShowBrowse(false);
  };

  const findKitchenMatch = (ingredientName) => kitchen.find((k) => k.name.toLowerCase() === ingredientName.toLowerCase());

  const withAvailability = useMemo(() => {
    const today = todayStr();
    const usesExpiring = (checked) => checked.some((c) => {
      const match = findKitchenMatch(c.name);
      if (!match?.expiryDate) return false;
      const days = (new Date(match.expiryDate) - new Date(today)) / 86400000;
      return days >= 0 && days <= 3;
    });
    return recipes
      .filter((r) => recipeMatchesDiet(r, dietTypes) && recipeMatchesAllergies(r, allergies))
      .map((r) => {
        const checked = r.ingredients.map((ing) => {
          const match = findKitchenMatch(ing.name);
          const have = match ? match.qty : 0;
          return { ...ing, have, available: have >= ing.qty };
        });
        const missing = checked.filter((c) => !c.available);
        return { ...r, checked, missing, canMake: missing.length === 0, usesExpiring: usesExpiring(checked) };
      }).sort((a, b) => {
        if (a.usesExpiring !== b.usesExpiring) return a.usesExpiring ? -1 : 1;
        return a.missing.length - b.missing.length;
      });
  }, [recipes, kitchen, dietTypes, allergies]);

  const hiddenCount = recipes.length - withAvailability.length;

  const cookRecipe = async (recipe) => {
    let updatedKitchen = kitchen;
    for (const ing of recipe.checked) {
      const match = findKitchenMatch(ing.name);
      if (match) {
        const newQty = Math.max(0, match.qty - ing.qty);
        const row = await db.updateRow("kitchen", match.id, { qty: newQty });
        updatedKitchen = updatedKitchen.map((k) => (k.id === match.id ? row : k));
      }
    }
    setKitchen(updatedKitchen);

    const mealRow = await db.insertRow("nutrition_entries", {
      date: todayStr(), name: recipe.name, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat,
    });
    setMeals([mealRow, ...meals]);
    setConfirmingId(null);
  };

  const addIngredientRow = () => setForm({ ...form, ingredients: [...form.ingredients, { name: "", qty: "", unit: "" }] });
  const updateIngredientRow = (i, field, value) => {
    const next = form.ingredients.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing));
    setForm({ ...form, ingredients: next });
  };
  const removeIngredientRow = (i) => setForm({ ...form, ingredients: form.ingredients.filter((_, idx) => idx !== i) });

  const saveRecipe = async () => {
    if (!form.name.trim()) return;
    const validIngredients = form.ingredients.filter((ing) => ing.name.trim());
    const row = await db.insertRow("recipes", {
      name: form.name.trim(), prepTime: Number(form.prepTime) || 0,
      calories: Number(form.calories) || 0, protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0,
      ingredients: validIngredients.map((ing) => ({ name: ing.name.trim(), qty: Number(ing.qty) || 0, unit: ing.unit })),
      dietTags: form.dietTags, allergens: form.allergens,
    });
    setRecipes([...recipes, row]);
    setForm({ name: "", prepTime: "", calories: "", protein: "", carbs: "", fat: "", ingredients: [{ name: "", qty: "", unit: "" }], dietTags: [], allergens: [] });
    setShowAdd(false);
  };

  const removeRecipe = async (id) => {
    await db.deleteRow("recipes", id);
    setRecipes(recipes.filter((r) => r.id !== id));
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showBrowse ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={14} color={BRASS} />
            <SectionLabel>Search recipes — Indian, British, Chinese & more</SectionLabel>
          </div>
          <button onClick={() => setShowBrowse((v) => !v)} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 12, color: MUTED, fontSize: 11, padding: "3px 10px", cursor: "pointer" }}>{showBrowse ? "close" : "browse"}</button>
        </div>
        {showBrowse && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 10 }}>
              <input value={browseQuery} onChange={(e) => setBrowseQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runNameSearch()} placeholder="Search by dish name…" style={inputStyle} />
              <button onClick={runNameSearch} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, cursor: "pointer", fontSize: 12 }}>Search</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {cuisines.map((c) => (
                <button key={c} onClick={() => runCuisineBrowse(c)} style={{ background: selectedCuisine === c ? BRASS : PANEL2, color: selectedCuisine === c ? INK : MUTED, border: `1px solid ${selectedCuisine === c ? BRASS : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>{c}</button>
              ))}
            </div>
            {browseLoading && <Loader2 className="animate-spin" size={16} color={MUTED} />}
            {!browseLoading && browseResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                {browseResults.map((m) => (
                  <div key={m.idMeal} onClick={() => openPreview(m)} style={{ display: "flex", alignItems: "center", gap: 10, background: PANEL2, borderRadius: 10, padding: 8, cursor: "pointer" }}>
                    {m.strMealThumb && <img src={m.strMealThumb} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                    <div style={{ fontSize: 13 }}>{m.strMeal}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ color: FAINT, fontSize: 10, marginTop: 10, lineHeight: 1.5 }}>
              From TheMealDB's free public recipe database — no account needed. Nutrition info isn't included, so you'll set macros after importing.
            </div>
          </div>
        )}
      </Card>

      {previewMeal && (
        <div onClick={() => setPreviewMeal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: CARD, borderRadius: 14, padding: 20, maxWidth: 420, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{previewMeal.strMeal}</div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>{previewMeal.strArea} · {previewMeal.strCategory}</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Ingredients</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
              {mealdb.parseIngredients(previewMeal).map((ing, i) => <div key={i}>{ing.qty}{ing.unit} {ing.name}</div>)}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={importMeal} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add to my recipes</button>
              <button onClick={() => setPreviewMeal(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ChefHat size={14} color={BRASS} />
          <SectionLabel>Tonight's options — sorted by what you can already make</SectionLabel>
        </div>
        <div style={{ color: MUTED, fontSize: 11 }}>Prioritized by ingredients you already have in Kitchen.</div>
        {hiddenCount > 0 && <div style={{ color: FAINT, fontSize: 11, marginTop: 4 }}>{hiddenCount} recipe{hiddenCount > 1 ? "s" : ""} hidden — doesn't match your food profile.</div>}
      </Card>

      {withAvailability.map((recipe) => (
        <Card key={recipe.id} style={{ marginBottom: 16, borderColor: recipe.canMake ? VERDI : RULE }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 12, flex: 1 }}>
              {recipe.image && <img src={recipe.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
              <div>
                <div style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600 }}>{recipe.name}</div>
                <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{recipe.prepTime} min</div>
                {recipe.usesExpiring && <div style={{ color: WARNING, fontSize: 10, marginTop: 4 }}>Uses something expiring soon</div>}
                {recipe.dietTags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {recipe.dietTags.map((t) => <span key={t} style={{ background: PANEL2, color: BRASS, borderRadius: 8, padding: "1px 7px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t}</span>)}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => removeRecipe(recipe.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 12, alignItems: "center" }}>
            <span><LedgerNum value={recipe.protein} /> <span style={{ color: MUTED }}>P</span></span>
            <span><LedgerNum value={recipe.calories} /> <span style={{ color: MUTED }}>cal</span></span>
            <span><LedgerNum value={recipe.carbs} /> <span style={{ color: MUTED }}>C</span></span>
            <span><LedgerNum value={recipe.fat} /> <span style={{ color: MUTED }}>F</span></span>
            {recipe.calories === 0 && apiKey && (
              <button onClick={() => estimateMacros(recipe)} disabled={estimatingId === recipe.id} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${RULE}`, color: "#8B7FA6", borderRadius: 10, padding: "3px 10px", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                {estimatingId === recipe.id ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Ask AI
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, marginBottom: 12 }}>
            {recipe.checked.map((ing, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, color: ing.available ? MUTED : RUST }}>
                {ing.available ? <Check size={12} color={VERDI} /> : <X size={12} color={RUST} />}
                {ing.qty}{ing.unit} {ing.name}
              </div>
            ))}
          </div>

          {confirmingId === recipe.id ? (
            <div style={{ background: PANEL2, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>This will deduct the available ingredients above from Kitchen and log this meal to Nutrition.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => cookRecipe(recipe)} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Make it</button>
                <button onClick={() => setConfirmingId(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 10, padding: "8px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmingId(recipe.id)} style={{ width: "100%", background: recipe.canMake ? BRASS : PANEL2, color: recipe.canMake ? INK : MUTED, border: recipe.canMake ? "none" : `1px solid ${RULE}`, borderRadius: 10, padding: "8px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              {recipe.canMake ? "Cook this" : `Missing ${recipe.missing.length} ingredient${recipe.missing.length > 1 ? "s" : ""}`}
            </button>
          )}
        </Card>
      ))}

      {showAdd ? (
        <Card>
          <SectionLabel>New recipe</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
            <input placeholder="Recipe name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <input placeholder="Prep time (min)" type="number" value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <input placeholder="Calories" type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} style={inputStyle} />
            <input placeholder="Protein" type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} style={inputStyle} />
            <input placeholder="Carbs" type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} style={inputStyle} />
            <input placeholder="Fat" type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} style={inputStyle} />
          </div>
          <SectionLabel>Ingredients</SectionLabel>
          {form.ingredients.map((ing, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.8fr auto", gap: 8, marginBottom: 8 }}>
              <input placeholder="Ingredient (must match Kitchen name)" value={ing.name} onChange={(e) => updateIngredientRow(i, "name", e.target.value)} style={inputStyle} />
              <input placeholder="Qty" type="number" value={ing.qty} onChange={(e) => updateIngredientRow(i, "qty", e.target.value)} style={inputStyle} />
              <select value={ing.unit} onChange={(e) => updateIngredientRow(i, "unit", e.target.value)} style={inputStyle}>
                {KITCHEN_UNITS.map((u) => <option key={u} value={u}>{u || "—"}</option>)}
              </select>
              <button onClick={() => removeIngredientRow(i)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={addIngredientRow} style={{ background: "transparent", border: `1px dashed ${RULE}`, color: MUTED, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 12, marginBottom: 12 }}>+ Add ingredient</button>

          <SectionLabel>Tags (used to match diet preferences)</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {["vegetarian", "vegan", "meat", "fish", "shellfish", "dairy", "eggs", "gluten"].map((t) => (
              <button key={t} onClick={() => setForm({ ...form, dietTags: form.dietTags.includes(t) ? form.dietTags.filter((x) => x !== t) : [...form.dietTags, t] })} style={{ background: form.dietTags.includes(t) ? BRASS : "transparent", color: form.dietTags.includes(t) ? INK : MUTED, border: `1px solid ${form.dietTags.includes(t) ? BRASS : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
          <SectionLabel>Allergens present</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {COMMON_ALLERGENS.map((a) => (
              <button key={a} onClick={() => setForm({ ...form, allergens: form.allergens.includes(a) ? form.allergens.filter((x) => x !== a) : [...form.allergens, a] })} style={{ background: form.allergens.includes(a) ? RUST : "transparent", color: form.allergens.includes(a) ? PAPER : MUTED, border: `1px solid ${form.allergens.includes(a) ? RUST : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>{a}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveRecipe} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save recipe</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{ width: "100%", background: "transparent", border: `1px dashed ${RULE}`, color: MUTED, borderRadius: 6, padding: "12px", cursor: "pointer", fontSize: 13 }}>
          + Add your own recipe
        </button>
      )}
    </div>
  );
}

function InventorySub({ kitchen, setKitchen, shoppingList, setShoppingList, low }) {
  const [form, setForm] = useState({ name: "", category: KITCHEN_CATEGORIES[0], qty: "", unit: "", threshold: "", expiryDate: "" });

  const addItem = async () => {
    if (!form.name.trim()) return;
    const row = await db.insertRow("kitchen", {
      name: form.name.trim(), category: form.category, qty: Number(form.qty) || 0,
      unit: form.unit, threshold: Number(form.threshold) || 1, expiryDate: form.expiryDate || null,
    });
    setKitchen([...kitchen, row]);
    setForm({ name: "", category: form.category, qty: "", unit: form.unit, threshold: "", expiryDate: "" });
  };

  const adjustQty = async (item, delta) => {
    const newQty = Math.max(0, item.qty + delta);
    const row = await db.updateRow("kitchen", item.id, { qty: newQty });
    setKitchen(kitchen.map((k) => (k.id === item.id ? row : k)));
  };

  const removeItem = async (id) => {
    await db.deleteRow("kitchen", id);
    setKitchen(kitchen.filter((k) => k.id !== id));
  };

  const addAllLowToShoppingList = async () => {
    const existingNames = new Set(shoppingList.filter((s) => !s.purchased).map((s) => s.name.toLowerCase()));
    const toAdd = low.filter((k) => !existingNames.has(k.name.toLowerCase()));
    let next = shoppingList;
    for (const item of toAdd) {
      const row = await db.insertRow("shopping_list", { name: item.name, category: item.category, purchased: false, fromLowStock: true });
      next = [row, ...next];
    }
    setShoppingList(next);
  };

  const byCategory = useMemo(() => {
    const map = {};
    kitchen.forEach((k) => { (map[k.category] = map[k.category] || []).push(k); });
    return map;
  }, [kitchen]);

  const expiringSoon = kitchen.filter((k) => {
    if (!k.expiryDate) return false;
    const days = (new Date(k.expiryDate) - new Date(todayStr())) / 86400000;
    return days >= 0 && days <= 3;
  });

  return (
    <div>
      {expiringSoon.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={14} color={WARNING} />
            <SectionLabel>Expiring soon</SectionLabel>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {expiringSoon.map((k) => <div key={k.id}>{k.name} <span style={{ color: MUTED }}>— {fmtDate(k.expiryDate)}</span></div>)}
          </div>
        </Card>
      )}
      {low.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color={RUST} />
              <SectionLabel>Running low</SectionLabel>
            </div>
            <button onClick={addAllLowToShoppingList} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 12, color: BRASS, fontSize: 11, padding: "3px 10px", cursor: "pointer" }}>
              Add to shopping list
            </button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {low.map((k) => <div key={k.id}><LedgerNum value={k.name} positive={false} /> <span style={{ color: MUTED }}>— {k.qty}{k.unit} left</span></div>)}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add a kitchen item</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.7fr", gap: 8, marginBottom: 8 }}>
          <input placeholder="e.g. Eggs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {KITCHEN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Qty" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={inputStyle} />
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
            {KITCHEN_UNITS.map((u) => <option key={u} value={u}>{u || "—"}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input placeholder="Low at" type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} style={inputStyle} />
          <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} style={inputStyle} title="Expiry date (optional)" />
          <button onClick={addItem} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer", padding: "0 16px" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>

      {Object.entries(byCategory).map(([cat, catItems]) => (
        <Card key={cat} style={{ marginBottom: 16 }}>
          <SectionLabel><span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: colorFor(cat), display: "inline-block" }} />{cat}</span></SectionLabel>
          {catItems.map((item) => {
            const isLow = item.qty <= item.threshold;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${RULE}` }}>
                <div style={{ flex: 1, fontSize: 13 }}>{item.name}</div>
                <button onClick={() => adjustQty(item, -1)} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, width: 26, height: 26, cursor: "pointer" }}>–</button>
                <span style={{ fontFamily: "IBM Plex Mono", width: 50, textAlign: "center", fontSize: 12 }}><LedgerNum value={`${item.qty}${item.unit}`} positive={!isLow} /></span>
                <button onClick={() => adjustQty(item, 1)} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, width: 26, height: 26, cursor: "pointer" }}>+</button>
                <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
              </div>
            );
          })}
        </Card>
      ))}
      {kitchen.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No kitchen items tracked yet.</div>}
    </div>
  );
}

const DIET_CONFLICT_KEYWORDS = {
  Vegan: [["milk", "dairy"], ["cheese"], ["egg"], ["chicken", "beef", "pork", "meat", "bacon"], ["fish", "shrimp", "salmon"], ["yogurt"], ["butter"]],
  Vegetarian: [["chicken", "beef", "pork", "meat", "bacon"], ["fish", "shrimp", "salmon"]],
  "Dairy-free": [["milk"], ["cheese"], ["yogurt"], ["butter", "cream"]],
  "Lactose-free": [["milk"], ["cheese"], ["yogurt"], ["cream"]],
};

function findDietConflict(itemName, dietTypes) {
  const lower = itemName.toLowerCase();
  for (const diet of dietTypes || []) {
    const groups = DIET_CONFLICT_KEYWORDS[diet];
    if (!groups) continue;
    for (const group of groups) {
      if (group.some((kw) => lower.includes(kw))) return diet;
    }
  }
  return null;
}

function ShoppingListSub({ shoppingList, setShoppingList, kitchen, setKitchen, dietTypes, allergies }) {
  const [form, setForm] = useState({ name: "", category: KITCHEN_CATEGORIES[0] });
  const [conflictWarning, setConflictWarning] = useState(null);

  const addItem = async (override) => {
    const name = (override?.name ?? form.name).trim();
    if (!name) return;
    if (!override) {
      const conflict = findDietConflict(name, dietTypes);
      if (conflict) { setConflictWarning({ name, category: form.category, diet: conflict }); return; }
    }
    const row = await db.insertRow("shopping_list", { name, category: override?.category ?? form.category, purchased: false });
    setShoppingList([row, ...shoppingList]);
    setForm({ name: "", category: form.category });
    setConflictWarning(null);
  };

  const togglePurchased = async (item) => {
    const nowPurchased = !item.purchased;
    const row = await db.updateRow("shopping_list", item.id, { purchased: nowPurchased });
    setShoppingList(shoppingList.map((s) => (s.id === item.id ? row : s)));

    if (nowPurchased) {
      // Restock in Kitchen: bump qty if the item already exists there, otherwise create it.
      const existing = kitchen.find((k) => k.name.toLowerCase() === item.name.toLowerCase());
      if (existing) {
        const updated = await db.updateRow("kitchen", existing.id, { qty: existing.qty + 1 });
        setKitchen(kitchen.map((k) => (k.id === existing.id ? updated : k)));
      } else {
        const created = await db.insertRow("kitchen", { name: item.name, category: item.category || "Other", qty: 1, unit: "", threshold: 1 });
        setKitchen([...kitchen, created]);
      }
    }
  };

  const removeItem = async (id) => {
    await db.deleteRow("shopping_list", id);
    setShoppingList(shoppingList.filter((s) => s.id !== id));
  };

  const byCategory = useMemo(() => {
    const map = {};
    shoppingList.filter((s) => !s.purchased).forEach((s) => { (map[s.category || "Other"] = map[s.category || "Other"] || []).push(s); });
    return map;
  }, [shoppingList]);

  const purchasedRecently = shoppingList.filter((s) => s.purchased).slice(0, 10);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add to list</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto", gap: 8 }}>
          <input placeholder="e.g. Bananas" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addItem()} style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {KITCHEN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => addItem()} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
        {conflictWarning && (
          <div style={{ marginTop: 10, background: PANEL2, border: `1px solid ${WARNING}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, marginBottom: 8, color: PAPER }}>"{conflictWarning.name}" doesn't match your {conflictWarning.diet} food profile.</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setConflictWarning(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 11 }}>Remove</button>
              <button onClick={() => addItem(conflictWarning)} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Keep anyway</button>
            </div>
          </div>
        )}
      </Card>

      {Object.entries(byCategory).map(([cat, catItems]) => (
        <Card key={cat} style={{ marginBottom: 16 }}>
          <SectionLabel><span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: colorFor(cat), display: "inline-block" }} />{cat}</span></SectionLabel>
          {catItems.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
              <button onClick={() => togglePurchased(item)} style={{ width: 20, height: 20, borderRadius: 10, border: `1px solid ${MUTED}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13 }}>{item.name}</span>
              {item.fromLowStock && <span style={{ fontSize: 10, color: RUST, fontFamily: "IBM Plex Mono" }}>low stock</span>}
              <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
            </div>
          ))}
        </Card>
      ))}
      {Object.keys(byCategory).length === 0 && <div style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>Your shopping list is empty.</div>}

      {purchasedRecently.length > 0 && (
        <Card style={{ opacity: 0.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <CheckCircle2 size={14} color={VERDI} />
            <SectionLabel>Recently purchased</SectionLabel>
          </div>
          {purchasedRecently.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12, color: MUTED, textDecoration: "line-through" }}>
              <button onClick={() => togglePurchased(item)} style={{ width: 16, height: 16, borderRadius: 10, border: `1px solid ${BRASS}`, background: BRASS, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Check size={11} color={INK} strokeWidth={3} />
              </button>
              <span style={{ flex: 1 }}>{item.name}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function FinanceTab({ spending, setSpending, accounts, setAccounts, holdings, setHoldings, research, setResearch, kitchen, setKitchen, debts, setDebts, debtPayments, setDebtPayments }) {
  const [sub, setSub] = useState("spending");
  const SUBS = [
    { id: "spending", label: "Spending", icon: ShoppingCart },
    { id: "accounts", label: "Accounts", icon: Landmark },
    { id: "debt", label: `Debt${debts.length ? ` (${debts.length})` : ""}`, icon: CreditCard },
    { id: "invest", label: "Invest", icon: TrendingUp },
    { id: "research", label: "Research", icon: BookOpen },
  ];
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {SUBS.map((s) => {
          const Icon = s.icon, active = sub === s.id;
          return <button key={s.id} onClick={() => setSub(s.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: active ? PANEL2 : "transparent", border: `1px solid ${active ? BRASS : RULE}`, color: active ? PAPER : MUTED, borderRadius: 16, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}><Icon size={12} /> {s.label}</button>;
        })}
      </div>
      {sub === "spending" && <SpendingSub spending={spending} setSpending={setSpending} kitchen={kitchen} setKitchen={setKitchen} />}
      {sub === "accounts" && <AccountsSub accounts={accounts} setAccounts={setAccounts} totalDebt={totalDebt} />}
      {sub === "debt" && <DebtSub debts={debts} setDebts={setDebts} debtPayments={debtPayments} setDebtPayments={setDebtPayments} />}
      {sub === "invest" && <InvestSub holdings={holdings} setHoldings={setHoldings} />}
      {sub === "research" && <ResearchSub research={research} setResearch={setResearch} />}
    </div>
  );
}

function SpendingSub({ spending, setSpending, kitchen, setKitchen }) {
  const [form, setForm] = useState({ merchant: "", category: SPENDING_CATEGORIES[0], amount: "" });
  const [candidates, setCandidates] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const addEntry = async () => {
    if (!form.merchant.trim() || !form.amount) return;
    const row = await db.insertRow("spending", { date: todayStr(), merchant: form.merchant.trim(), category: form.category, amount: Number(form.amount) || 0 });
    setSpending([row, ...spending]);
    setForm({ merchant: "", category: form.category, amount: "" });
  };
  const removeEntry = async (id) => { await db.deleteRow("spending", id); setSpending(spending.filter((s) => s.id !== id)); };
  const byCategory = useMemo(() => { const map = {}; spending.forEach((s) => { map[s.category] = (map[s.category] || 0) + s.amount; }); return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [spending]);
  const total = spending.reduce((s, e) => s + e.amount, 0);
  const todayTotal = spending.filter((s) => s.date === todayStr()).reduce((s, e) => s + e.amount, 0);

  const runScan = async () => {
    setScanning(true);
    setScanError("");
    try {
      const found = await gmail.scanForBills();
      setCandidates(found);
    } catch (e) {
      setScanError(gmail.hasValidToken() ? e.message : "Connect Gmail in Settings first.");
    }
    setScanning(false);
  };

  const confirmCandidate = async (c) => {
    const row = await db.insertRow("spending", { date: c.date, merchant: c.merchant, category: "Groceries", amount: c.amount });
    setSpending([row, ...spending]);
    setCandidates(candidates.filter((x) => x.id !== c.id));
  };
  const ignoreCandidate = (c) => setCandidates(candidates.filter((x) => x.id !== c.id));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <SectionLabel>Scan Gmail for bills</SectionLabel>
          <button onClick={runScan} disabled={scanning} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "4px 12px", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
            {scanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Scan
          </button>
        </div>
        {scanError && <div style={{ color: RUST, fontSize: 11 }}>{scanError}</div>}
        {!scanError && candidates.length === 0 && <div style={{ color: FAINT, fontSize: 11 }}>Finds recent receipts/invoices — you confirm each one before it's added.</div>}
        {candidates.map((c) => (
          <div key={c.id} style={{ background: PANEL2, borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Found a purchase from <strong>{c.merchant}</strong> for <strong>${c.amount.toFixed(2)}</strong> — add to Finance?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => confirmCandidate(c)} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Confirm</button>
              <button onClick={() => ignoreCandidate(c)} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 12 }}>Ignore</button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Log a purchase</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="Merchant / item" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>{SPENDING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <input placeholder="$ amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          <button onClick={addEntry} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Breakdown</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}><span style={{ color: MUTED }}>Spent today</span><LedgerNum value={`$${todayTotal.toFixed(2)}`} /></div>
        {byCategory.map(([cat, amt]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: MUTED, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorFor(cat), display: "inline-block" }} />
                {cat}
              </span>
              <span style={{ fontFamily: "IBM Plex Mono" }}>${amt.toFixed(2)}</span>
            </div>
            <div style={{ height: 4, background: RULE, borderRadius: 3 }}><div style={{ width: `${total ? (amt / total) * 100 : 0}%`, height: "100%", background: colorFor(cat), borderRadius: 3, transition: "width 0.3s ease" }} /></div>
          </div>
        ))}
        {byCategory.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No spending logged yet.</div>}
      </Card>
      <Card>
        <SectionLabel>History — {spending.length} entries</SectionLabel>
        {spending.slice(0, 30).map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
            <span style={{ color: MUTED, fontFamily: "IBM Plex Mono", fontSize: 11, width: 54 }}>{fmtDate(s.date)}</span>
            <span style={{ flex: 1 }}>{s.merchant}</span>
            <span style={{ color: colorFor(s.category), fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: colorFor(s.category), display: "inline-block" }} />
              {s.category}
            </span>
            <span style={{ fontFamily: "IBM Plex Mono", width: 64, textAlign: "right" }}>${s.amount.toFixed(2)}</span>
            <button onClick={() => removeEntry(s.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={12} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AccountsSub({ accounts, setAccounts, totalDebt }) {
  const [form, setForm] = useState({ name: "", type: "TFSA", balance: "" });
  const types = ["TFSA", "RRSP", "RPP", "FHSA", "Chequing", "Savings", "Other"];
  const addAccount = async () => {
    if (!form.name.trim() || !form.balance) return;
    const row = await db.insertRow("accounts", { name: form.name.trim(), type: form.type, balance: Number(form.balance) || 0, updated_date: todayStr() });
    setAccounts([...accounts, row]);
    setForm({ name: "", type: form.type, balance: "" });
  };
  const updateBalance = async (id, balance) => {
    const row = await db.updateRow("accounts", id, { balance: Number(balance) || 0, updated_date: todayStr() });
    setAccounts(accounts.map((a) => (a.id === id ? row : a)));
  };
  const removeAccount = async (id) => { await db.deleteRow("accounts", id); setAccounts(accounts.filter((a) => a.id !== id)); };
  const assetsTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const total = assetsTotal - (totalDebt || 0);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Net worth</SectionLabel>
        <div style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 600 }}><LedgerNum value={`$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} positive={total >= 0} /></div>
        <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
          ${assetsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          {totalDebt > 0 && <> minus <span style={{ color: RUST }}>${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })} debt</span></>}
        </div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add account</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="e.g. Wealthsimple TFSA" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <input placeholder="Balance" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} style={inputStyle} />
          <button onClick={addAccount} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>
      <Card>
        <SectionLabel>Accounts</SectionLabel>
        {accounts.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${RULE}` }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{a.name}</div><div style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: colorFor(a.type), display: "inline-block" }} /><span style={{ color: colorFor(a.type) }}>{a.type}</span> · updated {fmtDate(a.updated_date)}</div></div>
            <input type="number" value={a.balance} onChange={(e) => updateBalance(a.id, e.target.value)} style={{ ...inputStyle, width: 110, textAlign: "right", fontFamily: "IBM Plex Mono" }} />
            <button onClick={() => removeAccount(a.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
          </div>
        ))}
        {accounts.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No accounts yet.</div>}
      </Card>
    </div>
  );
}

function DebtSub({ debts, setDebts, debtPayments, setDebtPayments }) {
  const [form, setForm] = useState({ name: "", balance: "", apr: "", minPayment: "", dueDay: "" });
  const [payAmounts, setPayAmounts] = useState({});
  const [dueCandidates, setDueCandidates] = useState([]);
  const [scanningDue, setScanningDue] = useState(false);
  const [dueScanError, setDueScanError] = useState("");

  const scanDueDates = async () => {
    setScanningDue(true);
    setDueScanError("");
    try {
      const found = await gmail.scanForDueDates();
      setDueCandidates(found);
    } catch (e) {
      setDueScanError(gmail.hasValidToken() ? e.message : "Connect Gmail in Settings first.");
    }
    setScanningDue(false);
  };

  const confirmDueDate = async (c) => {
    const day = c.dueDate ? new Date(c.dueDate).getDate() : null;
    if (!day) return;
    const existing = debts.find((d) => d.name.toLowerCase().includes(c.issuer.toLowerCase()) || c.issuer.toLowerCase().includes(d.name.toLowerCase()));
    if (existing) {
      const row = await db.updateRow("debts", existing.id, { dueDay: day });
      setDebts(debts.map((d) => (d.id === existing.id ? row : d)));
    } else {
      const row = await db.insertRow("debts", { name: c.issuer, balance: 0, apr: 0, minPayment: 0, dueDay: day });
      setDebts([...debts, row]);
    }
    setDueCandidates(dueCandidates.filter((x) => x.id !== c.id));
  };
  const ignoreDueDate = (c) => setDueCandidates(dueCandidates.filter((x) => x.id !== c.id));

  const addDebt = async () => {
    if (!form.name.trim() || !form.balance) return;
    const row = await db.insertRow("debts", {
      name: form.name.trim(), balance: Number(form.balance) || 0, apr: Number(form.apr) || 0,
      minPayment: Number(form.minPayment) || 0, dueDay: Number(form.dueDay) || null,
    });
    setDebts([...debts, row]);
    setForm({ name: "", balance: "", apr: "", minPayment: "", dueDay: "" });
  };

  const removeDebt = async (id) => {
    await db.deleteRow("debts", id);
    setDebts(debts.filter((d) => d.id !== id));
  };

  const logPayment = async (debt) => {
    const amount = Number(payAmounts[debt.id]) || 0;
    if (amount <= 0) return;
    const payment = await db.insertRow("debt_payments", { debtId: debt.id, date: todayStr(), amount });
    setDebtPayments([payment, ...debtPayments]);
    const newBalance = Math.max(0, debt.balance - amount);
    const row = await db.updateRow("debts", debt.id, { balance: newBalance });
    setDebts(debts.map((d) => (d.id === debt.id ? row : d)));
    setPayAmounts({ ...payAmounts, [debt.id]: "" });
  };

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinPayments = debts.reduce((s, d) => s + d.minPayment, 0);
  const recentPayments = debtPayments.slice(0, 10);
  const debtName = (id) => debts.find((d) => d.id === id)?.name || "Unknown";

  const today = new Date().getDate();

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Total debt</SectionLabel>
        <div style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 600, color: totalDebt > 0 ? RUST : PAPER }}>${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        {totalMinPayments > 0 && <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>${totalMinPayments.toFixed(2)} in minimum payments due monthly</div>}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <SectionLabel>Scan Gmail for due dates</SectionLabel>
          <button onClick={scanDueDates} disabled={scanningDue} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "4px 12px", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
            {scanningDue ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Scan
          </button>
        </div>
        {dueScanError && <div style={{ color: RUST, fontSize: 11 }}>{dueScanError}</div>}
        {!dueScanError && dueCandidates.length === 0 && <div style={{ color: FAINT, fontSize: 11 }}>Looks for statement/payment-due emails — best-effort, always asks before changing anything.</div>}
        {dueCandidates.map((c) => (
          <div key={c.id} style={{ background: PANEL2, borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>From <strong>{c.issuer}</strong></div>
            {c.dueDate ? (
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Found a due date: <strong style={{ color: PAPER }}>{fmtDate(c.dueDate)}</strong> — set as this card's monthly due day?</div>
            ) : (
              <div style={{ fontSize: 12, color: FAINT, marginBottom: 8 }}>Couldn't confidently read a due date from this one — check it manually.</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {c.dueDate && <button onClick={() => confirmDueDate(c)} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Confirm</button>}
              <button onClick={() => ignoreDueDate(c)} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 12 }}>Ignore</button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add a card or loan</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 8, marginBottom: 8 }}>
          <input placeholder="Bank or card (e.g. Chase Sapphire, RBC Visa)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Balance owed" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <input placeholder="APR %" type="number" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} style={inputStyle} />
          <input placeholder="Min payment $" type="number" value={form.minPayment} onChange={(e) => setForm({ ...form, minPayment: e.target.value })} style={inputStyle} />
          <input placeholder="Due day (1-31)" type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} style={inputStyle} />
        </div>
        <button onClick={addDebt} style={{ width: "100%", background: BRASS, border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontWeight: 600, fontSize: 13, marginTop: 10 }}>Add</button>
      </Card>

      {debts.map((d) => {
        const overdue = d.dueDay && d.dueDay < today && d.balance > 0;
        return (
          <Card key={d.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{d.name}</div>
                <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>
                  {d.apr > 0 && `${d.apr}% APR`}{d.apr > 0 && d.minPayment > 0 && " · "}{d.minPayment > 0 && `$${d.minPayment} min`}{d.dueDay && ` · due day ${d.dueDay}`}
                </div>
              </div>
              <button onClick={() => removeDebt(d.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
            </div>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 20, fontWeight: 700, color: d.balance > 0 ? RUST : SUCCESS, marginBottom: overdue ? 6 : 12 }}>
              ${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            {overdue && <div style={{ color: RUST, fontSize: 11, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} /> Payment overdue</div>}
            {d.balance > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Payment amount" type="number" value={payAmounts[d.id] || ""} onChange={(e) => setPayAmounts({ ...payAmounts, [d.id]: e.target.value })} style={inputStyle} />
                <button onClick={() => logPayment(d)} style={{ background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "0 16px", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>Log payment</button>
              </div>
            )}
          </Card>
        );
      })}
      {debts.length === 0 && <EmptyState icon={CreditCard} title="No debt tracked" />}

      {recentPayments.length > 0 && (
        <Card>
          <SectionLabel>Recent payments</SectionLabel>
          {recentPayments.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
              <span style={{ color: MUTED, fontFamily: "IBM Plex Mono", fontSize: 11, width: 54 }}>{fmtDate(p.date)}</span>
              <span style={{ flex: 1 }}>{debtName(p.debtId)}</span>
              <span style={{ fontFamily: "IBM Plex Mono", color: SUCCESS }}>-${p.amount.toFixed(2)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function InvestSub({ holdings, setHoldings }) {
  const [form, setForm] = useState({ ticker: "", shares: "", cost: "", account: "" });
  const [prices, setPrices] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const refreshPrices = async () => {
    setRefreshing(true);
    const next = {};
    for (const h of holdings) { try { next[h.ticker] = await fetchQuote(h.ticker); } catch { next[h.ticker] = null; } }
    setPrices(next);
    setRefreshing(false);
  };
  useEffect(() => { if (holdings.length) refreshPrices(); }, [holdings.length]);

  const addHolding = async () => {
    if (!form.ticker.trim() || !form.shares) return;
    const row = await db.insertRow("holdings", { ticker: form.ticker.trim().toUpperCase(), shares: Number(form.shares) || 0, cost: Number(form.cost) || 0, account: form.account.trim() });
    setHoldings([...holdings, row]);
    setForm({ ticker: "", shares: "", cost: "", account: form.account });
  };
  const removeHolding = async (id) => { await db.deleteRow("holdings", id); setHoldings(holdings.filter((h) => h.id !== id)); };

  const totalValue = holdings.reduce((s, h) => s + (prices[h.ticker] || h.cost) * h.shares, 0);
  const totalCost = holdings.reduce((s, h) => s + h.cost * h.shares, 0);
  const gain = totalValue - totalCost;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <SectionLabel>Portfolio value</SectionLabel>
          <button onClick={refreshPrices} disabled={refreshing} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 12, color: MUTED, fontSize: 11, padding: "3px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={11} className={refreshing ? "animate-spin" : ""} /> refresh</button>
        </div>
        <div style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 600 }}><LedgerNum value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} /></div>
        <div style={{ fontSize: 12, marginTop: 4 }}><LedgerNum value={`${gain >= 0 ? "+" : ""}$${gain.toFixed(2)}`} positive={gain >= 0} /> <span style={{ color: MUTED }}>vs cost basis</span></div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add holding</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr auto", gap: 8 }}>
          <input placeholder="Ticker (XEQT.TO)" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} style={inputStyle} />
          <input placeholder="Shares" type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} style={inputStyle} />
          <input placeholder="Avg cost" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} style={inputStyle} />
          <input placeholder="Account (TFSA)" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} style={inputStyle} />
          <button onClick={addHolding} style={{ background: BRASS, border: "none", borderRadius: 10, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
        <div style={{ color: MUTED, fontSize: 11, marginTop: 8 }}>Tip: Canadian TSX tickers need ".TO" (e.g. XEQT.TO, VFV.TO).</div>
      </Card>
      <Card>
        <SectionLabel>Holdings</SectionLabel>
        {holdings.map((h) => {
          const price = prices[h.ticker], g = price ? (price - h.cost) * h.shares : null;
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
              <div style={{ flex: 1 }}><div>{h.ticker} <span style={{ color: MUTED, fontSize: 11 }}>· {h.account || "—"}</span></div><div style={{ fontSize: 11, color: MUTED }}>{h.shares} sh @ avg ${h.cost}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontFamily: "IBM Plex Mono" }}>{price ? `$${price.toFixed(2)}` : "—"}</div>{g !== null && <div style={{ fontSize: 11 }}><LedgerNum value={`${g >= 0 ? "+" : ""}$${g.toFixed(2)}`} positive={g >= 0} /></div>}</div>
              <button onClick={() => removeHolding(h.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={13} /></button>
            </div>
          );
        })}
        {holdings.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No holdings yet.</div>}
      </Card>
    </div>
  );
}

function ResearchSub({ research, setResearch }) {
  const [form, setForm] = useState({ ticker: "", note: "" });
  const addNote = async () => {
    if (!form.ticker.trim() || !form.note.trim()) return;
    const row = await db.insertRow("research_notes", { ticker: form.ticker.trim().toUpperCase(), note: form.note.trim(), date: todayStr() });
    setResearch([row, ...research]);
    setForm({ ticker: form.ticker, note: "" });
  };
  const removeNote = async (id) => { await db.deleteRow("research_notes", id); setResearch(research.filter((r) => r.id !== id)); };
  const byTicker = useMemo(() => { const map = {}; research.forEach((r) => { (map[r.ticker] = map[r.ticker] || []).push(r); }); return map; }, [research]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>New research note</SectionLabel>
        <input placeholder="Ticker (e.g. QQC.TO)" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Thesis, valuation notes, risks, catalysts…" rows={3} style={{ width: "100%", background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: 10, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />
        <button onClick={addNote} style={{ background: BRASS, border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save note</button>
      </Card>
      {Object.entries(byTicker).map(([ticker, notes]) => (
        <Card key={ticker} style={{ marginBottom: 16 }}>
          <SectionLabel>{ticker}</SectionLabel>
          {notes.map((n) => (
            <div key={n.id} style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: MUTED }}>{fmtDate(n.date)}</span>
                <button onClick={() => removeNote(n.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={12} /></button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.note}</div>
            </div>
          ))}
        </Card>
      ))}
      {research.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No research notes yet.</div>}
    </div>
  );
}

function AssistantTab({ chat, setChat, context, apiKey, executeAction }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [speakEnabled, setSpeakEnabled] = useState(getSetting("speakReplies", "") === "true");
  const recognitionRef = useRef(null);
  const voiceSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = (text) => {
    if (!speakEnabled || !ttsSupported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  };

  const toggleSpeak = () => {
    const next = !speakEnabled;
    setSpeakEnabled(next);
    setSetting("speakReplies", String(next));
    if (!next) window.speechSynthesis?.cancel();
  };

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || !apiKey) return;
    const userMsg = { role: "user", content: text };
    setChat((c) => [...c, userMsg]);
    await db.insertRow("chat_messages", userMsg);
    setInput("");
    setLoading(true);
    try {
      const result = await callAssistant([...chat, userMsg], context, apiKey);
      if (result.type === "tool_use") {
        setPendingAction({ ...result, description: describeAction(result.toolUse) });
      } else {
        const assistantMsg = { role: "assistant", content: result.text };
        setChat((c) => [...c, assistantMsg]);
        await db.insertRow("chat_messages", assistantMsg);
        speak(result.text);
      }
    } catch {
      setChat((c) => [...c, { role: "assistant", content: "Couldn't reach the assistant — check your API key in settings and your spend cap." }]);
    }
    setLoading(false);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setLoading(true);
    const resultText = await executeAction(pendingAction.toolUse);
    try {
      const reply = await continueAfterTool(pendingAction, resultText, apiKey);
      const assistantMsg = { role: "assistant", content: reply };
      setChat((c) => [...c, assistantMsg]);
      await db.insertRow("chat_messages", assistantMsg);
      speak(reply);
    } catch {
      const assistantMsg = { role: "assistant", content: resultText };
      setChat((c) => [...c, assistantMsg]);
      await db.insertRow("chat_messages", assistantMsg);
    }
    setPendingAction(null);
    setLoading(false);
  };

  const cancelAction = () => {
    setPendingAction(null);
    setChat((c) => [...c, { role: "assistant", content: "Okay, I won't do that." }]);
  };

  const toggleListening = () => {
    if (!voiceSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  };

  const suggestions = ["What should I eat?", "Add eggs to my shopping list", "How did I spend this month?", "Remind me to pay rent tomorrow", "What workout should I do?"];

  if (!apiKey) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <Sparkles size={22} color="#8B7FA6" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>AUREN AI</div>
        <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
          Add your Anthropic API key in <strong style={{ color: PAPER }}>settings</strong> (top right) to turn this on.
          It's free to create a key at console.anthropic.com — just set a small spend cap once you're there.
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ display: "flex", flexDirection: "column", height: 520, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${RULE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={15} color="#8B7FA6" />
          <div style={{ fontSize: 14, fontWeight: 600 }}>AUREN AI</div>
        </div>
        {ttsSupported && (
          <button onClick={toggleSpeak} title={speakEnabled ? "Replies spoken aloud" : "Enable spoken replies"} style={{ background: "transparent", border: "none", color: speakEnabled ? BRASS : MUTED, cursor: "pointer" }}>
            {speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {chat.length === 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ color: MUTED, fontSize: 13, textAlign: "center", marginBottom: 16 }}>Your personal command center.</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} style={{ background: CARD_ELEVATED, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 16, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: m.role === "user" ? BRASS : PANEL2, color: m.role === "user" ? INK : PAPER, border: m.role === "user" ? "none" : `1px solid ${RULE}` }}>{m.content}</div>
          </div>
        ))}
        {pendingAction && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "85%", background: PANEL2, border: `1px solid #8B7FA6`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{pendingAction.description}?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={confirmAction} style={{ flex: 1, background: BRASS, border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Confirm</button>
                <button onClick={cancelAction} style={{ flex: 1, background: "transparent", border: `1px solid ${RULE}`, color: MUTED, borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {loading && <Loader2 className="animate-spin" size={16} color={MUTED} />}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${RULE}` }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={listening ? "Listening…" : "Message AUREN…"} style={{ flex: 1, background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none" }} />
        {voiceSupported && (
          <button onClick={toggleListening} style={{ background: listening ? RUST : PANEL2, border: `1px solid ${RULE}`, borderRadius: 10, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Mic size={15} color={listening ? PAPER : MUTED} />
          </button>
        )}
        <button onClick={() => send()} disabled={loading} style={{ background: BRASS, border: "none", borderRadius: 10, padding: "0 14px", cursor: "pointer" }}><Send size={15} color={INK} /></button>
      </div>
    </Card>
  );
}
