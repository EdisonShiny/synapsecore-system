import type { NextRequest } from "next/server";
import {
  addCustomDatabaseNode,
  getCompanyDatabase,
  updateCustomDatabaseNode
} from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { CreateCustomDatabaseNodeInput, UpdateCustomDatabaseNodeInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    getSystemSession(request);
    return ok("Database payload fetched successfully", getCompanyDatabase());
  } catch (error) {
    return fail("Failed to fetch database payload", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    getSystemSession(request);
    const body = (await request.json()) as CreateCustomDatabaseNodeInput;
    return ok("Database field added successfully", addCustomDatabaseNode(body));
  } catch (error) {
    return fail("Failed to add database field", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    getSystemSession(request);
    const body = (await request.json()) as UpdateCustomDatabaseNodeInput;
    return ok("Database field updated successfully", updateCustomDatabaseNode(body));
  } catch (error) {
    return fail("Failed to update database field", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
