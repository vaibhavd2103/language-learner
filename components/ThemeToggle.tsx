"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/hooks/useSettings";
import { MoonIcon, SunIcon } from "./Icons";

/** Quick light/dark switch for the header. Resolves "system" to what's currently shown, then flips it. */
export default function ThemeToggle({ theme, onChange }: { theme: Settings["theme"]; onChange: (t: Settings["theme"]) => void }) {
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const dark = theme === "dark" || (theme === "system" && systemDark);
  return (
    <button
      onClick={() => onChange(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="neu-btn flex h-11 w-11 items-center justify-center rounded-full text-xl"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
