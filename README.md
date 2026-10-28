# Sprechen – German speaking & listening practice

Record yourself speaking German, get a German reply (spoken aloud), and ask for corrections with English explanations only when you want them.

## Stack (all free)

| Job | Tool | Cost |
|---|---|---|
| Speech → text | Groq `whisper-large-v3-turbo` | free tier |
| Conversation + corrections | Groq `openai/gpt-oss-120b` | free tier |
| German voice | Browser `speechSynthesis` (de-DE) | free |

One API key covers both AI parts: create it at https://console.groq.com/keys (no card).

## Run

```bash
cp .env.example .env.local   # paste your GROQ_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Use Chrome or Edge for the best German voices (Safari/Firefox work too, voice quality varies). The mic needs `localhost` or HTTPS.

## Using it

- 🎤 click to record, click ■ to send. You can also type.
- **✏️ Correct me** under any of your messages gives the corrected sentence, English explanation and a mistake list. Tick *Auto-correct my speech* to get this every time.
- Tutor replies have 🔊 Listen, 🐢 Slow and EN translate (use translate only after trying to understand by ear).
- Level (A1–C1) and topic steer the tutor's vocabulary.

## Swapping providers

All model calls live in `lib/groq.ts`. Alternatives: Google Gemini free tier (LLM), OpenRouter `:free` models (LLM), local Ollama + whisper.cpp (fully offline).
