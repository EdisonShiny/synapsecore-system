import type { ApprovalStatus, IsoDateString, ProjectStatus, RiskLevel } from "@/types/common";

export type DashboardSummary = {
  total_projects: number;
  active_projects: number;
  validation_pending_projects: number;
  approval_pending_projects: number;
  executing_projects: number;
  completed_projects: number;
  approval_pending_count: number;
  approval_revise_count: number;
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  risk_level: RiskLevel;
  project_id: string | null;
  phase_id: string | null;
  created_at: IsoDateString;
};

export type DashboardActivity = {
  id: string;
  project_id: string | null;
  phase_id: string | null;
  message: string;
  actor_name: string;
  actor_role: "HQ" | "Branch Office";
  project_status: ProjectStatus | null;
  approval_status: ApprovalStatus | null;
  created_at: IsoDateString;
};
