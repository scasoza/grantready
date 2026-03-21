"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTrsDocTemplate } from "@/lib/trs-documents";
import { parseStaffMembers } from "@/lib/staff-utils";
import VoiceMemoRecorder from "@/components/VoiceMemoRecorder";

interface Claim {
  id?: string;
  claimText: string;
  claimValue: string;
  verified: boolean;
  correctedValue?: string;
}

export default function TrsDocPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const docType = params.docType as string;
  const template = getTrsDocTemplate(docType);

  // State
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing section data + ensure records exist
  useEffect(() => {
    async function loadSection() {
      if (!template) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: center } = await supabase
        .from("centers")
        .select("id, center_name, licensed_capacity, enrollment_count, staff_count, county")
        .eq("user_id", user.id)
        .single();

      if (!center) return;
      setCenterId(center.id);

      // Ensure application exists for TRS
      let appId: string;
      const { data: existingApp } = await supabase
        .from("applications")
        .select("id")
        .eq("center_id", center.id)
        .eq("grant_id", "trs")
        .single();

      if (existingApp) {
        appId = existingApp.id;
      } else {
        const { data: newApp } = await supabase
          .from("applications")
          .insert({ center_id: center.id, grant_id: "trs" })
          .select("id")
          .single();
        if (!newApp) return;
        appId = newApp.id;
      }

      // Ensure section exists for this docType
      const { data: existingSection } = await supabase
        .from("application_sections")
        .select("*")
        .eq("application_id", appId)
        .eq("section_type", docType)
        .single();

      if (existingSection) {
        setSectionId(existingSection.id);
        setTextInput(existingSection.text_input || "");
        setAiDraft(existingSection.ai_draft || "");
        setFollowUp(existingSection.ai_follow_up || null);
        setStatus(existingSection.status || "pending");

        // Load claims
        const { data: savedClaims } = await supabase
          .from("verified_claims")
          .select("*")
          .eq("section_id", existingSection.id);
        if (savedClaims) {
          setClaims(
            savedClaims.map((c) => ({
              id: c.id,
              claimText: c.claim_text,
              claimValue: c.claim_value || "",
              verified: c.verified,
              correctedValue: c.corrected_value || undefined,
            }))
          );
        }
      } else {
        const { data: newSection } = await supabase
          .from("application_sections")
          .insert({
            application_id: appId,
            section_type: docType,
            status: "pending",
          })
          .select("id")
          .single();
        if (newSection) {
          setSectionId(newSection.id);
        }
      }

      // Staff binder auto-generation: skip input, generate immediately
      if (!template.requiresDirectorInput) {
        const existingStatus = existingSection?.status;
        if (!existingStatus || existingStatus === "pending") {
          autoGenerateStaffBinder(center, existingSection?.id || sectionId);
        }
      }
    }

    async function autoGenerateStaffBinder(
      center: { id: string; center_name: string | null; licensed_capacity: number | null; enrollment_count: number | null; staff_count: number | null; county: string | null },
      currentSectionId: string | null
    ) {
      setIsGenerating(true);
      setError(null);

      try {
        // Load staff members from center_data
        const { data: staffData } = await supabase
          .from("center_data")
          .select("data_value")
          .eq("center_id", center.id)
          .eq("data_key", "staff_members")
          .maybeSingle();

        const staffMembers = parseStaffMembers(
          (staffData as { data_value: string } | null)?.data_value ?? null
        );

        if (staffMembers.length === 0) {
          setError("No staff members found. Please add staff on the Staff page first.");
          setIsGenerating(false);
          return;
        }

        const centerData: Record<string, string> = {};
        if (center.center_name) centerData.centerName = center.center_name;
        centerData.staffMembers = JSON.stringify(staffMembers);

        const response = await fetch("/api/draft-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType: docType,
            sectionTitle: template!.title,
            prompt: template!.prompt,
            subPrompts: template!.subPrompts,
            userInput: "Auto-generated from staff records.",
            centerData,
          }),
        });

        if (!response.ok) throw new Error("Failed to generate staff binder");
        const result = await response.json();

        setAiDraft(result.draft || "");
        setFollowUp(null);
        setClaims(
          (result.claims || []).map((c: { claimText: string; claimValue: string }) => ({
            ...c,
            verified: false,
          }))
        );

        const sid = currentSectionId;
        if (sid) {
          await supabase.from("verified_claims").delete().eq("section_id", sid);
          await supabase
            .from("application_sections")
            .update({
              ai_draft: result.draft,
              ai_follow_up: null,
              text_input: "Auto-generated from staff records.",
              status: "draft_generated",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sid);
          if (result.claims?.length) {
            await supabase.from("verified_claims").insert(
              result.claims.map((c: { claimText: string; claimValue: string }) => ({
                section_id: sid,
                claim_text: c.claimText,
                claim_value: c.claimValue,
                verified: false,
              }))
            );
          }
        }

        setStatus("draft_generated");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsGenerating(false);
      }
    }

    loadSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, docType]);

  // Save input
  const saveInput = useCallback(
    async (input: string) => {
      if (!sectionId) return;
      await supabase
        .from("application_sections")
        .update({
          text_input: input,
          status: "input_given",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectionId);
    },
    [supabase, sectionId]
  );

  // Handle voice recording complete
  const handleRecordingComplete = async (blob: Blob, _durationSeconds: number) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("audio", blob, "memo.webm");
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (res.ok) {
        const { transcript } = await res.json();
        if (transcript) {
          setTextInput((prev) => (prev ? prev + "\n\n" + transcript : transcript));
        }
      }
    } catch {
      // Transcription failed - user can still type
    } finally {
      setIsTranscribing(false);
    }
  };

  // Generate draft
  const generateDraft = async () => {
    if (!textInput.trim()) {
      setError("Please provide your input first - voice or text.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await saveInput(textInput);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: center } = await supabase
        .from("centers")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      const centerData: Record<string, string> = {};
      if (center) {
        if (center.center_name) centerData.centerName = center.center_name;
        if (center.licensed_capacity)
          centerData.licensedCapacity = String(center.licensed_capacity);
        if (center.enrollment_count)
          centerData.enrollmentCount = String(center.enrollment_count);
        if (center.staff_count) centerData.staffCount = String(center.staff_count);
        if (center.county) centerData.county = center.county;
      }

      const response = await fetch("/api/draft-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: docType,
          sectionTitle: template?.title || docType,
          prompt: template?.prompt || "",
          subPrompts: template?.subPrompts || [],
          userInput: textInput,
          centerData,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate draft");
      const result = await response.json();

      if (result.insufficient) {
        setFollowUp(
          result.followUp ||
            "Can you add more specific details? Numbers, names, and real examples make the strongest documents."
        );
        setStatus("input_given");
        if (sectionId) {
          await supabase
            .from("application_sections")
            .update({
              ai_follow_up: result.followUp,
              status: "input_given",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sectionId);
        }
        return;
      }

      setAiDraft(result.draft || "");
      setFollowUp(null);
      setClaims(
        (result.claims || []).map((c: { claimText: string; claimValue: string }) => ({
          ...c,
          verified: false,
        }))
      );

      if (sectionId) {
        await supabase.from("verified_claims").delete().eq("section_id", sectionId);
        await supabase
          .from("application_sections")
          .update({
            ai_draft: result.draft,
            ai_follow_up: null,
            status: "draft_generated",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sectionId);
        if (result.claims?.length) {
          await supabase.from("verified_claims").insert(
            result.claims.map((c: { claimText: string; claimValue: string }) => ({
              section_id: sectionId,
              claim_text: c.claimText,
              claim_value: c.claimValue,
              verified: false,
            }))
          );
        }
      }

      setStatus("draft_generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  // Verify claim
  const toggleClaim = async (index: number, verified: boolean) => {
    const updated = [...claims];
    updated[index].verified = verified;
    setClaims(updated);
    if (updated[index].id) {
      await supabase.from("verified_claims").update({ verified }).eq("id", updated[index].id);
    }
  };

  // Correct claim
  const correctClaim = async (index: number, correctedValue: string) => {
    const updated = [...claims];
    updated[index].correctedValue = correctedValue;
    setClaims(updated);
    if (updated[index].id) {
      await supabase
        .from("verified_claims")
        .update({ corrected_value: correctedValue })
        .eq("id", updated[index].id);
    }
  };

  // Approve / verify document
  const verifySection = async () => {
    if (!sectionId) {
      setError("Section not saved yet - try refreshing the page.");
      return;
    }

    // Compute input_hash from center data
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: center } = await supabase
      .from("centers")
      .select("center_name, licensed_capacity, enrollment_count, staff_count, county")
      .eq("user_id", user?.id)
      .single();

    const inputHash = JSON.stringify({ ...center });

    const { error: updateError } = await supabase
      .from("application_sections")
      .update({
        status: "verified",
        input_hash: inputHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);

    if (updateError) {
      setError("Failed to save: " + updateError.message);
      return;
    }
    setStatus("verified");
    router.push("/dashboard");
  };

  const allClaimsVerified = claims.length === 0 || claims.every((c) => c.verified);
  const showInput = template?.requiresDirectorInput !== false && (status === "pending" || status === "input_given");

  if (!template) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <p className="text-warm-500">Document type not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-warm-200/40 shadow-sm">
        <div className="px-4 sm:px-6 py-3.5 flex items-center gap-3 max-w-3xl mx-auto">
          <Link href="/dashboard" className="text-warm-400 hover:text-warm-600 transition p-2 -m-2" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-warm-900 truncate">{template.title}</h1>
            <p className="text-xs text-warm-400">TRS Document</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* INPUT PHASE */}
        {showInput && (
          <div className="space-y-4">
            {/* Prompt */}
            <div className="bg-white border border-warm-200/80 rounded-2xl p-5">
              <p className="text-warm-800 font-semibold text-base mb-3">{template.prompt}</p>
              {template.subPrompts.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide">
                    Try to cover:
                  </p>
                  {template.subPrompts.map((sp, i) => (
                    <div key={i} className="flex gap-2 text-sm text-warm-600">
                      <span className="text-brand-500 font-bold">{i + 1}.</span>
                      <span>{sp}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Follow-up prompt */}
              {followUp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-sm font-semibold text-amber-800 mb-1">We need a bit more:</p>
                  <p className="text-sm text-amber-700">{followUp}</p>
                </div>
              )}

              {/* Unified input: editable textarea + mic button */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onBlur={() => saveInput(textInput)}
                  placeholder="Talk naturally - like you're explaining to someone who asked about your center. Specific numbers and real examples make the strongest documents."
                  rows={6}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 pr-14 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm resize-none"
                />
                {isTranscribing && (
                  <div className="absolute top-3 right-3 text-xs text-warm-400 animate-pulse">
                    Transcribing...
                  </div>
                )}
              </div>

              {/* Voice recorder - below the textarea */}
              <div className="mt-3 flex items-center gap-3">
                <VoiceMemoRecorder
                  disabled={isGenerating || isTranscribing}
                  onRecordingComplete={handleRecordingComplete}
                />
                <p className="text-xs text-warm-400 flex-1">
                  Record a voice memo - it will be transcribed and added to the text above for editing.
                </p>
              </div>

              <p className="text-xs text-warm-400 mt-3">
                Tip: &quot;34 kids on our waitlist&quot; beats &quot;many families need care.&quot;
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={generateDraft}
              disabled={isGenerating || !textInput.trim()}
              className="w-full bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-3.5 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Writing your draft..." : "Generate professional draft"}
            </button>
          </div>
        )}

        {/* Staff binder: generating state */}
        {!template.requiresDirectorInput && isGenerating && (
          <div className="bg-white border border-warm-200/80 rounded-2xl p-5 text-center">
            <p className="text-warm-700 font-semibold mb-2">Generating from your staff records...</p>
            <p className="text-sm text-warm-400">This usually takes a few seconds.</p>
          </div>
        )}

        {/* Staff binder: error with no input phase */}
        {!template.requiresDirectorInput && error && !aiDraft && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* DRAFT PHASE */}
        {aiDraft && (status === "draft_generated" || status === "verified") && (
          <div className="space-y-4">
            <div className="bg-white border border-warm-200/80 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-warm-900">Document Draft</h2>
                {status === "verified" && (
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                    Approved
                  </span>
                )}
              </div>
              <div className="prose prose-sm text-warm-700 whitespace-pre-wrap">{aiDraft}</div>
            </div>

            {/* Claim verification */}
            {claims.length > 0 && status !== "verified" && (
              <div className="bg-white border border-warm-200/80 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-warm-900 mb-1">
                  Quick check - are these facts right?
                </h3>
                <p className="text-xs text-warm-400 mb-4">Verify each claim before approving.</p>
                <div className="space-y-3">
                  {claims.map((claim, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-warm-700">
                          {claim.claimText}:{" "}
                          <span className="font-semibold text-warm-900">
                            {claim.correctedValue || claim.claimValue}
                          </span>
                        </p>
                        {claim.correctedValue !== undefined && !claim.verified && (
                          <input
                            type="text"
                            value={claim.correctedValue}
                            onChange={(e) => correctClaim(i, e.target.value)}
                            className="mt-2 w-full bg-white border border-warm-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            placeholder="Correct value..."
                          />
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleClaim(i, true)}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                            claim.verified
                              ? "bg-brand-500 text-white"
                              : "bg-warm-100 text-warm-500 hover:bg-brand-50 hover:text-brand-600"
                          }`}
                        >
                          &#10003;
                        </button>
                        <button
                          onClick={() => {
                            if (claim.correctedValue === undefined)
                              correctClaim(i, claim.claimValue);
                            toggleClaim(i, false);
                          }}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                            !claim.verified && claim.correctedValue !== undefined
                              ? "bg-amber-500 text-white"
                              : "bg-warm-100 text-warm-500 hover:bg-amber-50 hover:text-amber-600"
                          }`}
                        >
                          Fix
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {template.requiresDirectorInput && (
                <button
                  onClick={() => {
                    setStatus("input_given");
                    setAiDraft("");
                    setClaims([]);
                    setFollowUp(null);
                  }}
                  className="flex-1 bg-warm-100 text-warm-700 py-3 rounded-xl font-semibold text-sm transition hover:bg-warm-200"
                >
                  Re-do my input
                </button>
              )}
              {status !== "verified" && (
                <button
                  onClick={verifySection}
                  disabled={!allClaimsVerified}
                  className="flex-1 bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-3 rounded-xl font-semibold text-sm transition shadow-md shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allClaimsVerified ? "Looks good - approve" : "Verify all claims first"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
