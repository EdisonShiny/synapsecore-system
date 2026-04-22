"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  GitBranch,
  Send,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { AppShell, PrimaryButton, SecondaryButton, SelectField, StatusBadge, TextAreaField } from "@/components";

const workflowSteps = [
  { label: "Input", detail: "Branch signal captured", status: "complete", tone: "success" as const },
  { label: "Project", detail: "Structured case opened", status: "complete", tone: "success" as const },
  { label: "Plan", detail: "AI phase plan ready", status: "active", tone: "info" as const },
  { label: "Validate", detail: "Missing data flagged", status: "review", tone: "warning" as const },
  { label: "Approve", detail: "HQ decision pending", status: "pending", tone: "warning" as const },
  { label: "Execute", detail: "Branch handover queued", status: "next", tone: "neutral" as const }
];

type AiAnalysisResult = {
  issue_type?: string;
  business_area?: string;
  urgency?: string;
  summary?: string;
  risks?: string[];
  opportunities?: string[];
  missing_information?: string[];
  confidence_score?: number;
};

const edgeCases = [
  { icon: AlertTriangle, title: "Missing supplier ETA", body: "Validation blocks final approval until evidence is attached.", tone: "warning" as const },
  { icon: ShieldCheck, title: "Unsupported forecast claim", body: "GLM marks the assumption for HQ review.", tone: "error" as const },
  { icon: GitBranch, title: "Partial execution result", body: "Workflow opens a remediation phase automatically.", tone: "info" as const }
];

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-synapse-border bg-synapse-card p-5 shadow-panel ${className}`}>{children}</section>;
}

function PanelTitle({ icon: Icon, title, meta }: { icon: typeof Bot; title: string; meta?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-card-title text-synapse-text">{title}</h2>
        {meta ? <p className="mt-1 text-meta text-synapse-muted">{meta}</p> : null}
      </div>
    </div>
  );
}

export default function Home() {
  const [sourceType, setSourceType] = useState("branch_report");
  const [signal, setSignal] = useState(
    "North Branch reports detergent stock-out risk while weekly demand grows 18 percent. Supplier ETA is not confirmed. Requesting urgent restock approval."
  );
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const decisionOutputs = analysis
    ? [
        ["Issue", analysis.issue_type?.replaceAll("_", " ") ?? "Unknown"],
        ["Business area", analysis.business_area?.replaceAll("_", " ") ?? "Unknown"],
        ["Urgency", analysis.urgency ?? "Unknown"],
        ["Confidence", typeof analysis.confidence_score === "number" ? `${analysis.confidence_score}%` : "Unknown"]
      ]
    : [
        ["Issue", "Inventory shortage risk"],
        ["Business area", "inventory"],
        ["Urgency", "high"],
        ["Confidence", "86%"]
      ];

  async function analyzeSignal() {
    setIsAnalyzing(true);
    setApiError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: null,
          source_type: sourceType,
          raw_text: signal,
          file_url: null,
          uploaded_by: "manual-test-user"
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.errors?.join(" ") ?? payload.message ?? "AI analysis failed.");
      }

      setAnalysis(payload.data.ai_analysis);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "AI analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <AppShell pageTitle="SynapseCore Command Center" role="HQ" activeItem="Dashboard">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel className="bg-synapse-elevated">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-meta text-blue-300">
                <Sparkles className="h-4 w-4" />
                ILMU API reasoning enabled
              </div>
              <h1 className="text-page-title text-synapse-text">HQ and Branch workflow automation</h1>
              <p className="mt-3 text-body text-synapse-muted">
                Branch signals become structured projects, validated phase plans, approval packets, and execution updates.
              </p>
            </div>
            <div className="grid min-w-48 gap-2 rounded-lg border border-synapse-border bg-synapse-card p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-meta text-synapse-muted">Mode</span>
                <StatusBadge tone="success">real API</StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-meta text-synapse-muted">State</span>
                <StatusBadge tone="info">adaptive</StatusBadge>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={Database} title="Operational snapshot" meta="Live workflow queue" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["24", "Active"],
              ["7", "Approval"],
              ["91%", "Valid"],
              ["3", "Blocked"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-synapse-border bg-synapse-elevated p-3">
                <p className="text-2xl font-semibold text-synapse-text">{value}</p>
                <p className="mt-1 text-meta text-synapse-muted">{label}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <PanelTitle icon={FileText} title="Branch input intake" meta="Unstructured source" />
          <div className="grid gap-4">
            <SelectField label="Source" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
              <option value="branch_report">Branch report</option>
              <option value="market_news">Market news</option>
              <option value="feedback">Customer feedback</option>
              <option value="uploaded_document">Uploaded document</option>
            </SelectField>
            <TextAreaField
              label="Signal"
              value={signal}
              onChange={(event) => setSignal(event.target.value)}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton icon={<Bot className="h-4 w-4" />} loading={isAnalyzing} onClick={analyzeSignal}>
                Analyze with ILMU
              </PrimaryButton>
              <SecondaryButton icon={<Send className="h-4 w-4" />}>Create workflow</SecondaryButton>
            </div>
          </div>
        </Panel>

        <Panel className="border-blue-400/25 bg-blue-400/10">
          <PanelTitle icon={Bot} title="ILMU reasoning output" meta={analysis ? "Live API response" : apiError ? "API error response" : "Static preview until analyzed"} />
          {apiError ? (
            <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-body text-red-100">
              {apiError}
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {decisionOutputs.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-blue-400/20 bg-synapse-page/50 p-3">
                <p className="text-meta text-blue-200">{label}</p>
                <p className="mt-1 text-body font-medium text-synapse-text">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-blue-400/20 bg-synapse-page/50 p-4">
            <p className="text-body text-synapse-text">{analysis ? "Summary" : "Required inputs"}</p>
            {analysis?.summary ? <p className="mt-2 text-body text-synapse-muted">{analysis.summary}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {(analysis?.missing_information?.length ? analysis.missing_information : ["Supplier lead time", "Current stock level", "Weekly demand trend"]).map((item, index) => (
                <StatusBadge key={`${item}-${index}`} tone={index === 0 ? "warning" : "info"}>
                  {item}
                </StatusBadge>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <Panel>
        <PanelTitle icon={GitBranch} title="Stateful workflow engine" meta="Input to execution" />
        <div className="grid gap-3 lg:grid-cols-6">
          {workflowSteps.map((step, index) => (
            <div key={step.label} className="relative rounded-lg border border-synapse-border bg-synapse-elevated p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-body font-medium text-synapse-text">{step.label}</span>
                <StatusBadge tone={step.tone}>{step.status}</StatusBadge>
              </div>
              <p className="text-meta text-synapse-muted">{step.detail}</p>
              {index < workflowSteps.length - 1 ? (
                <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-synapse-muted lg:block" />
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Panel>
          <PanelTitle icon={ShieldCheck} title="Validation and edge cases" meta="Ambiguity, missing data, process failure" />
          <div className="grid gap-3">
            {edgeCases.map(({ icon: Icon, title, body, tone }) => (
              <div key={title} className="flex gap-3 rounded-lg border border-synapse-border bg-synapse-elevated p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-synapse-secondary" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-medium text-synapse-text">{title}</p>
                    <StatusBadge tone={tone}>{tone}</StatusBadge>
                  </div>
                  <p className="mt-1 text-meta text-synapse-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={ClipboardCheck} title="HQ approval packet" meta="Actionable output" />
          <div className="grid gap-3">
            <div className="rounded-lg border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta text-synapse-muted">Recommendation</p>
              <p className="mt-1 text-body font-medium text-synapse-text">Approve with supplier ETA check</p>
            </div>
            <div className="rounded-lg border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-meta text-synapse-muted">Risk level</p>
              <div className="mt-2">
                <StatusBadge tone="warning">medium</StatusBadge>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SecondaryButton>Request data</SecondaryButton>
              <PrimaryButton icon={<CheckCircle2 className="h-4 w-4" />}>Approve plan</PrimaryButton>
            </div>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
