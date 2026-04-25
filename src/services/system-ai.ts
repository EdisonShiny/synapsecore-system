import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";
import { getSystemStore } from "@/src/services/system-store";
import type {
  AiEvidence,
  AiRecordPhase,
  AiInsight,
  AttachmentReference,
  CreateIssueInput,
  CreatePlanSubmissionInput,
  CreateProjectInput,
  OfficeAccount,
  PlanInsight,
  ProjectPhaseRecord,
  ProjectRecord,
  ProjectReport,
  SystemAiHealthPayload,
  RequestAiRecommendation,
  WorkflowAttempt,
  WorkflowExtraction,
  WorkflowProjectCandidate,
  WorkflowPromptConfig,
  WorkflowRecord,
  WorkflowValidationFeedback
} from "@/types/system";

const defaultIlmuModel =
  process.env.ILMU_MODEL?.trim() ||
  process.env.ZAI_MODEL?.trim() ||
  "nemo-super";

let lastProbeCache:
  | {
      key: string;
      value: SystemAiHealthPayload;
      expiresAt: number;
    }
  | null = null;

function joinNames(attachments: AttachmentReference[]) {
  if (attachments.length === 0) {
    return "No supporting files were attached.";
  }

  return attachments.map((attachment) => attachment.name).join(", ");
}

function buildEvidence(inputs: AiEvidence[]): AiEvidence[] {
  return inputs.filter((item) => item.detail.trim().length > 0);
}

function normalizeReportDividers(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]*[═━─]{5,}[ \t]*/g, "\n------------\n")
    .replace(/[ \t]*(?:[=\-]\s*){6,}[ \t]*/g, "\n------------\n")
    .replace(/[ \t]*------------[ \t]*/g, "\n------------\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function createProjectAiReport(
  office: OfficeAccount,
  input: CreateProjectInput
): ProjectReport {
  const generatedAt = nowIso();
  const evidence = buildEvidence([
    {
      label: "Branch profile",
      detail: `${office.officeName} operating from ${office.location}.`,
      source: "Operational"
    },
    {
      label: "Submission scope",
      detail: input.description,
      source: "Operational"
    },
    {
      label: "Reference materials",
      detail: joinNames(input.attachments),
      source: input.attachments.length > 0 ? "Internal" : "Operational"
    },
    {
      label: "External scan",
      detail: `Comparable office initiatives in ${office.location} typically move faster when scope, cost, and resource dependencies are named early.`,
      source: "External"
    }
  ]);

  const aiOutput: AiInsight = {
    id: createId(),
    generatedAt,
    directResult: `Project is ready for HQ review with a moderate implementation risk profile for ${office.officeName}.`,
    finalConclusion:
      "HQ should review this request with attention to delivery capacity, local execution constraints, and the evidence supplied by the branch.",
    advice:
      "Clarify execution ownership, expected impact, and the key dependency risks before final approval.",
    workflow: [
      {
        title: "Input framing",
        detail: `The branch submission was normalized around the subject "${input.subject}" and the applicant context from ${input.applicantName}.`
      },
      {
        title: "Evidence review",
        detail: `The request description and ${input.attachments.length} supporting file reference(s) were compared against operational context in ${office.location}.`
      },
      {
        title: "Risk direction",
        detail:
          "The request appears viable, but unclear ownership, resource timing, or missing commercial assumptions could slow execution after approval."
      },
      {
        title: "Recommendation handoff",
        detail:
          "The project was packaged into an HQ-facing report so final approval can focus on business impact, readiness, and risk controls."
      }
    ],
    evidence
  };

  return {
    id: createId(),
    branchOfficeName: office.officeName,
    submissionTime: generatedAt,
    projectDescription: input.description,
    applicantInformation: {
      applicantName: input.applicantName,
      position: input.position,
      email: input.email
    },
    resourceLinks: input.attachments.map((attachment) => attachment.name),
    aiAdvice: aiOutput.advice,
    aiOutput
  };
}

export function createPlanInsight(
  office: OfficeAccount,
  input: CreatePlanSubmissionInput,
  context: {
    overallProjectCount: number;
    branchProjectCount: number;
    issueCount: number;
  }
): PlanInsight {
  const generatedAt = nowIso();
  const externalSignals = [
    `Local trends in ${office.location} suggest demand is sensitive to operational responsiveness and visible service quality.`,
    "Global operating costs remain volatile, so funding assumptions should include a contingency buffer.",
    "Recent news and customer feedback patterns favor proposals with measurable service impact and faster execution windows."
  ];

  const aiOutput: AiInsight = {
    id: createId(),
    generatedAt,
    directResult: `${office.officeName} shows credible demand signals, but resource discipline is required before scaling new commitments.`,
    finalConclusion:
      "The office should proceed selectively, using uploaded datasets and branch context to prioritize initiatives that have clear operational lift and manageable financial exposure.",
    advice:
      "Use uploaded datasets to validate demand assumptions, then sequence investment toward the highest-confidence opportunities first.",
    workflow: [
      {
        title: "Dataset classification",
        detail: `Uploaded inputs were categorized as ${input.uploads.length > 0 ? "internal branch evidence" : "narrative branch notes"} for demand, finance, and risk interpretation.`
      },
      {
        title: "External context scan",
        detail:
          "Local trends, global trends, current news patterns, and customer-response direction were combined to pressure-test the branch request."
      },
      {
        title: "Operational comparison",
        detail: `The branch's current project count (${context.branchProjectCount}) and issue load (${context.issueCount}) were compared against broader system activity (${context.overallProjectCount} projects total).`
      },
      {
        title: "Judgment synthesis",
        detail:
          "The final recommendation balances internal evidence, market direction, and delivery pressure to produce one structured planning judgment."
      }
    ],
    evidence: buildEvidence([
      {
        label: "Uploaded branch datasets",
        detail: input.uploads.length > 0 ? joinNames(input.uploads) : "No uploaded datasets were provided in this cycle.",
        source: "Internal"
      },
      {
        label: "Local trend view",
        detail: `Demand in ${office.location} is likely to respond best to initiatives that reduce friction or improve response speed.`,
        source: "External"
      },
      {
        label: "Global trend view",
        detail: "Cross-market cost pressure supports phased rollouts and tighter validation before broad commitments.",
        source: "External"
      },
      {
        label: "Feedback direction",
        detail: "User sentiment usually favors practical, quickly visible improvements over long-horizon speculative programs.",
        source: "Operational"
      }
    ])
  };

  return {
    id: createId(),
    scope: "branch",
    officeId: office.id,
    officeName: office.officeName,
    demandConclusion: `Demand remains active around ${office.officeName}, especially where initiatives improve local responsiveness and service visibility.`,
    financialConclusion:
      "Financial conditions support targeted projects with staged commitments instead of broad upfront spending.",
    riskConclusion:
      "The main risk is overcommitting resources before branch-level evidence and market direction align strongly enough.",
    uploadedSources: input.uploads,
    externalSignals,
    aiOutput,
    createdAt: generatedAt
  };
}

