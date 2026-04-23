import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";
import type {
  AiEvidence,
  AiInsight,
  AttachmentReference,
  CreateIssueInput,
  CreatePlanSubmissionInput,
  CreateProjectInput,
  OfficeAccount,
  PlanInsight,
  ProjectReport
} from "@/types/system";

function joinNames(attachments: AttachmentReference[]) {
  if (attachments.length === 0) {
    return "No supporting files were attached.";
  }

  return attachments.map((attachment) => attachment.name).join(", ");
}

function buildEvidence(inputs: AiEvidence[]): AiEvidence[] {
  return inputs.filter((item) => item.detail.trim().length > 0);
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
