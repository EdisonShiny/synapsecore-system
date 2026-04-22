import type { IsoDateString, UserRole } from "@/types/common";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch_id: string | null;
  created_at: IsoDateString;
};
