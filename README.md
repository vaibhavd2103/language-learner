# DeutschStream – German speaking & listening practice

Speak German into the mic, hear a German reply, and ask for corrections (explained in English) only when you want them.

## Stack (free-first)

| Job | Tool | Cost |
|---|---|---|
| Speech → text | Groq `whisper-large-v3-turbo` | free tier |
| Tutor + corrections | Groq `openai/gpt-oss-120b` | free tier |
| German voice | ElevenLabs `eleven_flash_v2_5` if a key is set, **automatically falling back to free Microsoft Edge neural voices** when credits run out or the key fails | free plan ~10k credits/mo; paid plans start around $5/mo (check elevenlabs.io/pricing) |
| UI | Next.js App Router + Tailwind | free |

Credit-saving: replies are capped at 1–3 sentences, audio is cached per sentence, and *Slow*/speed use browser `playbackRate`, so replaying never costs extra credits. Set **Voice source → Free voice only** in Settings to spend zero ElevenLabs credits.

## Run

```bash
cp .env.example .env.local   # add GROQ_API_KEY (and optionally ELEVENLABS_API_KEY)
npm install
npm run dev                  # http://localhost:3000
```

Keys can instead be pasted in the in-app **Settings** (stored only in your browser's localStorage). Mic access needs `localhost` or HTTPS.

## Using it

- 🎤 (or Space) to record, again to send. You can also type.
- Tutor replies start hidden: **🔊 Listen / 🐢 Slow / 👁 Reveal sentence**, then **🇬🇧 Show English** below the revealed sentence. Turn this off in Settings.
- **✏️ Correct me** under your message gives the corrected sentence, an English explanation and a mistake list. Enable auto-correct in Settings to get it every time.
- Status bar shows Idle / Listening / Thinking / Speaking with a live waveform.

## Layout

`app/api/{transcribe,chat,correct,tts}` server routes · `components/` MicButton, StatusBar, Transcript, SettingsModal · `hooks/` useAudioRecorder, useSpeech, useSettings · `lib/groq.ts`, `lib/tts.ts` providers.
