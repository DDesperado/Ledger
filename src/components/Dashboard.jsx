import { useEffect, useMemo, useState } from "react";
import {
  Check, Plus, Trash2, Send, Dumbbell, UtensilsCrossed, NotebookPen,
  Sparkles, ListChecks, Loader2, Wallet, ShoppingCart, Landmark, TrendingUp, BookOpen, RefreshCw, Settings, Download, Upload,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as db from "../lib/store";
import { getSetting, setSetting, exportAll, importAll } from "../lib/store";
import { INK, PANEL, PANEL2, RULE, PAPER, MUTED, BRASS, VERDI, RUST, inputStyle, uid, todayStr, fmtDate, fetchQuote, colorFor } from "../lib/theme";

const DEFAULT_ITEMS = [
  { category: "Morning", label: "Clear inbox & plan the day" },
  { category: "Morning", label: "Review calendar & priorities" },
  { category: "Deep Work", label: "Study / coursework block" },
  { category: "Movement", label: "Workout" },
  { category: "Reflect", label: "Read 15–20 minutes" },
  { category: "Wind Down", label: "Screens off & journal" },
];

const SPENDING_CATEGORIES = ["Groceries", "Rent", "Transport", "Dining", "Subscriptions", "School", "Fun", "Other"];

function Gauge({ percent }) {
  const pct = Math.max(0, Math.min(100, percent));
  const angle = (pct / 100) * 180 - 90;
  const r = 78, cx = 90, cy = 90;
  const arc = (startDeg, endDeg, color, width = 10) => {
    const s = (Math.PI / 180) * startDeg, e = (Math.PI / 180) * endDeg;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />;
  };
  return (
    <svg viewBox="0 0 180 110" width="180" height="110">
      {arc(180, 360, RULE, 10)}
      {arc(180, 180 + (pct / 100) * 180, BRASS, 10)}
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        <line x1={cx} y1={cy} x2={cx - 62} y2={cy} stroke={PAPER} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r="5" fill={BRASS} stroke={INK} strokeWidth="2" />
      <text x={cx} y={cy + 30} textAnchor="middle" fill={PAPER} fontFamily="IBM Plex Mono" fontSize="22" fontWeight="600">{Math.round(pct)}%</text>
    </svg>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: PANEL, border: `1px solid ${RULE}`, borderRadius: 6, padding: 20,
      backgroundImage: `repeating-linear-gradient(${PANEL}, ${PANEL} 27px, ${RULE} 28px)`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.25), 0 8px 24px -12px rgba(0,0,0,0.4)",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

function LedgerNum({ value, positive }) {
  return <span style={{ fontFamily: "IBM Plex Mono", fontVariantNumeric: "tabular-nums", color: positive === undefined ? PAPER : positive ? VERDI : RUST }}>{value}</span>;
}

async function callAssistant(messages, context, apiKey) {
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

  const system = `You are the assistant embedded in ${name}'s personal "Ledger" app — a calm, direct daily-accounting coach covering habits, fitness, nutrition, and personal finance. Keep replies short (2-5 sentences) unless asked for more. Today's snapshot: ${doneToday}/${totalItems} checklist items done, ${cals} calories logged, $${spentToday.toFixed(2)} spent today, last workout: ${lastWorkout ? `${lastWorkout.exercise} ${lastWorkout.weight}lb on ${lastWorkout.date}` : "none logged"}, last reflection mood: ${lastReflection ? lastReflection.mood : "none"}, net worth: $${netWorth.toFixed(2)}, holdings: ${holdingsSummary}. Use this context naturally, don't recite it as a report. You are not a licensed financial advisor — give factual, educational perspective rather than confident buy/sell recommendations.`;

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
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Anthropic API error");
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "…";
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
  const [workouts, setWorkouts] = useState([]);
  const [targets, setTargets] = useState({ calories: 2200, protein: 150, carbs: 220, fat: 70 });
  const [meals, setMeals] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [spending, setSpending] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [research, setResearch] = useState([]);
  const [chat, setChat] = useState([]);

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
      setWorkouts(await db.fetchTable("workouts"));
      const t = await db.fetchNutritionTargets();
      if (t) setTargets(t);
      setMeals(await db.fetchTable("nutrition_entries"));
      setReflections(await db.fetchTable("reflections"));
      setSpending(await db.fetchTable("spending"));
      setAccounts(await db.fetchTable("accounts"));
      setHoldings(await db.fetchTable("holdings"));
      setResearch(await db.fetchTable("research_notes"));
      setChat(await db.fetchTable("chat_messages"));
      setLoading(false);
    })();
  }, [displayName]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const percent = items.length ? (doneToday.length / items.length) * 100 : 0;
  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);

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

  const saveApiKey = (key) => {
    setApiKey(key);
    setSetting("apiKey", key);
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
        alert("That file doesn't look like a valid Ledger backup.");
      }
    };
    reader.readAsText(file);
  };

  if (!displayName) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter" }}>
        <div style={{ width: 320, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces", fontWeight: 700, fontSize: 32, color: PAPER, marginBottom: 6 }}>Ledger</div>
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>a daily accounting of you</div>
          <input
            autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && nameInput.trim()) { setSetting("displayName", nameInput.trim()); setDisplayName(nameInput.trim()); } }}
            placeholder="Your name"
            style={{ width: "100%", background: PANEL, border: `1px solid ${RULE}`, borderRadius: 4, padding: "12px 14px", color: PAPER, fontFamily: "IBM Plex Mono", fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
          />
          <button
            onClick={() => { if (nameInput.trim()) { setSetting("displayName", nameInput.trim()); setDisplayName(nameInput.trim()); } }}
            style={{ width: "100%", background: BRASS, color: INK, border: "none", borderRadius: 4, padding: "12px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Open my ledger
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

  const TABS = [
    { id: "today", label: "Today", icon: ListChecks },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition", icon: UtensilsCrossed },
    { id: "reflect", label: "Reflect", icon: NotebookPen },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "assistant", label: "Assistant", icon: Sparkles },
  ];

  return (
    <div style={{ minHeight: "100vh", background: INK, fontFamily: "Inter", color: PAPER }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: "0.14em", color: BRASS, marginBottom: 8 }}>{dateLabel.toUpperCase()}</div>
            <div style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 30, lineHeight: 1.15 }}>
              {greeting}, <span style={{ fontStyle: "italic", fontWeight: 500 }}>{displayName}</span>.
            </div>
          </div>
          <button onClick={() => setShowSettings((v) => !v)} style={{ background: "transparent", border: `1px solid ${RULE}`, borderRadius: 20, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, color: MUTED, cursor: "pointer", fontSize: 12 }}>
            <Settings size={13} /> settings
          </button>
        </div>

        {showSettings && (
          <Card style={{ marginBottom: 20 }}>
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
              <button onClick={downloadBackup} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "8px", cursor: "pointer", fontSize: 12 }}>
                <Download size={13} /> Download backup
              </button>
              <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: PANEL2, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "8px", cursor: "pointer", fontSize: 12 }}>
                <Upload size={13} /> Restore backup
                <input type="file" accept="application/json" onChange={uploadBackup} style={{ display: "none" }} />
              </label>
            </div>
          </Card>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, borderBottom: `1px solid ${RULE}`, marginBottom: 24 }}>
          {TABS.map((t) => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
                borderBottom: active ? `2px solid ${BRASS}` : "2px solid transparent",
                color: active ? PAPER : MUTED, padding: "10px 12px", cursor: "pointer", fontWeight: 500, fontSize: 13, whiteSpace: "nowrap",
                transition: "color 0.15s ease, border-color 0.15s ease",
              }}><Icon size={14} /> {t.label}</button>
            );
          })}
        </div>

        {tab === "today" && (
          <TodayTab items={items} categories={categories} doneToday={doneToday} percent={percent} toggleItem={toggleItem} addItem={addItem} removeItem={removeItem} targets={targets} meals={meals} />
        )}
        {tab === "workout" && <WorkoutTab workouts={workouts} setWorkouts={setWorkouts} />}
        {tab === "nutrition" && <NutritionTab targets={targets} setTargets={setTargets} meals={meals} setMeals={setMeals} />}
        {tab === "reflect" && <ReflectTab reflections={reflections} setReflections={setReflections} />}
        {tab === "finance" && (
          <FinanceTab spending={spending} setSpending={setSpending} accounts={accounts} setAccounts={setAccounts} holdings={holdings} setHoldings={setHoldings} research={research} setResearch={setResearch} />
        )}
        {tab === "assistant" && (
          <AssistantTab chat={chat} setChat={setChat} context={{ items, doneToday, workouts, meals, targets, reflections, spending, accounts, holdings, displayName }} apiKey={apiKey} />
        )}
      </div>
    </div>
  );
}

