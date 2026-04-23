import type { NextRequest } from "next/server";
import { listBranchOffices } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function GET(request: NextRequest) {
  try {
    getSystemSession(request);
    return ok("Branches fetched successfully", { branches: listBranchOffices() });
  } catch (error) {
    return fail(
      "Failed to fetch branches",
      [error instanceof Error ? error.message : "Unknown error"],
      400
    );
  }
}
