export type OfficeRole = "HQ" | "Branch Office";

export type WorkflowStatus =
  | "Submitted"
  | "AI Processing"
  | "Waiting for Approval"
  | "Approved"
  | "Rejected";

export type WorkflowRunStatus = "Running" | "Completed" | "Failed";

export type ValidationResultStatus = "Pass" | "Fail";

export type ProjectLifecycleState = "Active" | "Completed";

export type ProjectPhaseStatus = "Current" | "Completed";

export type RequestApplicationStatus = "Waiting for Approval" | "Approved" | "Rejected";

export type RequestRecommendation = "Approve" | "Reject";

export type IssueStatus = "Open" | "Responded" | "Resolved";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type EvidenceSource = "External" | "Internal" | "Operational";

export type SystemAiConfig = {
  apiUrl: string;
  apiKey: string;
  enableWebSearch: boolean;
};

export type RequestPromptConfig = {
  requestAnalysisPrompt: string;
  requestRecommendationPrompt: string;
};

export type SystemDatabaseInfo = {
  engine: "file-json";
  path: string;
};

export type SystemAiHealthStatus =
  | "checking"
  | "live-ready"
  | "fallback-active"
  | "missing-config";

export type SystemAiHealthPayload = {
  status: SystemAiHealthStatus;
  summary: string;
  detail: string;
  testedAt: string | null;
  configured: boolean;
  model: string | null;
};

