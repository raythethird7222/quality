import { USER_ROLES, type UserRole } from "@/types";

const ROLE_MAP: Record<string, UserRole> = {
  agent: "agent",
  qa: "qa",
  "qa supervisor": "qa_supervisor",
  "account manager": "account_manager",
  "quality coordinator": "quality_coordinator",
  admin: "admin",
  tl: "team_lead",
  "team lead": "team_lead",
};

export function normalizeRole(roleName: string): UserRole | null {
  return ROLE_MAP[roleName.trim().toLowerCase()] ?? null;
}

export function isKnownRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role);
}
