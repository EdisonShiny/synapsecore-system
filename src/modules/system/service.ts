import { createId } from "@/src/utils/id";
import { nowIso } from "@/src/utils/date";
import {
  createIssueInsight,
  createWorkflowProjectCandidates,
  generateNextPhaseFromOutcome,
  createOverallInsight,
  createPlanInsight,
  createProjectAiReport,
  generateRequestRecommendation,
  generateRequestReportAttempt,
  generateWorkflowExtraction,
  generateWorkflowProjectCandidates,
  createWorkflowProjectReport,
  generatePhaseProgressReportAttempt,
  generateWorkflowReportAttempt,
  generateWorkflowValidation
} from "@/src/services/system-ai";
import { databaseAttachmentOptions, getDatabaseSelectionSummary } from "@/src/modules/system/database-options";
import {
  getSystemDatabaseInfo,
  getSystemStore,
  saveSystemStore
} from "@/src/services/system-store";
import {
  PROMPT_7_APPROVAL_DECISION,
  PROMPT_8_ESCALATION
} from "@/src/modules/ai/structured-prompts";
import type {
  AppealProjectInput,
  AttachmentReference,
  DatabasePayload,
  CreateIssueInput,
  CreateCustomDatabaseNodeInput,
  CustomDatabaseNode,
  CreateOfficeInput,
  CreatePlanSubmissionInput,
  CreateProjectInput,
  CreateRequestApplicationInput,
  CreateWorkflowInput,
  DemoAccountSummary,
  DashboardPayload,
  ExecuteWorkflowInput,
  IssueThread,
  OfficeAccount,
  OfficeRole,
  PlanInsight,
  ProjectDecisionInput,
  ProgressProjectPhaseInput,
  ProjectRecord,
  PublicAuthStatus,
  ReapplyRequestApplicationInput,
  RequestApplicationRecord,
  RequestDecision,
  ReplyIssueInput,
  RequestsPayload,
  SystemSession,
  SystemSettingsPayload,
  UpdateRequestPromptConfigInput,
  UpdateCustomDatabaseNodeInput,
  UpdateWorkflowInput,
  UpdateSystemAiConfigInput,
  UpdateOfficeInput,
  WorkflowAttempt,
  WorkflowDetailPayload,
  WorkflowExtraction,
  ProjectPhaseRecord,
  WorkflowPromptConfig,
  WorkflowRecord,
  WorkflowRunRecord,
  WorkflowStatus
} from "@/types/system";

const allowedDocumentExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".ppt",
  ".pptx",
  ".txt",
  ".rtf"
]);

function getExtension(name: string) {
  const match = /\.[^.]+$/.exec(name.toLowerCase());
  return match ? match[0] : "";
}

function validateAttachments(attachments: AttachmentReference[]) {
  for (const attachment of attachments) {
    const extension = attachment.extension || getExtension(attachment.name);
    const type = attachment.type.toLowerCase();

    if (type.startsWith("image/")) {
      throw new Error("Image uploads are not allowed for this workflow.");
    }

    if (!allowedDocumentExtensions.has(extension)) {
      throw new Error(`Unsupported attachment type for ${attachment.name}.`);
    }
  }
}

function normalizeAttachments(attachments: AttachmentReference[]) {
  validateAttachments(attachments);

  return attachments.map((attachment) => ({
    ...attachment,
    id: attachment.id || createId(),
    extension: attachment.extension || getExtension(attachment.name)
  }));
}

function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeText(value: string) {
  return value.trim();
}

function resolveDatabaseContextSummaries(selectedPaths: string[]) {
  const store = getSystemStore();
  const uniquePaths = Array.from(
    new Set(selectedPaths.map((path) => sanitizeText(path)).filter(Boolean))
  );

  return uniquePaths
    .map((path) => {
      const option = databaseAttachmentOptions.find((entry) => entry.path === path);
      const summary = getDatabaseSelectionSummary(store.companyDatabase, path);

      if (!option || !summary) {
        return null;
      }

      return `${option.label}: ${summary}`;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function buildAugmentedInput(args: {
  unstructuredInput: string;
  attachments: AttachmentReference[];
  databaseSummaries: string[];
  webSearchEnabled: boolean;
}) {
  const sections = [sanitizeText(args.unstructuredInput)];

  if (args.attachments.length > 0) {
    sections.push(
      "Attached files:",
      ...args.attachments.map((attachment) => {
        if (attachment.contentStatus === "inline-text" && attachment.contentText) {
          return `${attachment.name}: ${attachment.contentText}`;
        }

        return `${attachment.name}: file attached (${attachment.contentStatus ?? "metadata-only"})`;
      })
    );
  }

  if (args.databaseSummaries.length > 0) {
    sections.push("Attached structured database context:", ...args.databaseSummaries);
  }

  if (args.webSearchEnabled) {
    sections.push(
      "Web search tool is enabled for this AI call when supported by the configured provider."
    );
  }

  return sections.filter(Boolean).join("\n");
}

function normalizeWorkflowConfig(config: WorkflowPromptConfig): WorkflowPromptConfig {
  return {
    reportPrompt: sanitizeText(config.reportPrompt),
    extractorPrompt: sanitizeText(config.extractorPrompt),
    validatorPrompt: sanitizeText(config.validatorPrompt),
    projectBuilderPrompt: sanitizeText(config.projectBuilderPrompt),
    phaseProgressPrompt: sanitizeText(config.phaseProgressPrompt),
    phaseBuilderPrompt: sanitizeText(config.phaseBuilderPrompt)
  };
}

function validateWorkflowConfig(config: WorkflowPromptConfig) {
  const normalized = normalizeWorkflowConfig(config);

  if (
    !normalized.reportPrompt ||
    !normalized.extractorPrompt ||
    !normalized.validatorPrompt ||
    !normalized.projectBuilderPrompt ||
    !normalized.phaseProgressPrompt ||
    !normalized.phaseBuilderPrompt
  ) {
    throw new Error("All six preset prompts are required for a workflow.");
  }

  return normalized;
}

const requestExtractorPrompt = PROMPT_7_APPROVAL_DECISION.systemPrompt;

const requestValidatorPrompt = PROMPT_8_ESCALATION.systemPrompt;

function buildRequestApprovalWorkflowConfig(requestPrompt: string): WorkflowRecord {
  return {
    id: "request-workflow",
    name: "Request Approval Workflow",
    description: "AI-assisted request approval workflow",
    createdByOfficeId: "",
    createdByOfficeName: "",
    createdAt: "",
    updatedAt: "",
    lastRunAt: null,
    runCount: 0,
    projectCount: 0,
    config: {
      reportPrompt: requestPrompt,
      extractorPrompt: requestExtractorPrompt,
      validatorPrompt: requestValidatorPrompt,
      projectBuilderPrompt: "",
      phaseProgressPrompt: "",
      phaseBuilderPrompt: ""
    }
  };
}

function getOfficeById(officeId: string) {
  const office = getSystemStore().offices.find((entry) => entry.id === officeId);

  if (!office) {
    throw new Error("Office account not found.");
  }

  return office;
}

function isBranchOffice(office: OfficeAccount) {
  return office.role === "Branch Office";
}

export function createSessionForOffice(office: OfficeAccount): SystemSession {
  return {
    token: `system:${office.id}`,
    user: office
  };
}

export function getPublicAuthStatus() {
  const store = getSystemStore();
  const accounts: DemoAccountSummary[] = [...store.offices]
    .sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === "HQ" ? -1 : 1;
      }

      return left.officeName.localeCompare(right.officeName);
    })
    .map((office) => ({
      id: office.id,
      officeName: office.officeName,
      role: office.role,
      email: office.email,
      personInChargeName: office.personInChargeName,
      location: office.location
    }));

  const status: PublicAuthStatus = {
    hqExists: store.offices.some((office) => office.role === "HQ"),
    accountCount: store.offices.length,
    accounts
  };

  return status;
}

