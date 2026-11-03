import { hdr } from "@/lib/keys";
import { synthesize } from "@/lib/tts";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ elevenlabsOnServer: Boolean(process.env.ELEVENLABS_API_KEY) });
}

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== "string" || text.length > 1000) {
      return Response.json({ error: "Invalid text." }, { status: 400 });
    }
    const { audio, provider, note } = await synthesize(text, {
      mode: hdr(req, "x-tts-mode") === "free" ? "free" : "auto",
      edgeVoice: voice,
      elevenKey: hdr(req, "x-elevenlabs-key"),
      elevenVoice: hdr(req, "x-elevenlabs-voice"),
    });
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
        "X-TTS-Provider": provider,
        ...(note ? { "X-TTS-Note": encodeURIComponent(note) } : {}),
      },
    });
  } catch (e) {
    console.error("[tts]", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
