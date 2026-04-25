import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sampleWorkflowTemplate } from "@/src/modules/system/sample-workflow";
import type {
  AiRecordsDatabase,
  CompanyDatabase,
  CustomDatabaseNode,
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
const defaultOfficeTimestamp = "2026-01-01T00:00:00.000Z";

const defaultDatabaseNodeDescriptions: Record<string, string> = {
  root: "Shared structured data layers available to the whole company network.",
  company:
    "Core company information and structured operational records for the capacitor manufacturing business.",
  aiRecords:
    "AI-generated structured project memory, including phase plans and validated outcomes.",
  "aiRecords.projects":
    "Projects tracked by the AI pipeline, with one branch per project and one branch per phase.",
  "company.generalInfo":
    "Company identity, working field, and high-level operational overview.",
  "company.inventoryRecords":
    "Inventory tracking layers for monthly and yearly stock visibility.",
  "company.inventoryRecords.monthly":
    "Monthly inventory snapshots and notes for recent operational periods.",
  "company.inventoryRecords.yearly":
    "Yearly inventory summaries for long-range planning and comparison.",
  "company.salesReports":
    "Sales performance layers split by monthly and yearly reporting windows.",
  "company.salesReports.monthly":
    "Monthly sales performance, including sales and profit values by period.",
  "company.salesReports.monthly.sales":
    "Monthly sales values used to track commercial performance.",
  "company.salesReports.monthly.profit":
    "Monthly profit values paired with the monthly sales records.",
  "company.salesReports.yearly":
    "Yearly sales performance, including sales and profit values by year.",
  "company.salesReports.yearly.sales":
    "Yearly sales values used to compare annual revenue performance.",
  "company.salesReports.yearly.profit":
    "Yearly profit values paired with the yearly sales records.",
  "company.procurementRecords":
    "Procurement tracking layers for monthly and yearly purchasing activity.",
  "company.procurementRecords.monthly":
    "Monthly procurement records with supply and purchasing notes.",
  "company.procurementRecords.yearly":
    "Yearly procurement summaries for longer-range supply review."
};

const defaultDatabaseNodeLabels: Record<string, string> = {
  company: "Company",
  aiRecords: "AI records",
  "aiRecords.projects": "Projects",
  "company.generalInfo": "General company info",
  "company.inventoryRecords": "Inventory records",
  "company.inventoryRecords.monthly": "Monthly",
  "company.inventoryRecords.yearly": "Yearly",
  "company.salesReports": "Sales report",
  "company.salesReports.monthly": "Monthly",
  "company.salesReports.yearly": "Yearly",
  "company.procurementRecords": "Procurement records",
  "company.procurementRecords.monthly": "Monthly",
  "company.procurementRecords.yearly": "Yearly"
};

const defaultDatabaseFieldLabels: Record<string, string> = {
  "company.generalInfo.companyName": "Company name",
  "company.generalInfo.workingField": "Working field",
  "company.generalInfo.overview": "Overview"
};

function createDefaultOffices(): OfficeAccount[] {
  return [
    {
      id: "demo-hq-office",
      name: "HQ Demo Manager",
      officeName: "SynapseCore HQ",
      role: "HQ",
      branch_id: null,
      location: "Kuala Lumpur, Malaysia",
      address: "HQ Demo Office",
      email: "hq@synapsecore.test",
      personInChargeName: "HQ Demo Manager",
      position: "Headquarters Coordinator",
      contactNumber: "+60 00-000 0000",
      createdAt: defaultOfficeTimestamp,
      updatedAt: defaultOfficeTimestamp
    },
    {
      id: "demo-branch-office",
      name: "Branch Demo Manager",
      officeName: "SynapseCore Branch",
      role: "Branch Office",
      branch_id: "demo-branch-office",
      location: "Penang, Malaysia",
      address: "Branch Demo Office",
      email: "branch@synapsecore.test",
      personInChargeName: "Branch Demo Manager",
      position: "Branch Operations Lead",
      contactNumber: "+60 00-000 0001",
      createdAt: defaultOfficeTimestamp,
      updatedAt: defaultOfficeTimestamp
    }
  ];
}

function ensureDefaultDemoOffices(offices: OfficeAccount[]) {
  const defaults = createDefaultOffices();
  const existingEmails = new Set(offices.map((office) => office.email.toLowerCase()));
  const missingDefaults = defaults.filter((office) => !existingEmails.has(office.email.toLowerCase()));

  return [
    ...missingDefaults,
    ...offices
  ];
}

function createSeedWorkflow(): WorkflowRecord {
  return {
    id: "seed-workflow-capacitor-recovery",
    name: sampleWorkflowTemplate.name,
    description: sampleWorkflowTemplate.description,
    createdByOfficeId: "demo-hq-office",
    createdByOfficeName: "SynapseCore HQ",
    createdAt: defaultOfficeTimestamp,
    updatedAt: defaultOfficeTimestamp,
    lastRunAt: defaultOfficeTimestamp,
    runCount: 1,
    projectCount: 1,
    config: sampleWorkflowTemplate.config
  };
}

function createSeedProject(): ProjectRecord {
  return {
    id: "seed-project-capacitor-output-stabilization",
    subject: "Project: Capacitor Output Stabilization",
    applicantName: "Branch Demo Manager",
    position: "Branch Operations Lead",
    email: "branch@synapsecore.test",
    description:
      "Stabilize capacitor output by resolving raw-material delays, tightening replenishment monitoring, and protecting production throughput.",
    branchOfficeId: "demo-branch-office",
    branchOfficeName: "SynapseCore Branch",
    createdByOfficeId: "demo-branch-office",
    workflowId: "seed-workflow-capacitor-recovery",
    workflowName: sampleWorkflowTemplate.name,
    workflowRunId: "seed-run-capacitor-recovery",
    createdAt: "2026-01-03T09:00:00.000Z",
    updatedAt: "2026-01-03T09:00:00.000Z",
    appealCount: 0,
    attachments: [],
    status: "Approved",
    lifecycleState: "Active",
    phases: [
      {
        id: "seed-phase-1",
        phaseNumber: 1,
        title: "Phase 1: Production gap containment",
        objective:
          "Stabilize current capacitor line output by identifying the highest-impact shortages and daily bottlenecks.",
        actionablePlans: [
          "Confirm the daily raw-material shortage list for affected capacitor lines.",
          "Assign one branch owner to track output loss and delayed replenishment every shift.",
          "Escalate unstable supplier lead times and compare them against current inventory burn."
        ],
        expectedOutcome:
          "Output loss and stock pressure are visible daily, and the branch has one accountable operating baseline.",
        status: "Current",
        sourceRunId: "seed-run-capacitor-recovery",
        completionInput: null,
        completionAttachments: [],
        completionDatabasePaths: [],
        completionReport: null,
        validationSummary: null,
        completedAt: null,
        createdAt: "2026-01-03T09:00:00.000Z"
      }
    ],
    report: {
      id: "seed-report-capacitor-output-stabilization",
      branchOfficeName: "SynapseCore Branch",
      submissionTime: "2026-01-03T09:00:00.000Z",
      projectDescription:
        "The branch identified recurring raw-material delays and unstable replenishment thresholds affecting capacitor output.",
      applicantInformation: {
        applicantName: "Branch Demo Manager",
        position: "Branch Operations Lead",
        email: "branch@synapsecore.test"
      },
      resourceLinks: [],
      aiAdvice:
        "Use one accountable branch owner, stabilize replenishment thresholds, and monitor daily output evidence before expanding scope.",
      aiOutput: {
        id: "seed-ai-insight-capacitor-output-stabilization",
        generatedAt: "2026-01-03T09:00:00.000Z",
        directResult:
          "The branch has a grounded production-recovery project ready for monitored execution.",
        finalConclusion:
          "The project should proceed because the branch has clear supply pressure, measurable production impact, and an actionable first phase.",
        advice:
          "Monitor output loss, supplier response, and replenishment thresholds together so the next phase can be built from verified evidence.",
        workflow: [
          {
            title: "Branch signal intake",
            detail:
              "The workflow combined branch demand signals, inventory pressure, and supplier delay context into one validated project candidate."
          },
          {
            title: "Validation",
            detail:
              "The extractor and validator confirmed that the production risk was grounded in the submitted branch evidence."
          },
          {
            title: "Project build",
            detail:
              "The builder created a phased execution plan focused on throughput stabilization and evidence-driven next steps."
          }
        ],
        evidence: [
          {
            label: "Production signal",
            detail: "Capacitor output was pressured by raw-material delay and unstable replenishment timing.",
            source: "Operational"
          },
          {
            label: "Branch context",
            detail: "SynapseCore Branch is the execution owner for the first stabilization phase.",
            source: "Operational"
          }
        ]
      }
    },
    decision: {
      decision: "Approved",
      comments: "Seed project approved for demo-ready execution.",
      decidedAt: "2026-01-03T09:00:00.000Z",
      decidedByOfficeId: "demo-hq-office",
      decidedByOfficeName: "SynapseCore HQ"
    },
    statusHistory: [
      {
        status: "Submitted",
        changedAt: "2026-01-03T09:00:00.000Z",
        changedByOfficeId: "demo-branch-office",
        changedByOfficeName: "SynapseCore Branch",
        note: "Seed project created from the sample capacitor workflow."
      },
      {
        status: "Approved",
        changedAt: "2026-01-03T09:00:00.000Z",
        changedByOfficeId: "demo-hq-office",
        changedByOfficeName: "SynapseCore HQ",
        note: "Seed project approved to provide a shared starting point in fresh checkouts."
      }
    ]
  };
}

function createAiRecordsFromProjects(projects: ProjectRecord[]): AiRecordsDatabase {
  return {
    projects: projects.map((project) => ({
      projectId: project.id,
      projectSubject: project.subject,
      phases: project.phases
        .slice()
        .sort((left, right) => left.phaseNumber - right.phaseNumber)
        .map((phase) => ({
          phaseId: phase.id,
          phaseNumber: phase.phaseNumber,
          title: phase.title,
          plan: [
            `Objective: ${phase.objective}`,
            phase.actionablePlans.length > 0
              ? `Actionable plans:\n- ${phase.actionablePlans.join("\n- ")}`
              : "Actionable plans: No plans recorded.",
            `Expected outcome: ${phase.expectedOutcome || "No expected outcome recorded."}`
          ].join("\n\n"),
          outcome: phase.validationSummary
            ? [
                phase.completionReport || "No validated phase report recorded.",
                `Validation: ${phase.validationSummary}`
              ].join("\n\n")
            : phase.completionReport || "",
          updatedAt: phase.completedAt ?? phase.createdAt
        })),
      updatedAt: project.updatedAt
    }))
  };
}

function createEmptyStore(): SystemDatabase {
  const seedProject = createSeedProject();

  return {
    offices: createDefaultOffices(),
    workflows: [createSeedWorkflow()],
    workflowRuns: [],
    projects: [seedProject],
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
      },
      aiRecords: createAiRecordsFromProjects([seedProject]),
      nodeLabels: { ...defaultDatabaseNodeLabels },
      fieldLabels: { ...defaultDatabaseFieldLabels },
      nodeDescriptions: { ...defaultDatabaseNodeDescriptions },
      deletedPaths: [],
      customTree: []
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
      model: "ilmu-glm-5.1",
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
      phaseBuilderPrompt: workflow.config?.phaseBuilderPrompt ?? "",
      phaseReportPrompt: workflow.config?.phaseReportPrompt ?? ""
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

function normalizeCustomDatabaseNode(
  node: Partial<CustomDatabaseNode>,
  index: number
): CustomDatabaseNode {
  return {
    id: node.id ?? `custom-node-${index + 1}`,
    kind: node.kind === "field" ? "field" : "branch",
    label: node.label ?? "Untitled field",
    description: node.description ?? "",
    value: node.value ?? "",
    parentPath: node.parentPath ?? "company",
    createdAt: node.createdAt ?? "",
    updatedAt: node.updatedAt ?? node.createdAt ?? ""
  };
}

function normalizeStore(store: Partial<SystemDatabase> | null | undefined): SystemDatabase {
  return {
    offices: ensureDefaultDemoOffices(Array.isArray(store?.offices) ? store.offices : []),
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
      },
      aiRecords: {
        projects: Array.isArray(store?.companyDatabase?.aiRecords?.projects)
          ? store.companyDatabase.aiRecords.projects
          : createAiRecordsFromProjects(
              Array.isArray(store?.projects)
                ? store.projects.map((project, index) => normalizeProject(project, index))
                : []
            ).projects
      },
      nodeLabels: {
        ...defaultDatabaseNodeLabels,
        ...(store?.companyDatabase?.nodeLabels ?? {})
      },
      fieldLabels: {
        ...defaultDatabaseFieldLabels,
        ...(store?.companyDatabase?.fieldLabels ?? {})
      },
      nodeDescriptions: {
        ...defaultDatabaseNodeDescriptions,
        ...(store?.companyDatabase?.nodeDescriptions ?? {})
      },
      deletedPaths: Array.isArray(store?.companyDatabase?.deletedPaths)
        ? store.companyDatabase.deletedPaths.filter((path): path is string => typeof path === "string")
        : [],
      customTree: Array.isArray(store?.companyDatabase?.customTree)
        ? store.companyDatabase.customTree.map((node, index) => normalizeCustomDatabaseNode(node, index))
        : []
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
      model: store?.systemConfig?.model ?? "ilmu-glm-5.1",
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
