import type { NextRequest } from "next/server";
import { checkWebLink } from "@/src/services/web-scrape";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function POST(request: NextRequest) {
  try {
    getSystemSession(request);
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim() ?? "";

    if (!url) {
      return fail("Link check failed", ["A link is required."], 400);
    }

    const link = await checkWebLink(url);
    return ok("Link checked successfully", { link });
  } catch (error) {
    return fail("Link check failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
