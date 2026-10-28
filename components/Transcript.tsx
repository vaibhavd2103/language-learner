"use client";

import type { Msg } from "@/lib/types";

type Props = {
  messages: Msg[];
  hideText: boolean;
  onSpeak: (text: string, speed?: number) => void;
  onReveal: (id: number) => void;
  onTranslate: (id: number) => void;
  onCorrect: (id: number) => void;
};

const chip =
  "rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/20 disabled:cursor-default disabled:opacity-50";

export default function Transcript({ messages, hideText, onSpeak, onReveal, onTranslate, onCorrect }: Props) {
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

            {m.correction && (
              <div className={`mt-3 rounded-lg border-l-4 bg-black/30 p-3 text-sm ${m.correction.isCorrect ? "border-emerald-500" : "border-amber-400"}`}>
                {m.correction.isCorrect ? (
                  <p className="font-semibold">✅ Looks good!</p>
                ) : (
                  <>
                    <p className="font-semibold text-amber-300">✔ {m.correction.corrected}</p>
                    <button className="mt-1 text-xs text-slate-400 underline" onClick={() => onSpeak(m.correction!.corrected)}>
                      🔊 hear the corrected version
                    </button>
                  </>
                )}
                <p className="mt-2 text-slate-200">{m.correction.explanation}</p>
                {m.correction.mistakes?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {m.correction.mistakes.map((x, i) => (
                      <li key={i}>
                        <s className="text-slate-400">{x.original}</s> → <b>{x.fix}</b>
                        <span className="block text-xs text-slate-400">{x.why}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
