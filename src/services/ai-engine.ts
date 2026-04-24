import type {
  AiAnalysis,
  Approval,
  ExecutionUpdate,
  Phase,
  Plan,
  Priority,
  Project,
  ProjectInput,
  RiskLevel,
  Validation
} from "@/types";
import {
  RETRY_STRATEGY,
  getPromptPair,
  getRetrySchema,
  validateAiOutput,
  type AiModule,
  type ApprovalRecommendationInner,
  type ApprovalRecommendationOutput,
  type InputUnderstandingInner,
  type InputUnderstandingOutput,
  type OutcomeReviewInner,
  type OutcomeReviewOutput,
  type PhasePlanGenerationInner,
  type PhasePlanGenerationOutput,
  type ProjectIdentificationInner,
  type ProjectIdentificationOutput,
  type PromptContext,
  type ValidationInner,
  type ValidationOutput
} from "@/src/modules/ai";
import { resolveChatCompletionsEndpoint, runtimeConfig, shouldUseMockAi } from "@/src/config/runtime";
import { nowIso, plusDays } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

type ModuleOutputMap = {
  input_understanding: InputUnderstandingOutput;
  project_identification: ProjectIdentificationOutput;
  phase_plan_generation: PhasePlanGenerationOutput;
  validation: ValidationOutput;
  outcome_review: OutcomeReviewOutput;
  approval_recommendation: ApprovalRecommendationOutput;
};

function keywordMatch(text: string, words: string[]) {
  const lowered = text.toLowerCase();
  return words.some((word) => lowered.includes(word));
}

function classifyScenario(rawText: string) {
  const lowered = rawText.toLowerCase();

  if (keywordMatch(lowered, ["overstock", "excess stock", "slow-moving"])) {
    return "overstock_risk" as const;
  }

  if (keywordMatch(lowered, ["feedback", "complaint", "quality issue", "negative review"])) {
    return "negative_product_feedback_trend" as const;
  }

  if (keywordMatch(lowered, ["critical", "urgent", "72 hours", "escalat", "carrier disruption"])) {
    return "urgent_branch_escalation" as const;
  }

  if (keywordMatch(lowered, ["pricing", "markdown", "discount"])) {
    return "pricing_adjustment" as const;
  }

  if (keywordMatch(lowered, ["stock", "demand", "replenish", "restock"])) {
    return "low_stock_rising_demand" as const;
  }

  return "general_branch_signal" as const;
}

function deriveUrgencyFromScenario(scenario: ReturnType<typeof classifyScenario>): AiAnalysis["urgency"] {
  switch (scenario) {
    case "urgent_branch_escalation":
      return "critical";
    case "low_stock_rising_demand":
      return "high";
    case "overstock_risk":
    case "negative_product_feedback_trend":
    case "pricing_adjustment":
      return "medium";
    default:
      return "low";
  }
}

