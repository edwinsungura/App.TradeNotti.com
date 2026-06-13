"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, StopIcon, PencilIcon } from "../icons";

export default function NotesPanel({
  tradeId,
  notes,
  onChange,
}: {
  tradeId: string;
  notes: string | null;
  onChange: (notes: string) => void;
}) {
  const [value, setValue] = useState(notes ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const save = async (text: string) => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: text }),
      });
      if (!res.ok) throw new Error("Save failed");
      onChange(text);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("idle");
      setError("Could not save note.");
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await transcribe(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone access was denied.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "note.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Transcription failed");
      const text = (j.text || "").trim();
      if (text) {
        const merged = value ? `${value.trim()}\n\n${text}` : text;
        setValue(merged);
        await save(merged);
      } else {
        setError("Nothing was transcribed — try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  useEffect(() => {
    return () => recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="kicker mb-1">Notes</div>
          <h2 className="text-[15px] font-semibold">What happened</h2>
        </div>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors disabled:opacity-60 ${
            recording
              ? "border-loss/40 bg-loss-soft text-loss"
              : "border-accent/40 bg-accent-bg text-accent hover:bg-accent-bg/70"
          }`}
        >
          {recording ? <StopIcon size={15} /> : <MicIcon size={15} />}
          {recording ? "Stop" : transcribing ? "Transcribing…" : "Record note"}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-loss-soft px-3 py-2 text-[12px] text-loss">
          {error}
        </p>
      )}

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value !== (notes ?? "") && save(value)}
        placeholder="Write what happened, or tap Record note to dictate and auto-transcribe…"
        rows={6}
        className="w-full resize-y rounded-xl border border-line bg-black/[0.01] px-4 py-3 text-[14px] leading-relaxed text-ink-soft outline-none placeholder:text-faint focus:border-accent/40"
      />

      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-faint">
        <PencilIcon size={12} />
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : "Notes save automatically when you click away."}
      </div>
    </section>
  );
}
