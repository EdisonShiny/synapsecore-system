import type { NextRequest } from "next/server";
import { registerOffice } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import type { CreateOfficeInput } from "@/types/system";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateOfficeInput>;

    if (
      !body.officeName ||
      !body.role ||
      !body.location ||
      !body.address ||
      !body.email ||
      !body.personInChargeName ||
      !body.position
    ) {
      return fail("Signup failed", ["All required signup fields must be completed."]);
    }

    const session = registerOffice({
      officeName: body.officeName,
      role: body.role,
      location: body.location,
      address: body.address,
      email: body.email,
      personInChargeName: body.personInChargeName,
      position: body.position,
      contactNumber: body.contactNumber
    });

    return ok("Account created successfully", session);
  } catch (error) {
    return fail("Signup failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
