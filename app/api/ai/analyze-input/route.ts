import type { NextRequest } from "next/server";
import { analyzeInput } from "@/src/modules/ai/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as { input_id?: string };

    if (!body.input_id) {
      return fail("Failed to analyze input", ["input_id is required."]);
    }

    return ok("Input analyzed successfully", { ai_analysis: await analyzeInput(body.input_id, user) });
  } catch (error) {
    return fail("Failed to analyze input", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
