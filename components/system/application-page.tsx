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
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { ModalDialog, TabsShell } from "@/components/ui/feedback";
import {
  AiTransparencyPanel,
  EmptyBlock,
  PageSection,
  RecordList,
  StatGrid,
  StatusIcon,
  WorkflowStageMap,
  WorkflowStatusBadge
} from "@/components/system/ui";
import { filesToAttachmentReferences } from "@/components/system/file-utils";
import { formatDateTime } from "@/components/system/format";
import type { OfficeAccount, ProjectRecord, WorkflowStatus } from "@/types/system";

const statusFilters: Array<"All Projects" | WorkflowStatus> = [
  "All Projects",
  "Submitted",
  "AI Processing",
  "Waiting for Approval",
  "Approved",
  "Rejected"
];

type IntakeFormState = {
  subject: string;
  applicantName: string;
  position: string;
  email: string;
  description: string;
};

const emptyIntakeForm: IntakeFormState = {
  subject: "",
  applicantName: "",
  position: "",
  email: "",
  description: ""
};

function buildProjectStages(project: ProjectRecord | null) {
  if (!project) {
    return [
      {
        label: "Unstructured input intake",
        description: "Branch captures raw demand, inventory, trend, feedback, or operational context.",
        state: "active" as const
      },
      {
        label: "Potential project identification",
        description: "AI converts the raw signal into a structured project report and suggested scope.",
        state: "upcoming" as const
      },
      {
        label: "Initial phase plan + validation",
        description: "The team runs plan generation and hallucination limiting before execution.",
        state: "upcoming" as const
      },
      {
        label: "Approval request",
        description: "HQ reviews the structured output and decides whether the project can proceed.",
        state: "upcoming" as const
      },
      {
        label: "Outcome capture",
        description: "Execution evidence and real-world results are collected after approval.",
        state: "upcoming" as const
      },
      {
        label: "Next phase planning",
        description: "AI uses the outcome to propose the next phase and a new validation cycle.",
        state: "upcoming" as const
      }
    ];
  }

  const decisionState =
    project.status === "Approved"
      ? "done"
      : project.status === "Rejected"
        ? "blocked"
        : "active";

  return [
    {
      label: "Unstructured input intake",
      description: "The branch captured a raw operational signal and submitted it to the system.",
      state: "done" as const
    },
    {
      label: "Potential project identification",
      description: "AI generated the first structured project report from the original input.",
      state: "done" as const
    },
    {
      label: "Initial phase plan + validation",
      description: "Run the Plan & Validate module to build the phase plan, confidence, and risk controls.",
      state:
        project.status === "Submitted" || project.status === "AI Processing"
          ? ("active" as const)
          : ("done" as const)
    },
    {
      label: "Approval request",
      description: "HQ reviews the structured AI output and decides whether the workflow can proceed.",
      state: decisionState as "done" | "active" | "blocked"
    },
    {
      label: "Outcome capture",
      description: "After approval, execution evidence and field outcomes should be logged back into the system.",
      state: project.status === "Approved" ? ("active" as const) : ("upcoming" as const)
    },
    {
      label: "Next phase planning",
      description: "A later step will turn the outcome into the next phase recommendation and validation pass.",
      state: "upcoming" as const
    }
  ];
}

function getNextMove(project: ProjectRecord | null) {
  if (!project) {
    return "Start with a raw branch input so AI can identify the first potential project.";
  }

  if (project.status === "Submitted" || project.status === "AI Processing") {
    return "Review the structured AI project report, then move into Plan & Validate to prepare the first phase plan.";
  }

  if (project.status === "Waiting for Approval") {
    return "HQ should decide whether the validated workflow can proceed, or return it for revision.";
  }

  if (project.status === "Rejected") {
    return "Rewrite the input and supporting detail, then resubmit it as a new workflow pass.";
  }

  if (project.status === "Approved") {
    return "Capture execution outcome and field evidence, then prepare the next phase recommendation.";
  }

  return "Continue the next workflow step based on the latest decision and evidence.";
}

