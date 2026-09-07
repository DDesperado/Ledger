// Runs a small language model entirely on the user's device via WebGPU.
// No API key, no server, no signup, no per-message cost to anyone —
// but it needs a WebGPU-capable browser and downloads the model on first
// use (cached after that). Quality is noticeably below Claude, and it
// can't reliably drive the "take actions" tool-calling feature — that
// stays on the optional cloud/API-key path.

let engine = null;
let loadingPromise = null;

const MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

export function isLocalAISupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

export function getEngine(onProgress) {
  if (engine) return Promise.resolve(engine);
  if (loadingPromise) return loadingPromise;

  loadingPromise = import("@mlc-ai/web-llm").then(async (webllm) => {
    const newEngine = await webllm.CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        if (onProgress) onProgress(report.progress, report.text);
      },
    });
    engine = newEngine;
    return engine;
  });
  return loadingPromise;
}

export async function chatLocal(messages, system, onProgress) {
  const eng = await getEngine(onProgress);
  const reply = await eng.chat.completions.create({
    messages: [{ role: "system", content: system }, ...messages],
    temperature: 0.7,
    max_tokens: 400,
  });
  return reply.choices[0]?.message?.content || "…";
}
