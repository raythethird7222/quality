// API route: verifies Google SSO user identity.

import { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/security/http";
import { ValidationError } from "@/server/security/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new ValidationError("Missing or invalid email");
    }

    const user = await requireUser();
    if (user.employee_email.trim().toLowerCase() !== email) {
      throw new ValidationError("Authenticated email does not match requested user");
    }
    return jsonOk({ success: true, user });
  } catch (error) {
    return jsonError(error);
  }
}
