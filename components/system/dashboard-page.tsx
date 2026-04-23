"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { PageSection, RecordList, StatGrid, WorkflowStatusBadge } from "@/components/system/ui";
import { formatDateTime } from "@/components/system/format";
import type { DashboardPayload } from "@/types/system";

export function DashboardPage() {
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

  if (!session || sessionLoading || loading) {
    return <div className="p-6"><PageSection title="Loading dashboard"><p className="text-body text-synapse-muted">Loading current workflow status.</p></PageSection></div>;
  }

  if (error || !summary) {
    return <div className="p-6"><PageSection title="Dashboard unavailable"><p className="text-body text-synapse-error">{error || "Unable to load dashboard."}</p></PageSection></div>;
  }

  const isHq = session.user.role === "HQ";

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Dashboard"
      description={
        isHq
          ? "Portfolio-level oversight across approvals, branch intelligence, and urgent issues."
          : "Branch-level overview of applications, planning signals, and escalations."
      }
    >
      <PageSection
        title={isHq ? "HQ summary" : "Branch summary"}
        description="A high-level view of application status, planning insights, and issue escalation."
      >
        <StatGrid
          items={[
            {
              label: "Submitted",
              value: summary.counts.Submitted,
              helper: "New items just entered the workflow.",
              tone: "info"
            },
            {
              label: "AI Processing",
              value: summary.counts["AI Processing"],
              helper: "Requests undergoing AI report generation.",
              tone: "info"
            },
            {
              label: "Waiting for Approval",
              value: summary.counts["Waiting for Approval"],
              helper: isHq ? "Queue requiring HQ action." : "Branch items pending HQ decision.",
              tone: "warning"
            },
            {
              label: "Approved",
              value: summary.counts.Approved,
              helper: "Accepted applications in the current cycle.",
              tone: "success"
            },
            {
              label: "Rejected",
              value: summary.counts.Rejected,
              helper: "Items that can be revised through appeal.",
              tone: "error"
            }
          ]}
        />
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection
          title={isHq ? "Approval visibility" : "Application visibility"}
          description={isHq ? "Recent branch submissions and decision outcomes." : "Your most recent branch applications."}
        >
          <RecordList
            items={summary.latestProjects}
            emptyTitle="No project records yet"
            emptyDescription={isHq ? "Branch applications will appear here after submission." : "Create an application to populate the branch dashboard."}
            renderItem={(project) => (
              <div key={project.id} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{project.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">{project.branchOfficeName}</p>
                  </div>
                  <WorkflowStatusBadge status={project.status} />
                </div>
                <p className="mt-3 text-body text-synapse-muted line-clamp-2">{project.description}</p>
                <p className="mt-3 text-meta text-synapse-muted">{formatDateTime(project.updatedAt)}</p>
              </div>
            )}
          />
        </PageSection>

        <PageSection
          title="Reported issues"
          description={isHq ? "Urgent bi-directional issue threads across the network." : "Latest issue escalations and HQ responses."}
        >
          <RecordList
            items={summary.latestIssues}
            emptyTitle="No active issues"
            emptyDescription="Issue threads will appear here when branch or HQ submits an escalation."
            renderItem={(issue) => (
              <div key={issue.id} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{issue.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      {issue.createdByOfficeName} to {issue.targetOfficeName}
                    </p>
                  </div>
                  <WorkflowStatusBadge status={issue.status === "Resolved" ? "Approved" : issue.status === "Responded" ? "Waiting for Approval" : "Rejected"} />
                </div>
                <p className="mt-3 text-body text-synapse-muted line-clamp-2">{issue.messages[issue.messages.length - 1]?.message}</p>
                <p className="mt-3 text-meta text-synapse-muted">{formatDateTime(issue.updatedAt)}</p>
              </div>
            )}
          />
        </PageSection>
      </div>

      <PageSection
        title="Plan & Validate insight snapshot"
        description={isHq ? "Overall and per-branch AI conclusions for planning and risk." : "Latest branch demand, finance, and risk judgment."}
      >
        <RecordList
          items={summary.latestPlanInsights}
          emptyTitle="No plan insights yet"
          emptyDescription="Upload datasets in Plan & Validate to generate the first structured AI judgment."
          renderItem={(insight) => (
            <div key={insight.id} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-card-title text-synapse-text">{insight.scope === "overall" ? "Overall company view" : insight.officeName}</p>
                  <p className="mt-1 text-body text-synapse-muted">{insight.demandConclusion}</p>
                </div>
                <WorkflowStatusBadge status="AI Processing" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-synapse-border bg-white p-3">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Demand</p>
                  <p className="mt-2 text-body text-synapse-text">{insight.demandConclusion}</p>
                </div>
                <div className="rounded-2xl border border-synapse-border bg-white p-3">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Financial</p>
                  <p className="mt-2 text-body text-synapse-text">{insight.financialConclusion}</p>
                </div>
                <div className="rounded-2xl border border-synapse-border bg-white p-3">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Risk</p>
                  <p className="mt-2 text-body text-synapse-text">{insight.riskConclusion}</p>
                </div>
              </div>
            </div>
          )}
        />
      </PageSection>
    </AppShell>
  );
}
