import { transcribe } from "@/lib/groq";
import { hdr } from "@/lib/keys";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob) || file.size === 0) {
      return Response.json({ error: "No audio received." }, { status: 400 });
    }
    const ext = file.type.includes("mp4") ? "mp4" : file.type.includes("ogg") ? "ogg" : "webm";
    const text = await transcribe(file, `speech.${ext}`, hdr(req, "x-groq-key"));
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
