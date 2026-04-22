"use client";

import { cn } from "@/lib/utils";
import type { ApprovalStatus, UserRole } from "@/types/common";
import type { ConfidenceLevel, StatusTone } from "@/types/synapse";

const toneMap: Record<StatusTone, string> = {
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  error: "border-red-400/30 bg-red-400/10 text-red-300",
  info: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  neutral: "border-synapse-border bg-synapse-elevated text-synapse-muted"
};

const approvalTone: Record<ApprovalStatus, StatusTone> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  revise_requested: "info",
  escalated: "error"
};

const confidenceTone: Record<ConfidenceLevel, StatusTone> = {
  high: "success",
  medium: "warning",
  low: "error"
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function StatusBadge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-meta font-medium",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ApprovalBadge({ state }: { state: ApprovalStatus }) {
  return <StatusBadge tone={approvalTone[state]}>{state.replace("_", " ")}</StatusBadge>;
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return <StatusBadge tone={confidenceTone[level]}>{level} confidence</StatusBadge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <StatusBadge tone={role === "HQ" ? "info" : "neutral"}>{role}</StatusBadge>;
}

export function BranchTag({ branch }: { branch: string }) {
  return <StatusBadge tone="neutral">branch: {branch}</StatusBadge>;
}