export function registerOffice(input: CreateOfficeInput) {
  const store = getSystemStore();
  const email = sanitizeEmail(input.email);
  const existingHq = store.offices.find((office) => office.role === "HQ");
  const officeId = createId();

  if (input.role === "HQ" && existingHq) {
    throw new Error("An HQ account already exists. Only one HQ is allowed.");
  }

  if (store.offices.some((office) => sanitizeEmail(office.email) === email)) {
    throw new Error("Email is already registered.");
  }

  const office: OfficeAccount = {
    id: officeId,
    name: input.personInChargeName.trim(),
    officeName: input.officeName.trim(),
    role: input.role,
    branch_id: input.role === "Branch Office" ? officeId : null,
    location: input.location.trim(),
    address: input.address.trim(),
    email,
    personInChargeName: input.personInChargeName.trim(),
    position: input.position.trim(),
    contactNumber: input.contactNumber?.trim() ?? "",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  store.offices.unshift(office);
  saveSystemStore(store);
  return createSessionForOffice(office);
}

export function loginOffice(email: string, role: OfficeRole) {
  const store = getSystemStore();
  const office = store.offices.find(
    (entry) => sanitizeEmail(entry.email) === sanitizeEmail(email) && entry.role === role
  );

  if (!office) {
    throw new Error("No account matches that email and role.");
  }

  return createSessionForOffice(office);
}

export function getOfficeSessionUser(userId: string) {
  return getOfficeById(userId);
}

function getWorkflowById(workflowId: string) {
  const workflow = getSystemStore().workflows.find((entry) => entry.id === workflowId);

  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  return workflow;
}

function filterWorkflowRunsForOffice(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    return store.workflowRuns;
  }

  return store.workflowRuns.filter((run) => run.executedByOfficeId === office.id);
}

function createInitialProjectPhase(
  candidate: ReturnType<typeof createWorkflowProjectCandidates>["candidates"][number],
  runId: string
): ProjectPhaseRecord {
  return {
    id: createId(),
    phaseNumber: 1,
    title: "Phase 1: Initial execution plan",
    objective: candidate.summary,
    actionablePlans: candidate.actionablePlans,
    expectedOutcome: candidate.expectedOutcome,
    status: "Current",
    sourceRunId: runId,
    completionInput: null,
    completionAttachments: [],
    completionDatabasePaths: [],
    completionReport: null,
    validationSummary: null,
    completedAt: null,
    createdAt: nowIso()
  };
}

function createWorkflowBackedProject(args: {
  office: OfficeAccount;
  workflow: WorkflowRecord;
  run: WorkflowRunRecord;
  attempt: WorkflowAttempt;
  candidate: ReturnType<typeof createWorkflowProjectCandidates>["candidates"][number];
}) {
  const report = createWorkflowProjectReport({
    office: args.office,
    workflow: args.workflow,
    candidate: args.candidate,
    attempt: args.attempt,
    unstructuredInput: args.run.unstructuredInput
  });

  const createdAt = report.submissionTime;

  const project: ProjectRecord = {
    id: createId(),
    subject: args.candidate.title,
    applicantName: args.office.personInChargeName,
    position: args.office.position,
    email: sanitizeEmail(args.office.email),
    description: args.candidate.summary,
    branchOfficeId: args.office.role === "Branch Office" ? args.office.id : args.office.branch_id ?? args.office.id,
    branchOfficeName: args.office.officeName,
    createdByOfficeId: args.office.id,
    workflowId: args.workflow.id,
    workflowName: args.workflow.name,
    workflowRunId: args.run.id,
    createdAt,
    updatedAt: createdAt,
    appealCount: 0,
    attachments: [],
    status: "Submitted",
    lifecycleState: "Active",
    phases: [createInitialProjectPhase(args.candidate, args.run.id)],
    report,
    decision: null,
    statusHistory: [
      {
        status: "Submitted",
        changedAt: createdAt,
        changedByOfficeId: args.office.id,
        changedByOfficeName: args.office.officeName,
        note: `Workflow "${args.workflow.name}" submitted unstructured input to the AI pipeline.`
      },
      {
        status: "AI Processing",
        changedAt: createdAt,
        changedByOfficeId: args.office.id,
        changedByOfficeName: args.office.officeName,
        note: `The extractor and validator completed attempt ${args.attempt.attemptNumber}.`
      },
      {
        status: "Submitted",
        changedAt: createdAt,
        changedByOfficeId: args.office.id,
        changedByOfficeName: args.office.officeName,
        note: "Validated workflow output created a project that is ready for request application submission."
      }
    ]
  };

  return project;
}

function recomputeWorkflowMetrics(store: ReturnType<typeof getSystemStore>) {
  store.workflows = store.workflows.map((workflow) => {
    const relatedRuns = store.workflowRuns.filter((run) => run.workflowId === workflow.id);
    const relatedProjects = store.projects.filter((project) => project.workflowId === workflow.id);

    return {
      ...workflow,
      runCount: relatedRuns.length,
      projectCount: relatedProjects.length,
      lastRunAt: relatedRuns[0]?.updatedAt ?? null
    };
  });
}

