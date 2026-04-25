"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, FormField, PrimaryButton, SecondaryButton, SelectField, TextAreaField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { AiTransparencyPanel, PageSection, RecordList } from "@/components/system/ui";
import { formatDateTime } from "@/components/system/format";
import { ModalDialog } from "@/components/ui/feedback";
import type { IssueThread, OfficeAccount, Severity } from "@/types/system";

const urgencyOptions: Severity[] = ["Low", "Medium", "High", "Critical"];

export function IssuesPage() {
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [issues, setIssues] = useState<IssueThread[]>([]);
  const [branches, setBranches] = useState<OfficeAccount[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [urgency, setUrgency] = useState<Severity>("High");
  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [resolve, setResolve] = useState(false);
  const [targetOfficeId, setTargetOfficeId] = useState("default");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isHq = session?.user.role === "HQ";

  async function loadData(currentSession = session) {
    if (!currentSession) {
      return;
    }

    setLoading(true);

    try {
      const [issuesData, branchesData] = await Promise.all([
        apiRequest<{ issues: IssueThread[] }>("/api/issues", { session: currentSession }),
        apiRequest<{ branches: OfficeAccount[] }>("/api/branches", { session: currentSession })
      ]);
      setIssues(issuesData.issues);
      setBranches(branchesData.branches);
      setSelectedIssueId((current) => current ?? issuesData.issues[0]?.id ?? null);
    } catch (loadError) {
      setFeedback(loadError instanceof Error ? loadError.message : "Failed to load issues.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [session]);

  useEffect(() => {
    if (!session || !selectedIssueId) {
      return;
    }

    void apiRequest(`/api/issues/${selectedIssueId}/read`, {
      method: "POST",
      session
    }).catch(() => undefined);
  }, [selectedIssueId, session]);

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === selectedIssueId) ?? null,
    [issues, selectedIssueId]
  );

  if (!session || sessionLoading) {
    return null;
  }

  async function confirmIssueSubmission() {
    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest("/api/issues", {
        method: "POST",
        session,
        json: {
          subject,
          urgency,
          message,
          targetOfficeId: isHq ? (targetOfficeId === "default" ? branches[0]?.id : targetOfficeId) : undefined
        }
      });
      setConfirmOpen(false);
      setSubject("");
      setUrgency("High");
      setMessage("");
      setFeedback("Issue sent successfully and AI emergency guidance attached.");
      await loadData(session);
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Issue submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIssue) {
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest(`/api/issues/${selectedIssue.id}/reply`, {
        method: "POST",
        session,
        json: {
          message: replyMessage,
          resolve
        }
      });
      setReplyMessage("");
      setResolve(false);
      setFeedback("Issue response sent.");
      await loadData(session);
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Issue response failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Report Issues"
      description="Bi-directional urgent issue escalation between HQ and Branch Offices with visible AI emergency guidance."
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <PageSection
          title="New issue escalation"
          description="Submission uses a double confirmation step before the issue is finally sent."
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            {isHq ? (
              <SelectField label="Target Branch Office" value={targetOfficeId} onChange={(event) => setTargetOfficeId(event.target.value)}>
                <option value="default">First available branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.officeName}
                  </option>
                ))}
              </SelectField>
            ) : null}
            <FormField label="Issue subject" required value={subject} onChange={(event) => setSubject(event.target.value)} />
            <SelectField label="Urgency" value={urgency} onChange={(event) => setUrgency(event.target.value as Severity)}>
              {urgencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
            <TextAreaField
              label="Issue detail"
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              hint="Describe the urgent issue, impact, and the immediate support needed."
            />
            <PrimaryButton type="submit">Proceed to confirmation</PrimaryButton>
          </form>
          {feedback ? <p className={`text-body ${feedback.includes("failed") || feedback.includes("Failed") ? "text-synapse-error" : "text-synapse-secondary"}`}>{feedback}</p> : null}
        </PageSection>

        <PageSection
          title="Issue threads"
          description="Both sides can open a thread, read AI emergency advice, and continue the response in one place."
        >
          {loading ? <p className="text-body text-synapse-muted">Loading issue threads...</p> : null}
          <RecordList
            items={issues}
            emptyTitle="No issue threads"
            emptyDescription="Urgent issue escalations will appear here once they are submitted."
            renderItem={(issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => setSelectedIssueId(issue.id)}
                className={`synapse-focus rounded-2xl border p-4 text-left shadow-sm transition ${
                  issue.id === selectedIssueId
                    ? "border-blue-200 bg-blue-50"
                    : "border-synapse-border bg-synapse-elevated hover:border-blue-100 hover:bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-card-title text-synapse-text">{issue.subject}</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      {issue.createdByOfficeName} to {issue.targetOfficeName}
                    </p>
                  </div>
                  <div className="rounded-full border border-synapse-border bg-white px-3 py-1 text-meta text-synapse-muted">
                    {issue.urgency}
                  </div>
                </div>
                <p className="mt-3 text-body text-synapse-muted line-clamp-2">
                  {issue.messages[issue.messages.length - 1]?.message}
                </p>
                <p className="mt-3 text-meta text-synapse-muted">{formatDateTime(issue.updatedAt)}</p>
              </button>
            )}
          />
        </PageSection>
      </div>

      <PageSection
        title="Issue detail"
        description="AI emergency advice is shown directly alongside the issue conversation."
      >
        {selectedIssue ? (
          <div className="grid gap-6">
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-card-title text-synapse-text">{selectedIssue.subject}</p>
                  <p className="mt-1 text-body text-synapse-muted">
                    {selectedIssue.createdByOfficeName} to {selectedIssue.targetOfficeName}
                  </p>
                </div>
                <div className="rounded-full border border-synapse-border bg-white px-3 py-1 text-meta text-synapse-muted">
                  {selectedIssue.status}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {selectedIssue.messages.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-synapse-border bg-white p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-body font-semibold text-synapse-text">
                        {entry.senderOfficeName} · {entry.senderRole}
                      </p>
                      <p className="text-meta text-synapse-muted">{formatDateTime(entry.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-body text-synapse-text">{entry.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <AiTransparencyPanel insight={selectedIssue.aiOutput} title="Issue analysis AI workflow" />

            <form className="grid gap-4 rounded-2xl border border-synapse-border bg-white p-4" onSubmit={handleReply}>
              <TextAreaField label="Reply" required value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} />
              <label className="flex items-center gap-3 text-body text-synapse-text">
                <input type="checkbox" checked={resolve} onChange={(event) => setResolve(event.target.checked)} />
                Mark issue as resolved with this response
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <PrimaryButton className="flex-1" loading={submitting} type="submit">
                  Send response
                </PrimaryButton>
              </div>
            </form>
          </div>
        ) : (
          <p className="text-body text-synapse-muted">Select an issue thread to read the detail and respond.</p>
        )}
      </PageSection>

      <ModalDialog open={confirmOpen} title="Confirm issue submission" onClose={() => setConfirmOpen(false)}>
        <div className="grid gap-4">
          <p className="text-body text-synapse-muted">
            Confirm once more before sending this urgent issue to the counterpart office.
          </p>
          <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4 text-body text-synapse-text">
            <p className="font-semibold">{subject}</p>
            <p className="mt-2">{message}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <PrimaryButton className="flex-1" loading={submitting} onClick={confirmIssueSubmission}>
              Confirm and send
            </PrimaryButton>
            <SecondaryButton className="flex-1" onClick={() => setConfirmOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </ModalDialog>
    </AppShell>
  );
}
