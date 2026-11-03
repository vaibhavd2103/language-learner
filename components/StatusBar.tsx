"use client";

import type { Status } from "@/lib/types";

const LABEL: Record<Status, string> = {
  idle: "Ready – press the mic and speak German",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};
const SHORT: Record<Status, string> = { idle: "Ready", listening: "Listening", thinking: "Thinking", speaking: "Speaking" };
const COLOR: Record<Status, string> = {
  idle: "bg-muted/50",
  listening: "bg-danger",
  thinking: "bg-warn",
  speaking: "bg-ok",
};
const SHAPE = [0.45, 0.75, 1, 0.65, 0.9, 0.55, 1, 0.7, 0.5];

export default function StatusBar({ status, level }: { status: Status; level: number }) {
  return (
    <div className="flex items-center gap-3 px-1 pb-3">
      <div className="neu-inset flex h-9 w-24 flex-none items-center justify-center gap-1 rounded-full px-3" aria-hidden>
        {SHAPE.map((k, i) => (
          <span
            key={i}
            className={`h-4 w-1 origin-center rounded-full ${COLOR[status]} ${status === "speaking" ? "bar-speaking" : ""}`}
            style={{
              transform: status === "listening" ? `scaleY(${Math.max(0.15, level * k)})` : status === "speaking" ? undefined : "scaleY(0.15)",
              animationDelay: `${i * 0.08}s`,
              transition: status === "listening" ? "transform 60ms linear" : undefined,
            }}
          />
        ))}
      </div>
      <span className="flex min-w-0 items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
        <span className={`h-2 w-2 flex-none rounded-full ${COLOR[status]} ${status !== "idle" ? "animate-pulse" : ""}`} />
        <span className="truncate sm:hidden">{SHORT[status]}</span>
        <span className="hidden truncate sm:inline">{LABEL[status]}</span>
      </span>
    </div>
  );
}