function deriveIssueDetails(
  scenario: ReturnType<typeof classifyScenario>,
  branchName: string
): Omit<InputUnderstandingInner, "confidence_score" | "suggest_project_creation"> {
  switch (scenario) {
    case "low_stock_rising_demand":
      return {
        issue_type: "low stock with rising demand",
        business_area: "inventory",
        branch: branchName,
        urgency: "high",
        summary: `${branchName} reports low stock while customer demand is increasing.`,
        risks: [
          "Sales may be lost if stock is not replenished.",
          "Customer satisfaction may decline if demand cannot be met."
        ],
        opportunities: [
          "Restock can capture rising demand.",
          "HQ can rebalance stock from branches with lower demand."
        ],
        missing_information: [
          "Current stock quantity",
          "Recent sales rate",
          "Requested restock quantity"
        ]
      };
    case "overstock_risk":
      return {
        issue_type: "overstock risk",
        business_area: "inventory",
        branch: branchName,
        urgency: "medium",
        summary: `${branchName} reports excess inventory and needs a controlled mitigation plan.`,
        risks: [
          "Inventory holding cost may increase.",
          "Product may require discounting if demand remains low."
        ],
        opportunities: [
          "Stock can be transferred to branches with stronger demand.",
          "Future replenishment can be adjusted before waste increases."
        ],
        missing_information: [
          "Current stock quantity",
          "Demand trend by branch",
          "Product expiry or markdown deadline"
        ]
      };
    case "negative_product_feedback_trend":
      return {
        issue_type: "negative product feedback trend",
        business_area: "customer feedback",
        branch: branchName,
        urgency: "medium",
        summary: `${branchName} reports recurring negative feedback that needs evidence-based follow-up.`,
        risks: [
          "Brand perception may decline if feedback is not addressed.",
          "Sales may fall if quality concerns persist."
        ],
        opportunities: [
          "Feedback can identify a targeted product or service improvement.",
          "HQ can coordinate a consistent response across branches."
        ],
        missing_information: [
          "Number of feedback cases",
          "Feedback period",
          "Affected product SKU or batch"
        ]
      };
    case "urgent_branch_escalation":
      return {
        issue_type: "urgent branch escalation",
        business_area: "branch operations",
        branch: branchName,
        urgency: "critical",
        summary: `${branchName} escalates an operational issue that may affect service continuity.`,
        risks: [
          "Branch operations may be disrupted.",
          "Customer commitments may be missed without timely action."
        ],
        opportunities: ["HQ can coordinate rapid support and reduce operational impact."],
        missing_information: [
          "Exact operational blocker",
          "Affected customers or services",
          "Required decision deadline"
        ]
      };
    case "pricing_adjustment":
      return {
        issue_type: "pricing adjustment request",
        business_area: "commercial",
        branch: branchName,
        urgency: "medium",
        summary: `${branchName} requests a pricing action that needs validation and HQ approval.`,
        risks: [
          "Margin may be reduced if the discount is not controlled.",
          "Customer expectations may change if pricing is inconsistent."
        ],
        opportunities: [
          "Pricing action can reduce excess inventory.",
          "Controlled promotion can improve sell-through."
        ],
        missing_information: [
          "Current stock quantity",
          "Margin impact",
          "Promotion duration and branch scope"
        ]
      };
    default:
      return {
        issue_type: "branch operational signal",
        business_area: "operations",
        branch: branchName,
        urgency: "low",
        summary: `${branchName} submitted an operational signal that needs structured review.`,
        risks: ["The issue may be under-scoped without additional evidence."],
        opportunities: ["Structured triage can clarify the next workflow step."],
        missing_information: [
          "Operational context",
          "Requested action",
          "Supporting evidence"
        ]
      };
  }
}

function confidenceFromText(rawText: string, urgency: AiAnalysis["urgency"]) {
  const hasMissingSignals = keywordMatch(rawText, ["unknown", "missing", "unclear", "not sure"]);

  if (urgency === "critical") {
    return hasMissingSignals ? 61 : 72;
  }

  if (urgency === "high") {
    return hasMissingSignals ? 72 : 84;
  }

  if (urgency === "medium") {
    return hasMissingSignals ? 66 : 78;
  }

  return hasMissingSignals ? 58 : 70;
}

function derivePriority(urgency: AiAnalysis["urgency"]): Priority {
  return urgency;
}

function deriveRiskLevel(urgency: AiAnalysis["urgency"]): RiskLevel {
  if (urgency === "critical" || urgency === "high") {
    return "high";
  }

  if (urgency === "medium") {
    return "medium";
  }

  return "low";
}

function fallbackInputUnderstanding(input: ProjectInput, branchName: string): InputUnderstandingOutput {
  const scenario = classifyScenario(input.raw_text);
  const base = deriveIssueDetails(scenario, branchName);

  return {
    input_understanding: {
      ...base,
      confidence_score: confidenceFromText(input.raw_text, base.urgency),
      suggest_project_creation: true
    }
  };
}

function fallbackProjectIdentification(
  analysis: AiAnalysis
): ProjectIdentificationOutput {
  const urgency = analysis.urgency;
  const prefix = analysis.branch === "HQ" ? "HQ" : analysis.branch;
  const projectTitle =
    urgency === "critical"
      ? `${prefix} critical response project`
      : `${prefix} ${analysis.issue_type}`;

  return {
    project_identification: {
      should_create_project: analysis.suggest_project_creation,
      project_title: toTitleCase(projectTitle),
      project_summary: analysis.summary,
      project_type: slugify(analysis.issue_type),
      recommended_owner:
        urgency === "critical" || analysis.business_area === "branch operations"
          ? "HQ"
          : "Branch Office",
      recommended_priority: derivePriority(urgency),
      recommended_initial_phase:
        urgency === "critical"
          ? "Stabilize branch operations"
          : analysis.business_area === "inventory"
            ? "Confirm demand and stock gap"
            : analysis.business_area === "customer feedback"
              ? "Validate feedback trend"
              : "Confirm project scope",
      supporting_reasons: [
        `The input indicates ${analysis.issue_type}.`,
        `Urgency is classified as ${analysis.urgency}.`,
        "A structured project is needed to track planning, validation, approval, and execution."
      ]
    }
  };
}

