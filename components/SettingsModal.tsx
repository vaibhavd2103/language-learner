"use client";

import { LEVELS, type Settings } from "@/hooks/useSettings";
import { EDGE_VOICE_OPTIONS } from "@/lib/voices";

type Props = { settings: Settings; onChange: (p: Partial<Settings>) => void; onClose: () => void };

const field = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

export default function SettingsModal({ settings: s, onChange, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">✕</button>
        </div>

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Practice</h3>
        <div className="mb-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs text-slate-400">Level
              <select className={field} value={s.level} onChange={(e) => onChange({ level: e.target.value as Settings["level"] })}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="col-span-2 text-xs text-slate-400">Topic (optional)
              <input className={field} value={s.topic} placeholder="ordering food, travel, work…" onChange={(e) => onChange({ topic: e.target.value })} />
            </label>
          </div>
          <label className="block text-xs text-slate-400">Playback speed {s.speed.toFixed(2)}×
            <input type="range" className="w-full" min="0.6" max="1.2" step="0.05" value={s.speed} onChange={(e) => onChange({ speed: Number(e.target.value) })} />
          </label>
          <Check label="Hide tutor text until I click Reveal (listening mode)" checked={s.hideText} onChange={(v) => onChange({ hideText: v })} />
          <Check label="Speak tutor replies automatically" checked={s.autoSpeak} onChange={(v) => onChange({ autoSpeak: v })} />
          <Check label="Auto-correct my speech (otherwise only when I click Correct me)" checked={s.autoCorrect} onChange={(v) => onChange({ autoCorrect: v })} />
        </div>

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Voice</h3>
        <div className="mb-5 space-y-3">
          <label className="block text-xs text-slate-400">Voice source
            <select className={field} value={s.ttsMode} onChange={(e) => onChange({ ttsMode: e.target.value as Settings["ttsMode"] })}>
              <option value="auto">ElevenLabs when available, free voice as backup</option>
              <option value="free">Free voice only (saves ElevenLabs credits)</option>
            </select>
          </label>
          <label className="block text-xs text-slate-400">Free voice (Microsoft Edge)
            <select className={field} value={s.edgeVoice} onChange={(e) => onChange({ edgeVoice: e.target.value })}>
              {EDGE_VOICE_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-slate-400">ElevenLabs voice ID (optional)
            <input className={field} value={s.elevenVoice} placeholder="default: Adam" onChange={(e) => onChange({ elevenVoice: e.target.value })} />
          </label>
        </div>

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">API keys</h3>
        <div className="space-y-3">
          <label className="block text-xs text-slate-400">Groq key (free – console.groq.com/keys)
            <input className={field} type="password" autoComplete="off" value={s.groqKey} placeholder="gsk_…  (blank = use server .env)" onChange={(e) => onChange({ groqKey: e.target.value })} />
          </label>
          <label className="block text-xs text-slate-400">ElevenLabs key (optional)
            <input className={field} type="password" autoComplete="off" value={s.elevenKey} placeholder="blank = use server .env" onChange={(e) => onChange({ elevenKey: e.target.value })} />
          </label>
          <p className="text-xs text-slate-500">
            Keys are stored only in this browser (localStorage) and sent to this app&apos;s own server, which forwards them to Groq / ElevenLabs. Leave blank to use the keys in your server&apos;s .env file.
          </p>
        </div>
      </div>
    </div>
  );
}
