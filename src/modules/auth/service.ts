import type { User, UserRole } from "@/types";
import { getStore } from "@/src/services/mock-store";

export function login(email: string, role: UserRole) {
  const store = getStore();
  const user = store.users.find((entry) => entry.email === email && entry.role === role);

  if (!user) {
    throw new Error("Invalid email or role.");
  }

  return {
    token: `demo:${user.id}`,
    user
  };
}

export function getCurrentUser(userId: string): User {
  const store = getStore();
  const user = store.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}
