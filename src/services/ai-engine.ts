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
import { shouldUseMockAi } from "@/src/config/runtime";
import { nowIso, plusDays } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

function keywordMatch(text: string, words: string[]) {
  const lowered = text.toLowerCase();
  return words.some((word) => lowered.includes(word));
}

function deriveUrgency(rawText: string): AiAnalysis["urgency"] {
  if (keywordMatch(rawText, ["critical", "urgent", "72 hours", "escalat"])) {
    return "critical";
  }

  if (keywordMatch(rawText, ["stock-out", "low stock", "negative", "complaint"])) {
    return "high";
  }

  if (keywordMatch(rawText, ["overstock", "pricing", "excess"])) {
    return "medium";
  }

  return "low";
}

function derivePriority(urgency: AiAnalysis["urgency"]): Priority {
  return urgency;
}

function deriveRiskLevel(urgency: AiAnalysis["urgency"]): RiskLevel {
  if (urgency === "critical") {
    return "high";
  }

  if (urgency === "high") {
    return "high";
  }

  if (urgency === "medium") {
    return "medium";
  }

  return "low";
}

function deriveIssueType(rawText: string) {
  const lowered = rawText.toLowerCase();

  if (lowered.includes("overstock")) {
    return "overstock_risk";
  }

  if (lowered.includes("feedback") || lowered.includes("complaint")) {
    return "negative_feedback_trend";
  }

  if (lowered.includes("pricing")) {
    return "pricing_action";
  }

  if (lowered.includes("escalat") || lowered.includes("carrier")) {
    return "fulfillment_disruption";
  }

  if (lowered.includes("stock")) {
    return "inventory_shortage";
  }

  return "branch_signal";
}

function deriveBusinessArea(issueType: string) {
  if (issueType.includes("inventory") || issueType.includes("stock")) {
    return "inventory";
  }

  if (issueType.includes("feedback")) {
    return "customer_experience";
  }

  if (issueType.includes("pricing")) {
    return "commercial";
  }

  if (issueType.includes("fulfillment")) {
    return "operations";
  }

  return "operations";
}

function confidenceFromUrgency(urgency: AiAnalysis["urgency"]) {
  if (urgency === "critical") {
    return 92;
  }

  if (urgency === "high") {
    return 86;
  }

  if (urgency === "medium") {
    return 78;
  }

  return 72;
}

export async function analyzeInputWithAi(input: ProjectInput, branchName: string) {
  const urgency = deriveUrgency(input.raw_text);
  const issueType = deriveIssueType(input.raw_text);
  const businessArea = deriveBusinessArea(issueType);
  const confidence = confidenceFromUrgency(urgency);

  const result: AiAnalysis = {
    id: createId(),
    input_id: input.id,
    issue_type: issueType,
    business_area: businessArea,
    branch: branchName,
    urgency,
    summary: `AI identified ${issueType.replaceAll("_", " ")} for ${branchName}.`,
    risks:
      urgency === "critical"
        ? ["Immediate service disruption", "Potential branch escalation"]
        : urgency === "high"
          ? ["Revenue impact if response is delayed", "Operational instability"]
          : ["Response may underperform without more evidence"],
    opportunities:
      issueType === "inventory_shortage"
        ? ["Create restock project", "Tune replenishment timing"]
        : issueType === "overstock_risk"
          ? ["Review transfer options", "Prepare pricing action"]
          : ["Create a structured response project"],
    missing_information: keywordMatch(input.raw_text, ["unknown", "missing"])
      ? ["Additional branch evidence required"]
      : issueType === "inventory_shortage"
        ? ["Supplier lead time confirmation"]
        : issueType === "overstock_risk"
          ? ["Current sell-through by SKU"]
          : [],
    confidence_score: confidence,
    suggest_project_creation: true,
    created_at: nowIso()
  };

  if (!shouldUseMockAi()) {
    return result;
  }

  return result;
}

