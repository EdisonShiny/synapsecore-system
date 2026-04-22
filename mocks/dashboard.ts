import type { DashboardSummary } from "@/types/synapse";

export const mockDashboardData: DashboardSummary = {
  totalProjects: 24,
  pendingApprovals: 7,
  validationAlerts: 3,
  executionHealth: 86
};

export const mockActivityFeed = [
  {
    id: "ACT-001",
    title: "plan submitted for approval",
    meta: "HQ reviewed project Mercury",
    tone: "info" as const
  },
  {
    id: "ACT-002",
    title: "validation completed",
    meta: "Branch Office updated execution_update",
    tone: "success" as const
  },
  {
    id: "ACT-003",
    title: "approval rejected",
    meta: "Phase planning requires revision",
    tone: "error" as const
  }
];

export const mockValidationAlerts = [
  {
    id: "VAL-001",
    title: "Missing Information",
    description: "Project Mercury requires additional branch context data",
    severity: "warning" as const
  },
  {
    id: "VAL-002",
    title: "Hallucination Detected",
    description: "Unsupported claims in Project Nova analysis",
    severity: "error" as const
  }
];

export const mockBranchPerformance = [
  { branch: "North", completion: 78, health: "good" },
  { branch: "South", completion: 65, health: "fair" },
  { branch: "East", completion: 92, health: "excellent" },
  { branch: "West", completion: 45, health: "poor" }
];
