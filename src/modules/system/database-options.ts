import type {
  AiRecordPhase,
  AiRecordProject,
  CompanyDatabase,
  CustomDatabaseNode,
  DatabaseAttachmentOption,
  DatabaseAttachmentTreeNode
} from "@/types/system";

const builtInBranchDescriptions: Record<string, string> = {
  company: "All structured company information and operational records.",
  aiRecords: "AI-generated structured project memory, including plans and validated outcomes.",
  "aiRecords.projects": "Projects tracked by AI-generated phase memory.",
  "company.generalInfo": "Company name, working field, and overview.",
  "company.inventoryRecords": "Inventory tracking branches for monthly and yearly records.",
  "company.inventoryRecords.monthly": "Monthly inventory records.",
  "company.inventoryRecords.yearly": "Yearly inventory records.",
  "company.salesReports": "Sales reporting branches for monthly and yearly performance.",
  "company.salesReports.monthly": "Monthly sales and profit records.",
  "company.salesReports.yearly": "Yearly sales and profit records.",
  "company.procurementRecords": "Procurement tracking branches for monthly and yearly records.",
  "company.procurementRecords.monthly": "Monthly procurement records.",
  "company.procurementRecords.yearly": "Yearly procurement records."
};

const builtInChildren: Record<string, string[]> = {
  root: ["company", "aiRecords"],
  company: [
    "company.generalInfo",
    "company.inventoryRecords",
    "company.salesReports",
    "company.procurementRecords"
  ],
  aiRecords: ["aiRecords.projects"],
  "company.inventoryRecords": [
    "company.inventoryRecords.monthly",
    "company.inventoryRecords.yearly"
  ],
  "company.salesReports": [
    "company.salesReports.monthly",
    "company.salesReports.yearly"
  ],
  "company.procurementRecords": [
    "company.procurementRecords.monthly",
    "company.procurementRecords.yearly"
  ]
};

function getCustomNodePath(nodeId: string) {
  return `company.customTree:${nodeId}`;
}

function getAiProjectPath(projectId: string) {
  return `aiRecords.projects:${projectId}`;
}

function getAiPhasePath(projectId: string, phaseId: string) {
  return `${getAiProjectPath(projectId)}.phases:${phaseId}`;
}

function isDeletedPath(company: CompanyDatabase, path: string) {
  return company.deletedPaths.some(
    (deletedPath) => path === deletedPath || path.startsWith(`${deletedPath}.`)
  );
}

function isCustomNodeVisible(company: CompanyDatabase, node: CustomDatabaseNode) {
  return !(
    !node.parentPath.startsWith("company.customTree:") && isDeletedPath(company, node.parentPath)
  );
}

function getCustomBranches(company: CompanyDatabase, parentPath: string) {
  return company.customTree.filter(
    (node) => node.parentPath === parentPath && node.kind === "branch" && isCustomNodeVisible(company, node)
  );
}

function getCustomFields(company: CompanyDatabase, parentPath: string) {
  return company.customTree.filter((node) => node.parentPath === parentPath && node.kind === "field");
}

function summarizeCustomField(node: CustomDatabaseNode) {
  return `${node.label}: ${node.value}`.trim();
}

function summarizeCustomBranch(company: CompanyDatabase, node: CustomDatabaseNode): string {
  const branchPath = getCustomNodePath(node.id);
  const fieldSummary = getCustomFields(company, branchPath)
    .map(summarizeCustomField)
    .filter(Boolean);
  const branchSummary = getCustomBranches(company, branchPath)
    .map((child) => summarizeCustomBranch(company, child))
    .filter(Boolean);
  const payload = [...fieldSummary, ...branchSummary].join(" | ");

  return payload ? `${node.label}: ${payload}` : node.label;
}

function getCustomSummaryForLayer(company: CompanyDatabase, parentPath: string) {
  const fieldSummary = getCustomFields(company, parentPath)
    .map(summarizeCustomField)
    .filter(Boolean);
  const branchSummary = getCustomBranches(company, parentPath)
    .map((node) => summarizeCustomBranch(company, node))
    .filter(Boolean);

  return [...fieldSummary, ...branchSummary].join(" | ");
}

function joinSummaries(...summaries: string[]) {
  return summaries.filter(Boolean).join(" | ");
}

function getNodeLabel(company: CompanyDatabase, path: string, fallback: string) {
  return company.nodeLabels[path] || fallback;
}

function getFieldLabel(company: CompanyDatabase, path: string, fallback: string) {
  return company.fieldLabels[path] || fallback;
}

function getAiProject(company: CompanyDatabase, projectId: string): AiRecordProject | null {
  return company.aiRecords.projects.find((entry) => entry.projectId === projectId) ?? null;
}

function getAiPhase(company: CompanyDatabase, projectId: string, phaseId: string): AiRecordPhase | null {
  return getAiProject(company, projectId)?.phases.find((entry) => entry.phaseId === phaseId) ?? null;
}

