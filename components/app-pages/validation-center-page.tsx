"use client";

import { useEffect, useState } from "react";
import { AppShell, EmptyState, SelectField } from "@/components";
import { GuardedPageState, MetricGrid, Panel, SimpleList } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { Project, ProjectReport } from "@/types";

export function ValidationCenterPageClient() {
  const { session, loading: sessionLoading } = useDemoSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
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
          setLoading(false);
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
          setError(loadError instanceof Error ? loadError.message : "Failed to load validation data.");
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

  const validations = report?.phases.flatMap((bundle) => (bundle.validation ? [bundle.validation] : [])) ?? [];
  const findings = validations.flatMap((validation) => [
    ...validation.missing_information.map((item) => ({
      title: item,
      description: validation.impact_analysis,
      meta: "Missing information",
      tone: "warning" as const
    })),
    ...validation.unsupported_claims.map((item) => ({
      title: item,
      description: validation.impact_analysis,
      meta: "Unsupported claim",
      tone: "error" as const
    })),
    ...validation.contradiction_flags.map((item) => ({
      title: item,
      description: validation.impact_analysis,
      meta: "Contradiction",
      tone: "error" as const
    }))
  ]);

  return (
    <AppShell pageTitle="Validation" role={session?.user.role ?? "HQ"} activeItem="Validation">
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        {report ? (
          <div className="grid gap-6">
            <Panel title="Choose project" description="Pick a project to review only the important validation findings.">
              <SelectField
                label="Project"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </SelectField>
            </Panel>
            {validations.length > 0 ? (
              <>
                <Panel title="Validation summary" description="Use these numbers first to judge if the plan is safe to continue.">
                  <MetricGrid
                    items={[
                      {
                        label: "Checks run",
                        value: validations.length,
                        tone: "info"
                      },
                      {
                        label: "Need review",
                        value: validations.filter((entry) => entry.human_review_level === "required").length,
                        tone: "warning"
                      },
                      {
                        label: "Do not proceed",
                        value: validations.filter((entry) => entry.proceed_recommendation === "do_not_proceed").length,
                        tone: "error"
                      },
                      {
                        label: "Avg groundedness",
                        value:
                          Math.round(
                            validations.reduce((total, entry) => total + entry.groundedness_score, 0) /
                              validations.length
                          ) || 0,
                        tone: "success"
                      }
                    ]}
                  />
                </Panel>
                <Panel title="Important findings" description="Focus on these findings before approving the next step.">
                  <SimpleList
                    items={findings}
                    emptyLabel="No major validation findings."
                  />
                </Panel>
              </>
            ) : (
              <EmptyState title="No validation data" description="Generate and validate a phase plan first." />
            )}
          </div>
        ) : (
          <EmptyState title="No validation data" description="Generate and validate a phase plan first." />
        )}
      </GuardedPageState>
    </AppShell>
  );
}