export type AttachmentReference = {
  id: string;
  name: string;
  type: string;
  size: number;
  extension: string;
  contentText?: string;
  contentStatus?: "inline-text" | "metadata-only" | "too-large" | "unsupported";
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

export type WorkflowPromptConfig = {
  reportPrompt: string;
  extractorPrompt: string;
  validatorPrompt: string;
  projectBuilderPrompt: string;
  phaseProgressPrompt: string;
  phaseBuilderPrompt: string;
};

export type WorkflowRecord = {
  id: string;
  name: string;
  description: string;
  createdByOfficeId: string;
  createdByOfficeName: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  runCount: number;
  projectCount: number;
  config: WorkflowPromptConfig;
};

export type WorkflowValidationFeedback = {
  result: ValidationResultStatus;
  summary: string;
  retryInstruction: string;
  confidenceScore: number;
};

export type WorkflowExtraction = {
  headline: string;
  items: string[];
  confidenceScore: number;
};

export type WorkflowProjectCandidate = {
  title: string;
  summary: string;
  rationale: string;
  priority: Severity;
  confidenceScore: number;
  actionablePlans: string[];
  expectedOutcome: string;
};

export type WorkflowAttempt = {
  id: string;
  attemptNumber: number;
  report: string;
  extraction: WorkflowExtraction;
  validation: WorkflowValidationFeedback;
  createdAt: string;
};

export type WorkflowRunRecord = {
  id: string;
  workflowId: string;
  workflowName: string;
  runKind: "Intake" | "Phase Progression";
  executedByOfficeId: string;
  executedByOfficeName: string;
  unstructuredInput: string;
  attachments: AttachmentReference[];
  attachedDatabasePaths: string[];
  attachedDatabaseSummaries: string[];
  webSearchEnabled: boolean;
  status: WorkflowRunStatus;
  attempts: WorkflowAttempt[];
  finalReport: string;
  finalExtraction: WorkflowExtraction | null;
  builderSummary: string;
  validatorFeedback: string;
  createdProjectIds: string[];
  createdProjectTitles: string[];
  relatedProjectId: string | null;
  relatedPhaseId: string | null;
  nextPhaseId: string | null;
  projectClosed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type RequestAiRecommendation = {
  recommendation: RequestRecommendation;
  reason: string;
  confidenceScore: number;
};

export type RequestDecision = {
  decision: "Approved" | "Rejected";
  comments: string;
  decidedAt: string;
  decidedByOfficeId: string;
  decidedByOfficeName: string;
};

export type RequestStatusHistoryEntry = {
  status: WorkflowStatus;
  changedAt: string;
  changedByOfficeId: string;
  changedByOfficeName: string;
  note: string;
};

export type RequestApplicationRecord = {
  id: string;
  projectId: string | null;
  projectSubject: string;
  workflowId: string | null;
  workflowName: string | null;
  branchOfficeId: string;
  branchOfficeName: string;
  createdByOfficeId: string;
  createdByOfficeName: string;
  applicationText: string;
  attachments: AttachmentReference[];
  selectedDatabasePaths: string[];
  selectedDatabaseSummaries: string[];
  attempts: WorkflowAttempt[];
  finalReport: string;
  finalExtraction: WorkflowExtraction | null;
  validation: WorkflowValidationFeedback | null;
  recommendation: RequestAiRecommendation | null;
  status: RequestApplicationStatus;
  appealCount: number;
  webSearchEnabled: boolean;
  decision: RequestDecision | null;
  statusHistory: RequestStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectPhaseRecord = {
  id: string;
  phaseNumber: number;
  title: string;
  objective: string;
  actionablePlans: string[];
  expectedOutcome: string;
  status: ProjectPhaseStatus;
  sourceRunId: string | null;
  completionInput: string | null;
  completionAttachments: AttachmentReference[];
  completionDatabasePaths: string[];
  completionReport: string | null;
  validationSummary: string | null;
  completedAt: string | null;
  createdAt: string;
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

export type DemoAccountSummary = Pick<
  OfficeAccount,
  "id" | "officeName" | "role" | "email" | "personInChargeName" | "location"
>;

export type PublicAuthStatus = {
  hqExists: boolean;
  accountCount: number;
  accounts: DemoAccountSummary[];
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
  workflowId: string | null;
  workflowName: string | null;
  workflowRunId: string | null;
  createdAt: string;
  updatedAt: string;
  appealCount: number;
  attachments: AttachmentReference[];
  status: WorkflowStatus;
  lifecycleState: ProjectLifecycleState;
  phases: ProjectPhaseRecord[];
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

export type NumericDatabaseRecord = {
  period: string;
  value: number;
  note: string;
};

export type SalesDatabaseRecord = {
  period: string;
  sales: number;
  profit: number;
  note: string;
};

export type CompanyGeneralInfo = {
  companyName: string;
  workingField: string;
  overview: string;
};

export type CompanyDatabase = {
  generalInfo: CompanyGeneralInfo;
  inventoryRecords: {
    monthly: NumericDatabaseRecord[];
    yearly: NumericDatabaseRecord[];
  };
  salesReports: {
    monthly: SalesDatabaseRecord[];
    yearly: SalesDatabaseRecord[];
  };
  procurementRecords: {
    monthly: NumericDatabaseRecord[];
    yearly: NumericDatabaseRecord[];
  };
};

export type WorkflowDetailPayload = {
  workflow: WorkflowRecord;
  runs: WorkflowRunRecord[];
  recentProjects: ProjectRecord[];
};

export type RequestsPayload = {
  requests: RequestApplicationRecord[];
  availableProjects: ProjectRecord[];
  config: RequestPromptConfig;
};

export type SystemSettingsPayload = {
  aiConfig: SystemAiConfig;
  database: SystemDatabaseInfo;
};

export type DatabasePayload = {
  company: CompanyDatabase;
};

export type DatabaseAttachmentOption = {
  path: string;
  label: string;
  description: string;
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

export type UpdateSystemAiConfigInput = SystemAiConfig;

export type UpdateRequestPromptConfigInput = RequestPromptConfig;

export type CreateWorkflowInput = {
  name: string;
  description: string;
  config: WorkflowPromptConfig;
};

export type UpdateWorkflowInput = CreateWorkflowInput;

export type ExecuteWorkflowInput = {
  unstructuredInput: string;
  attachments: AttachmentReference[];
  selectedDatabasePaths: string[];
};

export type ProgressProjectPhaseInput = {
  unstructuredInput: string;
  attachments: AttachmentReference[];
  selectedDatabasePaths: string[];
};

export type CreateRequestApplicationInput = {
  projectId?: string;
  projectTitle?: string;
  applicationText: string;
  attachments: AttachmentReference[];
  selectedDatabasePaths: string[];
};

export type ReapplyRequestApplicationInput = {
  applicationText: string;
  attachments: AttachmentReference[];
  selectedDatabasePaths: string[];
};
