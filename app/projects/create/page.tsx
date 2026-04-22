import { CreateProjectTemplate } from "@/features/page-templates";
import { getStore } from "@/src/services/mock-store";

export default function CreateProjectPage() {
  const store = getStore();
  const branchUser = store.users.find((user) => user.role === "Branch Office") ?? store.users[0];
  const project =
    store.projects.find((entry) => entry.created_by === branchUser.id) ?? store.projects[0] ?? null;
  const input = project
    ? store.project_inputs.find((entry) => entry.project_id === project.id) ?? null
    : null;
  const aiAnalysis = input
    ? store.ai_analysis.find((entry) => entry.input_id === input.id) ?? null
    : null;

  return (
    <div className="min-h-screen bg-synapse-page p-6">
      <div className="mx-auto max-w-6xl">
        <CreateProjectTemplate
          branches={store.branches}
          branchUser={branchUser}
          input={input}
          aiAnalysis={aiAnalysis}
          project={project}
        />
      </div>
    </div>
  );
}
