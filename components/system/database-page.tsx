"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { EmptyBlock, PageSection } from "@/components/system/ui";
import type { DatabasePayload } from "@/types/system";

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

export function DatabasePage() {
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [database, setDatabase] = useState<DatabasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Database"
      description="Hierarchical structured company data prepared for future system memory and reporting."
    >
      {loading ? <p className="text-body text-synapse-muted">Loading database tree...</p> : null}
      {error ? <p className="text-body text-synapse-error">{error}</p> : null}

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
          </div>
        </PageSection>
      ) : null}
    </AppShell>
  );
}
