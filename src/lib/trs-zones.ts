import type { TrsTask } from "./trs-tasks";
import type { StaffAlert } from "./staff-utils";

export type Zone = "attention" | "paperwork" | "prep";

export function getTaskZone(task: TrsTask): Zone | null {
  if (task.id === "submit-application") return null;
  if (task.action?.type === "generate-doc") return "paperwork";
  if (task.action?.type === "self-assessment") return "paperwork";
  return "prep";
}

export interface AttentionItem {
  id: string;
  type: "staff_alert" | "stale_document";
  title: string;
  message: string;
  actionHref: string;
}

export function getAttentionItems(
  staffAlerts: StaffAlert[],
  staleDocs: { docType: string; title: string }[]
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const alert of staffAlerts) {
    items.push({
      id: `staff-${alert.staffName}-${alert.type}`,
      type: "staff_alert",
      title: alert.staffName,
      message: alert.message,
      actionHref: "/staff",
    });
  }

  for (const doc of staleDocs) {
    items.push({
      id: `stale-${doc.docType}`,
      type: "stale_document",
      title: doc.title,
      message: `${doc.title} may need regeneration — underlying data changed`,
      actionHref: `/trs/${doc.docType}`,
    });
  }

  return items;
}