function fallbackPhasePlanGeneration(
  phase: Phase
): PhasePlanGenerationOutput {
  const loweredName = phase.phase_name.toLowerCase();
  const loweredObjective = phase.objective.toLowerCase();
  const inventoryScope = keywordMatch(`${loweredName} ${loweredObjective}`, [
    "stock",
    "inventory",
    "demand",
    "restock"
  ]);
  const feedbackScope = keywordMatch(`${loweredName} ${loweredObjective}`, [
    "feedback",
    "complaint",
    "quality"
  ]);
  const escalationScope = keywordMatch(`${loweredName} ${loweredObjective}`, [
    "escalat",
    "stabilize",
    "critical"
  ]);

  const actionSteps = inventoryScope
    ? [
        "Collect current stock quantity for the affected product.",
        "Collect recent sales rate for the last 7 to 14 days.",
        "Compare expected demand against remaining stock before the next replenishment cycle.",
        "Prepare a restock or transfer request if the gap is confirmed."
      ]
    : feedbackScope
      ? [
          "Collect customer feedback records for the relevant period.",
          "Group feedback by product, issue type, and branch touchpoint.",
          "Identify repeated patterns and unresolved issues.",
          "Summarize whether HQ action or supplier follow-up is required."
        ]
      : escalationScope
        ? [
            "Confirm the active operational blocker and impacted services.",
            "Document immediate risk to branch service continuity.",
            "Escalate required decisions to HQ owners.",
            "Track containment and recovery actions until the issue is stabilized."
          ]
        : [
            "Collect the missing evidence for the current phase objective.",
            "Validate branch assumptions against current operating constraints.",
            "Prepare a grounded summary for approval or execution."
          ];

  const requiredInputs = inventoryScope
    ? ["Current stock quantity", "Recent sales rate", "Requested restock quantity", "HQ stock availability"]
    : feedbackScope
      ? ["Feedback records", "Feedback period", "Affected product SKU or batch", "Current branch response"]
      : escalationScope
        ? ["Operational blocker summary", "Affected customers or services", "Decision deadline", "Current mitigation status"]
        : ["Current branch evidence", "Project context", "Required decision or outcome"];

  const estimatedRisk: RiskLevel = escalationScope ? "high" : inventoryScope || feedbackScope ? "medium" : "low";

  return {
    phase_plan_generation: {
      phase_name: phase.phase_name,
      objective: phase.objective,
      rationale: `Generate a grounded plan for ${phase.phase_name.toLowerCase()} using the current project context and available evidence.`,
      action_steps: actionSteps,
      responsible_party: phase.responsible_party,
      required_inputs: requiredInputs,
      expected_output:
        escalationScope
          ? "A bounded stabilization plan ready for HQ coordination."
          : "A grounded phase output ready for validation and approval.",
      dependencies:
        escalationScope
          ? ["Branch escalation evidence", "HQ response coordination"]
          : ["Project context", "Branch evidence"],
      estimated_risk: estimatedRisk,
      impact_if_successful:
        escalationScope
          ? "Branch operations can stabilize with clear HQ coordination."
          : "The project can move forward with a grounded and reviewable plan.",
      confidence_score: estimatedRisk === "high" ? 74 : estimatedRisk === "medium" ? 82 : 88
    }
  };
}

