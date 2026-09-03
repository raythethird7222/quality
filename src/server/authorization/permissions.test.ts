import { describe, it, expect } from "vitest";
import { normalizeRole, isKnownRole } from "@/server/auth/roles";
import { getRolePermissions } from "@/server/authorization/permissions";
import { USER_ROLES, type UserRole } from "@/types";

describe("Role normalization (fail-closed)", () => {
  it("maps valid role names correctly", () => {
    expect(normalizeRole("agent")).toBe("agent");
    expect(normalizeRole("qa")).toBe("qa");
    expect(normalizeRole("QA")).toBe("qa");
    expect(normalizeRole("qa supervisor")).toBe("qa_supervisor");
    expect(normalizeRole("QA Supervisor")).toBe("qa_supervisor");
    expect(normalizeRole("account manager")).toBe("account_manager");
    expect(normalizeRole("quality coordinator")).toBe("quality_coordinator");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("tl")).toBe("team_lead");
    expect(normalizeRole("team lead")).toBe("team_lead");
  });

  it("returns null for unknown roles (never defaults to a valid role)", () => {
    expect(normalizeRole("superuser")).toBeNull();
    expect(normalizeRole("manager")).toBeNull();
    expect(normalizeRole("")).toBeNull();
    expect(normalizeRole("  ")).toBeNull();
    expect(normalizeRole("hacker")).toBeNull();
    expect(normalizeRole("qa-admin")).toBeNull();
    expect(normalizeRole("role1")).toBeNull();
    expect(normalizeRole("QA Manager")).toBeNull();
  });

  it("isKnownRole only accepts valid roles", () => {
    expect(isKnownRole("admin")).toBe(true);
    expect(isKnownRole("qa")).toBe(true);
    expect(isKnownRole("not-a-role")).toBe(false);
    expect(isKnownRole("QA")).toBe(false); // case-sensitive: only the typed union
  });
});

describe("Permission mapping (deny-by-default)", () => {
  it("agent role only has profile permissions", () => {
    const perms = getRolePermissions("agent");
    expect(perms.has("profile:read")).toBe(true);
    expect(perms.has("profile:update")).toBe(true);
    expect(perms.has("evaluations:read")).toBe(false);
    expect(perms.has("evaluations:create")).toBe(false);
    expect(perms.has("assignments:manage")).toBe(false);
    expect(perms.has("accounts:create")).toBe(false);
    expect(perms.has("agent:use")).toBe(false);
    expect(perms.has("dashboard:read")).toBe(false);
  });

  it("team_lead cannot create evaluations or manage assignments", () => {
    const perms = getRolePermissions("team_lead");
    expect(perms.has("evaluations:read")).toBe(true);
    expect(perms.has("evaluations:create")).toBe(false);
    expect(perms.has("assignments:manage")).toBe(false);
    expect(perms.has("agent:use")).toBe(true);
    expect(perms.has("dashboard:read")).toBe(true);
  });

  it("qa role can create evaluations but NOT manage assignments", () => {
    const perms = getRolePermissions("qa");
    expect(perms.has("evaluations:create")).toBe(true);
    expect(perms.has("assignments:manage")).toBe(false);
    expect(perms.has("accounts:create")).toBe(false);
  });

  it("admin has ALL permissions", () => {
    const perms = getRolePermissions("admin");
    for (const role of USER_ROLES) {
      expect(perms.has("dashboard:read")).toBe(true);
      expect(perms.has("analytics:read")).toBe(true);
      expect(perms.has("evaluations:read")).toBe(true);
      expect(perms.has("evaluations:create")).toBe(true);
      expect(perms.has("assignments:read")).toBe(true);
      expect(perms.has("assignments:manage")).toBe(true);
      expect(perms.has("accounts:create")).toBe(true);
      expect(perms.has("profile:read")).toBe(true);
      expect(perms.has("profile:update")).toBe(true);
      expect(perms.has("agent:use")).toBe(true);
    }
  });

  it("every valid role returns a permission set (no undefined)", () => {
    for (const role of USER_ROLES) {
      expect(() => getRolePermissions(role)).not.toThrow();
      expect(role, `role ${role}`).toBeTruthy();
    }
  });
});

describe("role list is exhaustive for the permission map", () => {
  it("all USER_ROLES have a permissions entry", () => {
    const roles: UserRole[] = [...USER_ROLES];
    for (const role of roles) {
      expect(role, `role ${role}`).toBeTruthy();
    }
  });
});
