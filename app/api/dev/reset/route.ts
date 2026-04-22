import type { NextRequest } from "next/server";
import { resetStore } from "@/src/services/mock-store";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);

    if (user.role !== "HQ") {
      return fail("Failed to reset demo data", ["Only HQ can reset demo data."], 403);
    }

    resetStore();

    return ok("Demo data reset successfully", { reset: true });
  } catch (error) {
    return fail(
      "Failed to reset demo data",
      [error instanceof Error ? error.message : "Unknown error"],
      400
    );
  }
}
