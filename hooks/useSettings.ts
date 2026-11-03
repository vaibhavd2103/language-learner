"use client";

import { useCallback, useEffect, useState } from "react";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export type Settings = {
  level: (typeof LEVELS)[number];
  topic: string;
  speed: number;
  hideText: boolean;
  autoSpeak: boolean;
  autoCorrect: boolean;
  ttsMode: "auto" | "free";
  edgeVoice: string;
  groqKey: string;
  elevenKey: string;
  elevenVoice: string;
  theme: "system" | "light" | "dark";
};

export const DEFAULT_SETTINGS: Settings = {
  level: "A2",
  topic: "",
  speed: 0.9,
  hideText: true,
  autoSpeak: true,
  autoCorrect: false,
  ttsMode: "auto",
  edgeVoice: "de-DE-SeraphinaMultilingualNeural",
  groqKey: "",
  elevenKey: "",
  elevenVoice: "",
  theme: "system",
};

export const STORAGE_KEY = "deutschstream.settings";

/** Applies the theme choice to <html>; "system" removes the override so the media query decides. */
export function applyTheme(theme: Settings["theme"]) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      setSettings((s) => ({ ...s, ...saved }));
    } catch {}
  }, []);

  useEffect(() => applyTheme(settings.theme), [settings.theme]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    // Keep the user's API keys; reset only the preferences.
    setSettings((s) => {
      const next = { ...DEFAULT_SETTINGS, groqKey: s.groqKey, elevenKey: s.elevenKey };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { settings, update, reset };
}

/** Headers carrying the user's own keys (if any) to our API routes; server env vars are the fallback. */
export function authHeaders(s: Settings): Record<string, string> {
  const h: Record<string, string> = { "x-tts-mode": s.ttsMode };
  if (s.groqKey) h["x-groq-key"] = s.groqKey.trim();
  if (s.elevenKey) h["x-elevenlabs-key"] = s.elevenKey.trim();
  if (s.elevenVoice) h["x-elevenlabs-voice"] = s.elevenVoice.trim();
  return h;
}
