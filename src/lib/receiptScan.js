// Reads a receipt photo using Claude's image understanding, via the same
// Anthropic API key already configured for the Assistant tab. No OCR
// service, no new signup — just a vision-capable model call.

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function scanReceipt(apiKey, base64, mediaType) {
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
      max_tokens: 1000,
      system: "You read grocery/retail receipts. Reply with ONLY a JSON object, no other text: " +
        '{"merchant": string, "date": "YYYY-MM-DD" or null, "total": number, ' +
        '"items": [{"name": string, "price": number, "category": one of "Produce","Dairy","Meat","Pantry","Frozen","Snacks","Spices","Other"}]}. ' +
        "If a field truly can't be read, use null for it rather than guessing.",
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "Extract the receipt data." },
        ],
      }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Anthropic API error");
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Couldn't read a receipt in that image.");
  return JSON.parse(match[0]);
}
