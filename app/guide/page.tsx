import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, KeyIcon, MicIcon, SettingsIcon, SparkIcon, TargetIcon, WaveIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Guide – DeutschStream",
  description: "How to set up and use DeutschStream: get a free Groq API key, optional ElevenLabs voice, and practice tips.",
};

const LINKS = {
  groqKeys: "https://console.groq.com/keys",
  groqHome: "https://console.groq.com",
  elKeys: "https://elevenlabs.io/app/settings/api-keys",
  elVoices: "https://elevenlabs.io/app/voice-library",
  elHome: "https://elevenlabs.io",
  elPricing: "https://elevenlabs.io/pricing",
};

const TOC = [
  ["quick-start", "Quick start"],
  ["groq", "1 · Groq API key (required)"],
  ["elevenlabs", "2 · ElevenLabs voice (optional)"],
  ["using", "Using the app"],
  ["settings", "Settings explained"],
  ["self-host", "Running it yourself"],
  ["troubleshooting", "Troubleshooting"],
  ["privacy", "Privacy & keys"],
] as const;

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-4 [overflow-wrap:anywhere]">
      {children}
    </a>
  );
}

function Card({ id, icon, title, children }: { id: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section id={id} className="neu-raised scroll-mt-6 rounded-3xl p-5 sm:p-7">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold">
        <span className="neu-inset flex h-10 w-10 flex-none items-center justify-center rounded-2xl text-xl text-accent">{icon}</span>
        {title}
      </h2>
      <div className="space-y-4 text-[0.95rem] leading-relaxed">{children}</div>
    </section>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="space-y-3">{children}</ol>;
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="neu-inset flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold text-accent" aria-hidden>
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </li>
  );
}

function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <p className={`neu-inset rounded-2xl border-l-4 px-4 py-3 text-sm ${tone === "warn" ? "border-l-warn" : "border-l-info"}`}>{children}</p>
  );
}

const code = "neu-inset rounded-md px-1.5 py-0.5 font-mono text-[0.85em]";
const kbd = "neu-raised-sm rounded-md px-2 py-0.5 font-mono text-[0.85em]";

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="neu-inset group rounded-2xl px-4 py-3">
      <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="mr-2 text-accent group-open:hidden">+</span>
        <span className="mr-2 hidden text-accent group-open:inline">–</span>
        {q}
      </summary>
      <div className="mt-2 text-sm text-muted">{children}</div>
    </details>
  );
}

