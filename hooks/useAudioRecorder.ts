"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = { onComplete: (blob: Blob) => void; onError: (message: string) => void };

/** Wraps MediaRecorder and exposes a live 0..1 mic level for the visualizer. */
export function useAudioRecorder({ onComplete, onError }: Options) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cleanup = useRef<() => void>(() => {});
  const cb = useRef({ onComplete, onError });
  cb.current = { onComplete, onError };

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      let raf = 0;
      let last = 0;
      const tick = (t: number) => {
        if (t - last > 50) {
          analyser.getByteFrequencyData(buf);
          setLevel(Math.min(1, buf.reduce((a, b) => a + b, 0) / buf.length / 90));
          last = t;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanup.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((tr) => tr.stop());
        void ctx.close();
        setLevel(0);
      };
      rec.onstop = () => {
        cleanup.current();
        const blob = new Blob(chunks.current, { type: rec.mimeType });
        // very short clips are accidental clicks
        if (blob.size >= 1500) cb.current.onComplete(blob);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      cb.current.onError("Microphone access is blocked or unavailable. Allow it in the browser's address bar and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.state === "recording" && recRef.current.stop();
    setRecording(false);
  }, []);

  useEffect(() => () => cleanup.current(), []);

  return { recording, level, start, stop };
}
