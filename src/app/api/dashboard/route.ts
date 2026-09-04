// API route: returns chart analytics for the dashboard with validation.

import { type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { getDashboardOverview } from "@/lib/db/employees";
import { jsonError, jsonOk } from "@/server/security/http";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { dashboardQuerySchema } from "@/lib/validation";
import { ValidationError } from "@/server/security/errors";
import type { DashboardTimeframe } from "@/lib/db/quality";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit("dashboard", 60, 60_000);

    const params = {
      timeframe: request.nextUrl.searchParams.get("timeframe") ?? "Monthly",
      date: request.nextUrl.searchParams.get("date") ?? undefined,
    };

    const parsed = dashboardQuerySchema.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError("Invalid parameters: " + parsed.error.issues[0]?.message);
    }

    const user = await requireUser();
    const timeframe = parsed.data.timeframe as DashboardTimeframe;
    const anchorDate = parsed.data.date ?? new Date().toISOString().slice(0, 10);
    const overview = await getDashboardOverview(user, timeframe, anchorDate);
    return jsonOk({ overview, timeframe });
  } catch (error) {
    return jsonError(error);
  }
}
