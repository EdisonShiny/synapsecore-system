"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppShell,
  FileUploadBox,
  FormField,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  TextAreaField
} from "@/components";
import { DatabaseContextSelector } from "@/components/system/database-context-selector";
import { formatDateTime } from "@/components/system/format";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
import {
  PromptGuideToggle,
  getPromptFieldMeta
} from "@/components/system/prompt-guide";
import {
  EmptyBlock,
  PageSection,
  RecordList,
  StatGrid,
  ValidationBadge,
  WorkflowStatusBadge
} from "@/components/system/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { buildDatabaseAttachmentTree } from "@/src/modules/system/database-options";
import {
  defaultWorkflowPromptPreset,
  getWorkflowPromptPreset,
  type WorkflowPresetId,
  workflowPromptPresets
} from "@/src/modules/system/sample-workflow";
import type {
  DatabasePayload,
  ProjectRecord,
  RequestApplicationRecord,
  RequestPromptConfig,
  RequestsPayload
} from "@/types/system";

export function RequestsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [payload, setPayload] = useState<RequestsPayload | null>(null);
  const [database, setDatabase] = useState<DatabasePayload | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedProjectApprovalId, setSelectedProjectApprovalId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [applicationText, setApplicationText] = useState("");
  const [applicationAttachments, setApplicationAttachments] = useState<File[]>([]);
  const [applicationDatabasePaths, setApplicationDatabasePaths] = useState<string[]>([]);
  const [reapplyText, setReapplyText] = useState("");
  const [reapplyAttachments, setReapplyAttachments] = useState<File[]>([]);
  const [reapplyDatabasePaths, setReapplyDatabasePaths] = useState<string[]>([]);
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [decisionComments, setDecisionComments] = useState("");
  const [projectDecision, setProjectDecision] = useState<"Approved" | "Rejected">("Approved");
  const [projectDecisionComments, setProjectDecisionComments] = useState("");
  const [config, setConfig] = useState<RequestPromptConfig>({
    requestAnalysisPrompt: "",
    requestRecommendationPrompt: ""
  });
  const [selectedPresetId, setSelectedPresetId] = useState<WorkflowPresetId>(defaultWorkflowPromptPreset.id);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [submittingReapply, setSubmittingReapply] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [submittingProjectDecision, setSubmittingProjectDecision] = useState(false);

  const isHq = session?.user.role === "HQ";

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setFeedback("");

      try {
        const [requestsData, databaseData] = await Promise.all([
          apiRequest<RequestsPayload>("/api/requests", { session }),
          apiRequest<DatabasePayload>("/api/database", { session })
        ]);

        if (!active) {
          return;
        }

        setPayload(requestsData);
        setDatabase(databaseData);
        setConfig(requestsData.config);
        setSelectedRequestId((current) =>
          requestsData.requests.some((request) => request.id === current)
            ? current
            : requestsData.requests[0]?.id ?? null
        );
        setSelectedProjectApprovalId((current) =>
          requestsData.projectApprovals.some((project) => project.id === current)
            ? current
            : requestsData.projectApprovals[0]?.id ?? null
        );
      } catch (loadError) {
        if (active) {
          setFeedback(loadError instanceof Error ? loadError.message : "Failed to load requests.");
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

  const selectedRequest = useMemo(
    () => payload?.requests.find((request) => request.id === selectedRequestId) ?? payload?.requests[0] ?? null,
    [payload, selectedRequestId]
  );
  const selectedProjectApproval = useMemo(
    () =>
      payload?.projectApprovals.find((project) => project.id === selectedProjectApprovalId) ??
      payload?.projectApprovals[0] ??
      null,
    [payload, selectedProjectApprovalId]
  );
  const selectedProjectCurrentPhase = useMemo(
    () => selectedProjectApproval?.phases.find((phase) => phase.status === "Current") ?? null,
    [selectedProjectApproval]
  );
  const databaseAttachmentTree = useMemo(
    () => (database ? buildDatabaseAttachmentTree(database.company) : []),
    [database]
  );
  const selectedPreset = useMemo(
    () => getWorkflowPromptPreset(selectedPresetId),
    [selectedPresetId]
  );

  useEffect(() => {
    if (selectedRequest?.status === "Rejected") {
      setReapplyText(selectedRequest.applicationText);
      setReapplyDatabasePaths(selectedRequest.selectedDatabasePaths);
    }
  }, [selectedRequest]);

  if (!session || sessionLoading) {
    return null;
  }

  async function reloadRequests(options?: {
    selectedRequestId?: string | null;
    selectedProjectApprovalId?: string | null;
  }) {
    if (!session) {
      return;
    }

    const requestsData = await apiRequest<RequestsPayload>("/api/requests", { session });
    setPayload(requestsData);
    setConfig(requestsData.config);
    setSelectedRequestId(() =>
      options?.selectedRequestId !== undefined
        ? options.selectedRequestId
        : requestsData.requests[0]?.id ?? null
    );
    setSelectedProjectApprovalId(() =>
      options?.selectedProjectApprovalId !== undefined
        ? options.selectedProjectApprovalId
        : requestsData.projectApprovals[0]?.id ?? null
    );
  }

  async function handleSubmitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSubmittingApplication(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ request: RequestApplicationRecord }>("/api/requests", {
        method: "POST",
        session,
        json: {
          projectTitle,
          applicationText,
          attachments: await filesToAttachmentReferences(applicationAttachments),
          selectedDatabasePaths: applicationDatabasePaths
        }
      });

      setProjectTitle("");
      setApplicationText("");
      setApplicationAttachments([]);
      setApplicationDatabasePaths([]);
      await reloadRequests({ selectedRequestId: data.request.id });
      setFeedback("Request application submitted and sent into the approval AI workflow.");
    } catch (submitError) {
      setFeedback(
        submitError instanceof Error ? submitError.message : "Request application submission failed."
      );
    } finally {
      setSubmittingApplication(false);
    }
  }

  async function handleReapply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !selectedRequest || selectedRequest.status !== "Rejected") {
      return;
    }

    setSubmittingReapply(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ request: RequestApplicationRecord }>(
        `/api/requests/${selectedRequest.id}/reapply`,
        {
          method: "POST",
          session,
          json: {
            applicationText: reapplyText,
            attachments: await filesToAttachmentReferences(reapplyAttachments),
            selectedDatabasePaths: reapplyDatabasePaths
          }
        }
      );

      setReapplyAttachments([]);
      await reloadRequests({ selectedRequestId: data.request.id });
      setFeedback("Rejected request has been reapplied and sent back for HQ review.");
    } catch (submitError) {
      setFeedback(
        submitError instanceof Error ? submitError.message : "Request reapplication failed."
      );
    } finally {
      setSubmittingReapply(false);
    }
  }

  async function handleSaveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !isHq) {
      return;
    }

    setSavingConfig(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ config: RequestPromptConfig }>("/api/requests/config", {
        method: "PATCH",
        session,
        json: config
      });
      setConfig(data.config);
      setPayload((current) => (current ? { ...current, config: data.config } : current));
      setFeedback("Request prompts updated successfully.");
    } catch (submitError) {
      setFeedback(
        submitError instanceof Error ? submitError.message : "Request prompt update failed."
      );
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !selectedRequest) {
      return;
    }

    setSubmittingDecision(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ request: RequestApplicationRecord }>(
        `/api/requests/${selectedRequest.id}/decision`,
        {
          method: "POST",
          session,
          json: {
            decision,
            comments: decisionComments
          }
        }
      );

      setDecisionComments("");
      await reloadRequests({ selectedRequestId: data.request.id });
      setFeedback(`Request ${decision.toLowerCase()} successfully.`);
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Request decision failed.");
    } finally {
      setSubmittingDecision(false);
    }
  }

  async function handleProjectDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !selectedProjectApproval) {
      return;
    }

    setSubmittingProjectDecision(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ project: ProjectRecord }>(
        `/api/projects/${selectedProjectApproval.id}/decision`,
        {
          method: "POST",
          session,
          json: {
            decision: projectDecision,
            comments: projectDecisionComments
          }
        }
      );

      setProjectDecisionComments("");
      await reloadRequests({ selectedProjectApprovalId: data.project.id });
      setFeedback(`Project ${projectDecision.toLowerCase()} successfully.`);
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Project decision failed.");
    } finally {
      setSubmittingProjectDecision(false);
    }
  }

  const pendingRequestCount =
    payload?.requests.filter((request) => request.status === "Waiting for Approval").length ?? 0;
  const pendingProjectApprovalCount =
    payload?.projectApprovals.filter(
      (project) => project.status === "Submitted" || project.status === "Waiting for Approval"
    ).length ?? 0;

  const requestStats = [
    {
      label: isHq ? "HQ Review Queue" : "Pending HQ Actions",
      value: pendingRequestCount + pendingProjectApprovalCount,
      helper: isHq
        ? "Request applications and workflow-created projects that still need HQ action."
        : "Your requests and project approvals that are still waiting for HQ action.",
      tone: "warning" as const
    },
    {
      label: "Approved",
      value: payload?.requests.filter((request) => request.status === "Approved").length ?? 0,
      helper: "Requests that cleared the approval workflow.",
      tone: "success" as const
    },
    {
      label: "Rejected",
      value: payload?.requests.filter((request) => request.status === "Rejected").length ?? 0,
      helper: "Requests that may need revision and reapplication.",
      tone: "error" as const
    },
    {
      label: "Linked Projects",
      value: payload?.availableProjects.length ?? 0,
      helper: "Existing branch projects that are still open and can be linked to a request.",
      tone: "info" as const
    }
  ];

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Requests"
      description={
        isHq
          ? "Configure request prompts, inspect AI recommendation packets, and make the final HQ decision."
          : "Submit request applications to HQ, attach support context, and reapply rejected requests."
      }
    >
      {feedback ? (
        <PageSection title="Latest action">
          <p
            className={`text-body ${
              feedback.toLowerCase().includes("failed") || feedback.toLowerCase().includes("error")
                ? "text-synapse-error"
                : "text-synapse-secondary"
            }`}
          >
            {feedback}
          </p>
        </PageSection>
      ) : null}

      <PageSection
        title="Request pipeline"
        description={
          database
            ? `Request approvals are evaluated against ${database.company.generalInfo.companyName} context before HQ makes the final decision.`
            : "Request approvals are evaluated through the staged AI approval workflow."
        }
      >
        <StatGrid items={requestStats} />
      </PageSection>

      {isHq ? (
        <PageSection
          title="Request AI configuration"
          description="Preset prompt 7 analyzes the request application. Shared preset prompt 2 extracts information, shared preset prompt 3 validates it, and preset prompt 8 turns validated information into an approval recommendation."
          action={
            <div className="grid w-full gap-3 md:w-[34rem] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="w-full">
                <SelectField
                  label="Preset prompt library"
                  value={selectedPresetId}
                  onChange={(event) => setSelectedPresetId(event.target.value as WorkflowPresetId)}
                >
                  {workflowPromptPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.title}
                    </option>
                  ))}
                </SelectField>
              </div>
              <SecondaryButton
                type="button"
                onClick={() =>
                  setConfig({
                    requestAnalysisPrompt: selectedPreset.requestPrompts.requestAnalysisPrompt,
                    requestRecommendationPrompt: selectedPreset.requestPrompts.requestRecommendationPrompt
                  })
                }
              >
                Load preset
              </SecondaryButton>
            </div>
          }
        >
          <form className="grid gap-4" onSubmit={handleSaveConfig}>
            <PromptGuideToggle variant="request" />
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-card-title text-synapse-text">{selectedPreset.title}</p>
              <p className="mt-2 text-body text-synapse-muted">{selectedPreset.summary}</p>
              <p className="mt-3 text-body text-synapse-text">
                <span className="font-semibold">Fields used:</span> {selectedPreset.fieldsUsed.join(", ")}
              </p>
            </div>
            <TextAreaField
              label={getPromptFieldMeta("requestAnalysisPrompt").label}
              required
              hint={getPromptFieldMeta("requestAnalysisPrompt").hint}
              value={config.requestAnalysisPrompt}
              onChange={(event) =>
                setConfig((current) => ({ ...current, requestAnalysisPrompt: event.target.value }))
              }
            />
            <TextAreaField
              label={getPromptFieldMeta("requestRecommendationPrompt").label}
              required
              hint={getPromptFieldMeta("requestRecommendationPrompt").hint}
              value={config.requestRecommendationPrompt}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  requestRecommendationPrompt: event.target.value
                }))
              }
            />
            <PrimaryButton loading={savingConfig} type="submit">
              Save request prompts
            </PrimaryButton>
          </form>
        </PageSection>
      ) : (
        <PageSection
          title="Submit request application"
          description="Type a project title, write the request application, attach support documents, and optionally include structured company data."
        >
          <form className="grid gap-4" onSubmit={handleSubmitApplication}>
            <FormField
              label="Project"
              required
              value={projectTitle}
              onChange={(event) => setProjectTitle(event.target.value)}
              placeholder="Type the project title"
              hint="Enter the project title you want to submit to HQ."
            />
            <TextAreaField
              label="Request application"
              required
              hint="Explain what approval is needed, why it matters, and what supporting evidence is attached."
              value={applicationText}
              onChange={(event) => setApplicationText(event.target.value)}
            />
            <div className="grid gap-2">
              <FileUploadBox
                label="Attach support documents"
                hint="Text-like files will be read inline. Other supported business files travel as attachment metadata."
                files={applicationAttachments}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,.json,.log,.xml"
                onFilesChange={(files) => setApplicationAttachments((current) => [...current, ...files])}
                onRemoveFile={(index) =>
                  setApplicationAttachments((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index)
                  )
                }
              />
            </div>
            <DatabaseContextSelector
              nodes={databaseAttachmentTree}
              selectedPaths={applicationDatabasePaths}
              onChange={setApplicationDatabasePaths}
              description="Select structured company data to send along with the request application."
            />
            <PrimaryButton
              loading={submittingApplication}
              type="submit"
            >
              Submit request
            </PrimaryButton>
          </form>
        </PageSection>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <PageSection
          title={isHq ? "Incoming requests" : "Your requests"}
          description={
            isHq
              ? "Review each AI recommendation packet before making a final HQ decision."
              : "Track each request application and reopen a rejected one when you are ready to reapply."
          }
        >
          {loading ? <p className="text-body text-synapse-muted">Loading requests...</p> : null}
          {!loading ? (
            <RecordList
              items={payload?.requests ?? []}
              emptyTitle="No requests yet"
              emptyDescription={
                isHq
                  ? "No request applications are waiting in the HQ queue right now."
                  : "Submit a request application from one of your projects to begin the approval loop."
              }
              renderItem={(request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedRequestId(request.id)}
                  className={`synapse-focus rounded-2xl border p-4 text-left shadow-sm transition ${
                    request.id === selectedRequest?.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-synapse-border bg-synapse-elevated hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-card-title text-synapse-text">{request.projectSubject}</p>
                      <p className="mt-1 text-body text-synapse-muted">{request.branchOfficeName}</p>
                    </div>
                    <WorkflowStatusBadge status={request.status} />
                  </div>
                  <p className="mt-3 text-body text-synapse-muted line-clamp-2">
                    {request.applicationText}
                  </p>
                  <p className="mt-3 text-meta text-synapse-muted">
                    Updated {formatDateTime(request.updatedAt)}
                  </p>
                </button>
              )}
            />
          ) : null}
        </PageSection>

        <PageSection
          title={isHq ? "Request review detail" : "Request detail"}
          description={
            isHq
              ? "Inspect the report, extraction, validation, and recommendation before deciding."
              : "Review the AI packet, HQ decision, and reapply if the request was rejected."
          }
        >
          {selectedRequest ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{selectedRequest.projectSubject}</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      {selectedRequest.branchOfficeName}
                      {selectedRequest.workflowName ? ` | ${selectedRequest.workflowName}` : ""}
                    </p>
                  </div>
                  <WorkflowStatusBadge status={selectedRequest.status} />
                </div>
                <p className="mt-3 text-body text-synapse-text">{selectedRequest.applicationText}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedRequest.projectId ? (
                    <PrimaryButton
                      type="button"
                      onClick={() => router.push(`/projects/${selectedRequest.projectId}`)}
                    >
                      Open project
                    </PrimaryButton>
                  ) : null}
                  {selectedRequest.workflowId ? (
                    <SecondaryButton
                      type="button"
                      onClick={() => router.push(`/workflows/${selectedRequest.workflowId}`)}
                    >
                      Open workflow
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-synapse-border bg-white p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Supporting files</p>
                  {selectedRequest.attachments.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {selectedRequest.attachments.map((attachment) => (
                        <div key={attachment.id} className="rounded-2xl bg-synapse-elevated p-3 text-body text-synapse-text">
                          {attachment.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-body text-synapse-muted">No support files were attached.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-synapse-border bg-white p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Structured data context</p>
                  {selectedRequest.selectedDatabaseSummaries.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {selectedRequest.selectedDatabaseSummaries.map((summary) => (
                        <div key={summary} className="rounded-2xl bg-synapse-elevated p-3 text-body text-synapse-text">
                          {summary}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-body text-synapse-muted">
                      No structured database slices were attached.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-synapse-border bg-white p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Request report</p>
                <p className="mt-3 text-body text-synapse-text">{selectedRequest.finalReport}</p>
              </div>

              <div className="rounded-2xl border border-synapse-border bg-white p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                  Extracted information
                </p>
                {selectedRequest.finalExtraction ? (
                  <>
                    <p className="mt-3 text-body font-medium text-synapse-text">
                      {selectedRequest.finalExtraction.headline}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {selectedRequest.finalExtraction.items.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3 text-body text-synapse-text"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-meta text-synapse-muted">
                      Confidence score: {selectedRequest.finalExtraction.confidenceScore}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-body text-synapse-muted">
                    Extracted information is not available for this request.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-synapse-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Validation</p>
                    {selectedRequest.validation ? (
                      <ValidationBadge result={selectedRequest.validation.result} />
                    ) : null}
                  </div>
                  {selectedRequest.validation ? (
                    <>
                      <p className="mt-3 text-body text-synapse-text">{selectedRequest.validation.summary}</p>
                      <p className="mt-3 text-body text-synapse-muted">
                        Retry guidance: {selectedRequest.validation.retryInstruction}
                      </p>
                      <p className="mt-3 text-meta text-synapse-muted">
                        Confidence score: {selectedRequest.validation.confidenceScore}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-body text-synapse-muted">
                      Validation details are not available for this request.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-synapse-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                      AI recommendation
                    </p>
                    {selectedRequest.recommendation ? (
                      <WorkflowStatusBadge
                        status={
                          selectedRequest.recommendation.recommendation === "Approve"
                            ? "Approved"
                            : "Rejected"
                        }
                      />
                    ) : null}
                  </div>
                  {selectedRequest.recommendation ? (
                    <>
                      <p className="mt-3 text-body font-medium text-synapse-text">
                        {selectedRequest.recommendation.recommendation}
                      </p>
                      <p className="mt-3 text-body text-synapse-muted">
                        {selectedRequest.recommendation.reason}
                      </p>
                      <p className="mt-3 text-meta text-synapse-muted">
                        Confidence score: {selectedRequest.recommendation.confidenceScore}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-body text-synapse-muted">
                      Recommendation output is not available for this request.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-synapse-border bg-white p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">AI attempts</p>
                {selectedRequest.attempts.length > 0 ? (
                  <div className="mt-3 grid gap-3">
                    {selectedRequest.attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-body font-semibold text-synapse-text">
                              Attempt {attempt.attemptNumber}
                            </p>
                            <p className="mt-1 text-meta text-synapse-muted">
                              {formatDateTime(attempt.createdAt)}
                            </p>
                          </div>
                          <ValidationBadge result={attempt.validation.result} />
                        </div>
                        <p className="mt-3 text-body text-synapse-text">{attempt.report}</p>
                        <p className="mt-3 text-body text-synapse-muted">
                          {attempt.validation.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-body text-synapse-muted">No attempt history recorded.</p>
                )}
              </div>

              {isHq && selectedRequest.status === "Waiting for Approval" ? (
                <form className="grid gap-4 rounded-2xl border border-synapse-border bg-white p-4" onSubmit={handleDecision}>
                  <SelectField
                    label="HQ decision"
                    value={decision}
                    onChange={(event) => setDecision(event.target.value as "Approved" | "Rejected")}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </SelectField>
                  <TextAreaField
                    label="HQ comment or reason"
                    value={decisionComments}
                    onChange={(event) => setDecisionComments(event.target.value)}
                    hint="Add the reason for approval or the revision guidance for a rejection."
                  />
                  <PrimaryButton loading={submittingDecision} type="submit">
                    Submit HQ decision
                  </PrimaryButton>
                </form>
              ) : null}

              {!isHq && selectedRequest.status === "Rejected" ? (
                <form className="grid gap-4 rounded-2xl border border-synapse-border bg-white p-4" onSubmit={handleReapply}>
                  <div>
                    <p className="text-card-title text-synapse-text">Reapply rejected request</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      Revise the application, attach new support context if needed, and resubmit it into the same AI approval loop.
                    </p>
                  </div>
                  <TextAreaField
                    label="Updated request application"
                    required
                    value={reapplyText}
                    onChange={(event) => setReapplyText(event.target.value)}
                  />
                  <div className="grid gap-2">
                    <FileUploadBox
                      label="Attach revised support documents"
                      hint="Use this if you want to add new evidence before reapplying."
                      files={reapplyAttachments}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,.json,.log,.xml"
                      onFilesChange={(files) => setReapplyAttachments((current) => [...current, ...files])}
                      onRemoveFile={(index) =>
                        setReapplyAttachments((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                    />
                  </div>
                  <DatabaseContextSelector
                    nodes={databaseAttachmentTree}
                    selectedPaths={reapplyDatabasePaths}
                    onChange={setReapplyDatabasePaths}
                    description="Select structured company data to send along with the revised request."
                  />
                  <PrimaryButton loading={submittingReapply} type="submit">
                    Reapply request
                  </PrimaryButton>
                </form>
              ) : null}

              {selectedRequest.decision ? (
                <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Final decision</p>
                  <p className="mt-3 text-body font-medium text-synapse-text">
                    {selectedRequest.decision.decision}
                  </p>
                  <p className="mt-2 text-body text-synapse-muted">
                    {selectedRequest.decision.comments || "No additional HQ comment was provided."}
                  </p>
                  <p className="mt-3 text-meta text-synapse-muted">
                    {selectedRequest.decision.decidedByOfficeName} on{" "}
                    {formatDateTime(selectedRequest.decision.decidedAt)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyBlock
              title="Select a request"
              description="Choose one request from the list to inspect its AI packet and approval state."
            />
          )}
        </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <PageSection
          title={isHq ? "Project approvals" : "Projects pending approval"}
          description={
            isHq
              ? "Approve or reject workflow-created projects here. This is separate from request application decisions."
              : "Track whether HQ has approved each workflow-created project so phase progression can begin."
          }
        >
          {loading ? <p className="text-body text-synapse-muted">Loading projects...</p> : null}
          {!loading ? (
            <RecordList
              items={payload?.projectApprovals ?? []}
              emptyTitle="No project approvals waiting"
              emptyDescription={
                isHq
                  ? "Workflow-created projects that need HQ signoff will appear here."
                  : "Projects that still need separate HQ approval will appear here."
              }
              renderItem={(project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectApprovalId(project.id)}
                  className={`synapse-focus rounded-2xl border p-4 text-left shadow-sm transition ${
                    project.id === selectedProjectApproval?.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-synapse-border bg-synapse-elevated hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-card-title text-synapse-text">{project.subject}</p>
                      <p className="mt-1 text-body text-synapse-muted">
                        {project.branchOfficeName}
                        {project.workflowName ? ` | ${project.workflowName}` : ""}
                      </p>
                    </div>
                    <WorkflowStatusBadge status={project.status} />
                  </div>
                  <p className="mt-3 text-body text-synapse-muted line-clamp-2">
                    {project.description}
                  </p>
                  <p className="mt-3 text-meta text-synapse-muted">
                    Updated {formatDateTime(project.updatedAt)}
                  </p>
                </button>
              )}
            />
          ) : null}
        </PageSection>

        <PageSection
          title={isHq ? "Project approval detail" : "Project approval status"}
          description={
            isHq
              ? "Review the generated project and current phase before making the separate project decision."
              : "Use this to confirm whether the project itself has been approved independently of any request application."
          }
        >
          {selectedProjectApproval ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{selectedProjectApproval.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      {selectedProjectApproval.branchOfficeName}
                      {selectedProjectApproval.workflowName
                        ? ` | ${selectedProjectApproval.workflowName}`
                        : ""}
                    </p>
                  </div>
                  <WorkflowStatusBadge status={selectedProjectApproval.status} />
                </div>
                <p className="mt-3 text-body text-synapse-text">
                  {selectedProjectApproval.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={() => router.push(`/projects/${selectedProjectApproval.id}`)}
                  >
                    Open project
                  </PrimaryButton>
                  {selectedProjectApproval.workflowId ? (
                    <SecondaryButton
                      type="button"
                      onClick={() => router.push(`/workflows/${selectedProjectApproval.workflowId}`)}
                    >
                      Open workflow
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-synapse-border bg-white p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                    Current phase
                  </p>
                  {selectedProjectCurrentPhase ? (
                    <div className="mt-3 grid gap-3 text-body text-synapse-text">
                      <p className="font-medium">{selectedProjectCurrentPhase.title}</p>
                      <p>{selectedProjectCurrentPhase.objective}</p>
                      <div className="grid gap-2 text-synapse-muted">
                        {selectedProjectCurrentPhase.actionablePlans.map((plan, index) => (
                          <p key={`${selectedProjectCurrentPhase.id}-approval-plan-${index}`}>
                            {index + 1}. {plan}
                          </p>
                        ))}
                      </div>
                      <p className="text-synapse-muted">
                        Expected outcome: {selectedProjectCurrentPhase.expectedOutcome}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-body text-synapse-muted">
                      No current phase is stored for this project yet.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-synapse-border bg-white p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                    Project report summary
                  </p>
                  <p className="mt-3 text-body text-synapse-text">
                    {selectedProjectApproval.report.projectDescription}
                  </p>
                  <p className="mt-3 text-body text-synapse-muted">
                    AI advice: {selectedProjectApproval.report.aiAdvice}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-synapse-border bg-white p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                  Project approval history
                </p>
                <div className="mt-3 grid gap-3">
                  {selectedProjectApproval.statusHistory.map((entry, index) => (
                    <div
                      key={`${selectedProjectApproval.id}-${index}-${entry.changedAt}`}
                      className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <WorkflowStatusBadge status={entry.status} />
                        <p className="text-meta text-synapse-muted">
                          {formatDateTime(entry.changedAt)}
                        </p>
                      </div>
                      <p className="mt-3 text-body text-synapse-text">{entry.note}</p>
                      <p className="mt-2 text-meta text-synapse-muted">
                        {entry.changedByOfficeName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {isHq &&
              (selectedProjectApproval.status === "Submitted" ||
                selectedProjectApproval.status === "Waiting for Approval") ? (
                <form
                  className="grid gap-4 rounded-2xl border border-synapse-border bg-white p-4"
                  onSubmit={handleProjectDecision}
                >
                  <SelectField
                    label="Project decision"
                    value={projectDecision}
                    onChange={(event) =>
                      setProjectDecision(event.target.value as "Approved" | "Rejected")
                    }
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </SelectField>
                  <TextAreaField
                    label="HQ comment or reason"
                    value={projectDecisionComments}
                    onChange={(event) => setProjectDecisionComments(event.target.value)}
                    hint="This controls whether the project can move into phase progression."
                  />
                  <PrimaryButton loading={submittingProjectDecision} type="submit">
                    Submit project decision
                  </PrimaryButton>
                </form>
              ) : null}

              {selectedProjectApproval.decision ? (
                <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                    Latest project decision
                  </p>
                  <p className="mt-3 text-body font-medium text-synapse-text">
                    {selectedProjectApproval.decision.decision}
                  </p>
                  <p className="mt-2 text-body text-synapse-muted">
                    {selectedProjectApproval.decision.comments ||
                      "No additional HQ comment was provided."}
                  </p>
                  <p className="mt-3 text-meta text-synapse-muted">
                    {selectedProjectApproval.decision.decidedByOfficeName} on{" "}
                    {formatDateTime(selectedProjectApproval.decision.decidedAt)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyBlock
              title="Select a project"
              description="Choose one workflow-created project to inspect or approve."
            />
          )}
        </PageSection>
      </div>
    </AppShell>
  );
}
