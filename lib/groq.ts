const BASE = "https://api.groq.com/openai/v1";

export const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "openai/gpt-oss-120b";
export const STT_MODEL = process.env.GROQ_STT_MODEL ?? "whisper-large-v3-turbo";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function apiKey(override?: string) {
  const key = override || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("No Groq API key. Add one in Settings (gear icon) or set GROQ_API_KEY in .env.local. It's free: console.groq.com/keys");
  }
  return key;
}

async function fail(res: Response): Promise<never> {
  let detail = "";
  try {
    detail = (await res.json())?.error?.message ?? "";
  } catch {}
  if (res.status === 401) throw new Error("Groq rejected the API key. Check it in Settings.");
  if (res.status === 429) throw new Error("Groq free-tier rate limit reached. Wait a minute and try again.");
  throw new Error(`Groq error ${res.status}${detail ? `: ${detail}` : ""}`);
}

export async function chat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number; key?: string } = {},
): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey(opts.key)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      // gpt-oss is a reasoning model; keep thinking short so voice replies stay fast
      ...(CHAT_MODEL.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function transcribe(audio: Blob, filename: string, key?: string): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", STT_MODEL);
  form.append("language", "de");
  form.append("temperature", "0");
  form.append("response_format", "json");
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey(key)}` },
    body: form,
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  return (data.text ?? "").trim();
}
