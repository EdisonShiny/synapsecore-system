"use client";

import { useEffect, useState } from "react";
import { AppShell, EmptyState, SelectField } from "@/components";
import { GuardedPageState, MetricGrid, Panel, SimpleList } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { Branch, Project, ProjectReport, RiskReport, ValidationReport } from "@/types";

export function ReportsPageClient() {
  const { session, loading: sessionLoading } = useDemoSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectReport, setProjectReport] = useState<ProjectReport | null>(null);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function loadBase() {
      try {
        const [projectsData, branchesData] = await Promise.all([
          apiRequest<{ projects: Project[] }>("/api/projects", { session }),
          apiRequest<{ branches: Branch[] }>("/api/branches", { session })
        ]);

        if (!active) {
          return;
        }

        setProjects(projectsData.projects);
        setBranches(branchesData.branches);
        if (!selectedProjectId && projectsData.projects.length > 0) {
          setSelectedProjectId(projectsData.projects[0].id);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load report context.");
          setLoading(false);
        }
      }
    }

    void loadBase();

    return () => {
      active = false;
    };
  }, [selectedProjectId, session]);

  useEffect(() => {
    if (!session || !selectedProjectId) {
      return;
    }

    let active = true;

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const [projectData, riskData, validationData] = await Promise.all([
          apiRequest<{ report: ProjectReport }>(`/api/reports/project/${selectedProjectId}`, {
            session
          }),
          apiRequest<{ report: RiskReport }>("/api/reports/risk", { session }),
          apiRequest<{ report: ValidationReport }>("/api/reports/validation", { session })
        ]);

        if (!active) {
          return;
        }

        setProjectReport(projectData.report);
        setRiskReport(riskData.report);
        setValidationReport(validationData.report);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load reports.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [selectedProjectId, session]);

  const branchMetrics = branches.map((branch) => {
    const branchProjects = projects.filter((project) => project.branch_id === branch.id);
    const healthyProjects = branchProjects.filter((project) => project.status !== "escalated");

    return {
      branch: branch.name,
      value:
        branchProjects.length > 0
          ? Math.round((healthyProjects.length / branchProjects.length) * 100)
          : 0,
      label: `${branchProjects.length} tracked projects`
    };
  });

  const currentBundle = projectReport?.phases[projectReport.phases.length - 1] ?? null;

  return (
    <AppShell pageTitle="Reports" role={session?.user.role ?? "HQ"} activeItem="Reports">
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        {projectReport && riskReport && validationReport ? (
          <div className="grid gap-6">
            <Panel title="Choose project" description="Pick a project to see the simplest report summary.">
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
            <Panel title="Overview" description="Use this summary first before reading the details below.">
              <MetricGrid
                items={[
                  {
                    label: "Phases",
                    value: projectReport.phases.length,
                    tone: "info"
                  },
                  {
                    label: "Validation checks",
                    value: validationReport.validation_count,
                    tone: "warning"
                  },
                  {
                    label: "Human review",
                    value: validationReport.required_human_review_count,
                    tone: "warning"
                  },
                  {
                    label: "Avg groundedness",
                    value: validationReport.average_groundedness_score,
                    tone: "success"
                  }
                ]}
              />
            </Panel>
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Project summary" description="Current project state and latest workflow position.">
                <SimpleList
                  items={[
                    {
                      title: projectReport.project.title,
                      description: projectReport.project.summary,
                      meta: `Status: ${projectReport.project.status.replaceAll("_", " ")}`
                    },
                    {
                      title: "Current phase",
                      description: currentBundle?.phase.objective ?? "No phase available yet.",
                      meta: currentBundle?.phase.phase_name ?? "No phase"
                    },
                    {
                      title: "Latest approval",
                      description: projectReport.latest_approval?.request_summary ?? "No approval recorded yet.",
                      meta: projectReport.latest_approval?.status.replaceAll("_", " ") ?? "No approval"
                    }
                  ]}
                />
              </Panel>
              <Panel title="Top missing information" description="These are the main data gaps still affecting decisions.">
                <SimpleList
                  items={validationReport.top_missing_information.map((item) => ({
                    title: item,
                    meta: "Missing information"
                  }))}
                  emptyLabel="No major missing information."
                />
              </Panel>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Risk watchlist" description="These items need attention across the workflow.">
                <SimpleList
                  items={[
                    ...riskReport.high_risk_projects.map((project) => ({
                      title: project.title,
                      description: project.summary,
                      meta: "High risk project",
                      tone: "error" as const
                    })),
                    ...riskReport.escalated_projects.map((project) => ({
                      title: project.title,
                      description: project.summary,
                      meta: "Escalated project",
                      tone: "error" as const
                    })),
                    ...riskReport.blocked_phases.map((phase) => ({
                      title: phase.phase_name,
                      description: phase.objective,
                      meta: "Blocked phase",
                      tone: "warning" as const
                    })),
                    ...riskReport.approvals_requiring_attention.map((approval) => ({
                      title: approval.request_type,
                      description: approval.request_summary,
                      meta: approval.status.replaceAll("_", " "),
                      tone: "warning" as const
                    }))
                  ]}
                  emptyLabel="No major risk items."
                />
              </Panel>
              <Panel title="Branch health" description="Simple branch view based on active project status.">
                <SimpleList
                  items={branchMetrics.map((branch) => ({
                    title: branch.branch,
                    description: `${branch.value}% healthy workflow status`,
                    meta: branch.label
                  }))}
                  emptyLabel="No branch data available."
                />
              </Panel>
            </div>
          </div>
        ) : (
          <EmptyState title="No report data" description="Create projects and run the workflow to populate reports." />
        )}
      </GuardedPageState>
    </AppShell>
  );
}
