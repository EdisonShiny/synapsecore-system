import { mockProjects } from "@/mocks/projects";
import type { Project } from "@/types/synapse";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const projectsApi = {
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return {
      success: true,
      message: "Projects fetched successfully",
      data: mockProjects
    };
  },

  async getProjectById(id: string): Promise<ApiResponse<Project | null>> {
    const project = mockProjects.find(p => p.id === id);
    if (!project) {
      return {
        success: false,
        message: "project not found",
        data: null
      };
    }
    return {
      success: true,
      message: "project fetched successfully",
      data: project
    };
  },

  async createProject(data: Omit<Project, "id">): Promise<ApiResponse<Project>> {
    const newProject: Project = {
      ...data,
      id: `PRJ-${Date.now()}`
    };
    return {
      success: true,
      message: "project created successfully",
      data: newProject
    };
  }
};
