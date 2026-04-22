"use client";

import { Download, Plus, Send } from "lucide-react";
import {
  ActivityFeedItem,
  AiInsightCard,
  AlertBanner,
  ApprovalActionBar,
  ApprovalBadge,
  BranchPerformanceBlock,
  BranchTag,
  ChartCard,
  ConfidenceBadge,
  DataTableShell,
  EmptyState,
  FileUploadBox,
  FilterBar,
  FormField,
  KpiCard,
  PendingApprovalList,
  PrimaryButton,
  QuickActionPanel,
  ReportSummaryCard,
  SearchInput,
  SecondaryButton,
  SectionBlock,
  SelectField,
  StatusBadge,
  TabsShell,
  TextAreaField,
  TimelinePhaseCard,
  ValidationAlertsBlock
} from "@/components";
import type {
  AiAnalysis,
  Approval,
  ApprovalStatus,
  Branch,
  DashboardActivity,
  DashboardAlert,
  DashboardSummary,
  Phase,
  Plan,
  ProceedRecommendation,
  Project,
  ProjectInput,
  ProjectReport,
  RiskReport,
  User,
  Validation,
  ValidationReport
} from "@/types";
import type { RiskLevel, StatusTone } from "@/types/common";

const projectStatusTone: Record<Project["status"], StatusTone> = {
  draft: "neutral",
  active: "info",
  validation_pending: "warning",
  approval_pending: "warning",
  executing: "info",
  completed: "success",
  escalated: "error"
};

const validationTone: Record<ProceedRecommendation, StatusTone> = {
  proceed: "success",
  proceed_with_caution: "warning",
  human_review_required: "error",
  do_not_proceed: "error"
};

const riskTone: Record<RiskLevel, StatusTone> = {
  low: "success",
  medium: "warning",
  high: "error"
};

function toPercent(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

function progressFromPhaseStatus(status: Phase["status"]) {
  switch (status) {
    case "pending":
      return 15;
    case "planned":
      return 35;
    case "validating":
      return 55;
    case "approved":
      return 72;
    case "executing":
      return 88;
    case "completed":
      return 100;
    case "blocked":
      return 40;
    default:
      return 0;
  }
}

function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 85) {
    return "high";
  }

  if (score >= 70) {
    return "medium";
  }

  return "low";
}

function formatEnumLabel(value: string) {
  return value.replaceAll("_", " ");
}

function latestValidationForPhase(phaseId: string, validations: Validation[]) {
  return validations.find((validation) => validation.phase_id === phaseId) ?? null;
}

type DashboardTemplateProps = {
  summary: DashboardSummary;
  alerts: DashboardAlert[];
  activity: DashboardActivity[];
  pendingApprovals: Array<{ id: string; project: string; branch: string; state: ApprovalStatus }>;
  branchMetrics: Array<{ branch: string; value: number; label?: string }>;
};

