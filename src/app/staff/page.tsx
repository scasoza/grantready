"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  id: number;
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
};

export default function StaffTrackerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [centerId, setCenterId] = useState<number | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableStaffDraft | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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

    const nextStaff: StaffMember[] = [
      {
        id: crypto.randomUUID(),
        name,
        role,
        hireDate: addForm.hireDate,
        cprExpiry: "",
        credentialType: "none",
        trainingHours: 0,
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

  const handleDelete = async (member: StaffMember) => {
    const confirmed = window.confirm(`Delete ${member.name} from staff records?`);
    if (!confirmed) return;

    const nextStaff = staffMembers.filter((item) => item.id !== member.id);
    await persistStaff(nextStaff);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-warm-200 bg-white p-6 text-warm-700">
          Loading staff tracker...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-warm-600 hover:text-warm-900"
          >
            ← Dashboard
          </Link>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-warm-900 sm:text-3xl">Staff Tracker</h1>
            <p className="mt-1 text-sm text-warm-600">{subtitle}</p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-500">Alerts</h2>
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              No active compliance alerts right now.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {alerts.map((alert) => (
                <article key={alert.id} className={`rounded-2xl border p-4 ${alert.tone}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide">{alert.name}</p>
                  <p className="mt-1 text-sm font-semibold">{alert.needed}</p>
                  <p className="mt-1 text-xs">Suggested action: {alert.action}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-warm-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-warm-900">Staff Members</h2>
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setErrorMessage(null);
              }}
              className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/20 hover:from-brand-600 hover:to-brand-700"
            >
              + Add staff member
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddStaff} className="mt-4 rounded-2xl border border-warm-200 bg-warm-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={addForm.name}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Role</label>
                  <input
                    type="text"
                    placeholder="Lead Teacher"
                    value={addForm.role}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Hire date</label>
                  <input
                    type="date"
                    value={addForm.hireDate}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, hireDate: event.target.value }))}
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={addForm.email}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddForm(emptyAddForm);
                  }}
                  className="rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 hover:bg-warm-50"
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
              <div className="rounded-2xl border border-warm-200 bg-warm-50 p-5 text-sm text-warm-600">
                No staff members added yet.
              </div>
            ) : (
              staffMembers.map((member) => {
                const isEditing = editId === member.id && Boolean(editDraft);
                const cprDays = daysUntil(member.cprExpiry);
                const cprStatus = getCprStatus(cprDays);
                const trainingLow = member.trainingHours < 24;

                return (
                  <article key={member.id} className="rounded-2xl border border-warm-200 bg-warm-50 p-4">
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
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-warm-900">{member.name || "Unnamed staff"}</h3>
                            <p className="text-sm text-warm-600">{member.role || "Role not set"}</p>
                            <p className="text-xs text-warm-500">{member.email || "No email"}</p>
                          </div>

                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${credentialBadgeStyles[member.credentialType]}`}>
                            {credentialLabels[member.credentialType]}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <div className="rounded-xl border border-warm-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">Hire date</p>
                            <p className="mt-1 font-semibold text-warm-800">{formatDate(member.hireDate)}</p>
                          </div>

                          <div className="rounded-xl border border-warm-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">CPR / First Aid</p>
                            <p className={`mt-1 font-semibold ${cprStatus.tone}`}>{formatDate(member.cprExpiry)}</p>
                            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cprStatus.badge}`}>
                              {cprStatus.label}
                            </span>
                          </div>

                          <div className="rounded-xl border border-warm-200 bg-white p-3 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">Training hours this year</p>
                            <div className="mt-1 flex items-center gap-2">
                              <p className={`font-semibold ${trainingLow ? "text-amber-700" : "text-emerald-700"}`}>
                                {member.trainingHours} hours
                              </p>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  trainingLow
                                    ? "border border-amber-200 bg-amber-100 text-amber-700"
                                    : "border border-emerald-200 bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {trainingLow ? "Below 24" : "Meets 24+"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(member)}
                            className="rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 hover:bg-warm-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(member)}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
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
