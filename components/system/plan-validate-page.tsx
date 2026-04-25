"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, FileUploadBox, FormField, PrimaryButton, SelectField, TextAreaField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { AiTransparencyPanel, PageSection, RecordList } from "@/components/system/ui";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
import { formatDateTime } from "@/components/system/format";
import type { OfficeAccount, PlanDatasetSubmission, PlanInsight } from "@/types/system";

type InsightResponse = {
  overall: PlanInsight | null;
  branches: PlanInsight[];
  submissions: PlanDatasetSubmission[];
};

export function PlanValidatePage() {
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [data, setData] = useState<InsightResponse>({ overall: null, branches: [], submissions: [] });
  const [branches, setBranches] = useState<OfficeAccount[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploads, setUploads] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isHq = session?.user.role === "HQ";

  async function loadData(currentSession = session) {
    if (!currentSession) {
      return;
    }

    setLoading(true);

    try {
      const [insightData, branchData] = await Promise.all([
        apiRequest<InsightResponse>("/api/insights", { session: currentSession }),
        apiRequest<{ branches: OfficeAccount[] }>("/api/branches", { session: currentSession })
      ]);
      setData(insightData);
      setBranches(branchData.branches);
    } catch (loadError) {
      setFeedback(loadError instanceof Error ? loadError.message : "Failed to load insights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [session]);

  const selectedBranchInsight = useMemo(() => {
    if (!isHq) {
      return data.branches[0] ?? null;
    }

    if (selectedBranchId === "all") {
      return data.branches[0] ?? null;
    }

    return data.branches.find((insight) => insight.officeId === selectedBranchId) ?? null;
  }, [data.branches, isHq, selectedBranchId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest("/api/insights", {
        method: "POST",
        session,
        json: {
          title,
          notes,
          uploads: filesToAttachmentReferences(uploads)
        }
      });
      setTitle("");
      setNotes("");
      setUploads(null);
      setFeedback("Plan & Validate insight generated successfully.");
      await loadData(session);
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Failed to generate insight.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session || sessionLoading) {
    return null;
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Plan & Validate"
      description={
        isHq
          ? "Review initial phase planning signals, branch risk, and validation-readiness before human approval."
          : "Prepare the initial phase plan, combine branch evidence with outside signals, and surface validation-relevant judgment."
      }
    >
      <PageSection
        title={isHq ? "Planning intelligence" : "Initial planning input"}
        description={
          isHq
            ? "HQ can compare overall and branch-level planning signals before the approval layer."
            : "Use this step to feed the initial phase plan with branch datasets, local signals, global signals, news, and feedback direction."
        }
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Submission title" required value={title} onChange={(event) => setTitle(event.target.value)} />
            {isHq ? (
              <SelectField label="View branch insight" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
                <option value="all">Latest branch insight</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.officeName}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
          <TextAreaField
            label="Planning notes"
            required
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            hint="Summarize branch demand, financial context, local issues, or any validation assumptions."
          />
          <div className="grid gap-2">
            <FileUploadBox label="Upload datasets and documents" hint="Supported files include spreadsheet, PDF, document, CSV, presentation, and text formats." />
            <input
              className="text-body text-synapse-muted"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf"
              onChange={(event) => setUploads(event.target.files)}
            />
          </div>
          <PrimaryButton loading={submitting} type="submit">
            Generate planning judgment
          </PrimaryButton>
        </form>
        {feedback ? <p className={`text-body ${feedback.includes("Failed") ? "text-synapse-error" : "text-synapse-secondary"}`}>{feedback}</p> : null}
      </PageSection>

      {loading ? (
        <PageSection title="Loading insight">
          <p className="text-body text-synapse-muted">Collecting the latest plan and validation records.</p>
        </PageSection>
      ) : null}

      {isHq && data.overall ? (
        <PageSection
          title="Overall company demand and financial conclusion"
          description="Combined view across all branches and current workflow pressure."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Demand conclusion</p>
              <p className="mt-3 text-body text-synapse-text">{data.overall.demandConclusion}</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Financial conclusion</p>
              <p className="mt-3 text-body text-synapse-text">{data.overall.financialConclusion}</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Risk conclusion</p>
              <p className="mt-3 text-body text-synapse-text">{data.overall.riskConclusion}</p>
            </div>
          </div>
          <AiTransparencyPanel insight={data.overall.aiOutput} title="Overall planning AI workflow" />
        </PageSection>
      ) : null}

      {selectedBranchInsight ? (
        <PageSection
          title={isHq ? `Branch view: ${selectedBranchInsight.officeName}` : "Branch demand and risk evaluation"}
          description={
            isHq
              ? "Single-branch demand, finance, and risk judgment."
              : "Structured AI advice combining external searchable context and uploaded branch datasets before validation."
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-synapse-border bg-white p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Validator check</p>
              <p className="mt-3 text-body text-synapse-text">Is the gathered information grounded in real evidence?</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-white p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Impact review</p>
              <p className="mt-3 text-body text-synapse-text">What could happen if the proposed plan is executed?</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-white p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Risk handling</p>
              <p className="mt-3 text-body text-synapse-text">How can the branch or HQ reduce the identified risk?</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-white p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Confidence</p>
              <p className="mt-3 text-body text-synapse-text">Use the AI workflow output to judge whether human review is still required.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Demand</p>
              <p className="mt-3 text-body text-synapse-text">{selectedBranchInsight.demandConclusion}</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Financial</p>
              <p className="mt-3 text-body text-synapse-text">{selectedBranchInsight.financialConclusion}</p>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Risk</p>
              <p className="mt-3 text-body text-synapse-text">{selectedBranchInsight.riskConclusion}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-synapse-border bg-white p-4">
              <p className="text-card-title text-synapse-text">External signals</p>
              <div className="mt-3 grid gap-3">
                {selectedBranchInsight.externalSignals.map((signal) => (
                  <div key={signal} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3 text-body text-synapse-text">
                    {signal}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-synapse-border bg-white p-4">
              <p className="text-card-title text-synapse-text">Uploaded source classification</p>
              <div className="mt-3 grid gap-3">
                {selectedBranchInsight.uploadedSources.length > 0 ? (
                  selectedBranchInsight.uploadedSources.map((file) => (
                    <div key={file.id} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3">
                      <p className="text-body font-medium text-synapse-text">{file.name}</p>
                      <p className="mt-1 text-meta text-synapse-muted">{file.extension} · {Math.max(1, Math.round(file.size / 1024))} KB</p>
                    </div>
                  ))
                ) : (
                  <p className="text-body text-synapse-muted">No uploaded datasets in the latest cycle.</p>
                )}
              </div>
            </div>
          </div>
          <AiTransparencyPanel insight={selectedBranchInsight.aiOutput} title="Planning and risk AI workflow" />
        </PageSection>
      ) : (
        <PageSection title="No plan insight available">
          <p className="text-body text-synapse-muted">Submit the first planning package to generate an AI conclusion.</p>
        </PageSection>
      )}

      <PageSection
        title="Uploaded planning history"
        description="Most recent planning submissions and validation context."
      >
        <RecordList
          items={data.submissions}
          emptyTitle="No planning submissions"
          emptyDescription="Uploaded branch datasets and documents will appear here after submission."
          renderItem={(submission) => (
            <div key={submission.id} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-card-title text-synapse-text">{submission.title}</p>
                  <p className="mt-1 text-body text-synapse-muted">{submission.officeName}</p>
                </div>
                <p className="text-meta text-synapse-muted">{formatDateTime(submission.createdAt)}</p>
              </div>
              <p className="mt-3 text-body text-synapse-muted">{submission.notes}</p>
            </div>
          )}
        />
      </PageSection>
    </AppShell>
  );
}