function fallbackValidation(plan: Plan): ValidationOutput {
  const missingInformation =
    plan.required_inputs.length > 3
      ? plan.required_inputs.slice(0, 2)
      : [];
  const highRisk = plan.estimated_risk === "high";

  return {
    validation: {
      groundedness_score: highRisk ? 68 : missingInformation.length > 0 ? 76 : 88,
      missing_information: missingInformation,
      unsupported_claims:
        missingInformation.length > 0
          ? ["The plan assumes required evidence will be available before approval."]
          : [],
      contradiction_flags: [],
      impact_analysis:
        highRisk || missingInformation.length > 0
          ? "The plan direction is reasonable, but more grounded evidence is required before approval or execution."
          : "The plan is grounded enough to proceed with normal monitoring.",
      mitigation_steps:
        missingInformation.length > 0
          ? ["Collect the missing evidence before approval.", "Keep the phase in validation until the gaps are resolved."]
          : ["Proceed and monitor execution evidence."],
      proceed_recommendation:
        highRisk || missingInformation.length > 0
          ? "human_review_required"
          : "proceed",
      human_review_level:
        highRisk || missingInformation.length > 0
          ? "required"
          : "optional"
    }
  };
}

function fallbackOutcomeReview(
  executionUpdate: ExecutionUpdate,
  currentPhase: Phase
): OutcomeReviewOutput {
  const successLevel = executionUpdate.success_level;
  const nextPhaseRequired = successLevel !== "successful" || executionUpdate.unresolved_issues.length > 0;

  return {
    outcome_review: {
      outcome_summary: executionUpdate.outcome_summary,
      success_level: successLevel,
      unresolved_issues: executionUpdate.unresolved_issues,
      lessons_learned:
        successLevel === "successful"
          ? ["Evidence-backed execution updates make the next decision clearer."]
          : ["Execution updates need concrete evidence and next-step clarity."],
      next_phase_required: nextPhaseRequired,
      next_phase_plan: nextPhaseRequired
        ? {
            phase_name:
              successLevel === "failed"
                ? "Resubmit execution evidence"
                : "Request HQ follow-up decision",
            objective:
              successLevel === "failed"
                ? "Collect missing execution evidence so the workflow can move forward."
                : "Resolve the remaining issues after the latest execution update.",
            rationale: `The current phase ${currentPhase.phase_name.toLowerCase()} still has unresolved items after execution.`,
            action_steps:
              successLevel === "failed"
                ? [
                    "Collect concrete evidence for the executed action.",
                    "Summarize what was completed and what remains unresolved.",
                    "Submit an updated execution_update for review."
                  ]
                : [
                    "Document the unresolved issue and owner.",
                    "Prepare the required follow-up decision request.",
                    "Route the next phase for HQ or branch action."
                  ],
            responsible_party: successLevel === "failed" ? "Branch Office" : "HQ",
            required_inputs:
              successLevel === "failed"
                ? ["Evidence text", "Outcome summary", "Unresolved issues"]
                : ["Execution evidence", "Decision owner", "Remaining blocker"],
            expected_output:
              successLevel === "failed"
                ? "Complete execution evidence ready for another review."
                : "A bounded follow-up phase ready for approval or execution.",
            dependencies: ["Latest execution_update", "Project workflow context"],
            estimated_risk: successLevel === "failed" ? "low" : "medium",
            impact_if_successful: "The workflow can continue with clearer evidence and ownership.",
            confidence_score: successLevel === "failed" ? 70 : 79
          }
        : {},
      improvement_suggestions:
        successLevel === "successful"
          ? ["Keep execution evidence attached to every update."]
          : ["Require outcome_summary and evidence_text before accepting execution updates."]
    }
  };
}

function fallbackApprovalRecommendation(
  project: Project,
  phase: Phase | null,
  validation: Validation | null
): ApprovalRecommendationOutput {
  const urgencyLevel = project.priority;
  const riskLevel =
    validation?.human_review_level === "required"
      ? "high"
      : validation?.human_review_level === "recommended"
        ? "medium"
        : deriveRiskLevel(project.priority);
  const decision =
    riskLevel === "high"
      ? "revise_requested"
      : riskLevel === "medium"
        ? "approved"
        : "approved";

  return {
    approval_recommendation: {
      request_summary: phase
        ? `Approval is requested for ${phase.phase_name.toLowerCase()} on ${project.title}.`
        : `Approval is requested for project ${project.title}.`,
      decision_recommendation: decision,
      reason_for_recommendation:
        riskLevel === "high"
          ? "More grounded evidence is required before the request should be approved."
          : "The request is sufficiently grounded to proceed with normal monitoring.",
      risk_level: riskLevel,
      urgency_level: urgencyLevel,
      confidence_score: riskLevel === "high" ? 71 : riskLevel === "medium" ? 79 : 87,
      required_human_checks:
        riskLevel === "high"
          ? ["Verify missing evidence from validation.", "Confirm branch and HQ constraints before deciding."]
          : ["Confirm the submitted evidence matches the requested action."]
    }
  };
}

