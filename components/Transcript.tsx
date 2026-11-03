"use client";

import type { Correction, Msg } from "@/lib/types";

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
  "rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/20 disabled:cursor-default disabled:opacity-50";

export default function Transcript({ messages, level, hideText, onSpeak, onReveal, onTranslate, onCorrect }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => {
        const visible = m.role === "user" || !hideText || m.revealed;
        const mine = m.role === "user";
        return (
          <div
            key={m.id}
            className={`max-w-[90%] rounded-2xl border px-4 py-3 ${
              mine ? "self-end border-transparent bg-indigo-900/70" : "border-slate-800 bg-slate-900"
            }`}
          >
            {visible && <p className="text-base leading-relaxed">{m.text}</p>}

            <div className={`flex flex-wrap gap-1.5 ${visible ? "mt-2" : ""}`}>
              {!mine && (
                <>
                  <button className={chip} onClick={() => onSpeak(m.text)}>🔊 Listen</button>
                  <button className={chip} onClick={() => onSpeak(m.text, 0.65)}>🐢 Slow</button>
                  {hideText && !m.revealed && <button className={chip} onClick={() => onReveal(m.id)}>👁 Reveal sentence</button>}
                </>
              )}
              {mine && (
                <button className={chip} onClick={() => onCorrect(m.id)} disabled={m.busy === "correcting"}>
                  {m.busy === "correcting" ? "Checking…" : m.correction ? "Re-check" : "✏️ Correct me"}
                </button>
              )}
            </div>

            {!mine && visible && (
              <div className="mt-3 border-t border-dashed border-slate-700 pt-2">
                <button className={chip} onClick={() => onTranslate(m.id)} disabled={m.busy === "translating"}>
                  {m.busy === "translating" ? "Translating…" : m.showEn ? "Hide English" : "🇬🇧 Show English"}
                </button>
                {m.showEn && m.translation && <p className="mt-2 text-sm text-slate-400">{m.translation}</p>}
              </div>
            )}

            {m.correction && <CorrectionCard c={m.correction} level={level} onSpeak={onSpeak} />}
          </div>
        );
      })}
    </div>
  );
}

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim();

function Line({ label, text, tone, onSpeak }: { label: string; text: string; tone: string; onSpeak: (t: string) => void }) {
  return (
    <div className="mt-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`font-semibold ${tone}`}>
        {text}{" "}
        <button className="align-middle text-xs font-normal text-slate-400 hover:text-slate-200" onClick={() => onSpeak(text)} aria-label="Listen">
          🔊
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
  add(c.isCorrect ? "What you said (correct)" : "Corrected", c.corrected, c.isCorrect ? "text-emerald-300" : "text-amber-300");
  add(`Best at your level (${level})`, c.atYourLevel, "text-sky-300");
  add("What a native would say", c.natural, "text-fuchsia-300");

  return (
    <div className={`mt-3 rounded-lg border-l-4 bg-black/30 p-3 text-sm ${c.isCorrect ? "border-emerald-500" : "border-amber-400"}`}>
      {c.isCorrect && <p className="font-semibold">✅ Your German is correct!</p>}
      {lines.map((l) => <Line key={l.label} {...l} onSpeak={onSpeak} />)}
      {c.explanation && <p className="mt-3 text-slate-200">{c.explanation}</p>}
      {c.mistakes.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {c.mistakes.map((x, i) => (
            <li key={i}>
              <s className="text-slate-400">{x.original}</s> → <b>{x.fix}</b>
              <span className="block text-xs text-slate-400">{x.why}</span>
            </li>
          ))}
        </ul>
      )}
      {c.phrases.length > 0 && (
        <div className="mt-3 border-t border-slate-700 pt-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Common phrases to steal</p>
          <ul className="mt-1 space-y-1">
            {c.phrases.map((p, i) => (
              <li key={i}>
                <button className="mr-1 text-xs text-slate-400 hover:text-slate-200" onClick={() => onSpeak(p.german)} aria-label="Listen">🔊</button>
                <b>{p.german}</b> – {p.english}
                {p.note && <span className="block pl-5 text-xs text-slate-400">{p.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