export function listWorkflowsForOffice(_office: OfficeAccount) {
  return [...getSystemStore().workflows].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function createWorkflow(office: OfficeAccount, input: CreateWorkflowInput) {
  const store = getSystemStore();
  const createdAt = nowIso();
  const workflow: WorkflowRecord = {
    id: createId(),
    name: sanitizeText(input.name),
    description: sanitizeText(input.description),
    createdByOfficeId: office.id,
    createdByOfficeName: office.officeName,
    createdAt,
    updatedAt: createdAt,
    lastRunAt: null,
    runCount: 0,
    projectCount: 0,
    config: validateWorkflowConfig(input.config)
  };

  if (!workflow.name) {
    throw new Error("Workflow name is required.");
  }

  store.workflows.unshift(workflow);
  saveSystemStore(store);
  return workflow;
}

export function updateWorkflow(office: OfficeAccount, workflowId: string, input: UpdateWorkflowInput) {
  const store = getSystemStore();
  const workflow = store.workflows.find((entry) => entry.id === workflowId);

  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  if (office.role !== "HQ" && workflow.createdByOfficeId !== office.id) {
    throw new Error("Only HQ or the workflow creator can edit this workflow.");
  }

  workflow.name = sanitizeText(input.name);
  workflow.description = sanitizeText(input.description);
  workflow.config = validateWorkflowConfig(input.config);
  workflow.updatedAt = nowIso();

  if (!workflow.name) {
    throw new Error("Workflow name is required.");
  }

  saveSystemStore(store);
  return workflow;
}

export function listWorkflowRunsForOffice(office: OfficeAccount, workflowId: string) {
  return [...filterWorkflowRunsForOffice(office)]
    .filter((run) => run.workflowId === workflowId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getWorkflowDetailForOffice(
  office: OfficeAccount,
  workflowId: string
): WorkflowDetailPayload {
  const workflow = getWorkflowById(workflowId);
  const runs = listWorkflowRunsForOffice(office, workflowId);
  const recentProjects = listProjectsForOffice(office)
    .filter((project) => project.workflowId === workflowId)
    .slice(0, 12);

  return {
    workflow,
    runs,
    recentProjects
  };
}

export async function runWorkflow(office: OfficeAccount, workflowId: string, input: ExecuteWorkflowInput) {
  const store = getSystemStore();
  const workflow = store.workflows.find((entry) => entry.id === workflowId);

  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  const normalizedInput = sanitizeText(input.unstructuredInput);
  const attachments = normalizeAttachments(input.attachments ?? []);
  const databasePaths = Array.from(
    new Set((input.selectedDatabasePaths ?? []).map((path) => sanitizeText(path)).filter(Boolean))
  );
  const databaseSummaries = resolveDatabaseContextSummaries(databasePaths);
  const combinedInput = buildAugmentedInput({
    unstructuredInput: normalizedInput,
    attachments,
    databaseSummaries,
    webSearchEnabled: store.systemConfig.enableWebSearch
  });

  if (!normalizedInput) {
    throw new Error("Unstructured input is required.");
  }

  const run: WorkflowRunRecord = {
    id: createId(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    runKind: "Intake",
    executedByOfficeId: office.id,
    executedByOfficeName: office.officeName,
    unstructuredInput: normalizedInput,
    attachments,
    attachedDatabasePaths: databasePaths,
    attachedDatabaseSummaries: databaseSummaries,
    webSearchEnabled: store.systemConfig.enableWebSearch,
    status: "Running",
    attempts: [],
    finalReport: "",
    finalExtraction: null,
    builderSummary: "",
    validatorFeedback: "",
    createdProjectIds: [],
    createdProjectTitles: [],
    relatedProjectId: null,
    relatedPhaseId: null,
    nextPhaseId: null,
    projectClosed: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null
  };

  let previousReport = "";
  let previousFeedback = "";

  for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber += 1) {
    const report = await generateWorkflowReportAttempt({
      workflow,
      office,
      unstructuredInput: combinedInput,
      attemptNumber,
      previousReport,
      validatorFeedback: previousFeedback
    });
    const extraction = await generateWorkflowExtraction({
      workflow,
      report,
      unstructuredInput: combinedInput
    });
    const validation = await generateWorkflowValidation({
      workflow,
      extraction,
      unstructuredInput: combinedInput,
      attemptNumber
    });
    const attempt: WorkflowAttempt = {
      id: createId(),
      attemptNumber,
      report,
      extraction,
      validation,
      createdAt: nowIso()
    };

    run.attempts.push(attempt);
    run.finalReport = report;
    run.finalExtraction = extraction;
    run.validatorFeedback = validation.summary;
    run.updatedAt = nowIso();

    if (validation.result === "Pass") {
      const builderResult = await generateWorkflowProjectCandidates({
        workflow,
        extraction,
        report,
        unstructuredInput: combinedInput
      });
      const nextProjects = builderResult.candidates.map((candidate) =>
        createWorkflowBackedProject({
          office,
          workflow,
          run,
          attempt,
          candidate
        })
      );

      run.status = "Completed";
      run.builderSummary = builderResult.summary;
      run.createdProjectIds = nextProjects.map((project) => project.id);
      run.createdProjectTitles = nextProjects.map((project) => project.subject);
      run.completedAt = nowIso();
      run.updatedAt = run.completedAt;

      store.projects.unshift(...nextProjects);
      workflow.projectCount += nextProjects.length;
      break;
    }

    previousReport = report;
    previousFeedback = validation.retryInstruction;
  }

  if (run.status !== "Completed") {
    run.status = "Failed";
    run.builderSummary = "Project builder did not run because validation never passed.";
    run.completedAt = nowIso();
    run.updatedAt = run.completedAt;
  }

  workflow.runCount += 1;
  workflow.lastRunAt = run.completedAt ?? nowIso();
  workflow.updatedAt = nowIso();
  store.workflowRuns.unshift(run);
  recomputeWorkflowMetrics(store);
  saveSystemStore(store);

  return run;
}

function buildProjectStatusHistory(
  office: OfficeAccount,
  reportGeneratedAt: string
) {
  return [
    {
      status: "Submitted" as const,
      changedAt: reportGeneratedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "Application submitted by branch office."
    },
    {
      status: "AI Processing" as const,
      changedAt: reportGeneratedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "AI generated project report and recommendation."
    },
    {
      status: "Submitted" as const,
      changedAt: reportGeneratedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "Project record is ready for a request application submission."
    }
  ];
}

function ensureBranchUser(office: OfficeAccount) {
  if (!isBranchOffice(office)) {
    throw new Error("Only a Branch Office can perform this action.");
  }
}

function getRequestById(requestId: string) {
  const request = getSystemStore().requests.find((entry) => entry.id === requestId);

  if (!request) {
    throw new Error("Request application not found.");
  }

  return request;
}

function matchesBranchOfficeOwnership(
  office: OfficeAccount,
  record: { branchOfficeId: string; branchOfficeName: string }
) {
  if (office.role === "HQ") {
    return true;
  }

  return record.branchOfficeId === office.id || record.branchOfficeName === office.officeName;
}

function filterRequestsForOffice(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    return store.requests;
  }

  return store.requests.filter((request) => matchesBranchOfficeOwnership(office, request));
}

function getRequestEligibleProjects(office: OfficeAccount) {
  const projects = filterProjectsForOffice(office);
  const store = getSystemStore();

  return projects.filter((project) => {
    const hasActiveRequest = store.requests.some(
      (request) => request.projectId === project.id && request.status !== "Rejected"
    );

    return project.lifecycleState !== "Completed" && !hasActiveRequest;
  });
}

function filterProjectsForOffice(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    return store.projects;
  }

  return store.projects.filter((project) => matchesBranchOfficeOwnership(office, project));
}

function filterIssuesForOffice(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    return store.issues;
  }

  return store.issues.filter(
    (issue) => issue.branchOfficeId === office.id || issue.targetOfficeId === office.id
  );
}

