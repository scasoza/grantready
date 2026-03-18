import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

type DraftSectionRequest = {
  sectionType: string;
  sectionTitle: string;
  prompt: string;
  subPrompts: string[];
  userInput: string;
  centerData: Record<string, string>;
};

type Claim = {
  claimText: string;
  claimValue: string;
};

const WRITER_SYSTEM_PROMPT =
  "You are a professional grant writer for Texas childcare centers. Your job is to transform the director's informal input into a polished, compelling grant narrative. Write in third person about the center. Include specific numbers and data from the input. Use professional grant language but keep it genuine - avoid generic filler. The section should be 2-4 paragraphs.";

const CLAIMS_SYSTEM_PROMPT =
  "Extract all specific factual claims from the text, including numbers, names, dates, and statistics. Return ONLY valid JSON as an array of objects with exactly this shape: [{\"claimText\": string, \"claimValue\": string}]. If none exist, return [].";

function extractTextFromResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseClaims(raw: string): Claim[] {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  const parsed: unknown = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Claims response was not an array");
  }

  return parsed
    .filter((item): item is { claimText?: unknown; claimValue?: unknown } =>
      typeof item === "object" && item !== null
    )
    .map((item) => ({
      claimText:
        typeof item.claimText === "string" ? item.claimText.trim() : "",
      claimValue:
        typeof item.claimValue === "string" ? item.claimValue.trim() : "",
    }))
    .filter((item) => item.claimText.length > 0 || item.claimValue.length > 0);
}

export async function POST(request: Request) {
  try {
    const {
      sectionType,
      sectionTitle,
      prompt,
      subPrompts,
      userInput,
      centerData,
    } = (await request.json()) as DraftSectionRequest;

    const anthropic = new Anthropic();

    const centerDataText = Object.entries(centerData ?? {})
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const narrativeUserPrompt = [
      `Section Type: ${sectionType}`,
      `Section Title: ${sectionTitle}`,
      "",
      "Primary Prompt:",
      prompt,
      "",
      "Sub-prompts:",
      ...(subPrompts ?? []).map((item, index) => `${index + 1}. ${item}`),
      "",
      "Director Input:",
      userInput,
      "",
      "Relevant Center Data:",
      centerDataText || "(none provided)",
    ].join("\n");

    const draftResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: WRITER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: narrativeUserPrompt }],
    });

    const draft = extractTextFromResponse(draftResponse);

    const claimsResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: CLAIMS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Draft to analyze:\n\n${draft}`,
        },
      ],
    });

    const claimsRaw = extractTextFromResponse(claimsResponse);
    const claims = parseClaims(claimsRaw);

    return NextResponse.json({ draft, claims });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to draft section";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
