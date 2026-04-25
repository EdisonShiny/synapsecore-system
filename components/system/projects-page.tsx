"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PrimaryButton, SecondaryButton, SelectField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { formatDateTime } from "@/components/system/format";
import {
  EmptyBlock,
  PageSection,
  RecordList,
  StatGrid,
  WorkflowStatusBadge
} from "@/components/system/ui";
import type { ProjectRecord, WorkflowStatus } from "@/types/system";

type ProjectStatusFilter = "All" | "Awaiting HQ" | Exclude<WorkflowStatus, "AI Processing" | "Submitted" | "Waiting for Approval">;

const statusOptions: ProjectStatusFilter[] = [
  "All",
  "Awaiting HQ",
  "Approved",
  "Rejected"
];

function isAwaitingHq(project: ProjectRecord) {
  return project.status === "Submitted" || project.status === "Waiting for Approval";
}

export function ProjectsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("All");
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
        const data = await apiRequest<{ projects: ProjectRecord[] }>("/api/projects", {
          session
        });

        if (active) {
          setProjects(data.projects);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load projects.");
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

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (statusFilter === "All") {
        return true;
      }

      if (statusFilter === "Awaiting HQ") {
        return isAwaitingHq(project);
      }

      return project.status === statusFilter;
    });
  }, [projects, statusFilter]);

  const counts = useMemo(
    () => ({
      total: projects.length,
      awaitingHq: projects.filter((project) => isAwaitingHq(project)).length,
      approved: projects.filter((project) => project.status === "Approved").length,
      rejected: projects.filter((project) => project.status === "Rejected").length
    }),
    [projects]
  );

  if (!session || sessionLoading) {
    return null;
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Projects"
      description="Browse the projects that were created from successful workflow runs and track their current approval state."
    >
      <PageSection
        title="Project portfolio"
        description="This is the current project database for the company network."
        action={
          <div className="w-full md:w-56">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>
        }
      >
        <StatGrid
          items={[
            {
              label: "Total Projects",
              value: counts.total,
              helper: "Projects currently stored in the system database.",
              tone: "info"
            },
            {
              label: "Awaiting HQ",
              value: counts.awaitingHq,
              helper: "Submitted or resubmitted projects that still need an HQ decision.",
              tone: "warning"
            },
            {
              label: "Approved",
              value: counts.approved,
              helper: "Projects already cleared to proceed.",
              tone: "success"
            },
            {
              label: "Rejected",
              value: counts.rejected,
              helper: "Projects sent back for revision or rethinking.",
              tone: "error"
            }
          ]}
        />
      </PageSection>

      <PageSection
        title="Available projects"
        description="Open a project to inspect the original workflow output, AI report, and request history."
      >
        {loading ? <p className="text-body text-synapse-muted">Loading projects...</p> : null}
        {error ? <p className="text-body text-synapse-error">{error}</p> : null}
        {!loading && !error ? (
          <RecordList
            items={filteredProjects}
            emptyTitle="No projects yet"
            emptyDescription="Run a workflow successfully and the system will add projects to the database."
            renderItem={(project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-synapse-border bg-synapse-elevated p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-white"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{project.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      {project.branchOfficeName}
                      {project.workflowName ? ` · ${project.workflowName}` : ""}
                    </p>
                  </div>
                  <WorkflowStatusBadge status={project.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-body text-synapse-muted">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-meta text-synapse-muted">
                  <span>Updated {formatDateTime(project.updatedAt)}</span>
                  <span>{project.appealCount} rework cycle{project.appealCount === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <PrimaryButton type="button" onClick={() => router.push(`/projects/${project.id}`)}>
                    Open project
                  </PrimaryButton>
                  {project.workflowId ? (
                    <SecondaryButton
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/workflows/${project.workflowId}`);
                      }}
                    >
                      Open workflow
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            )}
          />
        ) : null}
      </PageSection>

      {!loading && !error && projects.length === 0 ? (
        <PageSection title="Suggested next move">
          <EmptyBlock
            title="Start by creating a workflow"
            description="Define the four preset prompts first, then run unstructured input through the workflow so projects can be created automatically."
          />
        </PageSection>
      ) : null}
    </AppShell>
  );
}
