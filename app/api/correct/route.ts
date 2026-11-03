import { chat } from "@/lib/groq";
import { hdr } from "@/lib/keys";

export const runtime = "nodejs";

const SYSTEM = `You are a patient German teacher for a native English speaker. You receive one German utterance produced by speech-to-text from the learner's voice, plus their level (A1-C1).
Because it is a transcript, IGNORE punctuation and capitalisation of sentence starts. Judge grammar (cases, gender, verb conjugation, tense, word order), word choice, and naturalness.

Teach on TWO tracks and give both:
1. Level track: a correct sentence the learner can realistically produce at THEIR level (vocabulary and grammar they should know at that level).
2. Native track: what a native speaker would most commonly say in that situation, level-independent. Prefer common everyday expressions, set phrases, collocations and idioms over literal/textbook German. If the learner translated word-for-word from English (e.g. "Ich bin kalt" instead of "Mir ist kalt", "Ich habe 25 Jahre" style errors, "Ich mache einen Fehler" vs "Ich habe einen Fehler gemacht"), name that explicitly. Always choose the natural idiom when one exists (e.g. "Wie geht's?", "Kein Problem", "Na klar", "Das klingt gut", "Mir ist kalt", "Ich hätte gern ...", "Stimmt", "Gern geschehen").

Respond with JSON only, exactly this shape:
{
  "isCorrect": boolean,                       // true if what they said is already correct German (even if not the most natural)
  "corrected": "their sentence with the minimal fixes needed (same as input if already correct)",
  "atYourLevel": "best sentence for their level; may equal corrected",
  "natural": "what a native would typically say here; may equal corrected",
  "explanation": "short friendly explanation IN ENGLISH: what was wrong and why, and why the native version differs (mention literal-translation traps)",
  "mistakes": [{ "original": "wrong part", "fix": "right part", "why": "one-line English reason" }],
  "phrases": [{ "german": "common phrase/word related to this situation", "english": "meaning", "note": "when/how natives use it (short)" }]
}
"phrases" should hold 1-3 genuinely common phrases or words that a native would use in this situation (any level). Keep "mistakes" empty if there are none. Never write the explanation in German.`;

type Phrase = { german: string; english: string; note: string };

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

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
    const d = JSON.parse(raw);
    const corrected = str(d.corrected, text);
    return Response.json({
      isCorrect: Boolean(d.isCorrect),
      corrected,
      atYourLevel: str(d.atYourLevel, corrected),
      natural: str(d.natural, corrected),
      explanation: str(d.explanation),
      mistakes: Array.isArray(d.mistakes) ? d.mistakes : [],
      phrases: (Array.isArray(d.phrases) ? d.phrases : []).filter((p: Phrase) => p?.german),
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
