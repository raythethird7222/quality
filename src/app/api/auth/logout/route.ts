import { createServerClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/server/security/http";
import { auditLog } from "@/server/audit";

export async function POST() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    auditLog("auth.logout", {});
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
