"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authHeaders, type Settings } from "./useSettings";

/**
 * Plays German TTS. Audio is fetched once per (voice, text) and cached, and speed is applied with
 * playbackRate, so replaying or slowing a sentence never costs extra ElevenLabs credits.
 */
export function useSpeech(settings: Settings, onNotice: (msg: string) => void) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, string>());
  const lastNote = useRef("");
  const germanVoice = useRef<SpeechSynthesisVoice | null>(null);
  const s = useRef(settings);
  s.current = settings;

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const pick = () => {
      germanVoice.current = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("de")) ?? null;
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
    return () => speechSynthesis.removeEventListener("voiceschanged", pick);
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, speed?: number) => {
      stop();
      const cfg = s.current;
      const rate = speed ?? cfg.speed;
      const key = [cfg.ttsMode, cfg.edgeVoice, cfg.elevenVoice, text].join("|");
      try {
        let url = cache.current.get(key);
        if (!url) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
            body: JSON.stringify({ text, voice: cfg.edgeVoice }),
          });
          if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Voice request failed");
          const note = res.headers.get("X-TTS-Note");
          if (note && note !== lastNote.current) {
            lastNote.current = note;
            onNotice(decodeURIComponent(note));
          }
          url = URL.createObjectURL(await res.blob());
          cache.current.set(key, url);
        }
        const audio = new Audio(url);
        audio.playbackRate = rate;
        audio.onplay = () => setSpeaking(true);
        audio.onended = audio.onpause = audio.onerror = () => setSpeaking(false);
        audioRef.current = audio;
        await audio.play();
      } catch (e) {
        // The browser voice is only usable if it really has a German voice; otherwise it mangles German.
        if (germanVoice.current) {
          onNotice(`${(e as Error).message}. Using your browser's German voice.`);
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "de-DE";
          u.voice = germanVoice.current;
          u.rate = rate;
          u.onstart = () => setSpeaking(true);
          u.onend = u.onerror = () => setSpeaking(false);
          speechSynthesis.speak(u);
        } else {
          onNotice(`Couldn't play the voice: ${(e as Error).message}`);
          setSpeaking(false);
        }
      }
    },
    [stop, onNotice],
  );

  return { speak, stop, speaking };
}
