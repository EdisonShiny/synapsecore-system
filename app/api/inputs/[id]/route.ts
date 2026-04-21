import type { NextRequest } from "next/server";
import { getInputById } from "@/src/modules/inputs/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    return ok("Input fetched successfully", getInputById(params.id, user));
  } catch (error) {
    return fail("Failed to fetch input", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}