function TodayTab({ items, categories, doneToday, percent, toggleItem, addItem, removeItem, targets, meals }) {
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState(categories[0] || "General");

  const todayProtein = meals.filter((m) => m.date === todayStr()).reduce((s, m) => s + m.protein, 0);
  const proteinPct = targets.protein ? Math.min(100, (todayProtein / targets.protein) * 100) : 0;

  return (
    <div>
      <Card style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
        <Gauge percent={percent} />
        <div>
          <SectionLabel>Today's completion</SectionLabel>
          <div style={{ fontFamily: "Fraunces", fontSize: 20, fontWeight: 600 }}>
            <LedgerNum value={doneToday.length} /> <span style={{ color: MUTED, fontWeight: 400 }}>of</span> <LedgerNum value={items.length} /> entries closed
          </div>
        </div>
      </Card>

      {targets.protein > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <SectionLabel>Protein today</SectionLabel>
            <span><LedgerNum value={todayProtein} positive={todayProtein <= targets.protein} /> <span style={{ color: MUTED }}>/ {targets.protein}g</span></span>
          </div>
          <div style={{ height: 5, background: RULE, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${proteinPct}%`, height: "100%", background: BRASS }} />
          </div>
        </Card>
      )}

      {categories.map((cat) => (
        <Card key={cat} style={{ marginBottom: 16 }}>
          <SectionLabel>{cat}</SectionLabel>
          {items.filter((i) => i.category === cat).map((item) => {
            const done = doneToday.includes(item.id);
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
                <button onClick={() => toggleItem(item.id)} style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${done ? BRASS : MUTED}`, background: done ? BRASS : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s ease" }}>
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
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "8px 10px", fontSize: 13 }}>
            {[...categories, "General"].filter((v, i, a) => a.indexOf(v) === i).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addItem(newCat, newLabel); setNewLabel(""); } }} placeholder="e.g. Stretch for 10 minutes" style={{ flex: 1, background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "8px 10px", fontSize: 13, outline: "none" }} />
          <button onClick={() => { addItem(newCat, newLabel); setNewLabel(""); }} style={{ background: BRASS, border: "none", borderRadius: 4, padding: "0 12px", cursor: "pointer" }}><Plus size={16} color={INK} /></button>
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
          <input placeholder="Exercise" value={form.exercise} onChange={(e) => setForm({ ...form, exercise: e.target.value })} style={inputStyle} />
          <input placeholder="Sets" type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} style={inputStyle} />
          <input placeholder="Reps" type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} style={inputStyle} />
          <input placeholder="Weight" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={inputStyle} />
          <button onClick={addWorkout} style={{ background: BRASS, border: "none", borderRadius: 4, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
        </div>
      </Card>
      {exercises.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>Progression</SectionLabel>
            <select value={chartExercise} onChange={(e) => setChartExercise(e.target.value)} style={{ background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "4px 8px", fontSize: 12 }}>
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
            <span style={{ color: MUTED, fontFamily: "IBM Plex Mono", fontSize: 11, width: 54 }}>{fmtDate(w.date)}</span>
            <span style={{ flex: 1 }}>{w.exercise}</span>
            <span style={{ fontFamily: "IBM Plex Mono", color: MUTED }}>{w.sets}×{w.reps}</span>
            <span style={{ fontFamily: "IBM Plex Mono", width: 60, textAlign: "right" }}>{w.weight}lb</span>
            <button onClick={() => removeWorkout(w.id)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}><Trash2 size={12} /></button>
          </div>
        ))}
        {workouts.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No lifts logged yet.</div>}
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
            <button onClick={saveTargets} style={{ background: BRASS, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Save</button>
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
          <button onClick={addEntry} style={{ background: BRASS, border: "none", borderRadius: 4, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
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
        {todayMeals.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>Nothing logged today.</div>}
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
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened today? What's on your mind?" rows={4} style={{ width: "100%", background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {moods.map((m) => <button key={m} onClick={() => setMood(m)} style={{ background: mood === m ? colorFor(m) : "transparent", color: mood === m ? INK : MUTED, border: `1px solid ${mood === m ? colorFor(m) : RULE}`, borderRadius: 12, padding: "4px 10px", fontSize: 11, cursor: "pointer", transition: "all 0.15s ease" }}>{m}</button>)}
          </div>
          <button onClick={addEntry} style={{ background: BRASS, border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save</button>
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
      {reflections.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No entries yet.</div>}
    </div>
  );
}

function FinanceTab({ spending, setSpending, accounts, setAccounts, holdings, setHoldings, research, setResearch }) {
  const [sub, setSub] = useState("spending");
  const SUBS = [{ id: "spending", label: "Spending", icon: ShoppingCart }, { id: "accounts", label: "Accounts", icon: Landmark }, { id: "invest", label: "Invest", icon: TrendingUp }, { id: "research", label: "Research", icon: BookOpen }];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {SUBS.map((s) => {
          const Icon = s.icon, active = sub === s.id;
          return <button key={s.id} onClick={() => setSub(s.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: active ? PANEL2 : "transparent", border: `1px solid ${active ? BRASS : RULE}`, color: active ? PAPER : MUTED, borderRadius: 16, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}><Icon size={12} /> {s.label}</button>;
        })}
      </div>
      {sub === "spending" && <SpendingSub spending={spending} setSpending={setSpending} />}
      {sub === "accounts" && <AccountsSub accounts={accounts} setAccounts={setAccounts} />}
      {sub === "invest" && <InvestSub holdings={holdings} setHoldings={setHoldings} />}
      {sub === "research" && <ResearchSub research={research} setResearch={setResearch} />}
    </div>
  );
}

function SpendingSub({ spending, setSpending }) {
  const [form, setForm] = useState({ merchant: "", category: SPENDING_CATEGORIES[0], amount: "" });
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

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Log a purchase</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="Merchant / item" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>{SPENDING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <input placeholder="$ amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          <button onClick={addEntry} style={{ background: BRASS, border: "none", borderRadius: 4, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
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

function AccountsSub({ accounts, setAccounts }) {
  const [form, setForm] = useState({ name: "", type: "TFSA", balance: "" });
  const types = ["TFSA", "RRSP", "RPP", "FHSA", "Chequing", "Savings", "Credit", "Other"];
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
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Net worth</SectionLabel>
        <div style={{ fontFamily: "Fraunces", fontSize: 30, fontWeight: 600 }}><LedgerNum value={`$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} positive={total >= 0} /></div>
        <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>across {accounts.length} account{accounts.length !== 1 ? "s" : ""}</div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add account</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="e.g. Wealthsimple TFSA" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <input placeholder="Balance" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} style={inputStyle} />
          <button onClick={addAccount} style={{ background: BRASS, border: "none", borderRadius: 4, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
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
        <div style={{ fontFamily: "Fraunces", fontSize: 30, fontWeight: 600 }}><LedgerNum value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} /></div>
        <div style={{ fontSize: 12, marginTop: 4 }}><LedgerNum value={`${gain >= 0 ? "+" : ""}$${gain.toFixed(2)}`} positive={gain >= 0} /> <span style={{ color: MUTED }}>vs cost basis</span></div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Add holding</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr auto", gap: 8 }}>
          <input placeholder="Ticker (XEQT.TO)" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} style={inputStyle} />
          <input placeholder="Shares" type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} style={inputStyle} />
          <input placeholder="Avg cost" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} style={inputStyle} />
          <input placeholder="Account (TFSA)" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} style={inputStyle} />
          <button onClick={addHolding} style={{ background: BRASS, border: "none", borderRadius: 4, cursor: "pointer" }}><Plus size={16} color={INK} /></button>
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
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Thesis, valuation notes, risks, catalysts…" rows={3} style={{ width: "100%", background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: 10, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />
        <button onClick={addNote} style={{ background: BRASS, border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save note</button>
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

function AssistantTab({ chat, setChat, context, apiKey }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading || !apiKey) return;
    const userMsg = { role: "user", content: input.trim() };
    setChat((c) => [...c, userMsg]);
    await db.insertRow("chat_messages", userMsg);
    setInput("");
    setLoading(true);
    try {
      const reply = await callAssistant([...chat, userMsg], context, apiKey);
      const assistantMsg = { role: "assistant", content: reply };
      setChat((c) => [...c, assistantMsg]);
      await db.insertRow("chat_messages", assistantMsg);
    } catch {
      setChat((c) => [...c, { role: "assistant", content: "Couldn't reach the assistant — check your API key in settings and your spend cap." }]);
    }
    setLoading(false);
  };

  if (!apiKey) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
          Add your Anthropic API key in <strong style={{ color: PAPER }}>settings</strong> (top right) to turn on the assistant.
          It's free to create a key at console.anthropic.com — just set a small spend cap once you're there.
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ display: "flex", flexDirection: "column", height: 480, padding: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {chat.length === 0 && <div style={{ color: MUTED, fontSize: 13, textAlign: "center", marginTop: 40 }}>Ask about today's balance, get a nudge, or talk through your day.</div>}
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 10, fontSize: 13, lineHeight: 1.5, background: m.role === "user" ? BRASS : PANEL2, color: m.role === "user" ? INK : PAPER, border: m.role === "user" ? "none" : `1px solid ${RULE}` }}>{m.content}</div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin" size={16} color={MUTED} />}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${RULE}` }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message your ledger…" style={{ flex: 1, background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "10px 12px", fontSize: 13, outline: "none" }} />
        <button onClick={send} disabled={loading} style={{ background: BRASS, border: "none", borderRadius: 4, padding: "0 14px", cursor: "pointer" }}><Send size={15} color={INK} /></button>
      </div>
    </Card>
  );
}