async function executeAiModule<TModule extends AiModule>(
  module: TModule,
  context: PromptContext,
  fallbackOutput: ModuleOutputMap[TModule]
): Promise<ModuleOutputMap[TModule]> {
  if (shouldUseMockAi()) {
    return fallbackOutput;
  }

  const prompt = getPromptPair(module);

  try {
    const raw = await requestAiJson([
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.userTemplate(context) }
    ]);
    let validation = validateAiOutput(raw, module);

    if (!validation.valid) {
      let repairedRaw = raw;
      for (let attempt = 0; attempt < RETRY_STRATEGY.maxAttempts; attempt += 1) {
        repairedRaw = await requestAiJson([
          { role: "system", content: RETRY_STRATEGY.repairSystemPrompt },
          {
            role: "user",
            content: RETRY_STRATEGY.repairUserPrompt({
              module,
              invalidOutput: repairedRaw,
              validationErrors: validation.errors,
              requiredSchema: getRetrySchema(module)
            })
          }
        ]);
        validation = validateAiOutput(repairedRaw, module);
        if (validation.valid) {
          break;
        }
      }
    }

    if (!validation.valid || !validation.value) {
      return fallbackOutput;
    }

    return validation.value as ModuleOutputMap[TModule];
  } catch {
    return fallbackOutput;
  }
}

