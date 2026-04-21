import type { NextRequest } from "next/server";
import { getProjectById, updateProject } from "@/src/modules/projects/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { Project } from "@/types";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    return ok("Project fetched successfully", { project: getProjectById(params.id, user) });
  } catch (error) {
    return fail("Failed to fetch project", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as Partial<Omit<Project, "id" | "created_at">>;
    return ok("Project updated successfully", { project: updateProject(params.id, body, user) });
  } catch (error) {
    return fail("Failed to update project", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
