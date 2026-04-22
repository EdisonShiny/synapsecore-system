"use client";

import { useEffect, useState } from "react";
import {
  AppShell,
  ApprovalBadge,
  EmptyState,
  FormField,
  PrimaryButton,
  SelectField,
  StatusBadge,
  TextAreaField
} from "@/components";
import { GuardedPageState, Panel, SimpleList } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { ProjectReport } from "@/types";
import type { OutcomeReviewInner } from "@/src/modules/ai";

export function ProjectDetailPageClient({ projectId }: { projectId: string }) {
  const { session, loading: sessionLoading } = useDemoSession();
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [successLevel, setSuccessLevel] = useState<"low" | "partial" | "successful" | "failed">("partial");
  const [unresolvedIssues, setUnresolvedIssues] = useState("");
  const [executionResult, setExecutionResult] = useState<{
    outcome_review: OutcomeReviewInner;
    next_phase: { phase_name: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        const data = await apiRequest<{ report: ProjectReport }>(
          `/api/reports/project/${projectId}`,
          { session }
        );

        if (active) {
          setReport(data.report);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load project.");
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
  }, [projectId, session]);

  const currentBundle = report?.phases[report.phases.length - 1] ?? null;

  async function handleSubmitExecution() {
    if (!session || !currentBundle) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<{
        execution_update: unknown;
        outcome_review: OutcomeReviewInner;
        next_phase: { phase_name: string } | null;
      }>(`/api/phases/${currentBundle.phase.id}/execute-update`, {
        method: "POST",
        session,
        json: {
          submitted_by: session.user.id,
          outcome_summary: outcomeSummary,
          evidence_text: evidenceText,
          file_url: null,
          success_level: successLevel,
          unresolved_issues: unresolvedIssues
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        }
      });

      setExecutionResult({
        outcome_review: result.outcome_review,
        next_phase: result.next_phase
      });

      const refreshed = await apiRequest<{ report: ProjectReport }>(
        `/api/reports/project/${projectId}`,
        { session }
      );
      setReport(refreshed.report);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit execution update.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell pageTitle="Project Detail" role={session?.user.role ?? "HQ"} activeItem="Projects">
      <GuardedPageState loading={sessionLoading || loading} error={error}>
        {report ? (
          <div className="grid gap-6">
            <Panel title={report.project.title} description="This page shows the current status and the next execution step.">
              <p className="text-body text-synapse-muted">{report.project.summary}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">{report.project.status.replaceAll("_", " ")}</StatusBadge>
                <ApprovalBadge state={report.project.approval_status} />
                <StatusBadge tone="warning">{report.project.priority}</StatusBadge>
              </div>
              <SimpleList
                items={report.phases.map((bundle) => ({
                  title: bundle.phase.phase_name,
                  description: bundle.phase.objective,
                  meta: bundle.plan ? `Plan: ${bundle.plan.expected_output}` : bundle.phase.status,
                  tone:
                    bundle.phase.status === "completed"
                      ? "success"
                      : bundle.phase.status === "blocked"
                        ? "error"
                        : "warning"
                }))}
                emptyLabel="No phases available yet."
              />
            </Panel>
            {currentBundle ? (
              <Panel title="Next action: submit execution update" description="Record the latest work completed for the current phase.">
                <FormField label="Current phase" value={currentBundle.phase.phase_name} readOnly />
                <TextAreaField
                  label="Outcome summary"
                  value={outcomeSummary}
                  onChange={(event) => setOutcomeSummary(event.target.value)}
                />
                <TextAreaField
                  label="Evidence text"
                  value={evidenceText}
                  onChange={(event) => setEvidenceText(event.target.value)}
                />
                <SelectField
                  label="Success level"
                  value={successLevel}
                  onChange={(event) => setSuccessLevel(event.target.value as typeof successLevel)}
                >
                  <option value="low">low</option>
                  <option value="partial">partial</option>
                  <option value="successful">successful</option>
                  <option value="failed">failed</option>
                </SelectField>
                <FormField
                  label="Unresolved issues"
                  hint="Separate multiple issues with commas."
                  value={unresolvedIssues}
                  onChange={(event) => setUnresolvedIssues(event.target.value)}
                />
                <PrimaryButton
                  loading={submitting}
                  onClick={handleSubmitExecution}
                  disabled={outcomeSummary.trim().length === 0 || evidenceText.trim().length === 0}
                >
                  Submit execution update
                </PrimaryButton>
              </Panel>
            ) : (
              <EmptyState title="No phases yet" description="Generate a project and first phase before submitting execution evidence." />
            )}
            {executionResult ? (
              <Panel title="Result" description="This is the system review of your latest execution update.">
                <p className="text-body text-synapse-muted">{executionResult.outcome_review.outcome_summary}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="info">{executionResult.outcome_review.success_level}</StatusBadge>
                  <StatusBadge tone={executionResult.outcome_review.next_phase_required ? "warning" : "success"}>
                    {executionResult.outcome_review.next_phase_required ? "next phase required" : "workflow can close"}
                  </StatusBadge>
                </div>
                {executionResult.next_phase ? (
                  <p className="text-body text-synapse-muted">
                    Recommended next phase: {executionResult.next_phase.phase_name}
                  </p>
                ) : null}
              </Panel>
            ) : null}
          </div>
        ) : null}
      </GuardedPageState>
    </AppShell>
  );
}
