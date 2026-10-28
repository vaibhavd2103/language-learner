import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

const EDGE_VOICES = new Set([
  "de-DE-SeraphinaMultilingualNeural",
  "de-DE-FlorianMultilingualNeural",
  "de-DE-KatjaNeural",
  "de-DE-ConradNeural",
]);

type Provider = "elevenlabs" | "google" | "edge";

function provider(): Provider {
  const forced = process.env.TTS_PROVIDER as Provider | undefined;
  if (forced) return forced;
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.GOOGLE_TTS_API_KEY) return "google";
  return "edge";
}

async function elevenlabs(text: string, rate: number): Promise<Buffer> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB"; // "Adam", a default voice available on the free plan
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5",
      language_code: "de",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: Math.min(Math.max(rate, 0.7), 1.2) },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function google(text: string, rate: number): Promise<Buffer> {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "de-DE", name: process.env.GOOGLE_TTS_VOICE ?? "de-DE-Chirp3-HD-Aoede" },
      audioConfig: { audioEncoding: "MP3", speakingRate: rate },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from((await res.json()).audioContent, "base64");
}

async function edge(text: string, rate: number, voice?: string): Promise<Buffer> {
  const pct = Math.round((Math.min(Math.max(rate, 0.5), 1.5) - 1) * 100);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    EDGE_VOICES.has(voice ?? "") ? voice! : "de-DE-SeraphinaMultilingualNeural",
    OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
  );
  const { audioStream } = tts.toStream(text, { rate: `${pct >= 0 ? "+" : ""}${pct}%` });
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (c: Buffer) => chunks.push(c));
    audioStream.on("error", reject);
    audioStream.on("close", resolve);
  });
  return Buffer.concat(chunks);
}

export async function GET() {
  return Response.json({ provider: provider() });
}

export async function POST(req: Request) {
  try {
    const { text, rate = 1, voice } = await req.json();
    if (!text || typeof text !== "string" || text.length > 1000) {
      return Response.json({ error: "Invalid text." }, { status: 400 });
    }
    const r = Number(rate) || 1;
    const p = provider();
    const audio = p === "elevenlabs" ? await elevenlabs(text, r) : p === "google" ? await google(text, r) : await edge(text, r, voice);
    if (audio.length === 0) throw new Error("TTS returned no audio.");
    return new Response(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
    });
  } catch (e) {
    console.error("[tts]", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
