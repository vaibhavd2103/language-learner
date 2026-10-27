const BASE = "https://api.groq.com/openai/v1";

export const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile";
export const STT_MODEL = process.env.GROQ_STT_MODEL ?? "whisper-large-v3-turbo";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function apiKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set. Copy .env.example to .env.local and add your free key.");
  }
  return key;
}

async function fail(res: Response): Promise<never> {
  let detail = "";
  try {
    detail = (await res.json())?.error?.message ?? "";
  } catch {}
  throw new Error(`Groq error ${res.status}${detail ? `: ${detail}` : ""}`);
}

export async function chat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", STT_MODEL);
  form.append("language", "de");
  form.append("temperature", "0");
  form.append("response_format", "json");
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  return (data.text ?? "").trim();
}
