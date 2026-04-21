"use client";

import { AlertCircle, Loader2, SearchX } from "lucide-react";
import { SecondaryButton } from "@/components/ui/buttons";

export function EmptyState({
  title = "No records yet",
  description = "Create a project or adjust filters to continue.",
  action
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-synapse-border bg-synapse-card p-8 text-center">
      <div className="grid justify-items-center gap-3">
        <SearchX className="h-8 w-8 text-synapse-secondary" />
        <h3 className="text-card-title text-synapse-text">{title}</h3>
        <p className="max-w-md text-body text-synapse-muted">{description}</p>
        {action}
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading SynapseCore System" }: { label?: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-synapse-border bg-synapse-card p-8">
      <div className="flex items-center gap-3 text-body text-synapse-muted">
        <Loader2 className="h-5 w-5 animate-spin text-synapse-secondary" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Something needs attention",
  description = "Retry the workflow or check validation details.",
  action
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-red-400/30 bg-red-400/10 p-8 text-center">
      <div className="grid justify-items-center gap-3">
        <AlertCircle className="h-8 w-8 text-red-300" />
        <h3 className="text-card-title text-red-100">{title}</h3>
        <p className="max-w-md text-body text-red-200/80">{description}</p>
        {action ?? <SecondaryButton>Retry</SecondaryButton>}
      </div>
    </div>
  );
}
