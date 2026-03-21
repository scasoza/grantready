import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob)) {
      throw new Error("Missing or invalid 'audio' file in form data.");
    }

    // Check minimum size — very short recordings produce hallucinations
    if (audio.size < 1000) {
      return NextResponse.json({ transcript: "", error: "Recording too short" });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "audio/webm",
                data: base64Audio,
              },
            },
            {
              text: `Transcribe the spoken words in this audio recording.
RULES:
- Return ONLY the exact words spoken, nothing else.
- If the audio is silent, empty, or unintelligible, return exactly: [no speech detected]
- Do NOT make up or hallucinate any content.
- Do NOT add any commentary, notes, or formatting.
- Transcribe in the language spoken (likely English or Spanish).`,
            },
          ],
        },
      ],
    });

    const raw = response.text?.trim() ?? "";
    const transcript = raw === "[no speech detected]" ? "" : raw;
    return NextResponse.json({ transcript });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to transcribe audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
