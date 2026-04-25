"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { AppShell, FormField, PrimaryButton, SecondaryButton, TextAreaField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { EmptyBlock, PageSection } from "@/components/system/ui";
import type {
  CompanyDatabase,
  CreateCustomDatabaseNodeInput,
  CustomDatabaseNode,
  DatabasePayload,
  UpdateCustomDatabaseNodeInput,
  UpdateDatabaseFieldValueInput,
  UpdateDatabaseNodeDescriptionInput
} from "@/types/system";

type LayerNode = {
  path: string;
  label: string;
  description: string;
  isCustom: boolean;
};

type LayerField = {
  path: string;
  label: string;
  value: string;
  isCustom: boolean;
  nodeId?: string;
};

const builtInLabels: Record<string, string> = {
  root: "Database",
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

function isCustomPath(path: string) {
  return path.startsWith("company.customTree:");
}

function isAiProjectPath(path: string) {
  return /^aiRecords\.projects:[^.:]+$/.test(path);
}

function isAiPhasePath(path: string) {
  return /^aiRecords\.projects:[^.:]+\.phases:[^.:]+$/.test(path);
}

function isDeletedPath(company: CompanyDatabase, path: string) {
  return company.deletedPaths.some(
    (deletedPath) => path === deletedPath || path.startsWith(`${deletedPath}.`)
  );
}

function getCustomNodeByPath(company: CompanyDatabase, path: string) {
  if (!isCustomPath(path)) {
    return null;
  }

  const nodeId = path.replace("company.customTree:", "");
  return company.customTree.find((node) => node.id === nodeId) ?? null;
}

function getAiProjectByPath(company: CompanyDatabase, path: string) {
  if (!isAiProjectPath(path)) {
    return null;
  }

  const match = /^aiRecords\.projects:([^.:]+)$/.exec(path);
  return match
    ? company.aiRecords.projects.find((project) => project.projectId === match[1]) ?? null
    : null;
}

function getAiPhaseByPath(company: CompanyDatabase, path: string) {
  if (!isAiPhasePath(path)) {
    return null;
  }

  const match = /^aiRecords\.projects:([^.:]+)\.phases:([^.:]+)$/.exec(path);

  if (!match) {
    return null;
  }

  const project = company.aiRecords.projects.find((entry) => entry.projectId === match[1]);
  return project?.phases.find((phase) => phase.phaseId === match[2]) ?? null;
}

function getFieldLabel(company: CompanyDatabase, path: string, fallback: string) {
  return company.fieldLabels[path] || fallback;
}

function getNodeLabel(company: CompanyDatabase, path: string) {
  if (isCustomPath(path)) {
    return getCustomNodeByPath(company, path)?.label ?? "Custom branch";
  }

  if (isAiProjectPath(path)) {
    return company.nodeLabels[path] || getAiProjectByPath(company, path)?.projectSubject || "AI project record";
  }

  if (isAiPhasePath(path)) {
    return company.nodeLabels[path] || getAiPhaseByPath(company, path)?.title || "AI phase record";
  }

  return company.nodeLabels[path] || builtInLabels[path] || path;
}

function getNodeDescription(company: CompanyDatabase, path: string) {
  if (isCustomPath(path)) {
    return getCustomNodeByPath(company, path)?.description ?? "";
  }

  if (isAiProjectPath(path)) {
    return company.nodeDescriptions[path] ?? "AI-generated memory for this project and all recorded phases.";
  }

  if (isAiPhasePath(path)) {
    return company.nodeDescriptions[path] ?? "AI-generated plan and validated outcome for this phase.";
  }

  return company.nodeDescriptions[path] ?? "";
}

function getCustomBranches(company: CompanyDatabase, parentPath: string) {
  return company.customTree.filter(
    (node) =>
      node.parentPath === parentPath &&
      node.kind === "branch" &&
      !(!parentPath.startsWith("company.customTree:") && isDeletedPath(company, parentPath))
  );
}

function getCustomFields(company: CompanyDatabase, parentPath: string) {
  return company.customTree.filter(
    (node) =>
      node.parentPath === parentPath &&
      node.kind === "field" &&
      !(!parentPath.startsWith("company.customTree:") && isDeletedPath(company, parentPath))
  );
}

function getVisibleNodes(company: CompanyDatabase, currentPath: string): LayerNode[] {
  const dynamicAiNodes =
    currentPath === "aiRecords.projects"
      ? company.aiRecords.projects.map((project) => ({
          path: getAiProjectPath(project.projectId),
          label: getNodeLabel(company, getAiProjectPath(project.projectId)),
          description: getNodeDescription(company, getAiProjectPath(project.projectId)),
          isCustom: false
        }))
      : isAiProjectPath(currentPath)
        ? (getAiProjectByPath(company, currentPath)?.phases ?? [])
            .slice()
            .sort((left, right) => left.phaseNumber - right.phaseNumber)
            .map((phase) => ({
              path: getAiPhasePath(
                getAiProjectByPath(company, currentPath)?.projectId ?? "",
                phase.phaseId
              ),
              label: getNodeLabel(
                company,
                getAiPhasePath(getAiProjectByPath(company, currentPath)?.projectId ?? "", phase.phaseId)
              ),
              description: getNodeDescription(
                company,
                getAiPhasePath(getAiProjectByPath(company, currentPath)?.projectId ?? "", phase.phaseId)
              ),
              isCustom: false
            }))
        : [];
  const builtInNodes = (builtInChildren[currentPath] ?? [])
    .filter((path) => !isDeletedPath(company, path))
    .map((path) => ({
      path,
      label: getNodeLabel(company, path),
      description: getNodeDescription(company, path),
      isCustom: false
    }));
  const customNodes = getCustomBranches(company, currentPath).map((node) => ({
    path: getCustomNodePath(node.id),
    label: node.label,
    description: node.description,
    isCustom: true
  }));

  return [...builtInNodes, ...dynamicAiNodes.filter((node) => !isDeletedPath(company, node.path)), ...customNodes];
}

function getVisibleFields(company: CompanyDatabase, currentPath: string): LayerField[] {
  const customFields = getCustomFields(company, currentPath).map((node) => ({
    path: getCustomNodePath(node.id),
    label: node.label,
    value: node.value,
    isCustom: true,
    nodeId: node.id
  }));

  if (isAiPhasePath(currentPath)) {
    const phase = getAiPhaseByPath(company, currentPath);

    if (!phase) {
      return customFields;
    }

    return [
      {
        path: `${currentPath}.plan`,
        label: getFieldLabel(company, `${currentPath}.plan`, "Plan"),
        value: phase.plan,
        isCustom: false
      },
      {
        path: `${currentPath}.outcome`,
        label: getFieldLabel(company, `${currentPath}.outcome`, "Outcome"),
        value: phase.outcome,
        isCustom: false
      },
      ...customFields
    ].filter((field) => !isDeletedPath(company, field.path));
  }

  if (currentPath !== "company.generalInfo") {
    if (currentPath === "company.inventoryRecords.monthly") {
      return [
        ...company.inventoryRecords.monthly.flatMap((record, index) => {
          const recordLabel = record.period || `Record ${index + 1}`;

          return [
            {
              path: `company.inventoryRecords.monthly.${index}.period`,
              label: getFieldLabel(company, `company.inventoryRecords.monthly.${index}.period`, `${recordLabel} period`),
              value: record.period,
              isCustom: false
            },
            {
              path: `company.inventoryRecords.monthly.${index}.value`,
              label: getFieldLabel(company, `company.inventoryRecords.monthly.${index}.value`, `${recordLabel} value`),
              value: String(record.value),
              isCustom: false
            },
            {
              path: `company.inventoryRecords.monthly.${index}.note`,
              label: getFieldLabel(company, `company.inventoryRecords.monthly.${index}.note`, `${recordLabel} note`),
              value: record.note,
              isCustom: false
            }
          ];
        }),
        ...customFields
      ].filter((field) => !isDeletedPath(company, field.path));
    }

    if (currentPath === "company.inventoryRecords.yearly") {
      return [
        ...company.inventoryRecords.yearly.flatMap((record, index) => {
          const recordLabel = record.period || `Record ${index + 1}`;

          return [
            {
              path: `company.inventoryRecords.yearly.${index}.period`,
              label: getFieldLabel(company, `company.inventoryRecords.yearly.${index}.period`, `${recordLabel} period`),
              value: record.period,
              isCustom: false
            },
            {
              path: `company.inventoryRecords.yearly.${index}.value`,
              label: getFieldLabel(company, `company.inventoryRecords.yearly.${index}.value`, `${recordLabel} value`),
              value: String(record.value),
              isCustom: false
            },
            {
              path: `company.inventoryRecords.yearly.${index}.note`,
              label: getFieldLabel(company, `company.inventoryRecords.yearly.${index}.note`, `${recordLabel} note`),
              value: record.note,
              isCustom: false
            }
          ];
        }),
        ...customFields
      ].filter((field) => !isDeletedPath(company, field.path));
    }

    if (currentPath === "company.salesReports.monthly") {
      return [
        ...company.salesReports.monthly.flatMap((record, index) => {
          const recordLabel = record.period || `Record ${index + 1}`;

          return [
            {
              path: `company.salesReports.monthly.${index}.period`,
              label: getFieldLabel(company, `company.salesReports.monthly.${index}.period`, `${recordLabel} period`),
              value: record.period,
              isCustom: false
            },
            {
              path: `company.salesReports.monthly.${index}.sales`,
              label: getFieldLabel(company, `company.salesReports.monthly.${index}.sales`, `${recordLabel} sales`),
              value: String(record.sales),
              isCustom: false
            },
            {
              path: `company.salesReports.monthly.${index}.profit`,
              label: getFieldLabel(company, `company.salesReports.monthly.${index}.profit`, `${recordLabel} profit`),
              value: String(record.profit),
              isCustom: false
            },
            {
              path: `company.salesReports.monthly.${index}.note`,
              label: getFieldLabel(company, `company.salesReports.monthly.${index}.note`, `${recordLabel} note`),
              value: record.note,
              isCustom: false
            }
          ];
        }),
        ...customFields
      ].filter((field) => !isDeletedPath(company, field.path));
    }

    if (currentPath === "company.salesReports.yearly") {
      return [
        ...company.salesReports.yearly.flatMap((record, index) => {
          const recordLabel = record.period || `Record ${index + 1}`;

          return [
            {
              path: `company.salesReports.yearly.${index}.period`,
              label: getFieldLabel(company, `company.salesReports.yearly.${index}.period`, `${recordLabel} period`),
              value: record.period,
              isCustom: false
            },
            {
              path: `company.salesReports.yearly.${index}.sales`,
              label: getFieldLabel(company, `company.salesReports.yearly.${index}.sales`, `${recordLabel} sales`),
              value: String(record.sales),
              isCustom: false
            },
            {
              path: `company.salesReports.yearly.${index}.profit`,
              label: getFieldLabel(company, `company.salesReports.yearly.${index}.profit`, `${recordLabel} profit`),
              value: String(record.profit),
              isCustom: false
            },
            {
              path: `company.salesReports.yearly.${index}.note`,
              label: getFieldLabel(company, `company.salesReports.yearly.${index}.note`, `${recordLabel} note`),
              value: record.note,
              isCustom: false
            }
          ];
        }),
        ...customFields
      ].filter((field) => !isDeletedPath(company, field.path));
    }

    if (currentPath === "company.procurementRecords.monthly") {
      return [
        ...company.procurementRecords.monthly.flatMap((record, index) => {
          const recordLabel = record.period || `Record ${index + 1}`;

          return [
            {
              path: `company.procurementRecords.monthly.${index}.period`,
              label: getFieldLabel(company, `company.procurementRecords.monthly.${index}.period`, `${recordLabel} period`),
              value: record.period,
              isCustom: false
            },
            {
              path: `company.procurementRecords.monthly.${index}.value`,
              label: getFieldLabel(company, `company.procurementRecords.monthly.${index}.value`, `${recordLabel} value`),
              value: String(record.value),
              isCustom: false
            },
            {
              path: `company.procurementRecords.monthly.${index}.note`,
              label: getFieldLabel(company, `company.procurementRecords.monthly.${index}.note`, `${recordLabel} note`),
              value: record.note,
              isCustom: false
            }
          ];
        }),
        ...customFields
      ].filter((field) => !isDeletedPath(company, field.path));
    }

    if (currentPath === "company.procurementRecords.yearly") {
      return [
        ...company.procurementRecords.yearly.flatMap((record, index) => {
          const recordLabel = record.period || `Record ${index + 1}`;

          return [
            {
              path: `company.procurementRecords.yearly.${index}.period`,
              label: getFieldLabel(company, `company.procurementRecords.yearly.${index}.period`, `${recordLabel} period`),
              value: record.period,
              isCustom: false
            },
            {
              path: `company.procurementRecords.yearly.${index}.value`,
              label: getFieldLabel(company, `company.procurementRecords.yearly.${index}.value`, `${recordLabel} value`),
              value: String(record.value),
              isCustom: false
            },
            {
              path: `company.procurementRecords.yearly.${index}.note`,
              label: getFieldLabel(company, `company.procurementRecords.yearly.${index}.note`, `${recordLabel} note`),
              value: record.note,
              isCustom: false
            }
          ];
        }),
        ...customFields
      ].filter((field) => !isDeletedPath(company, field.path));
    }

    return customFields;
  }

  return [
    {
      path: "company.generalInfo.companyName",
      label: getFieldLabel(company, "company.generalInfo.companyName", "Company name"),
      value: company.generalInfo.companyName,
      isCustom: false
    },
    {
      path: "company.generalInfo.workingField",
      label: getFieldLabel(company, "company.generalInfo.workingField", "Working field"),
      value: company.generalInfo.workingField,
      isCustom: false
    },
    {
      path: "company.generalInfo.overview",
      label: getFieldLabel(company, "company.generalInfo.overview", "Overview"),
      value: company.generalInfo.overview,
      isCustom: false
    },
    ...customFields
  ].filter((field) => !isDeletedPath(company, field.path));
}

function getParentPath(company: CompanyDatabase, currentPath: string) {
  if (currentPath === "root") {
    return null;
  }

  if (isCustomPath(currentPath)) {
    return getCustomNodeByPath(company, currentPath)?.parentPath ?? "root";
  }

  if (isAiPhasePath(currentPath)) {
    const match = /^aiRecords\.projects:([^.:]+)\.phases:[^.:]+$/.exec(currentPath);
    return match ? getAiProjectPath(match[1]) : "aiRecords.projects";
  }

  if (isAiProjectPath(currentPath)) {
    return "aiRecords.projects";
  }

  const builtInParentEntry = Object.entries(builtInChildren).find(([, children]) =>
    children.includes(currentPath)
  );

  return builtInParentEntry?.[0] ?? "root";
}

function buildBreadcrumbs(company: CompanyDatabase, currentPath: string) {
  const breadcrumbs: Array<{ path: string; label: string }> = [];
  let pointer: string | null = currentPath;

  while (pointer) {
    breadcrumbs.unshift({
      path: pointer,
      label: getNodeLabel(company, pointer)
    });
    pointer = getParentPath(company, pointer);
  }

  return breadcrumbs;
}

function RecordGroup({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-synapse-border bg-white p-4 shadow-sm">
      <p className="text-card-title text-synapse-text">{title}</p>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function BranchCard({
  node,
  editMode,
  onOpen,
  onSaveBuiltIn,
  onSaveCustom,
  onDeleteBuiltIn,
  onDeleteCustom
}: {
  node: LayerNode;
  editMode: boolean;
  onOpen: (path: string) => void;
  onSaveBuiltIn: (input: UpdateDatabaseNodeDescriptionInput) => Promise<void>;
  onSaveCustom: (input: UpdateCustomDatabaseNodeInput) => Promise<void>;
  onDeleteBuiltIn: (path: string) => Promise<void>;
  onDeleteCustom: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(node.description);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLabel(node.label);
    setDescription(node.description);
  }, [node.description, node.label]);

  async function handleSave() {
    setSaving(true);

    try {
      if (node.isCustom) {
        await onSaveCustom({
          id: node.path.replace("company.customTree:", ""),
          kind: "branch",
          label,
          description,
          value: ""
        });
      } else {
        await onSaveBuiltIn({
          path: node.path,
          description,
          label
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-synapse-border bg-white p-4 shadow-sm">
      {editMode ? (
        <div className="grid gap-3">
          {node.isCustom ? (
            <FormField
              label="Branch name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          ) : (
            <FormField
              label="Branch name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          )}
          <TextAreaField
            label="Short description"
            className="min-h-20"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <SecondaryButton type="button" onClick={() => onOpen(node.path)}>
              Open
            </SecondaryButton>
            <PrimaryButton
              type="button"
              icon={<Save className="h-4 w-4" />}
              loading={saving}
              onClick={handleSave}
            >
              Save
            </PrimaryButton>
            {node.isCustom ? (
              <SecondaryButton
                type="button"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onDeleteCustom(node.path.replace("company.customTree:", ""))}
              >
                Delete
              </SecondaryButton>
            ) : (
              <SecondaryButton
                type="button"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onDeleteBuiltIn(node.path)}
              >
                Delete
              </SecondaryButton>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="synapse-focus grid w-full gap-3 text-left"
          onClick={() => onOpen(node.path)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-card-title text-synapse-text">{node.label}</p>
              <p className="mt-1 text-body text-synapse-muted">
                {node.description || "No short description yet."}
              </p>
            </div>
            <span className="rounded-full border border-synapse-border bg-synapse-elevated px-3 py-1 text-meta text-synapse-muted">
              Open
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

function FieldCard({
  field,
  editMode,
  onSaveBuiltIn,
  onSaveCustom,
  onDeleteBuiltIn,
  onDeleteCustom
}: {
  field: LayerField;
  editMode: boolean;
  onSaveBuiltIn: (input: UpdateDatabaseFieldValueInput) => Promise<void>;
  onSaveCustom: (input: UpdateCustomDatabaseNodeInput) => Promise<void>;
  onDeleteBuiltIn: (path: string) => Promise<void>;
  onDeleteCustom: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(field.label);
  const [value, setValue] = useState(field.value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLabel(field.label);
    setValue(field.value);
  }, [field.label, field.value]);

  async function handleSave() {
    setSaving(true);

    try {
      if (field.isCustom && field.nodeId) {
        await onSaveCustom({
          id: field.nodeId,
          kind: "field",
          label,
          description: "",
          value
        });
      } else {
        await onSaveBuiltIn({
          path: field.path,
          value,
          label
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-synapse-border bg-white p-4 shadow-sm">
      {editMode ? (
        <div className="grid gap-3">
          {field.isCustom ? (
            <FormField
              label="Field key"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          ) : (
            <FormField
              label="Field key"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          )}
          <TextAreaField
            label="Field value"
            className="min-h-24"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                type="button"
                icon={<Save className="h-4 w-4" />}
                loading={saving}
                onClick={handleSave}
              >
                Save field
              </PrimaryButton>
              {field.isCustom && field.nodeId ? (
                <SecondaryButton
                  type="button"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => onDeleteCustom(field.nodeId ?? "")}
                >
                  Delete
                </SecondaryButton>
              ) : (
                <SecondaryButton
                  type="button"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => onDeleteBuiltIn(field.path)}
                >
                  Delete
                </SecondaryButton>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="text-card-title text-synapse-text">{field.label}</p>
          <p className="text-body text-synapse-muted">{field.value || "No value yet."}</p>
        </div>
      )}
    </div>
  );
}

export function DatabasePage() {
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [database, setDatabase] = useState<DatabasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPath, setCurrentPath] = useState("root");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [newBranchLabel, setNewBranchLabel] = useState("");
  const [newBranchDescription, setNewBranchDescription] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [layerDescription, setLayerDescription] = useState("");
  const [customLayerLabel, setCustomLayerLabel] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest<DatabasePayload>("/api/database", { session });

        if (active) {
          setDatabase(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load database tree.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [session]);

  const visibleNodes = useMemo(
    () => (database ? getVisibleNodes(database.company, currentPath) : []),
    [currentPath, database]
  );
  const visibleFields = useMemo(
    () => (database ? getVisibleFields(database.company, currentPath) : []),
    [currentPath, database]
  );
  const breadcrumbs = useMemo(
    () => (database ? buildBreadcrumbs(database.company, currentPath) : []),
    [currentPath, database]
  );
  const currentCustomNode = useMemo(
    () => (database ? getCustomNodeByPath(database.company, currentPath) : null),
    [currentPath, database]
  );

  useEffect(() => {
    if (!database) {
      return;
    }

    if (isDeletedPath(database.company, currentPath)) {
      setCurrentPath(getParentPath(database.company, currentPath) ?? "root");
      return;
    }

    setLayerDescription(getNodeDescription(database.company, currentPath));
    setCustomLayerLabel(getNodeLabel(database.company, currentPath));
  }, [currentCustomNode, currentPath, database]);

  if (!session || sessionLoading) {
    return null;
  }

  async function saveBuiltInDescription(input: UpdateDatabaseNodeDescriptionInput) {
    if (!session) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "PATCH",
        session,
        json: input
      });

      setDatabase(data);
      setFeedback("Database description updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update description.");
    }
  }

  async function saveBuiltInField(input: UpdateDatabaseFieldValueInput) {
    if (!session) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "PATCH",
        session,
        json: input
      });

      setDatabase(data);
      setFeedback("Database field updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update field.");
    }
  }

  async function saveCustomNode(input: UpdateCustomDatabaseNodeInput) {
    if (!session) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "PATCH",
        session,
        json: input
      });

      setDatabase(data);
      setFeedback(input.kind === "field" ? "Custom field updated." : "Custom branch updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update custom database entry.");
    }
  }

  async function deleteCustomNode(nodeId: string) {
    if (!session) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "DELETE",
        session,
        json: { id: nodeId }
      });

      setDatabase(data);

      if (currentPath === getCustomNodePath(nodeId) || currentPath.startsWith(`${getCustomNodePath(nodeId)}:`)) {
        setCurrentPath(getParentPath(data.company, currentPath) ?? "root");
      }

      setFeedback("Database entry deleted.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to delete database entry.");
    }
  }

  async function deleteBuiltInPath(path: string) {
    if (!session) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "DELETE",
        session,
        json: { path }
      });

      setDatabase(data);

      if (currentPath === path || currentPath.startsWith(`${path}.`)) {
        setCurrentPath(getParentPath(data.company, currentPath) ?? "root");
      }

      setFeedback("Database entry deleted.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to delete database entry.");
    }
  }

  async function saveCurrentLayer() {
    if (!database) {
      return;
    }

    if (isCustomPath(currentPath) && currentCustomNode) {
      await saveCustomNode({
        id: currentCustomNode.id,
        kind: "branch",
        label: customLayerLabel,
        description: layerDescription,
        value: ""
      });
      return;
    }

    await saveBuiltInDescription({
      path: currentPath,
      description: layerDescription,
      label: customLayerLabel
    });
  }

  async function addDatabaseEntry(kind: "branch" | "field") {
    if (!session) {
      return;
    }

    setSaving(true);
    setError("");
    setFeedback("");

    try {
      const input: CreateCustomDatabaseNodeInput =
        kind === "branch"
          ? {
              parentPath: currentPath,
              kind,
              label: newBranchLabel,
              description: newBranchDescription,
              value: ""
            }
          : {
              parentPath: currentPath,
              kind,
              label: newFieldLabel,
              value: newFieldValue
            };
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "POST",
        session,
        json: input
      });

      setDatabase(data);
      setNewBranchLabel("");
      setNewBranchDescription("");
      setNewFieldLabel("");
      setNewFieldValue("");
      setFeedback(kind === "branch" ? "New branch added." : "New field added.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add database entry.");
    } finally {
      setSaving(false);
    }
  }

  function renderCurrentLayerContent() {
    if (!database) {
      return null;
    }

    const company = database.company;

    switch (currentPath) {
      case "root":
        return (
          <p className="text-body text-synapse-muted">
            Start from Company or AI records, or add a new top-level branch if your team wants another structured database root.
          </p>
        );
      case "company":
        return (
          <div className="grid gap-2 text-body text-synapse-muted">
            <p>
              <span className="font-semibold text-synapse-text">
                {getFieldLabel(company, "company.generalInfo.companyName", "Company name")}:
              </span>{" "}
              {company.generalInfo.companyName}
            </p>
            <p>
              <span className="font-semibold text-synapse-text">
                {getFieldLabel(company, "company.generalInfo.workingField", "Working field")}:
              </span>{" "}
              {company.generalInfo.workingField}
            </p>
          </div>
        );
      case "aiRecords":
        return (
          <p className="text-body text-synapse-muted">
            AI records store structured project memory generated by the workflow pipeline.
          </p>
        );
      case "aiRecords.projects":
        return (
          <p className="text-body text-synapse-muted">
            Open a project branch to inspect its stored AI phase plans and validated outcomes.
          </p>
        );
      case "company.inventoryRecords.monthly":
      case "company.inventoryRecords.yearly":
      case "company.salesReports.monthly":
      case "company.salesReports.yearly":
      case "company.procurementRecords.monthly":
      case "company.procurementRecords.yearly":
        return (
          <p className="text-body text-synapse-muted">
            This layer now stores its built-in information as editable fields below.
          </p>
        );
      default:
        if (isAiProjectPath(currentPath)) {
          return (
            <p className="text-body text-synapse-muted">
              This branch stores AI-generated phase memory for the selected project.
            </p>
          );
        }

        if (isAiPhasePath(currentPath)) {
          return (
            <p className="text-body text-synapse-muted">
              This layer stores the AI-generated phase plan and the validated outcome captured for that phase.
            </p>
          );
        }

        if (currentCustomNode?.kind === "branch") {
          return (
            <p className="text-body text-synapse-muted">
              {currentCustomNode.description || "No short description yet."}
            </p>
          );
        }

        return (
          <p className="text-body text-synapse-muted">
            Open a branch to inspect its fields and child branches.
          </p>
        );
    }
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Database"
      description="Browse the structured company database one layer at a time, and switch on edit mode whenever you want to add or update branches and fields."
    >
      {loading ? <p className="text-body text-synapse-muted">Loading database tree...</p> : null}
      {error ? <p className="text-body text-synapse-error">{error}</p> : null}
      {feedback ? <p className="text-body text-synapse-secondary">{feedback}</p> : null}

      {!loading && !error && !database ? (
        <PageSection title="Database unavailable">
          <EmptyBlock title="Database not available" description="The company database tree could not be loaded." />
        </PageSection>
      ) : null}

      {database ? (
        <PageSection
          title={getNodeLabel(database.company, currentPath)}
          description={getNodeDescription(database.company, currentPath) || "No short description yet."}
          action={
            <SecondaryButton
              type="button"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditMode((current) => !current)}
            >
              {editMode ? "Done" : "Edit"}
            </SecondaryButton>
          }
        >
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-3">
              {currentPath !== "root" ? (
                <SecondaryButton
                  type="button"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => setCurrentPath(getParentPath(database.company, currentPath) ?? "root")}
                >
                  Back
                </SecondaryButton>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {breadcrumbs.map((crumb, index) => (
                  <button
                    key={crumb.path}
                    type="button"
                    className={`rounded-full px-3 py-1 text-meta transition ${
                      crumb.path === currentPath
                        ? "bg-synapse-text text-white"
                        : "border border-synapse-border bg-white text-synapse-muted"
                    }`}
                    onClick={() => setCurrentPath(crumb.path)}
                  >
                    {index === 0 ? "Database" : crumb.label}
                  </button>
                ))}
              </div>
            </div>

            <RecordGroup title="Current layer">
              {editMode ? (
                <div className="grid gap-4">
                  {currentPath !== "root" ? (
                    <FormField
                      label="Branch name"
                      value={customLayerLabel}
                      onChange={(event) => setCustomLayerLabel(event.target.value)}
                    />
                  ) : null}
                  <TextAreaField
                    label="Short description"
                    className="min-h-20"
                    value={layerDescription}
                    onChange={(event) => setLayerDescription(event.target.value)}
                  />
                  <div>
                    <PrimaryButton
                      type="button"
                      icon={<Save className="h-4 w-4" />}
                      onClick={saveCurrentLayer}
                    >
                      Save current layer
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                renderCurrentLayerContent()
              )}
            </RecordGroup>

            <RecordGroup title="Fields">
              {visibleFields.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleFields.map((field) => (
                    <FieldCard
                      key={field.path}
                      field={field}
                      editMode={editMode}
                      onSaveBuiltIn={saveBuiltInField}
                      onSaveCustom={saveCustomNode}
                      onDeleteBuiltIn={deleteBuiltInPath}
                      onDeleteCustom={deleteCustomNode}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBlock
                  title="No fields in this layer"
                  description="Switch on edit mode to add a new field here."
                />
              )}
            </RecordGroup>

            <RecordGroup title="Branches">
              {visibleNodes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleNodes.map((node) => (
                    <BranchCard
                      key={node.path}
                      node={node}
                      editMode={editMode}
                      onOpen={setCurrentPath}
                      onSaveBuiltIn={saveBuiltInDescription}
                      onSaveCustom={saveCustomNode}
                      onDeleteBuiltIn={deleteBuiltInPath}
                      onDeleteCustom={deleteCustomNode}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBlock
                  title="No child branches in this layer"
                  description="Switch on edit mode if you want to add a new branch here."
                />
              )}
            </RecordGroup>

            {editMode ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <RecordGroup title="Add branch">
                  <div className="grid gap-4">
                    <FormField
                      label="Branch name"
                      value={newBranchLabel}
                      onChange={(event) => setNewBranchLabel(event.target.value)}
                      placeholder="Example: HR record"
                    />
                    <TextAreaField
                      label="Short description"
                      className="min-h-20"
                      value={newBranchDescription}
                      onChange={(event) => setNewBranchDescription(event.target.value)}
                      placeholder="What this branch stores."
                    />
                    <div>
                      <PrimaryButton
                        type="button"
                        icon={<Plus className="h-4 w-4" />}
                        loading={saving}
                        onClick={() => addDatabaseEntry("branch")}
                      >
                        Add branch
                      </PrimaryButton>
                    </div>
                  </div>
                </RecordGroup>

                <RecordGroup title="Add field">
                  <div className="grid gap-4">
                    <FormField
                      label="Field key"
                      value={newFieldLabel}
                      onChange={(event) => setNewFieldLabel(event.target.value)}
                      placeholder="Example: Company name"
                    />
                    <TextAreaField
                      label="Field value"
                      className="min-h-24"
                      value={newFieldValue}
                      onChange={(event) => setNewFieldValue(event.target.value)}
                      placeholder="The actual stored value for this field."
                    />
                    <div>
                      <PrimaryButton
                        type="button"
                        icon={<Plus className="h-4 w-4" />}
                        loading={saving}
                        onClick={() => addDatabaseEntry("field")}
                      >
                        Add field
                      </PrimaryButton>
                    </div>
                  </div>
                </RecordGroup>
              </div>
            ) : null}
          </div>
        </PageSection>
      ) : null}
    </AppShell>
  );
}
