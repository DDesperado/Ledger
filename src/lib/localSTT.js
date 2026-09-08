// Records audio and transcribes it entirely on-device using a small Whisper
// model via transformers.js. Unlike the browser's built-in
// SpeechRecognition (which sends audio to Google's servers and can fail
// with network errors), this never leaves the device once the model is
// cached.

let transcriberPromise = null;

function getTranscriber(onProgress) {
  if (transcriberPromise) return transcriberPromise;
  transcriberPromise = import("@huggingface/transformers").then(async ({ pipeline }) => {
    return pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
      progress_callback: (data) => {
        if (onProgress && data.status === "progress") onProgress(data.progress / 100);
      },
    });
  });
  return transcriberPromise;
}

export function isMicSupported() {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export async function recordAndTranscribe(onProgress, onStop) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        const channelData = decoded.getChannelData(0);
        const transcriber = await getTranscriber(onProgress);
        const result = await transcriber(channelData);
        resolve((result.text || "").trim());
      } catch (e) {
        reject(e);
      }
    };
  });

  recorder.start();
  onStop(() => recorder.stop());
  return stopped;
}
