import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAccountIdByCode, getParameterTable, isParameterAccount } from "@/lib/db/quality";
import { requireUser } from "@/server/auth/session";
import { assertTrustedOrigin } from "@/server/security/origin";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { AuthorizationError, ValidationError } from "@/server/security/errors";
import { jsonError, jsonOk } from "@/server/security/http";

const MANAGE_ROLES = new Set(["admin", "qa_supervisor"]);

async function requireParameterManager() {
  const user = await requireUser();
  if (!MANAGE_ROLES.has(user.role)) {
    throw new AuthorizationError("Only QA Supervisors can manage evaluation parameters");
  }
  return user;
}

function parseId(value: unknown, label: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError(`Invalid ${label}`);
  return id;
}

async function getContext(accountCode: string, lobId: number) {
  if (!isParameterAccount(accountCode)) throw new ValidationError("Evaluation parameters are available only for COVA, RM, JS, and DFT");
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) throw new ValidationError("Account not found");
  const admin = createAdminClient();
  const { data: lob, error } = await admin
    .from("lobs")
    .select("lob_id, lob_name")
    .eq("account_id", accountId)
    .eq("lob_id", lobId)
    .maybeSingle();
  if (error || !lob) throw new ValidationError("LOB does not belong to this account");
  return { accountId, lob };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    await requireParameterManager();
    const { account } = await params;
    if (!isParameterAccount(account)) throw new ValidationError("Evaluation parameters are available only for COVA, RM, JS, and DFT");
    const accountId = await getAccountIdByCode(account);
    if (!accountId) throw new ValidationError("Account not found");
    const lobId = request.nextUrl.searchParams.get("lobId");
    const admin = createAdminClient();
    let query = admin
      .from(getParameterTable(account) as "evaluation_param_rm")
      .select("id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order, is_active")
      .eq("account_id", accountId)
      .order("display_order", { ascending: true });
    if (lobId) query = query.eq("lob_id", parseId(lobId, "LOB"));
    const { data, error } = await query;
    if (error) throw new ValidationError("Unable to load evaluation parameters");
    return jsonOk({ parameters: data ?? [] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("evaluation-parameters-write", 60, 60_000);
    await requireParameterManager();
    const { account } = await params;
    if (!isParameterAccount(account)) throw new ValidationError("Evaluation parameters are available only for COVA, RM, JS, and DFT");
    const body = await request.json();
    const lobId = parseId(body.lob_id, "LOB");
    const { accountId, lob } = await getContext(account, lobId);
    const guideline = String(body.guideline ?? "").trim();
    const attributes = String(body.attributes ?? "").trim();
    const clauses = String(body.clauses ?? "").trim();
    const description = String(body.description ?? "").trim();
    const score = Number(body.score);
    if (!guideline || !attributes || !clauses || !description || !Number.isFinite(score) || score <= 0) {
      throw new ValidationError("Guideline, attribute, clause, description, and a positive score are required");
    }
    const admin = createAdminClient();
    const table = getParameterTable(account) as "evaluation_param_rm";
    const { data: last } = await admin.from(table).select("id").order("id", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await admin.from(table).insert({
      id: Number(last?.id ?? 0) + 1,
      lob_name: lob.lob_name,
      guideline,
      attributes,
      clauses,
      score,
      compound: String(body.compound ?? "NO").trim() || "NO",
      description,
      account_id: accountId,
      lob_id: lobId,
      display_order: Number(body.display_order) || Number(last?.id ?? 0) + 1,
      is_active: body.is_active !== false,
    } as never).select().single();
    if (error) throw new ValidationError(error.message);
    return jsonOk({ parameter: data });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("evaluation-parameters-write", 60, 60_000);
    await requireParameterManager();
    const { account } = await params;
    if (!isParameterAccount(account)) throw new ValidationError("Evaluation parameters are available only for COVA, RM, JS, and DFT");
    const body = await request.json();
    const id = parseId(body.id, "parameter id");
    const lobId = parseId(body.lob_id, "LOB");
    const { accountId, lob } = await getContext(account, lobId);
    const score = Number(body.score);
    if (!String(body.guideline ?? "").trim() || !String(body.attributes ?? "").trim() || !String(body.clauses ?? "").trim() || !String(body.description ?? "").trim() || !Number.isFinite(score) || score <= 0) {
      throw new ValidationError("Guideline, attribute, clause, description, and a positive score are required");
    }
    const admin = createAdminClient();
    const { data, error } = await admin.from(getParameterTable(account) as "evaluation_param_rm").update({
      lob_name: lob.lob_name,
      lob_id: lobId,
      guideline: String(body.guideline).trim(),
      attributes: String(body.attributes).trim(),
      clauses: String(body.clauses).trim(),
      score,
      compound: String(body.compound ?? "NO").trim() || "NO",
      description: String(body.description).trim(),
      display_order: Number(body.display_order) || 1,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    } as never).eq("id", id).eq("account_id", accountId).select().single();
    if (error || !data) throw new ValidationError(error?.message ?? "Parameter not found");
    return jsonOk({ parameter: data });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("evaluation-parameters-delete", 30, 60_000);
    await requireParameterManager();
    const { account } = await params;
    if (!isParameterAccount(account)) throw new ValidationError("Evaluation parameters are available only for COVA, RM, JS, and DFT");
    const id = parseId(request.nextUrl.searchParams.get("id"), "parameter id");
    const accountId = await getAccountIdByCode(account);
    if (!accountId) throw new ValidationError("Account not found");
    const admin = createAdminClient();
    const { error } = await admin.from(getParameterTable(account) as "evaluation_param_rm").delete().eq("id", id).eq("account_id", accountId);
    if (error) throw new ValidationError(error.message);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
