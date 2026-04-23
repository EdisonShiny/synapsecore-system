import type { NextRequest } from "next/server";
import { listProjectsForOffice } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const projects = listProjectsForOffice(user);
    return ok("Approvals fetched successfully", {
      approvals:
        user.role === "HQ"
          ? projects
          : projects.filter((project) => project.status === "Waiting for Approval")
    });
  } catch (error) {
    return fail("Failed to fetch approvals", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
