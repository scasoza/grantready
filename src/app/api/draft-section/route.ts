import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

const SUFFICIENCY_SYSTEM = `You evaluate whether a childcare center director's input contains enough substance to write a compelling grant narrative section.

RULES:
- The input must contain at least ONE specific detail: a number, a name, an example, a concrete situation, or a real challenge.
- Generic, placeholder, or test inputs like "testing", "asdf", "hello", "I need money" are INSUFFICIENT.
- Very short inputs (under 20 meaningful words) are usually INSUFFICIENT unless they contain specific data.
- You are looking for substance, not polish. Informal language is fine as long as it contains real information.

Return ONLY valid JSON with this exact shape:
{"sufficient": true/false, "followUp": "question to ask if insufficient, or null if sufficient"}`;

const WRITER_SYSTEM = `You are a professional grant writer for Texas childcare centers. Transform the director's informal input into a polished, compelling grant narrative.

CRITICAL RULES:
- NEVER address the user/director directly. NEVER write "I am ready to..." or "Please provide..." or ask questions. You are writing the grant section, not having a conversation.
- ALWAYS output a complete grant narrative section, even if the input is brief. Work with whatever you're given.
- Write in third person about the center (e.g., "The center serves..." not "You serve...").
- Include ALL specific numbers, names, and data from the director's input.
- Use professional grant language but keep it genuine — no generic filler.
- Write 3-5 substantial paragraphs. Do NOT cut short.
- NEVER invent data not in the input. NEVER use placeholders like "[insert number]".
- If input is thin, write a compelling narrative around what you have.`;

const CLAIMS_SYSTEM = `Extract all specific factual claims from the text — numbers, names, dates, statistics, dollar amounts, percentages, and concrete assertions. Return ONLY valid JSON as an array: [{"claimText": "description of what is claimed", "claimValue": "the specific value"}]. If none exist, return [].`;

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

function parseJSON(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function parseClaims(raw: string): Claim[] {
  try {
    const parsed = parseJSON(raw);
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
      .filter((item) => item.claimText.length > 0);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generation metering for free-tier users
    const { data: centerRow } = await supabase
      .from("centers")
      .select("id, subscription_status, ai_generations_this_month, generation_month")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (centerRow && centerRow.subscription_status !== "active") {
      const currentMonth = Number(
        new Date().toISOString().slice(0, 7).replace("-", "")
      );
      let count = (centerRow.ai_generations_this_month as number) ?? 0;
      if (((centerRow.generation_month as number) ?? 0) !== currentMonth) {
        count = 0;
      }
      if (count >= 3) {
        return NextResponse.json(
          { error: "Free tier limit reached (3/month). Upgrade to Pro for unlimited generations.", upgrade: true },
          { status: 403 }
        );
      }
      await supabase
        .from("centers")
        .update({
          ai_generations_this_month: count + 1,
          generation_month: currentMonth,
        })
        .eq("id", centerRow.id);
    }

    const {
      sectionType,
      sectionTitle,
      prompt,
      subPrompts,
      userInput,
      centerData,
    } = (await request.json()) as DraftSectionRequest;

    const ai = getAI();

    // Step 1: Sufficiency check
    const sufficiencyResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: SUFFICIENCY_SYSTEM, maxOutputTokens: 300 },
      contents: `Section: ${sectionTitle}\nExpected content: ${prompt}\nSub-prompts the director should address:\n${(subPrompts ?? []).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDirector's input:\n"${userInput}"`,
    });

    try {
      const sufficiency = parseJSON(sufficiencyResponse.text || "{}") as {
        sufficient?: boolean;
        followUp?: string | null;
      };

      if (sufficiency.sufficient === false) {
        return NextResponse.json({
          draft: null,
          claims: [],
          followUp: sufficiency.followUp || "Can you add more specific details? Numbers, names, and real examples make the strongest applications.",
          insufficient: true,
        });
      }
    } catch {
      // If sufficiency check fails to parse, proceed with drafting
    }

    // Step 2: Generate draft
    const centerDataText = Object.entries(centerData ?? {})
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const narrativePrompt = [
      `Section: ${sectionTitle}`,
      `Grant section prompt: ${prompt}`,
      "",
      "Points the director should address:",
      ...(subPrompts ?? []).map((item, index) => `${index + 1}. ${item}`),
      "",
      "Director's input (use their words and data, write professionally):",
      userInput,
      "",
      "Center data on file:",
      centerDataText || "(none)",
    ].join("\n");

    const draftResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: WRITER_SYSTEM },
      contents: narrativePrompt,
    });

    const draft = draftResponse.text?.trim() || "";

    // Step 3: Extract claims
    const claimsResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: CLAIMS_SYSTEM, maxOutputTokens: 1000 },
      contents: `Extract factual claims from this grant narrative:\n\n${draft}`,
    });

    const claims = parseClaims(claimsResponse.text || "[]");

    return NextResponse.json({ draft, claims, followUp: null, insufficient: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to draft section";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
