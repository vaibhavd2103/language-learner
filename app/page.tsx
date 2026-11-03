"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import SettingsModal from "@/components/SettingsModal";
import StatusBar from "@/components/StatusBar";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { AlertIcon, BookIcon, ChevronIcon, CloseIcon, MicIcon, SendIcon, SettingsIcon, SparkIcon } from "@/components/Icons";
import Transcript from "@/components/Transcript";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { authHeaders, useSettings } from "@/hooks/useSettings";
import { useSpeech } from "@/hooks/useSpeech";
import { postForm, postJson } from "@/lib/client";
import type { Correction, Msg, Status } from "@/lib/types";

export default function Home() {
  const { settings, update, reset, ready } = useSettings();
  const [serverHasGroq, setServerHasGroq] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [working, setWorking] = useState(false); // transcribing or waiting for the tutor
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // Does the server already hold a Groq key? (decides whether to show first-run setup help)
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => setServerHasGroq(Boolean(c?.groq?.keyOnServer)))
      .catch(() => setServerHasGroq(null));
  }, []);
  const needsSetup = ready && serverHasGroq === false && !settings.groqKey.trim();

  const closeSettings = useCallback(() => setShowSettings(false), []);
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
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col px-4 sm:px-6 lg:max-w-4xl">
      <header className="flex items-center justify-between gap-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="neu-raised-sm flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-xl font-bold text-accent" aria-hidden>
            D
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight">DeutschStream</h1>
            <p className="hidden truncate text-xs text-muted sm:block">German speaking &amp; listening practice</p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <span className="neu-inset rounded-full px-3 py-1.5 text-xs font-semibold text-accent" title="Your level">
            {settings.level}
          </span>
          <Link href="/guide" aria-label="Help and setup guide" title="Setup guide" className="neu-btn flex h-11 w-11 items-center justify-center rounded-full text-xl">
            <BookIcon />
          </Link>
          <ThemeToggle theme={settings.theme} onChange={(theme) => update({ theme })} />
          <button
            onClick={() => setShowSettings(true)}
            className="neu-btn flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium"
            aria-label="Settings"
          >
            <SettingsIcon className="text-xl" /> <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      <section className="neu-inset min-h-0 flex-1 overflow-y-auto rounded-3xl px-3 py-4 sm:px-5" aria-label="Conversation">
        <button
          onClick={() => setShowTranscript((v) => !v)}
          aria-expanded={showTranscript}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted hover:text-fg"
        >
          <ChevronIcon className={`text-base transition-transform ${showTranscript ? "" : "-rotate-90"}`} />
          {showTranscript ? "Hide conversation" : "Show conversation"} ({messages.length})
        </button>
        {showTranscript && (
          <>
            {messages.length === 0 && needsSetup && (
              <div className="neu-raised mx-auto mb-4 max-w-xl rounded-3xl p-5 sm:p-6" role="region" aria-label="First-time setup">
                <h2 className="text-lg font-semibold">Welcome! Two quick steps to start</h2>
                <ol className="mt-3 space-y-2 text-sm text-muted">
                  <li><b className="text-fg">1.</b> Get a free Groq API key (no credit card) at{" "}
                    <a className="font-medium text-accent underline underline-offset-4" href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com/keys</a>.</li>
                  <li><b className="text-fg">2.</b> Open <b className="text-fg">Settings → API &amp; models</b> and paste it in.</li>
                </ol>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setShowSettings(true)} className="neu-accent inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
                    <SettingsIcon className="text-lg" /> Open settings
                  </button>
                  <Link href="/guide" className="neu-btn inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium">
                    <BookIcon className="text-lg" /> Full setup guide
                  </Link>
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="mx-auto my-8 max-w-sm text-center sm:my-14">
                <span className="neu-raised mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full text-4xl text-accent">
                  <MicIcon />
                </span>
                <p className="text-base font-medium">Press the microphone (or Space), speak German, press again to send.</p>
                <p className="mt-2 text-sm text-muted">
                  The tutor only corrects you when you tap <b className="text-fg">Correct me</b>.{" "}
                  <Link href="/guide" className="font-medium text-accent underline underline-offset-4">How it works</Link>
                </p>
                <button
                  onClick={() => sendUserText("Hallo! Lass uns anfangen.")}
                  disabled={working}
                  className="neu-accent mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold"
                >
                  <SparkIcon className="text-lg" /> Let the tutor start
                </button>
              </div>
            )}
            <Transcript
              messages={messages}
              level={settings.level}
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
        <div
          role="alert"
          className="neu-raised-sm mt-3 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-danger"
        >
          <AlertIcon className="mt-0.5 flex-none text-lg" />
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss message" className="-m-1.5 flex h-8 w-8 flex-none items-center justify-center rounded-full hover:bg-line">
            <CloseIcon />
          </button>
        </div>
      )}

      <footer className="pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <StatusBar status={status} level={level} />
        <div className="flex items-center gap-3">
          <MicButton recording={recording} disabled={working} onClick={toggleMic} />
          <form
            className="flex min-w-0 flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = draft;
              setDraft("");
              void sendUserText(t);
            }}
          >
            <label htmlFor="draft" className="sr-only">Type your German message</label>
            <input
              id="draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={recording || working}
              enterKeyHint="send"
              autoComplete="off"
              placeholder={recording ? "Recording… press stop to send" : "…or type German here"}
              className="neu-inset h-12 min-w-0 flex-1 rounded-full px-5 text-base placeholder:text-muted/80 disabled:opacity-60 sm:h-14"
            />
            <button
              disabled={!draft.trim() || working}
              aria-label="Send message"
              className="neu-btn flex h-12 w-12 flex-none items-center justify-center rounded-full text-xl text-accent sm:h-14 sm:w-14"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </footer>

      {showSettings && <SettingsModal settings={settings} onChange={update} onReset={reset} onClose={closeSettings} />}
    </main>
  );
}
