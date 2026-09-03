import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { resolveAuthenticatedEmployee } from "@/server/auth/session";
import { assertTrustedOrigin } from "@/server/security/origin";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { ValidationError, AuthenticationError } from "@/server/security/errors";
import { jsonError, jsonOk } from "@/server/security/http";

type VerifiedEmployee = {
  employee_id: number;
  employee_code: string | null;
  employee_name: string | null;
  employee_email: string | null;
  avatar_url: string | null;
};

type EmployeeLoginRow = {
  id: number;
  employee_code: string | null;
  employee_name: string | null;
  employee_email: string | null;
  avatar_url: string | null;
};

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error("Unable to inspect auth users");
    }

    const match =
      data.users.find(
        (user) => user.email?.trim().toLowerCase() === email
      ) ?? null;

    if (match) {
      return match;
    }

    if (!data.nextPage || data.users.length === 0) {
      return null;
    }

    page = data.nextPage;
  }

  return null;
}

async function ensureEmailCodeAuthUser(email: string, employeeCode: string) {
  const admin = createAdminClient();
  const normalizedPassword = employeeCode;
  const { data, error } = await (
    admin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )("verify_employee_login", {
    p_email: email,
    p_password: normalizedPassword,
  });

  let employee = ((data as VerifiedEmployee[] | null) ?? [])[0] ?? null;

  if (error) {
    const lookup = await admin
      .from("employees")
      .select("id, employee_code, employee_name, employee_email, avatar_url")
      .ilike("employee_email", email)
      .maybeSingle();

    if (lookup.error) {
      throw new Error("Unable to verify employee login");
    }

    const fallbackEmployee = lookup.data as EmployeeLoginRow | null;
    const matchesCode =
      fallbackEmployee?.employee_code?.trim().toUpperCase() === employeeCode;

    if (!fallbackEmployee || !matchesCode) {
      throw new AuthenticationError("Invalid email or employee code");
    }

    employee = {
      employee_id: fallbackEmployee.id,
      employee_code: fallbackEmployee.employee_code,
      employee_name: fallbackEmployee.employee_name,
      employee_email: fallbackEmployee.employee_email,
      avatar_url: fallbackEmployee.avatar_url,
    };
  }

  if (!employee) {
    throw new AuthenticationError("Invalid email or employee code");
  }

  const authUser = await findAuthUserByEmail(email);

  if (authUser) {
    const { error: updateError } = await admin.auth.admin.updateUserById(authUser.id, {
      password: normalizedPassword,
      email_confirm: true,
      user_metadata: {
        employee_id: employee.employee_id,
      },
    });

    if (updateError) {
      throw new Error("Unable to sync employee login credentials");
    }

    return normalizedPassword;
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password: normalizedPassword,
    email_confirm: true,
    user_metadata: {
      employee_id: employee.employee_id,
    },
  });

  if (createError) {
    throw new Error("Unable to provision employee login credentials");
  }

  return normalizedPassword;
}

export async function POST(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("login", 10, 60_000);

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const email = parsed.data.email.trim().toLowerCase();
    const employeeCode = parsed.data.password.trim();
    const supabase = await createServerClient();

    let normalizedPassword = employeeCode;
    let { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password: normalizedPassword,
    });

    if (error) {
      normalizedPassword = await ensureEmailCodeAuthUser(email, employeeCode);
      const retry = await supabase.auth.signInWithPassword({
        email,
        password: normalizedPassword,
      });
      signInData = retry.data;
      error = retry.error;
    }

    if (error) {
      throw new AuthenticationError("Invalid email or employee code");
    }

    const user = await resolveAuthenticatedEmployee(
      signInData.user?.id ?? "",
      signInData.user?.email
    );
    if (!user) {
      throw new AuthenticationError("Invalid email or employee code");
    }

    return jsonOk({ success: true, user });
  } catch (error) {
    return jsonError(error);
  }
}