async function requestAiJson(messages: Array<{ role: "system" | "user"; content: string }>) {
  const response = await fetch(resolveChatCompletionsEndpoint(runtimeConfig.aiEndpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${runtimeConfig.aiApiKey}`
    },
    body: JSON.stringify({
      model: runtimeConfig.aiModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const content = extractContent(payload);

  if (!content) {
    throw new Error("AI provider did not return a text response.");
  }

  return content;
}

function extractContent(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  };

  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const choice = choices[0];

  if (isRecord(choice)) {
    const message = choice.message;

    if (isRecord(message)) {
      if (typeof message.content === "string") {
        return message.content;
      }

      if (Array.isArray(message.content)) {
        const textParts = message.content
          .filter(isRecord)
          .map((item) => item.text)
          .filter((item): item is string => typeof item === "string");

        if (textParts.length > 0) {
          return textParts.join("");
        }
      }
    }
  }

  return "";
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function analyzeInputWithAi(input: ProjectInput, branchName: string) {
  const fallback = fallbackInputUnderstanding(input, branchName);
  const output = await executeAiModule("input_understanding", {
    userRole: "Branch Office",
    inputData: {
      source_type: input.source_type,
      raw_text: input.raw_text,
      file_url: input.file_url
    }
  }, fallback);

  const result: AiAnalysis = {
    id: createId(),
    input_id: input.id,
    ...output.input_understanding,
    created_at: nowIso()
  };

  return {
    input_understanding: output.input_understanding,
    ai_analysis: result
  };
}

export async function identifyProjectWithAi(
  input: ProjectInput,
  analysis: AiAnalysis,
  createdBy: string,
  branchId: string
) {
  const fallback = fallbackProjectIdentification(analysis);
  const output = await executeAiModule("project_identification", {
    userRole: "Branch Office",
    currentProjectContext: {
      ai_analysis: analysis
    },
    inputData: {
      source_type: input.source_type,
      raw_text: input.raw_text,
      file_url: input.file_url
    }
  }, fallback);

  const identification = output.project_identification;
  const project: Project = {
    id: createId(),
    title: identification.project_title,
    summary: identification.project_summary,
    project_type: identification.project_type,
    branch_id: branchId,
    created_by: createdBy,
    owner_role: identification.recommended_owner,
    priority: identification.recommended_priority,
    status: "active",
    ai_confidence: analysis.confidence_score,
    approval_status: "pending",
    created_at: nowIso(),
    updated_at: nowIso()
  };

  return {
    project_identification: identification,
    project
  };
}

export async function generatePhasePlanWithAi(
  phase: Phase,
  context?: { project?: Project | null; analysis?: AiAnalysis | null; validation?: Validation | null }
) {
  const fallback = fallbackPhasePlanGeneration(phase);
  const output = await executeAiModule("phase_plan_generation", {
    userRole: phase.responsible_party,
    currentProjectContext: {
      project: context?.project ?? null,
      ai_analysis: context?.analysis ?? null,
      validation: context?.validation ?? null
    },
    inputData: {
      phase
    }
  }, fallback);

  const plan: Plan = {
    id: createId(),
    phase_id: phase.id,
    objective: output.phase_plan_generation.objective,
    rationale: output.phase_plan_generation.rationale,
    action_steps: output.phase_plan_generation.action_steps,
    required_inputs: output.phase_plan_generation.required_inputs,
    expected_output: output.phase_plan_generation.expected_output,
    dependencies: output.phase_plan_generation.dependencies,
    estimated_risk: output.phase_plan_generation.estimated_risk,
    impact_if_successful: output.phase_plan_generation.impact_if_successful,
    confidence_score: output.phase_plan_generation.confidence_score,
    version: 1,
    created_at: nowIso()
  };

  return {
    phase_plan_generation: output.phase_plan_generation,
    plan
  };
}

export async function validatePlanWithAi(
  phase: Phase,
  plan: Plan,
  context?: { project?: Project | null; analysis?: AiAnalysis | null }
) {
  const fallback = fallbackValidation(plan);
  const output = await executeAiModule("validation", {
    userRole: phase.responsible_party,
    currentProjectContext: {
      project: context?.project ?? null,
      ai_analysis: context?.analysis ?? null,
      phase
    },
    inputData: {
      plan
    }
  }, fallback);

  const validationRecord: Validation = {
    id: createId(),
    phase_id: phase.id,
    ...output.validation,
    validated_at: nowIso()
  };

  return {
    validation: output.validation,
    validation_record: validationRecord
  };
}

export async function reviewOutcomeWithAi(
  executionUpdate: ExecutionUpdate,
  currentPhase: Phase,
  project?: Project | null
) {
  const fallback = fallbackOutcomeReview(executionUpdate, currentPhase);
  const output = await executeAiModule("outcome_review", {
    userRole: currentPhase.responsible_party,
    currentProjectContext: {
      phase: currentPhase,
      project: project ?? null
    },
    inputData: {
      execution_update: executionUpdate
    }
  }, fallback);
  const inner = output.outcome_review;
  const nextPhasePlan = inner.next_phase_plan as Partial<PhasePlanGenerationInner>;

  return {
    outcome_review: inner,
    review: {
      review_id: createId(),
      phase_id: currentPhase.id,
      summary: inner.outcome_summary,
      next_phase_needed: inner.next_phase_required,
      recommended_phase:
        inner.next_phase_required && typeof nextPhasePlan.phase_name === "string"
          ? nextPhasePlan.phase_name
          : "Close review",
      confidence_score:
        inner.next_phase_required && typeof nextPhasePlan.confidence_score === "number"
          ? nextPhasePlan.confidence_score
          : inner.success_level === "successful"
            ? 88
            : 72,
      due_date: plusDays(inner.success_level === "successful" ? 5 : 3)
    }
  };
}

export async function recommendApprovalWithAi(
  project: Project,
  phase: Phase | null,
  validation: Validation | null
): Promise<{
  approval_recommendation: ApprovalRecommendationInner;
  recommendation: Pick<Approval, "request_type" | "request_summary" | "ai_recommendation" | "risk_level">;
}> {
  const fallback = fallbackApprovalRecommendation(project, phase, validation);
  const output = await executeAiModule("approval_recommendation", {
    userRole: "HQ",
    currentProjectContext: {
      project,
      phase,
      validation
    },
    inputData: {
      project_id: project.id,
      phase_id: phase?.id ?? null
    }
  }, fallback);
  const inner = output.approval_recommendation;

  return {
    approval_recommendation: inner,
    recommendation: {
      request_type: phase ? `${slugify(phase.phase_name)}_approval` : "project_approval",
      request_summary: inner.request_summary,
      ai_recommendation: `${inner.decision_recommendation}: ${inner.reason_for_recommendation}`,
      risk_level: inner.risk_level
    }
  };
}
