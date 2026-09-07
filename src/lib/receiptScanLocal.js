// Default path (no API key): Tesseract.js reads the raw text off a receipt
// photo entirely in-browser (free, no signup), then the on-device AI turns
// that text into structured merchant/total/items. Less accurate than
// Claude's vision on messy or crumpled receipts, but genuinely free.
//
// If the user has added their own Anthropic key, scanReceipt() (vision,
// higher accuracy) is used instead — that choice is made by the caller.

import { chatLocal } from "./localAI";

export async function ocrReceiptText(file, onProgress) {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (onProgress && m.status === "recognizing text") onProgress(m.progress);
    },
  });
  return data.text;
}

const EXTRACT_SYSTEM = "You read raw OCR text from a grocery/retail receipt. Reply with ONLY a JSON object, no other text: " +
  '{"merchant": string, "date": "YYYY-MM-DD" or null, "total": number, ' +
  '"items": [{"name": string, "price": number, "category": one of "Produce","Dairy","Meat","Pantry","Frozen","Snacks","Spices","Other"}]}. ' +
  "OCR text is often messy with misreads and line-break issues — do your best. If a field truly can't be determined, use null.";

export async function scanReceiptLocal(file, onProgress) {
  const text = await ocrReceiptText(file, (p) => onProgress?.(p * 0.5, "Reading receipt text…"));
  const replyText = await chatLocal(
    [{ role: "user", content: `Raw receipt text:\n\n${text}` }],
    EXTRACT_SYSTEM,
    (p, statusText) => onProgress?.(0.5 + p * 0.5, statusText || "Loading on-device model…")
  );
  const match = replyText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Couldn't make sense of that receipt — try a clearer photo, or add an Anthropic API key in Settings for better accuracy.");
  return JSON.parse(match[0]);
}
