import type { NextRequest } from "next/server";
import { listBranches } from "@/src/modules/branches/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Branches fetched successfully", { branches: listBranches(user) });
  } catch (error) {
    return fail(
      "Failed to fetch branches",
      [error instanceof Error ? error.message : "Unknown error"],
      400
    );
  }
}
