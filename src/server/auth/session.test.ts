import { describe, it, expect, vi, beforeEach } from "vitest";

// session.ts uses React cache() (memoized per request) around getCurrentUser,
// so we reset modules between tests to avoid cross-test memo leakage. The mock
// for @/lib/supabase/server is declared with vi.hoisted so the factory lambda
// keeps referring to the SAME mock function across resetModules() calls.

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
  createAdminClient: mocks.createAdminClient,
}));

type SessionModule = typeof import("@/server/auth/session");
let session: SessionModule;

async function reloadSessionModule() {
  vi.resetModules();
  mocks.createServerClient.mockReset();
  mocks.createAdminClient.mockReset();
  session = await import("@/server/auth/session");
}

function mockSupabase({
  user = { id: "auth-123", email: "test@example.com" },
  getUserError = null,
  employee,
  assignments,
  primaryAccount = { data: null, error: null },
}: {
  user?: object | null;
  getUserError?: unknown;
  employee: { data: unknown; error?: unknown };
  assignments: { data: unknown; error?: unknown };
  primaryAccount?: { data: unknown; error?: unknown };
}) {
  const serverClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: getUserError,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "employees") {
        return {
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue(employee),
        };
      }
      if (table === "employee_assignments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: (value: unknown) => void) => {
            resolve(assignments);
            return Promise.resolve(assignments);
          },
        };
      }
      if (table === "accounts") {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue(primaryAccount),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    }),
  };

  mocks.createServerClient.mockResolvedValue(serverClient);
  mocks.createAdminClient.mockReturnValue(serverClient);
}

const employeeRecord = {
  id: 1,
  employee_code: "EMP001",
  employee_name: "Test",
  employee_email: "test@example.com",
  avatar_url: null,
};

const qaAssignment = {
  role_id: 2,
  account_id: 1,
  roles: { role_name: "qa" },
  accounts: { account_code: "RM", account_name: "RM" },
};

describe("Cross-account authorization", () => {
  beforeEach(async () => {
    await reloadSessionModule();
    mockSupabase({
      employee: { data: employeeRecord, error: null },
      assignments: { data: [qaAssignment], error: null },
    });
  });

  it("allows access when user is assigned to the account", async () => {
    const result = await session.requireAccountAccess("rm");
    expect(result.accountCode).toBe("RM");
  });

  it("denies access for unassigned account when user is not a manager", async () => {
    await expect(session.requireAccountAccess("JS")).rejects.toThrow("access to this account");
  });
});

describe("fail-closed role handling", () => {
  beforeEach(async () => {
    await reloadSessionModule();
    mockSupabase({
      employee: { data: employeeRecord, error: null },
      assignments: {
        data: [
          {
            role_id: 99,
            account_id: 1,
            roles: { role_name: "superadmin" },
            accounts: { account_code: "RM", account_name: "RM" },
          },
        ],
        error: null,
      },
    });
  });

  it("returns null for unknown role (fail closed)", async () => {
    const user = await session.getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("unscoped manager assignments", () => {
  beforeEach(async () => {
    await reloadSessionModule();
    mockSupabase({
      employee: { data: employeeRecord, error: null },
      assignments: {
        data: [
          {
            role_id: 3,
            account_id: null,
            roles: { role_name: "account manager" },
            accounts: null,
          },
        ],
        error: null,
      },
      primaryAccount: {
        data: { account_code: "RM", account_name: "RM" },
        error: null,
      },
    });
  });

  it("allows a database-confirmed global manager to establish a session", async () => {
    const user = await session.getCurrentUser();
    expect(user?.role).toBe("account_manager");
    expect(user?.account).toBe("RM");
  });
});

describe("fail-closed when no valid assignments", () => {
  beforeEach(async () => {
    await reloadSessionModule();
    mockSupabase({
      employee: { data: employeeRecord, error: null },
      assignments: {
        data: [
          {
            role_id: 2,
            account_id: 1,
            roles: { role_name: "qa" },
            accounts: null,
          },
        ],
        error: null,
      },
    });
  });

  it("returns null when no valid account assignments exist", async () => {
    const user = await session.getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("Expired / unauthenticated sessions", () => {
  it("returns null when auth.getUser fails (expired/invalid token)", async () => {
    await reloadSessionModule();
    mockSupabase({
      user: null,
      getUserError: { message: "expired token" },
      employee: { data: null },
      assignments: { data: null },
    });
    const user = await session.getCurrentUser();
    expect(user).toBeNull();
  });

  it("requireUser throws unauthenticated (401) for missing session", async () => {
    await reloadSessionModule();
    mockSupabase({
      user: null,
      getUserError: { message: "no session" },
      employee: { data: null },
      assignments: { data: null },
    });
    await expect(session.requireUser()).rejects.toMatchObject({ status: 401 });
  });
});
