"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { SecondaryButton } from "@/components";

export type PromptGuideVariant = "workflow" | "request";
export type PromptGuideNumber = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type PromptGuideDefinition = {
  id: PromptGuideNumber;
  title: string;
  usedIn: string;
  input: string;
  output: string;
  purpose: string;
  writingHint: string;
};

const promptWritingPrinciples = [
  {
    title: "One job",
    detail: "Each prompt should do one narrow task only, not multiple decisions at once."
  },
  {
    title: "Define input",
    detail: "State exactly what the AI will receive, such as raw text, extracted facts, or phase outcomes."
  },
  {
    title: "Define output",
    detail: "Describe what must come back, such as a report, bullet facts, validation result, or recommendation."
  },
  {
    title: "Set rules",
    detail: "Tell the AI what to avoid, how strict to be, and what business logic or tone it must follow."
  }
];

const promptGuideDefinitions: Record<PromptGuideNumber, PromptGuideDefinition> = {
  "1": {
    id: "1",
    title: "Understand input",
    usedIn: "Workflow start",
    input: "Unstructured text and attached files",
    output: "Structured factual report",
    purpose: "What is going on?",
    writingHint:
      "Tell the AI what business context to identify, what report sections to produce, what facts must be included, and what tone the report should use."
  },
  "2": {
    id: "2",
    title: "Extract facts",
    usedIn: "Shared core step",
    input: "Generated report",
    output: "Clean key facts",
    purpose: "What are the important facts only?",
    writingHint:
      "Tell the AI to strip away filler, keep only concrete facts, and return short, decision-ready points instead of narrative text."
  },
  "3": {
    id: "3",
    title: "Validate truth",
    usedIn: "Shared core step",
    input: "Extracted facts plus original input",
    output: "Pass or fail with feedback",
    purpose: "Is this information reliable?",
    writingHint:
      "Tell the AI how strict it should be, what counts as missing support or contradiction, and what retry guidance it should give when validation fails."
  },
  "4": {
    id: "4",
    title: "Build projects",
    usedIn: "Workflow after validation",
    input: "Validated information",
    output: "Project candidates",
    purpose: "What projects should we create?",
    writingHint:
      "Tell the AI how to turn validated facts into projects, what fields each project must include, and how specific the title, summary, plans, and expected outcome must be."
  },
  "5": {
    id: "5",
    title: "Decide next phase",
    usedIn: "Project execution loop",
    input: "Previous plan plus outcome",
    output: "Decision to continue or end",
    purpose: "What should happen next?",
    writingHint:
      "Tell the AI how to judge progress, when to close the project, when to continue, and what evidence should justify the next-phase decision."
  },
  "6": {
    id: "6",
    title: "Build next phase",
    usedIn: "After prompt 5",
    input: "Decision from prompt 5",
    output: "Actionable next-phase plan",
    purpose: "What exactly should we do next?",
    writingHint:
      "Tell the AI to produce a concrete phase plan with a clear objective, practical action steps, and an expected outcome that can later be checked."
  },
  "7": {
    id: "7",
    title: "Understand request",
    usedIn: "Approval system",
    input: "Request application",
    output: "Structured request report",
    purpose: "What is this request about?",
    writingHint:
      "Tell the AI to summarize the request scope, urgency, business reason, supporting evidence, and decision-relevant risks in a factual report."
  },
  "8": {
    id: "8",
    title: "Approval decision",
    usedIn: "Approval system",
    input: "Validated request information",
    output: "Approve or reject with reason",
    purpose: "Should we approve this?",
    writingHint:
      "Tell the AI what approval criteria to apply, what risks or gaps should cause rejection, and how the recommendation reason should be written."
  },
  "9": {
    id: "9",
    title: "Generate report",
    usedIn: "Reporting feature",
    input: "All project phase data",
    output: "Full project progress report",
    purpose: "What is the overall progress?",
    writingHint:
      "Tell the AI to write a management-ready report that summarizes progress, completed work, current status, unresolved gaps, and the immediate next focus."
  }
};

const promptFieldMap = {
  reportPrompt: "1",
  extractorPrompt: "2",
  validatorPrompt: "3",
  projectBuilderPrompt: "4",
  phaseProgressPrompt: "5",
  phaseBuilderPrompt: "6",
  requestAnalysisPrompt: "7",
  requestRecommendationPrompt: "8",
  phaseReportPrompt: "9"
} as const;

const workflowPromptIds: PromptGuideNumber[] = ["1", "2", "3", "4", "5", "6", "9"];
const requestPromptIds: PromptGuideNumber[] = ["7", "2", "3", "8"];

