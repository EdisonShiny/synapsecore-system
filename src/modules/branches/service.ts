import type { User } from "@/types";
import { getStore } from "@/src/services/mock-store";

export function listBranches(user: User) {
  const store = getStore();

  if (user.role === "HQ") {
    return store.branches;
  }

  return store.branches.filter((branch) => branch.id === user.branch_id);
}
