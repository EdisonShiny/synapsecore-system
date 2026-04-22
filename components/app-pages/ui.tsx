"use client";

import type { ReactNode } from "react";
import { EmptyState, ErrorState, StatusBadge, LoadingState } from "@/components";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-4 rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-panel md:p-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-card-title text-synapse-text">{title}</h2>
          {description ? <p className="mt-1 text-body text-synapse-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function GuardedPageState({
  loading,
  error,
  empty,
  children
}: {
  loading?: boolean;
  error?: string | null;
  empty?: { title: string; description: string } | null;
  children: ReactNode;
}) {
  if (loading) {
    return <LoadingState label="Loading workflow data" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  if (empty) {
    return <EmptyState title={empty.title} description={empty.description} />;
  }

  return <>{children}</>;
}

export function MetricGrid({
  items
}: {
  items: Array<{ label: string; value: string | number; tone?: "success" | "warning" | "error" | "info" | "neutral" }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">{item.label}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-2xl font-semibold text-synapse-text">{item.value}</p>
            {item.tone ? <StatusBadge tone={item.tone}>{item.label}</StatusBadge> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleList({
  items,
  emptyLabel = "Nothing to show."
}: {
  items: Array<{ title: string; description?: string; meta?: string; tone?: "success" | "warning" | "error" | "info" | "neutral" }>;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-body text-synapse-muted">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta ?? ""}`} className="rounded-xl border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-body font-medium text-synapse-text">{item.title}</p>
              {item.description ? <p className="mt-1 text-body text-synapse-muted">{item.description}</p> : null}
            </div>
            {item.tone ? <StatusBadge tone={item.tone}>{item.meta ?? "status"}</StatusBadge> : null}
          </div>
          {!item.tone && item.meta ? <p className="mt-2 text-meta text-synapse-muted">{item.meta}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function StepStrip({
  steps,
  current
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
    >
      {steps.map((step, index) => {
        const tone =
          index < current ? "success" : index === current ? "info" : "neutral";

        return (
          <div key={step} className="rounded-xl border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body font-medium text-synapse-text">{step}</p>
              <StatusBadge tone={tone}>{index + 1}</StatusBadge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