function filterPlanInsightsForOffice(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    return store.planInsights;
  }

  return store.planInsights.filter(
    (insight) => insight.scope === "branch" && insight.officeId === office.id
  );
}

export function buildDashboard(office: OfficeAccount): DashboardPayload {
  const projects = filterProjectsForOffice(office);
  const issues = filterIssuesForOffice(office);
  const insights = filterPlanInsightsForOffice(office);
  const counts: Record<WorkflowStatus, number> = {
    Submitted: 0,
    "AI Processing": 0,
    "Waiting for Approval": 0,
    Approved: 0,
    Rejected: 0
  };

  for (const project of projects) {
    counts[project.status] += 1;
  }

  return {
    role: office.role,
    office,
    counts,
    unreadIssues: issues.filter((issue) => issue.unreadByOfficeIds.includes(office.id)).length,
    projectTotal: projects.length,
    branchCount: getSystemStore().offices.filter((entry) => entry.role === "Branch Office").length,
    latestProjects: [...projects]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5),
    latestIssues: [...issues]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 5),
    latestPlanInsights: [...insights]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 3)
  };
}

export function listProjectsForOffice(office: OfficeAccount) {
  return [...filterProjectsForOffice(office)].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}

export function getProjectForOffice(projectId: string, office: OfficeAccount) {
  const project = filterProjectsForOffice(office).find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

export function createProject(office: OfficeAccount, input: CreateProjectInput) {
  ensureBranchUser(office);

  const store = getSystemStore();
  const attachments = normalizeAttachments(input.attachments);
  const report = createProjectAiReport(office, { ...input, attachments });
  const project: ProjectRecord = {
    id: createId(),
    subject: input.subject.trim(),
    applicantName: input.applicantName.trim(),
    position: input.position.trim(),
    email: sanitizeEmail(input.email),
    description: input.description.trim(),
    branchOfficeId: office.id,
    branchOfficeName: office.officeName,
    createdByOfficeId: office.id,
    workflowId: null,
    workflowName: null,
    workflowRunId: null,
    createdAt: report.submissionTime,
    updatedAt: report.submissionTime,
    appealCount: 0,
    attachments,
    status: "Submitted",
    lifecycleState: "Active",
    phases: [],
    report,
    decision: null,
    statusHistory: buildProjectStatusHistory(office, report.submissionTime)
  };

  store.projects.unshift(project);
  saveSystemStore(store);
  return project;
}

export function getRequestPromptConfig() {
  const store = getSystemStore();

  return store.requestConfig;
}

export function updateRequestPromptConfig(
  office: OfficeAccount,
  input: UpdateRequestPromptConfigInput
) {
  if (office.role !== "HQ") {
    throw new Error("Only HQ can update request prompt configuration.");
  }

  const store = getSystemStore();
  store.requestConfig = {
    requestAnalysisPrompt: sanitizeText(input.requestAnalysisPrompt),
    requestRecommendationPrompt: sanitizeText(input.requestRecommendationPrompt)
  };

  if (!store.requestConfig.requestAnalysisPrompt || !store.requestConfig.requestRecommendationPrompt) {
    throw new Error("Both request prompts are required.");
  }

  saveSystemStore(store);
  return store.requestConfig;
}

export function getRequestsPayloadForOffice(office: OfficeAccount): RequestsPayload {
  return {
    requests: [...filterRequestsForOffice(office)].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    ),
    availableProjects: getRequestEligibleProjects(office),
    config: getRequestPromptConfig()
  };
}

export async function createRequestApplication(
  office: OfficeAccount,
  input: CreateRequestApplicationInput
) {
  ensureBranchUser(office);
  const store = getSystemStore();
  const project = input.projectId
    ? store.projects.find((entry) => entry.id === input.projectId)
    : null;

  if (input.projectId && !project) {
    throw new Error("Project not found.");
  }

  if (project && !matchesBranchOfficeOwnership(office, project)) {
    throw new Error("Branch Office can only submit requests for its own projects.");
  }

  const applicationText = sanitizeText(input.applicationText);
  const projectSubject = sanitizeText(input.projectTitle ?? "") || project?.subject || "";

  if (!projectSubject) {
    throw new Error("Project title is required.");
  }

  if (!applicationText) {
    throw new Error("Request application text is required.");
  }

  if (
    store.requests.some(
      (request) =>
        matchesBranchOfficeOwnership(office, request) &&
        request.projectSubject.toLowerCase() === projectSubject.toLowerCase() &&
        request.status !== "Rejected"
    )
  ) {
    throw new Error("An active request application already exists for this project title.");
  }

  const attachments = normalizeAttachments(input.attachments ?? []);
  const selectedDatabasePaths = Array.from(
    new Set((input.selectedDatabasePaths ?? []).map((path) => sanitizeText(path)).filter(Boolean))
  );
  const ai = await runRequestApprovalAi({
    requestPrompt: store.requestConfig.requestAnalysisPrompt,
    recommendationPrompt: store.requestConfig.requestRecommendationPrompt,
    projectSubject,
    branchOfficeName: office.officeName,
    applicationText,
    attachments,
    selectedDatabasePaths,
    webSearchEnabled: store.systemConfig.enableWebSearch
  });
  const createdAt = nowIso();
  const request: RequestApplicationRecord = {
    id: createId(),
    projectId: project?.id ?? null,
    projectSubject,
    workflowId: project?.workflowId ?? null,
    workflowName: project?.workflowName ?? null,
    branchOfficeId: office.id,
    branchOfficeName: office.officeName,
    createdByOfficeId: office.id,
    createdByOfficeName: office.officeName,
    applicationText,
    attachments,
    selectedDatabasePaths,
    selectedDatabaseSummaries: ai.databaseSummaries,
    attempts: ai.attempts,
    finalReport: ai.finalReport,
    finalExtraction: ai.finalExtraction,
    validation: ai.finalValidation,
    recommendation: ai.recommendation,
    status: "Waiting for Approval",
    appealCount: 0,
    webSearchEnabled: store.systemConfig.enableWebSearch,
    decision: null,
    statusHistory: [
      {
        status: "AI Processing",
        changedAt: createdAt,
        changedByOfficeId: office.id,
        changedByOfficeName: office.officeName,
        note: "AI generated the request report, extraction, validation result, and recommendation."
      },
      {
        status: "Waiting for Approval",
        changedAt: createdAt,
        changedByOfficeId: office.id,
        changedByOfficeName: office.officeName,
        note: "Branch office submitted a request application for HQ approval."
      }
    ],
    createdAt,
    updatedAt: createdAt
  };

  store.requests.unshift(request);

  if (project) {
    project.status = "Waiting for Approval";
    project.updatedAt = createdAt;
    project.decision = null;
    project.statusHistory.push({
      status: "Waiting for Approval",
      changedAt: createdAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "Request application submitted with AI recommendation for HQ review."
    });
  }

  saveSystemStore(store);
  return request;
}

