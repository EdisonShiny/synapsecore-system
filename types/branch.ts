import type { BranchStatus } from "@/types/common";

export type Branch = {
  id: string;
  name: string;
  region: string;
  manager_name: string;
  status: BranchStatus;
};