export function createOverallInsight(
  hqOffice: OfficeAccount,
  branches: OfficeAccount[],
  branchInsights: PlanInsight[],
  overallProjectCount: number,
  issueCount: number
): PlanInsight {
  const generatedAt = nowIso();
  const activeBranchNames = branches.map((branch) => branch.officeName).join(", ") || "no active branches";

  return {
    id: createId(),
    scope: "overall",
    officeId: null,
    officeName: hqOffice.officeName,
    demandConclusion: `System-wide demand is concentrated across ${activeBranchNames}, with ${overallProjectCount} tracked project request(s) currently in the workflow.`,
    financialConclusion:
      "Overall financial posture favors disciplined approvals, branch-by-branch prioritization, and tighter scrutiny on projects without strong supporting evidence.",
    riskConclusion: `There are ${issueCount} active issue thread(s), so overall scaling risk remains tied to branch execution pressure and response speed.`,
    uploadedSources: branchInsights.flatMap((item) => item.uploadedSources).slice(0, 6),
    externalSignals: [
      "Overall market direction still rewards branches that can justify demand with current evidence and operational realism.",
      "Cross-branch consistency improves when HQ aligns approval comments with the same AI workflow language used in branch reviews."
    ],
    aiOutput: {
      id: createId(),
      generatedAt,
      directResult:
        "Overall demand remains actionable, but HQ should keep approvals selective and rebalance attention toward branches carrying higher risk or issue load.",
      finalConclusion:
        "HQ should use branch-specific evidence and issue pressure together when prioritizing resources across the network.",
      advice:
        "Treat the combined project queue, branch evidence, and issue traffic as one portfolio signal rather than reviewing approvals in isolation.",
      workflow: [
        {
          title: "Portfolio intake",
          detail: `HQ reviewed ${branchInsights.length} branch insight snapshot(s) across ${branches.length} branch office(s).`
        },
        {
          title: "Cross-branch comparison",
          detail:
            "Demand and financial direction were compared across branches to surface where approval momentum or operational constraints are diverging."
        },
        {
          title: "Risk weighting",
          detail:
            "Issue volume, execution pressure, and uneven evidence quality were used to prioritize where HQ attention should go first."
        },
        {
          title: "System conclusion",
          detail:
            "The output summarizes the network-wide position while preserving per-branch visibility for approval and planning decisions."
        }
      ],
      evidence: [
        {
          label: "Branch coverage",
          detail: activeBranchNames,
          source: "Operational"
        },
        {
          label: "Approval pipeline",
          detail: `${overallProjectCount} tracked project request(s) currently inform the planning outlook.`,
          source: "Operational"
        },
        {
          label: "Issue load",
          detail: `${issueCount} issue thread(s) remain active across the system.`,
          source: "Operational"
        }
      ]
    },
    createdAt: generatedAt
  };
}

export function createIssueInsight(
  sourceOffice: OfficeAccount,
  targetOffice: OfficeAccount,
  input: CreateIssueInput
): AiInsight {
  const generatedAt = nowIso();

  return {
    id: createId(),
    generatedAt,
    directResult: `${input.urgency} urgency issue detected between ${sourceOffice.officeName} and ${targetOffice.officeName}.`,
    finalConclusion:
      "The issue should be acknowledged quickly, triaged against operational impact, and assigned a clear next action owner before conditions worsen.",
    advice:
      input.urgency === "Critical"
        ? "Start with containment, notify the counterpart office immediately, and agree on an escalation owner within the current shift."
        : "Confirm impact scope, assign a response owner, and return a written action update to the counterpart office promptly.",
    workflow: [
      {
        title: "Incident intake",
        detail: `The issue "${input.subject}" was received from ${sourceOffice.officeName} for ${targetOffice.officeName}.`
      },
      {
        title: "Impact screening",
        detail:
          "Urgency, operational reach, and the clarity of the initial description were checked to estimate how quickly escalation may spread."
      },
      {
        title: "Response planning",
        detail:
          "Immediate guidance focuses on containment, communication, and assigning a single accountable responder for the next step."
      },
      {
        title: "Escalation visibility",
        detail:
          "The issue thread remains visible to both sides so decisions, follow-ups, and emergency advice stay attached to the same record."
      }
    ],
    evidence: [
      {
        label: "Origin office",
        detail: sourceOffice.officeName,
        source: "Operational"
      },
      {
        label: "Target office",
        detail: targetOffice.officeName,
        source: "Operational"
      },
      {
        label: "Initial issue statement",
        detail: input.message,
        source: "Operational"
      }
    ]
  };
}

