import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

import { EDGE_VOICE_OPTIONS as EDGE_VOICES } from "./voices";

export type TtsOptions = {
  mode: "auto" | "free";
  edgeVoice?: string;
  elevenKey?: string;
  elevenVoice?: string;
};

async function elevenlabs(text: string, key: string, voiceId: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5",
      language_code: "de",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (/quota/i.test(body)) throw new Error("ElevenLabs credits used up");
    if (res.status === 401) throw new Error("ElevenLabs rejected the API key");
    throw new Error(`ElevenLabs error ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function edge(text: string, voice?: string): Promise<Buffer> {
  const name = EDGE_VOICES.find(([v]) => v === voice)?.[0] ?? EDGE_VOICES[0][0];
  const tts = new MsEdgeTTS();
  await tts.setMetadata(name, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (c: Buffer) => chunks.push(c));
    audioStream.on("error", reject);
    audioStream.on("close", resolve);
  });
  return Buffer.concat(chunks);
}

/** ElevenLabs first (if a key exists and mode allows), otherwise/after failure the free Edge voice. */
export async function synthesize(text: string, o: TtsOptions): Promise<{ audio: Buffer; provider: string; note?: string }> {
  const key = o.elevenKey || process.env.ELEVENLABS_API_KEY;
  let note: string | undefined;
  if (o.mode !== "free" && key) {
    try {
      const voiceId = o.elevenVoice || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
      return { audio: await elevenlabs(text, key, voiceId), provider: "elevenlabs" };
    } catch (e) {
      note = `${(e as Error).message}, using the free voice instead`;
      console.error("[tts] elevenlabs failed:", e);
    }
  }
  const audio = await edge(text, o.edgeVoice);
  if (audio.length === 0) throw new Error("The free voice returned no audio.");
  return { audio, provider: "edge", note };
}
