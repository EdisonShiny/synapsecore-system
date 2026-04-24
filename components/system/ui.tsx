"use client";

import { AlertTriangle, CheckCircle2, Clock3, FileWarning, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badges";
import type { AiInsight, ValidationResultStatus, WorkflowRunStatus, WorkflowStatus } from "@/types/system";

export function PageSection({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-4 rounded-[24px] border border-synapse-border/90 bg-white/90 p-5 shadow-panel md:p-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-section-title text-synapse-text">{title}</h2>
          {description ? <p className="mt-1 text-body text-synapse-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatGrid({
  items
}: {
  items: Array<{ label: string; value: string | number; helper?: string; tone?: "success" | "warning" | "error" | "info" | "neutral" }>;
}) {
  const toneStyles: Record<NonNullable<(typeof items)[number]["tone"]>, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400"
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
          <div className="flex items-center gap-2">
            {item.tone ? <span className={cn("h-2.5 w-2.5 rounded-full", toneStyles[item.tone])} aria-hidden /> : null}
            <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">{item.label}</p>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <p className="text-[28px] font-semibold leading-none text-synapse-text">{item.value}</p>
          </div>
          {item.helper ? <p className="mt-3 text-body text-synapse-muted">{item.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function SplitPanel({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">{left}{right}</div>;
}

export function EmptyBlock({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-synapse-border bg-synapse-elevated/80 p-8 text-center">
      <p className="text-card-title text-synapse-text">{title}</p>
      <p className="mt-2 text-body text-synapse-muted">{description}</p>
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center gap-3 rounded-[22px] border border-synapse-border bg-white/90 text-body text-synapse-muted shadow-panel">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const tone =
    status === "Approved"
      ? "success"
      : status === "Rejected"
        ? "error"
        : status === "Waiting for Approval"
          ? "warning"
          : "info";

  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}

export function StatusIcon({ status }: { status: WorkflowStatus }) {
  const className = "h-4 w-4";

  if (status === "Approved") {
    return <CheckCircle2 className={cn(className, "text-emerald-600")} />;
  }

  if (status === "Rejected") {
    return <FileWarning className={cn(className, "text-red-600")} />;
  }

  if (status === "Waiting for Approval") {
    return <Clock3 className={cn(className, "text-amber-600")} />;
  }

  return <AlertTriangle className={cn(className, "text-blue-600")} />;
}

export function RecordList<T>({
  items,
  renderItem,
  emptyTitle,
  emptyDescription
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return <EmptyBlock title={emptyTitle} description={emptyDescription} />;
  }

  return <div className="grid gap-3">{items.map(renderItem)}</div>;
}

export function WorkflowRunStatusBadge({ status }: { status: WorkflowRunStatus }) {
  const tone = status === "Completed" ? "success" : status === "Failed" ? "error" : "info";
  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}

export function ValidationBadge({ result }: { result: ValidationResultStatus }) {
  return <StatusBadge tone={result === "Pass" ? "success" : "warning"}>{result}</StatusBadge>;
}

export function WorkflowStageMap({
  stages
}: {
  stages: Array<{
    label: string;
    description: string;
    state: "done" | "active" | "upcoming" | "blocked";
  }>;
}) {
  const stateStyles: Record<(typeof stages)[number]["state"], string> = {
    done: "border-emerald-200 bg-emerald-50",
    active: "border-blue-200 bg-blue-50",
    upcoming: "border-synapse-border bg-synapse-elevated",
    blocked: "border-amber-200 bg-amber-50"
  };

  const dotStyles: Record<(typeof stages)[number]["state"], string> = {
    done: "bg-emerald-500",
    active: "bg-blue-500",
    upcoming: "bg-slate-300",
    blocked: "bg-amber-500"
  };

  const stateLabels: Record<(typeof stages)[number]["state"], string> = {
    done: "Done",
    active: "Active",
    upcoming: "Upcoming",
    blocked: "Needs attention"
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {stages.map((stage, index) => (
        <div
          key={stage.label}
          className={cn("rounded-[22px] border p-4 shadow-sm", stateStyles[stage.state])}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", dotStyles[stage.state])} aria-hidden />
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Step {index + 1}</p>
            </div>
            <StatusBadge tone={stage.state === "done" ? "success" : stage.state === "active" ? "info" : stage.state === "blocked" ? "warning" : "neutral"}>
              {stateLabels[stage.state]}
            </StatusBadge>
          </div>
          <p className="mt-3 text-card-title text-synapse-text">{stage.label}</p>
          <p className="mt-2 text-body text-synapse-muted">{stage.description}</p>
        </div>
      ))}
    </div>
  );
}

export function AiTransparencyPanel({
  insight,
  title = "AI Transparency"
}: {
  insight: AiInsight;
  title?: string;
}) {
  return (
    <div className="grid gap-4 rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
      <div>
        <p className="text-card-title text-synapse-text">{title}</p>
        <p className="mt-1 text-body text-synapse-muted">Visible reasoning direction from input through final output.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[18px] border border-synapse-border bg-white p-4">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Direct Result / Final Conclusion</p>
          <p className="mt-3 text-body font-medium text-synapse-text">{insight.directResult}</p>
          <p className="mt-3 text-body text-synapse-muted">{insight.finalConclusion}</p>
          <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-body text-blue-800">
            <span className="font-semibold">AI advice:</span> {insight.advice}
          </div>
        </div>
        <div className="rounded-[18px] border border-synapse-border bg-white p-4">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Detailed Thinking Direction / Workflow</p>
          <div className="mt-3 grid gap-3">
            {insight.workflow.map((step) => (
              <div key={step.title} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3">
                <p className="text-body font-semibold text-synapse-text">{step.title}</p>
                <p className="mt-1 text-body text-synapse-muted">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-[18px] border border-synapse-border bg-white p-4">
        <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Evidence Used</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {insight.evidence.map((item) => (
            <div key={`${item.label}-${item.source}`} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-body font-semibold text-synapse-text">{item.label}</p>
                <StatusBadge tone={item.source === "External" ? "info" : item.source === "Internal" ? "warning" : "neutral"}>
                  {item.source}
                </StatusBadge>
              </div>
              <p className="mt-1 text-body text-synapse-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
