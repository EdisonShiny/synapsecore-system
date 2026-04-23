export type OfficeRole = "HQ" | "Branch Office";

export type WorkflowStatus =
  | "Submitted"
  | "AI Processing"
  | "Waiting for Approval"
  | "Approved"
  | "Rejected";

export type IssueStatus = "Open" | "Responded" | "Resolved";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type EvidenceSource = "External" | "Internal" | "Operational";

export type AttachmentReference = {
  id: string;
  name: string;
  type: string;
  size: number;
  extension: string;
};

export type AiWorkflowStep = {
  title: string;
  detail: string;
};

export type AiEvidence = {
  label: string;
  detail: string;
  source: EvidenceSource;
};

export type AiInsight = {
  id: string;
  generatedAt: string;
  directResult: string;
  finalConclusion: string;
  advice: string;
  workflow: AiWorkflowStep[];
  evidence: AiEvidence[];
};

export type OfficeAccount = {
  id: string;
  name?: string;
  officeName: string;
  role: OfficeRole;
  branch_id?: string | null;
  location: string;
  address: string;
  email: string;
  personInChargeName: string;
  position: string;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type SystemSession = {
  token: string;
  user: OfficeAccount;
};

export type ProjectDecision = {
  decision: "Approved" | "Rejected";
  comments: string;
  decidedAt: string;
  decidedByOfficeId: string;
  decidedByOfficeName: string;
};

export type StatusHistoryEntry = {
  status: WorkflowStatus;
  changedAt: string;
  changedByOfficeId: string;
  changedByOfficeName: string;
  note: string;
};

export type ProjectReport = {
  id: string;
  branchOfficeName: string;
  submissionTime: string;
  projectDescription: string;
  applicantInformation: {
    applicantName: string;
    position: string;
    email: string;
  };
  resourceLinks: string[];
  aiAdvice: string;
  aiOutput: AiInsight;
};

export type ProjectRecord = {
  id: string;
  subject: string;
  applicantName: string;
  position: string;
  email: string;
  description: string;
  branchOfficeId: string;
  branchOfficeName: string;
  createdByOfficeId: string;
  createdAt: string;
  updatedAt: string;
  appealCount: number;
  attachments: AttachmentReference[];
  status: WorkflowStatus;
  report: ProjectReport;
  decision: ProjectDecision | null;
  statusHistory: StatusHistoryEntry[];
};

export type IssueMessage = {
  id: string;
  senderOfficeId: string;
  senderOfficeName: string;
  senderRole: OfficeRole;
  message: string;
  createdAt: string;
};

export type IssueThread = {
  id: string;
  subject: string;
  urgency: Severity;
  branchOfficeId: string;
  branchOfficeName: string;
  targetOfficeId: string;
  targetOfficeName: string;
  createdByOfficeId: string;
  createdByOfficeName: string;
  status: IssueStatus;
  aiOutput: AiInsight;
  unreadByOfficeIds: string[];
  messages: IssueMessage[];
  createdAt: string;
  updatedAt: string;
};

export type PlanDatasetSubmission = {
  id: string;
  officeId: string;
  officeName: string;
  role: OfficeRole;
  title: string;
  notes: string;
  uploads: AttachmentReference[];
  createdAt: string;
};

export type PlanInsight = {
  id: string;
  scope: "overall" | "branch";
  officeId: string | null;
  officeName: string;
  demandConclusion: string;
  financialConclusion: string;
  riskConclusion: string;
  uploadedSources: AttachmentReference[];
  externalSignals: string[];
  aiOutput: AiInsight;
  createdAt: string;
};

export type DashboardPayload = {
  role: OfficeRole;
  office: OfficeAccount;
  counts: Record<WorkflowStatus, number>;
  unreadIssues: number;
  projectTotal: number;
  branchCount: number;
  latestProjects: ProjectRecord[];
  latestIssues: IssueThread[];
  latestPlanInsights: PlanInsight[];
};

export type CreateOfficeInput = {
  officeName: string;
  role: OfficeRole;
  location: string;
  address: string;
  email: string;
  personInChargeName: string;
  position: string;
  contactNumber?: string;
};

export type CreateProjectInput = {
  subject: string;
  applicantName: string;
  position: string;
  email: string;
  description: string;
  attachments: AttachmentReference[];
};

export type AppealProjectInput = CreateProjectInput;

export type ProjectDecisionInput = {
  decision: "Approved" | "Rejected";
  comments?: string;
};

export type CreateIssueInput = {
  subject: string;
  urgency: Severity;
  message: string;
  targetOfficeId?: string;
};

export type ReplyIssueInput = {
  message: string;
  resolve?: boolean;
};

export type CreatePlanSubmissionInput = {
  title: string;
  notes: string;
  uploads: AttachmentReference[];
};

export type UpdateOfficeInput = {
  location: string;
  address: string;
  personInChargeName: string;
  position: string;
  email: string;
  contactNumber: string;
};
