"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import SettingsModal from "@/components/SettingsModal";
import StatusBar from "@/components/StatusBar";
import Transcript from "@/components/Transcript";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { authHeaders, useSettings } from "@/hooks/useSettings";
import { useSpeech } from "@/hooks/useSpeech";
import { postForm, postJson } from "@/lib/client";
import type { Correction, Msg, Status } from "@/lib/types";

export default function Home() {
  const { settings, update } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [working, setWorking] = useState(false); // transcribing or waiting for the tutor
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;
  const s = useRef(settings);
  s.current = settings;

  const { speak, stop: stopSpeech, speaking } = useSpeech(settings, setNotice);

  const patch = (id: number, p: Partial<Msg>) => setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const fail = (e: unknown) => setNotice((e as Error).message);

  const correct = useCallback(async (id: number) => {
    const msg = messagesRef.current.find((m) => m.id === id);
    if (!msg) return;
    patch(id, { busy: "correcting" });
    try {
      const correction = await postJson<Correction>("/api/correct", { text: msg.text, level: s.current.level }, authHeaders(s.current));
      patch(id, { correction, busy: undefined });
    } catch (e) {
      patch(id, { busy: undefined });
      fail(e);
    }
  }, []);

  const translate = async (id: number) => {
    const msg = messagesRef.current.find((m) => m.id === id);
    if (!msg) return;
    if (msg.translation) return patch(id, { showEn: !msg.showEn });
    patch(id, { busy: "translating" });
    try {
      const { text } = await postJson<{ text: string }>("/api/chat", { translate: msg.text }, authHeaders(s.current));
      patch(id, { translation: text, showEn: true, busy: undefined });
    } catch (e) {
      patch(id, { busy: undefined });
      fail(e);
    }
  };

  const sendUserText = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const cfg = s.current;
      const userMsg: Msg = { id: ++idRef.current, role: "user", text: clean };
      const history = [...messagesRef.current, userMsg];
      setMessages(history);
      if (cfg.autoCorrect) void correct(userMsg.id);
      setWorking(true);
      try {
        const { text: reply } = await postJson<{ text: string }>(
          "/api/chat",
          { messages: history.map(({ role, text }) => ({ role, content: text })), level: cfg.level, topic: cfg.topic },
          authHeaders(cfg),
        );
        setMessages((ms) => [...ms, { id: ++idRef.current, role: "assistant", text: reply }]);
        if (cfg.autoSpeak) void speak(reply);
      } catch (e) {
        fail(e);
      } finally {
        setWorking(false);
      }
    },
    [correct, speak],
  );

  const handleAudio = useCallback(
    async (blob: Blob) => {
      setWorking(true);
      try {
        const form = new FormData();
        form.append("audio", blob);
        const { text } = await postForm<{ text: string }>("/api/transcribe", form, authHeaders(s.current));
        if (!text) {
          setNotice("I couldn't hear anything. Try again, a bit closer to the mic.");
          return;
        }
        await sendUserText(text);
      } catch (e) {
        fail(e);
      } finally {
        setWorking(false);
      }
    },
    [sendUserText],
  );

  const { recording, level, start, stop } = useAudioRecorder({ onComplete: handleAudio, onError: setNotice });

  const toggleMic = useCallback(() => {
    if (recording) return stop();
    setNotice("");
    stopSpeech();
    void start();
  }, [recording, start, stop, stopSpeech]);

  // Space bar toggles the mic when not typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code !== "Space" || /INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName) || working) return;
      e.preventDefault();
      toggleMic();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleMic, working]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, working]);

  const status: Status = recording ? "listening" : working ? "thinking" : speaking ? "speaking" : "idle";

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between border-b border-slate-800 py-3">
        <h1 className="text-xl font-bold">
          DeutschStream <span className="ml-2 hidden text-xs font-normal text-slate-400 sm:inline">German speaking &amp; listening practice</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{settings.level}</span>
          <button onClick={() => setShowSettings(true)} className="rounded-full bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700" aria-label="Settings">
            ⚙ Settings
          </button>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto py-4">
        <button onClick={() => setShowTranscript((v) => !v)} className="mb-3 text-xs text-slate-400 hover:text-slate-200">
          {showTranscript ? "▾ Hide conversation" : "▸ Show conversation"} ({messages.length})
        </button>
        {showTranscript && (
          <>
            {messages.length === 0 && (
              <div className="mx-auto mt-10 max-w-sm text-center text-slate-400">
                <p>Press the microphone (or Space), speak German, press again to send.</p>
                <p className="mt-2 text-sm">
                  The tutor only corrects you when you click <b>Correct me</b>.
                </p>
                <button
                  onClick={() => sendUserText("Hallo! Lass uns anfangen.")}
                  disabled={working}
                  className="mt-4 rounded-full bg-amber-400 px-5 py-2 text-sm font-medium text-slate-900 hover:bg-amber-300 disabled:opacity-50"
                >
                  Let the tutor start
                </button>
              </div>
            )}
            <Transcript
              messages={messages}
              hideText={settings.hideText}
              onSpeak={(t, sp) => void speak(t, sp)}
              onReveal={(id) => patch(id, { revealed: true })}
              onTranslate={translate}
              onCorrect={correct}
            />
          </>
        )}
        <div ref={endRef} />
      </section>

      {notice && (
        <div role="alert" onClick={() => setNotice("")} className="mb-2 cursor-pointer rounded-lg bg-rose-950 px-3 py-2 text-sm text-rose-100">
          {notice} <span className="text-rose-300/60">(click to dismiss)</span>
        </div>
      )}

      <footer className="border-t border-slate-800 pb-4">
        <StatusBar status={status} level={level} />
        <div className="flex items-center gap-3">
          <MicButton recording={recording} disabled={working} onClick={toggleMic} />
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = draft;
              setDraft("");
              void sendUserText(t);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={recording || working}
              placeholder={recording ? "Recording… press ■ to send" : "…or type German here"}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
            <button disabled={!draft.trim() || working} className="rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm hover:bg-slate-800 disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      </footer>

      {showSettings && <SettingsModal settings={settings} onChange={update} onClose={() => setShowSettings(false)} />}
    </main>
  );
}
