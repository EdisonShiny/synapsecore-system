import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  CompanyDatabase,
  IssueThread,
  OfficeAccount,
  PlanDatasetSubmission,
  PlanInsight,
  ProjectPhaseRecord,
  RequestApplicationRecord,
  RequestPromptConfig,
  WorkflowRecord,
  WorkflowRunRecord,
  ProjectRecord,
  SystemAiConfig,
  SystemDatabaseInfo
} from "@/types/system";

export type SystemDatabase = {
  offices: OfficeAccount[];
  workflows: WorkflowRecord[];
  workflowRuns: WorkflowRunRecord[];
  projects: ProjectRecord[];
  requests: RequestApplicationRecord[];
  issues: IssueThread[];
  planSubmissions: PlanDatasetSubmission[];
  planInsights: PlanInsight[];
  companyDatabase: CompanyDatabase;
  requestConfig: RequestPromptConfig;
  systemConfig: SystemAiConfig;
};

const systemDatabasePath = path.join(process.cwd(), "data", "system-database.json");

function createEmptyStore(): SystemDatabase {
  return {
    offices: [],
    workflows: [],
    workflowRuns: [],
    projects: [],
    requests: [],
    issues: [],
    planSubmissions: [],
    planInsights: [],
    companyDatabase: {
      generalInfo: {
        companyName: "Synapse Capacitor Technologies",
        workingField: "Capacitor manufacturing for consumer electronics, power systems, and industrial applications.",
        overview:
          "The company manufactures aluminum electrolytic, ceramic, and film capacitors, with branch operations supporting production planning, inventory control, and sales distribution."
      },
      inventoryRecords: {
        monthly: [
          { period: "2026-01", value: 118000, note: "Raw material rolls and dielectric stock on hand." },
          { period: "2026-02", value: 112500, note: "Higher ceramic powder consumption during OEM ramp-up." },
          { period: "2026-03", value: 121300, note: "Recovered inventory after supplier catch-up." }
        ],
        yearly: [
          { period: "2024", value: 1320000, note: "Average annual finished-goods inventory units." },
          { period: "2025", value: 1455000, note: "Expanded stock for automotive capacitor line." }
        ]
      },
      salesReports: {
        monthly: [
          { period: "2026-01", sales: 2480000, profit: 462000, note: "Consumer electronics segment remained strongest." },
          { period: "2026-02", sales: 2615000, profit: 489000, note: "Industrial capacitor contracts improved margins." },
          { period: "2026-03", sales: 2790000, profit: 521000, note: "Automotive replenishment orders increased." }
        ],
        yearly: [
          { period: "2024", sales: 28700000, profit: 5340000, note: "Stable export demand across Southeast Asia." },
          { period: "2025", sales: 31450000, profit: 6015000, note: "Improved yield and new OEM accounts." }
        ]
      },
      procurementRecords: {
        monthly: [
          { period: "2026-01", value: 1560000, note: "Foil, electrolyte, ceramic powder, and packaging purchases." },
          { period: "2026-02", value: 1635000, note: "Extra procurement to secure high-voltage component supply." },
          { period: "2026-03", value: 1582000, note: "Normalized purchasing after delayed supplier shipments cleared." }
        ],
        yearly: [
          { period: "2024", value: 18300000, note: "Procurement for standard consumer-grade capacitor lines." },
          { period: "2025", value: 19750000, note: "Higher specialty material spend for automotive and industrial lines." }
        ]
      }
    },
    requestConfig: {
      requestAnalysisPrompt:
        "You are the request-intake analyst for a capacitor manufacturing company. Read the request application, unstructured support inputs, attached files, and selected structured company data. Write a factual report focused on the requested approval scope, operational need, evidence quality, impact, urgency, and delivery constraints.",
      requestRecommendationPrompt:
        "You are the approval recommendation model for a capacitor manufacturing company. Use the validated extracted information to recommend approve or reject. Give a clear reason, call out the main business and operational considerations, and avoid unsupported assumptions."
    },
    systemConfig: {
      apiUrl: "",
      apiKey: "",
      enableWebSearch: true
    }
  };
}

