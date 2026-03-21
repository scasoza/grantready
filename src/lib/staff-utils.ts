export interface StaffMember {
  id: string;
  name: string;
  role: string;
  hireDate: string;
  cprExpiry: string;
  credentialType: "none" | "cda" | "associates" | "bachelors" | "masters";
  trainingHours: number;
  email: string;
}

export interface StaffAlert {
  staffName: string;
  type: "cpr_expiring" | "cpr_expired" | "low_training" | "no_credential";
  message: string;
  daysUntilExpiry?: number;
}

export function parseStaffMembers(raw: string | null): StaffMember[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is StaffMember =>
        typeof m === "object" && m !== null && typeof m.name === "string"
    );
  } catch {
    return [];
  }
}

export function daysUntil(dateString: string): number | null {
  if (!dateString) return null;
  const target = new Date(dateString + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStaffAlerts(staff: StaffMember[]): StaffAlert[] {
  const alerts: StaffAlert[] = [];
  for (const member of staff) {
    const days = daysUntil(member.cprExpiry);
    if (days !== null && days < 0) {
      alerts.push({
        staffName: member.name,
        type: "cpr_expired",
        message: `${member.name}'s CPR certification expired ${Math.abs(days)} days ago`,
        daysUntilExpiry: days,
      });
    } else if (days !== null && days <= 30) {
      alerts.push({
        staffName: member.name,
        type: "cpr_expiring",
        message: `${member.name}'s CPR expires in ${days} days`,
        daysUntilExpiry: days,
      });
    }
    if (member.trainingHours < 24) {
      alerts.push({
        staffName: member.name,
        type: "low_training",
        message: `${member.name} has ${member.trainingHours}/24 required training hours`,
      });
    }
    if (member.credentialType === "none") {
      alerts.push({
        staffName: member.name,
        type: "no_credential",
        message: `${member.name} has no documented credential`,
      });
    }
  }
  return alerts;
}

export function isStaffCompliant(staff: StaffMember[]): boolean {
  if (staff.length === 0) return false;
  return staff.every((m) => {
    const days = daysUntil(m.cprExpiry);
    return (
      days !== null && days > 0 &&
      m.trainingHours >= 24 &&
      m.credentialType !== "none"
    );
  });
}
