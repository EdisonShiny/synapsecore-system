"use client";

import { Download, Plus, Send } from "lucide-react";
import {
  AiInsightCard,
  AlertBanner,
  ApprovalActionBar,
  ApprovalBadge,
  ActivityFeedItem,
  BranchPerformanceBlock,
  BranchTag,
  ChartCard,
  ConfidenceBadge,
  DataTableShell,
  FileUploadBox,
  FilterBar,
  FormField,
  KpiCard,
  PendingApprovalListCard,
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
import type { ApprovalState } from "@/types/synapse";

type ProjectRow = {
  id: string;
  project: string;
  branch: string;
  phase: string;
  validation: "passed" | "warning" | "failed";
  approval: ApprovalState;
};

const projectRows: ProjectRow[] = [
  { id: "PRJ-101", project: "project Mercury", branch: "North", phase: "plan", validation: "passed", approval: "pending" },
  { id: "PRJ-102", project: "project Atlas", branch: "South", phase: "execute", validation: "warning", approval: "approved" },
  { id: "PRJ-103", project: "project Nova", branch: "HQ", phase: "improve", validation: "failed", approval: "needs_validation" }
];

export function DashboardTemplate() {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active project" value="24" trend="8 project moved into validation" tone="info" />
        <KpiCard label="Pending approval" value="7" trend="3 approval items due today" tone="warning" />
        <KpiCard label="Validated plan" value="91%" trend="validation pass rate this week" tone="success" />
        <KpiCard label="execution_update health" value="86%" trend="branch reporting coverage" tone="success" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr_0.8fr]">
        <ChartCard title="project overview chart card" />
        <PendingApprovalListCard />
        <QuickActionPanel />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <BranchPerformanceBlock />
        <div>
          <ValidationAlertsBlock />
        </div>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
          <h3 className="mb-3 text-card-title text-synapse-text">activity feed</h3>
          <ActivityFeedItem title="plan submitted for approval" meta="HQ reviewed project Mercury" tone="info" />
          <ActivityFeedItem title="validation completed" meta="Branch Office updated execution_update" tone="success" />
        </div>
      </section>
    </>
  );
}

export function LoginTemplate() {
  return (
    <div className="grid min-h-screen place-items-center bg-synapse-page p-4">
      <div className="w-full max-w-md rounded-2xl border border-synapse-border bg-synapse-card p-8 shadow-soft">
        <h1 className="text-page-title text-synapse-text">SynapseCore System</h1>
        <p className="mt-2 text-body text-synapse-muted">Sign in as HQ or Branch Office.</p>
        <div className="mt-6 grid gap-4">
          <FormField label="Email" placeholder="name@company.com" type="email" />
          <FormField label="Password" placeholder="Password" type="password" />
          <SelectField label="Role" defaultValue="HQ">
            <option>HQ</option>
            <option>Branch Office</option>
          </SelectField>
          <PrimaryButton>Sign in</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function ProjectListTemplate() {
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
        rows={projectRows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "project", header: "project" },
          { key: "branch", header: "branch", render: (row) => <BranchTag branch={row.branch} /> },
          { key: "phase", header: "phase", render: (row) => <StatusBadge tone="info">{row.phase}</StatusBadge> },
          {
            key: "validation",
            header: "validation",
            render: (row) => <StatusBadge tone={row.validation === "passed" ? "success" : row.validation === "failed" ? "error" : "warning"}>{row.validation}</StatusBadge>
          },
          { key: "approval", header: "approval", render: (row) => <ApprovalBadge state={row.approval} /> }
        ]}
      />
    </SectionBlock>
  );
}

export function CreateProjectTemplate() {
  return (
    <SectionBlock title="create project" description="Capture input, branch context, and first phase planning information.">
      <div className="grid gap-5 rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="project name" placeholder="project name" />
          <SelectField label="branch" defaultValue="HQ">
            <option>HQ</option>
            <option>North branch</option>
            <option>South branch</option>
          </SelectField>
        </div>
        <TextAreaField label="input" placeholder="Describe the project input and required outcome." />
        <FileUploadBox label="Attach project files" />
        <div className="flex justify-end gap-3">
          <SecondaryButton>Save draft</SecondaryButton>
          <PrimaryButton>Create project</PrimaryButton>
        </div>
      </div>
    </SectionBlock>
  );
}

export function ProjectDetailTemplate() {
  return (
    <SectionBlock title="project detail" description="A timeline view for Input -> Project -> Phase -> Plan -> Validate -> Execute -> Improve.">
      <div className="grid gap-4 lg:grid-cols-3">
        <TimelinePhaseCard phase="Input" status="validated" owner="HQ" progress={100} />
        <TimelinePhaseCard phase="Plan" status="active" owner="HQ" progress={68} />
        <TimelinePhaseCard phase="Execute" status="planned" owner="Branch Office" progress={24} />
      </div>
    </SectionBlock>
  );
}

export function AiPlanTemplate() {
  return (
    <SectionBlock title="AI plan" description="Review ai_analysis, plan confidence, and validation notes before approval.">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <AiInsightCard title="ai_analysis summary" confidence={84}>
          Recommended plan groups work into three phase blocks with branch execution_update checkpoints.
        </AiInsightCard>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5">
          <TabsShell tabs={["plan", "validation", "approval"]} activeTab="plan" />
          <TextAreaField className="mt-5" label="approval decision notes" placeholder="Write decision notes for approval." />
        </div>
      </div>
    </SectionBlock>
  );
}

export function ValidationCenterTemplate() {
  return (
    <SectionBlock title="validation center" description="Surface hallucination limiter findings and confidence warnings.">
      <ValidationAlertsBlock />
    </SectionBlock>
  );
}

export function ApprovalsTemplate() {
  return (
    <SectionBlock title="approvals" description="Approve, reject, or request validation for submitted plan items.">
      <AlertBanner title="approval queue requires HQ review" tone="warning">
        Two plan entries need validation before final approval.
      </AlertBanner>
      <ApprovalActionBar />
    </SectionBlock>
  );
}

export function ReportsTemplate() {
  return (
    <SectionBlock title="reports" description="Summaries for project, approval, validation, and execution_update.">
      <div className="grid gap-5 lg:grid-cols-3">
        <ReportSummaryCard />
        <ChartCard title="report trend" />
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5">
          <h3 className="text-card-title text-synapse-text">Export</h3>
          <p className="mt-2 text-body text-synapse-muted">Download reports for HQ and Branch Office demos.</p>
          <PrimaryButton className="mt-5" icon={<Download className="h-4 w-4" />}>Download report</PrimaryButton>
        </div>
      </div>
    </SectionBlock>
  );
}

export function SettingsTemplate() {
  return (
    <SectionBlock title="settings" description="Configure team display values for HQ and Branch Office users.">
      <div className="grid gap-4 rounded-2xl border border-synapse-border bg-synapse-card p-5">
        <SelectField label="Default role" defaultValue="HQ">
          <option>HQ</option>
          <option>Branch Office</option>
        </SelectField>
        <FormField label="Default branch" placeholder="HQ" />
        <PrimaryButton icon={<Send className="h-4 w-4" />}>Save settings</PrimaryButton>
      </div>
    </SectionBlock>
  );
}
