"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowRight, ShieldAlert } from "lucide-react";
import { AppShell, PrimaryButton, SecondaryButton } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { formatDateTime } from "@/components/system/format";
import { EmptyBlock, LoadingBlock, PageSection, RecordList, StatGrid, WorkflowStatusBadge } from "@/components/system/ui";
import type { ProjectRecord } from "@/types/system";

type ProjectsPageMode = "active" | "pending" | "archived";

function buildProjectBuckets(projects: ProjectRecord[]) {
  const archived = projects.filter((project) => project.lifecycleState === "Completed");
  const pending = projects.filter(
    (project) => project.lifecycleState !== "Completed" && project.status !== "Approved"
  );
  const active = projects.filter(
    (project) => project.lifecycleState !== "Completed" && project.status === "Approved"
  );

  return { active, pending, archived };
}

function ProjectCard({
  project,
  onOpen
}: {
  project: ProjectRecord;
  onOpen: (projectId: string) => void;
}) {
  const currentPhase = project.phases.find((phase) => phase.status === "Current") ?? null;

  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="grid gap-4 rounded-2xl border border-synapse-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-synapse-primary/40 hover:shadow-md"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-card-title text-synapse-text">{project.subject}</p>
          <p className="mt-2 text-body text-synapse-muted">{project.description}</p>
        </div>
        <WorkflowStatusBadge status={project.status} />
      </div>
      <div className="grid gap-3 text-body text-synapse-muted md:grid-cols-2 xl:grid-cols-4">
        <p>
          <span className="font-semibold text-synapse-text">Office:</span> {project.branchOfficeName}
        </p>
        <p>
          <span className="font-semibold text-synapse-text">Lifecycle:</span> {project.lifecycleState}
        </p>
        <p>
          <span className="font-semibold text-synapse-text">Updated:</span> {formatDateTime(project.updatedAt)}
        </p>
        <p>
          <span className="font-semibold text-synapse-text">Current phase:</span>{" "}
          {currentPhase ? currentPhase.title : "No current phase"}
        </p>
      </div>
    </button>
  );
}

function NavigationBlock({
  title,
  description,
  actionLabel,
  onOpen,
  icon
}: {
  title: string;
  description: string;
  actionLabel: string;
  onOpen: () => void;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-synapse-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3 text-synapse-primary">
            {icon}
          </div>
          <div>
            <p className="text-card-title text-synapse-text">{title}</p>
            <p className="mt-2 text-body text-synapse-muted">{description}</p>
          </div>
        </div>
        <PrimaryButton type="button" onClick={onOpen}>
          {actionLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function ProjectsPage({ mode = "active" }: { mode?: ProjectsPageMode }) {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
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
        const data = await apiRequest<{ projects: ProjectRecord[] }>("/api/projects", { session });

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

  const buckets = useMemo(() => buildProjectBuckets(projects), [projects]);

  const pageCopy = {
    active: {
      title: "Projects",
      description:
        "Approved active projects stay here. Not-approved projects and completed projects are separated below so the main working window stays focused.",
      items: buckets.active,
      emptyTitle: "No active approved projects",
      emptyDescription:
        "Projects will appear here after HQ approval. Completed projects move to the archive automatically.",
      navigationTitle: "Active Projects"
    },
    pending: {
      title: "Projects Awaiting Approval",
      description:
        "These projects are not approved yet, so they cannot progress into phase execution until HQ reviews them.",
      items: buckets.pending,
      emptyTitle: "No not-approved projects",
      emptyDescription:
        "Every current project is either approved and active, or already completed and archived.",
      navigationTitle: "Pending Projects"
    },
    archived: {
      title: "Archived Projects",
      description:
        "Completed projects are archived automatically once the phase progression logic closes them.",
      items: buckets.archived,
      emptyTitle: "No archived projects",
      emptyDescription:
        "Projects will appear here automatically after they complete their final phase and close successfully.",
      navigationTitle: "Archived Projects"
    }
  } satisfies Record<
    ProjectsPageMode,
    {
      title: string;
      description: string;
      items: ProjectRecord[];
      emptyTitle: string;
      emptyDescription: string;
      navigationTitle: string;
    }
  >;

  if (!session || sessionLoading) {
    return null;
  }

  const currentPage = pageCopy[mode];

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title={currentPage.title}
      description={currentPage.description}
    >
      <PageSection
        title={currentPage.title}
        description={currentPage.description}
        sectionId="projects-list"
        navigationTitle={currentPage.navigationTitle}
        action={
          mode === "active" ? (
            <SecondaryButton type="button" onClick={() => router.push("/application")}>
              Create manual project
            </SecondaryButton>
          ) : (
            <SecondaryButton type="button" onClick={() => router.push("/projects")}>
              Back to main projects
            </SecondaryButton>
          )
        }
      >
        <StatGrid
          items={[
            {
              label: "Active approved",
              value: buckets.active.length,
              helper: "Visible in the main working window.",
              tone: "success"
            },
            {
              label: "Not approved",
              value: buckets.pending.length,
              helper: "Needs HQ approval before use.",
              tone: "warning"
            },
            {
              label: "Archived",
              value: buckets.archived.length,
              helper: "Closed automatically after completion.",
              tone: "info"
            }
          ]}
        />
        {loading ? <LoadingBlock label="Loading projects" /> : null}
        {!loading && error ? <p className="text-body text-synapse-error">{error}</p> : null}
        {!loading && !error ? (
          <RecordList
            items={currentPage.items}
            emptyTitle={currentPage.emptyTitle}
            emptyDescription={currentPage.emptyDescription}
            renderItem={(project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={(projectId) => router.push(`/projects/${projectId}`)}
              />
            )}
          />
        ) : null}
      </PageSection>

      {mode === "active" ? (
        <>
          <PageSection
            title="Not Approved Projects"
            description="Projects that are still submitted, waiting for approval, or rejected are grouped separately here."
            sectionId="pending-projects-entry"
            navigationTitle="Not Approved Projects"
          >
            <NavigationBlock
              title="Open not-approved projects"
              description={`${buckets.pending.length} project${buckets.pending.length === 1 ? "" : "s"} currently need approval or further decision before phase execution can start.`}
              actionLabel="View not-approved projects"
              onOpen={() => router.push("/projects/pending")}
              icon={<ShieldAlert className="h-5 w-5" />}
            />
          </PageSection>

          <PageSection
            title="Archived Projects"
            description="Completed projects are removed from the active view automatically and kept in a separate archive."
            sectionId="archived-projects-entry"
            navigationTitle="Archived Projects"
          >
            <NavigationBlock
              title="Open archived projects"
              description={`${buckets.archived.length} completed project${buckets.archived.length === 1 ? "" : "s"} are currently archived and hidden from the main working list.`}
              actionLabel="View archived projects"
              onOpen={() => router.push("/projects/archived")}
              icon={<Archive className="h-5 w-5" />}
            />
          </PageSection>
        </>
      ) : null}

      {mode !== "active" ? (
        <PageSection
          title="Return"
          description="Go back to the main projects workspace when you are done reviewing this section."
          hideFromNavigation
        >
          <div className="flex justify-start">
            <PrimaryButton type="button" onClick={() => router.push("/projects")}>
              Back to projects <ArrowRight className="ml-2 h-4 w-4" />
            </PrimaryButton>
          </div>
        </PageSection>
      ) : null}
    </AppShell>
  );
}
