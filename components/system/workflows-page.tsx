"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, FormField, PrimaryButton, SelectField, TextAreaField } from "@/components";
import {
  PromptGuideToggle,
  getPromptFieldMeta
} from "@/components/system/prompt-guide";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import {
  defaultWorkflowPromptPreset,
  getWorkflowPromptPreset,
  type WorkflowPresetId,
  workflowPromptPresets
} from "@/src/modules/system/sample-workflow";
import { formatDateTime } from "@/components/system/format";
import { EmptyBlock, PageSection, RecordList, StatGrid } from "@/components/system/ui";
import type { CreateWorkflowInput, WorkflowRecord } from "@/types/system";

const emptyWorkflowForm: CreateWorkflowInput = {
  name: "",
  description: "",
  config: {
    reportPrompt: "",
    extractorPrompt: "",
    validatorPrompt: "",
    projectBuilderPrompt: "",
    phaseProgressPrompt: "",
    phaseBuilderPrompt: "",
    phaseReportPrompt: ""
  }
};

export function WorkflowsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [form, setForm] = useState<CreateWorkflowInput>(emptyWorkflowForm);
  const [selectedPresetId, setSelectedPresetId] = useState<WorkflowPresetId>(defaultWorkflowPromptPreset.id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const data = await apiRequest<{ workflows: WorkflowRecord[] }>("/api/workflows", {
          session
        });

        if (active) {
          setWorkflows(data.workflows);
        }
      } catch (loadError) {
        if (active) {
          setFeedback(loadError instanceof Error ? loadError.message : "Failed to load workflows.");
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

  const summary = useMemo(
    () => ({
      total: workflows.length,
      runs: workflows.reduce((total, workflow) => total + workflow.runCount, 0),
      projects: workflows.reduce((total, workflow) => total + workflow.projectCount, 0)
    }),
    [workflows]
  );
  const selectedPreset = useMemo(
    () => getWorkflowPromptPreset(selectedPresetId),
    [selectedPresetId]
  );

  if (!session || sessionLoading) {
    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ workflow: WorkflowRecord }>("/api/workflows", {
        method: "POST",
        session,
        json: form
      });
      setForm(emptyWorkflowForm);
      setFeedback("Workflow created successfully.");
      router.push(`/workflows/${data.workflow.id}`);
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Workflow creation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Workflows"
      description="Create reusable AI workflows with preset prompts, then run unstructured input through the staged extraction and validation loop."
    >
      <PageSection title="Workflow overview" description="Every workflow stores reusable prompts and can generate projects after validation passes.">
        <StatGrid
          items={[
            {
              label: "Total Workflows",
              value: summary.total,
              helper: "Reusable workflow definitions stored in the system.",
              tone: "info"
            },
            {
              label: "Runs",
              value: summary.runs,
              helper: "Execution runs completed across all workflows.",
              tone: "warning"
            },
            {
              label: "Projects Created",
              value: summary.projects,
              helper: "Projects already added to the database from successful workflow passes.",
              tone: "success"
            }
          ]}
        />
      </PageSection>

      <div className="grid gap-6">
        <PageSection
          title="Create workflow"
          description="These prompt fields define the AI pipeline for intake, validation, project creation, phase progression, and phase reporting."
          action={
            <div className="grid w-full gap-3 md:w-[34rem] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="w-full">
                <SelectField
                  label="Preset workflow library"
                  value={selectedPresetId}
                  onChange={(event) => setSelectedPresetId(event.target.value as WorkflowPresetId)}
                >
                  {workflowPromptPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.title}
                    </option>
                  ))}
                </SelectField>
              </div>
              <PrimaryButton
                type="button"
                onClick={() =>
                  setForm({
                    ...selectedPreset.workflow,
                    config: { ...selectedPreset.workflow.config }
                  })
                }
              >
                Load preset
              </PrimaryButton>
            </div>
          }
        >
          <form className="grid gap-4" onSubmit={handleCreate}>
            <PromptGuideToggle variant="workflow" />
            <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
              <p className="text-card-title text-synapse-text">{selectedPreset.title}</p>
              <p className="mt-2 text-body text-synapse-muted">{selectedPreset.summary}</p>
              <p className="mt-3 text-body text-synapse-text">
                <span className="font-semibold">Fields used:</span> {selectedPreset.fieldsUsed.join(", ")}
              </p>
            </div>
            <FormField
              label="Workflow name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              hint="Name the workflow after the input type or business process it is meant to handle."
            />
            <TextAreaField
              label="Workflow description"
              required
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              hint="Describe what raw input this workflow receives, what business problem it solves, and what kind of projects or outcomes it should produce."
            />
            <TextAreaField
              label={getPromptFieldMeta("reportPrompt").label}
              required
              value={form.config.reportPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, reportPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("reportPrompt").hint}
            />
            <TextAreaField
              label={getPromptFieldMeta("extractorPrompt").label}
              required
              value={form.config.extractorPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, extractorPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("extractorPrompt").hint}
            />
            <TextAreaField
              label={getPromptFieldMeta("validatorPrompt").label}
              required
              value={form.config.validatorPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, validatorPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("validatorPrompt").hint}
            />
            <TextAreaField
              label={getPromptFieldMeta("projectBuilderPrompt").label}
              required
              value={form.config.projectBuilderPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, projectBuilderPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("projectBuilderPrompt").hint}
            />
            <TextAreaField
              label={getPromptFieldMeta("phaseProgressPrompt").label}
              required
              value={form.config.phaseProgressPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, phaseProgressPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("phaseProgressPrompt").hint}
            />
            <TextAreaField
              label={getPromptFieldMeta("phaseBuilderPrompt").label}
              required
              value={form.config.phaseBuilderPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, phaseBuilderPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("phaseBuilderPrompt").hint}
            />
            <TextAreaField
              label={getPromptFieldMeta("phaseReportPrompt").label}
              required
              value={form.config.phaseReportPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, phaseReportPrompt: event.target.value }
                }))
              }
              hint={getPromptFieldMeta("phaseReportPrompt").hint}
            />
            <PrimaryButton loading={submitting} type="submit">
              Create workflow
            </PrimaryButton>
          </form>
          {feedback ? (
            <p className={`text-body ${feedback.toLowerCase().includes("failed") ? "text-synapse-error" : "text-synapse-secondary"}`}>
              {feedback}
            </p>
          ) : null}
        </PageSection>

        <PageSection title="Workflow list" description="Open a workflow to edit prompts, run the pipeline, and inspect the run history.">
          {loading ? <p className="text-body text-synapse-muted">Loading workflows...</p> : null}
          {!loading ? (
            <RecordList
              items={workflows}
              emptyTitle="No workflows yet"
              emptyDescription="Create the first workflow to define how unstructured inputs should be turned into projects."
              renderItem={(workflow) => (
                <div
                  key={workflow.id}
                  className="rounded-2xl border border-synapse-border bg-synapse-elevated p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-white"
                >
                  <p className="text-card-title text-synapse-text">{workflow.name}</p>
                  <p className="mt-2 line-clamp-2 text-body text-synapse-muted">{workflow.description}</p>
                  <div className="mt-4 grid gap-2 text-meta text-synapse-muted md:grid-cols-3">
                    <span>{workflow.runCount} runs</span>
                    <span>{workflow.projectCount} projects</span>
                    <span>{workflow.lastRunAt ? formatDateTime(workflow.lastRunAt) : "Never run"}</span>
                  </div>
                  <div className="mt-4">
                    <PrimaryButton type="button" onClick={() => router.push(`/workflows/${workflow.id}`)}>
                      Open workflow
                    </PrimaryButton>
                  </div>
                </div>
              )}
            />
          ) : null}
        </PageSection>
      </div>

      {!loading && workflows.length === 0 ? (
        <PageSection title="Suggested prompt pattern">
          <EmptyBlock
            title="Start with a focused workflow"
            description="A good first workflow usually targets one input type, such as inventory disruption, customer feedback spikes, or branch demand change."
          />
        </PageSection>
      ) : null}
    </AppShell>
  );
}
