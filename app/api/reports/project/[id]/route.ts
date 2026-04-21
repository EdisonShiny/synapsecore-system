import type { NextRequest } from "next/server";
import { getProjectReport } from "@/src/modules/reports/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    return ok("Project report fetched successfully", { report: getProjectReport(params.id, user) });
  } catch (error) {
    return fail("Failed to fetch project report", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}
