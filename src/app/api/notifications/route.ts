import { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { assertTrustedOrigin } from "@/server/security/origin";
import { jsonError, jsonOk } from "@/server/security/http";
import { ValidationError } from "@/server/security/errors";

export async function GET() {
  try {
    const user = await requireUser();
    const { data, error } = await createAdminClient()
      .from("notifications")
      .select("notification_id, title, description, read_at, created_at")
      .eq("recipient_employee_id", user.employee_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return jsonOk({ notifications: data ?? [] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const id = body.notification_id == null ? null : Number(body.notification_id);
    const admin = createAdminClient();
    const query = admin.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_employee_id", user.employee_id);
    const { error } = await (id == null ? query : query.eq("notification_id", id));
    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    const user = await requireUser();
    const idParam = new URL(request.url).searchParams.get("id");
    const admin = createAdminClient();
    let query = admin.from("notifications").delete().eq("recipient_employee_id", user.employee_id);
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Invalid notification id");
      query = query.eq("notification_id", id);
    }
    const { error } = await query;
    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
