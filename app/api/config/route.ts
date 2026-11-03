export const runtime = "nodejs";

/**
 * Non-secret view of the server configuration, used by the Settings panel to show which
 * providers are ready and which models are in use. Key values are never returned.
 */
export async function GET() {
  return Response.json({
    groq: {
      keyOnServer: Boolean(process.env.GROQ_API_KEY),
      chatModel: process.env.GROQ_CHAT_MODEL ?? "openai/gpt-oss-120b",
      sttModel: process.env.GROQ_STT_MODEL ?? "whisper-large-v3-turbo",
    },
    elevenlabs: {
      keyOnServer: Boolean(process.env.ELEVENLABS_API_KEY),
      model: process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5",
      voiceId: process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB",
    },
  });
}
