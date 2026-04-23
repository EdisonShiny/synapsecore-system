"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, PrimaryButton, SecondaryButton, SelectField, TextAreaField, FormField, FileUploadBox } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { ModalDialog, TabsShell } from "@/components/ui/feedback";
import { AiTransparencyPanel, PageSection, RecordList, StatGrid, StatusIcon, WorkflowStatusBadge } from "@/components/system/ui";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
import { formatDateTime } from "@/components/system/format";
import type { OfficeAccount, ProjectRecord, WorkflowStatus } from "@/types/system";

const statusFilters: Array<"All Projects" | WorkflowStatus> = [
  "All Projects",
  "AI Processing",
  "Waiting for Approval",
  "Approved",
  "Rejected",
  "Submitted"
];

type ProjectFormState = {
  subject: string;
  applicantName: string;
  position: string;
  email: string;
  description: string;
};

const emptyProjectForm: ProjectFormState = {
  subject: "",
  applicantName: "",
  position: "",
  email: "",
  description: ""
};

export function ApplicationPage() {
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [branches, setBranches] = useState<OfficeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All Projects");
  const [branchFilter, setBranchFilter] = useState("all");
  const [createForm, setCreateForm] = useState<ProjectFormState>(emptyProjectForm);
  const [createAttachments, setCreateAttachments] = useState<FileList | null>(null);
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [decisionComments, setDecisionComments] = useState("");
  const [appealForm, setAppealForm] = useState<ProjectFormState>(emptyProjectForm);
  const [appealAttachments, setAppealAttachments] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmDecisionOpen, setConfirmDecisionOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const isHq = session?.user.role === "HQ";
  const tabs = isHq
    ? ["Overview", "Review Project", "View Projects"]
    : ["Overview", "Create Project", "View Projects", "Appeal Station"];

  useEffect(() => {
    setActiveTab(tabs[0] ?? "");
  }, [session?.user.role]);

  async function loadData(currentSession = session) {
    if (!currentSession) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [projectsData, branchesData] = await Promise.all([
        apiRequest<{ projects: ProjectRecord[] }>("/api/projects", { session: currentSession }),
        apiRequest<{ branches: OfficeAccount[] }>("/api/branches", { session: currentSession })
      ]);

      setProjects(projectsData.projects);
      setBranches(branchesData.branches);
      setSelectedProjectId((current) => current ?? projectsData.projects[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [session]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (statusFilter !== "All Projects" && project.status !== statusFilter) {
        return false;
      }

      if (isHq && branchFilter !== "all" && project.branchOfficeId !== branchFilter) {
        return false;
      }

      return true;
    });
  }, [branchFilter, isHq, projects, statusFilter]);

  const rejectedProjects = projects.filter((project) => project.status === "Rejected");
  const countByStatus = {
    Submitted: projects.filter((project) => project.status === "Submitted").length,
    "AI Processing": projects.filter((project) => project.status === "AI Processing").length,
    "Waiting for Approval": projects.filter((project) => project.status === "Waiting for Approval").length,
    Approved: projects.filter((project) => project.status === "Approved").length,
    Rejected: projects.filter((project) => project.status === "Rejected").length
  };

  useEffect(() => {
    if (selectedProject?.status === "Rejected" && !isHq) {
      setAppealForm({
        subject: selectedProject.subject,
        applicantName: selectedProject.applicantName,
        position: selectedProject.position,
        email: selectedProject.email,
        description: selectedProject.description
      });
    }
  }, [isHq, selectedProject]);

  if (!session || sessionLoading) {
    return null;
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest<{ project: ProjectRecord }>("/api/projects", {
        method: "POST",
        session,
        json: {
          ...createForm,
          attachments: filesToAttachmentReferences(createAttachments)
        }
      });
      setCreateForm(emptyProjectForm);
      setCreateAttachments(null);
      setFeedback("Project submitted and AI report generated for HQ review.");
      await loadData();
      setActiveTab("View Projects");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Project submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision() {
    if (!selectedProject) {
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest(`/api/approvals/${selectedProject.id}/decision`, {
        method: "POST",
        session,
        json: {
          decision,
          comments: decisionComments
        }
      });
      setConfirmDecisionOpen(false);
      setDecisionComments("");
      setFeedback(`Project ${decision.toLowerCase()} successfully.`);
      await loadData();
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Decision failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAppeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        session,
        json: {
          action: "appeal",
          payload: {
            ...appealForm,
            attachments: filesToAttachmentReferences(appealAttachments)
          }
        }
      });
      setAppealAttachments(null);
      setFeedback("Appeal submitted and returned to the approval workflow.");
      await loadData();
      setActiveTab("View Projects");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Appeal submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function openProjectDetail(projectId: string) {
    setSelectedProjectId(projectId);
    setDetailModalOpen(true);
  }

  function renderProjectCard(project: ProjectRecord, { selectable = false }: { selectable?: boolean } = {}) {
    const selected = selectable && project.id === selectedProjectId;

    return (
      <div
        key={project.id}
        className={`synapse-focus rounded-[22px] border p-4 text-left shadow-sm transition ${
          selected
            ? "border-blue-200 bg-blue-50"
            : "border-synapse-border bg-synapse-elevated hover:border-blue-100 hover:bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-card-title text-synapse-text">{project.subject}</p>
            <p className="mt-1 text-body text-synapse-muted">{project.branchOfficeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status={project.status} />
            <WorkflowStatusBadge status={project.status} />
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-body text-synapse-muted">{project.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-meta text-synapse-muted">
            <span>{formatDateTime(project.updatedAt)}</span>
            <span>{project.appealCount} appeal{project.appealCount === 1 ? "" : "s"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectable ? (
              <SecondaryButton type="button" onClick={() => setSelectedProjectId(project.id)}>
                {selected ? "Selected" : "Select"}
              </SecondaryButton>
            ) : null}
            <PrimaryButton type="button" onClick={() => openProjectDetail(project.id)}>
              View details
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  function renderProjectDetail(project: ProjectRecord | null) {
    if (!project) {
      return <p className="text-body text-synapse-muted">No project selected.</p>;
    }

    return (
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-section-title text-synapse-text">{project.subject}</p>
            <p className="mt-1 text-body text-synapse-muted">
              Full report generated for {project.branchOfficeName}.
            </p>
          </div>
          <WorkflowStatusBadge status={project.status} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
            <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Applicant information</p>
            <div className="mt-3 grid gap-2 text-body text-synapse-text">
              <p>{project.applicantName}</p>
              <p>{project.position}</p>
              <p>{project.email}</p>
              <p>{project.branchOfficeName}</p>
            </div>
          </div>
          <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
            <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Generated report contents</p>
            <div className="mt-3 grid gap-2 text-body text-synapse-text">
              <p><span className="font-semibold">Branch Office name:</span> {project.report.branchOfficeName}</p>
              <p><span className="font-semibold">Submission time:</span> {formatDateTime(project.report.submissionTime)}</p>
              <p><span className="font-semibold">Project description:</span> {project.report.projectDescription}</p>
              <p><span className="font-semibold">Resource / reference links:</span> {project.report.resourceLinks.join(", ") || "No attachments"}</p>
              <p><span className="font-semibold">AI advice:</span> {project.report.aiAdvice}</p>
            </div>
          </div>
        </div>

        {project.decision ? (
          <div className="rounded-[22px] border border-synapse-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-card-title text-synapse-text">HQ decision</p>
              <WorkflowStatusBadge status={project.decision.decision} />
            </div>
            <p className="mt-2 text-body text-synapse-muted">
              {project.decision.decidedByOfficeName} · {formatDateTime(project.decision.decidedAt)}
            </p>
            <p className="mt-3 text-body text-synapse-text">{project.decision.comments || "No HQ comment added."}</p>
          </div>
        ) : null}

        <div className="rounded-[22px] border border-synapse-border bg-white p-4">
          <p className="text-card-title text-synapse-text">Status history</p>
          <div className="mt-3 grid gap-3">
            {project.statusHistory.map((entry, index) => (
              <div key={`${entry.status}-${entry.changedAt}-${index}`} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-3">
                <div className="flex items-center justify-between gap-3">
                  <WorkflowStatusBadge status={entry.status} />
                  <p className="text-meta text-synapse-muted">{formatDateTime(entry.changedAt)}</p>
                </div>
                <p className="mt-2 text-body text-synapse-text">{entry.note}</p>
                <p className="mt-1 text-meta text-synapse-muted">{entry.changedByOfficeName}</p>
              </div>
            ))}
          </div>
        </div>

        <AiTransparencyPanel insight={project.report.aiOutput} title="Project review AI workflow" />
      </div>
    );
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title={isHq ? "Approval" : "Application"}
      description={
        isHq
          ? "Review branch-generated project reports, view AI advice, and record final HQ decisions."
          : "Submit project applications, review AI-generated reports, and manage appeals after rejection."
      }
    >
      <PageSection
        title={isHq ? "Approval module" : "Application module"}
        description={
          isHq
            ? "Projects follow the same status flow from branch submission through HQ decision."
            : "Each application moves through submission, AI review, and final HQ approval."
        }
        action={<TabsShell tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab)} />}
      >
        <StatGrid
          items={[
            { label: "Submitted", value: countByStatus.Submitted, tone: "info" },
            { label: "AI Processing", value: countByStatus["AI Processing"], tone: "info" },
            { label: "Waiting for Approval", value: countByStatus["Waiting for Approval"], tone: "warning" },
            { label: "Approved", value: countByStatus.Approved, tone: "success" },
            { label: "Rejected", value: countByStatus.Rejected, tone: "error" }
          ]}
        />
      </PageSection>

      {feedback ? (
        <PageSection title="Latest action">
          <p className={`text-body ${feedback.toLowerCase().includes("failed") || feedback.toLowerCase().includes("error") ? "text-synapse-error" : "text-synapse-secondary"}`}>
            {feedback}
          </p>
        </PageSection>
      ) : null}

      {activeTab === "Overview" ? (
        <PageSection
          title={isHq ? "Latest decision queue" : "Latest branch projects"}
          description={isHq ? "Open any project in a popup to review the full report." : "Open any project in a popup to review the full report."}
        >
          <RecordList
            items={projects.slice(0, 5)}
            emptyTitle="No project workflow yet"
            emptyDescription={isHq ? "Branch submissions will appear here." : "Create the first application to start the workflow."}
            renderItem={(project) => renderProjectCard(project)}
          />
        </PageSection>
      ) : null}

      {!isHq && activeTab === "Create Project" ? (
        <PageSection
          title="Create project"
          description="A compose-style branch application form. After submission, the system generates an HQ-facing project report with mandatory AI advice."
        >
          <form className="grid gap-4" onSubmit={handleCreateProject}>
            <FormField
              label="Subject"
              required
              value={createForm.subject}
              onChange={(event) => setCreateForm((current) => ({ ...current, subject: event.target.value }))}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                label="Applicant name"
                required
                value={createForm.applicantName}
                onChange={(event) => setCreateForm((current) => ({ ...current, applicantName: event.target.value }))}
              />
              <FormField
                label="Position"
                required
                value={createForm.position}
                onChange={(event) => setCreateForm((current) => ({ ...current, position: event.target.value }))}
              />
              <FormField
                label="Email"
                required
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <TextAreaField
              label="Project description"
              required
              value={createForm.description}
              onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
            />
            <div className="grid gap-2">
              <FileUploadBox label="Resource / reference attachments" hint="Allowed: spreadsheet, PDF, document, presentation, CSV, or text files only." />
              <input
                className="text-body text-synapse-muted"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf"
                onChange={(event) => setCreateAttachments(event.target.files)}
              />
            </div>
            <PrimaryButton loading={submitting} type="submit">
              Submit project
            </PrimaryButton>
          </form>
        </PageSection>
      ) : null}

      {activeTab === "View Projects" ? (
        <PageSection
          title="Project records"
          description="Latest first, with status filters and popup detail view."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField label="Status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              {statusFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </SelectField>
            {isHq ? (
              <SelectField label="Branch Office" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
                <option value="all">All Branch Offices</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.officeName}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
          {loading ? <p className="text-body text-synapse-muted">Loading projects...</p> : error ? <p className="text-body text-synapse-error">{error}</p> : null}
          <RecordList
            items={filteredProjects}
            emptyTitle="No matching projects"
            emptyDescription="Adjust the filters or create a new project submission."
            renderItem={(project) => renderProjectCard(project)}
          />
        </PageSection>
      ) : null}

      {isHq && activeTab === "Review Project" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <PageSection
            title="Review queue"
            description="Open any project, read the full report, then approve or reject with optional comments."
          >
            <RecordList
              items={projects.filter((project) => project.status === "Waiting for Approval")}
              emptyTitle="No projects waiting for approval"
              emptyDescription="Branch appeals and new submissions will return here."
              renderItem={(project) => renderProjectCard(project, { selectable: true })}
            />
          </PageSection>
          <PageSection
            title="Decision panel"
            description="Select a project, review it in a popup, then submit the HQ decision."
          >
            {selectedProject ? (
              <div className="grid gap-4">
                <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-card-title text-synapse-text">{selectedProject.subject}</p>
                      <p className="mt-1 text-body text-synapse-muted">{selectedProject.branchOfficeName}</p>
                      <p className="mt-3 text-meta text-synapse-muted">{formatDateTime(selectedProject.updatedAt)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <WorkflowStatusBadge status={selectedProject.status} />
                      <SecondaryButton type="button" onClick={() => openProjectDetail(selectedProject.id)}>
                        View details
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
                  <SelectField label="Decision" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </SelectField>
                  <TextAreaField
                    label="HQ comments"
                    value={decisionComments}
                    onChange={(event) => setDecisionComments(event.target.value)}
                    hint="Optional, but visible to the branch after decision."
                  />
                  <PrimaryButton onClick={() => setConfirmDecisionOpen(true)}>
                    Submit decision
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <p className="text-body text-synapse-muted">Select a project from the review queue.</p>
            )}
          </PageSection>
        </div>
      ) : null}

      {!isHq && activeTab === "Appeal Station" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <PageSection
            title="Rejected projects"
            description="Each rejected project can be appealed any number of times, but every appeal requires a full rewritten submission."
          >
            <RecordList
              items={rejectedProjects}
              emptyTitle="No rejected projects"
              emptyDescription="Rejected items will appear here and can be re-submitted with updated detail."
              renderItem={(project) => renderProjectCard(project, { selectable: true })}
            />
          </PageSection>
          <PageSection
            title="Appeal submission"
            description="Rework the application details before sending it back into the workflow."
          >
            {selectedProject && selectedProject.status === "Rejected" ? (
              <form className="grid gap-4" onSubmit={handleAppeal}>
                <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 text-body text-synapse-text">
                  Appeal count: {selectedProject.appealCount}
                </div>
                <FormField
                  label="Subject"
                  required
                  value={appealForm.subject}
                  onChange={(event) => setAppealForm((current) => ({ ...current, subject: event.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    label="Applicant name"
                    required
                    value={appealForm.applicantName}
                    onChange={(event) => setAppealForm((current) => ({ ...current, applicantName: event.target.value }))}
                  />
                  <FormField
                    label="Position"
                    required
                    value={appealForm.position}
                    onChange={(event) => setAppealForm((current) => ({ ...current, position: event.target.value }))}
                  />
                  <FormField
                    label="Email"
                    required
                    type="email"
                    value={appealForm.email}
                    onChange={(event) => setAppealForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <TextAreaField
                  label="Rewritten application detail"
                  required
                  value={appealForm.description}
                  onChange={(event) => setAppealForm((current) => ({ ...current, description: event.target.value }))}
                />
                <input
                  className="text-body text-synapse-muted"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf"
                  onChange={(event) => setAppealAttachments(event.target.files)}
                />
                <PrimaryButton loading={submitting} type="submit">
                  Submit appeal
                </PrimaryButton>
              </form>
            ) : (
              <p className="text-body text-synapse-muted">Select a rejected project to prepare its next appeal.</p>
            )}
          </PageSection>
        </div>
      ) : null}

      <ModalDialog open={confirmDecisionOpen} title="Confirm HQ decision" onClose={() => setConfirmDecisionOpen(false)}>
        <div className="grid gap-4">
          <p className="text-body text-synapse-muted">
            This decision will be returned to the branch and stored in the project record.
          </p>
          <div className="flex flex-col gap-3 md:flex-row">
            <PrimaryButton className="flex-1" loading={submitting} onClick={handleDecision}>
              Confirm decision
            </PrimaryButton>
            <SecondaryButton className="flex-1" onClick={() => setConfirmDecisionOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </ModalDialog>

      <ModalDialog
        open={detailModalOpen}
        title="Project details"
        onClose={() => setDetailModalOpen(false)}
        panelClassName="max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {renderProjectDetail(selectedProject)}
      </ModalDialog>
    </AppShell>
  );
}
