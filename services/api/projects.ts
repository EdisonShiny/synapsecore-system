import type { ApiResponse, Project } from "@/types";

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

export const projectsApi = {
  async getProjects(init?: RequestInit): Promise<ApiResponse<{ projects: Project[] }>> {
    const response = await fetch("/api/projects", {
      ...init,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    return parseResponse<{ projects: Project[] }>(response);
  },

  async getProjectById(
    id: string,
    init?: RequestInit,
  ): Promise<ApiResponse<{ project: Project }>> {
    const response = await fetch(`/api/projects/${id}`, {
      ...init,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    return parseResponse<{ project: Project }>(response);
  },

  async createProject(
    payload: Omit<Project, "id" | "created_at" | "updated_at" | "approval_status"> & {
      approval_status?: Project["approval_status"];
    },
    init?: RequestInit,
  ): Promise<ApiResponse<{ project: Project }>> {
    const response = await fetch("/api/projects", {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      body: JSON.stringify(payload),
    });

    return parseResponse<{ project: Project }>(response);
  },
};
