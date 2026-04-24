"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, FormField, PrimaryButton, TextAreaField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { sampleWorkflowTemplate } from "@/src/modules/system/sample-workflow";
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
    phaseBuilderPrompt: ""
  }
};

export function WorkflowsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, signOut } = useDemoSession();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [form, setForm] = useState<CreateWorkflowInput>(emptyWorkflowForm);
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
      <PageSection title="Workflow overview" description="Every workflow stores four preset prompts and can generate projects after validation passes.">
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PageSection
          title="Create workflow"
          description="These six prompt fields define the full AI pipeline for intake, validation, project creation, and later phase progression."
          action={
            <PrimaryButton type="button" onClick={() => setForm(sampleWorkflowTemplate)}>
              Load sample workflow
            </PrimaryButton>
          }
        >
          <form className="grid gap-4" onSubmit={handleCreate}>
            <FormField
              label="Workflow name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <TextAreaField
              label="Workflow description"
              required
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              hint="Explain what kind of unstructured input this workflow is meant to process."
            />
            <TextAreaField
              label="Preset prompt 1"
              required
              value={form.config.reportPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, reportPrompt: event.target.value }
                }))
              }
              hint="Instruction for the first AI report generated from the raw input."
            />
            <TextAreaField
              label="Preset prompt 2"
              required
              value={form.config.extractorPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, extractorPrompt: event.target.value }
                }))
              }
              hint="Instruction for the extractor AI."
            />
            <TextAreaField
              label="Preset prompt 3"
              required
              value={form.config.validatorPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, validatorPrompt: event.target.value }
                }))
              }
              hint="Instruction for the validation AI."
            />
            <TextAreaField
              label="Preset prompt 4"
              required
              value={form.config.projectBuilderPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, projectBuilderPrompt: event.target.value }
                }))
              }
              hint="Instruction for the project builder AI."
            />
            <TextAreaField
              label="Preset prompt 5"
              required
              value={form.config.phaseProgressPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, phaseProgressPrompt: event.target.value }
                }))
              }
              hint="Instruction for the phase progression AI."
            />
            <TextAreaField
              label="Preset prompt 6"
              required
              value={form.config.phaseBuilderPrompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  config: { ...current.config, phaseBuilderPrompt: event.target.value }
                }))
              }
              hint="Instruction for the phase builder AI."
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
                  className="rounded-[22px] border border-synapse-border bg-synapse-elevated p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-white"
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
