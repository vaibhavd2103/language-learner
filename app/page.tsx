"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Correction = {
  isCorrect: boolean;
  corrected: string;
  explanation: string;
  mistakes: { original: string; fix: string; why: string }[];
};

type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  correction?: Correction;
  translation?: string;
  revealed?: boolean;
  showEn?: boolean;
  busy?: "correcting" | "translating";
};

const VOICES = [
  ["de-DE-SeraphinaMultilingualNeural", "Seraphina (female, most natural)"],
  ["de-DE-FlorianMultilingualNeural", "Florian (male, most natural)"],
  ["de-DE-KatjaNeural", "Katja (female)"],
  ["de-DE-ConradNeural", "Conrad (male)"],
] as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

async function post<T>(url: string, body: BodyInit | object, isForm = false): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    ...(isForm ? { body: body as FormData } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("A2");
  const [topic, setTopic] = useState("");
  const [autoCorrect, setAutoCorrect] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [rate, setRate] = useState(0.9);
  const [voice, setVoice] = useState<string>(VOICES[0][0]);
  const [hideText, setHideText] = useState(true);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "transcribing" | "thinking">("idle");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");

  const idRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("prefs") ?? "{}");
      if (saved.level) setLevel(saved.level);
      if (typeof saved.autoCorrect === "boolean") setAutoCorrect(saved.autoCorrect);
      if (typeof saved.autoSpeak === "boolean") setAutoSpeak(saved.autoSpeak);
      if (saved.rate) setRate(saved.rate);
      if (saved.voice) setVoice(saved.voice);
      if (typeof saved.hideText === "boolean") setHideText(saved.hideText);
      if (saved.topic) setTopic(saved.topic);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("prefs", JSON.stringify({ level, autoCorrect, autoSpeak, rate, topic, voice, hideText }));
    } catch {}
  }, [level, autoCorrect, autoSpeak, rate, topic, voice, hideText]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const pick = () => {
      const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("de"));
      voiceRef.current =
        voices.find((v) => /google|neural|natural|online/i.test(v.name)) ?? voices.find((v) => v.lang === "de-DE") ?? voices[0] ?? null;
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
    return () => speechSynthesis.removeEventListener("voiceschanged", pick);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef(new Map<string, string>());

  const browserSpeak = (text: string, r: number) => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = r;
    speechSynthesis.speak(u);
  };

  const speak = useCallback(
    async (text: string, r = rate) => {
      audioRef.current?.pause();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      const key = `${voice}|${r}|${text}`;
      try {
        let url = cacheRef.current.get(key);
        if (!url) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, rate: r, voice }),
          });
          if (!res.ok) throw new Error((await res.json()).error ?? "TTS failed");
          url = URL.createObjectURL(await res.blob());
          cacheRef.current.set(key, url);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        await audio.play();
      } catch {
        // neural voice unavailable (offline / service down): fall back to the browser voice
        browserSpeak(text, r);
      }
    },
    [rate, voice],
  );

  const patch = (id: number, p: Partial<Msg>) => setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const correct = useCallback(
    async (id: number) => {
      const msg = messagesRef.current.find((m) => m.id === id);
      if (!msg) return;
      patch(id, { busy: "correcting" });
      try {
        const correction = await post<Correction>("/api/correct", { text: msg.text, level });
        patch(id, { correction, busy: undefined });
      } catch (e) {
        patch(id, { busy: undefined });
        setError((e as Error).message);
      }
    },
    [level],
  );

  const translate = async (id: number) => {
    const msg = messagesRef.current.find((m) => m.id === id);
    if (!msg) return;
    if (msg.translation) {
      patch(id, { showEn: !msg.showEn });
      return;
    }
    patch(id, { busy: "translating" });
    try {
      const { text } = await post<{ text: string }>("/api/chat", { translate: msg.text });
      patch(id, { translation: text, showEn: true, busy: undefined });
    } catch (e) {
      patch(id, { busy: undefined });
      setError((e as Error).message);
    }
  };

  const sendUserText = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const userMsg: Msg = { id: ++idRef.current, role: "user", text: clean };
      const history = [...messagesRef.current, userMsg];
      setMessages(history);
      if (autoCorrect) void correct(userMsg.id);
      setStatus("thinking");
      try {
        const { text: reply } = await post<{ text: string }>("/api/chat", {
          messages: history.map(({ role, text }) => ({ role, content: text })),
          level,
          topic,
        });
        setMessages((ms) => [...ms, { id: ++idRef.current, role: "assistant", text: reply }]);
        if (autoSpeak) speak(reply);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setStatus("idle");
      }
    },
    [autoCorrect, autoSpeak, correct, level, topic, speak],
  );

  // keep the ref fresh so the recorder's onstop never uses stale settings
  const sendRef = useRef(sendUserText);
  sendRef.current = sendUserText;

  const startRecording = async () => {
    setError("");
    speechSynthesis?.cancel();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        if (blob.size < 1500) {
          setStatus("idle");
          return;
        }
        setStatus("transcribing");
        try {
          const form = new FormData();
          form.append("audio", blob);
          const { text } = await post<{ text: string }>("/api/transcribe", form, true);
          if (!text) {
            setError("I couldn't hear anything. Try again, a bit closer to the mic.");
            setStatus("idle");
            return;
          }
          await sendRef.current(text);
        } catch (e) {
          setError((e as Error).message);
          setStatus("idle");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setError("Microphone access was denied or is unavailable.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const busy = status !== "idle";

  return (
    <main>
      <header>
        <h1>Sprechen <span>German speaking &amp; listening practice</span></h1>
        <div className="controls">
          <label>
            Level
            <select value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>
            Voice
            <select value={voice} onChange={(e) => setVoice(e.target.value)}>
              {VOICES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </label>
          <label className="grow">
            Topic
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. ordering food, travel, work" />
          </label>
          <label>
            Voice speed {rate.toFixed(2)}×
            <input type="range" min="0.5" max="1.2" step="0.05" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </label>
          <label className="check"><input type="checkbox" checked={hideText} onChange={(e) => setHideText(e.target.checked)} /> Hide tutor text (listening mode)</label>
          <label className="check"><input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} /> Speak replies</label>
          <label className="check"><input type="checkbox" checked={autoCorrect} onChange={(e) => setAutoCorrect(e.target.checked)} /> Auto-correct my speech</label>
        </div>
      </header>

      <section className="chat">
        {messages.length === 0 && (
          <div className="empty">
            <p>Press the microphone, speak German, press it again to send.</p>
            <p>The tutor answers in German and only corrects you when you click <b>Correct me</b> (or turn on auto-correct).</p>
            <button onClick={() => sendUserText("Hallo! Lass uns anfangen.")} disabled={busy}>Let the tutor start</button>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            {(m.role === "user" || !hideText || m.revealed) && <p className="text">{m.text}</p>}
            <div className="actions">
              {m.role === "assistant" && (
                <>
                  <button onClick={() => speak(m.text)}>🔊 Listen</button>
                  <button onClick={() => speak(m.text, 0.6)}>🐢 Slow</button>
                  {hideText && !m.revealed && <button onClick={() => patch(m.id, { revealed: true })}>👁 Reveal sentence</button>}
                </>
              )}
              {m.role === "user" && (
                <button onClick={() => correct(m.id)} disabled={m.busy === "correcting"}>
                  {m.busy === "correcting" ? "Checking…" : m.correction ? "Re-check" : "✏️ Correct me"}
                </button>
              )}
            </div>
            {m.role === "assistant" && (!hideText || m.revealed) && (
              <div className="en">
                <button onClick={() => translate(m.id)} disabled={m.busy === "translating"}>
                  {m.busy === "translating" ? "Translating…" : m.showEn ? "Hide English" : "🇬🇧 Show English"}
                </button>
                {m.showEn && m.translation && <p className="translation">{m.translation}</p>}
              </div>
            )}
            {m.correction && (
              <div className={`correction ${m.correction.isCorrect ? "ok" : ""}`}>
                {m.correction.isCorrect ? <b>✅ Looks good!</b> : <p className="fixed">✔ {m.correction.corrected}</p>}
                {!m.correction.isCorrect && (
                  <button className="link" onClick={() => speak(m.correction!.corrected)}>🔊 hear the corrected version</button>
                )}
                <p>{m.correction.explanation}</p>
                {m.correction.mistakes?.length > 0 && (
                  <ul>
                    {m.correction.mistakes.map((x, i) => (
                      <li key={i}><s>{x.original}</s> → <b>{x.fix}</b> <em>{x.why}</em></li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="bubble assistant dim">{status === "transcribing" ? "Listening to what you said…" : "Thinking…"}</div>}
        <div ref={endRef} />
      </section>

      {error && <div className="error" onClick={() => setError("")}>{error}</div>}

      <footer>
        <button
          className={`mic ${recording ? "rec" : ""}`}
          onClick={recording ? stopRecording : startRecording}
          disabled={busy && !recording}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? "■" : "🎤"}
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft;
            setDraft("");
            void sendUserText(t);
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={recording ? "Recording… press ■ to send" : "…or type German here"} disabled={recording || busy} />
          <button disabled={!draft.trim() || busy}>Send</button>
        </form>
      </footer>
    </main>
  );
}
