import { AppShell, DetailDrawer, StatusBadge } from "@/components";
import {
  AiPlanTemplate,
  ApprovalsTemplate,
  CreateProjectTemplate,
  DashboardTemplate,
  ProjectDetailTemplate,
  ProjectListTemplate,
  ReportsTemplate,
  SettingsTemplate,
  ValidationCenterTemplate
} from "@/features/page-templates";
import { getDashboardActivity, getDashboardAlerts, getDashboardSummary } from "@/src/modules/dashboard/service";
import { listApprovals } from "@/src/modules/approvals/service";
import { getBranchReport, getProjectReport, getRiskReport, getValidationReport } from "@/src/modules/reports/service";
import { runtimeConfig, shouldUseMockAi, shouldUseMockDatabase } from "@/src/config/runtime";
import { getStore } from "@/src/services/mock-store";

export default function Home() {
  const store = getStore();
  const hqUser = store.users.find((user) => user.role === "HQ") ?? store.users[0];
  const branchUser = store.users.find((user) => user.role === "Branch Office") ?? store.users[0];
  const primaryProject =
    store.projects.find((project) => project.status === "approval_pending") ?? store.projects[0];

  const dashboardSummary = getDashboardSummary(hqUser);
  const dashboardAlerts = getDashboardAlerts(hqUser);
  const dashboardActivity = getDashboardActivity(hqUser);
  const approvals = listApprovals(hqUser);
  const projectReport = getProjectReport(primaryProject.id, hqUser);
  const riskReport = getRiskReport(hqUser);
  const validationReport = getValidationReport(hqUser);

  const primaryInput =
    store.project_inputs.find((input) => input.project_id === primaryProject.id) ?? null;
  const primaryAnalysis =
    primaryInput
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
      (project) => project.status !== "escalated",
    ).length;

    return {
      branch: branch.name,
      value: totalProjects > 0 ? Math.round((healthyProjects / totalProjects) * 100) : 0,
      label: `${branchReport.execution_updates.length} execution_update records`,
    };
  });

  const pendingApprovalItems = approvals.slice(0, 3).map((approval) => {
    const project = store.projects.find((entry) => entry.id === approval.project_id);
    const branchName =
      store.branches.find((entry) => entry.id === project?.branch_id)?.name ?? "Unknown branch";

    return {
      id: approval.id,
      project: project?.title ?? approval.request_type,
      branch: branchName,
      state: approval.status,
    };
  });

  return (
    <AppShell
      pageTitle="SynapseCore System"
      role={hqUser.role}
      activeItem="Dashboard"
      drawer={
        <DetailDrawer open title="project detail">
          <div className="grid gap-4 text-body text-synapse-muted">
            <div>
              <p className="text-meta uppercase tracking-[0.08em]">Primary demo project</p>
              <p className="mt-1 text-card-title text-synapse-text">{projectReport.project.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="info">{projectReport.project.status.replaceAll("_", " ")}</StatusBadge>
              <StatusBadge tone="warning">
                {projectReport.project.approval_status.replaceAll("_", " ")}
              </StatusBadge>
            </div>
            <p>{projectReport.project.summary}</p>
            <div>
              <p className="text-meta uppercase tracking-[0.08em]">Runtime mode</p>
              <p className="mt-1 text-synapse-text">
                {runtimeConfig.mode} mode, database {shouldUseMockDatabase() ? "mock" : "real"}, AI{" "}
                {shouldUseMockAi() ? "mock" : "real"}
              </p>
            </div>
          </div>
        </DetailDrawer>
      }
    >
      <DashboardTemplate
        summary={dashboardSummary}
        alerts={dashboardAlerts}
        activity={dashboardActivity}
        pendingApprovals={pendingApprovalItems}
        branchMetrics={branchMetrics}
      />
      <ProjectListTemplate
        projects={store.projects}
        branches={store.branches}
        phases={store.phases}
        validations={store.validations}
      />
      <CreateProjectTemplate
        branches={store.branches}
        branchUser={branchUser}
        input={primaryInput}
        aiAnalysis={primaryAnalysis}
        project={projectReport.project}
      />
      <ProjectDetailTemplate projectReport={projectReport} />
      <AiPlanTemplate
        aiAnalysis={primaryAnalysis}
        phase={highlightedPhaseBundle?.phase ?? null}
        plan={highlightedPhaseBundle?.plan ?? null}
        validation={highlightedPhaseBundle?.validation ?? null}
      />
      <ValidationCenterTemplate validations={store.validations} phases={store.phases} />
      <ApprovalsTemplate
        approvals={approvals}
        projects={store.projects}
        branches={store.branches}
      />
      <ReportsTemplate
        projectReport={projectReport}
        riskReport={riskReport}
        validationReport={validationReport}
        branchMetrics={branchMetrics}
      />
      <SettingsTemplate hqUser={hqUser} branchUser={branchUser} mockMode={shouldUseMockAi()} />
    </AppShell>
  );
}
