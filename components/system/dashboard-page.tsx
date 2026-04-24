"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PrimaryButton, SecondaryButton } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import {
  EmptyBlock,
  PageSection,
  RecordList,
  StatGrid,
  WorkflowStageMap,
  WorkflowStatusBadge
} from "@/components/system/ui";
import { formatDateTime } from "@/components/system/format";
import type { DashboardPayload } from "@/types/system";

function buildTopLevelStages(summary: DashboardPayload) {
  const hasRecords = summary.projectTotal > 0;
  const hasApprovalQueue = summary.counts["Waiting for Approval"] > 0;
  const hasApproved = summary.counts.Approved > 0;

  return [
    {
      label: "Intake messy business signals",
      description: "Branches feed raw demand, inventory, feedback, document, and market signals into the system.",
      state: hasRecords ? ("done" as const) : ("active" as const)
    },
    {
      label: "Identify potential project",
      description: "AI turns those inputs into structured project candidates with visible reasoning.",
      state: hasRecords ? ("done" as const) : ("upcoming" as const)
    },
    {
      label: "Plan and validate",
      description: "The next layer builds the initial phase plan and runs groundedness or hallucination checks.",
      state: hasRecords ? ("active" as const) : ("upcoming" as const)
    },
    {
      label: "Request approval",
      description: "HQ reviews the structured candidate and decides whether the workflow can proceed.",
      state: hasApprovalQueue ? ("active" as const) : hasApproved ? ("done" as const) : ("upcoming" as const)
    },
    {
      label: "Capture outcome and next phase",
      description: "Later stages will loop execution outcomes back into next-phase planning.",
      state: hasApproved ? ("active" as const) : ("upcoming" as const)
    }
  ];
}

export function DashboardPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [summary, setSummary] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest<{ summary: DashboardPayload }>("/api/dashboard/summary", {
          session
        });

        if (active) {
          setSummary(data.summary);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [session]);

  const isHq = session?.user.role === "HQ";
  const stages = useMemo(() => (summary ? buildTopLevelStages(summary) : []), [summary]);

  if (!session || sessionLoading || loading) {
    return (
      <div className="p-6">
        <PageSection title="Loading dashboard">
          <p className="text-body text-synapse-muted">Loading current workflow status.</p>
        </PageSection>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6">
        <PageSection title="Dashboard unavailable">
          <p className="text-body text-synapse-error">{error || "Unable to load dashboard."}</p>
        </PageSection>
      </div>
    );
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Dashboard"
      description={
        isHq
          ? "Top-level oversight across AI project identification, validation readiness, approvals, and cross-branch issues."
          : "Branch view of the staged AI workflow, from raw input through approval and later outcome capture."
      }
    >
      <PageSection
        title="System workflow view"
        description="The product is now centered on a staged AI workflow rather than a standalone application form."
      >
        <WorkflowStageMap stages={stages} />
      </PageSection>

      <PageSection
        title={isHq ? "HQ workflow summary" : "Branch workflow summary"}
        description="A fast read on where the current records are sitting inside the pipeline."
      >
        <StatGrid
          items={[
            {
              label: "Signals captured",
              value: summary.projectTotal,
              helper: "Raw branch inputs that became structured workflow candidates.",
              tone: "info"
            },
            {
              label: "Approval pending",
              value: summary.counts["Waiting for Approval"],
              helper: isHq ? "Records waiting on HQ action." : "Your records waiting for HQ review.",
              tone: "warning"
            },
            {
              label: "Approved",
              value: summary.counts.Approved,
              helper: "Candidates cleared to move toward execution and outcome capture.",
              tone: "success"
            },
            {
              label: "Rejected",
              value: summary.counts.Rejected,
              helper: "Records that should be rewritten and re-entered.",
              tone: "error"
            },
            {
              label: "Unread issues",
              value: summary.unreadIssues,
              helper: "Urgent blockers or escalations still needing attention.",
              tone: "neutral"
            }
          ]}
        />
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection
          title="Latest workflow candidates"
          description={isHq ? "Recent branch signals after AI project identification." : "Your most recent branch workflow candidates."}
        >
          <RecordList
            items={summary.latestProjects}
            emptyTitle="No workflow records yet"
            emptyDescription={isHq ? "Branch inputs will appear here after the first signal is submitted." : "Create the first workflow input to start the staged process."}
            renderItem={(project) => (
              <div key={project.id} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{project.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">{project.branchOfficeName}</p>
                  </div>
                  <WorkflowStatusBadge status={project.status} />
                </div>
                <p className="mt-3 text-body text-synapse-muted line-clamp-2">{project.report.aiOutput.directResult}</p>
                <p className="mt-3 text-meta text-synapse-muted">{formatDateTime(project.updatedAt)}</p>
              </div>
            )}
          />
        </PageSection>

        <PageSection
          title="Workflow blockers and issues"
          description={isHq ? "Cross-branch escalations that can interrupt planning, approval, or execution." : "Latest branch blockers and HQ responses."}
        >
          <RecordList
            items={summary.latestIssues}
            emptyTitle="No active blockers"
            emptyDescription="Use Report Issues when a field problem needs escalation or coordination."
            renderItem={(issue) => (
              <div key={issue.id} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{issue.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      {issue.createdByOfficeName} to {issue.targetOfficeName}
                    </p>
                  </div>
                  <div className="rounded-full border border-synapse-border bg-white px-3 py-1 text-meta text-synapse-muted">
                    {issue.urgency}
                  </div>
                </div>
                <p className="mt-3 text-body text-synapse-muted line-clamp-2">{issue.aiOutput.advice}</p>
                <p className="mt-3 text-meta text-synapse-muted">{formatDateTime(issue.updatedAt)}</p>
              </div>
            )}
          />
        </PageSection>
      </div>

      <PageSection
        title="Next recommended move"
        description="Use this to keep the build and the demo story centered on the actual workflow."
      >
        {summary.projectTotal === 0 ? (
          <EmptyBlock
            title="Start with the first raw signal"
            description="Create the first HQ or branch account, then submit an unstructured branch input in Workflow."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-card-title text-synapse-text">Primary action</p>
              <p className="mt-2 text-body text-synapse-muted">
                {summary.counts["Waiting for Approval"] > 0
                  ? "Finish the human approval layer on the waiting workflow candidates."
                  : "Move the latest workflow candidate into planning and validation."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <PrimaryButton type="button" onClick={() => router.push("/application")}>
                  Open Workflow
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => router.push("/plan-validate")}>
                  Open Plan & Validate
                </SecondaryButton>
              </div>
            </div>
            <div className="rounded-[22px] border border-synapse-border bg-white p-4">
              <p className="text-card-title text-synapse-text">Secondary action</p>
              <p className="mt-2 text-body text-synapse-muted">
                Use Report Issues when a branch blocker, data ambiguity, or operational risk needs visible escalation.
              </p>
              <div className="mt-4">
                <SecondaryButton type="button" onClick={() => router.push("/issues")}>
                  Open Report Issues
                </SecondaryButton>
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </AppShell>
  );
}
