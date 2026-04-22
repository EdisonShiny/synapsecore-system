import type {
  AiAnalysis,
  Approval,
  ExecutionUpdate,
  HumanReviewLevel,
  Phase,
  Plan,
  Priority,
  ProceedRecommendation,
  Project,
  ProjectInput,
  RiskLevel,
  Urgency,
  Validation
} from "@/types";
import { runtimeConfig, shouldUseMockAi } from "@/src/config/runtime";
import { nowIso, plusDays } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

type GlmMessage = {
  role: "system" | "user";
  content: string;
};

type OutcomeReview = {
  review_id: string;
  phase_id: string;
  summary: string;
  next_phase_needed: boolean;
  recommended_phase: string;
  confidence_score: number;
  due_date: string;
};

class AiProviderError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

const systemPrompt =
  "You are the central reasoning engine for SynapseCore, an HQ and Branch Office workflow automation system. Return only valid JSON that matches the requested schema. Do not wrap JSON in markdown.";

const transientProviderStatuses = new Set([408, 429, 500, 502, 503, 504]);

function isTransientProviderError(error: unknown): error is AiProviderError {
  return error instanceof AiProviderError && transientProviderStatuses.has(error.status);
}

async function wait(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withAiProviderFallback<T>(request: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isTransientProviderError(error)) {
      console.warn(`${error.message} Falling back to mock AI output.`);
      return fallback();
    }

    throw error;
  }
}

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
  if (urgency === "critical" || urgency === "high") {
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

function clampScore(value: unknown, fallback: number) {
  const numberValue = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length > 0 ? items : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function extractJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error("GLM response did not contain a JSON object.");
  }

  return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
}

