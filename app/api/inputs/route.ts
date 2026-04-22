import type { NextRequest } from "next/server";
import { createInput } from "@/src/modules/inputs/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { ProjectInput } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as Omit<ProjectInput, "id" | "created_at">;
    return ok("Input created successfully", await createInput(body, user));
  } catch (error) {
    return fail("Failed to create input", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
