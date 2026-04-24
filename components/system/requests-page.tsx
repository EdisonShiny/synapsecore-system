"use client";

import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppShell,
  FileUploadBox,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  TextAreaField
} from "@/components";
import { formatDateTime } from "@/components/system/format";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
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
import { databaseAttachmentOptions } from "@/src/modules/system/database-options";
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [applicationText, setApplicationText] = useState("");
  const [applicationAttachments, setApplicationAttachments] = useState<FileList | null>(null);
  const [applicationDatabasePaths, setApplicationDatabasePaths] = useState<string[]>([]);
  const [reapplyText, setReapplyText] = useState("");
  const [reapplyAttachments, setReapplyAttachments] = useState<FileList | null>(null);
  const [reapplyDatabasePaths, setReapplyDatabasePaths] = useState<string[]>([]);
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [decisionComments, setDecisionComments] = useState("");
  const [config, setConfig] = useState<RequestPromptConfig>({
    requestAnalysisPrompt: "",
    requestRecommendationPrompt: ""
  });
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [submittingReapply, setSubmittingReapply] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

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
        setSelectedProjectId((current) =>
          requestsData.availableProjects.some((project) => project.id === current)
            ? current
            : requestsData.availableProjects[0]?.id ?? ""
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
    selectedProjectId?: string;
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
    setSelectedProjectId(() =>
      options?.selectedProjectId !== undefined
        ? options.selectedProjectId
        : requestsData.availableProjects[0]?.id ?? ""
    );
  }

  async function handleSubmitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !selectedProjectId) {
      return;
    }

    setSubmittingApplication(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ request: RequestApplicationRecord }>("/api/requests", {
        method: "POST",
        session,
        json: {
          projectId: selectedProjectId,
          applicationText,
          attachments: await filesToAttachmentReferences(applicationAttachments),
          selectedDatabasePaths: applicationDatabasePaths
        }
      });

      setApplicationText("");
      setApplicationAttachments(null);
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

      setReapplyAttachments(null);
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

  function renderDatabaseSelection(
    selectedPaths: string[],
    setSelectedPaths: Dispatch<SetStateAction<string[]>>
  ) {
    return (
      <div className="grid gap-3 rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
        <div>
          <p className="text-card-title text-synapse-text">Attach structured database context</p>
          <p className="mt-1 text-body text-synapse-muted">
            Select structured company data to send along with the request or reapplication.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {databaseAttachmentOptions.map((option) => (
            <label key={option.path} className="flex items-start gap-3 text-body text-synapse-text">
              <input
                type="checkbox"
                checked={selectedPaths.includes(option.path)}
                onChange={(event) =>
                  setSelectedPaths((current) =>
                    event.target.checked
                      ? [...current, option.path]
                      : current.filter((path) => path !== option.path)
                  )
                }
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="text-synapse-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  const requestStats = [
    {
      label: isHq ? "Pending Review" : "Your Requests",
      value: payload?.requests.filter((request) => request.status === "Waiting for Approval").length ?? 0,
      helper: isHq ? "Requests waiting for HQ action." : "Requests currently waiting for HQ review.",
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
      label: "Eligible Projects",
      value: payload?.availableProjects.length ?? 0,
      helper: "Projects that can be used for a fresh request application.",
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
          : "Submit request applications for projects, attach support context, and reapply rejected requests."
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
          description="Preset prompt 7 analyzes the request application. Preset prompt 8 turns validated information into an approval recommendation."
        >
          <form className="grid gap-4" onSubmit={handleSaveConfig}>
            <TextAreaField
              label="Preset prompt 7"
              required
              hint="Instruction for the request-analysis AI call."
              value={config.requestAnalysisPrompt}
              onChange={(event) =>
                setConfig((current) => ({ ...current, requestAnalysisPrompt: event.target.value }))
              }
            />
            <TextAreaField
              label="Preset prompt 8"
              required
              hint="Instruction for the approval-recommendation AI call."
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
          description="Choose a project, write the request application, attach support documents, and optionally include structured company data."
        >
          <form className="grid gap-4" onSubmit={handleSubmitApplication}>
            <SelectField
              label="Project"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={(payload?.availableProjects.length ?? 0) === 0}
              hint="Only projects without an active request appear here."
            >
              {(payload?.availableProjects.length ?? 0) === 0 ? (
                <option value="">No eligible projects available</option>
              ) : null}
              {(payload?.availableProjects ?? []).map((project: ProjectRecord) => (
                <option key={project.id} value={project.id}>
                  {project.subject} - {project.branchOfficeName}
                </option>
              ))}
            </SelectField>
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
              />
              <input
                className="text-body text-synapse-muted"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,.json,.log,.xml"
                onChange={(event) => setApplicationAttachments(event.target.files)}
              />
            </div>
            {renderDatabaseSelection(applicationDatabasePaths, setApplicationDatabasePaths)}
            <PrimaryButton
              loading={submittingApplication}
              type="submit"
              disabled={(payload?.availableProjects.length ?? 0) === 0}
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
                  className={`synapse-focus rounded-[22px] border p-4 text-left shadow-sm transition ${
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
              <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
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
                  <PrimaryButton
                    type="button"
                    onClick={() => router.push(`/projects/${selectedRequest.projectId}`)}
                  >
                    Open project
                  </PrimaryButton>
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
                <div className="rounded-[22px] border border-synapse-border bg-white p-4">
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
                <div className="rounded-[22px] border border-synapse-border bg-white p-4">
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

              <div className="rounded-[22px] border border-synapse-border bg-white p-4">
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Request report</p>
                <p className="mt-3 text-body text-synapse-text">{selectedRequest.finalReport}</p>
              </div>

              <div className="rounded-[22px] border border-synapse-border bg-white p-4">
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
                <div className="rounded-[22px] border border-synapse-border bg-white p-4">
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
                <div className="rounded-[22px] border border-synapse-border bg-white p-4">
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

              <div className="rounded-[22px] border border-synapse-border bg-white p-4">
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
                <form className="grid gap-4 rounded-[22px] border border-synapse-border bg-white p-4" onSubmit={handleDecision}>
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
                <form className="grid gap-4 rounded-[22px] border border-synapse-border bg-white p-4" onSubmit={handleReapply}>
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
                    />
                    <input
                      className="text-body text-synapse-muted"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,.json,.log,.xml"
                      onChange={(event) => setReapplyAttachments(event.target.files)}
                    />
                  </div>
                  {renderDatabaseSelection(reapplyDatabasePaths, setReapplyDatabasePaths)}
                  <PrimaryButton loading={submittingReapply} type="submit">
                    Reapply request
                  </PrimaryButton>
                </form>
              ) : null}

              {selectedRequest.decision ? (
                <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
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
    </AppShell>
  );
}
