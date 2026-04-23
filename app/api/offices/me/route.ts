import type { NextRequest } from "next/server";
import { updateOfficeProfile } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { UpdateOfficeInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Office profile fetched successfully", { office: user });
  } catch (error) {
    return fail("Failed to fetch office profile", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as UpdateOfficeInput;
    const office = updateOfficeProfile(user, body);
    return ok("Office profile updated successfully", { office });
  } catch (error) {
    return fail("Failed to update office profile", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
