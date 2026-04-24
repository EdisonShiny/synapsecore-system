"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { AppShell, FormField, PrimaryButton, SecondaryButton, TextAreaField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { EmptyBlock, PageSection } from "@/components/system/ui";
import type {
  CreateCustomDatabaseNodeInput,
  CustomDatabaseNode,
  DatabasePayload,
  UpdateCustomDatabaseNodeInput
} from "@/types/system";

function TreeBlock({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-synapse-border bg-white p-4 shadow-sm">
      <p className="text-card-title text-synapse-text">{title}</p>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function RecordList({
  items,
  render
}: {
  items: Array<unknown>;
  render: (item: any, index: number) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-body text-synapse-muted">No records yet.</p>;
  }

  return <div className="grid gap-2">{items.map(render)}</div>;
}

function flattenCustomNodes(nodes: CustomDatabaseNode[], depth = 0): Array<{ id: string; label: string; depth: number }> {
  return nodes.flatMap((node) => [
    { id: node.id, label: node.label, depth },
    ...flattenCustomNodes(node.children, depth + 1)
  ]);
}

function CustomTreeNode({
  node,
  onUpdate
}: {
  node: CustomDatabaseNode;
  onUpdate: (input: UpdateCustomDatabaseNodeInput) => Promise<void>;
}) {
  const [label, setLabel] = useState(node.label);
  const [value, setValue] = useState(node.value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      await onUpdate({ id: node.id, label, value });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-[18px] border border-synapse-border bg-white p-3">
      <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
        <FormField
          label="Field or branch"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <TextAreaField
          label="Value"
          className="min-h-20"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Structured value, note, metric, or summary"
        />
        <SecondaryButton
          type="button"
          icon={<Save className="h-4 w-4" />}
          loading={saving}
          onClick={handleSave}
        >
          Save
        </SecondaryButton>
      </div>

      {node.children.length > 0 ? (
        <div className="ml-4 grid gap-3 border-l border-synapse-border pl-4">
          {node.children.map((child) => (
            <CustomTreeNode key={child.id} node={child} onUpdate={onUpdate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DatabasePage() {
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [database, setDatabase] = useState<DatabasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [parentId, setParentId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

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

  if (!session || sessionLoading) {
    return null;
  }

  const customNodeOptions = database ? flattenCustomNodes(database.company.customTree) : [];

  async function addCustomNode() {
    if (!session) {
      return;
    }

    setSaving(true);
    setError("");
    setFeedback("");

    try {
      const input: CreateCustomDatabaseNodeInput = {
        parentId: parentId || null,
        label: newLabel,
        value: newValue
      };
      const data = await apiRequest<DatabasePayload>("/api/database", {
        method: "POST",
        session,
        json: input
      });

      setDatabase(data);
      setParentId("");
      setNewLabel("");
      setNewValue("");
      setFeedback("Database field added.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add database field.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCustomNode(input: UpdateCustomDatabaseNodeInput) {
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
      setError(submitError instanceof Error ? submitError.message : "Failed to update database field.");
    }
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Database"
      description="Hierarchical structured company data prepared for future system memory and reporting."
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
          title="Company"
          description="This tree is the structured storage layer for company-level data."
        >
          <div className="grid gap-4">
            <TreeBlock title="General company info">
              <div className="grid gap-2 text-body text-synapse-muted">
                <p><span className="font-semibold text-synapse-text">Company:</span> {database.company.generalInfo.companyName || "Not set"}</p>
                <p><span className="font-semibold text-synapse-text">Working field:</span> {database.company.generalInfo.workingField || "Not set"}</p>
                <p><span className="font-semibold text-synapse-text">Overview:</span> {database.company.generalInfo.overview || "Not set"}</p>
              </div>
            </TreeBlock>

            <TreeBlock title="Inventory records">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Monthly</p>
                  <div className="mt-3">
                    <RecordList
                      items={database.company.inventoryRecords.monthly}
                      render={(item, index) => (
                        <div key={`${item.period}-${index}`} className="rounded-2xl border border-synapse-border bg-white p-3 text-body text-synapse-text">
                          {item.period}: {item.value} {item.note ? `(${item.note})` : ""}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Yearly</p>
                  <div className="mt-3">
                    <RecordList
                      items={database.company.inventoryRecords.yearly}
                      render={(item, index) => (
                        <div key={`${item.period}-${index}`} className="rounded-2xl border border-synapse-border bg-white p-3 text-body text-synapse-text">
                          {item.period}: {item.value} {item.note ? `(${item.note})` : ""}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </TreeBlock>

            <TreeBlock title="Sales report">
              <div className="grid gap-4 md:grid-cols-2">
                {(["monthly", "yearly"] as const).map((periodType) => (
                  <div key={periodType} className="rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                    <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">{periodType}</p>
                    <div className="mt-3">
                      <RecordList
                        items={database.company.salesReports[periodType]}
                        render={(item, index) => (
                          <div key={`${item.period}-${index}`} className="rounded-2xl border border-synapse-border bg-white p-3 text-body text-synapse-text">
                            <p>{item.period}</p>
                            <p className="mt-1 text-synapse-muted">Sales: {item.sales}</p>
                            <p className="text-synapse-muted">Profit: {item.profit}</p>
                            {item.note ? <p className="mt-1 text-synapse-muted">{item.note}</p> : null}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TreeBlock>

            <TreeBlock title="Procurement records">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Monthly</p>
                  <div className="mt-3">
                    <RecordList
                      items={database.company.procurementRecords.monthly}
                      render={(item, index) => (
                        <div key={`${item.period}-${index}`} className="rounded-2xl border border-synapse-border bg-white p-3 text-body text-synapse-text">
                          {item.period}: {item.value} {item.note ? `(${item.note})` : ""}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Yearly</p>
                  <div className="mt-3">
                    <RecordList
                      items={database.company.procurementRecords.yearly}
                      render={(item, index) => (
                        <div key={`${item.period}-${index}`} className="rounded-2xl border border-synapse-border bg-white p-3 text-body text-synapse-text">
                          {item.period}: {item.value} {item.note ? `(${item.note})` : ""}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </TreeBlock>

            <TreeBlock title="Custom structured fields">
              <div className="grid gap-4">
                <div className="grid gap-3 rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-body">
                      <span className="font-medium text-synapse-text">Parent branch</span>
                      <select
                        className="synapse-focus w-full rounded-xl border border-synapse-border bg-white px-3 py-2.5 text-body text-synapse-text shadow-sm transition hover:border-synapse-primary/60 focus:border-synapse-primary"
                        value={parentId}
                        onChange={(event) => setParentId(event.target.value)}
                      >
                        <option value="">Company custom tree</option>
                        {customNodeOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {" ".repeat(option.depth * 2)}{option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <FormField
                      label="Field or branch name"
                      value={newLabel}
                      onChange={(event) => setNewLabel(event.target.value)}
                      placeholder="Example: Supplier risk"
                    />
                  </div>
                  <TextAreaField
                    label="Value"
                    className="min-h-24"
                    value={newValue}
                    onChange={(event) => setNewValue(event.target.value)}
                    placeholder="Example: High-voltage foil lead time is 6 weeks."
                  />
                  <div>
                    <PrimaryButton
                      type="button"
                      icon={<Plus className="h-4 w-4" />}
                      loading={saving}
                      onClick={addCustomNode}
                    >
                      Add field
                    </PrimaryButton>
                  </div>
                </div>

                {database.company.customTree.length > 0 ? (
                  <div className="grid gap-3 rounded-[18px] border border-synapse-border bg-synapse-elevated p-4">
                    {database.company.customTree.map((node) => (
                      <CustomTreeNode key={node.id} node={node} onUpdate={updateCustomNode} />
                    ))}
                  </div>
                ) : (
                  <EmptyBlock
                    title="No custom fields yet"
                    description="Add a branch or field here to make it available as structured database context."
                  />
                )}
              </div>
            </TreeBlock>
          </div>
        </PageSection>
      ) : null}
    </AppShell>
  );
}
