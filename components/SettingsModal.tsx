"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LEVELS, type Settings } from "@/hooks/useSettings";
import { EDGE_VOICE_OPTIONS } from "@/lib/voices";
import {
  BookIcon, ChevronIcon, CloseIcon, EyeIcon, EyeOffIcon, KeyIcon, MonitorIcon, MoonIcon, PaletteIcon,
  ResetIcon, SunIcon, TargetIcon, WaveIcon,
} from "./Icons";

type Props = { settings: Settings; onChange: (p: Partial<Settings>) => void; onReset: () => void; onClose: () => void };

type ServerConfig = {
  groq: { keyOnServer: boolean; chatModel: string; sttModel: string };
  elevenlabs: { keyOnServer: boolean; model: string; voiceId: string };
};

const TABS = [
  { id: "practice", label: "Practice", icon: TargetIcon },
  { id: "voice", label: "Voice", icon: WaveIcon },
  { id: "api", label: "API & models", icon: KeyIcon },
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
] as const;
type TabId = (typeof TABS)[number]["id"];

const LEVEL_INFO: Record<Settings["level"], string> = {
  A1: "Beginner – very simple sentences",
  A2: "Elementary – everyday topics",
  B1: "Intermediate – opinions & stories",
  B2: "Upper-intermediate – fluent discussion",
  C1: "Advanced – nuanced, native-like",
};

const input =
  "neu-inset w-full rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/80 disabled:opacity-50";

