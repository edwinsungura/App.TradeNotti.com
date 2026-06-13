import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/transcribe  (multipart form-data with field "audio")
// Sends the audio to OpenAI Whisper and returns { text }.
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Transcription is not configured (missing OPENAI_API_KEY)." },
      { status: 501 },
    );
  }

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }
  if (audio.size > 24_000_000) {
    return NextResponse.json({ error: "Audio too large" }, { status: 413 });
  }

  const upstream = new FormData();
  const filename = (audio as File).name || "note.webm";
  upstream.append("file", audio, filename);
  upstream.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  upstream.append("response_format", "json");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[transcribe] OpenAI failed:", res.status, detail);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: (data.text ?? "").trim() });
  } catch (err) {
    console.error("[transcribe] error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
