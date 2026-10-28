"use client";

import type { Status } from "@/lib/types";

const LABEL: Record<Status, string> = {
  idle: "Idle – press the mic and speak German",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};
const COLOR: Record<Status, string> = {
  idle: "bg-slate-500",
  listening: "bg-rose-500",
  thinking: "bg-amber-400",
  speaking: "bg-emerald-400",
};
const SHAPE = [0.45, 0.75, 1, 0.65, 0.9, 0.55, 1, 0.7, 0.5];

export default function StatusBar({ status, level }: { status: Status; level: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-8 w-24 items-center justify-center gap-1" aria-hidden>
        {SHAPE.map((k, i) => (
          <span
            key={i}
            className={`h-full w-1.5 origin-center rounded-full ${COLOR[status]} ${status === "speaking" ? "bar-speaking" : ""}`}
            style={{
              transform: status === "listening" ? `scaleY(${Math.max(0.12, level * k)})` : status === "speaking" ? undefined : "scaleY(0.12)",
              animationDelay: `${i * 0.08}s`,
              transition: status === "listening" ? "transform 60ms linear" : undefined,
            }}
          />
        ))}
      </div>
      <span className="flex items-center gap-2 text-sm text-slate-300" role="status">
        <span className={`h-2 w-2 rounded-full ${COLOR[status]} ${status !== "idle" ? "animate-pulse" : ""}`} />
        {LABEL[status]}
      </span>
    </div>
  );
}
