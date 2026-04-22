import { seedData } from "@/mocks/synapse-data";
import type { Project } from "@/types";

export const mockProjects: Project[] = seedData.projects;

export const mockProjectsByBranch = seedData.branches.map((branch) => ({
  branch_id: branch.id,
  branch_name: branch.name,
  projects: seedData.projects.filter((project) => project.branch_id === branch.id),
}));

export function getMockProjectById(projectId: string) {
  return mockProjects.find((project) => project.id === projectId) ?? null;
}