export function DashboardTemplate({
  summary,
  alerts,
  activity,
  pendingApprovals,
  branchMetrics
}: DashboardTemplateProps) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active project"
          value={String(summary.active_projects)}
          trend={`${summary.total_projects} total tracked projects`}
          tone="info"
        />
        <KpiCard
          label="Pending approval"
          value={String(summary.approval_pending_count)}
          trend={`${summary.approval_pending_projects} projects currently awaiting approval`}
          tone="warning"
        />
        <KpiCard
          label="Validation pending"
          value={String(summary.validation_pending_projects)}
          trend={`${summary.approval_revise_count} approval items need revision`}
          tone="warning"
        />
        <KpiCard
          label="Completed project"
          value={String(summary.completed_projects)}
          trend={`${summary.executing_projects} projects still executing`}
          tone="success"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr_0.8fr]">
        <ChartCard title="workflow readiness">
          <div className="grid gap-4">
            {[
              { label: "validation pending", value: summary.validation_pending_projects, total: summary.total_projects, tone: "warning" as const },
              { label: "approval pending", value: summary.approval_pending_projects, total: summary.total_projects, tone: "warning" as const },
              { label: "executing", value: summary.executing_projects, total: summary.total_projects, tone: "info" as const },
              { label: "completed", value: summary.completed_projects, total: summary.total_projects, tone: "success" as const }
            ].map((item) => (
              <div key={item.label} className="grid gap-2 rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-body text-synapse-text">{item.label}</span>
                  <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-synapse-card">
                  <div
                    className="h-full rounded-full bg-synapse-primary"
                    style={{ width: `${toPercent(item.value, item.total)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
        <PendingApprovalList items={pendingApprovals} />
        <QuickActionPanel />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <BranchPerformanceBlock items={branchMetrics} />
        <div>
          <ValidationAlertsBlock
            items={alerts.slice(0, 3).map((alert) => ({
              id: alert.id,
              title: alert.title,
              description: alert.description,
              severity: alert.risk_level === "high" ? "error" : "warning"
            }))}
          />
        </div>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
          <h3 className="mb-3 text-card-title text-synapse-text">activity feed</h3>
          <div className="grid gap-3">
            {activity.slice(0, 4).map((item) => (
              <ActivityFeedItem
                key={item.id}
                title={item.message}
                meta={`${item.actor_name} (${item.actor_role})`}
                tone={
                  item.approval_status === "approved"
                    ? "success"
                    : item.approval_status === "rejected" || item.project_status === "escalated"
                      ? "error"
                      : "info"
                }
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function LoginTemplate({ branchUser, hqUser }: { branchUser: User; hqUser: User }) {
  return (
    <div className="grid min-h-screen place-items-center bg-synapse-page p-4">
      <div className="w-full max-w-md rounded-2xl border border-synapse-border bg-synapse-card p-8 shadow-soft">
        <h1 className="text-page-title text-synapse-text">SynapseCore System</h1>
        <p className="mt-2 text-body text-synapse-muted">Sign in as HQ or Branch Office.</p>
        <div className="mt-6 grid gap-4">
          <FormField label="Email" defaultValue={branchUser.email} readOnly />
          <FormField label="Password" defaultValue="demo-password" readOnly type="password" />
          <SelectField label="Role" defaultValue={branchUser.role} disabled>
            <option>{hqUser.role}</option>
            <option>{branchUser.role}</option>
          </SelectField>
          <PrimaryButton>Sign in</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function ProjectListTemplate({
  projects,
  branches,
  phases,
  validations
}: {
  projects: Project[];
  branches: Branch[];
  phases: Phase[];
  validations: Validation[];
}) {
  const rows = projects.map((project) => {
    const branch = branches.find((entry) => entry.id === project.branch_id)?.name ?? "Unknown branch";
    const phase = phases
      .filter((entry) => entry.project_id === project.id)
      .sort((left, right) => right.phase_order - left.phase_order)[0] ?? null;
    const validation = phase ? latestValidationForPhase(phase.id, validations) : null;

    return {
      id: project.id,
      project,
      branch,
      phase,
      validation
    };
  });

  return (
    <SectionBlock
      title="project list"
      description="Monitor project, phase, plan, validation, approval, and execution_update status."
      action={<PrimaryButton icon={<Plus className="h-4 w-4" />}>Create project</PrimaryButton>}
    >
      <FilterBar>
        <div className="w-full max-w-md">
          <SearchInput />
        </div>
        <div className="flex gap-3">
          <SecondaryButton>Filter branch</SecondaryButton>
          <SecondaryButton>Export</SecondaryButton>
        </div>
      </FilterBar>
      <DataTableShell
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "project",
            header: "project",
            render: (row) => (
              <div className="grid gap-1">
                <span>{row.project.title}</span>
                <span className="text-meta text-synapse-muted">{row.project.project_type}</span>
              </div>
            )
          },
          { key: "branch", header: "branch", render: (row) => <BranchTag branch={row.branch} /> },
          {
            key: "phase",
            header: "phase",
            render: (row) =>
              row.phase ? (
                <StatusBadge tone={row.phase.status === "completed" ? "success" : row.phase.status === "blocked" ? "error" : "info"}>
                  {row.phase.phase_name}
                </StatusBadge>
              ) : (
                <StatusBadge>no phase</StatusBadge>
              )
          },
          {
            key: "validation",
            header: "validation",
            render: (row) =>
              row.validation ? (
                <StatusBadge tone={validationTone[row.validation.proceed_recommendation]}>
                  {formatEnumLabel(row.validation.proceed_recommendation)}
                </StatusBadge>
              ) : (
                <StatusBadge>not started</StatusBadge>
              )
          },
          {
            key: "approval_status",
            header: "approval",
            render: (row) => <ApprovalBadge state={row.project.approval_status} />
          }
        ]}
      />
    </SectionBlock>
  );
}

export function CreateProjectTemplate({
  branches,
  branchUser,
  input,
  aiAnalysis,
  project
}: {
  branches: Branch[];
  branchUser: User;
  input: ProjectInput | null;
  aiAnalysis: AiAnalysis | null;
  project: Project | null;
}) {
  return (
    <SectionBlock title="create project" description="Capture input, branch context, and first phase planning information.">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="project name" defaultValue={project?.title ?? ""} readOnly />
            <SelectField label="branch" defaultValue={branchUser.branch_id ?? undefined} disabled>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </SelectField>
          </div>
          <TextAreaField label="input" defaultValue={input?.raw_text ?? ""} readOnly />
          <FileUploadBox
            label="Attach project files"
            hint={input?.file_url ? `Attached file: ${input.file_url}` : "Mock mode uses stable seeded input with no file dependency."}
          />
          <div className="flex justify-end gap-3">
            <SecondaryButton>Save draft</SecondaryButton>
            <PrimaryButton>Create project</PrimaryButton>
          </div>
        </div>
        <div className="grid gap-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-5">
          <div>
            <h3 className="text-card-title text-synapse-text">ai_analysis preview</h3>
            <p className="mt-1 text-body text-synapse-muted">
              AI converts raw branch input into a structured recommendation before project creation.
            </p>
          </div>
          {aiAnalysis ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <StatusBadge tone={aiAnalysis.urgency === "critical" || aiAnalysis.urgency === "high" ? "error" : "warning"}>
                  {aiAnalysis.urgency}
                </StatusBadge>
                <ConfidenceBadge level={confidenceLevel(aiAnalysis.confidence_score)} />
              </div>
              <p className="text-body text-synapse-muted">{aiAnalysis.summary}</p>
              <div className="grid gap-2">
                <h4 className="text-body font-medium text-synapse-text">Missing information</h4>
                {aiAnalysis.missing_information.length > 0 ? (
                  aiAnalysis.missing_information.map((item) => (
                    <StatusBadge key={item} tone="warning" className="w-fit">
                      {item}
                    </StatusBadge>
                  ))
                ) : (
                  <StatusBadge tone="success" className="w-fit">
                    no missing information
                  </StatusBadge>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              title="No ai_analysis available"
              description="Run analyze-input to generate the structured branch issue."
            />
          )}
        </div>
      </div>
    </SectionBlock>
  );
}

export function ProjectDetailTemplate({ projectReport }: { projectReport: ProjectReport }) {
  return (
    <SectionBlock
      title="project detail"
      description="A timeline view for Input → Project → Phase → Plan → Validate → Execute → Improve."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {projectReport.phases.map(({ phase }) => (
          <TimelinePhaseCard
            key={phase.id}
            phase={phase.phase_name}
            status={phase.status}
            owner={phase.responsible_party}
            progress={progressFromPhaseStatus(phase.status)}
          />
        ))}
      </div>
      <div className="grid gap-4 rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel lg:grid-cols-3">
        <div>
          <p className="text-body text-synapse-muted">project</p>
          <p className="mt-1 text-card-title text-synapse-text">{projectReport.project.title}</p>
        </div>
        <div>
          <p className="text-body text-synapse-muted">branch</p>
          <p className="mt-1 text-card-title text-synapse-text">{projectReport.branch?.name ?? "Unknown branch"}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge tone={projectStatusTone[projectReport.project.status]}>
            {formatEnumLabel(projectReport.project.status)}
          </StatusBadge>
          <ApprovalBadge state={projectReport.project.approval_status} />
        </div>
      </div>
    </SectionBlock>
  );
}

export function AiPlanTemplate({
  aiAnalysis,
  phase,
  plan,
  validation
}: {
  aiAnalysis: AiAnalysis | null;
  phase: Phase | null;
  plan: Plan | null;
  validation: Validation | null;
}) {
  return (
    <SectionBlock title="AI plan" description="Review ai_analysis, plan confidence, and validation notes before approval.">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <AiInsightCard title="ai_analysis summary" confidence={aiAnalysis?.confidence_score ?? 0}>
          {aiAnalysis?.summary ?? "No ai_analysis is linked to this project yet."}
        </AiInsightCard>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5">
          <TabsShell tabs={["plan", "validation", "approval"]} activeTab="plan" />
          <div className="mt-5 grid gap-4">
            <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">phase</p>
              <p className="mt-1 text-body text-synapse-text">{phase?.phase_name ?? "No phase selected"}</p>
            </div>
            <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">expected output</p>
              <p className="mt-1 text-body text-synapse-text">{plan?.expected_output ?? "Generate a plan to populate this field."}</p>
            </div>
            <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">validation</p>
              <p className="mt-1 text-body text-synapse-text">
                {validation ? formatEnumLabel(validation.proceed_recommendation) : "Validation has not been generated yet."}
              </p>
            </div>
            <TextAreaField
              label="approval decision notes"
              defaultValue={validation?.impact_analysis ?? ""}
              placeholder="Write decision notes for approval."
              readOnly={Boolean(validation)}
            />
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}

export function ValidationCenterTemplate({
  validations,
  phases
}: {
  validations: Validation[];
  phases: Phase[];
}) {
  const items = validations.slice(0, 4).map((validation) => {
    const phase = phases.find((entry) => entry.id === validation.phase_id);
    const details = validation.missing_information[0] ?? validation.impact_analysis;

    return {
      id: validation.id,
      title: `${phase?.phase_name ?? "phase"} validation`,
      description: details,
      severity: validation.human_review_level === "required" ? ("error" as const) : ("warning" as const)
    };
  });

  return (
    <SectionBlock title="validation center" description="Surface groundedness warnings and missing information before approval.">
      <ValidationAlertsBlock items={items} />
    </SectionBlock>
  );
}

export function ApprovalsTemplate({
  approvals,
  projects,
  branches
}: {
  approvals: Approval[];
  projects: Project[];
  branches: Branch[];
}) {
  const rows = approvals.map((approval) => {
    const project = projects.find((entry) => entry.id === approval.project_id) ?? null;
    const branch = project ? branches.find((entry) => entry.id === project.branch_id)?.name ?? "Unknown branch" : "Unknown branch";

    return {
      id: approval.id,
      approval,
      project,
      branch
    };
  });

  return (
    <SectionBlock title="approvals" description="Approve, reject, or request revision for submitted plan items.">
      <AlertBanner title="approval queue requires HQ review" tone="warning">
        {approvals.filter((approval) => approval.status === "pending").length} approval requests are pending HQ decision.
      </AlertBanner>
      <DataTableShell
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "project",
            header: "project",
            render: (row) => (
              <div className="grid gap-1">
                <span>{row.project?.title ?? "Unknown project"}</span>
                <span className="text-meta text-synapse-muted">{row.approval.request_type}</span>
              </div>
            )
          },
          { key: "branch", header: "branch", render: (row) => <BranchTag branch={row.branch} /> },
          {
            key: "risk_level",
            header: "risk",
            render: (row) => <StatusBadge tone={riskTone[row.approval.risk_level]}>{row.approval.risk_level}</StatusBadge>
          },
          {
            key: "status",
            header: "status",
            render: (row) => <ApprovalBadge state={row.approval.status} />
          }
        ]}
      />
      <ApprovalActionBar />
    </SectionBlock>
  );
}

export function ReportsTemplate({
  projectReport,
  riskReport,
  validationReport,
  branchMetrics
}: {
  projectReport: ProjectReport;
  riskReport: RiskReport;
  validationReport: ValidationReport;
  branchMetrics: Array<{ branch: string; value: number; label?: string }>;
}) {
  return (
    <SectionBlock title="reports" description="Summaries for project, approval, validation, and execution_update.">
      <div className="grid gap-5 lg:grid-cols-3">
        <ReportSummaryCard
          title="project report summary"
          description={`Latest report for ${projectReport.project.title} includes ${projectReport.phases.length} phases and ${projectReport.ai_analysis.length} ai_analysis records.`}
          confidenceLevel={confidenceLevel(projectReport.project.ai_confidence)}
        />
        <ChartCard title="risk and validation snapshot">
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl border border-synapse-border bg-synapse-elevated p-4">
              <span className="text-body text-synapse-text">High risk projects</span>
              <StatusBadge tone="error">{riskReport.high_risk_projects.length}</StatusBadge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-synapse-border bg-synapse-elevated p-4">
              <span className="text-body text-synapse-text">Required human review</span>
              <StatusBadge tone="warning">{validationReport.required_human_review_count}</StatusBadge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-synapse-border bg-synapse-elevated p-4">
              <span className="text-body text-synapse-text">Escalated projects</span>
              <StatusBadge tone="error">{riskReport.escalated_projects.length}</StatusBadge>
            </div>
          </div>
        </ChartCard>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5">
          <h3 className="text-card-title text-synapse-text">Export</h3>
          <p className="mt-2 text-body text-synapse-muted">Download reports for HQ and Branch Office demos.</p>
          <PrimaryButton className="mt-5" icon={<Download className="h-4 w-4" />}>
            Download report
          </PrimaryButton>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
          <h3 className="text-card-title text-synapse-text">validation summary</h3>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-body text-synapse-muted">average groundedness</span>
              <StatusBadge tone="info">{validationReport.average_groundedness_score}</StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body text-synapse-muted">warnings</span>
              <StatusBadge tone="warning">{validationReport.warnings_count}</StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body text-synapse-muted">do not proceed</span>
              <StatusBadge tone="error">{validationReport.do_not_proceed_count}</StatusBadge>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
          <h3 className="text-card-title text-synapse-text">branch insights</h3>
          <div className="mt-4 grid gap-3">
            {branchMetrics.map((metric) => (
              <div key={metric.branch} className="flex items-center justify-between rounded-xl border border-synapse-border bg-synapse-elevated p-3">
                <span className="text-body text-synapse-text">{metric.branch}</span>
                <StatusBadge tone="info">{metric.value}%</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}

export function SettingsTemplate({
  hqUser,
  branchUser,
  mockMode
}: {
  hqUser: User;
  branchUser: User;
  mockMode: boolean;
}) {
  return (
    <SectionBlock title="settings" description="Configure demo-safe defaults for HQ and Branch Office users.">
      <div className="grid gap-4 rounded-2xl border border-synapse-border bg-synapse-card p-5">
        <SelectField label="Default role" defaultValue={branchUser.role} disabled>
          <option>{hqUser.role}</option>
          <option>{branchUser.role}</option>
        </SelectField>
        <FormField label="Default branch" defaultValue={branchUser.branch_id ?? "HQ"} readOnly />
        <FormField label="Mode" defaultValue={mockMode ? "mock mode" : "real mode"} readOnly />
        <PrimaryButton icon={<Send className="h-4 w-4" />}>Save settings</PrimaryButton>
      </div>
    </SectionBlock>
  );
}
