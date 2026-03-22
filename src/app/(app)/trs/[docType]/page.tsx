"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTrsDocTemplate } from "@/lib/trs-documents";
import { parseStaffMembers } from "@/lib/staff-utils";
import VoiceMemoRecorder from "@/components/VoiceMemoRecorder";
import LoadingScreen from "@/components/LoadingScreen";
import Logo from "@/components/Logo";

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

  // Redirect self_assessment to its dedicated checklist UI
  useEffect(() => {
    if (docType === "self_assessment") {
      router.replace("/trs/self-assessment");
    }
  }, [docType, router]);

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
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Staff binder auto-generation for newly created section
        if (!template.requiresDirectorInput && newSection) {
          autoGenerateStaffBinder(center, newSection.id);
        }
      }

      // Staff binder auto-generation for existing section still in pending
      if (existingSection && !template.requiresDirectorInput) {
        if (!existingSection.status || existingSection.status === "pending") {
          autoGenerateStaffBinder(center, existingSection.id);
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

  // Image handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const compressAndEncodeImage = (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        resolve({ mimeType: "image/jpeg", data: base64 });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Generate draft
  const generateDraft = async () => {
    if (!textInput.trim() && uploadedImages.length === 0) {
      setError("Please provide your input first - text, voice, or upload a document photo.");
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

      // Compress and encode uploaded images
      let encodedImages: { mimeType: string; data: string }[] = [];
      if (uploadedImages.length > 0) {
        encodedImages = await Promise.all(
          uploadedImages.map((img) => compressAndEncodeImage(img.file))
        );
      }

      const response = await fetch("/api/draft-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: docType,
          sectionTitle: template?.title || docType,
          prompt: template?.prompt || "",
          subPrompts: template?.subPrompts || [],
          userInput: textInput || "(See uploaded document photos)",
          centerData,
          ...(encodedImages.length > 0 ? { images: encodedImages } : {}),
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
      <nav className="sticky top-0 z-40 bg-brand-700 shadow-md">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 max-w-3xl mx-auto">
          <Link href="/dashboard" className="text-brand-200 hover:text-white transition p-2 -m-2" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{template.title}</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step progress */}
        {template.requiresDirectorInput && (
          <div className="flex items-center gap-1 px-2">
            {[
              { label: "Your input", active: showInput, done: status === "draft_generated" || status === "verified" },
              { label: "AI draft", active: status === "draft_generated" && !allClaimsVerified, done: status === "draft_generated" && allClaimsVerified || status === "verified" },
              { label: "Verify facts", active: status === "draft_generated" && !allClaimsVerified, done: allClaimsVerified && status !== "pending" && status !== "input_given" },
              { label: "Approved", active: false, done: status === "verified" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center flex-1">
                {i > 0 && <div className={`h-px flex-1 mx-1 ${s.done ? "bg-brand-400" : "bg-warm-200"}`} />}
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                    s.done ? "bg-brand-500 text-white" : s.active ? "bg-brand-100 text-brand-700 ring-1.5 ring-brand-400" : "bg-warm-100 text-warm-400"
                  }`}>
                    {s.done ? (
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${s.done ? "text-brand-600" : s.active ? "text-brand-700" : "text-warm-400"}`}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INPUT PHASE */}
        {showInput && (
          <div className="space-y-4">
            {/* Prompt */}
            <div className="bg-white border border-warm-200/80 rounded-2xl p-5">
              <p className="text-warm-800 font-semibold text-base mb-3">{template.prompt}</p>
              {template.subPrompts.length > 0 && (
                <div className="mb-4 bg-brand-50/50 border border-brand-100 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-2">
                    Try to mention:
                  </p>
                  <div className="grid gap-1.5">
                    {template.subPrompts.map((sp, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-warm-600">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-brand-200 bg-white text-[10px] text-brand-400">
                          {textInput.toLowerCase().includes(sp.split(" ")[0].toLowerCase()) ? (
                            <svg className="h-2.5 w-2.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span className="leading-tight">{sp}</span>
                      </div>
                    ))}
                  </div>
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
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    // Auto-resize
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height = Math.max(144, el.scrollHeight) + "px";
                  }}
                  onBlur={() => saveInput(textInput)}
                  placeholder="Just talk naturally — like you're explaining to a parent what a day at your center looks like. Include real numbers and examples when you can."
                  rows={6}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm resize-none leading-relaxed"
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

              {/* Input methods */}
              <div className="mt-3 border-t border-warm-100 pt-3">
                <p className="text-[11px] font-medium text-warm-400 mb-2">Or add input another way:</p>
                <div className="flex items-center gap-3">
                  <VoiceMemoRecorder
                    disabled={isGenerating || isTranscribing}
                    onRecordingComplete={handleRecordingComplete}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-lg bg-warm-50 border border-warm-200 px-3 py-2 text-xs font-medium text-warm-600 hover:bg-warm-100 hover:text-warm-700 transition disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    Photo
                  </button>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Uploaded document ${i + 1}`}
                          className="h-16 w-16 object-cover rounded-lg border border-warm-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <p className="w-full text-[11px] text-warm-400">
                      {uploadedImages.length} photo{uploadedImages.length !== 1 ? "s" : ""} attached
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={generateDraft}
                disabled={isGenerating || (!textInput.trim() && uploadedImages.length === 0)}
                className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Writing your draft...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Generate professional draft
                  </>
                )}
              </button>
              {textInput.trim() && !isGenerating && (
                <p className="text-center text-[11px] text-warm-400">
                  {textInput.split(/\s+/).filter(Boolean).length} words · {uploadedImages.length > 0 ? `${uploadedImages.length} photo${uploadedImages.length !== 1 ? "s" : ""} · ` : ""}AI will expand this into a full document
                </p>
              )}
            </div>
            {isGenerating && (
              <div className="mt-4 rounded-xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative h-10 w-10 shrink-0">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
                    <svg className="absolute inset-0 m-auto h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">AI is writing your document</p>
                    <p className="text-xs text-warm-400">Usually 10-15 seconds</p>
                  </div>
                </div>
                <div className="space-y-3 pl-1">
                  {[
                    { label: "Reading your input", done: true },
                    { label: "Checking for enough detail", done: true },
                    { label: "Writing professional narrative", active: true },
                    { label: "Extracting facts to verify", pending: true },
                  ].map((step, i) => (
                    <div key={i} className={`flex items-center gap-2.5 text-xs ${step.done ? "text-brand-700" : step.active ? "text-brand-600 font-medium" : "text-warm-300"}`}>
                      {step.done ? (
                        <svg className="h-4 w-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : step.active ? (
                        <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-brand-400" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full bg-warm-200" />
                      )}
                      {step.label}
                    </div>
                  ))}
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
            {/* Verified success card */}
            {status === "verified" && (
              <div className="rounded-xl bg-brand-800 p-5 text-center animate-fade-up">
                <svg className="mx-auto h-8 w-8 text-brand-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                <p className="text-base font-bold text-white">{template.title} approved</p>
                <p className="text-xs text-brand-200 mt-1">This document is ready for your TRS application</p>
              </div>
            )}
            <div className="rounded-2xl border border-warm-200 bg-white shadow-lg shadow-warm-200/40 overflow-hidden">
              {/* Document header bar */}
              <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Logo size={28} />
                    <div>
                      <p className="text-xs font-semibold text-white/80">CareLadder</p>
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
              <div className="px-5 py-5 sm:px-8">
                {aiDraft.split("\n\n").map((para, i) => {
                  const trimmed = para.trim();
                  // Detect markdown-style headings
                  if (trimmed.startsWith("## ")) {
                    return <h4 key={i} className="mt-5 mb-2 text-sm font-bold text-warm-900">{trimmed.slice(3)}</h4>;
                  }
                  if (trimmed.startsWith("# ")) {
                    return <h3 key={i} className="mt-5 mb-2 text-base font-bold text-warm-900">{trimmed.slice(2)}</h3>;
                  }
                  return (
                    <p key={i} className="mb-3 text-[13px] leading-[1.8] text-warm-700 last:mb-0">
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Document footer */}
              <div className="border-t border-warm-100 px-5 py-3 bg-warm-50/50">
                <p className="text-[10px] text-warm-400 text-center">
                  Prepared by CareLadder AI for TRS certification
                </p>
              </div>
            </div>

            {/* Claim verification */}
            {claims.length > 0 && status !== "verified" && (
              <div className="bg-white border border-warm-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-warm-900">
                    Verify facts
                  </h3>
                  <span className="text-xs font-semibold text-brand-600">
                    {claims.filter(c => c.verified).length}/{claims.length} confirmed
                  </span>
                </div>
                <p className="text-xs text-warm-400 mb-3">Are these details correct? Tap to confirm or fix.</p>
                {/* Progress bar for claims */}
                <div className="h-1 rounded-full bg-warm-100 mb-3 overflow-hidden">
                  <div
                    className="h-1 rounded-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${claims.length ? (claims.filter(c => c.verified).length / claims.length) * 100 : 0}%` }}
                  />
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
            <div className="space-y-2">
              {status !== "verified" && (
                <button
                  onClick={verifySection}
                  disabled={!allClaimsVerified}
                  className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {allClaimsVerified ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve this document
                    </>
                  ) : (
                    `Verify all ${claims.length} facts first`
                  )}
                </button>
              )}
              {status === "verified" && sectionId && (
                <a
                  href={`/api/export-pdf?docType=${docType}&applicationId=${sectionId}`}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download PDF
                </a>
              )}
              <div className="flex gap-2">
                {template.requiresDirectorInput && status !== "verified" && (
                  <button
                    onClick={() => {
                      setStatus("input_given");
                      setAiDraft("");
                      setClaims([]);
                      setFollowUp(null);
                    }}
                    className="flex-1 bg-warm-50 border border-warm-200 text-warm-600 py-2.5 rounded-xl text-xs font-medium transition hover:bg-warm-100"
                  >
                    Start over
                  </button>
                )}
                <Link
                  href="/dashboard"
                  className="flex-1 text-center bg-warm-50 border border-warm-200 text-warm-600 py-2.5 rounded-xl text-xs font-medium transition hover:bg-warm-100"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