function normalizePhase(phase: Partial<ProjectPhaseRecord>, index: number): ProjectPhaseRecord {
  return {
    id: phase.id ?? `phase-${index + 1}`,
    phaseNumber: phase.phaseNumber ?? index + 1,
    title: phase.title ?? `Phase ${index + 1}`,
    objective: phase.objective ?? "",
    actionablePlans: Array.isArray(phase.actionablePlans) ? phase.actionablePlans : [],
    expectedOutcome: phase.expectedOutcome ?? "",
    status: phase.status === "Completed" ? "Completed" : "Current",
    sourceRunId: phase.sourceRunId ?? null,
    completionInput: phase.completionInput ?? null,
    completionAttachments: Array.isArray(phase.completionAttachments) ? phase.completionAttachments : [],
    completionDatabasePaths: Array.isArray(phase.completionDatabasePaths) ? phase.completionDatabasePaths : [],
    completionReport: phase.completionReport ?? null,
    validationSummary: phase.validationSummary ?? null,
    completedAt: phase.completedAt ?? null,
    createdAt: phase.createdAt ?? ""
  };
}

function normalizeProject(project: Partial<ProjectRecord>, index: number): ProjectRecord {
  const phases = Array.isArray(project.phases)
    ? project.phases.map((phase, phaseIndex) => normalizePhase(phase, phaseIndex))
    : [];

  return {
    id: project.id ?? `project-${index + 1}`,
    subject: project.subject ?? "Untitled project",
    applicantName: project.applicantName ?? "",
    position: project.position ?? "",
    email: project.email ?? "",
    description: project.description ?? "",
    branchOfficeId: project.branchOfficeId ?? "",
    branchOfficeName: project.branchOfficeName ?? "",
    createdByOfficeId: project.createdByOfficeId ?? "",
    workflowId: project.workflowId ?? null,
    workflowName: project.workflowName ?? null,
    workflowRunId: project.workflowRunId ?? null,
    createdAt: project.createdAt ?? "",
    updatedAt: project.updatedAt ?? project.createdAt ?? "",
    appealCount: project.appealCount ?? 0,
    attachments: Array.isArray(project.attachments) ? project.attachments : [],
    status: project.status ?? "Waiting for Approval",
    lifecycleState: project.lifecycleState === "Completed" ? "Completed" : "Active",
    phases,
    report: project.report as ProjectRecord["report"],
    decision: project.decision ?? null,
    statusHistory: Array.isArray(project.statusHistory) ? project.statusHistory : []
  };
}

function normalizeWorkflow(workflow: Partial<WorkflowRecord>, index: number): WorkflowRecord {
  return {
    id: workflow.id ?? `workflow-${index + 1}`,
    name: workflow.name ?? `Workflow ${index + 1}`,
    description: workflow.description ?? "",
    createdByOfficeId: workflow.createdByOfficeId ?? "",
    createdByOfficeName: workflow.createdByOfficeName ?? "",
    createdAt: workflow.createdAt ?? "",
    updatedAt: workflow.updatedAt ?? workflow.createdAt ?? "",
    lastRunAt: workflow.lastRunAt ?? null,
    runCount: workflow.runCount ?? 0,
    projectCount: workflow.projectCount ?? 0,
    config: {
      reportPrompt: workflow.config?.reportPrompt ?? "",
      extractorPrompt: workflow.config?.extractorPrompt ?? "",
      validatorPrompt: workflow.config?.validatorPrompt ?? "",
      projectBuilderPrompt: workflow.config?.projectBuilderPrompt ?? "",
      phaseProgressPrompt: workflow.config?.phaseProgressPrompt ?? "",
      phaseBuilderPrompt: workflow.config?.phaseBuilderPrompt ?? ""
    }
  };
}