/* ───────────── small building blocks ───────────── */

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-7 last:mb-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Switch({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={id} className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className="neu-inset relative mt-0.5 h-7 w-12 flex-none cursor-pointer rounded-full"
      >
        <span
          className={`absolute top-0.5 rounded-full transition-all duration-200 ${
            checked ? "left-[calc(100%-1.5rem)] bg-accent" : "left-0.5 bg-muted/60"
          }`}
          style={{ width: "1.375rem", height: "1.375rem", boxShadow: "1px 1px 3px var(--sh-lo)" }}
        />
      </button>
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "warn" | "muted"; children: ReactNode }) {
  const c = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-muted";
  return (
    <span className={`neu-inset inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${c}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {children}
    </span>
  );
}

function SecretInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className={`${input} pr-11 font-mono`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide key" : "Show key"}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-fg"
      >
        {shown ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate font-mono text-xs">{value}</p>
    </div>
  );
}

function ProviderCard({ title, desc, status, children }: { title: string; desc: ReactNode; status: ReactNode; children: ReactNode }) {
  return (
    <div className="neu-raised-sm rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted">{desc}</p>
        </div>
        {status}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ───────────── the dialog ───────────── */

export default function SettingsModal({ settings: s, onChange, onReset, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("practice");
  const [cfg, setCfg] = useState<ServerConfig | null>(null);
  const [cfgError, setCfgError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Live backend status (which providers have a server-side key, which models are in use)
  useEffect(() => {
    let alive = true;
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: ServerConfig) => alive && setCfg(d))
      .catch(() => alive && setCfgError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Escape to close, focus trap, scroll lock, restore focus
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return closeRef.current();
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, []);

  const groqStatus = s.groqKey ? <Badge tone="ok">Using your key</Badge> : cfg?.groq.keyOnServer ? <Badge tone="ok">Server key active</Badge> : cfg ? <Badge tone="warn">No key set</Badge> : <Badge tone="muted">{cfgError ? "Status unavailable" : "Checking…"}</Badge>;
  const elStatus = s.elevenKey ? <Badge tone="ok">Using your key</Badge> : cfg?.elevenlabs.keyOnServer ? <Badge tone="ok">Server key active</Badge> : cfg ? <Badge tone="muted">Not configured · free voice used</Badge> : <Badge tone="muted">{cfgError ? "Status unavailable" : "Checking…"}</Badge>;

  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" style={{ background: "var(--scrim)" }} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="neu-raised anim-sheet flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] outline-none md:h-[min(40rem,86dvh)] md:max-w-3xl md:rounded-[2rem]"
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-4 md:px-6 md:pt-5">
          <div>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted/40 md:hidden" aria-hidden />
            <h2 id={`${uid}-title`} className="text-lg font-semibold">Settings</h2>
            <p className="text-xs text-muted">Changes are saved automatically on this device.</p>
          </div>
          <button onClick={onClose} aria-label="Close settings" className="neu-btn flex h-10 w-10 items-center justify-center rounded-full text-lg">
            <CloseIcon />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* nav: scrollable pills on mobile, sidebar on md+ */}
          <nav aria-label="Settings sections" className="flex flex-none gap-2 overflow-x-auto px-5 py-3 md:w-52 md:flex-col md:overflow-visible md:px-5 md:py-2">
            <div role="tablist" aria-orientation="vertical" className="flex gap-2 md:flex-col md:gap-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  id={`${uid}-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`${uid}-panel`}
                  onClick={() => setTab(id)}
                  className="neu-btn flex flex-none items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium md:w-full md:rounded-2xl"
                >
                  <Icon className="text-lg" /> {label}
                </button>
              ))}
            </div>
          </nav>

          {/* content */}
          <div
            id={`${uid}-panel`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${tab}`}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-3 md:px-6 md:pb-6"
          >
            {tab === "practice" && (
              <>
                <Section title="Level" hint="Controls the tutor's vocabulary, speed and the corrections you get.">
                  <div role="radiogroup" aria-label="German level" className="grid grid-cols-5 gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        role="radio"
                        aria-checked={s.level === l}
                        data-active={s.level === l}
                        onClick={() => onChange({ level: l })}
                        className={`neu-btn rounded-xl py-2.5 text-sm font-semibold ${s.level === l ? "text-accent" : ""}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted" aria-live="polite">{s.level} · {LEVEL_INFO[s.level]}</p>
                  <Field label="Topic (optional)" htmlFor={`${uid}-topic`} hint="Leave empty for free conversation.">
                    <input id={`${uid}-topic`} className={input} value={s.topic} placeholder="ordering food, travel, work…" onChange={(e) => onChange({ topic: e.target.value })} />
                  </Field>
                </Section>

                <Section title="Listening & feedback">
                  <Switch label="Listening mode" desc="Hide tutor text until you tap Reveal sentence." checked={s.hideText} onChange={(v) => onChange({ hideText: v })} />
                  <Switch label="Speak replies automatically" desc="The tutor reads each answer aloud as soon as it arrives." checked={s.autoSpeak} onChange={(v) => onChange({ autoSpeak: v })} />
                  <Switch label="Auto-correct my speech" desc="Otherwise corrections only appear when you tap Correct me." checked={s.autoCorrect} onChange={(v) => onChange({ autoCorrect: v })} />
                </Section>

                <Section title="Playback">
                  <Field label={`Playback speed · ${s.speed.toFixed(2)}×`} htmlFor={`${uid}-speed`}>
                    <input id={`${uid}-speed`} type="range" className="w-full cursor-pointer accent-[var(--accent)]" min="0.6" max="1.2" step="0.05" value={s.speed} onChange={(e) => onChange({ speed: Number(e.target.value) })} />
                    <div className="mt-1 flex justify-between text-[11px] text-muted"><span>0.6× slower</span><span>1.2× faster</span></div>
                  </Field>
                </Section>
              </>
            )}

            {tab === "voice" && (
              <>
                <Section title="Voice source" hint="Where the tutor's spoken German comes from.">
                  <div role="radiogroup" aria-label="Voice source" className="grid gap-3 sm:grid-cols-2">
                    {([
                      ["auto", "ElevenLabs + backup", "Natural voice when available; falls back to the free voice."],
                      ["free", "Free voice only", "Microsoft Edge neural voice. Saves ElevenLabs credits."],
                    ] as const).map(([v, t, d]) => (
                      <button
                        key={v}
                        role="radio"
                        aria-checked={s.ttsMode === v}
                        data-active={s.ttsMode === v}
                        onClick={() => onChange({ ttsMode: v })}
                        className="neu-btn rounded-2xl p-4 text-left"
                      >
                        <span className={`block text-sm font-semibold ${s.ttsMode === v ? "text-accent" : ""}`}>{t}</span>
                        <span className="mt-1 block text-xs text-muted">{d}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Voices">
                  <Field label="Free voice (Microsoft Edge)" htmlFor={`${uid}-edge`}>
                    <div className="relative">
                      <select id={`${uid}-edge`} className={`${input} appearance-none pr-10`} value={s.edgeVoice} onChange={(e) => onChange({ edgeVoice: e.target.value })}>
                        {EDGE_VOICE_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                      </select>
                      <ChevronIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    </div>
                  </Field>
                  <Field label="ElevenLabs voice ID (optional)" htmlFor={`${uid}-el-voice`} hint={`Blank uses the server default${cfg ? ` (${cfg.elevenlabs.voiceId})` : ""}.`}>
                    <input id={`${uid}-el-voice`} className={`${input} font-mono`} value={s.elevenVoice} placeholder="default voice" onChange={(e) => onChange({ elevenVoice: e.target.value })} />
                  </Field>
                </Section>
              </>
            )}

            {tab === "api" && (
              <>
                <Section title="Connected services" hint="Status below is read live from this app's server. Leave a key blank to use the server's .env value.">
                  <ProviderCard
                    title="Groq"
                    desc="Speech-to-text, tutor replies, corrections & translation."
                    status={groqStatus}
                  >
                    <Field label="API key" htmlFor={`${uid}-groq`} hint="Free at console.groq.com/keys">
                      <SecretInput id={`${uid}-groq`} value={s.groqKey} onChange={(v) => onChange({ groqKey: v })} placeholder="gsk_…  (blank = use server)" />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ReadOnly label="Chat model" value={cfg?.groq.chatModel ?? "…"} />
                      <ReadOnly label="Speech model" value={cfg?.groq.sttModel ?? "…"} />
                    </div>
                  </ProviderCard>

                  <ProviderCard
                    title="ElevenLabs"
                    desc="Optional natural German voice."
                    status={elStatus}
                  >
                    <Field label="API key" htmlFor={`${uid}-el`} hint="elevenlabs.io/app/settings/api-keys">
                      <SecretInput id={`${uid}-el`} value={s.elevenKey} onChange={(v) => onChange({ elevenKey: v })} placeholder="blank = use server" />
                    </Field>
                    <ReadOnly label="Voice model" value={cfg?.elevenlabs.model ?? "…"} />
                  </ProviderCard>

                  <p className="flex gap-2 text-xs text-muted">
                    <BookIcon className="mt-0.5 flex-none text-base" />
                    <span>Keys are stored only in this browser (localStorage) and sent to this app&apos;s own server, which forwards them to Groq / ElevenLabs. Models are configured on the server with <code className="font-mono">GROQ_CHAT_MODEL</code>, <code className="font-mono">GROQ_STT_MODEL</code> and <code className="font-mono">ELEVENLABS_MODEL</code>.</span>
                  </p>
                </Section>
              </>
            )}

            {tab === "appearance" && (
              <Section title="Theme" hint="System follows your device's light / dark setting.">
                <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
                  {([
                    ["system", "System", MonitorIcon],
                    ["light", "Light", SunIcon],
                    ["dark", "Dark", MoonIcon],
                  ] as const).map(([v, label, Icon]) => (
                    <button
                      key={v}
                      role="radio"
                      aria-checked={s.theme === v}
                      data-active={s.theme === v}
                      onClick={() => onChange({ theme: v })}
                      className={`neu-btn flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-sm font-medium ${s.theme === v ? "text-accent" : ""}`}
                    >
                      <Icon className="text-2xl" /> {label}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <button onClick={onReset} className="neu-btn mt-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-muted">
              <ResetIcon className="text-base" /> Reset preferences to defaults
              <span className="sr-only"> (API keys are kept)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
