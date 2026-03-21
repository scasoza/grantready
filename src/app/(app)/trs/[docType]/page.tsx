"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTrsDocTemplate } from "@/lib/trs-documents";
import { parseStaffMembers } from "@/lib/staff-utils";
import VoiceMemoRecorder from "@/components/VoiceMemoRecorder";
import LoadingScreen from "@/components/LoadingScreen";

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
  const [pageLoading, setPageLoading] = useState(true);

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

      setPageLoading(false);
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

    // Try with input_hash first, fall back without if column doesn't exist yet
    let updateError = null;
    const { error: err1 } = await supabase
      .from("application_sections")
      .update({
        status: "verified",
        input_hash: inputHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);

    if (err1?.message?.includes("input_hash")) {
      // Column doesn't exist yet — save without it
      const { error: err2 } = await supabase
        .from("application_sections")
        .update({
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectionId);
      updateError = err2;
    } else {
      updateError = err1;
    }

    if (updateError) {
      setError("Failed to save: " + updateError.message);
      return;
    }
    setStatus("verified");
    router.replace("/dashboard");
  };

  const allClaimsVerified = claims.length === 0 || claims.every((c) => c.verified);
  const showInput = template?.requiresDirectorInput !== false && (status === "pending" || status === "input_given");

  if (pageLoading) {
    return <LoadingScreen />;
  }

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
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
                      <span className="text-sm font-medium text-brand-700">Transcribing your recording...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice recorder */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <VoiceMemoRecorder
                  disabled={isGenerating || isTranscribing}
                  onRecordingComplete={handleRecordingComplete}
                />
                <p className="text-xs text-warm-400 text-right">
                  or record a voice memo
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={generateDraft}
              disabled={isGenerating || !textInput.trim()}
              className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3.5 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate professional draft"}
            </button>
            {isGenerating && (
              <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
                  <div>
                    <p className="text-sm font-semibold text-warm-900">Writing your professional draft</p>
                    <p className="text-xs text-warm-500">This usually takes 10-15 seconds</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-brand-700">
                    <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Checking your input has enough detail
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-700">
                    <div className="h-4 w-4 animate-pulse rounded-full bg-brand-400" />
                    Drafting professional narrative from your words
                  </div>
                  <div className="flex items-center gap-2 text-xs text-warm-400">
                    <div className="h-4 w-4 rounded-full bg-warm-200" />
                    Extracting facts for verification
                  </div>
                </div>
              </div>
            )}
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
            <div className="rounded-2xl border border-warm-200 bg-white shadow-lg overflow-hidden">
              {/* Document header bar */}
              <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80">GrantReady</p>
                      <p className="text-[10px] text-white/60">TRS Certification Document</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    status === "verified"
                      ? "bg-emerald-400/20 text-emerald-100"
                      : "bg-white/20 text-white"
                  }`}>
                    {status === "verified" ? "Approved" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Document title section */}
              <div className="border-b border-warm-100 px-5 py-4">
                <h3 className="text-lg font-bold text-warm-900">{template.title}</h3>
                <p className="mt-1 text-xs text-warm-400">
                  Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Document body */}
              <div className="px-5 py-5 sm:px-6">
                {aiDraft.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-4 text-sm leading-relaxed text-warm-700 last:mb-0 first:first-letter:text-lg first:first-letter:font-semibold first:first-letter:text-warm-900">
                    {para}
                  </p>
                ))}
              </div>

              {/* Document footer */}
              <div className="border-t border-warm-100 px-5 py-3 bg-warm-50/50">
                <p className="text-[10px] text-warm-400 text-center">
                  Prepared by GrantReady AI for TRS certification
                </p>
              </div>
            </div>

            {/* Claim verification */}
            {claims.length > 0 && status !== "verified" && (
              <div className="bg-white border border-warm-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-warm-900">
                    Verify facts ({claims.filter(c => c.verified).length}/{claims.length})
                  </h3>
                  <span className="text-xs text-warm-400">Tap to confirm each</span>
                </div>
                <div className="space-y-1.5">
                  {claims.map((claim, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                        claim.verified ? "bg-emerald-50 border border-emerald-100" : "bg-warm-50 border border-warm-100"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-warm-600 truncate">
                          {claim.claimText}: <span className="font-semibold text-warm-800">{claim.correctedValue || claim.claimValue}</span>
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
                  className="flex-1 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
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
