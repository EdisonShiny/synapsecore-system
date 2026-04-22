import { listApprovals } from "@/src/modules/approvals/service";
import {
  getDashboardActivity,
  getDashboardAlerts,
  getDashboardSummary
} from "@/src/modules/dashboard/service";
import {
  getBranchReport,
  getProjectReport,
  getRiskReport,
  getValidationReport
} from "@/src/modules/reports/service";
import { getStore } from "@/src/services/mock-store";

export function getDemoPageData(projectId?: string) {
  const store = getStore();
  const hqUser = store.users.find((user) => user.role === "HQ") ?? store.users[0];
  const branchUser =
    store.users.find((user) => user.role === "Branch Office") ?? store.users[0];
  const selectedProject =
    (projectId ? store.projects.find((project) => project.id === projectId) : null) ??
    store.projects.find((project) => project.status === "approval_pending") ??
    store.projects[0];

  if (!selectedProject) {
    throw new Error("Demo data requires at least one project.");
  }

  const dashboardSummary = getDashboardSummary(hqUser);
  const dashboardAlerts = getDashboardAlerts(hqUser);
  const dashboardActivity = getDashboardActivity(hqUser);
  const approvals = listApprovals(hqUser);
  const projectReport = getProjectReport(selectedProject.id, hqUser);
  const riskReport = getRiskReport(hqUser);
  const validationReport = getValidationReport(hqUser);

  const primaryInput =
    store.project_inputs.find((input) => input.project_id === selectedProject.id) ?? null;
  const primaryAnalysis = primaryInput
    ? store.ai_analysis.find((analysis) => analysis.input_id === primaryInput.id) ?? null
    : null;
  const highlightedPhaseBundle =
    projectReport.phases.find((bundle) => bundle.plan || bundle.validation) ??
    projectReport.phases[0] ??
    null;

  const branchMetrics = store.branches.map((branch) => {
    const branchReport = getBranchReport(branch.id, hqUser);
    const totalProjects = branchReport.projects.length;
    const healthyProjects = branchReport.projects.filter(
      (project) => project.status !== "escalated"
    ).length;

    return {
      branch: branch.name,
      value:
        totalProjects > 0
          ? Math.round((healthyProjects / totalProjects) * 100)
          : 0,
      label: `${branchReport.execution_updates.length} execution_update records`
    };
  });

  const pendingApprovalItems = approvals.slice(0, 3).map((approval) => {
    const project = store.projects.find((entry) => entry.id === approval.project_id);
    const branchName =
      store.branches.find((entry) => entry.id === project?.branch_id)?.name ??
      "Unknown branch";

    return {
      id: approval.id,
      project: project?.title ?? approval.request_type,
      branch: branchName,
      state: approval.status
    };
  });

  return {
    store,
    hqUser,
    branchUser,
    selectedProject,
    dashboardSummary,
    dashboardAlerts,
    dashboardActivity,
    approvals,
    projectReport,
    riskReport,
    validationReport,
    primaryInput,
    primaryAnalysis,
    highlightedPhaseBundle,
    branchMetrics,
    pendingApprovalItems
  };
}
