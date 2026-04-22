"use client";

import { useEffect, useState } from "react";
import {
  AppShell,
  ApprovalBadge,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TextAreaField
} from "@/components";
import { GuardedPageState, Panel } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { Approval, Project } from "@/types";

export function ApprovalsPageClient() {
  const { session, loading: sessionLoading } = useDemoSession();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notesByApproval, setNotesByApproval] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [approvalsData, projectsData] = await Promise.all([
          apiRequest<{ approvals: Approval[] }>("/api/approvals", { session }),
          apiRequest<{ projects: Project[] }>("/api/projects", { session })
        ]);

        if (!active) {
          return;
        }

        setApprovals(approvalsData.approvals);
        setProjects(projectsData.projects);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load approvals.");
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

  async function handleDecision(approvalId: string, status: Approval["status"]) {
    if (!session) {
      return;
    }

    setWorkingId(approvalId);
    setError(null);

    try {
      await apiRequest<{ approval: Approval }>(`/api/approvals/${approvalId}/decision`, {
        method: "POST",
        session,
        json: {
          status,
          decision_note: notesByApproval[approvalId] ?? ""
        }
      });

      const refreshed = await apiRequest<{ approvals: Approval[] }>("/api/approvals", { session });
      setApprovals(refreshed.approvals);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Failed to record approval decision.");
    } finally {
      setWorkingId(null);
    }
  }

  const projectNameById = Object.fromEntries(projects.map((project) => [project.id, project.title]));

  return (
    <AppShell pageTitle="Approvals" role={session?.user.role ?? "HQ"} activeItem="Approvals">
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        {approvals.length === 0 ? (
          <EmptyState title="No approvals" description="Approval requests will appear here after a phase is validated." />
        ) : (
          <Panel title="Approvals" description="Read the request, add a note if needed, then choose one decision.">
            <div className="grid gap-4">
              {approvals.map((approval) => (
                <div key={approval.id} className="grid gap-4 rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-card-title text-synapse-text">
                        {projectNameById[approval.project_id] ?? approval.request_type}
                      </h3>
                      <p className="mt-1 text-body text-synapse-muted">{approval.request_summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ApprovalBadge state={approval.status} />
                      <StatusBadge tone={approval.risk_level === "high" ? "error" : approval.risk_level === "medium" ? "warning" : "success"}>
                        {approval.risk_level}
                      </StatusBadge>
                    </div>
                  </div>
                  <p className="text-body text-synapse-muted">{approval.ai_recommendation}</p>
                  {session?.user.role === "HQ" && approval.status === "pending" ? (
                    <>
                      <TextAreaField
                        label="Decision note"
                        value={notesByApproval[approval.id] ?? ""}
                        onChange={(event) =>
                          setNotesByApproval((current) => ({
                            ...current,
                            [approval.id]: event.target.value
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-3">
                        <PrimaryButton
                          loading={workingId === approval.id}
                          onClick={() => handleDecision(approval.id, "approved")}
                        >
                          Approve
                        </PrimaryButton>
                        <SecondaryButton
                          loading={workingId === approval.id}
                          onClick={() => handleDecision(approval.id, "revise_requested")}
                        >
                          Request revision
                        </SecondaryButton>
                        <SecondaryButton
                          loading={workingId === approval.id}
                          onClick={() => handleDecision(approval.id, "rejected")}
                        >
                          Reject
                        </SecondaryButton>
                        <SecondaryButton
                          loading={workingId === approval.id}
                          onClick={() => handleDecision(approval.id, "escalated")}
                        >
                          Escalate
                        </SecondaryButton>
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
        )}
      </GuardedPageState>
    </AppShell>
  );
}
