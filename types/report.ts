import type { AiAnalysis } from "@/types/ai-analysis";
import type { Approval } from "@/types/approval";
import type { Branch } from "@/types/branch";
import type { RiskLevel } from "@/types/common";
import type { ExecutionUpdate } from "@/types/execution-update";
import type { Phase } from "@/types/phase";
import type { Plan } from "@/types/plan";
import type { Project, ProjectInput } from "@/types/project";
import type { Validation } from "@/types/validation";

export type ProjectReport = {
  project: Project;
  branch: Branch | null;
  inputs: ProjectInput[];
  ai_analysis: AiAnalysis[];
  phases: Array<{
    phase: Phase;
    plan: Plan | null;
    validation: Validation | null;
    execution_updates: ExecutionUpdate[];
    approval: Approval | null;
  }>;
  latest_approval: Approval | null;
};

export type BranchReport = {
  branch: Branch;
  projects: Project[];
  approvals: Approval[];
  validation_warnings: Validation[];
  execution_updates: ExecutionUpdate[];
};

export type RiskReport = {
  high_risk_projects: Project[];
  escalated_projects: Project[];
  blocked_phases: Phase[];
  approvals_requiring_attention: Approval[];
};

export type ValidationReport = {
  validation_count: number;
  warnings_count: number;
  required_human_review_count: number;
  do_not_proceed_count: number;
  average_groundedness_score: number;
  top_missing_information: string[];
  risk_distribution: Record<RiskLevel, number>;
};