export async function generatePhasePlanWithAi(phase: Phase): Promise<Plan> {
  const highRisk = phase.phase_name.toLowerCase().includes("escalation") || phase.phase_name.toLowerCase().includes("contingency");

  return {
    id: createId(),
    phase_id: phase.id,
    objective: phase.objective,
    rationale: `AI generated a plan for ${phase.phase_name.toLowerCase()} based on the current project context.`,
    action_steps: [
      `Review evidence for ${phase.phase_name.toLowerCase()}`,
      "Confirm missing dependencies",
      "Prepare approval-ready summary"
    ],
    required_inputs: ["Branch input", "Latest ai_analysis", "Current operating constraints"],
    expected_output: `A validated outcome for ${phase.phase_name.toLowerCase()}.`,
    dependencies: ["Project approval state", "Branch readiness"],
    estimated_risk: highRisk ? "high" : "medium",
    impact_if_successful: "Moves the project forward with a grounded action plan.",
    confidence_score: highRisk ? 82 : 88,
    version: 1,
    created_at: nowIso()
  };
}

export async function validatePlanWithAi(phase: Phase, plan: Plan): Promise<Validation> {
  const needsHumanReview = plan.estimated_risk === "high" || plan.required_inputs.length > 2;
  const missingInformation = phase.objective.toLowerCase().includes("confirm")
    ? ["External confirmation still required"]
    : [];

  return {
    id: createId(),
    phase_id: phase.id,
    groundedness_score: needsHumanReview ? 74 : 88,
    missing_information: missingInformation,
    unsupported_claims: missingInformation.length > 0 ? ["Projected outcome assumes confirmation not yet available."] : [],
    contradiction_flags: [],
    impact_analysis: needsHumanReview
      ? "The plan is structurally sound but still needs human review before final approval."
      : "The plan is grounded enough to proceed into the approval workflow.",
    mitigation_steps: missingInformation.length > 0 ? ["Collect the missing evidence before approval."] : ["Monitor execution carefully."],
    proceed_recommendation: needsHumanReview ? "human_review_required" : "proceed",
    human_review_level: needsHumanReview ? "required" : "optional",
    validated_at: nowIso()
  };
}

export async function createProjectDraftFromAnalysis(
  input: ProjectInput,
  analysis: AiAnalysis,
  createdBy: string,
  branchId: string,
  ownerRole: Project["owner_role"]
): Promise<Project> {
  return {
    id: createId(),
    title: `${analysis.branch} ${analysis.issue_type.replaceAll("_", " ")}`,
    summary: analysis.summary,
    project_type: analysis.issue_type,
    branch_id: branchId,
    created_by: createdBy,
    owner_role: ownerRole,
    priority: derivePriority(analysis.urgency),
    status: "active",
    ai_confidence: analysis.confidence_score,
    approval_status: "pending",
    created_at: nowIso(),
    updated_at: nowIso()
  };
}

export async function reviewOutcomeWithAi(executionUpdate: ExecutionUpdate, currentPhase: Phase) {
  const successful = executionUpdate.success_level === "successful";

  return {
    review_id: createId(),
    phase_id: currentPhase.id,
    summary: successful
      ? "Execution outcome supports moving into the next improvement phase."
      : "Execution outcome needs follow-up before a clean next phase can be generated.",
    next_phase_needed: successful || executionUpdate.success_level === "partial",
    recommended_phase: successful ? "Improvement cycle" : "Remediation review",
    confidence_score: successful ? 87 : 76,
    due_date: plusDays(successful ? 5 : 3)
  };
}

export async function recommendApprovalWithAi(project: Project, phase: Phase | null, validation: Validation | null): Promise<Pick<Approval, "request_type" | "request_summary" | "ai_recommendation" | "risk_level">> {
  const riskLevel = validation
    ? validation.human_review_level === "required"
      ? "high"
      : validation.human_review_level === "recommended"
        ? "medium"
        : "low"
    : project.priority === "critical" || project.priority === "high"
      ? "high"
      : project.priority === "medium"
        ? "medium"
        : "low";

  return {
    request_type: phase ? `${phase.phase_name.toLowerCase().replaceAll(" ", "_")}_approval` : "project_approval",
    request_summary: phase
      ? `Request approval for ${phase.phase_name.toLowerCase()} on ${project.title}.`
      : `Request project approval for ${project.title}.`,
    ai_recommendation:
      riskLevel === "high"
        ? "Require HQ review before execution."
        : riskLevel === "medium"
          ? "Proceed with caution and monitor missing information."
          : "Proceed.",
    risk_level: riskLevel
  };
}
