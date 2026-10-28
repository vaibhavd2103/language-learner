import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

const VOICES = new Set([
  "de-DE-SeraphinaMultilingualNeural",
  "de-DE-FlorianMultilingualNeural",
  "de-DE-KatjaNeural",
  "de-DE-ConradNeural",
]);

export async function POST(req: Request) {
  try {
    const { text, rate = 1, voice } = await req.json();
    if (!text || typeof text !== "string" || text.length > 1000) {
      return Response.json({ error: "Invalid text." }, { status: 400 });
    }
    const voiceName = VOICES.has(voice) ? voice : "de-DE-SeraphinaMultilingualNeural";
    const pct = Math.round((Math.min(Math.max(Number(rate) || 1, 0.5), 1.5) - 1) * 100);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate: `${pct >= 0 ? "+" : ""}${pct}%` });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (c: Buffer) => chunks.push(c));
      audioStream.on("error", reject);
      audioStream.on("close", resolve);
    });
    const audio = Buffer.concat(chunks);
    if (audio.length === 0) throw new Error("TTS returned no audio.");
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" } });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
