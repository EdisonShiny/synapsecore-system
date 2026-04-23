"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types/synapse";

const toneClass: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-synapse-border bg-synapse-elevated text-synapse-text"
};

export function AlertBanner({
  tone = "info",
  title,
  children
}: {
  tone?: StatusTone;
  title: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", toneClass[tone])} role="status">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-card-title">{title}</p>
        {children ? <div className="mt-1 text-body text-synapse-muted">{children}</div> : null}
      </div>
    </div>
  );
}

export function ModalDialog({
  open,
  title,
  children,
  onClose,
  panelClassName
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  panelClassName?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={cn("w-full max-w-lg rounded-2xl border border-synapse-border bg-synapse-card p-6 shadow-soft", panelClassName)}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-section-title text-synapse-text">{title}</h2>
          <button className="synapse-focus rounded-xl p-2 text-synapse-muted hover:bg-synapse-elevated hover:text-synapse-text" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TabsShell({
  tabs,
  activeTab,
  onChange
}: {
  tabs: string[];
  activeTab: string;
  onChange?: (tab: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-synapse-border bg-synapse-elevated p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={cn(
            "synapse-focus rounded-lg px-3 py-2 text-body transition",
            activeTab === tab ? "bg-synapse-primary text-white" : "text-synapse-muted hover:text-synapse-text"
          )}
          onClick={() => onChange?.(tab)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-meta text-synapse-muted">
        <span>{label ?? "Progress"}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-synapse-elevated">
        <div className="h-full rounded-full bg-synapse-primary" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  return <ProgressBar value={value} label="ai_analysis confidence" />;
}