function normalizeWorkflowRun(run: Partial<WorkflowRunRecord>, index: number): WorkflowRunRecord {
  return {
    id: run.id ?? `run-${index + 1}`,
    workflowId: run.workflowId ?? "",
    workflowName: run.workflowName ?? "",
    runKind: run.runKind === "Phase Progression" ? "Phase Progression" : "Intake",
    executedByOfficeId: run.executedByOfficeId ?? "",
    executedByOfficeName: run.executedByOfficeName ?? "",
    unstructuredInput: run.unstructuredInput ?? "",
    attachments: Array.isArray(run.attachments) ? run.attachments : [],
    attachedDatabasePaths: Array.isArray(run.attachedDatabasePaths) ? run.attachedDatabasePaths : [],
    attachedDatabaseSummaries: Array.isArray(run.attachedDatabaseSummaries)
      ? run.attachedDatabaseSummaries
      : [],
    webSearchEnabled: run.webSearchEnabled ?? true,
    status: run.status ?? "Failed",
    attempts: Array.isArray(run.attempts) ? run.attempts : [],
    finalReport: run.finalReport ?? "",
    finalExtraction: run.finalExtraction ?? null,
    builderSummary: run.builderSummary ?? "",
    validatorFeedback: run.validatorFeedback ?? "",
    createdProjectIds: Array.isArray(run.createdProjectIds) ? run.createdProjectIds : [],
    createdProjectTitles: Array.isArray(run.createdProjectTitles) ? run.createdProjectTitles : [],
    relatedProjectId: run.relatedProjectId ?? null,
    relatedPhaseId: run.relatedPhaseId ?? null,
    nextPhaseId: run.nextPhaseId ?? null,
    projectClosed: run.projectClosed ?? false,
    createdAt: run.createdAt ?? "",
    updatedAt: run.updatedAt ?? run.createdAt ?? "",
    completedAt: run.completedAt ?? null
  };
}

function normalizeRequest(request: Partial<RequestApplicationRecord>, index: number): RequestApplicationRecord {
  return {
    id: request.id ?? `request-${index + 1}`,
    projectId: request.projectId ?? null,
    projectSubject: request.projectSubject ?? "",
    workflowId: request.workflowId ?? null,
    workflowName: request.workflowName ?? null,
    branchOfficeId: request.branchOfficeId ?? "",
    branchOfficeName: request.branchOfficeName ?? "",
    createdByOfficeId: request.createdByOfficeId ?? "",
    createdByOfficeName: request.createdByOfficeName ?? "",
    applicationText: request.applicationText ?? "",
    attachments: Array.isArray(request.attachments) ? request.attachments : [],
    selectedDatabasePaths: Array.isArray(request.selectedDatabasePaths) ? request.selectedDatabasePaths : [],
    selectedDatabaseSummaries: Array.isArray(request.selectedDatabaseSummaries)
      ? request.selectedDatabaseSummaries
      : [],
    attempts: Array.isArray(request.attempts) ? request.attempts : [],
    finalReport: request.finalReport ?? "",
    finalExtraction: request.finalExtraction ?? null,
    validation: request.validation ?? null,
    recommendation: request.recommendation ?? null,
    status: request.status ?? "Waiting for Approval",
    appealCount: request.appealCount ?? 0,
    webSearchEnabled: request.webSearchEnabled ?? true,
    decision: request.decision ?? null,
    statusHistory: Array.isArray(request.statusHistory) ? request.statusHistory : [],
    createdAt: request.createdAt ?? "",
    updatedAt: request.updatedAt ?? request.createdAt ?? ""
  };
}

