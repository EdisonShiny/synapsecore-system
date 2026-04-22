"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components";
import { GuardedPageState, MetricGrid, Panel, SimpleList } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { Approval, Branch, DashboardActivity, DashboardAlert, DashboardSummary, Project } from "@/types";

export function DashboardPageClient() {
  const { session, loading: sessionLoading } = useDemoSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
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
        const [summaryData, alertsData, activityData, approvalsData, projectsData, branchesData] =
          await Promise.all([
            apiRequest<{ summary: DashboardSummary }>("/api/dashboard/summary", { session }),
            apiRequest<{ alerts: DashboardAlert[] }>("/api/dashboard/alerts", { session }),
            apiRequest<{ activity: DashboardActivity[] }>("/api/dashboard/activity", { session }),
            apiRequest<{ approvals: Approval[] }>("/api/approvals", { session }),
            apiRequest<{ projects: Project[] }>("/api/projects", { session }),
            apiRequest<{ branches: Branch[] }>("/api/branches", { session })
          ]);

        if (!active) {
          return;
        }

        setSummary(summaryData.summary);
        setAlerts(alertsData.alerts);
        setActivity(activityData.activity);
        setApprovals(approvalsData.approvals);
        setProjects(projectsData.projects);
        setBranches(branchesData.branches);
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

  const branchNameById = Object.fromEntries(branches.map((branch) => [branch.id, branch.name]));
  const pendingApprovals = approvals.slice(0, 3).map((approval) => {
    const project = projects.find((entry) => entry.id === approval.project_id);

    return {
      id: approval.id,
      project: project?.title ?? approval.request_type,
      branch: project?.branch_id ? branchNameById[project.branch_id] ?? "Unknown branch" : "Unknown branch",
      state: approval.status
    };
  });

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

  return (
    <AppShell
      pageTitle="Dashboard"
      role={session?.user.role ?? "HQ"}
      activeItem="Dashboard"
    >
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        {summary ? (
          <div className="grid gap-6">
            <Panel title="Overview" description="Start here. This shows the current system state and the main queue to clear next.">
              <MetricGrid
                items={[
                  { label: "Active projects", value: summary.active_projects, tone: "info" },
                  {
                    label: "Need validation",
                    value: summary.validation_pending_projects,
                    tone: "warning"
                  },
                  {
                    label: "Need approval",
                    value: summary.approval_pending_projects,
                    tone: "warning"
                  },
                  { label: "Completed", value: summary.completed_projects, tone: "success" }
                ]}
              />
            </Panel>
            <Panel title="What needs attention" description="Handle these first so projects keep moving.">
              <SimpleList
                items={alerts.map((alert) => ({
                  title: alert.title,
                  description: alert.description,
                  meta: new Date(alert.created_at).toLocaleString(),
                  tone:
                    alert.risk_level === "high"
                      ? "error"
                      : alert.risk_level === "medium"
                        ? "warning"
                        : "info"
                }))}
                emptyLabel="No urgent alerts."
              />
            </Panel>
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Recent activity" description="Latest updates from branches and HQ.">
                <SimpleList
                  items={activity.slice(0, 6).map((item) => ({
                    title: item.message,
                    description: `${item.actor_name} (${item.actor_role})`,
                    meta: new Date(item.created_at).toLocaleString(),
                    tone:
                      item.approval_status === "rejected" || item.project_status === "escalated"
                        ? "error"
                        : "info"
                  }))}
                  emptyLabel="No recent activity."
                />
              </Panel>
              <Panel title="Approval queue" description="These items are closest to a decision.">
                <SimpleList
                  items={pendingApprovals.map((approval) => ({
                    title: approval.project,
                    description: approval.branch,
                    meta: approval.state.replaceAll("_", " "),
                    tone:
                      approval.state === "approved"
                        ? "success"
                        : approval.state === "pending"
                          ? "warning"
                          : approval.state === "rejected"
                            ? "error"
                            : "info"
                  }))}
                  emptyLabel="No approvals waiting."
                />
              </Panel>
            </div>
            <Panel title="Branch health" description="Quick view of how each branch is doing.">
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
        ) : null}
      </GuardedPageState>
    </AppShell>
  );
}
