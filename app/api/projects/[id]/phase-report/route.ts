import type { NextRequest } from "next/server";
import { generatePhaseReportForProject } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const result = await generatePhaseReportForProject(user, id);
    return ok("Phase report generated successfully", { result });
  } catch (error) {
    return fail("Phase report generation failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