export default function Guide() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:max-w-4xl">
      <header className="flex items-center justify-between gap-3 pb-6">
        <Link href="/" className="neu-btn inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium">
          <span aria-hidden>←</span> Back to practice
        </Link>
        <span className="text-sm font-semibold text-muted">DeutschStream guide</span>
      </header>

      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Get started with DeutschStream</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Practise speaking and listening to German with an AI tutor. You talk, it answers out loud, and it corrects you whenever you ask.
          Setup takes about two minutes and is <b className="text-fg">free</b>.
        </p>
      </div>

      <nav aria-label="On this page" className="neu-inset mb-8 rounded-3xl p-4 sm:p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-accent underline-offset-4 hover:underline">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-6">
        <Card id="quick-start" icon={<SparkIcon />} title="Quick start">
          <Steps>
            <Step n={1}>Create a free Groq account and copy an API key — <a href="#groq" className="text-accent underline underline-offset-4">details below</a>.</Step>
            <Step n={2}>Open <b>Settings → API &amp; models</b> in the app and paste the key into the Groq field.</Step>
            <Step n={3}>Press the microphone (or <kbd className={kbd}>Space</kbd>), speak German, press again to send. Done.</Step>
          </Steps>
          <Note>The ElevenLabs voice is optional. Without it the app uses a free Microsoft voice, so you only need the Groq key.</Note>
        </Card>

        <Card id="groq" icon={<KeyIcon />} title="1 · Get a Groq API key (required)">
          <p>
            Groq powers the speech-to-text (it turns your voice into text), the tutor&apos;s replies, corrections and translations.
            The free tier is enough for daily practice and needs <b>no credit card</b>.
          </p>
          <Steps>
            <Step n={1}>
              Go to <A href={LINKS.groqKeys}>{LINKS.groqKeys}</A>. If you don&apos;t have an account yet, sign up at <A href={LINKS.groqHome}>console.groq.com</A> with Google, GitHub or email.
            </Step>
            <Step n={2}>Click <b>Create API Key</b>, give it any name (for example “DeutschStream”) and confirm.</Step>
            <Step n={3}>
              Copy the key now — it starts with <code className={code}>gsk_</code> and Groq only shows it once. If you lose it, just create a new one.
            </Step>
            <Step n={4}>
              Back in DeutschStream click <b>Settings</b> (gear icon, top right) → <b>API &amp; models</b> → paste it into <b>Groq → API key</b>.
              The badge changes to <b>“Using your key”</b>. It saves automatically.
            </Step>
          </Steps>
          <Note tone="warn">Treat the key like a password. Don&apos;t share it or post it publicly. If it leaks, delete it on the Groq keys page and make a new one.</Note>
        </Card>

        <Card id="elevenlabs" icon={<WaveIcon />} title="2 · ElevenLabs voice (optional)">
          <p>
            ElevenLabs gives a more natural German voice. Skip this if the free voice sounds good enough — you can add it any time.
            The free plan includes roughly 10,000 credits per month (see <A href={LINKS.elPricing}>current plans</A>).
          </p>
          <Steps>
            <Step n={1}>Create an account at <A href={LINKS.elHome}>elevenlabs.io</A>.</Step>
            <Step n={2}>
              Open <A href={LINKS.elKeys}>{LINKS.elKeys}</A> and click <b>Create API key</b>. Allow at least the <b>Text to Speech</b> permission, then copy the key.
            </Step>
            <Step n={3}>In the app: <b>Settings → API &amp; models → ElevenLabs → API key</b>, paste it. The badge shows “Using your key”.</Step>
            <Step n={4}>
              (Optional) Pick a different voice: browse the <A href={LINKS.elVoices}>Voice Library</A>, add one to your account, copy its <b>Voice ID</b> and paste it in
              <b> Settings → Voice → ElevenLabs voice ID</b>. Leave it empty to use the default.
            </Step>
          </Steps>
          <Note>
            Saving credits: each sentence is generated once and cached, so <b>Listen</b> and <b>Slow</b> replays cost nothing extra.
            To avoid ElevenLabs entirely, set <b>Settings → Voice → Voice source</b> to “Free voice only”. If your credits run out the app automatically falls back to the free voice.
          </Note>
        </Card>

        <Card id="using" icon={<MicIcon />} title="Using the app">
          <ul className="space-y-3">
            <li><b>Talk:</b> press the mic button (or <kbd className={kbd}>Space</kbd> when you&apos;re not typing), speak German, press again to send. The first time, allow microphone access in your browser.</li>
            <li><b>Type instead:</b> use the text box at the bottom if you can&apos;t speak right now.</li>
            <li><b>Let the tutor start:</b> on an empty conversation, tap that button and the tutor opens with a greeting.</li>
            <li><b>Listen / Slow:</b> replay the tutor&apos;s sentence at your normal speed or slowly. Great for catching individual words.</li>
            <li><b>Reveal sentence:</b> in <i>Listening mode</i> the tutor&apos;s text is hidden so you train your ears first. Reveal it when you&apos;re ready.</li>
            <li><b>Show English:</b> translates a tutor message. Tap again to hide.</li>
            <li><b>Correct me:</b> on your own messages — gives the fixed sentence, a version at your level, how a native would say it, what went wrong and useful phrases. Turn on <i>Auto-correct</i> to get this every time.</li>
            <li><b>Light / dark:</b> the sun/moon button in the header switches theme.</li>
          </ul>
          <Note>Tip: pick your level (A1–C1) and an optional topic like “ordering food” or “job interview” in Settings → Practice so the conversation matches what you want to practise.</Note>
        </Card>

        <Card id="settings" icon={<SettingsIcon />} title="Settings explained">
          <dl className="space-y-3">
            {[
              ["Level", "How simple or advanced the tutor's German is and how corrections are phrased."],
              ["Topic", "Optional theme for the conversation. Empty means free chat."],
              ["Listening mode", "Hides the tutor's text until you press Reveal sentence."],
              ["Speak replies automatically", "The tutor reads each answer aloud as soon as it arrives."],
              ["Auto-correct my speech", "Corrects every message you send. Otherwise only when you press Correct me."],
              ["Playback speed", "0.6× to 1.2×. Applies to the Listen button and automatic speech."],
              ["Voice source", "“ElevenLabs + backup” or “Free voice only”."],
              ["Free voice", "Which Microsoft neural German voice to use (male or female)."],
              ["API & models", "Paste your Groq / ElevenLabs keys and see live which keys the server already has and which models are in use."],
              ["Appearance", "Light, dark, or follow your device."],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[13rem_1fr] sm:gap-4">
                <dt className="font-semibold">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card id="self-host" icon={<BookIcon />} title="Running it yourself (optional)">
          <p>
            If you host DeutschStream yourself you can set the keys once on the server instead of in every browser. Put them in <code className={code}>.env.local</code> (or your host&apos;s environment variables):
          </p>
          <pre className="neu-inset overflow-x-auto rounded-2xl p-4 font-mono text-xs leading-relaxed">{`GROQ_API_KEY=gsk_...
# optional
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL=eleven_flash_v2_5
GROQ_CHAT_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo`}</pre>
          <p>
            Restart the server after changing them. Settings → API &amp; models then shows <b>“Server key active”</b>, and visitors don&apos;t need their own keys.
            A key pasted in the browser always takes priority over the server&apos;s.
          </p>
          <Note tone="warn">The free Microsoft voice can&apos;t run on Cloudflare Workers. On that host, add an ElevenLabs key (or your browser&apos;s built-in German voice is used as a last resort).</Note>
        </Card>

        <Card id="troubleshooting" icon={<TargetIcon />} title="Troubleshooting">
          <div className="space-y-3">
            <Faq q="“No Groq API key” appears">You haven&apos;t added a key yet. Follow <a href="#groq" className="text-accent underline underline-offset-4">step 1</a> and paste it in Settings → API &amp; models.</Faq>
            <Faq q="“Groq rejected the API key”">The key is mistyped, incomplete or deleted. Copy it again from <A href={LINKS.groqKeys}>the Groq keys page</A> (no spaces) or create a new one.</Faq>
            <Faq q="“Rate limit reached”">The free tier has per-minute limits. Wait a minute and try again.</Faq>
            <Faq q="The microphone doesn't work">Allow microphone access via the lock/camera icon in your browser&apos;s address bar, then reload. Make sure no other app is using the mic. The site must be opened over <code className={code}>https</code> (or localhost).</Faq>
            <Faq q="“I couldn't hear anything”">Speak a little louder or closer to the mic and keep recording for at least a second before pressing stop.</Faq>
            <Faq q="No sound / the voice is silent">Check your device volume and silent mode. If ElevenLabs says credits are used up, the app switches to the free voice automatically — or choose “Free voice only” in Settings → Voice.</Faq>
            <Faq q="ElevenLabs rejected the key">Make sure the key has Text to Speech permission and was copied completely. Create a fresh key at <A href={LINKS.elKeys}>the ElevenLabs keys page</A>.</Faq>
            <Faq q="I'm on a phone and Space does nothing">The Space shortcut is for keyboards. On touch devices just tap the mic button.</Faq>
          </div>
        </Card>

        <Card id="privacy" icon={<KeyIcon />} title="Privacy & keys">
          <ul className="list-disc space-y-2 pl-5">
            <li>Keys you paste are stored <b>only in your browser</b> (localStorage) on this device. Clearing site data removes them.</li>
            <li>They are sent to this app&apos;s own server with each request, which forwards them to Groq / ElevenLabs. They are never shown back in the interface.</li>
            <li>Your recordings and messages are sent to Groq to be transcribed and answered, and tutor sentences are sent to the voice provider to be spoken. See their privacy policies for details.</li>
            <li>On a shared computer, use <b>Settings → API &amp; models</b> to clear the key fields when you&apos;re done.</li>
          </ul>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="neu-accent inline-flex min-h-11 items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold">
          <MicIcon className="text-lg" /> Start practising
        </Link>
      </div>
    </main>
  );
}
