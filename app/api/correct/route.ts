import { chat } from "@/lib/groq";
import { hdr } from "@/lib/keys";

export const runtime = "nodejs";

const SYSTEM = `You are a patient German teacher for a native English speaker.
You receive one German utterance that was produced by speech-to-text from the learner's voice.
Because it is a transcript, IGNORE punctuation and capitalisation of sentence starts; focus on grammar (cases, gender, verb conjugation, tense, word order), word choice, and how natural it sounds.
Respond with JSON only, exactly in this shape:
{
  "isCorrect": boolean,
  "corrected": "the improved German sentence (identical to the input if already fine)",
  "explanation": "short, friendly explanation IN ENGLISH of what to improve and why; if already correct, say so and optionally suggest a more natural phrasing",
  "mistakes": [{ "original": "wrong part", "fix": "right part", "why": "one-line English reason" }]
}
Keep "mistakes" empty if there are none. Never write the explanation in German.`;

export async function POST(req: Request) {
  try {
    const { text, level } = await req.json();
    if (!text || typeof text !== "string") {
      return Response.json({ error: "No text to correct." }, { status: 400 });
    }
    const raw = await chat(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Learner level: ${level ?? "A2"}\nUtterance: ${text}` },
      ],
      { json: true, temperature: 0.2, key: hdr(req, "x-groq-key") },
    );
    return Response.json(JSON.parse(raw));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