function normalizeStore(store: Partial<SystemDatabase> | null | undefined): SystemDatabase {
  return {
    offices: Array.isArray(store?.offices) ? store.offices : [],
    workflows: Array.isArray(store?.workflows)
      ? store.workflows.map((workflow, index) => normalizeWorkflow(workflow, index))
      : [],
    workflowRuns: Array.isArray(store?.workflowRuns)
      ? store.workflowRuns.map((run, index) => normalizeWorkflowRun(run, index))
      : [],
    projects: Array.isArray(store?.projects)
      ? store.projects.map((project, index) => normalizeProject(project, index))
      : [],
    requests: Array.isArray(store?.requests)
      ? store.requests.map((request, index) => normalizeRequest(request, index))
      : [],
    issues: Array.isArray(store?.issues) ? store.issues : [],
    planSubmissions: Array.isArray(store?.planSubmissions) ? store.planSubmissions : [],
    planInsights: Array.isArray(store?.planInsights) ? store.planInsights : [],
    companyDatabase: {
      generalInfo: {
        companyName: store?.companyDatabase?.generalInfo?.companyName ?? "",
        workingField: store?.companyDatabase?.generalInfo?.workingField ?? "",
        overview: store?.companyDatabase?.generalInfo?.overview ?? ""
      },
      inventoryRecords: {
        monthly: Array.isArray(store?.companyDatabase?.inventoryRecords?.monthly)
          ? store.companyDatabase.inventoryRecords.monthly
          : [],
        yearly: Array.isArray(store?.companyDatabase?.inventoryRecords?.yearly)
          ? store.companyDatabase.inventoryRecords.yearly
          : []
      },
      salesReports: {
        monthly: Array.isArray(store?.companyDatabase?.salesReports?.monthly)
          ? store.companyDatabase.salesReports.monthly
          : [],
        yearly: Array.isArray(store?.companyDatabase?.salesReports?.yearly)
          ? store.companyDatabase.salesReports.yearly
          : []
      },
      procurementRecords: {
        monthly: Array.isArray(store?.companyDatabase?.procurementRecords?.monthly)
          ? store.companyDatabase.procurementRecords.monthly
          : [],
        yearly: Array.isArray(store?.companyDatabase?.procurementRecords?.yearly)
          ? store.companyDatabase.procurementRecords.yearly
          : []
      }
    },
    requestConfig: {
      requestAnalysisPrompt:
        store?.requestConfig?.requestAnalysisPrompt ??
        "You are the request-intake analyst for a capacitor manufacturing company. Read the request application, unstructured support inputs, attached files, and selected structured company data. Write a factual report focused on the requested approval scope, operational need, evidence quality, impact, urgency, and delivery constraints.",
      requestRecommendationPrompt:
        store?.requestConfig?.requestRecommendationPrompt ??
        "You are the approval recommendation model for a capacitor manufacturing company. Use the validated extracted information to recommend approve or reject. Give a clear reason, call out the main business and operational considerations, and avoid unsupported assumptions."
    },
    systemConfig: {
      apiUrl: store?.systemConfig?.apiUrl ?? "",
      apiKey: store?.systemConfig?.apiKey ?? "",
      enableWebSearch: store?.systemConfig?.enableWebSearch ?? true
    }
  };
}

function ensureSystemStoreFile() {
  const directory = path.dirname(systemDatabasePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(systemDatabasePath)) {
    writeFileSync(systemDatabasePath, JSON.stringify(createEmptyStore(), null, 2), "utf8");
  }
}

export function getSystemStore() {
  ensureSystemStoreFile();

  try {
    const raw = readFileSync(systemDatabasePath, "utf8");
    return normalizeStore(JSON.parse(raw) as Partial<SystemDatabase>);
  } catch {
    const nextStore = createEmptyStore();
    writeFileSync(systemDatabasePath, JSON.stringify(nextStore, null, 2), "utf8");
    return nextStore;
  }
}

export function resetSystemStore() {
  const nextStore = createEmptyStore();
  saveSystemStore(nextStore);
  return nextStore;
}

export function saveSystemStore(store: SystemDatabase) {
  ensureSystemStoreFile();
  writeFileSync(systemDatabasePath, JSON.stringify(store, null, 2), "utf8");
}

export function getSystemDatabaseInfo(): SystemDatabaseInfo {
  return {
    engine: "file-json",
    path: systemDatabasePath
  };
}
