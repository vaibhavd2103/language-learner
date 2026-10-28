"use client";

type Props = { recording: boolean; disabled: boolean; onClick: () => void };

export default function MicButton({ recording, disabled, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={recording ? "Stop recording" : "Start recording"}
      title="Click to talk (or press Space)"
      className={`flex h-16 w-16 flex-none items-center justify-center rounded-full text-2xl transition disabled:opacity-40 ${
        recording ? "mic-rec bg-rose-500 text-white" : "bg-amber-400 text-slate-900 hover:bg-amber-300"
      }`}
    >
      {recording ? "■" : "🎤"}
    </button>
  );
}
