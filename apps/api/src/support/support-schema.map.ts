import type {
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketType,
} from "@impulsionando/contracts";
import { SupportTicketType as SupportTicketTypeSchema } from "@impulsionando/contracts";

/** Staging CRM DB priority values (check constraint). */
export type DbPriority = "low" | "normal" | "high" | "critical";

/** Staging CRM DB status values (check constraint). */
export type DbStatus =
  | "open"
  | "waiting_customer"
  | "waiting_internal"
  | "resolved"
  | "closed"
  | "reopened";

/** Contract priority → CRM DB. */
export function priorityToDb(
  priority: SupportTicketPriority | undefined,
): DbPriority {
  const p = priority ?? "medium";
  if (p === "medium") return "normal";
  return p;
}

/** CRM DB priority → contract. */
export function priorityFromDb(priority: string): SupportTicketPriority {
  if (priority === "normal") return "medium";
  if (
    priority === "low" ||
    priority === "medium" ||
    priority === "high" ||
    priority === "critical"
  ) {
    return priority;
  }
  return "medium";
}

/** Contract status → CRM DB (for filters / writes). */
export function statusToDb(status: SupportTicketStatus): DbStatus {
  switch (status) {
    case "new":
    case "received":
      return "open";
    case "in_review":
    case "waiting_core":
    case "waiting_third_party":
    case "in_development":
      return "waiting_internal";
    case "waiting_customer":
      return "waiting_customer";
    case "resolved":
      return "resolved";
    case "closed":
    case "cancelled":
      return "closed";
    case "reopened":
      return "reopened";
    default:
      return "open";
  }
}

/** CRM DB status → contract (for list / read responses). */
export function statusFromDb(status: string): SupportTicketStatus {
  switch (status) {
    case "open":
      return "new";
    case "waiting_internal":
      return "waiting_core";
    case "waiting_customer":
      return "waiting_customer";
    case "resolved":
      return "resolved";
    case "closed":
      return "closed";
    case "reopened":
      return "reopened";
    default:
      return "new";
  }
}

/** CRM category → contract type; unknown categories become `other`. */
export function categoryToType(category: string | null | undefined): SupportTicketType {
  const value = (category ?? "other").trim() || "other";
  const parsed = SupportTicketTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "other";
}
