"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, FileUploadBox, PrimaryButton, SecondaryButton, TextAreaField, WebLinkInputBox } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { buildDatabaseAttachmentTree } from "@/src/modules/system/database-options";
import { DatabaseContextSelector } from "@/components/system/database-context-selector";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
import { formatDateTime } from "@/components/system/format";
import { AiTransparencyPanel, EmptyBlock, PageSection, WorkflowStatusBadge } from "@/components/system/ui";
import type { DatabasePayload, GeneratePhaseReportResult, ProjectPhaseRecord, ProjectRecord, WebLinkCheckResult } from "@/types/system";
import { buildPhaseReportPdf, buildPhaseReportPdfFileName } from "@/src/utils/pdf";

function PhaseCard({
  phase,
  current
}: {
  phase: ProjectPhaseRecord;
  current: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        current
          ? "border-blue-200 bg-blue-50"
          : "border-synapse-border bg-synapse-elevated"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-card-title text-synapse-text">{phase.title}</p>
          <p className="mt-1 text-body text-synapse-muted">{phase.objective}</p>
        </div>
        <div className="rounded-full border border-synapse-border bg-white px-3 py-1 text-meta text-synapse-muted">
          {phase.status}
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-synapse-border bg-white p-4">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Actionable plans</p>
          <div className="mt-3 grid gap-2 text-body text-synapse-text">
            {phase.actionablePlans.length > 0 ? (
              phase.actionablePlans.map((plan, index) => <p key={`${phase.id}-plan-${index}`}>{index + 1}. {plan}</p>)
            ) : (
              <p className="text-synapse-muted">No plans recorded.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-synapse-border bg-white p-4">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Expected outcome / aim</p>
          <p className="mt-3 text-body text-synapse-text">{phase.expectedOutcome || "No expected outcome recorded."}</p>
          {phase.completedAt ? (
            <p className="mt-3 text-meta text-synapse-muted">Completed {formatDateTime(phase.completedAt)}</p>
          ) : null}
        </div>
      </div>
      {phase.completionInput ? (
        <div className="mt-4 rounded-xl border border-synapse-border bg-white p-4">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Outcome input</p>
          <p className="mt-3 text-body text-synapse-text">{phase.completionInput}</p>
          {phase.completionAttachments.length > 0 ? (
            <>
              <p className="mt-4 text-meta uppercase tracking-[0.08em] text-synapse-muted">Attached files</p>
              <div className="mt-2 grid gap-2 text-body text-synapse-text">
                {phase.completionAttachments.map((attachment) => (
                  <p key={attachment.id}>{attachment.name} ({attachment.contentStatus ?? "metadata-only"})</p>
                ))}
              </div>
            </>
          ) : null}
          {(phase.completionLinks?.length ?? 0) > 0 ? (
            <>
              <p className="mt-4 text-meta uppercase tracking-[0.08em] text-synapse-muted">Attached links</p>
              <div className="mt-2 grid gap-2 text-body text-synapse-text">
                {phase.completionLinks.map((link) => (
                  <p key={link.id}>{link.title || link.normalizedUrl} ({link.normalizedUrl})</p>
                ))}
              </div>
            </>
          ) : null}
          {phase.completionDatabasePaths.length > 0 ? (
            <>
              <p className="mt-4 text-meta uppercase tracking-[0.08em] text-synapse-muted">Attached database context</p>
              <div className="mt-2 grid gap-2 text-body text-synapse-text">
                {phase.completionDatabasePaths.map((path) => (
                  <p key={path}>{path}</p>
                ))}
              </div>
            </>
          ) : null}
          {phase.completionReport ? (
            <>
              <p className="mt-4 text-meta uppercase tracking-[0.08em] text-synapse-muted">Phase report</p>
              <p className="mt-2 text-body text-synapse-muted">{phase.completionReport}</p>
            </>
          ) : null}
          {phase.validationSummary ? (
            <p className="mt-4 text-body text-synapse-text">
              <span className="font-semibold">Validation:</span> {phase.validationSummary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [outcomeInput, setOutcomeInput] = useState("");
  const [phaseAttachments, setPhaseAttachments] = useState<File[]>([]);
  const [phaseLinks, setPhaseLinks] = useState<WebLinkCheckResult[]>([]);
  const [selectedDatabasePaths, setSelectedDatabasePaths] = useState<string[]>([]);
  const [database, setDatabase] = useState<DatabasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPhaseReport, setGeneratingPhaseReport] = useState(false);
  const [phaseReportResult, setPhaseReportResult] = useState<GeneratePhaseReportResult | null>(null);
  const [copiedPhaseReport, setCopiedPhaseReport] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest<{ project: ProjectRecord }>(`/api/projects/${projectId}`, {
          session
        });
        const databaseData = await apiRequest<DatabasePayload>("/api/database", { session });

        if (active) {
          setProject(data.project);
          setDatabase(databaseData);
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

  const currentPhase = useMemo(
    () => project?.phases.find((phase) => phase.status === "Current") ?? null,
    [project]
  );

  function downloadPhaseReportPdf(result: GeneratePhaseReportResult, projectSubject: string) {
    if (typeof window === "undefined") {
      return;
    }

    const pdfBlob = buildPhaseReportPdf({
      result,
      projectSubject
    });
    const fileName = buildPhaseReportPdfFileName(projectSubject, result.phaseTitle);
    const objectUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
  const databaseAttachmentTree = useMemo(
    () => (database ? buildDatabaseAttachmentTree(database.company) : []),
    [database]
  );

  if (!session || sessionLoading) {
    return null;
  }

  async function reloadProject() {
    if (!session) {
      return;
    }

    const data = await apiRequest<{ project: ProjectRecord }>(`/api/projects/${projectId}`, {
      session
    });
    setProject(data.project);
  }

  async function handleProgressPhase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !project) {
      return;
    }

    if (phaseLinks.some((link) => link.status !== "allowed")) {
      setFeedback("Remove blocked or invalid links before progressing the phase.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ project: ProjectRecord }>(`/api/projects/${project.id}/progress`, {
        method: "POST",
        session,
        json: {
          unstructuredInput: outcomeInput,
          attachments: await filesToAttachmentReferences(phaseAttachments),
          links: phaseLinks,
          selectedDatabasePaths
        }
      });
      setProject(data.project);
      setOutcomeInput("");
      setPhaseAttachments([]);
      setPhaseLinks([]);
      setFeedback(
        data.project.lifecycleState === "Completed"
          ? "Project phase validated and the project is now closed."
          : "Project phase validated and the next phase was generated."
      );
      await reloadProject();
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Phase progression failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGeneratePhaseReport() {
    if (!session || !project) {
      return;
    }

    setGeneratingPhaseReport(true);
    setCopiedPhaseReport(false);
    setFeedback("");

    try {
      const data = await apiRequest<{ result: GeneratePhaseReportResult }>(
        `/api/projects/${project.id}/phase-report`,
        {
          method: "POST",
          session
        }
      );
      setPhaseReportResult(data.result);
      downloadPhaseReportPdf(data.result, project.subject);
      setFeedback("Phase report generated successfully and downloaded as PDF.");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Phase report generation failed.");
    } finally {
      setGeneratingPhaseReport(false);
    }
  }

  async function handleCopyPhaseReport() {
    if (!phaseReportResult?.report || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(phaseReportResult.report);
    setCopiedPhaseReport(true);
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Project Detail"
      description="Inspect the project, review phase history, and submit outcome input after executing the current plan."
    >
      <PageSection title="Navigation">
        <div className="flex flex-wrap gap-3">
          <SecondaryButton type="button" onClick={() => router.push("/projects")}>
            Back to projects
          </SecondaryButton>
          {project?.workflowId ? (
            <PrimaryButton type="button" onClick={() => router.push(`/workflows/${project.workflowId}`)}>
              Open source workflow
            </PrimaryButton>
          ) : null}
        </div>
      </PageSection>

      {loading ? <p className="text-body text-synapse-muted">Loading project...</p> : null}
      {error ? <p className="text-body text-synapse-error">{error}</p> : null}
      {feedback ? (
        <p className={`text-body ${feedback.toLowerCase().includes("failed") ? "text-synapse-error" : "text-synapse-secondary"}`}>
          {feedback}
        </p>
      ) : null}

      {!loading && !error && !project ? (
        <PageSection title="Project unavailable">
          <EmptyBlock title="Project not found" description="The requested project could not be loaded." />
        </PageSection>
      ) : null}

      {project ? (
        <>
          <PageSection title={project.subject} description="This project was created from a validated workflow run.">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="grid gap-2 text-body text-synapse-muted">
                <p><span className="font-semibold text-synapse-text">Office:</span> {project.branchOfficeName}</p>
                <p><span className="font-semibold text-synapse-text">Workflow:</span> {project.workflowName ?? "Manual record"}</p>
                <p><span className="font-semibold text-synapse-text">Created:</span> {formatDateTime(project.createdAt)}</p>
                <p><span className="font-semibold text-synapse-text">Lifecycle:</span> {project.lifecycleState}</p>
              </div>
              <WorkflowStatusBadge status={project.status} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Project summary</p>
                <p className="mt-3 text-body text-synapse-text">{project.description}</p>
              </div>
              <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Applicant</p>
                <div className="mt-3 grid gap-2 text-body text-synapse-text">
                  <p>{project.applicantName}</p>
                  <p>{project.position}</p>
                  <p>{project.email}</p>
                </div>
              </div>
            </div>
            {project.workflowId && project.phases.length > 0 ? (
              <div className="rounded-2xl border border-synapse-border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Phase report</p>
                    <p className="mt-2 text-body text-synapse-muted">
                      Generate a copy-ready phase report from AI records using preset prompt 9.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <PrimaryButton
                      type="button"
                      loading={generatingPhaseReport}
                      onClick={handleGeneratePhaseReport}
                    >
                      Generate phase report
                    </PrimaryButton>
                    {phaseReportResult ? (
                      <SecondaryButton
                        type="button"
                        onClick={() =>
                          project
                            ? downloadPhaseReportPdf(phaseReportResult, project.subject)
                            : undefined
                        }
                      >
                        Download PDF
                      </SecondaryButton>
                    ) : null}
                    {phaseReportResult ? (
                      <SecondaryButton type="button" onClick={handleCopyPhaseReport}>
                        {copiedPhaseReport ? "Copied" : "Copy report"}
                      </SecondaryButton>
                    ) : null}
                  </div>
                </div>
                {phaseReportResult ? (
                  <div className="mt-4 grid gap-4">
                    <textarea
                      className="min-h-56 w-full rounded-xl border border-synapse-border bg-synapse-elevated p-4 text-body text-synapse-text shadow-sm"
                      readOnly
                      value={phaseReportResult.report}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                        <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Generated for</p>
                        <p className="mt-2 text-body text-synapse-text">{phaseReportResult.phaseTitle}</p>
                      </div>
                      <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4">
                        <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Validation</p>
                        <p className="mt-2 text-body text-synapse-text">
                          {phaseReportResult.validation?.summary ?? "No validation summary available."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </PageSection>

          <PageSection
            title="Current actionable plan"
            description="Execute the current phase plans, then submit unstructured outcome input to trigger the next-phase workflow."
          >
            {currentPhase ? (
              <div className="grid gap-4">
                <PhaseCard phase={currentPhase} current />
                {project.status === "Approved" && project.lifecycleState === "Active" ? (
                  <form className="grid gap-4 rounded-2xl border border-synapse-border bg-white p-4" onSubmit={handleProgressPhase}>
                    <TextAreaField
                      label="Phase outcome input"
                      required
                      value={outcomeInput}
                      onChange={(event) => setOutcomeInput(event.target.value)}
                      hint="Paste the unstructured result from executing the current phase. This will trigger prompt 5, extraction, validation, and prompt 6 for the next phase or closure."
                    />
                    <div className="grid gap-2">
                      <FileUploadBox
                        label="Attach phase files"
                        hint="Attach field notes, CSVs, markdown, JSON, or other supported files to enrich the outcome input."
                        files={phaseAttachments}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,.json,.log,.xml"
                        onFilesChange={(files) => setPhaseAttachments((current) => [...current, ...files])}
                        onRemoveFile={(index) =>
                          setPhaseAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))
                        }
                      />
                    </div>
                    <WebLinkInputBox
                      session={session}
                      label="Attach web links"
                      hint="Each link is checked immediately. Only pages that allow scraping can be submitted and added to the phase context."
                      links={phaseLinks}
                      onChange={setPhaseLinks}
                    />
                    <DatabaseContextSelector
                      nodes={databaseAttachmentTree}
                      selectedPaths={selectedDatabasePaths}
                      onChange={setSelectedDatabasePaths}
                    />
                    <PrimaryButton loading={submitting} type="submit">
                      Submit outcome and progress phase
                    </PrimaryButton>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-synapse-border bg-white p-4">
                    <p className="text-body text-synapse-muted">
                      {project.status !== "Approved"
                        ? "This project must be approved before phase progression can begin."
                        : "This project is already completed."}
                    </p>
                    {project.status !== "Approved" ? (
                      <div className="mt-4">
                        <PrimaryButton type="button" onClick={() => router.push("/requests")}>
                          Open requests window
                        </PrimaryButton>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <EmptyBlock
                title="No active phase"
                description="This project does not yet contain a current actionable phase."
              />
            )}
          </PageSection>

          <PageSection title="Project phases history" description="Every completed or generated phase stays attached to the project record.">
            <div className="grid gap-4">
              {project.phases.length > 0 ? (
                project.phases
                  .slice()
                  .sort((left, right) => left.phaseNumber - right.phaseNumber)
                  .map((phase) => (
                    <PhaseCard key={phase.id} phase={phase} current={phase.status === "Current"} />
                  ))
              ) : (
                <EmptyBlock
                  title="No phase history"
                  description="This project has not yet stored any phase plans."
                />
              )}
            </div>
          </PageSection>

          <PageSection title="Approval history" description="This tracks the request state after the workflow built the project.">
            <div className="grid gap-3">
              {project.statusHistory.map((entry, index) => (
                <div key={`${entry.status}-${index}-${entry.changedAt}`} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <WorkflowStatusBadge status={entry.status} />
                    <p className="text-meta text-synapse-muted">{formatDateTime(entry.changedAt)}</p>
                  </div>
                  <p className="mt-3 text-body text-synapse-text">{entry.note}</p>
                  <p className="mt-2 text-meta text-synapse-muted">{entry.changedByOfficeName}</p>
                </div>
              ))}
            </div>
          </PageSection>

          <AiTransparencyPanel insight={project.report.aiOutput} title="Project AI trace" />
        </>
      ) : null}
    </AppShell>
  );
}
