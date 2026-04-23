import { createId } from "@/src/utils/id";
import { nowIso } from "@/src/utils/date";
import {
  createIssueInsight,
  createOverallInsight,
  createPlanInsight,
  createProjectAiReport
} from "@/src/services/system-ai";
import { getSystemStore } from "@/src/services/system-store";
import type {
  AppealProjectInput,
  AttachmentReference,
  CreateIssueInput,
  CreateOfficeInput,
  CreatePlanSubmissionInput,
  CreateProjectInput,
  DashboardPayload,
  IssueThread,
  OfficeAccount,
  OfficeRole,
  PlanInsight,
  ProjectDecisionInput,
  ProjectRecord,
  ReplyIssueInput,
  SystemSession,
  UpdateOfficeInput,
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
  return {
    hqExists: store.offices.some((office) => office.role === "HQ"),
    accountCount: store.offices.length
  };
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
      status: "Waiting for Approval" as const,
      changedAt: reportGeneratedAt,
      changedByOfficeId: office.id,
      changedByOfficeName: office.officeName,
      note: "Report sent to HQ for final decision."
    }
  ];
}

function ensureBranchUser(office: OfficeAccount) {
  if (!isBranchOffice(office)) {
    throw new Error("Only a Branch Office can perform this action.");
  }
}

function filterProjectsForOffice(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    return store.projects;
  }

  return store.projects.filter((project) => project.branchOfficeId === office.id);
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
    createdAt: report.submissionTime,
    updatedAt: report.submissionTime,
    appealCount: 0,
    attachments,
    status: "Waiting for Approval",
    report,
    decision: null,
    statusHistory: buildProjectStatusHistory(office, report.submissionTime)
  };

  store.projects.unshift(project);
  return project;
}

export function submitProjectAppeal(
  office: OfficeAccount,
  projectId: string,
  input: AppealProjectInput
) {
  ensureBranchUser(office);
  const project = getProjectForOffice(projectId, office);

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

  const project = getSystemStore().projects.find((entry) => entry.id === projectId);

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

  return project;
}

function recomputeOverallInsight() {
  const store = getSystemStore();
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

  recomputeOverallInsight();

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
  recomputeOverallInsight();

  return issue;
}

export function replyToIssue(
  office: OfficeAccount,
  issueId: string,
  input: ReplyIssueInput
) {
  const issue = getIssueForOffice(office, issueId);
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
  return issue;
}

export function markIssueAsRead(office: OfficeAccount, issueId: string) {
  const issue = getIssueForOffice(office, issueId);
  issue.unreadByOfficeIds = issue.unreadByOfficeIds.filter((officeId) => officeId !== office.id);
  return issue;
}

export function updateOfficeProfile(office: OfficeAccount, input: UpdateOfficeInput) {
  office.location = input.location.trim();
  office.address = input.address.trim();
  office.personInChargeName = input.personInChargeName.trim();
  office.name = office.personInChargeName;
  office.position = input.position.trim();
  office.email = sanitizeEmail(input.email);
  office.contactNumber = input.contactNumber.trim();
  office.updatedAt = nowIso();
  return office;
}

export function clearOfficeData(office: OfficeAccount) {
  const store = getSystemStore();

  if (office.role === "HQ") {
    store.projects = [];
    store.issues = [];
    store.planSubmissions = [];
    store.planInsights = [];
    return;
  }

  store.projects = store.projects.filter((project) => project.branchOfficeId !== office.id);
  store.issues = store.issues.filter(
    (issue) => issue.branchOfficeId !== office.id && issue.targetOfficeId !== office.id
  );
  store.planSubmissions = store.planSubmissions.filter((submission) => submission.officeId !== office.id);
  store.planInsights = store.planInsights.filter((insight) => insight.officeId !== office.id);
  recomputeOverallInsight();
}

export function listBranchOffices() {
  return getSystemStore().offices
    .filter((office) => office.role === "Branch Office")
    .sort((left, right) => left.officeName.localeCompare(right.officeName));
}
