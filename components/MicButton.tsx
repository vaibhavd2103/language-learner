"use client";

import { MicIcon, StopIcon } from "./Icons";

type Props = { recording: boolean; disabled: boolean; onClick: () => void };

export default function MicButton({ recording, disabled, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={recording ? "Stop recording and send" : "Start recording"}
      aria-pressed={recording}
      title="Click to talk (or press Space)"
      className={`flex h-14 w-14 flex-none items-center justify-center rounded-full text-2xl sm:h-16 sm:w-16 sm:text-[1.7rem] ${
        recording ? "mic-rec border border-transparent bg-danger text-canvas" : "neu-accent"
      } disabled:cursor-default disabled:opacity-50`}
    >
      {recording ? <StopIcon /> : <MicIcon />}
    </button>
  );
}
