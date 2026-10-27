import { chat, type ChatMessage } from "@/lib/groq";

export const runtime = "nodejs";

const LEVELS: Record<string, string> = {
  A1: "A1 (absolute beginner): very short sentences, present tense, the most common ~500 words.",
  A2: "A2 (elementary): short sentences, simple Perfekt, everyday vocabulary.",
  B1: "B1 (intermediate): natural but clear German, some subordinate clauses, common idioms.",
  B2: "B2 (upper intermediate): fluent natural German, varied grammar, abstract topics.",
  C1: "C1 (advanced): rich, idiomatic German at native-like pace.",
};

function systemPrompt(level: string, topic: string) {
  return `You are a friendly German conversation partner helping an English speaker practise speaking and listening.
Learner level: ${LEVELS[level] ?? LEVELS.A2}
${topic ? `Conversation topic: ${topic}.` : "Pick natural everyday topics."}
Rules:
- Reply ONLY in German, in 1-3 short sentences, matching the learner's level.
- Keep the conversation going: usually end with one simple question.
- Do NOT correct the learner's mistakes and do not comment on their grammar; just respond naturally to what they meant. Corrections happen only when they ask for them in the app.
- If the learner writes English, answer in simple German and gently invite them to try in German.
- No emojis, no markdown (your reply is read aloud).`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (typeof body.translate === "string") {
      const english = await chat(
        [
          { role: "system", content: "Translate the German text into natural English. Output only the translation." },
          { role: "user", content: body.translate },
        ],
        { temperature: 0 },
      );
      return Response.json({ text: english });
    }

    const history: ChatMessage[] = (body.messages ?? [])
      .slice(-14)
      .map((m: ChatMessage) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) }));
    if (history.length === 0) {
      history.push({ role: "user", content: "Hallo! Lass uns anfangen." });
    }
    const reply = await chat([{ role: "system", content: systemPrompt(body.level, body.topic ?? "") }, ...history]);
    return Response.json({ text: reply });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