async function callGlmJson(task: string, context: unknown) {
  const requestBody = JSON.stringify({
    model: runtimeConfig.zaiModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify({ task, context }) }
    ] satisfies GlmMessage[],
    temperature: 0.2,
    stream: false,
    response_format: { type: "json_object" }
  });

  let response: Response | null = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      response = await fetch(`${runtimeConfig.zaiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${runtimeConfig.zaiApiKey}`,
          "Content-Type": "application/json",
          "Accept-Language": "en-US,en"
        },
        body: requestBody
      });
    } catch (error) {
      if (attempt === 1) {
        await wait(300);
        continue;
      }

      throw new AiProviderError(503, `AI provider request could not be completed: ${error instanceof Error ? error.message : "network error"}`);
    }

    if (response.ok || !transientProviderStatuses.has(response.status) || attempt === 2) {
      break;
    }

    await wait(300);
  }

  if (!response?.ok) {
    const body = response ? await response.text() : "";
    const status = response?.status ?? 503;
    throw new AiProviderError(status, `AI request failed with ${status}: ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return extractJsonObject(content);
}

function mockAnalyzeInput(input: ProjectInput, branchName: string): AiAnalysis {
  const urgency = deriveUrgency(input.raw_text);
  const issueType = deriveIssueType(input.raw_text);
  const businessArea = deriveBusinessArea(issueType);
  const confidence = confidenceFromUrgency(urgency);

  return {
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
}

function normalizeAnalysis(data: Record<string, unknown>, input: ProjectInput, branchName: string): AiAnalysis {
  const mock = mockAnalyzeInput(input, branchName);
  return {
    id: createId(),
    input_id: input.id,
    issue_type: asString(data.issue_type, mock.issue_type),
    business_area: asString(data.business_area, mock.business_area),
    branch: asString(data.branch, branchName),
    urgency: oneOf<Urgency>(data.urgency, ["low", "medium", "high", "critical"], mock.urgency),
    summary: asString(data.summary, mock.summary),
    risks: asStringArray(data.risks, mock.risks),
    opportunities: asStringArray(data.opportunities, mock.opportunities),
    missing_information: asStringArray(data.missing_information, mock.missing_information),
    confidence_score: clampScore(data.confidence_score, mock.confidence_score),
    suggest_project_creation: asBoolean(data.suggest_project_creation, true),
    created_at: nowIso()
  };
}

export async function analyzeInputWithAi(input: ProjectInput, branchName: string) {
  if (shouldUseMockAi()) {
    return mockAnalyzeInput(input, branchName);
  }

  const data = await withAiProviderFallback(
    () =>
      callGlmJson(
        "Analyze an unstructured branch input and return JSON with: issue_type, business_area, branch, urgency(low|medium|high|critical), summary, risks(string[]), opportunities(string[]), missing_information(string[]), confidence_score(0-100), suggest_project_creation(boolean).",
        { branchName, source_type: input.source_type, raw_text: input.raw_text, file_url: input.file_url }
      ),
    () => mockAnalyzeInput(input, branchName)
  );

  return normalizeAnalysis(data, input, branchName);
}

function mockPhasePlan(phase: Phase): Plan {
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

function normalizePlan(data: Record<string, unknown>, phase: Phase): Plan {
  const mock = mockPhasePlan(phase);
  return {
    id: createId(),
    phase_id: phase.id,
    objective: asString(data.objective, phase.objective),
    rationale: asString(data.rationale, mock.rationale),
    action_steps: asStringArray(data.action_steps, mock.action_steps),
    required_inputs: asStringArray(data.required_inputs, mock.required_inputs),
    expected_output: asString(data.expected_output, mock.expected_output),
    dependencies: asStringArray(data.dependencies, mock.dependencies),
    estimated_risk: oneOf<RiskLevel>(data.estimated_risk, ["low", "medium", "high"], mock.estimated_risk),
    impact_if_successful: asString(data.impact_if_successful, mock.impact_if_successful),
    confidence_score: clampScore(data.confidence_score, mock.confidence_score),
    version: 1,
    created_at: nowIso()
  };
}

export async function generatePhasePlanWithAi(phase: Phase): Promise<Plan> {
  if (shouldUseMockAi()) {
    return mockPhasePlan(phase);
  }

  const data = await withAiProviderFallback(
    () =>
      callGlmJson(
        "Generate a phase plan and return JSON with: objective, rationale, action_steps(string[]), required_inputs(string[]), expected_output, dependencies(string[]), estimated_risk(low|medium|high), impact_if_successful, confidence_score(0-100).",
        phase
      ),
    () => mockPhasePlan(phase)
  );

  return normalizePlan(data, phase);
}

function mockValidation(phase: Phase, plan: Plan): Validation {
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

function normalizeValidation(data: Record<string, unknown>, phase: Phase, plan: Plan): Validation {
  const mock = mockValidation(phase, plan);
  return {
    id: createId(),
    phase_id: phase.id,
    groundedness_score: clampScore(data.groundedness_score, mock.groundedness_score),
    missing_information: asStringArray(data.missing_information, mock.missing_information),
    unsupported_claims: asStringArray(data.unsupported_claims, mock.unsupported_claims),
    contradiction_flags: asStringArray(data.contradiction_flags, mock.contradiction_flags),
    impact_analysis: asString(data.impact_analysis, mock.impact_analysis),
    mitigation_steps: asStringArray(data.mitigation_steps, mock.mitigation_steps),
    proceed_recommendation: oneOf<ProceedRecommendation>(
      data.proceed_recommendation,
      ["proceed", "proceed_with_caution", "human_review_required", "do_not_proceed"],
      mock.proceed_recommendation
    ),
    human_review_level: oneOf<HumanReviewLevel>(data.human_review_level, ["optional", "recommended", "required"], mock.human_review_level),
    validated_at: nowIso()
  };
}

export async function validatePlanWithAi(phase: Phase, plan: Plan): Promise<Validation> {
  if (shouldUseMockAi()) {
    return mockValidation(phase, plan);
  }

  const data = await withAiProviderFallback(
    () =>
      callGlmJson(
        "Validate whether a workflow phase plan is grounded, complete, and safe to execute. Return JSON with: groundedness_score(0-100), missing_information(string[]), unsupported_claims(string[]), contradiction_flags(string[]), impact_analysis, mitigation_steps(string[]), proceed_recommendation(proceed|proceed_with_caution|human_review_required|do_not_proceed), human_review_level(optional|recommended|required).",
        { phase, plan }
      ),
    () => mockValidation(phase, plan)
  );

  return normalizeValidation(data, phase, plan);
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

function mockOutcomeReview(executionUpdate: ExecutionUpdate, currentPhase: Phase): OutcomeReview {
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

function normalizeOutcomeReview(data: Record<string, unknown>, executionUpdate: ExecutionUpdate, currentPhase: Phase): OutcomeReview {
  const mock = mockOutcomeReview(executionUpdate, currentPhase);
  return {
    review_id: createId(),
    phase_id: currentPhase.id,
    summary: asString(data.summary, mock.summary),
    next_phase_needed: asBoolean(data.next_phase_needed, mock.next_phase_needed),
    recommended_phase: asString(data.recommended_phase, mock.recommended_phase),
    confidence_score: clampScore(data.confidence_score, mock.confidence_score),
    due_date: asString(data.due_date, mock.due_date)
  };
}

export async function reviewOutcomeWithAi(executionUpdate: ExecutionUpdate, currentPhase: Phase) {
  if (shouldUseMockAi()) {
    return mockOutcomeReview(executionUpdate, currentPhase);
  }

  const data = await withAiProviderFallback(
    () =>
      callGlmJson(
        "Review a phase execution update, decide whether a next phase is required, and return JSON with: summary, next_phase_needed(boolean), recommended_phase, confidence_score(0-100), due_date(ISO date string).",
        { executionUpdate, currentPhase }
      ),
    () => mockOutcomeReview(executionUpdate, currentPhase)
  );

  return normalizeOutcomeReview(data, executionUpdate, currentPhase);
}

function mockApprovalRecommendation(
  project: Project,
  phase: Phase | null,
  validation: Validation | null
): Pick<Approval, "request_type" | "request_summary" | "ai_recommendation" | "risk_level"> {
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

function normalizeApprovalRecommendation(
  data: Record<string, unknown>,
  project: Project,
  phase: Phase | null,
  validation: Validation | null
): Pick<Approval, "request_type" | "request_summary" | "ai_recommendation" | "risk_level"> {
  const mock = mockApprovalRecommendation(project, phase, validation);
  return {
    request_type: asString(data.request_type, mock.request_type),
    request_summary: asString(data.request_summary, mock.request_summary),
    ai_recommendation: asString(data.ai_recommendation, mock.ai_recommendation),
    risk_level: oneOf<RiskLevel>(data.risk_level, ["low", "medium", "high"], mock.risk_level)
  };
}

export async function recommendApprovalWithAi(
  project: Project,
  phase: Phase | null,
  validation: Validation | null
): Promise<Pick<Approval, "request_type" | "request_summary" | "ai_recommendation" | "risk_level">> {
  if (shouldUseMockAi()) {
    return mockApprovalRecommendation(project, phase, validation);
  }

  const data = await withAiProviderFallback(
    () =>
      callGlmJson(
        "Recommend an HQ approval decision package for a workflow item. Return JSON with: request_type, request_summary, ai_recommendation, risk_level(low|medium|high).",
        { project, phase, validation }
      ),
    () => mockApprovalRecommendation(project, phase, validation)
  );

  return normalizeApprovalRecommendation(data, project, phase, validation);
}
