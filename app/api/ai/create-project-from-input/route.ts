import type { NextRequest } from "next/server";
import { createProjectFromAnalyzedInput } from "@/src/modules/ai/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as { input_id?: string; confirm_project_creation?: boolean };

    if (!body.input_id) {
      return fail("Failed to create project from input", ["input_id is required."]);
    }

    return ok(
      "Project created from input successfully",
      await createProjectFromAnalyzedInput(body.input_id, user, body.confirm_project_creation ?? true)
    );
  } catch (error) {
    return fail("Failed to create project from input", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