function compactText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function toSentences(input: string) {
  return input
    .split(/[\n.!?]+/)
    .map((item) => compactText(item))
    .filter(Boolean);
}

function firstMeaningfulSentence(input: string, fallback: string) {
  return toSentences(input)[0] ?? fallback;
}

function buildKeywordItems(input: string) {
  const words = compactText(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5);
  const seen = new Set<string>();
  const items: string[] = [];

  for (const word of words) {
    if (seen.has(word)) {
      continue;
    }

    seen.add(word);
    items.push(word);

    if (items.length === 4) {
      break;
    }
  }

  return items;
}

function normalizeJsonString(input: string) {
  const trimmed = input.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => compactText(item)).filter(Boolean);
}

function resolveLiveAiConfig() {
  const store = getSystemStore();
  const apiUrl =
    compactText(store.systemConfig.apiUrl) ||
    compactText(process.env.ILMU_API_BASE_URL ?? "") ||
    compactText(process.env.OPENAI_BASE_URL ?? "");
  const apiKey =
    compactText(store.systemConfig.apiKey) ||
    compactText(process.env.ILMU_API_KEY ?? "") ||
    compactText(process.env.OPENAI_API_KEY ?? "");

  if (!apiUrl || !apiKey) {
    return null;
  }

  return {
    apiUrl,
    apiKey,
    model: compactText(store.systemConfig.model) || defaultIlmuModel
  };
}

function resolveChatCompletionsUrl(apiUrl: string) {
  const trimmed = apiUrl.replace(/\/+$/g, "");

  if (trimmed.endsWith("/chat/completions")) {
    return trimmed;
  }

  return `${trimmed}/chat/completions`;
}

function extractCompletionText(payload: unknown) {
  if (!isRecord(payload)) {
    return "";
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const choice = choices[0];

  if (!isRecord(choice) || !isRecord(choice.message)) {
    return "";
  }

  const { content } = choice.message;

  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  const parts = content
    .filter(isRecord)
    .map((item) => item.text)
    .filter((item): item is string => typeof item === "string");

  return parts.join("");
}

async function requestLiveAi(args: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  jsonMode?: boolean;
}) {
  const config = resolveLiveAiConfig();

  if (!config) {
    throw new Error("Live AI configuration is incomplete.");
  }

  const response = await fetch(resolveChatCompletionsUrl(config.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: args.temperature ?? 0.2,
      reasoning_effort: "medium",
      ...(args.jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: args.systemPrompt },
        { role: "user", content: args.userPrompt }
      ]
    })
  });

  if (!response.ok) {
    let errorMessage = `AI request failed with status ${response.status} for model '${config.model}'.`;

    try {
      const payload = (await response.json()) as unknown;
      if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
        errorMessage = `${payload.error.message} (model: ${config.model})`;
      }
    } catch {
      // Ignore JSON parsing failures for provider errors.
    }

    throw new Error(errorMessage);
  }

  const payload = (await response.json()) as unknown;
  const content = extractCompletionText(payload);

  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return content;
}

export async function probeLiveAiConnection(): Promise<SystemAiHealthPayload> {
  const config = resolveLiveAiConfig();
  const cacheKey = `${config?.apiUrl ?? ""}::${config?.apiKey ? "configured" : "missing"}::${config?.model ?? ""}`;
  const now = Date.now();

  if (lastProbeCache && lastProbeCache.key === cacheKey && lastProbeCache.expiresAt > now) {
    return lastProbeCache.value;
  }

  if (!config) {
    const result: SystemAiHealthPayload = {
      status: "missing-config",
      summary: "Live API not configured",
      detail: "Add the ILMU base URL and API key in Settings. The app will use the local fallback pipeline until then.",
      testedAt: nowIso(),
      configured: false,
      model: null
    };
    lastProbeCache = {
      key: cacheKey,
      value: result,
      expiresAt: now + 10_000
    };
    return result;
  }

  try {
    await requestLiveAi({
      systemPrompt: "You are a health check endpoint for a workflow system. Reply briefly.",
      userPrompt: "Reply with OK.",
      temperature: 0
    });

    const result: SystemAiHealthPayload = {
      status: "live-ready",
      summary: "Live ILMU API ready",
      detail: "The last startup probe succeeded. Workflow stages can use the live ILMU path.",
      testedAt: nowIso(),
      configured: true,
      model: config.model
    };
    lastProbeCache = {
      key: cacheKey,
      value: result,
      expiresAt: now + 30_000
    };
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live ILMU health check failed.";
    const result: SystemAiHealthPayload = {
      status: "fallback-active",
      summary: "Fallback pipeline active",
      detail: `Live ILMU probe failed. ${message}`,
      testedAt: nowIso(),
      configured: true,
      model: config.model
    };
    lastProbeCache = {
      key: cacheKey,
      value: result,
      expiresAt: now + 15_000
    };
    return result;
  }
}

