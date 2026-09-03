// API route: returns authenticated user info.

import { getAuthUser } from "@/lib/auth";
import { AuthenticationError } from "@/server/security/errors";
import { jsonError, jsonOk } from "@/server/security/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AuthenticationError("Not authenticated");
    }
    return jsonOk({ success: true, user });
  } catch (error) {
    return jsonError(error);
  }
}
