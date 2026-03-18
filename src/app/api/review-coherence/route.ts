import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

type CoherenceSection = {
  title: string;
  draft: string;
};

type ReviewCoherenceRequest = {
  sections: CoherenceSection[];
};

type CoherenceIssue = {
  severity: "warning" | "error";
  sections: string[];
  description: string;
};

type CoherenceReview = {
  issues: CoherenceIssue[];
  summary: string;
};

const REVIEW_SYSTEM_PROMPT =
  'You are a grant application reviewer. Analyze these sections for strategic contradictions - places where claims in one section conflict with or undermine claims in another. Focus on: staffing claims vs budget vs sustainability, population numbers across sections, timeline consistency, and whether the overall narrative is coherent. Return JSON with this exact shape: { issues: Array<{ severity: "warning" | "error", sections: string[], description: string }>, summary: string }';

function extractTextFromResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseCoherenceReview(raw: string): CoherenceReview {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");

  const parsed: unknown = JSON.parse(cleaned);

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Review response was not an object");
  }

  const review = parsed as { issues?: unknown; summary?: unknown };
  const issues = Array.isArray(review.issues)
    ? review.issues
        .filter(
          (
            item
          ): item is {
            severity?: unknown;
            sections?: unknown;
            description?: unknown;
          } => typeof item === "object" && item !== null
        )
        .map((item) => ({
          severity: (item.severity === "error" ? "error" : "warning") as "error" | "warning",
          sections: Array.isArray(item.sections)
            ? item.sections.filter(
                (value): value is string => typeof value === "string"
              )
            : [],
          description:
            typeof item.description === "string" ? item.description : "",
        }))
        .filter((item) => item.description.length > 0)
    : [];

  return {
    issues,
    summary: typeof review.summary === "string" ? review.summary : "",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewCoherenceRequest;

    if (!Array.isArray(body.sections)) {
      return NextResponse.json(
        { error: "Invalid request body: sections must be an array" },
        { status: 400 }
      );
    }

    const sections: CoherenceSection[] = body.sections
      .filter(
        (section): section is CoherenceSection =>
          typeof section === "object" &&
          section !== null &&
          typeof section.title === "string" &&
          typeof section.draft === "string"
      )
      .map((section) => ({
        title: section.title.trim(),
        draft: section.draft.trim(),
      }))
      .filter((section) => section.title.length > 0 || section.draft.length > 0);

    const anthropic = new Anthropic();

    const userPrompt = sections
      .map(
        (section, index) =>
          `Section ${index + 1}: ${section.title || "(untitled)"}\n${section.draft || "(empty draft)"}`
      )
      .join("\n\n---\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = extractTextFromResponse(response);
    const review = parseCoherenceReview(raw);

    return NextResponse.json(review);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to review coherence";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
