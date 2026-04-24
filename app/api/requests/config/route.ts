import type { NextRequest } from "next/server";
import {
  getRequestPromptConfig,
  updateRequestPromptConfig
} from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { UpdateRequestPromptConfigInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    getSystemSession(request);
    return ok("Request prompt configuration fetched successfully", {
      config: getRequestPromptConfig()
    });
  } catch (error) {
    return fail(
      "Failed to fetch request prompt configuration",
      [error instanceof Error ? error.message : "Unknown error"],
      400
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as UpdateRequestPromptConfigInput;
    const config = updateRequestPromptConfig(user, body);
    return ok("Request prompt configuration updated successfully", { config });
  } catch (error) {
    return fail(
      "Request prompt configuration update failed",
      [error instanceof Error ? error.message : "Unknown error"],
      400
    );
  }
}
