import type { ProjectInput, User } from "@/types";
import { analyzeInputWithAi } from "@/src/services/ai-engine";
import { getStore } from "@/src/services/mock-store";
import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

export async function createInput(payload: Omit<ProjectInput, "id" | "created_at">, user: User) {
  const store = getStore();

  if (user.role !== "HQ" && payload.uploaded_by !== user.id) {
    throw new Error("Branch Office can only submit inputs as themselves.");
  }

  const input: ProjectInput = {
    ...payload,
    id: createId(),
    created_at: nowIso()
  };

  store.project_inputs.unshift(input);

  const branch = store.branches.find((entry) => entry.id === user.branch_id);
  const result = await analyzeInputWithAi(input, branch?.name ?? "HQ");
  store.ai_analysis.unshift(result.ai_analysis);

  return {
    input,
    ai_analysis: result.ai_analysis,
    input_understanding: result.input_understanding
  };
}

export function getInputById(inputId: string, user: User) {
  const store = getStore();
  const input = store.project_inputs.find((entry) => entry.id === inputId);

  if (!input) {
    throw new Error("Input not found.");
  }

  if (user.role !== "HQ") {
    const project = input.project_id ? store.projects.find((entry) => entry.id === input.project_id) : null;
    if (project && project.branch_id !== user.branch_id) {
      throw new Error("Branch Office can only access inputs from its own branch.");
    }
  }

  return {
    input,
    ai_analysis: store.ai_analysis.find((entry) => entry.input_id === input.id) ?? null
  };
}
