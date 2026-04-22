"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppShell,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  StatusBadge,
  TextAreaField
} from "@/components";
import { GuardedPageState, Panel, StepStrip } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import type { AiAnalysis, Project, ProjectInput } from "@/types";
import type {
  InputUnderstandingInner,
  ProjectIdentificationInner
} from "@/src/modules/ai";

type AnalyzeResult = {
  input: ProjectInput;
  ai_analysis: AiAnalysis;
  input_understanding: InputUnderstandingInner;
};

type CreateResult = {
  project_identification: ProjectIdentificationInner | null;
  project: Project | null;
};

export function CreateProjectPageClient() {
  const { session, loading: sessionLoading } = useDemoSession();
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState<ProjectInput["source_type"]>("manual_form");
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!session) {
      return;
    }

    setAnalyzing(true);
    setError("");
    setCreateResult(null);

    try {
      const result = await apiRequest<AnalyzeResult>("/api/inputs", {
        method: "POST",
        session,
        json: {
          project_id: null,
          source_type: sourceType,
          raw_text: rawText,
          file_url: null,
          uploaded_by: session.user.id
        }
      });
      setAnalyzeResult(result);
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Failed to analyze input.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleCreateProject() {
    if (!session || !analyzeResult) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      const result = await apiRequest<CreateResult>("/api/ai/create-project-from-input", {
        method: "POST",
        session,
        json: {
          input_id: analyzeResult.input.id,
          confirm_project_creation: true
        }
      });
      setCreateResult(result);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create project.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell
      pageTitle="Create Project"
      role={session?.user.role ?? "Branch Office"}
      activeItem="Projects"
    >
      <GuardedPageState loading={sessionLoading}>
        {session ? (
          <div className="grid gap-6">
            <StepStrip
              steps={["Describe issue", "Check AI summary", "Create project"]}
              current={createResult?.project ? 2 : analyzeResult ? 1 : 0}
            />
            <Panel title="Step 1: describe the issue" description="Write the problem in plain language, then run analysis.">
              <SelectField
                label="Input source"
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value as ProjectInput["source_type"])}
              >
                <option value="manual_form">manual_form</option>
                <option value="branch_report">branch_report</option>
                <option value="feedback">feedback</option>
                <option value="uploaded_document">uploaded_document</option>
              </SelectField>
              <TextAreaField
                label="Raw business issue"
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Example: Branch reports low stock with rising demand and needs HQ approval for restock."
              />
              {error ? <p className="text-body text-synapse-error">{error}</p> : null}
              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  loading={analyzing}
                  onClick={handleAnalyze}
                  disabled={rawText.trim().length === 0}
                >
                  Analyze input
                </PrimaryButton>
              </div>
            </Panel>
            {analyzeResult ? (
              <Panel title="Step 2: review the AI summary" description="If this summary looks correct, create the project.">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="warning">{analyzeResult.ai_analysis.urgency}</StatusBadge>
                  <StatusBadge tone="info">{analyzeResult.ai_analysis.business_area}</StatusBadge>
                  <StatusBadge tone="success">{analyzeResult.ai_analysis.confidence_score}% confidence</StatusBadge>
                </div>
                <p className="text-body text-synapse-muted">{analyzeResult.ai_analysis.summary}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <h3 className="text-body font-medium text-synapse-text">Risks</h3>
                    <ul className="mt-2 grid gap-2 text-body text-synapse-muted">
                      {analyzeResult.ai_analysis.risks.map((risk) => (
                        <li key={risk}>- {risk}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-body font-medium text-synapse-text">Missing information</h3>
                    <ul className="mt-2 grid gap-2 text-body text-synapse-muted">
                      {analyzeResult.ai_analysis.missing_information.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <SecondaryButton
                    loading={creating}
                    onClick={handleCreateProject}
                    disabled={!analyzeResult}
                  >
                    Create project
                  </SecondaryButton>
                </div>
              </Panel>
            ) : (
              <EmptyState
                title="No analysis yet"
                description="Paste a raw issue and run the input analysis first."
              />
            )}
            {createResult?.project ? (
              <Panel title="Step 3: project created" description="The project is ready. Open the next page and continue the workflow.">
                <div className="grid gap-3">
                  <h3 className="text-card-title text-synapse-text">{createResult.project.title}</h3>
                  <p className="text-body text-synapse-muted">{createResult.project.summary}</p>
                  {createResult.project_identification ? (
                    <p className="text-body text-synapse-muted">
                      Initial phase: {createResult.project_identification.recommended_initial_phase}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/projects/${createResult.project.id}`}>
                    <PrimaryButton>Open project detail</PrimaryButton>
                  </Link>
                  <Link href={`/ai-workflow?projectId=${createResult.project.id}`}>
                    <SecondaryButton>Open AI workflow</SecondaryButton>
                  </Link>
                </div>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </GuardedPageState>
    </AppShell>
  );
}
