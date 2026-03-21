import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SectionInput = {
  title: string;
  draft: string;
};

type CoherenceIssue = {
  severity: "warning" | "error";
  sections: string[];
  description: string;
};

const SYSTEM_PROMPT =
  'You are a grant application reviewer. Analyze these sections for strategic contradictions - places where claims in one section conflict with or undermine claims in another. Focus on: staffing claims vs budget vs sustainability, population numbers across sections, timeline consistency, and whether the overall narrative is coherent. Return ONLY valid JSON with this exact shape: { "issues": [{ "severity": "warning" | "error", "sections": ["section1", "section2"], "description": "what conflicts" }], "summary": "overall assessment" }';

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

function parseReview(raw: string): {
  issues: CoherenceIssue[];
  summary: string;
} {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const review = JSON.parse(cleaned);

    const issues: CoherenceIssue[] = Array.isArray(review.issues)
      ? review.issues
          .map(
            (item: {
              severity?: string;
              sections?: unknown[];
              description?: string;
            }) => ({
              severity: (item.severity === "error" ? "error" : "warning") as
                | "error"
                | "warning",
              sections: Array.isArray(item.sections)
                ? item.sections.filter(
                    (value): value is string => typeof value === "string"
                  )
                : [],
              description:
                typeof item.description === "string" ? item.description : "",
            })
          )
          .filter(
            (item: CoherenceIssue) => item.description.length > 0
          )
      : [];

    return {
      issues,
      summary: typeof review.summary === "string" ? review.summary : "",
    };
  } catch {
    return { issues: [], summary: "Unable to parse coherence review." };
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sections } = (await request.json()) as { sections: SectionInput[] };

    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { issues: [], summary: "No sections provided." },
        { status: 200 }
      );
    }

    const ai = getAI();

    const sectionsText = sections
      .map((s) => `## ${s.title}\n\n${s.draft}`)
      .join("\n\n---\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 1000 },
      contents: `Review these grant application sections for coherence:\n\n${sectionsText}`,
    });

    const result = parseReview(response.text || "{}");
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to review coherence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
