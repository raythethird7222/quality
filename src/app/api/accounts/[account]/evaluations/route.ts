// API route: persists a manually-created evaluation from the roster calendar
// "Evaluate" form. Insert the evaluations row with checkbox results JSONB.

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createEvaluation } from "@/lib/db/quality";

type Body = {
  agentName: string;
  guideline: string;
  evaluationDate: string;
  qaScore: number;
  ticketBill?: string;
  notes?: string;
  checked: { parameterId: number; checked: boolean }[];
};

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

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (
    !body.agentName ||
    !body.guideline ||
    !body.evaluationDate ||
    typeof body.qaScore !== "number" ||
    !Array.isArray(body.checked)
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const evaluationId = await createEvaluation({
      accountCode: account,
      agentName: body.agentName,
      guideline: body.guideline,
      evaluationDate: body.evaluationDate,
      qaScore: body.qaScore,
      qaEvaluatorEmployeeId: user.employee_id,
      ticketBill: body.ticketBill,
      notes: body.notes,
      checked: body.checked,
    });
    if (evaluationId == null) {
      return NextResponse.json(
        { success: false, error: "Could not create evaluation" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, evaluationId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save evaluation";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
