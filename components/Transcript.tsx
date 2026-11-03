"use client";

import type { Correction, Msg } from "@/lib/types";
import { CheckCircleIcon, EyeIcon, LanguagesIcon, PencilIcon, SnailIcon, VolumeIcon } from "./Icons";

type Props = {
  messages: Msg[];
  level: string;
  hideText: boolean;
  onSpeak: (text: string, speed?: number) => void;
  onReveal: (id: number) => void;
  onTranslate: (id: number) => void;
  onCorrect: (id: number) => void;
};

const chip =
  "neu-btn inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-fg";

export default function Transcript({ messages, level, hideText, onSpeak, onReveal, onTranslate, onCorrect }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) => {
        const visible = m.role === "user" || !hideText || m.revealed;
        const mine = m.role === "user";
        return (
          <article
            key={m.id}
            aria-label={mine ? "You" : "Tutor"}
            className={`anim-msg w-full max-w-[92%] rounded-3xl px-4 py-3.5 sm:max-w-[85%] sm:px-5 lg:max-w-[75%] ${
              mine ? "neu-inset self-end bg-accent-soft" : "neu-raised self-start"
            }`}
            style={mine ? { background: "var(--accent-soft)" } : undefined}
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{mine ? "You" : "Tutor"}</p>

            {visible ? (
              <p className="text-base leading-relaxed [overflow-wrap:anywhere]">{m.text}</p>
            ) : (
              <p className="text-sm italic text-muted">Listen first — reveal the sentence when you&apos;re ready.</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {!mine && (
                <>
                  <button className={chip} onClick={() => onSpeak(m.text)}>
                    <VolumeIcon className="text-base" /> Listen
                  </button>
                  <button className={chip} onClick={() => onSpeak(m.text, 0.65)}>
                    <SnailIcon className="text-base" /> Slow
                  </button>
                  {hideText && !m.revealed && (
                    <button className={chip} onClick={() => onReveal(m.id)}>
                      <EyeIcon className="text-base" /> Reveal sentence
                    </button>
                  )}
                  {visible && (
                    <button className={chip} onClick={() => onTranslate(m.id)} disabled={m.busy === "translating"} aria-pressed={!!m.showEn}>
                      <LanguagesIcon className="text-base" />
                      {m.busy === "translating" ? "Translating…" : m.showEn ? "Hide English" : "Show English"}
                    </button>
                  )}
                </>
              )}
              {mine && (
                <button className={chip} onClick={() => onCorrect(m.id)} disabled={m.busy === "correcting"}>
                  <PencilIcon className="text-base" />
                  {m.busy === "correcting" ? "Checking…" : m.correction ? "Re-check" : "Correct me"}
                </button>
              )}
            </div>

            {!mine && visible && m.showEn && m.translation && (
              <p className="neu-inset mt-3 rounded-2xl px-4 py-3 text-sm text-muted">{m.translation}</p>
            )}

            {m.correction && <CorrectionCard c={m.correction} level={level} onSpeak={onSpeak} />}
          </article>
        );
      })}
    </div>
  );
}

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim();

function Line({ label, text, tone, onSpeak }: { label: string; text: string; tone: string; onSpeak: (t: string) => void }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`flex items-start gap-2 font-semibold ${tone}`}>
        <span className="[overflow-wrap:anywhere]">{text}</span>
        <button
          className="neu-btn -my-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-normal text-muted"
          onClick={() => onSpeak(text)}
          aria-label={`Listen: ${text}`}
        >
          <VolumeIcon />
        </button>
      </p>
    </div>
  );
}

function CorrectionCard({ c, level, onSpeak }: { c: Correction; level: string; onSpeak: (t: string) => void }) {
  const lines: { label: string; text: string; tone: string }[] = [];
  const seen = new Set<string>();
  const add = (label: string, text: string, tone: string) => {
    if (text && !seen.has(norm(text))) {
      seen.add(norm(text));
      lines.push({ label, text, tone });
    }
  };
  add(c.isCorrect ? "What you said (correct)" : "Corrected", c.corrected, c.isCorrect ? "text-ok" : "text-warn");
  add(`Best at your level (${level})`, c.atYourLevel, "text-info");
  add("What a native would say", c.natural, "text-violet");

  return (
    <div className={`neu-inset mt-4 rounded-2xl border-l-4 p-4 text-sm ${c.isCorrect ? "border-l-ok" : "border-l-warn"}`}>
      {c.isCorrect && (
        <p className="mb-3 flex items-center gap-2 font-semibold text-ok">
          <CheckCircleIcon className="text-lg" /> Your German is correct!
        </p>
      )}
      {lines.map((l) => <Line key={l.label} {...l} onSpeak={onSpeak} />)}
      {c.explanation && <p className="mt-4 leading-relaxed">{c.explanation}</p>}
      {c.mistakes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {c.mistakes.map((x, i) => (
            <li key={i} className="border-t border-line pt-2 first:border-0 first:pt-0">
              <s className="text-muted">{x.original}</s> <span aria-hidden>→</span> <b>{x.fix}</b>
              <span className="block text-xs text-muted">{x.why}</span>
            </li>
          ))}
        </ul>
      )}
      {c.phrases.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Common phrases to steal</p>
          <ul className="mt-2 space-y-2">
            {c.phrases.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <button
                  className="neu-btn flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm text-muted"
                  onClick={() => onSpeak(p.german)}
                  aria-label={`Listen: ${p.german}`}
                >
                  <VolumeIcon />
                </button>
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <b>{p.german}</b> – {p.english}
                  {p.note && <span className="block text-xs text-muted">{p.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
