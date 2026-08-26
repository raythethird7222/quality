// API route: returns evaluations for a specific agent, used by Realtime refetch.
import { NextRequest, NextResponse } from "next/server";
import { getAgentEvaluations } from "@/lib/db/quality";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");
  const agent = req.nextUrl.searchParams.get("agent");

  if (!account || !agent) {
    return NextResponse.json(
      { error: "Missing account or agent parameter" },
      { status: 400 }
    );
  }

  const evaluations = await getAgentEvaluations(account, agent);
  return NextResponse.json({ evaluations });
}
