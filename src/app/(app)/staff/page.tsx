"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

type CredentialType = "none" | "cda" | "associates" | "bachelors" | "masters";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  hireDate: string;
  cprExpiry: string;
  credentialType: CredentialType;
  trainingHours: number;
  email: string;
}

interface CenterRow {
  id: string;
}

interface CenterDataRow {
  data_value: string | null;
}

interface EditableStaffDraft {
  name: string;
  role: string;
  hireDate: string;
  cprExpiry: string;
  credentialType: CredentialType;
  trainingHours: string;
  email: string;
}

const credentialLabels: Record<CredentialType, string> = {
  none: "No credential",
  cda: "CDA",
  associates: "Associate",
  bachelors: "Bachelor",
  masters: "Master",
};

const credentialBadgeStyles: Record<CredentialType, string> = {
  none: "bg-warm-100 text-warm-600 border border-warm-200",
  cda: "bg-blue-100 text-blue-700 border border-blue-200",
  associates: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  bachelors: "bg-brand-100 text-brand-700 border border-brand-200",
  masters: "bg-violet-100 text-violet-700 border border-violet-200",
};

function isCredentialType(value: string): value is CredentialType {
  return ["none", "cda", "associates", "bachelors", "masters"].includes(value);
}

function parseStaffMembers(rawValue: string | null): StaffMember[] {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => {
        const credential = String(item.credentialType ?? "none");
        const rawTraining = Number(item.trainingHours ?? 0);

        return {
          id: String(item.id ?? crypto.randomUUID()),
          name: String(item.name ?? "").trim(),
          role: String(item.role ?? "").trim(),
          hireDate: String(item.hireDate ?? ""),
          cprExpiry: String(item.cprExpiry ?? ""),
          credentialType: isCredentialType(credential) ? credential : "none",
          trainingHours: Number.isFinite(rawTraining) ? rawTraining : 0,
          email: String(item.email ?? "").trim(),
        };
      });
  } catch {
    return [];
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return "Not set";

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateString: string): number | null {
  if (!dateString) return null;

  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getCprStatus(days: number | null) {
  if (days === null) {
    return {
      tone: "text-warm-500",
      badge: "bg-warm-100 text-warm-600 border border-warm-200",
      label: "No expiry set",
    };
  }

  if (days < 30) {
    return {
      tone: "text-red-700",
      badge: "bg-red-100 text-red-700 border border-red-200",
      label: days < 0 ? "Expired" : "Urgent",
    };
  }

  if (days < 90) {
    return {
      tone: "text-amber-700",
      badge: "bg-amber-100 text-amber-700 border border-amber-200",
      label: "Due soon",
    };
  }

  return {
    tone: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    label: "Current",
  };
}

function toDraft(member: StaffMember): EditableStaffDraft {
  return {
    name: member.name,
    role: member.role,
    hireDate: member.hireDate,
    cprExpiry: member.cprExpiry,
    credentialType: member.credentialType,
    trainingHours: String(member.trainingHours),
    email: member.email,
  };
}

const emptyAddForm = {
  name: "",
  role: "",
  hireDate: "",
  email: "",
  cprExpiry: "",
  trainingHours: "",
  credentialType: "none" as CredentialType,
};

export default function StaffTrackerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [centerId, setCenterId] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableStaffDraft | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: centers, error: centerError } = await supabase
        .from("centers")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (centerError) {
        setErrorMessage(centerError.message);
        setLoading(false);
        return;
      }

      const center = (centers?.[0] as CenterRow | undefined) ?? null;
      if (!center) {
        router.replace("/onboarding");
        return;
      }

      setCenterId(center.id);

      const { data: centerData, error: dataError } = await supabase
        .from("center_data")
        .select("data_value")
        .eq("center_id", center.id)
        .eq("data_key", "staff_members")
        .maybeSingle();

      if (dataError) {
        setErrorMessage(dataError.message);
        setLoading(false);
        return;
      }

      const row = (centerData as CenterDataRow | null) ?? null;
      setStaffMembers(parseStaffMembers(row?.data_value ?? null));
      setLoading(false);
    };

    void loadData();
  }, [router, supabase]);

  const cprExpiringStaff = useMemo(
    () =>
      staffMembers.filter((member) => {
        const days = daysUntil(member.cprExpiry);
        return days !== null && days < 90;
      }),
    [staffMembers]
  );

  const trainingGapStaff = useMemo(
    () => staffMembers.filter((member) => member.trainingHours < 24),
    [staffMembers]
  );

  const subtitle = useMemo(() => {
    const cprCount = cprExpiringStaff.length;
    const trainingCount = trainingGapStaff.length;

    const cprText =
      cprCount === 1
        ? "1 staff needs CPR renewal"
        : `${cprCount} staff need CPR renewal`;

    const trainingText =
      trainingCount === 1
        ? "1 below training hours"
        : `${trainingCount} below training hours`;

    return `${cprText}, ${trainingText}`;
  }, [cprExpiringStaff.length, trainingGapStaff.length]);

  const alerts = useMemo(() => {
    const cprAlerts = cprExpiringStaff.map((member) => {
      const days = daysUntil(member.cprExpiry);
      return {
        id: `${member.id}-cpr`,
        name: member.name,
        needed:
          days !== null && days < 0
            ? "CPR/First Aid is expired"
            : `CPR/First Aid expires in ${days} days`,
        action: "Schedule CPR recertification and upload the updated certificate.",
        tone: "border-red-200 bg-red-50 text-red-800",
      };
    });

    const trainingAlerts = trainingGapStaff.map((member) => ({
      id: `${member.id}-training`,
      name: member.name,
      needed: `${member.trainingHours} / 24 annual training hours complete`,
      action: "Assign TRS-aligned PD modules and set a completion checkpoint.",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
    }));

    return [...cprAlerts, ...trainingAlerts];
  }, [cprExpiringStaff, trainingGapStaff]);

  const persistStaff = async (nextStaff: StaffMember[]) => {
    if (!centerId) return;

    setSaving(true);
    setErrorMessage(null);

    const { error } = await supabase.from("center_data").upsert(
      {
        center_id: centerId,
        data_key: "staff_members",
        data_value: JSON.stringify(nextStaff),
      },
      {
        onConflict: "center_id,data_key",
      }
    );

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStaffMembers(nextStaff);
  };

  const handleAddStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = addForm.name.trim();
    const role = addForm.role.trim();
    const email = addForm.email.trim();

    if (!name) {
      setErrorMessage("Name is required.");
      return;
    }

    const parsedHours = Number(addForm.trainingHours);
    const nextStaff: StaffMember[] = [
      {
        id: crypto.randomUUID(),
        name,
        role,
        hireDate: addForm.hireDate,
        cprExpiry: addForm.cprExpiry,
        credentialType: addForm.credentialType,
        trainingHours: Number.isFinite(parsedHours) ? Math.max(0, parsedHours) : 0,
        email,
      },
      ...staffMembers,
    ];

    await persistStaff(nextStaff);
    setShowAddForm(false);
    setAddForm(emptyAddForm);
    setSavedMessage("Staff member saved");
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const startEdit = (member: StaffMember) => {
    setEditId(member.id);
    setEditDraft(toDraft(member));
    setErrorMessage(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDraft(null);
  };

  const saveEdit = async (memberId: string) => {
    if (!editDraft) return;

    const name = editDraft.name.trim();
    const role = editDraft.role.trim();
    const email = editDraft.email.trim();

    if (!name) {
      setErrorMessage("Name is required.");
      return;
    }

    const parsedHours = Number(editDraft.trainingHours);

    const nextStaff = staffMembers.map((member) =>
      member.id === memberId
        ? {
            ...member,
            name,
            role,
            hireDate: editDraft.hireDate,
            cprExpiry: editDraft.cprExpiry,
            credentialType: editDraft.credentialType,
            trainingHours: Number.isFinite(parsedHours) ? Math.max(0, parsedHours) : 0,
            email,
          }
        : member
    );

    await persistStaff(nextStaff);
    cancelEdit();
    setSavedMessage("Staff member saved");
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const handleDelete = async (memberId: string) => {
    const nextStaff = staffMembers.filter((item) => item.id !== memberId);
    await persistStaff(nextStaff);
    setConfirmDeleteId(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Sticky nav matching dashboard */}
      <nav className="sticky top-0 z-40 bg-brand-700 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-brand-200 hover:text-white transition p-2 -m-2" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white">Staff Tracker</h1>
            {staffMembers.length > 0 && (
              <p className="text-xs text-brand-200">{staffMembers.length} staff member{staffMembers.length !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-24 sm:pb-6 space-y-5">
        {/* Stats overview */}
        {staffMembers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
              <p className="text-2xl font-bold text-warm-900">{staffMembers.length}</p>
              <p className="text-[11px] text-warm-400 font-medium">Staff</p>
            </div>
            <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{staffMembers.filter(m => m.credentialType !== "none").length}</p>
              <p className="text-[11px] text-warm-400 font-medium">Credentialed</p>
            </div>
            <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
              <p className={`text-2xl font-bold ${staffMembers.every(m => { const d = daysUntil(m.cprExpiry); return d !== null && d > 0; }) ? "text-emerald-600" : "text-amber-600"}`}>
                {staffMembers.filter(m => { const d = daysUntil(m.cprExpiry); return d !== null && d > 0; }).length}/{staffMembers.length}
              </p>
              <p className="text-[11px] text-warm-400 font-medium">CPR Current</p>
            </div>
            <div className="rounded-xl bg-white border border-warm-100 p-3 text-center">
              <p className={`text-2xl font-bold ${staffMembers.every(m => m.trainingHours >= 24) ? "text-emerald-600" : "text-amber-600"}`}>
                {staffMembers.filter(m => m.trainingHours >= 24).length}/{staffMembers.length}
              </p>
              <p className="text-[11px] text-warm-400 font-medium">24+ Training Hrs</p>
            </div>
          </div>
        )}

        {/* TRS requirement note */}
        {staffMembers.length > 0 && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
            <p className="text-[11px] text-brand-700">
              <span className="font-semibold">TRS requires:</span> All staff must have current CPR/First Aid, 24+ annual training hours, and be registered in TECPDS. Director credential level directly affects your star rating.
            </p>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <section className="space-y-2">
            {alerts.map((alert) => (
              <article key={alert.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${alert.tone}`}>
                <svg className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{alert.name}</p>
                  <p className="text-xs">{alert.needed}</p>
                </div>
              </article>
            ))}
          </section>
        )}
        {alerts.length === 0 && staffMembers.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All certifications current, training hours met. Looking good.
          </div>
        )}

        <section className="rounded-xl border border-warm-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-warm-900">Staff Members</h2>
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setErrorMessage(null);
              }}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
            >
              + Add staff member
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddStaff} className="mt-4 rounded-xl border border-warm-100 bg-warm-50/80 p-4 sm:p-5">
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">New Staff Member</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Name *</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={addForm.name}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Teacher, Director, Assistant"
                    value={addForm.role}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="staff@yourcenter.com"
                    value={addForm.email}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Hire date</label>
                  <input
                    type="date"
                    value={addForm.hireDate}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, hireDate: event.target.value }))}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">CPR expiry date</label>
                  <input
                    type="date"
                    value={addForm.cprExpiry}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, cprExpiry: event.target.value }))}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Training hours this year</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={addForm.trainingHours}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, trainingHours: event.target.value }))}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-warm-500 mb-1 font-semibold">Highest credential</label>
                <select
                  value={addForm.credentialType}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (isCredentialType(val)) setAddForm((prev) => ({ ...prev, credentialType: val }));
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-56"
                >
                  <option value="none">No credential</option>
                  <option value="cda">CDA</option>
                  <option value="associates">Associate&apos;s Degree</option>
                  <option value="bachelors">Bachelor&apos;s Degree</option>
                  <option value="masters">Master&apos;s Degree</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-600 hover:bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition"
                >
                  {saving ? "Saving..." : "Add staff member"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddForm(emptyAddForm);
                  }}
                  className="rounded-lg border border-warm-200 bg-white px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {savedMessage && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {savedMessage}
            </p>
          )}

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {staffMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-warm-300 bg-warm-50/50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-100">
                  <svg className="h-6 w-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-warm-700">Add your team</p>
                <p className="mt-1 text-xs text-warm-500">We&apos;ll track CPR certifications, training hours, and credentials for each staff member.</p>
              </div>
            ) : (
              staffMembers.map((member) => {
                const isEditing = editId === member.id && Boolean(editDraft);
                const cprDays = daysUntil(member.cprExpiry);
                const cprStatus = getCprStatus(cprDays);
                const trainingLow = member.trainingHours < 24;

                const isDirector = member.role.toLowerCase().includes("director");

                return (
                  <article key={member.id} className={`rounded-xl border p-4 ${isDirector ? "border-brand-200 bg-brand-50/30 ring-1 ring-brand-100" : "border-warm-100 bg-white"}`}>
                    {isEditing && editDraft ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="block text-xs text-warm-500 mb-1 font-semibold">Name</label>
                            <input
                              type="text"
                              value={editDraft.name}
                              onChange={(event) =>
                                setEditDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                              }
                              placeholder="Name"
                              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-warm-500 mb-1 font-semibold">Role</label>
                            <input
                              type="text"
                              value={editDraft.role}
                              onChange={(event) =>
                                setEditDraft((prev) => (prev ? { ...prev, role: event.target.value } : prev))
                              }
                              placeholder="Role"
                              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-warm-500 mb-1 font-semibold">Email</label>
                            <input
                              type="email"
                              value={editDraft.email}
                              onChange={(event) =>
                                setEditDraft((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                              }
                              placeholder="Email"
                              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-warm-500 mb-1 font-semibold">Hire date</label>
                            <input
                              type="date"
                              value={editDraft.hireDate}
                              onChange={(event) =>
                                setEditDraft((prev) => (prev ? { ...prev, hireDate: event.target.value } : prev))
                              }
                              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-warm-500 mb-1 font-semibold">CPR expiry date</label>
                            <input
                              type="date"
                              value={editDraft.cprExpiry}
                              onChange={(event) =>
                                setEditDraft((prev) => (prev ? { ...prev, cprExpiry: event.target.value } : prev))
                              }
                              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-warm-500 mb-1 font-semibold">Training hours (annual)</label>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={editDraft.trainingHours}
                              onChange={(event) =>
                                setEditDraft((prev) => (prev ? { ...prev, trainingHours: event.target.value } : prev))
                              }
                              placeholder="Training hours"
                              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-warm-500">
                            Credential
                          </label>
                          <select
                            value={editDraft.credentialType}
                            onChange={(event) => {
                              const value = event.target.value;
                              if (!isCredentialType(value)) return;
                              setEditDraft((prev) => (prev ? { ...prev, credentialType: value } : prev));
                            }}
                            className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-56"
                          >
                            <option value="none">No credential</option>
                            <option value="cda">CDA</option>
                            <option value="associates">Associates</option>
                            <option value="bachelors">Bachelors</option>
                            <option value="masters">Masters</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void saveEdit(member.id)}
                            disabled={saving}
                            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 hover:bg-warm-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-warm-900">{member.name || "Unnamed staff"}</h3>
                              {isDirector && (
                                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">Director</span>
                              )}
                            </div>
                            <p className="text-sm text-warm-500">{member.role || "Role not set"}</p>
                          </div>
                          <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${credentialBadgeStyles[member.credentialType]}`}>
                            {credentialLabels[member.credentialType]}
                          </span>
                        </div>

                        {/* Status indicators */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="rounded-lg bg-white border border-warm-100 px-3 py-2">
                            <p className="text-[10px] text-warm-400 font-medium uppercase tracking-wide">CPR/First Aid</p>
                            <p className={`text-sm font-semibold ${cprStatus.tone}`}>
                              {cprDays === null ? "Not set" : cprDays < 0 ? `Expired ${Math.abs(cprDays)}d ago` : cprDays < 90 ? `${cprDays} days left` : "Current"}
                            </p>
                            {member.cprExpiry && <p className="text-[10px] text-warm-400">Exp: {formatDate(member.cprExpiry)}</p>}
                          </div>
                          <div className="rounded-lg bg-white border border-warm-100 px-3 py-2">
                            <p className="text-[10px] text-warm-400 font-medium uppercase tracking-wide">Training Hours</p>
                            <p className={`text-sm font-semibold ${trainingLow ? "text-amber-700" : "text-emerald-700"}`}>
                              {member.trainingHours}/24 hrs
                            </p>
                            <div className="mt-1 h-1 rounded-full bg-warm-100 overflow-hidden">
                              <div className={`h-1 rounded-full transition-all ${trainingLow ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(100, (member.trainingHours / 24) * 100)}%` }} />
                            </div>
                          </div>
                          <div className="rounded-lg bg-white border border-warm-100 px-3 py-2">
                            <p className="text-[10px] text-warm-400 font-medium uppercase tracking-wide">Hired</p>
                            <p className="text-sm font-medium text-warm-700">{formatDate(member.hireDate)}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(member)}
                            className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-semibold text-warm-700 hover:bg-warm-100 transition"
                          >
                            Edit
                          </button>
                          {confirmDeleteId === member.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-red-600">Remove?</span>
                              <button
                                type="button"
                                onClick={() => void handleDelete(member.id)}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 transition"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(member.id)}
                              className="rounded-lg border border-warm-200 bg-white px-3 py-1.5 text-xs font-medium text-warm-500 hover:text-red-600 hover:border-red-200 transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
