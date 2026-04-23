import type { NextRequest } from "next/server";
import { createProject, listProjectsForOffice } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { CreateProjectInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Projects fetched successfully", { projects: listProjectsForOffice(user) });
  } catch (error) {
    return fail("Failed to fetch projects", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as CreateProjectInput;
    const project = createProject(user, body);
    return ok("Project created successfully", { project });
  } catch (error) {
    return fail("Project creation failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
