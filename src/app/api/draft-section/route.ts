import { GoogleGenAI } from "@google/genai";
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

const WRITER_SYSTEM =
  "You are a professional grant writer for Texas childcare centers. Your job is to transform the director's informal input into a polished, compelling grant narrative. Write in third person about the center. Include specific numbers and data from the input. Use professional grant language but keep it genuine - avoid generic filler. The section should be 2-4 paragraphs.";

const CLAIMS_SYSTEM =
  "Extract all specific factual claims from the text, including numbers, names, dates, and statistics. Return ONLY valid JSON as an array of objects with exactly this shape: [{\"claimText\": string, \"claimValue\": string}]. If none exist, return [].";

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

function parseClaims(raw: string): Claim[] {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { claimText?: unknown; claimValue?: unknown } =>
          typeof item === "object" && item !== null
      )
      .map((item) => ({
        claimText: typeof item.claimText === "string" ? item.claimText.trim() : "",
        claimValue: typeof item.claimValue === "string" ? item.claimValue.trim() : "",
      }))
      .filter((item) => item.claimText.length > 0 || item.claimValue.length > 0);
  } catch {
    return [];
  }
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

    const ai = getAI();

    const centerDataText = Object.entries(centerData ?? {})
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const narrativePrompt = [
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

    // Generate draft
    const draftResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: WRITER_SYSTEM, maxOutputTokens: 1200 },
      contents: narrativePrompt,
    });

    const draft = draftResponse.text?.trim() || "";

    // Extract claims
    const claimsResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: CLAIMS_SYSTEM, maxOutputTokens: 800 },
      contents: `Draft to analyze:\n\n${draft}`,
    });

    const claims = parseClaims(claimsResponse.text || "[]");

    return NextResponse.json({ draft, claims });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to draft section";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
