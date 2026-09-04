import type { UserRole } from "@/types";

export const PERMISSIONS = [
  "dashboard:read",
  "analytics:read",
  "evaluations:read",
  "evaluations:create",
  "assignments:read",
  "assignments:manage",
  "accounts:create",
  "profile:read",
  "profile:update",
  "agent:use",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
  admin: [...PERMISSIONS],
  quality_coordinator: [
    "dashboard:read",
    "analytics:read",
    "evaluations:read",
    "evaluations:create",
    "assignments:read",
    "assignments:manage",
    "accounts:create",
    "profile:read",
    "profile:update",
    "agent:use",
  ],
  account_manager: [
    "dashboard:read",
    "analytics:read",
    "evaluations:read",
    "evaluations:create",
    "assignments:read",
    "assignments:manage",
    "accounts:create",
    "profile:read",
    "profile:update",
    "agent:use",
  ],
  qa_supervisor: [
    "dashboard:read",
    "analytics:read",
    "evaluations:read",
    "evaluations:create",
    "assignments:read",
    "assignments:manage",
    "accounts:create",
    "profile:read",
    "profile:update",
    "agent:use",
  ],
  qa: [
    "dashboard:read",
    "analytics:read",
    "evaluations:read",
    "evaluations:create",
    "assignments:read",
    "assignments:manage",
    "profile:read",
    "profile:update",
    "agent:use",
  ],
  team_lead: [
    "dashboard:read",
    "analytics:read",
    "evaluations:read",
    "assignments:read",
    "profile:read",
    "profile:update",
    "agent:use",
  ],
  agent: [
    "profile:read",
    "profile:update",
  ],
};

export function getRolePermissions(role: UserRole): ReadonlySet<Permission> {
  return new Set(ROLE_PERMISSION_MAP[role]);
}