export async function reapplyRequestApplication(
  office: OfficeAccount,
  requestId: string,
  input: ReapplyRequestApplicationInput
) {
  ensureBranchUser(office);
  const store = getSystemStore();
  const request = store.requests.find((entry) => entry.id === requestId);

  if (!request) {
    throw new Error("Request application not found.");
  }

  if (!matchesBranchOfficeOwnership(office, request)) {
    throw new Error("Branch Office can only reapply its own rejected requests.");
  }

  if (request.status !== "Rejected") {
    throw new Error("Only rejected requests can be reapplied.");
  }

  const project = request.projectId
    ? store.projects.find((entry) => entry.id === request.projectId)
    : null;

  const applicationText = sanitizeText(input.applicationText);

  if (!applicationText) {
    throw new Error("Request application text is required.");
  }

  const attachments = normalizeAttachments(input.attachments ?? []);
  const selectedDatabasePaths = Array.from(
    new Set((input.selectedDatabasePaths ?? []).map((path) => sanitizeText(path)).filter(Boolean))
  );
  const ai = await runRequestApprovalAi({
    requestPrompt: store.requestConfig.requestAnalysisPrompt,
    recommendationPrompt: store.requestConfig.requestRecommendationPrompt,
    projectSubject: request.projectSubject,
    branchOfficeName: office.officeName,
    applicationText,
    attachments,
    selectedDatabasePaths,
    webSearchEnabled: store.systemConfig.enableWebSearch
  });
  const updatedAt = nowIso();

  request.applicationText = applicationText;
  request.attachments = attachments;
  request.selectedDatabasePaths = selectedDatabasePaths;
  request.selectedDatabaseSummaries = ai.databaseSummaries;
  request.attempts = ai.attempts;
  request.finalReport = ai.finalReport;
  request.finalExtraction = ai.finalExtraction;
  request.validation = ai.finalValidation;
  request.recommendation = ai.recommendation;
  request.status = "Waiting for Approval";
  request.appealCount += 1;
  request.decision = null;
  request.updatedAt = updatedAt;
  request.statusHistory.push(
    {
      status: "AI Processing",
      changedAt: updatedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: `AI reran the request workflow for reapplication cycle ${request.appealCount}.`
    },
    {
      status: "Waiting for Approval",
      changedAt: updatedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: `Rejected request reapplied as cycle ${request.appealCount}.`
    }
  );

  if (project) {
    project.status = "Waiting for Approval";
    project.updatedAt = updatedAt;
    project.decision = null;
    project.statusHistory.push({
      status: "Waiting for Approval",
      changedAt: updatedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: `Request application reapplied after rejection, cycle ${request.appealCount}.`
    });
  }

  saveSystemStore(store);
  return request;
}

export function decideRequestApplication(
  office: OfficeAccount,
  requestId: string,
  input: ProjectDecisionInput
) {
  if (office.role !== "HQ") {
    throw new Error("Only HQ can decide request applications.");
  }

  const store = getSystemStore();
  const request = store.requests.find((entry) => entry.id === requestId);

  if (!request) {
    throw new Error("Request application not found.");
  }

  const project = request.projectId
    ? store.projects.find((entry) => entry.id === request.projectId)
    : null;

  const updatedAt = nowIso();
  const decision: RequestDecision = {
    decision: input.decision,
    comments: input.comments?.trim() ?? "",
    decidedAt: updatedAt,
    decidedByOfficeId: office.id,
    decidedByOfficeName: office.officeName
  };

  request.status = input.decision;
  request.decision = decision;
  request.updatedAt = updatedAt;
  request.statusHistory.push({
    status: input.decision,
    changedAt: updatedAt,
    changedByOfficeId: office.id,
    changedByOfficeName: office.officeName,
    note:
      input.decision === "Approved"
        ? "HQ approved the request application."
        : "HQ rejected the request application and returned comments."
  });

  if (project) {
    project.status = input.decision;
    project.updatedAt = updatedAt;
    project.decision = {
      decision: input.decision,
      comments: decision.comments,
      decidedAt: decision.decidedAt,
      decidedByOfficeId: office.id,
      decidedByOfficeName: office.officeName
    };
    project.statusHistory.push({
      status: input.decision,
      changedAt: updatedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note:
        input.decision === "Approved"
          ? "HQ approved the project request application."
          : "HQ rejected the project request application."
    });
  }

  saveSystemStore(store);
  return request;
}

async function runRequestApprovalAi(args: {
  requestPrompt: string;
  recommendationPrompt: string;
  projectSubject: string;
  branchOfficeName: string;
  applicationText: string;
  attachments: AttachmentReference[];
  selectedDatabasePaths: string[];
  webSearchEnabled: boolean;
}) {
  const databaseSummaries = resolveDatabaseContextSummaries(args.selectedDatabasePaths);
  const combinedInput = buildAugmentedInput({
    unstructuredInput: args.applicationText,
    attachments: args.attachments,
    databaseSummaries,
    webSearchEnabled: args.webSearchEnabled
  });
  const attempts: WorkflowAttempt[] = [];
  let previousReport = "";
  let previousFeedback = "";
  let finalReport = "";
  let finalExtraction: WorkflowExtraction | null = null;
  let finalValidation = null;
  const requestWorkflow = buildRequestApprovalWorkflowConfig(args.requestPrompt);

  for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber += 1) {
    const report = await generateRequestReportAttempt({
      prompt: args.requestPrompt,
      projectSubject: args.projectSubject,
      branchOfficeName: args.branchOfficeName,
      applicationText: combinedInput,
      attemptNumber,
      previousReport,
      validatorFeedback: previousFeedback
    });
    const extraction = await generateWorkflowExtraction({
      workflow: requestWorkflow,
      report,
      unstructuredInput: combinedInput
    });
    const validation = await generateWorkflowValidation({
      workflow: requestWorkflow,
      extraction,
      unstructuredInput: combinedInput,
      attemptNumber
    });
    const attempt: WorkflowAttempt = {
      id: createId(),
      attemptNumber,
      report,
      extraction,
      validation,
      createdAt: nowIso()
    };

    attempts.push(attempt);
    finalReport = report;
    finalExtraction = extraction;
    finalValidation = validation;

    if (validation.result === "Pass") {
      break;
    }

    previousReport = report;
    previousFeedback = validation.retryInstruction;
  }

  if (!finalExtraction || !finalValidation || finalValidation.result !== "Pass") {
    throw new Error("Request application could not pass AI validation.");
  }

  const recommendation = await generateRequestRecommendation({
    prompt: args.recommendationPrompt,
    extraction: finalExtraction,
    report: finalReport,
    applicationText: combinedInput
  });

  return {
    attempts,
    finalReport,
    finalExtraction,
    finalValidation,
    recommendation,
    databaseSummaries
  };
}

