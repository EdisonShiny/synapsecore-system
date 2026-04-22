"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, ApprovalBadge, EmptyState, PrimaryButton, StatusBadge } from "@/components";
import { Panel, GuardedPageState } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { Branch, Project } from "@/types";

export function ProjectsPageClient() {
  const { session, loading: sessionLoading } = useDemoSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
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
        const [projectsData, branchesData] = await Promise.all([
          apiRequest<{ projects: Project[] }>("/api/projects", { session }),
          apiRequest<{ branches: Branch[] }>("/api/branches", { session })
        ]);

        if (!active) {
          return;
        }

        setProjects(projectsData.projects);
        setBranches(branchesData.branches);
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

  const branchNameById = Object.fromEntries(branches.map((branch) => [branch.id, branch.name]));

  return (
    <AppShell pageTitle="Projects" role={session?.user.role ?? "HQ"} activeItem="Projects">
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        {projects.length === 0 ? (
          <EmptyState
            title="No projects available"
            description="Create a new project from branch input to begin the workflow."
            action={
              <Link href="/projects/create">
                <PrimaryButton>Create project</PrimaryButton>
              </Link>
            }
          />
        ) : (
          <Panel
            title="Projects"
            description="Track project status, branch ownership, and approval progress."
            action={
              <Link href="/projects/create">
                <PrimaryButton>Create project</PrimaryButton>
              </Link>
            }
          >
            <div className="grid gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="grid gap-4 rounded-xl border border-synapse-border bg-synapse-elevated p-4 transition hover:border-synapse-secondary"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-card-title text-synapse-text">{project.title}</h3>
                      <p className="mt-1 text-body text-synapse-muted">{project.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="info">{project.priority}</StatusBadge>
                      <StatusBadge tone={project.status === "escalated" ? "error" : project.status === "completed" ? "success" : "warning"}>
                        {project.status.replaceAll("_", " ")}
                      </StatusBadge>
                      <ApprovalBadge state={project.approval_status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-meta text-synapse-muted">
                    <span>Branch: {branchNameById[project.branch_id] ?? "Unknown branch"}</span>
                    <span>Owner: {project.owner_role}</span>
                    <span>Type: {project.project_type}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        )}
      </GuardedPageState>
    </AppShell>
  );
}
