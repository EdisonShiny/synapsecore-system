import type { NextRequest } from "next/server";
import { getCompanyDatabase } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function GET(request: NextRequest) {
  try {
    getSystemSession(request);
    return ok("Database payload fetched successfully", getCompanyDatabase());
  } catch (error) {
    return fail("Failed to fetch database payload", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
