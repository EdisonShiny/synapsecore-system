import { getPublicAuthStatus } from "@/src/modules/system/service";
import { ok } from "@/src/utils/api";

export async function GET() {
  return ok("Auth status fetched successfully", getPublicAuthStatus());
}
