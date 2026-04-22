"use client";

import { AlertTriangle, Bot, CheckCircle2, Clock, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseStatus, StatusTone } from "@/types/synapse";
import { ApprovalBadge, BranchTag, ConfidenceBadge, StatusBadge } from "@/components/ui/badges";
import { ConfidenceMeter, ProgressBar } from "@/components/ui/feedback";
import { PrimaryButton, SecondaryButton, DangerButton } from "@/components/ui/buttons";

export function KpiCard({
  label,
  value,
  trend,
  tone = "info"
}: {
  label: string;
  value: string;
  trend?: string;
  tone?: StatusTone;
}) {
  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-body text-synapse-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-synapse-text">{value}</p>
        </div>
        <StatusBadge tone={tone}>{tone}</StatusBadge>
      </div>
      {trend ? (
        <p className="mt-4 flex items-center gap-2 text-meta text-synapse-muted">
          <TrendingUp className="h-4 w-4 text-synapse-success" />
          {trend}
        </p>
      ) : null}
    </div>
  );
}

export function ChartCard({
  title,
  children,
  action
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-card-title text-synapse-text">{title}</h3>
        {action}
      </div>
      {children ?? (
        <div className="flex h-72 items-end gap-3 rounded-xl border border-synapse-border bg-synapse-elevated p-4">
          {[42, 68, 51, 84, 62, 76, 91].map((height, index) => (
            <div key={index} className="flex flex-1 items-end">
              <div className="w-full rounded-t-lg bg-synapse-primary/80" style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiInsightCard({
  title,
  confidence,
  children
}: {
  title: string;
  confidence: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-blue-400/25 bg-blue-400/10 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-synapse-primary p-2 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-card-title text-synapse-text">{title}</h3>
          <p className="text-meta text-synapse-muted">ai_analysis for project, phase, and plan.</p>
        </div>
      </div>
      <div className="mb-4 text-body text-synapse-muted">{children}</div>
      <ConfidenceMeter value={confidence} />
    </div>
  );
}

export function ValidationWarningCard({
  title,
  description,
  severity = "warning"
}: {
  title: string;
  description: string;
  severity?: "warning" | "error";
}) {
  return (
    <div className={cn("rounded-2xl border p-5", severity === "error" ? "border-red-400/30 bg-red-400/10" : "border-amber-400/30 bg-amber-400/10")}>
      <div className="flex gap-3">
        <AlertTriangle className={cn("mt-0.5 h-5 w-5", severity === "error" ? "text-red-300" : "text-amber-300")} />
        <div>
          <h3 className="text-card-title text-synapse-text">{title}</h3>
          <p className="mt-1 text-body text-synapse-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

const phaseTone: Record<PhaseStatus, StatusTone> = {
  planned: "neutral",
  active: "info",
  validated: "success",
  executed: "success",
  improving: "warning"
};

export function TimelinePhaseCard({
  phase,
  status,
  owner,
  progress
}: {
  phase: string;
  status: PhaseStatus;
  owner: "HQ" | "Branch Office";
  progress: number;
}) {
  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-card-title text-synapse-text">phase: {phase}</h3>
          <p className="text-meta text-synapse-muted">Owner role: {owner}</p>
        </div>
        <StatusBadge tone={phaseTone[status]}>{status}</StatusBadge>
      </div>
      <ProgressBar value={progress} label="phase progress" />
    </div>
  );
}

export function ActivityFeedItem({
  title,
  meta,
  tone = "info"
}: {
  title: string;
  meta: string;
  tone?: StatusTone;
}) {
  return (
    <div className="flex gap-3 rounded-xl p-3 transition hover:bg-synapse-elevated">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-synapse-secondary" />
      <div>
        <p className="text-body text-synapse-text">{title}</p>
        <p className="mt-1 text-meta text-synapse-muted">{meta}</p>
        <div className="mt-2">
          <StatusBadge tone={tone}>activity</StatusBadge>
        </div>
      </div>
    </div>
  );
}

export function ApprovalActionBar({
  onApprove,
  onReject,
  onRequestValidation,
  loading
}: {
  onApprove?: () => void;
  onReject?: () => void;
  onRequestValidation?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-synapse-border bg-synapse-elevated p-4 sm:flex-row sm:items-center sm:justify-end">
      <SecondaryButton onClick={onRequestValidation}>Request validation</SecondaryButton>
      <DangerButton onClick={onReject}>Reject approval</DangerButton>
      <PrimaryButton loading={loading} onClick={onApprove}>
        Approve plan
      </PrimaryButton>
    </div>
  );
}

export function PendingApprovalListCard() {
  const approvals = [
    { project: "project Alpha", branch: "North", state: "pending" as const },
    { project: "project Delta", branch: "South", state: "needs_validation" as const },
    { project: "project Orion", branch: "HQ", state: "approved" as const }
  ];

  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
      <h3 className="mb-4 text-card-title text-synapse-text">Pending approval list</h3>
      <div className="grid gap-3">
        {approvals.map((item) => (
          <div key={item.project} className="flex items-center justify-between gap-3 rounded-xl bg-synapse-elevated p-3">
            <div>
              <p className="text-body text-synapse-text">{item.project}</p>
              <BranchTag branch={item.branch} />
            </div>
            <ApprovalBadge state={item.state} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickActionPanel() {
  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
      <h3 className="text-card-title text-synapse-text">Quick actions</h3>
      <div className="mt-4 grid gap-3">
        <PrimaryButton icon={<FileText className="h-4 w-4" />}>Create project</PrimaryButton>
        <SecondaryButton icon={<Bot className="h-4 w-4" />}>Open AI Workflow</SecondaryButton>
        <SecondaryButton icon={<CheckCircle2 className="h-4 w-4" />}>Review approval</SecondaryButton>
      </div>
    </div>
  );
}

export function BranchPerformanceBlock() {
  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
      <h3 className="text-card-title text-synapse-text">branch performance</h3>
      <div className="mt-4 grid gap-4">
        {["North", "South", "Central"].map((branch, index) => (
          <div key={branch} className="grid gap-2">
            <div className="flex justify-between text-body">
              <span className="text-synapse-text">{branch}</span>
              <span className="text-synapse-muted">{82 - index * 9}%</span>
            </div>
            <ProgressBar value={82 - index * 9} label="execution_update health" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValidationAlertsBlock() {
  return (
    <div className="grid gap-3">
      <ValidationWarningCard title="validation warning" description="plan contains an assumption requiring HQ review before approval." />
      <ValidationWarningCard title="hallucination limiter triggered" description="ai_analysis references a missing branch file." severity="error" />
    </div>
  );
}

export function ReportSummaryCard() {
  return (
    <div className="rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-synapse-secondary" />
        <h3 className="text-card-title text-synapse-text">report summary</h3>
      </div>
      <ConfidenceBadge level="high" />
      <p className="mt-3 text-body text-synapse-muted">Latest report combines project, approval, validation, and execution_update signals.</p>
    </div>
  );
}