function getNodeMeta(company: CompanyDatabase, path: string) {
  if (path.startsWith("company.customTree:")) {
    const customNode = company.customTree.find(
      (node) => node.kind === "branch" && getCustomNodePath(node.id) === path
    );

    return {
      label: customNode?.label ?? path,
      description: customNode?.description ?? "User-defined structured branch."
    };
  }

  if (path.startsWith("aiRecords.projects:")) {
    const projectMatch = /^aiRecords\.projects:([^.:]+)$/.exec(path);

    if (projectMatch) {
      const project = getAiProject(company, projectMatch[1]);
      return {
        label: getNodeLabel(company, path, project?.projectSubject ?? "AI project record"),
        description:
          company.nodeDescriptions[path] ??
          "AI-generated phase memory for this project, including stored plans and validated outcomes."
      };
    }

    const phaseMatch = /^aiRecords\.projects:([^.:]+)\.phases:([^.:]+)$/.exec(path);

    if (phaseMatch) {
      const phase = getAiPhase(company, phaseMatch[1], phaseMatch[2]);
      return {
        label: getNodeLabel(company, path, phase?.title ?? "AI phase record"),
        description:
          company.nodeDescriptions[path] ??
          "AI-generated record for this phase, with the stored plan and validated achieved outcome."
      };
    }
  }

  return {
    label: getNodeLabel(company, path, path.split(".").slice(-1)[0] ?? path),
    description: company.nodeDescriptions[path] ?? builtInBranchDescriptions[path] ?? ""
  };
}

function getDynamicChildren(company: CompanyDatabase, path: string) {
  if (path === "aiRecords.projects") {
    return company.aiRecords.projects.map((project) => getAiProjectPath(project.projectId));
  }

  const projectMatch = /^aiRecords\.projects:([^.:]+)$/.exec(path);

  if (projectMatch) {
    const project = getAiProject(company, projectMatch[1]);
    return (project?.phases ?? [])
      .slice()
      .sort((left, right) => left.phaseNumber - right.phaseNumber)
      .map((phase) => getAiPhasePath(projectMatch[1], phase.phaseId));
  }

  return [];
}

function buildAttachmentNode(company: CompanyDatabase, path: string): DatabaseAttachmentTreeNode | null {
  if (isDeletedPath(company, path)) {
    return null;
  }

  const childPaths = [...(builtInChildren[path] ?? []), ...getDynamicChildren(company, path)];
  const builtInNodes = childPaths
    .map((childPath) => buildAttachmentNode(company, childPath))
    .filter((node): node is DatabaseAttachmentTreeNode => Boolean(node));
  const customNodes = path.startsWith("company")
    ? getCustomBranches(company, path)
        .map((node) => buildAttachmentNode(company, getCustomNodePath(node.id)))
        .filter((node): node is DatabaseAttachmentTreeNode => Boolean(node))
    : [];
  const meta = getNodeMeta(company, path);

  return {
    path,
    label: meta.label,
    description: meta.description,
    children: [...builtInNodes, ...customNodes]
  };
}

function flattenTree(nodes: DatabaseAttachmentTreeNode[]): DatabaseAttachmentOption[] {
  return nodes.flatMap((node) => [
    {
      path: node.path,
      label: node.label,
      description: node.description
    },
    ...flattenTree(node.children)
  ]);
}

export function buildDatabaseAttachmentTree(company: CompanyDatabase): DatabaseAttachmentTreeNode[] {
  const builtInRoots = (builtInChildren.root ?? [])
    .map((path) => buildAttachmentNode(company, path))
    .filter((node): node is DatabaseAttachmentTreeNode => Boolean(node));
  const customRoots = getCustomBranches(company, "root")
    .map((node) => buildAttachmentNode(company, getCustomNodePath(node.id)))
    .filter((node): node is DatabaseAttachmentTreeNode => Boolean(node));

  return [...builtInRoots, ...customRoots];
}

export function buildDatabaseAttachmentOptions(company: CompanyDatabase): DatabaseAttachmentOption[] {
  return flattenTree(buildDatabaseAttachmentTree(company));
}

function summarizeAiPhase(company: CompanyDatabase, projectId: string, phaseId: string) {
  const phase = getAiPhase(company, projectId, phaseId);

  if (!phase) {
    return "";
  }

  return joinSummaries(
    `${getFieldLabel(company, `${getAiPhasePath(projectId, phaseId)}.plan`, "Plan")}: ${phase.plan || "No plan recorded."}`,
    `${getFieldLabel(company, `${getAiPhasePath(projectId, phaseId)}.outcome`, "Outcome")}: ${phase.outcome || "No validated outcome recorded."}`
  );
}

function summarizeAiProject(company: CompanyDatabase, projectId: string) {
  const project = getAiProject(company, projectId);

  if (!project) {
    return "";
  }

  const phaseSummary = project.phases
    .slice()
    .sort((left, right) => left.phaseNumber - right.phaseNumber)
    .map((phase) =>
      `${getNodeLabel(company, getAiPhasePath(projectId, phase.phaseId), phase.title)}: ${summarizeAiPhase(company, projectId, phase.phaseId)}`
    )
    .filter(Boolean)
    .join(" | ");

  return `${getNodeLabel(company, getAiProjectPath(projectId), project.projectSubject)}: ${phaseSummary}`.trim();
}

