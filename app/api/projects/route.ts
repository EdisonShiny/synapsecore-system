import type { NextRequest } from "next/server";
import { createProject, listProjects } from "@/src/modules/projects/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { Project } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Projects fetched successfully", { projects: listProjects(user) });
  } catch (error) {
    return fail("Failed to fetch projects", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as Omit<Project, "id" | "created_at" | "updated_at" | "approval_status"> & {
      approval_status?: Project["approval_status"];
    };

    if (user.role !== "HQ" && body.branch_id !== user.branch_id) {
      return fail("Project creation failed", ["Branch Office can only create projects for its own branch."], 403);
    }

    const project = createProject(body);
    return ok("Project created successfully", { project });
  } catch (error) {
    return fail("Project creation failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
