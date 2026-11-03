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

## Deploy free on Cloudflare (Workers)

Built with [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). The worker bundle is ~1 MiB gzipped (free-plan limit is 3 MiB).

**Easiest (works from Windows, builds on Cloudflare's Linux servers):**

1. Push this repo to GitHub (merge to `main`).
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository**.
3. Build command `npx opennextjs-cloudflare build`, deploy command `npx wrangler deploy`.
4. Optional env var `NODE_VERSION=22`.
5. Under **Settings → Variables and Secrets** add `GROQ_API_KEY` (and optionally `ELEVENLABS_API_KEY`) as *secrets*.

**CLI:** `npm run deploy` (or `npm run preview` to test locally in the Workers runtime). OpenNext's CLI needs Linux/macOS/WSL; on plain Windows use the Git integration above.

**Things to know**

- **The free Edge voice does not work on Cloudflare** (Workers can't open its WebSocket). On Cloudflare the voice is ElevenLabs, then your browser's own German voice as fallback. If you want the free Edge fallback in production, host on Vercel/Node instead; everything else is identical.
- **Don't put your own keys in server secrets on a public URL**: anyone with the link would spend your Groq/ElevenLabs quota. Either leave the server keys empty and let each visitor paste theirs into ⚙ Settings, or put the site behind **Cloudflare Access** (free for up to 50 users).
- Free plan limits: 100k requests/day and 10 ms CPU per request. The API routes only proxy to Groq/ElevenLabs, so waiting on those doesn't count against CPU.