export function ApplicationPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [branches, setBranches] = useState<OfficeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All Projects");
  const [branchFilter, setBranchFilter] = useState("all");
  const [intakeForm, setIntakeForm] = useState<IntakeFormState>(emptyIntakeForm);
  const [intakeAttachments, setIntakeAttachments] = useState<FileList | null>(null);
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [decisionComments, setDecisionComments] = useState("");
  const [reworkForm, setReworkForm] = useState<IntakeFormState>(emptyIntakeForm);
  const [reworkAttachments, setReworkAttachments] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmDecisionOpen, setConfirmDecisionOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const isHq = session?.user.role === "HQ";
  const tabs = isHq
    ? ["Approval Queue", "Project Pipeline"]
    : ["Input Intake", "Project Pipeline", "Rejected Rework"];

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
      setError(loadError instanceof Error ? loadError.message : "Failed to load workflow records.");
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
  const waitingApprovalProjects = projects.filter((project) => project.status === "Waiting for Approval");
  const countByStatus = {
    Submitted: projects.filter((project) => project.status === "Submitted").length,
    "AI Processing": projects.filter((project) => project.status === "AI Processing").length,
    "Waiting for Approval": waitingApprovalProjects.length,
    Approved: projects.filter((project) => project.status === "Approved").length,
    Rejected: rejectedProjects.length
  };

  useEffect(() => {
    if (selectedProject?.status === "Rejected" && !isHq) {
      setReworkForm({
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
          ...intakeForm,
          attachments: filesToAttachmentReferences(intakeAttachments)
        }
      });
      setIntakeForm(emptyIntakeForm);
      setIntakeAttachments(null);
      setFeedback("Raw branch input was captured and converted into a structured AI project report.");
      await loadData();
      setActiveTab("Project Pipeline");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Workflow intake failed.");
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
      setFeedback(`Workflow ${decision.toLowerCase()} successfully.`);
      await loadData();
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Decision failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRework(event: FormEvent<HTMLFormElement>) {
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
            ...reworkForm,
            attachments: filesToAttachmentReferences(reworkAttachments)
          }
        }
      });
      setReworkAttachments(null);
      setFeedback("Rejected workflow was reworked and returned to the AI review pipeline.");
      await loadData();
      setActiveTab("Project Pipeline");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Rework submission failed.");
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
        <div className="mt-3 rounded-2xl border border-synapse-border bg-white p-3">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">AI direct result</p>
          <p className="mt-2 text-body text-synapse-text">{project.report.aiOutput.directResult}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-meta text-synapse-muted">
            <span>{formatDateTime(project.updatedAt)}</span>
            <span>{project.appealCount} rework cycle{project.appealCount === 1 ? "" : "s"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectable ? (
              <SecondaryButton type="button" onClick={() => setSelectedProjectId(project.id)}>
                {selected ? "Selected" : "Select"}
              </SecondaryButton>
            ) : null}
            <PrimaryButton type="button" onClick={() => openProjectDetail(project.id)}>
              View workflow
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

    const stages = buildProjectStages(project);

    return (
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-section-title text-synapse-text">{project.subject}</p>
            <p className="mt-1 text-body text-synapse-muted">
              This record shows how the raw branch signal became a structured workflow candidate.
            </p>
          </div>
          <WorkflowStatusBadge status={project.status} />
        </div>

        <WorkflowStageMap stages={stages} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
            <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Original unstructured input</p>
            <p className="mt-3 text-body text-synapse-text">{project.description}</p>
            <div className="mt-4 grid gap-2 text-body text-synapse-muted">
              <p><span className="font-semibold text-synapse-text">Submitted by:</span> {project.applicantName}</p>
              <p><span className="font-semibold text-synapse-text">Role / context:</span> {project.position}</p>
              <p><span className="font-semibold text-synapse-text">Contact:</span> {project.email}</p>
              <p><span className="font-semibold text-synapse-text">Submission time:</span> {formatDateTime(project.createdAt)}</p>
            </div>
          </div>
          <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4">
            <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Structured project report</p>
            <div className="mt-3 grid gap-2 text-body text-synapse-text">
              <p><span className="font-semibold">Branch Office:</span> {project.report.branchOfficeName}</p>
              <p><span className="font-semibold">Submission time:</span> {formatDateTime(project.report.submissionTime)}</p>
              <p><span className="font-semibold">Project description:</span> {project.report.projectDescription}</p>
              <p><span className="font-semibold">Resource links:</span> {project.report.resourceLinks.join(", ") || "No attachments"}</p>
              <p><span className="font-semibold">AI advice:</span> {project.report.aiAdvice}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-synapse-border bg-white p-4">
          <p className="text-card-title text-synapse-text">Next recommended move</p>
          <p className="mt-2 text-body text-synapse-muted">{getNextMove(project)}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <PrimaryButton type="button" onClick={() => router.push("/plan-validate")}>
              Open Plan & Validate
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => router.push("/issues")}>
              Report issue or blocker
            </SecondaryButton>
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
          <p className="text-card-title text-synapse-text">Workflow history</p>
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

        <AiTransparencyPanel insight={project.report.aiOutput} title="Project identification AI workflow" />
      </div>
    );
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title={isHq ? "Workflow Review" : "Workflow"}
      description={
        isHq
          ? "Review branch inputs after AI has identified potential projects, then control approval and execution readiness."
          : "Turn unstructured branch inputs into structured AI project candidates and move them through validation."
      }
    >
      <PageSection
        title="Workflow blueprint"
        description="This is the staged pipeline we are now building around: raw input, project identification, plan, validation, approval, outcome, and next phase."
        action={<TabsShell tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab)} />}
      >
        <WorkflowStageMap stages={buildProjectStages(selectedProject)} />
        <StatGrid
          items={[
            {
              label: "Signals captured",
              value: countByStatus.Submitted + countByStatus["AI Processing"] + countByStatus["Waiting for Approval"] + countByStatus.Approved + countByStatus.Rejected,
              helper: "Branch inputs that have been turned into workflow candidates.",
              tone: "info"
            },
            {
              label: "Approval pending",
              value: countByStatus["Waiting for Approval"],
              helper: "Records waiting for HQ approval.",
              tone: "warning"
            },
            {
              label: "Approved",
              value: countByStatus.Approved,
              helper: "Records ready for execution and outcome tracking.",
              tone: "success"
            },
            {
              label: "Rejected",
              value: countByStatus.Rejected,
              helper: "Inputs that should be reworked and resubmitted.",
              tone: "error"
            },
            {
              label: "Branches",
              value: branches.length,
              helper: "Registered branch offices currently in the network.",
              tone: "neutral"
            }
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

      {!isHq && activeTab === "Input Intake" ? (
        <PageSection
          title="Input intake"
          description="Capture the raw branch signal here. The system will use AI to identify the potential project and generate a structured report."
        >
          <form className="grid gap-4" onSubmit={handleCreateProject}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Signal title"
                required
                value={intakeForm.subject}
                onChange={(event) => setIntakeForm((current) => ({ ...current, subject: event.target.value }))}
              />
              <FormField
                label="Submitted by"
                required
                value={intakeForm.applicantName}
                onChange={(event) => setIntakeForm((current) => ({ ...current, applicantName: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Branch role / context"
                required
                value={intakeForm.position}
                onChange={(event) => setIntakeForm((current) => ({ ...current, position: event.target.value }))}
                placeholder="Branch manager, stock planner, operations lead"
              />
              <FormField
                label="Contact email"
                required
                type="email"
                value={intakeForm.email}
                onChange={(event) => setIntakeForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <TextAreaField
              label="Raw unstructured input"
              required
              value={intakeForm.description}
              onChange={(event) => setIntakeForm((current) => ({ ...current, description: event.target.value }))}
              hint="Paste the messy business signal here: inventory issue, trend signal, customer feedback, demand spike, or uploaded briefing summary."
            />
            <div className="grid gap-2">
              <FileUploadBox label="Reference documents" hint="Attach spreadsheets, PDFs, docs, CSVs, or presentations that support the signal." />
              <input
                className="text-body text-synapse-muted"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf"
                onChange={(event) => setIntakeAttachments(event.target.files)}
              />
            </div>
            <PrimaryButton loading={submitting} type="submit">
              Identify potential project
            </PrimaryButton>
          </form>
        </PageSection>
      ) : null}

      {activeTab === "Project Pipeline" ? (
        <PageSection
          title="Project pipeline"
          description="Track how raw signals move into structured project candidates and approval decisions."
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
          {loading ? <p className="text-body text-synapse-muted">Loading workflow records...</p> : error ? <p className="text-body text-synapse-error">{error}</p> : null}
          <RecordList
            items={filteredProjects}
            emptyTitle="No workflow records"
            emptyDescription="Capture the first branch signal to start the staged workflow."
            renderItem={(project) => renderProjectCard(project)}
          />
        </PageSection>
      ) : null}

      {isHq && activeTab === "Approval Queue" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <PageSection
            title="Approval queue"
            description="These project candidates already have AI project identification output and are waiting for the human decision layer."
          >
            <RecordList
              items={waitingApprovalProjects}
              emptyTitle="No workflows waiting for approval"
              emptyDescription="New branch signals will return here after AI has structured them into project candidates."
              renderItem={(project) => renderProjectCard(project, { selectable: true })}
            />
          </PageSection>
          <PageSection
            title="Decision panel"
            description="Review the structured candidate, open the full workflow, then approve or reject it."
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
                        View full workflow
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
                <div className="rounded-[22px] border border-synapse-border bg-white p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">AI project identification</p>
                  <p className="mt-3 text-body font-medium text-synapse-text">{selectedProject.report.aiOutput.directResult}</p>
                  <p className="mt-3 text-body text-synapse-muted">{selectedProject.report.aiOutput.finalConclusion}</p>
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
                    hint="Use this to state whether the workflow can proceed or what must be revised."
                  />
                  <PrimaryButton onClick={() => setConfirmDecisionOpen(true)}>
                    Submit decision
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <EmptyBlock
                title="Select a workflow candidate"
                description="Choose one record from the approval queue to review its AI project identification and make the decision."
              />
            )}
          </PageSection>
        </div>
      ) : null}

      {!isHq && activeTab === "Rejected Rework" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <PageSection
            title="Rejected records"
            description="Each rejected candidate can be rewritten and re-entered into the workflow as many times as needed."
          >
            <RecordList
              items={rejectedProjects}
              emptyTitle="No rejected workflow records"
              emptyDescription="Rejected candidates will appear here and can be reworked for another AI pass."
              renderItem={(project) => renderProjectCard(project, { selectable: true })}
            />
          </PageSection>
          <PageSection
            title="Rework and resubmit"
            description="Rewrite the original input before sending the candidate back through the project identification flow."
          >
            {selectedProject && selectedProject.status === "Rejected" ? (
              <form className="grid gap-4" onSubmit={handleRework}>
                <div className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-4 text-body text-synapse-text">
                  Rework cycle count: {selectedProject.appealCount}
                </div>
                <FormField
                  label="Signal title"
                  required
                  value={reworkForm.subject}
                  onChange={(event) => setReworkForm((current) => ({ ...current, subject: event.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    label="Submitted by"
                    required
                    value={reworkForm.applicantName}
                    onChange={(event) => setReworkForm((current) => ({ ...current, applicantName: event.target.value }))}
                  />
                  <FormField
                    label="Branch role / context"
                    required
                    value={reworkForm.position}
                    onChange={(event) => setReworkForm((current) => ({ ...current, position: event.target.value }))}
                  />
                  <FormField
                    label="Contact email"
                    required
                    type="email"
                    value={reworkForm.email}
                    onChange={(event) => setReworkForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <TextAreaField
                  label="Rewritten raw input"
                  required
                  value={reworkForm.description}
                  onChange={(event) => setReworkForm((current) => ({ ...current, description: event.target.value }))}
                />
                <input
                  className="text-body text-synapse-muted"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf"
                  onChange={(event) => setReworkAttachments(event.target.files)}
                />
                <PrimaryButton loading={submitting} type="submit">
                  Resubmit workflow candidate
                </PrimaryButton>
              </form>
            ) : (
              <EmptyBlock
                title="Select a rejected record"
                description="Pick one rejected record from the left so you can rewrite the raw input and send it back into the workflow."
              />
            )}
          </PageSection>
        </div>
      ) : null}

      <ModalDialog open={confirmDecisionOpen} title="Confirm approval decision" onClose={() => setConfirmDecisionOpen(false)}>
        <div className="grid gap-4">
          <p className="text-body text-synapse-muted">
            This decision will become the human approval layer for the current workflow candidate.
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
        title="Workflow detail"
        onClose={() => setDetailModalOpen(false)}
        panelClassName="max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {renderProjectDetail(selectedProject)}
      </ModalDialog>
    </AppShell>
  );
}
