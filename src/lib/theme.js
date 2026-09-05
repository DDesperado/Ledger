export const INK = "#12141C";
export const PANEL = "#1B1F2C";
export const PANEL2 = "#20253440";
export const RULE = "rgba(237,230,214,0.09)";
export const PAPER = "#EDE6D6";
export const MUTED = "#8B90A3";
export const BRASS = "#C9A227";
export const VERDI = "#4FA69C";
export const RUST = "#C1543C";

// A curated palette that stays in the ledger's tonal family — used to
// color-code categories, macros, moods, and account types consistently.
export const PALETTE = ["#C9A227", "#4FA69C", "#C1543C", "#6C93B8", "#9B6B9E", "#8A9A5B", "#D98255", "#7C8CA6"];

export function colorFor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export const inputStyle = {
  background: INK, border: `1px solid ${RULE}`, color: PAPER, borderRadius: 4, padding: "8px 10px",
  fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "Inter",
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
