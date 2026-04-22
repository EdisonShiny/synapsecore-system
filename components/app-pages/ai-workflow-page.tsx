"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppShell,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  StatusBadge
} from "@/components";
import { GuardedPageState, Panel, StepStrip } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { Project, ProjectReport } from "@/types";

export function AiWorkflowPageClient({
  initialProjectId = ""
}: {
  initialProjectId?: string;
}) {
  const router = useRouter();
  const { session, loading: sessionLoading } = useDemoSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function loadProjects() {
      try {
        const data = await apiRequest<{ projects: Project[] }>("/api/projects", { session });
        if (!active) {
          return;
        }

        setProjects(data.projects);
        if (!selectedProjectId && data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load projects.");
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [selectedProjectId, session]);

  useEffect(() => {
    if (!session || !selectedProjectId) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadReport() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiRequest<{ report: ProjectReport }>(
          `/api/reports/project/${selectedProjectId}`,
          { session }
        );
        if (active) {
          setReport(data.report);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load workflow data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [selectedProjectId, session]);

  const currentBundle = report?.phases[report.phases.length - 1] ?? null;

  async function reloadReport() {
    if (!session || !selectedProjectId) {
      return;
    }

    const data = await apiRequest<{ report: ProjectReport }>(
      `/api/reports/project/${selectedProjectId}`,
      { session }
    );
    setReport(data.report);
  }

  async function handleGeneratePlan() {
    if (!session || !currentBundle) {
      return;
    }

    setWorking(true);
    setError(null);

    try {
      await apiRequest(`/api/ai/generate-phase-plan`, {
        method: "POST",
        session,
        json: { phase_id: currentBundle.phase.id }
      });
      await reloadReport();
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Failed to generate plan.");
    } finally {
      setWorking(false);
    }
  }

  async function handleValidatePlan() {
    if (!session || !currentBundle) {
      return;
    }

    setWorking(true);
    setError(null);

    try {
      await apiRequest(`/api/ai/validate-phase-plan`, {
        method: "POST",
        session,
        json: { phase_id: currentBundle.phase.id }
      });
      await reloadReport();
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Failed to validate plan.");
    } finally {
      setWorking(false);
    }
  }

  async function handleRequestApproval() {
    if (!session || !currentBundle || !report) {
      return;
    }

    setWorking(true);
    setError(null);

    try {
      await apiRequest(`/api/approvals/request`, {
        method: "POST",
        session,
        json: {
          project_id: report.project.id,
          phase_id: currentBundle.phase.id
        }
      });
      await reloadReport();
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Failed to request approval.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell pageTitle="Plan & Validate" role={session?.user.role ?? "HQ"} activeItem="Plan & Validate">
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        <div className="grid gap-6">
          <Panel title="Choose project" description="Pick one project, then press the next button in order.">
            <SelectField
              label="Project"
              value={selectedProjectId}
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
                router.replace(`/ai-workflow?projectId=${event.target.value}`);
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </SelectField>
          </Panel>
          {report && currentBundle ? (
            <>
              <StepStrip
                steps={["Generate plan", "Validate plan", "Request approval"]}
                current={currentBundle.validation ? 2 : currentBundle.plan ? 1 : 0}
              />
              <Panel title="Current status" description="Read this once, then continue with the next action below.">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                    <h3 className="text-body font-medium text-synapse-text">Issue summary</h3>
                    <p className="mt-2 text-body text-synapse-muted">
                      {report.ai_analysis[0]?.summary ?? "No AI summary is linked to this project yet."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                    <h3 className="text-body font-medium text-synapse-text">Current phase</h3>
                    <p className="mt-2 text-body text-synapse-muted">{currentBundle.phase.phase_name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge tone="info">{currentBundle.phase.status}</StatusBadge>
                      {currentBundle.validation ? (
                        <StatusBadge tone="warning">
                          {currentBundle.validation.proceed_recommendation.replaceAll("_", " ")}
                        </StatusBadge>
                      ) : null}
                    </div>
                  </div>
                </div>
                {currentBundle.plan ? (
                  <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                    <h3 className="text-body font-medium text-synapse-text">Plan output</h3>
                    <p className="mt-2 text-body text-synapse-muted">{currentBundle.plan.expected_output}</p>
                  </div>
                ) : null}
              </Panel>
              <Panel title="Next action" description="Press the next button in order. Later buttons unlock after the earlier step is done.">
                <div className="flex flex-wrap gap-3">
                  <PrimaryButton loading={working} onClick={handleGeneratePlan}>
                    Generate plan
                  </PrimaryButton>
                  <SecondaryButton loading={working} onClick={handleValidatePlan} disabled={!currentBundle.plan}>
                    Validate plan
                  </SecondaryButton>
                  <SecondaryButton loading={working} onClick={handleRequestApproval} disabled={!currentBundle.validation}>
                    Request approval
                  </SecondaryButton>
                </div>
              </Panel>
            </>
          ) : (
            <EmptyState
              title="No project selected"
              description="Choose a project first or create one from branch input."
            />
          )}
        </div>
      </GuardedPageState>
    </AppShell>
  );
}