export function submitProjectAppeal(
  office: OfficeAccount,
  projectId: string,
  input: AppealProjectInput
) {
  ensureBranchUser(office);
  const store = getSystemStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.branchOfficeId !== office.id) {
    throw new Error("Branch Office can only appeal its own projects.");
  }

  if (project.status !== "Rejected") {
    throw new Error("Only rejected projects can be appealed.");
  }

  const attachments = normalizeAttachments(input.attachments);
  const report = createProjectAiReport(office, { ...input, attachments });

  project.subject = input.subject.trim();
  project.applicantName = input.applicantName.trim();
  project.position = input.position.trim();
  project.email = sanitizeEmail(input.email);
  project.description = input.description.trim();
  project.attachments = attachments;
  project.report = report;
  project.status = "Waiting for Approval";
  project.lifecycleState = "Active";
  project.phases = [];
  project.updatedAt = report.submissionTime;
  project.decision = null;
  project.appealCount += 1;
  project.statusHistory.push(
    {
      status: "Submitted",
      changedAt: report.submissionTime,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: `Appeal submission ${project.appealCount} started.`
    },
    {
      status: "AI Processing",
      changedAt: report.submissionTime,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "AI regenerated the branch appeal report."
    },
    {
      status: "Waiting for Approval",
      changedAt: report.submissionTime,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "Appealed project returned to HQ approval queue."
    }
  );

  saveSystemStore(store);
  return project;
}

export function decideProject(
  office: OfficeAccount,
  projectId: string,
  input: ProjectDecisionInput
) {
  if (office.role !== "HQ") {
    throw new Error("Only HQ can approve or reject projects.");
  }

  const store = getSystemStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  const nextStatus = input.decision;
  project.status = nextStatus;
  project.updatedAt = nowIso();
  project.decision = {
    decision: input.decision,
    comments: input.comments?.trim() ?? "",
    decidedAt: project.updatedAt,
    decidedByOfficeId: office.id,
    decidedByOfficeName: office.officeName
  };
  project.statusHistory.push({
    status: nextStatus,
    changedAt: project.updatedAt,
    changedByOfficeId: office.id,
    changedByOfficeName: office.officeName,
    note:
      input.decision === "Approved"
        ? "HQ approved the project."
        : "HQ rejected the project and returned feedback."
  });

  saveSystemStore(store);
  return project;
}

export async function progressProjectPhase(
  office: OfficeAccount,
  projectId: string,
  input: ProgressProjectPhaseInput
) {
  const store = getSystemStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (office.role !== "HQ" && project.branchOfficeId !== office.id) {
    throw new Error("Only HQ or the related branch can update this project phase.");
  }

  if (project.status !== "Approved") {
    throw new Error("Only approved projects can progress to the next phase.");
  }

  if (project.lifecycleState === "Completed") {
    throw new Error("This project is already completed.");
  }

  const workflow = project.workflowId
    ? store.workflows.find((entry) => entry.id === project.workflowId)
    : null;

  if (!workflow) {
    throw new Error("This project is not linked to a workflow with phase prompts.");
  }

  const currentPhase = [...project.phases]
    .sort((left, right) => left.phaseNumber - right.phaseNumber)
    .find((phase) => phase.status === "Current");

  if (!currentPhase) {
    throw new Error("No active phase is available for this project.");
  }

  const normalizedInput = sanitizeText(input.unstructuredInput);
  const attachments = normalizeAttachments(input.attachments ?? []);
  const databasePaths = Array.from(
    new Set((input.selectedDatabasePaths ?? []).map((path) => sanitizeText(path)).filter(Boolean))
  );
  const databaseSummaries = resolveDatabaseContextSummaries(databasePaths);
  const combinedInput = buildAugmentedInput({
    unstructuredInput: normalizedInput,
    attachments,
    databaseSummaries,
    webSearchEnabled: store.systemConfig.enableWebSearch
  });

  if (!normalizedInput) {
    throw new Error("Phase outcome input is required.");
  }

  const run: WorkflowRunRecord = {
    id: createId(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    runKind: "Phase Progression",
    executedByOfficeId: office.id,
    executedByOfficeName: office.officeName,
    unstructuredInput: normalizedInput,
    attachments,
    attachedDatabasePaths: databasePaths,
    attachedDatabaseSummaries: databaseSummaries,
    webSearchEnabled: store.systemConfig.enableWebSearch,
    status: "Running",
    attempts: [],
    finalReport: "",
    finalExtraction: null,
    builderSummary: "",
    validatorFeedback: "",
    createdProjectIds: [],
    createdProjectTitles: [],
    relatedProjectId: project.id,
    relatedPhaseId: currentPhase.id,
    nextPhaseId: null,
    projectClosed: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null
  };

  let previousReport = "";
  let previousFeedback = "";

  for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber += 1) {
    const report = await generatePhaseProgressReportAttempt({
      workflow,
      office,
      previousPhase: currentPhase,
      unstructuredInput: combinedInput,
      attemptNumber,
      previousReport,
      validatorFeedback: previousFeedback
    });
    const extraction = await generateWorkflowExtraction({
      workflow,
      report,
      unstructuredInput: combinedInput
    });
    const validation = await generateWorkflowValidation({
      workflow,
      extraction,
      unstructuredInput: combinedInput,
      attemptNumber
    });
    const attempt: WorkflowAttempt = {
      id: createId(),
      attemptNumber,
      report,
      extraction,
      validation,
      createdAt: nowIso()
    };

    run.attempts.push(attempt);
    run.finalReport = report;
    run.finalExtraction = extraction;
    run.validatorFeedback = validation.summary;
    run.updatedAt = nowIso();

    if (validation.result === "Pass") {
      const phaseBuilder = await generateNextPhaseFromOutcome({
        workflow,
        previousPhase: currentPhase,
        extraction,
        report,
        outcomeInput: combinedInput
      });
      const completedAt = nowIso();

      currentPhase.status = "Completed";
      currentPhase.completionInput = normalizedInput;
      currentPhase.completionAttachments = attachments;
      currentPhase.completionDatabasePaths = databasePaths;
      currentPhase.completionReport = report;
      currentPhase.validationSummary = validation.summary;
      currentPhase.completedAt = completedAt;

      run.status = "Completed";
      run.builderSummary = phaseBuilder.summary;
      run.completedAt = completedAt;
      run.updatedAt = completedAt;

      if (phaseBuilder.closeSignal) {
        run.projectClosed = true;
        project.lifecycleState = "Completed";
        project.statusHistory.push({
          status: "Approved",
          changedAt: completedAt,
          changedByOfficeId: office.id,
          changedByOfficeName: office.officeName,
          note: `Project marked completed after ${currentPhase.title}.`
        });
      } else if (phaseBuilder.nextPhase) {
        const nextPhase: ProjectPhaseRecord = {
          id: createId(),
          phaseNumber: currentPhase.phaseNumber + 1,
          title: phaseBuilder.nextPhase.title,
          objective: phaseBuilder.nextPhase.objective,
          actionablePlans: phaseBuilder.nextPhase.actionablePlans,
          expectedOutcome: phaseBuilder.nextPhase.expectedOutcome,
          status: "Current",
          sourceRunId: run.id,
          completionInput: null,
          completionAttachments: [],
          completionDatabasePaths: [],
          completionReport: null,
          validationSummary: null,
          completedAt: null,
          createdAt: completedAt
        };

        run.nextPhaseId = nextPhase.id;
        project.phases.push(nextPhase);
        project.statusHistory.push({
          status: "Approved",
          changedAt: completedAt,
          changedByOfficeId: office.id,
          changedByOfficeName: office.officeName,
          note: `${nextPhase.title} was generated after validating the previous phase outcome.`
        });
      }

      break;
    }

    previousReport = report;
    previousFeedback = validation.retryInstruction;
  }

  if (run.status !== "Completed") {
    run.status = "Failed";
    run.builderSummary = "Phase builder did not run because validation never passed.";
    run.completedAt = nowIso();
    run.updatedAt = run.completedAt;
  }

  project.updatedAt = nowIso();
  workflow.updatedAt = nowIso();
  workflow.lastRunAt = run.updatedAt;
  store.workflowRuns.unshift(run);
  recomputeWorkflowMetrics(store);
  saveSystemStore(store);

  return project;
}

