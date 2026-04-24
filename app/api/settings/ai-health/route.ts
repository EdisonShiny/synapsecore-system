import type { NextRequest } from "next/server";
import { probeLiveAiConnection } from "@/src/services/system-ai";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function GET(request: NextRequest) {
  try {
    getSystemSession(request);
    const health = await probeLiveAiConnection();
    return ok("AI health fetched successfully", health);
  } catch (error) {
    return fail("Failed to fetch AI health", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
