"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, FileUploadBox, FormField, PrimaryButton, SecondaryButton, TextAreaField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { buildDatabaseAttachmentTree } from "@/src/modules/system/database-options";
import { sampleWorkflowTemplate } from "@/src/modules/system/sample-workflow";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
import { DatabaseContextSelector } from "@/components/system/database-context-selector";
import { formatDateTime } from "@/components/system/format";
import {
  EmptyBlock,
  PageSection,
  RecordList,
  StatGrid,
  ValidationBadge,
  WorkflowRunStatusBadge
} from "@/components/system/ui";
import type { DatabasePayload, WorkflowDetailPayload, WorkflowRunRecord } from "@/types/system";

export function WorkflowDetailPage({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [detail, setDetail] = useState<WorkflowDetailPayload | null>(null);
  const [runInput, setRunInput] = useState("");
  const [runAttachments, setRunAttachments] = useState<File[]>([]);
  const [selectedDatabasePaths, setSelectedDatabasePaths] = useState<string[]>([]);
  const [database, setDatabase] = useState<DatabasePayload | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setFeedback("");

      try {
        const data = await apiRequest<WorkflowDetailPayload>(`/api/workflows/${workflowId}`, {
          session
        });
        const databaseData = await apiRequest<DatabasePayload>("/api/database", { session });

        if (active) {
          setDetail(data);
          setDatabase(databaseData);
        }
      } catch (loadError) {
        if (active) {
          setFeedback(loadError instanceof Error ? loadError.message : "Failed to load workflow.");
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
  }, [session, workflowId]);

  const latestRun = useMemo(
    () => detail?.runs[0] ?? null,
    [detail]
  );
  const databaseAttachmentTree = useMemo(
    () => (database ? buildDatabaseAttachmentTree(database.company) : []),
    [database]
  );

  if (!session || sessionLoading) {
    return null;
  }

  async function refreshDetail() {
    if (!session) {
      return;
    }

    const data = await apiRequest<WorkflowDetailPayload>(`/api/workflows/${workflowId}`, {
      session
    });
    setDetail(data);
  }

  async function handleSaveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !detail) {
      return;
    }

    setSavingConfig(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ workflow: WorkflowDetailPayload["workflow"] }>(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        session,
        json: {
          name: detail.workflow.name,
          description: detail.workflow.description,
          config: detail.workflow.config
        }
      });
      setDetail((current) => (current ? { ...current, workflow: data.workflow } : current));
      setFeedback("Workflow configuration updated successfully.");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Workflow update failed.");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setRunning(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ run: WorkflowRunRecord }>(`/api/workflows/${workflowId}/runs`, {
        method: "POST",
        session,
        json: {
          unstructuredInput: runInput,
          attachments: await filesToAttachmentReferences(runAttachments),
          selectedDatabasePaths
        }
      });
      setRunInput("");
      setRunAttachments([]);
      await refreshDetail();
      setFeedback(
        data.run.status === "Completed"
          ? `Workflow completed and created ${data.run.createdProjectIds.length} project${data.run.createdProjectIds.length === 1 ? "" : "s"}.`
          : "Workflow run completed without reaching project creation."
      );
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Workflow execution failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Workflow Detail"
      description="Edit prompt configuration, run the staged loop, and inspect the workflow run history."
    >
      <PageSection title="Navigation">
        <div className="flex flex-wrap gap-3">
          <SecondaryButton type="button" onClick={() => router.push("/workflows")}>
            Back to workflows
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => router.push("/projects")}>
            Open projects
          </SecondaryButton>
        </div>
      </PageSection>

      {loading ? <p className="text-body text-synapse-muted">Loading workflow...</p> : null}
      {feedback ? (
        <p className={`text-body ${feedback.toLowerCase().includes("failed") ? "text-synapse-error" : "text-synapse-secondary"}`}>
          {feedback}
        </p>
      ) : null}

      {!loading && !detail ? (
        <PageSection title="Workflow unavailable">
          <EmptyBlock title="Workflow not found" description="The requested workflow could not be loaded." />
        </PageSection>
      ) : null}

      {detail ? (
        <>
          <PageSection title={detail.workflow.name} description={detail.workflow.description}>
            <StatGrid
              items={[
                {
                  label: "Runs",
                  value: detail.workflow.runCount,
                  helper: "Total execution runs for this workflow.",
                  tone: "info"
                },
                {
                  label: "Projects Created",
                  value: detail.workflow.projectCount,
                  helper: "Projects added to the database from successful runs.",
                  tone: "success"
                },
                {
                  label: "Last Run",
                  value: detail.workflow.lastRunAt ? formatDateTime(detail.workflow.lastRunAt) : "Never",
                  helper: "Most recent execution timestamp.",
                  tone: "warning"
                }
              ]}
            />
          </PageSection>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <PageSection
              title="Workflow configuration"
              description="Edit the preset prompts that define intake, validation, project building, phase progression, and phase reporting."
              action={
                <SecondaryButton
                  type="button"
                  onClick={() =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              name: sampleWorkflowTemplate.name,
                              description: sampleWorkflowTemplate.description,
                              config: sampleWorkflowTemplate.config
                            }
                          }
                        : current
                    )
                  }
                >
                  Load sample prompts
                </SecondaryButton>
              }
            >
              <form className="grid gap-4" onSubmit={handleSaveConfig}>
                <FormField
                  label="Workflow name"
                  required
                  value={detail.workflow.name}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: { ...current.workflow, name: event.target.value }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Workflow description"
                  required
                  value={detail.workflow.description}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: { ...current.workflow, description: event.target.value }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 1"
                  required
                  value={detail.workflow.config.reportPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, reportPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 2"
                  required
                  value={detail.workflow.config.extractorPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, extractorPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 3"
                  required
                  value={detail.workflow.config.validatorPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, validatorPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 4"
                  required
                  value={detail.workflow.config.projectBuilderPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, projectBuilderPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 5"
                  required
                  value={detail.workflow.config.phaseProgressPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, phaseProgressPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 6"
                  required
                  value={detail.workflow.config.phaseBuilderPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, phaseBuilderPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <TextAreaField
                  label="Preset prompt 9"
                  required
                  value={detail.workflow.config.phaseReportPrompt}
                  onChange={(event) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            workflow: {
                              ...current.workflow,
                              config: { ...current.workflow.config, phaseReportPrompt: event.target.value }
                            }
                          }
                        : current
                    )
                  }
                />
                <PrimaryButton loading={savingConfig} type="submit">
                  Save workflow configuration
                </PrimaryButton>
              </form>
            </PageSection>

            <PageSection title="Run workflow" description="Paste unstructured input here to start the staged report, extraction, validation, and project-building loop.">
              <form className="grid gap-4" onSubmit={handleRun}>
                <TextAreaField
                  label="Unstructured input"
                  required
                  value={runInput}
                  onChange={(event) => setRunInput(event.target.value)}
                  hint="Paste raw branch notes, field updates, customer feedback, demand signals, market notes, or mixed operational text."
                />
                <div className="grid gap-2">
                  <FileUploadBox
                    label="Attach supporting files"
                    hint="Text, CSV, JSON, and markdown files will be read inline. Other supported files are attached as metadata."
                    files={runAttachments}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,.json,.log,.xml"
                    onFilesChange={(files) => setRunAttachments((current) => [...current, ...files])}
                    onRemoveFile={(index) =>
                      setRunAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))
                    }
                  />
                </div>
                <DatabaseContextSelector
                  nodes={databaseAttachmentTree}
                  selectedPaths={selectedDatabasePaths}
                  onChange={setSelectedDatabasePaths}
                />
                <PrimaryButton loading={running} type="submit">
                  Run workflow
                </PrimaryButton>
              </form>

              {latestRun ? (
                <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-card-title text-synapse-text">Latest run</p>
                      <p className="mt-1 text-body text-synapse-muted">{formatDateTime(latestRun.updatedAt)}</p>
                    </div>
                    <WorkflowRunStatusBadge status={latestRun.status} />
                  </div>
                  <p className="mt-3 text-body text-synapse-muted">{latestRun.builderSummary || latestRun.validatorFeedback}</p>
                </div>
              ) : null}
            </PageSection>
          </div>

          <PageSection title="Run history" description="Each run shows the validation attempts and whether projects were created.">
            <RecordList
              items={detail.runs}
              emptyTitle="No runs yet"
              emptyDescription="Run the workflow once and the execution history will appear here."
              renderItem={(run) => (
                <div key={run.id} className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-card-title text-synapse-text">{run.workflowName}</p>
                      <p className="mt-1 text-body text-synapse-muted">
                        Executed by {run.executedByOfficeName} · {formatDateTime(run.updatedAt)}
                      </p>
                    </div>
                    <WorkflowRunStatusBadge status={run.status} />
                  </div>
                  <p className="mt-3 rounded-[18px] border border-synapse-border bg-white p-3 text-body text-synapse-text">
                    {run.unstructuredInput}
                  </p>
                  {(run.attachments.length > 0 || run.attachedDatabasePaths.length > 0 || run.webSearchEnabled) ? (
                    <div className="mt-4 rounded-[18px] border border-synapse-border bg-white p-4">
                      <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Attached context</p>
                      {run.attachments.length > 0 ? (
                        <div className="mt-3 grid gap-2 text-body text-synapse-text">
                          {run.attachments.map((attachment) => (
                            <p key={attachment.id}>{attachment.name} ({attachment.contentStatus ?? "metadata-only"})</p>
                          ))}
                        </div>
                      ) : null}
                      {run.attachedDatabasePaths.length > 0 ? (
                        <div className="mt-3 grid gap-2 text-body text-synapse-text">
                          {run.attachedDatabasePaths.map((path) => (
                            <p key={path}>{path}</p>
                          ))}
                        </div>
                      ) : null}
                      {run.webSearchEnabled ? (
                        <p className="mt-3 text-body text-synapse-muted">Web search tool requested for this AI call.</p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-3">
                    {run.attempts.map((attempt) => (
                      <div key={attempt.id} className="rounded-[18px] border border-synapse-border bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-card-title text-synapse-text">Attempt {attempt.attemptNumber}</p>
                            <p className="mt-1 text-body text-synapse-muted">{attempt.extraction.headline}</p>
                          </div>
                          <ValidationBadge result={attempt.validation.result} />
                        </div>
                        <p className="mt-3 text-body text-synapse-muted">{attempt.report}</p>
                        <p className="mt-3 text-body text-synapse-text">
                          <span className="font-semibold">Validation:</span> {attempt.validation.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                  {run.createdProjectIds.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {run.createdProjectIds.map((projectId, index) => (
                        <SecondaryButton key={projectId} type="button" onClick={() => router.push(`/projects/${projectId}`)}>
                          {run.createdProjectTitles[index] ?? `Project ${index + 1}`}
                        </SecondaryButton>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            />
          </PageSection>

          <PageSection title="Recent projects from this workflow" description="Successful runs add projects directly into the project database.">
            <RecordList
              items={detail.recentProjects}
              emptyTitle="No projects created yet"
              emptyDescription="Once validation passes, the project builder will add projects here."
              renderItem={(project) => (
                <div
                  key={project.id}
                  className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-white"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-card-title text-synapse-text">{project.subject}</p>
                      <p className="mt-1 text-body text-synapse-muted">{project.branchOfficeName}</p>
                    </div>
                    <SecondaryButton type="button" onClick={() => router.push(`/projects/${project.id}`)}>
                      Open project
                    </SecondaryButton>
                  </div>
                </div>
              )}
            />
          </PageSection>
        </>
      ) : null}
    </AppShell>
  );
}