function recomputeOverallInsight(store: ReturnType<typeof getSystemStore>) {
  const hqOffice = store.offices.find((office) => office.role === "HQ");

  if (!hqOffice) {
    return;
  }

  const branchOffices = store.offices.filter((office) => office.role === "Branch Office");
  const branchInsights = store.planInsights.filter((insight) => insight.scope === "branch");
  const nextOverall = createOverallInsight(
    hqOffice,
    branchOffices,
    branchInsights,
    store.projects.length,
    store.issues.length
  );

  store.planInsights = [
    nextOverall,
    ...store.planInsights.filter((insight) => insight.scope !== "overall")
  ];
}

export function listPlanInsights(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    const overall = store.planInsights.find((insight) => insight.scope === "overall") ?? null;
    const branches = store.planInsights
      .filter((insight) => insight.scope === "branch")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      overall,
      branches,
      submissions: [...store.planSubmissions]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 10)
    };
  }

  return {
    overall: null,
    branches: store.planInsights
      .filter((insight) => insight.scope === "branch" && insight.officeId === office.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    submissions: store.planSubmissions
      .filter((submission) => submission.officeId === office.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 10)
  };
}

export function createPlanSubmission(
  office: OfficeAccount,
  input: CreatePlanSubmissionInput
) {
  const store = getSystemStore();
  const uploads = normalizeAttachments(input.uploads);
  const submission = {
    id: createId(),
    officeId: office.id,
    officeName: office.officeName,
    role: office.role,
    title: input.title.trim(),
    notes: input.notes.trim(),
    uploads,
    createdAt: nowIso()
  };

  store.planSubmissions.unshift(submission);

  const branchProjectCount = store.projects.filter((project) => project.branchOfficeId === office.id).length;
  const issueCount = store.issues.filter(
    (issue) => issue.branchOfficeId === office.id || issue.targetOfficeId === office.id
  ).length;
  const branchInsight = createPlanInsight(office, { ...input, uploads }, {
    overallProjectCount: store.projects.length,
    branchProjectCount,
    issueCount
  });

  store.planInsights = [
    branchInsight,
    ...store.planInsights.filter(
      (insight) => !(insight.scope === "branch" && insight.officeId === office.id)
    )
  ];

  recomputeOverallInsight(store);
  saveSystemStore(store);

  return branchInsight;
}

