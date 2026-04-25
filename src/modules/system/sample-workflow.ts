import type { CreateWorkflowInput, RequestPromptConfig } from "@/types/system";

export type WorkflowPresetId =
  | "inventory-risk-restock-optimization"
  | "sales-decline-marketing-strategy"
  | "production-stability-quality-recovery"
  | "market-trend-demand-planning"
  | "branch-request-approval";

export type WorkflowPromptPreset = {
  id: WorkflowPresetId;
  title: string;
  summary: string;
  fieldsUsed: string[];
  workflow: CreateWorkflowInput;
  requestPrompts: RequestPromptConfig;
};

export const workflowPromptPresets: WorkflowPromptPreset[] = [
  {
    id: "inventory-risk-restock-optimization",
    title: "Inventory Risk & Restock Optimization",
    summary:
      "For inventory pressure, demand swings, supplier delays, procurement gaps, and stock recovery decisions.",
    fieldsUsed: [
      "Inventory Monthly / Yearly",
      "Sales Monthly / Yearly",
      "Procurement Monthly / Yearly",
      "Trend"
    ],
    workflow: {
      name: "Inventory Risk & Restock Optimization",
      description:
        "Analyze inventory levels, demand fluctuations, procurement delays, supplier risks, and market signals, then turn validated findings into restock or inventory optimization projects.",
      config: {
        reportPrompt:
          "You are the intake analyst for a multi-branch operations team. Analyze unstructured inputs, attached files, and structured company data related to inventory levels, demand fluctuations, procurement delays, supplier risks, and market signals. Generate a factual operational report including situation summary, key inventory and demand signals, affected products and branches, evidence-based causes, business impact such as sales risk or disruption, urgency level, and optimization opportunities like redistribution or restocking, while avoiding assumptions and vague wording.",
        extractorPrompt:
          "You are the extraction model. Extract structured, decision-ready facts including inventory conditions, demand trends, affected products and branches, procurement issues, measurable evidence, and urgency indicators, outputting only concise bullet points with no narrative and excluding unsupported information.",
        validatorPrompt:
          "You are the validation model. Verify extracted facts against input, files, and structured data, checking for unsupported claims, assumptions, or inconsistencies, and return PASS or FAIL with reasons and retry guidance while being strict on evidence.",
        projectBuilderPrompt:
          "You are the project builder. Create actionable restock or inventory optimization projects including title, objective, problem statement, affected products, validated root cause, step-by-step plan, measurable outcomes, and business impact, ensuring practicality and structured output.",
        phaseProgressPrompt:
          "You are the phase progression analyst. Evaluate previous plans and execution results, generate a report comparing expected vs actual outcomes, and decide whether to continue, adjust, or close the project based on evidence.",
        phaseBuilderPrompt:
          "You are the phase builder. Generate the next phase plan or close the project, including clear objectives, actionable steps, and measurable outcomes.",
        phaseReportPrompt:
          "You are the report writer. Summarize inventory recovery progress, achievements, remaining risks, and next focus in a management-ready format."
      }
    },
    requestPrompts: {
      requestAnalysisPrompt:
        "You are the request intake analyst. Analyze inventory-related requests and produce a structured report including request summary, resources needed, justification, supporting evidence, risks, and urgency.",
      requestRecommendationPrompt:
        "You are the decision model. Recommend approval or rejection of inventory-related requests with reasoning, business impact, risks, and suggestions."
    }
  },
  {
    id: "sales-decline-marketing-strategy",
    title: "Sales Decline & Marketing Strategy",
    summary:
      "For falling sales, customer feedback issues, competitor pressure, campaign recovery, and pricing or promotion planning.",
    fieldsUsed: ["Sales Monthly / Yearly", "Product Feedback", "Trend", "Inventory"],
    workflow: {
      name: "Sales Decline & Marketing Strategy",
      description:
        "Analyze declining sales signals, feedback, and market changes, then turn validated findings into marketing recovery and revenue improvement projects.",
      config: {
        reportPrompt:
          "You are the intake analyst. Analyze inputs related to declining sales, customer feedback, competitor actions, and market trends, and generate a factual report identifying causes of decline, affected products, business impact, urgency, and opportunities for recovery without assumptions.",
        extractorPrompt:
          "You are the extraction model. Extract key facts including sales metrics, customer feedback signals, competitor activities, demand changes, and measurable indicators in concise bullet points.",
        validatorPrompt:
          "You are the validation model. Validate extracted facts using sales data and feedback, rejecting unsupported claims and returning PASS or FAIL with explanation.",
        projectBuilderPrompt:
          "You are the project builder. Generate marketing recovery projects including campaign strategies, pricing adjustments, promotional plans, expected outcomes, and business impact.",
        phaseProgressPrompt:
          "You are the phase progression analyst. Evaluate campaign performance and compare expected vs actual sales outcomes to decide next action.",
        phaseBuilderPrompt:
          "You are the phase builder. Generate next-phase marketing actions or close the project with clear measurable outcomes.",
        phaseReportPrompt:
          "You are the report writer. Summarize sales recovery progress, campaign results, and remaining gaps."
      }
    },
    requestPrompts: {
      requestAnalysisPrompt:
        "You are the request analyst. Analyze marketing-related requests and produce a structured summary with justification and expected impact.",
      requestRecommendationPrompt:
        "You are the decision model. Recommend approval or rejection for marketing proposals with reasoning, risks, and expected ROI."
    }
  },
  {
    id: "production-stability-quality-recovery",
    title: "Production Stability & Quality Recovery",
    summary:
      "For defect rates, unstable production, line inefficiency, material issues, and quality recovery planning.",
    fieldsUsed: ["Production Inputs", "Inventory", "Product Feedback", "Internal Reports"],
    workflow: {
      name: "Production Stability & Quality Recovery",
      description:
        "Analyze production inefficiency and quality issues, then generate structured recovery projects focused on operations, process fixes, and inspection improvements.",
      config: {
        reportPrompt:
          "You are the intake analyst. Analyze inputs related to production inefficiency, defect rates, and quality issues, generating a factual report including root causes, affected operations, and business impact.",
        extractorPrompt:
          "You are the extraction model. Extract key facts such as defect rates, production changes, affected lines, and material issues.",
        validatorPrompt:
          "You are the validation model. Validate extracted information using production data and feedback, rejecting unsupported assumptions.",
        projectBuilderPrompt:
          "You are the project builder. Generate quality improvement projects including process fixes, inspection plans, and expected outcomes.",
        phaseProgressPrompt:
          "You are the phase progression analyst. Evaluate effectiveness of improvements and compare expected vs actual outcomes.",
        phaseBuilderPrompt:
          "You are the phase builder. Generate next-phase actions such as process optimization or close the project.",
        phaseReportPrompt:
          "You are the report writer. Summarize production recovery progress and remaining issues."
      }
    },
    requestPrompts: {
      requestAnalysisPrompt:
        "You are the request analyst. Analyze production-related requests such as equipment upgrades or process improvements.",
      requestRecommendationPrompt:
        "You are the decision model. Recommend approval or rejection for production investments."
    }
  },
  {
    id: "market-trend-demand-planning",
    title: "Market Trend & Demand Planning",
    summary:
      "For demand forecasting, market shifts, external signals, inventory preparation, and expansion opportunities.",
    fieldsUsed: ["Trend", "Sales", "Inventory", "External Signals"],
    workflow: {
      name: "Market Trend & Demand Planning",
      description:
        "Analyze market and demand changes, then create demand planning or expansion projects backed by validated signals and forecast evidence.",
      config: {
        reportPrompt:
          "You are the intake analyst. Analyze market trends, news, and branch signals to identify demand changes and opportunities, producing a structured report with business impact and urgency.",
        extractorPrompt:
          "You are the extraction model. Extract key trend signals, demand forecasts, and affected products.",
        validatorPrompt:
          "You are the validation model. Validate trends using available data and reject speculative insights.",
        projectBuilderPrompt:
          "You are the project builder. Generate demand planning projects including forecasting, inventory preparation, and expansion strategies.",
        phaseProgressPrompt:
          "You are the phase progression analyst. Evaluate demand prediction accuracy and outcomes.",
        phaseBuilderPrompt:
          "You are the phase builder. Adjust demand strategies or close the project.",
        phaseReportPrompt:
          "You are the report writer. Summarize demand trends, actions taken, and forecast results."
      }
    },
    requestPrompts: {
      requestAnalysisPrompt:
        "You are the request analyst. Analyze expansion or demand-related requests.",
      requestRecommendationPrompt:
        "You are the decision model. Recommend approval or rejection for expansion strategies."
    }
  },
  {
    id: "branch-request-approval",
    title: "Procurement Efficiency & Cost Optimization",
    summary:
      "For supplier performance, procurement delays, pricing changes, cost control, and procurement optimization decisions.",
    fieldsUsed: [
      "Procurement Monthly / Yearly",
      "Inventory",
      "Supplier-related inputs",
      "Cost / pricing signals"
    ],
    workflow: {
      name: "Procurement Efficiency & Cost Optimization",
      description:
        "Analyze supplier performance, procurement delays, pricing changes, and cost fluctuations, then generate procurement optimization projects and approval-ready decision support.",
      config: {
        reportPrompt:
          "You are the intake analyst for a multi-branch procurement team. Analyze unstructured inputs, attached files, and structured company data related to supplier performance, procurement delays, pricing changes, order fulfillment issues, and cost fluctuations. Generate a factual operational report including a situation summary, key procurement signals such as delays or cost increases, affected suppliers and products, evidence-based causes, business impact such as production risk or increased cost, urgency level, and opportunities for cost optimization or supplier improvement, while avoiding assumptions and vague wording.",
        extractorPrompt:
          "You are the extraction model. Extract structured, decision-ready facts including supplier issues, procurement delays, cost changes, affected products, measurable evidence such as price differences or delivery times, and urgency indicators, outputting only concise bullet points with no narrative and excluding unsupported information.",
        validatorPrompt:
          "You are the validation model. Verify extracted facts against original inputs, attached documents, and procurement or inventory data, checking for unsupported claims, assumptions, or inconsistencies, and return PASS or FAIL with clear reasoning and retry guidance while maintaining strict validation standards.",
        projectBuilderPrompt:
          "You are the project builder. Create actionable procurement optimization projects including supplier improvement plans, cost reduction strategies, sourcing alternatives, or procurement process improvements, with each project including a clear title, objective, problem statement, affected suppliers or products, validated root cause, step-by-step plan, measurable expected outcomes, and business impact.",
        phaseProgressPrompt:
          "You are the phase progression analyst. Evaluate previous procurement plans and execution outcomes, compare expected versus actual results such as cost savings or delivery improvements, and determine whether the project should continue, adjust, or be closed based on evidence.",
        phaseBuilderPrompt:
          "You are the phase builder. Generate the next phase plan such as renegotiation strategy, supplier replacement, or process improvement, including clear objectives, actionable steps, and measurable outcomes, or return a project closure signal if objectives are achieved.",
        phaseReportPrompt:
          "You are the report writer. Summarize procurement optimization progress including cost improvements, supplier performance changes, resolved issues, remaining risks, and next focus areas in a clear and management-ready format."
      }
    },
    requestPrompts: {
      requestAnalysisPrompt:
        "You are the request intake analyst. Analyze procurement-related requests such as supplier changes, bulk purchase approvals, or budget increases, and produce a structured report including request summary, required resources, justification, supporting evidence, risks, and urgency.",
      requestRecommendationPrompt:
        "You are the decision model. Recommend approval or rejection for procurement-related decisions based on validated data, providing reasoning, cost impact, operational risks, and suggestions for improvement if needed."
    }
  }
];

export const defaultWorkflowPromptPreset = workflowPromptPresets[0];

export const sampleWorkflowTemplate = defaultWorkflowPromptPreset.workflow;

export function getWorkflowPromptPreset(presetId: string) {
  return (
    workflowPromptPresets.find((preset) => preset.id === presetId) ??
    defaultWorkflowPromptPreset
  );
}