export function getDatabaseSelectionSummary(company: CompanyDatabase, path: string): string {
  if (isDeletedPath(company, path)) {
    return "";
  }

  if (path.startsWith("company.customTree:")) {
    const nodeId = path.replace("company.customTree:", "");
    const node = company.customTree.find((entry) => entry.id === nodeId && entry.kind === "branch");
    return node && isCustomNodeVisible(company, node) ? summarizeCustomBranch(company, node) : "";
  }

  if (path === "aiRecords.projects") {
    return company.aiRecords.projects.map((project) => summarizeAiProject(company, project.projectId)).join(" | ");
  }

  const aiProjectMatch = /^aiRecords\.projects:([^.:]+)$/.exec(path);
  if (aiProjectMatch) {
    return summarizeAiProject(company, aiProjectMatch[1]);
  }

  const aiPhaseMatch = /^aiRecords\.projects:([^.:]+)\.phases:([^.:]+)$/.exec(path);
  if (aiPhaseMatch) {
    return summarizeAiPhase(company, aiPhaseMatch[1], aiPhaseMatch[2]);
  }

  switch (path) {
    case "company.generalInfo":
      return joinSummaries(
        `${getFieldLabel(company, "company.generalInfo.companyName", "Company name")}: ${company.generalInfo.companyName}`,
        `${getFieldLabel(company, "company.generalInfo.workingField", "Working field")}: ${company.generalInfo.workingField}`,
        `${getFieldLabel(company, "company.generalInfo.overview", "Overview")}: ${company.generalInfo.overview}`,
        getCustomSummaryForLayer(company, "company.generalInfo")
      );
    case "company.inventoryRecords.monthly":
      return joinSummaries(
        company.inventoryRecords.monthly
          .map((record) => `${record.period}: ${record.value} (${record.note})`)
          .join(" | "),
        getCustomSummaryForLayer(company, "company.inventoryRecords.monthly")
      );
    case "company.inventoryRecords.yearly":
      return joinSummaries(
        company.inventoryRecords.yearly
          .map((record) => `${record.period}: ${record.value} (${record.note})`)
          .join(" | "),
        getCustomSummaryForLayer(company, "company.inventoryRecords.yearly")
      );
    case "company.inventoryRecords":
      return joinSummaries(
        getDatabaseSelectionSummary(company, "company.inventoryRecords.monthly"),
        getDatabaseSelectionSummary(company, "company.inventoryRecords.yearly"),
        getCustomSummaryForLayer(company, "company.inventoryRecords")
      );
    case "company.salesReports.monthly":
      return joinSummaries(
        company.salesReports.monthly
          .map((record) => `${record.period}: sales ${record.sales}, profit ${record.profit} (${record.note})`)
          .join(" | "),
        getCustomSummaryForLayer(company, "company.salesReports.monthly")
      );
    case "company.salesReports.yearly":
      return joinSummaries(
        company.salesReports.yearly
          .map((record) => `${record.period}: sales ${record.sales}, profit ${record.profit} (${record.note})`)
          .join(" | "),
        getCustomSummaryForLayer(company, "company.salesReports.yearly")
      );
    case "company.salesReports":
      return joinSummaries(
        getDatabaseSelectionSummary(company, "company.salesReports.monthly"),
        getDatabaseSelectionSummary(company, "company.salesReports.yearly"),
        getCustomSummaryForLayer(company, "company.salesReports")
      );
    case "company.procurementRecords.monthly":
      return joinSummaries(
        company.procurementRecords.monthly
          .map((record) => `${record.period}: ${record.value} (${record.note})`)
          .join(" | "),
        getCustomSummaryForLayer(company, "company.procurementRecords.monthly")
      );
    case "company.procurementRecords.yearly":
      return joinSummaries(
        company.procurementRecords.yearly
          .map((record) => `${record.period}: ${record.value} (${record.note})`)
          .join(" | "),
        getCustomSummaryForLayer(company, "company.procurementRecords.yearly")
      );
    case "company.procurementRecords":
      return joinSummaries(
        getDatabaseSelectionSummary(company, "company.procurementRecords.monthly"),
        getDatabaseSelectionSummary(company, "company.procurementRecords.yearly"),
        getCustomSummaryForLayer(company, "company.procurementRecords")
      );
    case "company":
      return joinSummaries(
        getDatabaseSelectionSummary(company, "company.generalInfo"),
        getDatabaseSelectionSummary(company, "company.inventoryRecords"),
        getDatabaseSelectionSummary(company, "company.salesReports"),
        getDatabaseSelectionSummary(company, "company.procurementRecords"),
        getCustomSummaryForLayer(company, "company")
      );
    case "aiRecords":
      return getDatabaseSelectionSummary(company, "aiRecords.projects");
    default:
      return "";
  }
}