const workflowFlows = [
  {
    title: "Workflow creation",
    logic: "Prompt 1 -> Prompt 2 -> Prompt 3 -> Prompt 4",
    detail:
      "Understand the raw input, extract the key facts, validate those facts, then turn validated information into projects."
  },
  {
    title: "Project phase loop",
    logic: "Prompt 5 -> Prompt 2 -> Prompt 3 -> Prompt 6",
    detail:
      "Decide what should happen next, extract and validate the outcome context, then build the next phase plan."
  },
  {
    title: "Request approval",
    logic: "Prompt 7 -> Prompt 2 -> Prompt 3 -> Prompt 8",
    detail:
      "Understand the request, extract the decision facts, validate them, then recommend approve or reject."
  },
  {
    title: "Reporting",
    logic: "Prompt 9 (+ validation loop)",
    detail:
      "Generate a full progress report from project phase records, then keep refining until the report passes validation."
  }
];

const requestFlows = [
  {
    title: "Request approval",
    logic: "Prompt 7 -> Prompt 2 -> Prompt 3 -> Prompt 8",
    detail:
      "Understand the request, extract the decision facts, validate them, then recommend approve or reject."
  }
];

export function getPromptFieldMeta(
  key: keyof typeof promptFieldMap
): { label: string; hint: string } {
  const definition = promptGuideDefinitions[promptFieldMap[key]];

  return {
    label: `Preset prompt ${definition.id} - ${definition.title}`,
    hint: definition.writingHint
  };
}

export function PromptGuideToggle({ variant }: { variant: PromptGuideVariant }) {
  const [open, setOpen] = useState(false);
  const promptIds = useMemo(
    () => (variant === "workflow" ? workflowPromptIds : requestPromptIds),
    [variant]
  );
  const flows = useMemo(
    () => (variant === "workflow" ? workflowFlows : requestFlows),
    [variant]
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <SecondaryButton
          type="button"
          onClick={() => setOpen((current) => !current)}
          icon={open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        >
          {open ? "Hide prompt guide" : "Show prompt guide"}
        </SecondaryButton>
      </div>
      {open ? (
        <div className="grid gap-5 border-t border-synapse-border pt-4">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 text-synapse-secondary" />
            <div className="grid gap-1">
              <p className="text-card-title text-synapse-text">Prompt writing guide</p>
              <p className="text-body text-synapse-muted">
                Write each prompt as an instruction for one narrow job. Be explicit about the input, the expected output, the business rules, and the tone.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {promptWritingPrinciples.map((principle) => (
              <div
                key={principle.title}
                className="rounded-[18px] border border-synapse-border bg-white px-4 py-3"
              >
                <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                  {principle.title}
                </p>
                <p className="mt-2 text-body text-synapse-text">{principle.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <div>
              <p className="text-card-title text-synapse-text">Prompt flow</p>
              <p className="mt-1 text-body text-synapse-muted">
                Use this to understand where each prompt is called in the system.
              </p>
            </div>
            {flows.map((flow) => (
              <div
                key={flow.title}
                className="grid gap-2 rounded-[18px] border border-synapse-border bg-white p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:items-start"
              >
                <div>
                  <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                    {flow.title}
                  </p>
                  <p className="mt-2 text-body font-semibold text-synapse-text">{flow.logic}</p>
                </div>
                <p className="text-body text-synapse-muted">{flow.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <div>
              <p className="text-card-title text-synapse-text">Prompt reference</p>
              <p className="mt-1 text-body text-synapse-muted">
                Use the matching prompt below when writing or editing the instruction in this form.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {promptIds.map((promptId) => {
              const prompt = promptGuideDefinitions[promptId];

              return (
                <div
                  key={prompt.id}
                  className="rounded-[18px] border border-synapse-border bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-blue-200 bg-blue-50 text-body font-semibold text-synapse-primary">
                      {prompt.id}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-synapse-text">{prompt.title}</p>
                      <p className="mt-1 text-body text-synapse-muted">{prompt.purpose}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                          Used in
                        </p>
                        <p className="mt-1 text-body text-synapse-text">{prompt.usedIn}</p>
                      </div>
                      <div>
                        <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                          Output
                        </p>
                        <p className="mt-1 text-body text-synapse-text">{prompt.output}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                        Input
                      </p>
                      <p className="mt-1 text-body text-synapse-text">{prompt.input}</p>
                    </div>

                    <div className="border-t border-synapse-border pt-3">
                      <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">
                        How to write it
                      </p>
                      <p className="mt-1 text-body text-synapse-muted">{prompt.writingHint}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {variant === "request" ? (
            <p className="text-body text-synapse-muted">
              Prompts 2 and 3 are shared core prompts from the workflow configuration and are reused here during request review.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