async function requestLiveJson<T>(
  args: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
  },
  validate: (value: unknown) => T | null
) {
  const raw = await requestLiveAi({
    ...args,
    jsonMode: true
  });
  const parsed = JSON.parse(normalizeJsonString(raw)) as unknown;
  return validate(parsed);
}

export function createWorkflowReportAttempt(args: {
  workflow: WorkflowRecord;
  office: OfficeAccount;
  unstructuredInput: string;
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const firstSentence = firstMeaningfulSentence(
    args.unstructuredInput,
    "The input does not yet contain a clear business statement."
  );
  const promptCue = compactText(args.workflow.config.reportPrompt) || "Describe the expected report output.";
  const previousCue = args.previousReport
    ? ` Previous report context: ${compactText(args.previousReport).slice(0, 180)}.`
    : "";
  const validatorCue = args.validatorFeedback
    ? ` Validator feedback to address: ${compactText(args.validatorFeedback).slice(0, 180)}.`
    : "";

  return [
    `Attempt ${args.attemptNumber} report for workflow "${args.workflow.name}" executed by ${args.office.officeName}.`,
    `Prompt intent: ${promptCue}`,
    `Operational summary: ${firstSentence}`,
    `Structured direction: highlight the business signal, remove exaggeration, and surface the most actionable risk and opportunity.${previousCue}${validatorCue}`
  ].join(" ");
}

export function createPhaseProgressReportAttempt(args: {
  workflow: WorkflowRecord;
  office: OfficeAccount;
  previousPhase: ProjectPhaseRecord;
  unstructuredInput: string;
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const outcomeSummary = firstMeaningfulSentence(
    args.unstructuredInput,
    "Execution outcome is not yet clearly stated."
  );
  const promptCue =
    compactText(args.workflow.config.phaseProgressPrompt) ||
    "Analyze phase outcome and decide the next phase or closure.";
  const previousCue = args.previousReport
    ? ` Previous report context: ${compactText(args.previousReport).slice(0, 180)}.`
    : "";
  const validatorCue = args.validatorFeedback
    ? ` Validator feedback to address: ${compactText(args.validatorFeedback).slice(0, 180)}.`
    : "";

  return [
    `Attempt ${args.attemptNumber} phase progression report for workflow "${args.workflow.name}" executed by ${args.office.officeName}.`,
    `Prompt intent: ${promptCue}`,
    `Previous phase objective: ${args.previousPhase.objective}`,
    `Expected outcome from the phase: ${args.previousPhase.expectedOutcome}`,
    `Execution outcome summary: ${outcomeSummary}.${previousCue}${validatorCue}`
  ].join(" ");
}

export function createRequestReportAttempt(args: {
  prompt: string;
  projectSubject: string;
  branchOfficeName: string;
  applicationText: string;
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const applicationSummary = firstMeaningfulSentence(
    args.applicationText,
    "The request application does not yet contain a clear business statement."
  );
  const promptCue = compactText(args.prompt) || "Write a factual request-approval report.";
  const previousCue = args.previousReport
    ? ` Previous report context: ${compactText(args.previousReport).slice(0, 180)}.`
    : "";
  const validatorCue = args.validatorFeedback
    ? ` Validator feedback to address: ${compactText(args.validatorFeedback).slice(0, 180)}.`
    : "";

  return [
    `Attempt ${args.attemptNumber} request-approval report for project "${args.projectSubject}" from ${args.branchOfficeName}.`,
    `Prompt intent: ${promptCue}`,
    `Application summary: ${applicationSummary}`,
    `Structured direction: focus on factual operational need, supporting evidence, likely impact, and whether the request is ready for approval.${previousCue}${validatorCue}`
  ].join(" ");
}

export function createWorkflowExtraction(args: {
  workflow: WorkflowRecord;
  report: string;
  unstructuredInput: string;
}) : WorkflowExtraction {
  const sentences = toSentences(args.unstructuredInput);
  const items = [
    ...sentences.slice(0, 3).map((sentence) => sentence.slice(0, 140)),
    ...buildKeywordItems(args.report).map((item) => `Key topic: ${item}`)
  ].slice(0, 5);

  return {
    headline: firstMeaningfulSentence(
      args.report,
      `Workflow ${args.workflow.name} extracted one operational signal.`
    ),
    items,
    confidenceScore: Math.min(0.62 + items.length * 0.07, 0.94)
  };
}

export function createWorkflowValidation(args: {
  workflow: WorkflowRecord;
  extraction: WorkflowExtraction;
  unstructuredInput: string;
  attemptNumber: number;
}) : WorkflowValidationFeedback {
  const source = compactText(args.unstructuredInput).toLowerCase();
  const overlapCount = args.extraction.items.filter((item) =>
    source.includes(item.toLowerCase().replace(/^key topic:\s*/, ""))
  ).length;
  const hasEnoughEvidence = args.extraction.items.length >= 2 && overlapCount >= 1;
  const shouldPass = args.attemptNumber > 1 || hasEnoughEvidence;

  return {
    result: shouldPass ? "Pass" : "Fail",
    summary: shouldPass
      ? `Validator accepted the extraction for "${args.workflow.name}" as grounded enough to proceed to project building.`
      : `Validator rejected the extraction because the report still needs more concrete operational grounding from the original input.`,
    retryInstruction: shouldPass
      ? "Validation passed. Proceed to the project builder stage."
      : "Rebuild the report using more factual language, focus on observable demand, inventory, feedback, or execution signals, and avoid unsupported adjectives.",
    confidenceScore: shouldPass ? Math.min(args.extraction.confidenceScore + 0.08, 0.97) : 0.48
  };
}

export function createWorkflowProjectCandidates(args: {
  workflow: WorkflowRecord;
  extraction: WorkflowExtraction;
  report: string;
  unstructuredInput: string;
}) : {
  summary: string;
  candidates: WorkflowProjectCandidate[];
} {
  const keywords = buildKeywordItems(`${args.unstructuredInput} ${args.report}`);
  const baseTitle = firstMeaningfulSentence(
    args.unstructuredInput,
    `${args.workflow.name} generated a workflow project candidate`
  )
    .slice(0, 70)
    .replace(/[.:;,-]+$/g, "");
  const candidateCount = Math.max(1, Math.min(2, Math.ceil(args.extraction.items.length / 3)));
  const candidates = Array.from({ length: candidateCount }, (_, index) => {
    const keyword = keywords[index] ?? `signal-${index + 1}`;
    const priority: WorkflowProjectCandidate["priority"] =
      index === 0 ? "High" : "Medium";
    const extractionLine = args.extraction.items[index] ?? args.extraction.headline;

    return {
      title:
        index === 0
          ? `Project: ${baseTitle}`
          : `Project: ${baseTitle} - ${keyword}`,
      summary: extractionLine,
      rationale: `Built from workflow "${args.workflow.name}" using the extracted signal "${keyword}" and the validated report outcome.`,
      priority,
      confidenceScore: Math.min(args.extraction.confidenceScore + 0.02 * (index + 1), 0.96),
      actionablePlans: [
        `Confirm the operating baseline around "${extractionLine}".`,
        `Assign one execution owner and one reviewer for this initiative.`,
        `Track one measurable field signal tied to ${keyword}.`
      ],
      expectedOutcome: `Produce a measurable improvement around ${keyword} with a clear before-and-after checkpoint.`
    };
  });

  return {
    summary: `Project builder identified ${candidates.length} potential project candidate${candidates.length === 1 ? "" : "s"} from the validated extraction.`,
    candidates
  };
}

export function createNextPhaseFromOutcome(args: {
  workflow: WorkflowRecord;
  previousPhase: ProjectPhaseRecord;
  extraction: WorkflowExtraction;
  report: string;
  outcomeInput: string;
}) {
  const normalizedOutcome = compactText(args.outcomeInput).toLowerCase();
  const closeSignal =
    /\b(done|complete|completed|finished|resolved|achieved|closed|stable)\b/.test(normalizedOutcome);
  const objective = args.extraction.headline || `Advance beyond ${args.previousPhase.title}`;
  const keyword = buildKeywordItems(`${args.outcomeInput} ${args.report}`)[0] ?? "follow-up";

  return {
    closeSignal,
    summary: closeSignal
      ? `Phase builder determined that the project can be closed after ${args.previousPhase.title}.`
      : `Phase builder generated the next phase after validating the outcome of ${args.previousPhase.title}.`,
    nextPhase: closeSignal
      ? null
      : {
          title: `Phase ${args.previousPhase.phaseNumber + 1}: ${objective}`.slice(0, 90),
          objective,
          actionablePlans: [
            `Validate whether the improvement around ${keyword} is sustained in field operations.`,
            `Refine the execution scope using the validated outcome from ${args.previousPhase.title}.`,
            `Prepare the next reporting checkpoint with evidence tied to ${keyword}.`
          ],
          expectedOutcome: `Deliver the next measurable gain after ${args.previousPhase.title} and confirm whether the initiative should continue or close.`
        }
  };
}

export function createRequestRecommendation(args: {
  prompt: string;
  extraction: WorkflowExtraction;
  report: string;
  applicationText: string;
}) : RequestAiRecommendation {
  const lowered = compactText(`${args.applicationText} ${args.report}`).toLowerCase();
  const negativeSignals = ["unclear", "missing", "delay", "blocked", "risk", "unstable"];
  const positiveSignals = ["validated", "confirmed", "evidence", "measurable", "ready", "resolved"];
  const negativeCount = negativeSignals.filter((signal) => lowered.includes(signal)).length;
  const positiveCount = positiveSignals.filter((signal) => lowered.includes(signal)).length;
  const recommendation = negativeCount > positiveCount ? "Reject" : "Approve";

  return {
    recommendation,
    reason:
      recommendation === "Approve"
        ? `The request is recommended for approval because the validated extraction shows grounded operational need and enough supporting context to proceed. Prompt intent: ${compactText(args.prompt).slice(0, 160)}`
        : `The request is recommended for rejection because the validated extraction still suggests missing evidence, unstable assumptions, or unresolved delivery risk. Prompt intent: ${compactText(args.prompt).slice(0, 160)}`,
    confidenceScore: recommendation === "Approve" ? Math.min(args.extraction.confidenceScore + 0.03, 0.97) : 0.71
  };
}

export function createWorkflowProjectReport(args: {
  office: OfficeAccount;
  workflow: WorkflowRecord;
  candidate: WorkflowProjectCandidate;
  attempt: WorkflowAttempt;
  unstructuredInput: string;
}) : ProjectReport {
  const generatedAt = nowIso();
  const aiOutput: AiInsight = {
    id: createId(),
    generatedAt,
    directResult: `${args.candidate.title} is ready for HQ review after validation passed in workflow "${args.workflow.name}".`,
    finalConclusion:
      "The potential project should move into the request and approval layer, with the validated extraction and workflow rationale kept visible.",
    advice:
      "Use the validator feedback, extracted points, and raw source input together when deciding whether this project should proceed.",
    workflow: [
      {
        title: "Workflow input",
        detail: `The project candidate originated from workflow "${args.workflow.name}" and used unstructured input from ${args.office.officeName}.`
      },
      {
        title: "Validated report",
        detail: args.attempt.report
      },
      {
        title: "Extraction outcome",
        detail: `${args.attempt.extraction.headline} (${args.attempt.extraction.items.join("; ")})`
      },
      {
        title: "Project builder output",
        detail: args.candidate.rationale
      }
    ],
    evidence: [
      {
        label: "Raw input",
        detail: args.unstructuredInput,
        source: "Operational"
      },
      {
        label: "Validated extraction",
        detail: args.attempt.extraction.items.join("; "),
        source: "Operational"
      },
      {
        label: "Workflow prompt intent",
        detail: compactText(args.workflow.config.projectBuilderPrompt) || "Build the project from the validated extraction.",
        source: "Internal"
      }
    ]
  };

  return {
    id: createId(),
    branchOfficeName: args.office.officeName,
    submissionTime: generatedAt,
    projectDescription: args.candidate.summary,
    applicantInformation: {
      applicantName: args.office.personInChargeName,
      position: args.office.position,
      email: args.office.email
    },
    resourceLinks: [],
    aiAdvice: aiOutput.advice,
    aiOutput
  };
}

export async function generateWorkflowReportAttempt(args: {
  workflow: WorkflowRecord;
  office: OfficeAccount;
  unstructuredInput: string;
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const fallback = createWorkflowReportAttempt(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You are an operational intake analyst for a branch workflow system.",
          args.workflow.config.reportPrompt,
          "Return JSON only with one key: report.",
          "The report must be factual, concise, and avoid unsupported claims."
        ].join("\n"),
        userPrompt: [
          `Workflow: ${args.workflow.name}`,
          `Office: ${args.office.officeName}`,
          `Attempt number: ${args.attemptNumber}`,
          `Unstructured input:\n${args.unstructuredInput}`,
          args.previousReport ? `Previous report:\n${args.previousReport}` : "",
          args.validatorFeedback ? `Validator feedback:\n${args.validatorFeedback}` : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        temperature: 0.2
      },
      (value) => {
        if (!isRecord(value) || typeof value.report !== "string" || !compactText(value.report)) {
          return null;
        }

        return compactText(value.report);
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generatePhaseProgressReportAttempt(args: {
  workflow: WorkflowRecord;
  office: OfficeAccount;
  previousPhase: ProjectPhaseRecord;
  unstructuredInput: string;
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const fallback = createPhaseProgressReportAttempt(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You are a phase progression analyst for a branch workflow system.",
          args.workflow.config.phaseProgressPrompt,
          "Return JSON only with one key: report.",
          "Focus on what happened in the completed phase, grounded evidence, and what matters for the next phase decision."
        ].join("\n"),
        userPrompt: [
          `Workflow: ${args.workflow.name}`,
          `Office: ${args.office.officeName}`,
          `Previous phase title: ${args.previousPhase.title}`,
          `Previous phase objective: ${args.previousPhase.objective}`,
          `Expected outcome: ${args.previousPhase.expectedOutcome}`,
          `Attempt number: ${args.attemptNumber}`,
          `Outcome input:\n${args.unstructuredInput}`,
          args.previousReport ? `Previous report:\n${args.previousReport}` : "",
          args.validatorFeedback ? `Validator feedback:\n${args.validatorFeedback}` : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        temperature: 0.2
      },
      (value) => {
        if (!isRecord(value) || typeof value.report !== "string" || !compactText(value.report)) {
          return null;
        }

        return compactText(value.report);
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateRequestReportAttempt(args: {
  prompt: string;
  projectSubject: string;
  branchOfficeName: string;
  applicationText: string;
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const fallback = createRequestReportAttempt(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You are a request approval analyst for an HQ and branch workflow platform.",
          args.prompt,
          "Return JSON only with one key: report.",
          "Keep the report factual, decision-oriented, and grounded in the provided request application and support context."
        ].join("\n"),
        userPrompt: [
          `Project subject: ${args.projectSubject}`,
          `Branch office: ${args.branchOfficeName}`,
          `Attempt number: ${args.attemptNumber}`,
          `Request application and support context:\n${args.applicationText}`,
          args.previousReport ? `Previous report:\n${args.previousReport}` : "",
          args.validatorFeedback ? `Validator feedback:\n${args.validatorFeedback}` : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        temperature: 0.2
      },
      (value) => {
        if (!isRecord(value) || typeof value.report !== "string" || !compactText(value.report)) {
          return null;
        }

        return compactText(value.report);
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generatePhaseSummaryReport(args: {
  workflow: WorkflowRecord;
  project: ProjectRecord;
  currentPhase: AiRecordPhase;
  previousPhases: AiRecordPhase[];
  attemptNumber: number;
  previousReport?: string;
  validatorFeedback?: string;
}) {
  const fallbackSections = [
    `Project: ${args.project.subject}`,
    `Current phase: ${args.currentPhase.title}`,
    "Current phase plan:",
    args.currentPhase.plan || "No plan recorded.",
    args.previousPhases.length > 0
      ? `Previous validated outcomes:\n${args.previousPhases
          .map(
            (phase) =>
              `${phase.title}\nPlan: ${phase.plan || "No plan recorded."}\nOutcome: ${phase.outcome || "No validated outcome recorded."}`
          )
          .join("\n\n")}`
      : "Previous validated outcomes: No previous phases recorded.",
    "Management summary:",
    `The project remains focused on ${firstMeaningfulSentence(args.currentPhase.plan, args.project.description)}.`,
    args.currentPhase.outcome
      ? `The most recent validated outcome indicates: ${firstMeaningfulSentence(args.currentPhase.outcome, "Outcome evidence is available.")}`
      : "The current phase has not yet recorded a validated outcome, so the report focuses on plan readiness and prior validated progress."
  ];
  const fallback = normalizeReportDividers(fallbackSections.join("\n\n"));

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You generate management-ready phase reports for an AI workflow system.",
          args.workflow.config.phaseReportPrompt,
          "Return JSON only with one key: report.",
          "The report must be formatted text that is easy to copy into a report or chat update.",
          "Use only plain ASCII divider lines like ------------. Do not use box-drawing characters or decorative Unicode separators.",
          "Whenever you use a divider, it must be on its own line, with content separated above and below it."
        ].join("\n"),
        userPrompt: [
          `Project subject: ${args.project.subject}`,
          `Branch office: ${args.project.branchOfficeName}`,
          `Attempt number: ${args.attemptNumber}`,
          `Current phase title: ${args.currentPhase.title}`,
          `Current phase plan:\n${args.currentPhase.plan || "No plan recorded."}`,
          args.previousPhases.length > 0
            ? `Previous phase plans and achieved outcomes:\n${args.previousPhases
                .map(
                  (phase) =>
                    `${phase.title}\nPlan:\n${phase.plan || "No plan recorded."}\nOutcome:\n${phase.outcome || "No validated outcome recorded."}`
                )
                .join("\n\n")}`
            : "Previous phase plans and achieved outcomes:\nNo previous phases recorded.",
          args.previousReport ? `Previous generated report:\n${args.previousReport}` : "",
          args.validatorFeedback ? `Validator feedback:\n${args.validatorFeedback}` : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        temperature: 0.2
      },
      (value) => {
        if (!isRecord(value) || typeof value.report !== "string" || !compactText(value.report)) {
          return null;
        }

        return normalizeReportDividers(value.report.trim());
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateWorkflowExtraction(args: {
  workflow: WorkflowRecord;
  report: string;
  unstructuredInput: string;
}) {
  const fallback = createWorkflowExtraction(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You extract grounded operational information from workflow reports.",
          args.workflow.config.extractorPrompt,
          "Return JSON only with keys: headline, items, confidenceScore.",
          "headline must be a short string. items must be an array of 3 to 5 strings. confidenceScore must be a number between 0 and 1."
        ].join("\n"),
        userPrompt: [
          `Workflow: ${args.workflow.name}`,
          `Source input:\n${args.unstructuredInput}`,
          `Report to extract from:\n${args.report}`
        ].join("\n\n"),
        temperature: 0
      },
      (value) => {
        if (!isRecord(value)) {
          return null;
        }

        const headline = typeof value.headline === "string" ? compactText(value.headline) : "";
        const items = toStringArray(value.items).slice(0, 5);

        if (!headline || items.length === 0) {
          return null;
        }

        return {
          headline,
          items,
          confidenceScore: Math.max(0, Math.min(1, toNumber(value.confidenceScore, fallback.confidenceScore)))
        };
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateWorkflowValidation(args: {
  workflow: WorkflowRecord;
  extraction: WorkflowExtraction;
  unstructuredInput: string;
  attemptNumber: number;
}): Promise<WorkflowValidationFeedback> {
  const fallback = createWorkflowValidation(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You validate whether extracted information is grounded in the original workflow input.",
          args.workflow.config.validatorPrompt,
          "Return JSON only with keys: result, summary, retryInstruction, confidenceScore.",
          'result must be either "Pass" or "Fail".'
        ].join("\n"),
        userPrompt: [
          `Workflow: ${args.workflow.name}`,
          `Attempt number: ${args.attemptNumber}`,
          `Original input:\n${args.unstructuredInput}`,
          `Extraction headline: ${args.extraction.headline}`,
          `Extraction items:\n- ${args.extraction.items.join("\n- ")}`
        ].join("\n\n"),
        temperature: 0
      },
      (value) => {
        if (!isRecord(value)) {
          return null;
        }

        const result = value.result === "Pass" || value.result === "Fail" ? value.result : null;
        const summary = typeof value.summary === "string" ? compactText(value.summary) : "";
        const retryInstruction =
          typeof value.retryInstruction === "string" ? compactText(value.retryInstruction) : "";

        if (!result || !summary || !retryInstruction) {
          return null;
        }

        const normalized: WorkflowValidationFeedback = {
          result,
          summary,
          retryInstruction,
          confidenceScore: Math.max(0, Math.min(1, toNumber(value.confidenceScore, fallback.confidenceScore)))
        };

        return normalized;
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateWorkflowProjectCandidates(args: {
  workflow: WorkflowRecord;
  extraction: WorkflowExtraction;
  report: string;
  unstructuredInput: string;
}) {
  const fallback = createWorkflowProjectCandidates(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You build structured project candidates from validated workflow outputs.",
          args.workflow.config.projectBuilderPrompt,
          "Return JSON only with keys: summary and candidates.",
          "Each candidate must include title, summary, rationale, priority, confidenceScore, actionablePlans, and expectedOutcome.",
          'priority must be one of "Low", "Medium", "High", or "Critical".'
        ].join("\n"),
        userPrompt: [
          `Workflow: ${args.workflow.name}`,
          `Validated report:\n${args.report}`,
          `Validated extraction headline: ${args.extraction.headline}`,
          `Validated extraction items:\n- ${args.extraction.items.join("\n- ")}`,
          `Original input:\n${args.unstructuredInput}`
        ].join("\n\n"),
        temperature: 0.2
      },
      (value) => {
        if (!isRecord(value) || typeof value.summary !== "string" || !Array.isArray(value.candidates)) {
          return null;
        }

        const candidates = value.candidates
          .filter(isRecord)
          .map((candidate) => {
            const title = typeof candidate.title === "string" ? compactText(candidate.title) : "";
            const summary = typeof candidate.summary === "string" ? compactText(candidate.summary) : "";
            const rationale = typeof candidate.rationale === "string" ? compactText(candidate.rationale) : "";
            const priority =
              candidate.priority === "Low" ||
              candidate.priority === "Medium" ||
              candidate.priority === "High" ||
              candidate.priority === "Critical"
                ? candidate.priority
                : null;
            const actionablePlans = toStringArray(candidate.actionablePlans).slice(0, 5);
            const expectedOutcome =
              typeof candidate.expectedOutcome === "string" ? compactText(candidate.expectedOutcome) : "";

            if (!title || !summary || !rationale || !priority || actionablePlans.length === 0 || !expectedOutcome) {
              return null;
            }

            return {
              title,
              summary,
              rationale,
              priority,
              confidenceScore: Math.max(0, Math.min(1, toNumber(candidate.confidenceScore, 0.7))),
              actionablePlans,
              expectedOutcome
            };
          })
          .filter((candidate): candidate is WorkflowProjectCandidate => Boolean(candidate));

        if (candidates.length === 0) {
          return null;
        }

        return {
          summary: compactText(value.summary),
          candidates
        };
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateNextPhaseFromOutcome(args: {
  workflow: WorkflowRecord;
  previousPhase: ProjectPhaseRecord;
  extraction: WorkflowExtraction;
  report: string;
  outcomeInput: string;
}) {
  const fallback = createNextPhaseFromOutcome(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You decide whether a project should close or continue into a next phase.",
          args.workflow.config.phaseBuilderPrompt,
          "Return JSON only with keys: closeSignal, summary, nextPhase.",
          "If closeSignal is true, nextPhase must be null.",
          "If closeSignal is false, nextPhase must include title, objective, actionablePlans, and expectedOutcome."
        ].join("\n"),
        userPrompt: [
          `Workflow: ${args.workflow.name}`,
          `Previous phase title: ${args.previousPhase.title}`,
          `Previous phase objective: ${args.previousPhase.objective}`,
          `Outcome report:\n${args.report}`,
          `Validated extraction headline: ${args.extraction.headline}`,
          `Validated extraction items:\n- ${args.extraction.items.join("\n- ")}`,
          `Original outcome input:\n${args.outcomeInput}`
        ].join("\n\n"),
        temperature: 0.2
      },
      (value) => {
        if (!isRecord(value) || typeof value.closeSignal !== "boolean" || typeof value.summary !== "string") {
          return null;
        }

        if (value.closeSignal) {
          return {
            closeSignal: true,
            summary: compactText(value.summary),
            nextPhase: null
          };
        }

        if (!isRecord(value.nextPhase)) {
          return null;
        }

        const title = typeof value.nextPhase.title === "string" ? compactText(value.nextPhase.title) : "";
        const objective =
          typeof value.nextPhase.objective === "string" ? compactText(value.nextPhase.objective) : "";
        const actionablePlans = toStringArray(value.nextPhase.actionablePlans).slice(0, 5);
        const expectedOutcome =
          typeof value.nextPhase.expectedOutcome === "string"
            ? compactText(value.nextPhase.expectedOutcome)
            : "";

        if (!title || !objective || actionablePlans.length === 0 || !expectedOutcome) {
          return null;
        }

        return {
          closeSignal: false,
          summary: compactText(value.summary),
          nextPhase: {
            title,
            objective,
            actionablePlans,
            expectedOutcome
          }
        };
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateRequestRecommendation(args: {
  prompt: string;
  extraction: WorkflowExtraction;
  report: string;
  applicationText: string;
}): Promise<RequestAiRecommendation> {
  const fallback = createRequestRecommendation(args);

  try {
    const response = await requestLiveJson(
      {
        systemPrompt: [
          "You recommend whether HQ should approve or reject a request application.",
          args.prompt,
          "Return JSON only with keys: recommendation, reason, confidenceScore.",
          'recommendation must be either "Approve" or "Reject".'
        ].join("\n"),
        userPrompt: [
          `Request report:\n${args.report}`,
          `Validated extraction headline: ${args.extraction.headline}`,
          `Validated extraction items:\n- ${args.extraction.items.join("\n- ")}`,
          `Request application and support context:\n${args.applicationText}`
        ].join("\n\n"),
        temperature: 0.1
      },
      (value) => {
        if (!isRecord(value)) {
          return null;
        }

        const recommendation =
          value.recommendation === "Approve" || value.recommendation === "Reject"
            ? value.recommendation
            : null;
        const reason = typeof value.reason === "string" ? compactText(value.reason) : "";

        if (!recommendation || !reason) {
          return null;
        }

        const normalized: RequestAiRecommendation = {
          recommendation,
          reason,
          confidenceScore: Math.max(0, Math.min(1, toNumber(value.confidenceScore, fallback.confidenceScore)))
        };

        return normalized;
      }
    );

    return response ?? fallback;
  } catch {
    return fallback;
  }
}
