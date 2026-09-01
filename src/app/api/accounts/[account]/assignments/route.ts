// API route: persists agent assignments for an account with server-side
// validation. Accepts a batch of assignment rows and returns the saved ids.

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { persistAgentAssignments } from "@/lib/db/assignments";
import { assignmentPayloadSchema } from "@/features/assignments/validation";

// Handles the POST request: validates the body and delegates to the data layer.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  const { account } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = assignmentPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const saved = await persistAgentAssignments(
      account,
      parsed.data.rows.map((r) => ({
        assignmentId: r.assignmentId,
        agentId: r.agentId,
        agent: r.agent,
        lobId: r.lobId,
        coachId: r.coachId ?? null,
        evaluatorId: r.evaluatorId ?? null,
        teamLeadId: r.teamLeadId ?? null,
      }))
    );
    return NextResponse.json({ success: true, rows: saved });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save assignments";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