export function listIssues(office: OfficeAccount) {
  return [...filterIssuesForOffice(office)].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function getIssueForOffice(office: OfficeAccount, issueId: string) {
  const issue = filterIssuesForOffice(office).find((entry) => entry.id === issueId);

  if (!issue) {
    throw new Error("Issue thread not found.");
  }

  return issue;
}

export function createIssue(office: OfficeAccount, input: CreateIssueInput) {
  const store = getSystemStore();
  const targetOffice =
    office.role === "HQ"
      ? getOfficeById(input.targetOfficeId ?? "")
      : store.offices.find((entry) => entry.role === "HQ");

  if (!targetOffice) {
    throw new Error("Target office could not be resolved.");
  }

  if (office.role === "HQ" && targetOffice.role !== "Branch Office") {
    throw new Error("HQ issues must target a Branch Office.");
  }

  if (office.role === "Branch Office" && targetOffice.role !== "HQ") {
    throw new Error("Branch issues must target HQ.");
  }

  const aiOutput = createIssueInsight(office, targetOffice, input);
  const createdAt = nowIso();
  const issue: IssueThread = {
    id: createId(),
    subject: input.subject.trim(),
    urgency: input.urgency,
    branchOfficeId: office.role === "Branch Office" ? office.id : targetOffice.id,
    branchOfficeName: office.role === "Branch Office" ? office.officeName : targetOffice.officeName,
    targetOfficeId: targetOffice.id,
    targetOfficeName: targetOffice.officeName,
    createdByOfficeId: office.id,
    createdByOfficeName: office.officeName,
    status: "Open",
    aiOutput,
    unreadByOfficeIds: [targetOffice.id],
    messages: [
      {
        id: createId(),
        senderOfficeId: office.id,
        senderOfficeName: office.officeName,
        senderRole: office.role,
        message: input.message.trim(),
        createdAt
      }
    ],
    createdAt,
    updatedAt: createdAt
  };

  store.issues.unshift(issue);
  recomputeOverallInsight(store);
  saveSystemStore(store);

  return issue;
}

export function replyToIssue(
  office: OfficeAccount,
  issueId: string,
  input: ReplyIssueInput
) {
  const store = getSystemStore();
  const issue = store.issues.find((entry) => entry.id === issueId);

  if (!issue) {
    throw new Error("Issue thread not found.");
  }

  if (office.role !== "HQ" && issue.branchOfficeId !== office.id && issue.targetOfficeId !== office.id) {
    throw new Error("Branch Office can only reply to its own issue threads.");
  }

  const counterpartOfficeIds = [issue.branchOfficeId, issue.targetOfficeId].filter(
    (officeId) => officeId !== office.id
  );

  issue.messages.push({
    id: createId(),
    senderOfficeId: office.id,
    senderOfficeName: office.officeName,
    senderRole: office.role,
    message: input.message.trim(),
    createdAt: nowIso()
  });
  issue.updatedAt = nowIso();
  issue.status = input.resolve ? "Resolved" : office.role === "HQ" ? "Responded" : "Open";
  issue.unreadByOfficeIds = counterpartOfficeIds;
  saveSystemStore(store);
  return issue;
}

export function markIssueAsRead(office: OfficeAccount, issueId: string) {
  const store = getSystemStore();
  const issue = store.issues.find((entry) => entry.id === issueId);

  if (!issue) {
    throw new Error("Issue thread not found.");
  }

  if (office.role !== "HQ" && issue.branchOfficeId !== office.id && issue.targetOfficeId !== office.id) {
    throw new Error("Branch Office can only access its own issue threads.");
  }

  issue.unreadByOfficeIds = issue.unreadByOfficeIds.filter((officeId) => officeId !== office.id);
  saveSystemStore(store);
  return issue;
}

export function updateOfficeProfile(office: OfficeAccount, input: UpdateOfficeInput) {
  const store = getSystemStore();
  const persistedOffice = store.offices.find((entry) => entry.id === office.id);

  if (!persistedOffice) {
    throw new Error("Office account not found.");
  }

  persistedOffice.location = input.location.trim();
  persistedOffice.address = input.address.trim();
  persistedOffice.personInChargeName = input.personInChargeName.trim();
  persistedOffice.name = persistedOffice.personInChargeName;
  persistedOffice.position = input.position.trim();
  persistedOffice.email = sanitizeEmail(input.email);
  persistedOffice.contactNumber = input.contactNumber.trim();
  persistedOffice.updatedAt = nowIso();
  saveSystemStore(store);
  return persistedOffice;
}

export function clearOfficeData(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    store.workflows = [];
    store.workflowRuns = [];
    store.projects = [];
    store.requests = [];
    store.issues = [];
    store.planSubmissions = [];
    store.planInsights = [];
    recomputeWorkflowMetrics(store);
    saveSystemStore(store);
    return;
  }

  store.workflows = store.workflows.filter((workflow) => workflow.createdByOfficeId !== office.id);
  store.workflowRuns = store.workflowRuns.filter((run) => run.executedByOfficeId !== office.id);
  store.projects = store.projects.filter((project) => project.branchOfficeId !== office.id);
  store.requests = store.requests.filter((request) => request.branchOfficeId !== office.id);
  store.issues = store.issues.filter(
    (issue) => issue.branchOfficeId !== office.id && issue.targetOfficeId !== office.id
  );
  store.planSubmissions = store.planSubmissions.filter((submission) => submission.officeId !== office.id);
  store.planInsights = store.planInsights.filter((insight) => insight.officeId !== office.id);
  recomputeWorkflowMetrics(store);
  recomputeOverallInsight(store);
  saveSystemStore(store);
}

export function listBranchOffices() {
  return getSystemStore().offices
    .filter((office) => office.role === "Branch Office")
    .sort((left, right) => left.officeName.localeCompare(right.officeName));
}

export function getCompanyDatabase(): DatabasePayload {
  const store = getSystemStore();
  const hqOffice = store.offices.find((office) => office.role === "HQ");

  return {
    company: {
      ...store.companyDatabase,
      generalInfo: {
        companyName:
          store.companyDatabase.generalInfo.companyName ||
          hqOffice?.officeName ||
          "Unconfigured company",
        workingField: store.companyDatabase.generalInfo.workingField,
        overview: store.companyDatabase.generalInfo.overview
      }
    }
  };
}

function findCustomDatabaseNode(nodes: CustomDatabaseNode[], nodeId: string): CustomDatabaseNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    const child = findCustomDatabaseNode(node.children, nodeId);

    if (child) {
      return child;
    }
  }

  return null;
}

export function addCustomDatabaseNode(input: CreateCustomDatabaseNodeInput): DatabasePayload {
  const store = getSystemStore();
  const label = sanitizeText(input.label);
  const value = sanitizeText(input.value ?? "");

  if (!label) {
    throw new Error("Database field name is required.");
  }

  const timestamp = nowIso();
  const node = {
    id: createId(),
    label,
    value,
    children: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (input.parentId) {
    const parent = findCustomDatabaseNode(store.companyDatabase.customTree, input.parentId);

    if (!parent) {
      throw new Error("Parent database branch was not found.");
    }

    parent.children.push(node);
    parent.updatedAt = timestamp;
  } else {
    store.companyDatabase.customTree.push(node);
  }

  saveSystemStore(store);
  return getCompanyDatabase();
}

export function updateCustomDatabaseNode(input: UpdateCustomDatabaseNodeInput): DatabasePayload {
  const store = getSystemStore();
  const label = sanitizeText(input.label);
  const value = sanitizeText(input.value);

  if (!label) {
    throw new Error("Database field name is required.");
  }

  const node = findCustomDatabaseNode(store.companyDatabase.customTree, input.id);

  if (!node) {
    throw new Error("Database field was not found.");
  }

  node.label = label;
  node.value = value;
  node.updatedAt = nowIso();
  saveSystemStore(store);

  return getCompanyDatabase();
}

export function getSystemSettings(): SystemSettingsPayload {
  const store = getSystemStore();

  return {
    aiConfig: {
      apiUrl: store.systemConfig.apiUrl,
      apiKey: store.systemConfig.apiKey,
      enableWebSearch: store.systemConfig.enableWebSearch
    },
    database: getSystemDatabaseInfo()
  };
}

export function updateSystemAiConfig(office: OfficeAccount, input: UpdateSystemAiConfigInput) {
  if (office.role !== "HQ") {
    throw new Error("Only HQ can update the system AI configuration.");
  }

  const store = getSystemStore();
  store.systemConfig = {
    apiUrl: input.apiUrl.trim(),
    apiKey: input.apiKey.trim(),
    enableWebSearch: input.enableWebSearch
  };
  saveSystemStore(store);

  return getSystemSettings();
}
