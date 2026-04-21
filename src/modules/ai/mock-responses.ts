import type {
  ApprovalRecommendationOutput,
  InputUnderstandingOutput,
  OutcomeReviewOutput,
  PhasePlanGenerationOutput,
  ProjectIdentificationOutput,
  ValidationOutput
} from "./types";

export const MOCK_INPUT_UNDERSTANDING = {
  low_stock_rising_demand: {
    input_understanding: {
      issue_type: "low stock with rising demand",
      business_area: "inventory",
      branch: "Kuala Lumpur Central Branch",
      urgency: "high",
      summary:
        "Branch reports low stock for a fast-moving product while customer demand is increasing.",
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
        "Target restock quantity"
      ],
      confidence_score: 82,
      suggest_project_creation: true
    }
  },
  overstock_risk: {
    input_understanding: {
      issue_type: "overstock risk",
      business_area: "inventory",
      branch: "Johor Bahru Branch",
      urgency: "medium",
      summary:
        "Branch reports excess inventory for a slower-moving product and requests guidance before the next replenishment cycle.",
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
        "Product expiry or markdown deadline",
        "Demand trend by branch"
      ],
      confidence_score: 76,
      suggest_project_creation: true
    }
  },
  negative_product_feedback_trend: {
    input_understanding: {
      issue_type: "negative product feedback trend",
      business_area: "customer feedback",
      branch: "Penang North Branch",
      urgency: "medium",
      summary:
        "Branch reports repeated negative feedback for a product and needs analysis before deciding corrective action.",
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
        "Product batch or SKU"
      ],
      confidence_score: 71,
      suggest_project_creation: true
    }
  },
  urgent_branch_escalation: {
    input_understanding: {
      issue_type: "urgent branch escalation",
      business_area: "branch operations",
      branch: "Kuala Lumpur Central Branch",
      urgency: "critical",
      summary:
        "Branch escalates an operational issue that may affect customer service continuity and requires HQ attention.",
      risks: [
        "Branch operations may be disrupted.",
        "Customer commitments may be missed without timely action."
      ],
      opportunities: [
        "HQ can coordinate rapid support and reduce operational impact."
      ],
      missing_information: [
        "Exact operational blocker",
        "Affected customers or services",
        "Required decision deadline"
      ],
      confidence_score: 58,
      suggest_project_creation: true
    }
  }
} satisfies Record<string, InputUnderstandingOutput>;

export const MOCK_PROJECT_IDENTIFICATION = {
  low_stock_rising_demand: {
    project_identification: {
      should_create_project: true,
      project_title: "Low Stock Response for Rising Demand",
      project_summary:
        "Coordinate replenishment planning for a branch reporting low stock and increasing customer demand.",
      project_type: "inventory_response",
      recommended_owner: "Branch Office",
      recommended_priority: "high",
      recommended_initial_phase: "Confirm demand and stock gap",
      supporting_reasons: [
        "Input indicates operational risk from low stock.",
        "Demand appears to be increasing.",
        "Branch action may require HQ approval for restock or transfer."
      ]
    }
  },
  overstock_risk: {
    project_identification: {
      should_create_project: true,
      project_title: "Overstock Risk Mitigation",
      project_summary:
        "Review excess inventory and coordinate stock transfer, promotion, or replenishment adjustment.",
      project_type: "inventory_optimization",
      recommended_owner: "Branch Office",
      recommended_priority: "medium",
      recommended_initial_phase: "Verify overstock scope",
      supporting_reasons: [
        "Input indicates inventory holding risk.",
        "Next replenishment can be adjusted if evidence confirms slow demand."
      ]
    }
  }
} satisfies Record<string, ProjectIdentificationOutput>;

export const MOCK_PHASE_PLAN_GENERATION = {
  confirm_demand_and_stock_gap: {
    phase_plan_generation: {
      phase_name: "Confirm demand and stock gap",
      objective:
        "Verify current stock, recent sales rate, and replenishment need before requesting approval.",
      rationale:
        "The branch reported low stock and rising demand, but exact stock and demand figures are missing.",
      action_steps: [
        "Collect current stock quantity for the affected product.",
        "Collect recent sales rate for the last 7 to 14 days.",
        "Compare current stock against expected demand before next replenishment.",
        "Prepare restock or transfer request if the gap is confirmed."
      ],
      responsible_party: "Branch Office",
      required_inputs: [
        "Current stock quantity",
        "Recent sales rate",
        "Expected replenishment date",
        "Requested restock or transfer quantity"
      ],
      expected_output:
        "Evidence-backed restock or stock transfer request for HQ approval.",
      dependencies: [
        "Branch inventory records",
        "Recent sales report",
        "HQ stock availability"
      ],
      estimated_risk: "medium",
      impact_if_successful:
        "Branch can reduce stockout risk and maintain customer service during rising demand.",
      confidence_score: 78
    }
  },
  validate_feedback_trend: {
    phase_plan_generation: {
      phase_name: "Validate negative feedback trend",
      objective:
        "Confirm whether negative feedback is recurring and identify the affected product, issue pattern, and business impact.",
      rationale:
        "The branch reported repeated negative feedback, but volume, period, and product identifiers are missing.",
      action_steps: [
        "Collect customer feedback records for the relevant period.",
        "Group feedback by product, issue type, and branch touchpoint.",
        "Identify repeated patterns and unresolved issues.",
        "Summarize whether HQ action or supplier follow-up is required."
      ],
      responsible_party: "Branch Office",
      required_inputs: [
        "Feedback records",
        "Feedback period",
        "Product SKU or batch",
        "Current branch response"
      ],
      expected_output:
        "Structured feedback trend summary with evidence and recommended escalation path.",
      dependencies: [
        "Branch feedback logs",
        "Product records",
        "Customer service notes"
      ],
      estimated_risk: "medium",
      impact_if_successful:
        "Branch and HQ can address product feedback with a grounded corrective plan.",
      confidence_score: 73
    }
  }
} satisfies Record<string, PhasePlanGenerationOutput>;

export const MOCK_VALIDATION = {
  missing_information_warning: {
    validation: {
      groundedness_score: 62,
      missing_information: [
        "Current stock quantity",
        "Recent sales rate",
        "Requested restock quantity"
      ],
      unsupported_claims: [
        "Plan assumes restock quantity can be approved before stock availability is confirmed."
      ],
      contradiction_flags: [],
      impact_analysis:
        "The plan direction is reasonable, but approval should not proceed until stock and demand evidence is collected.",
      mitigation_steps: [
        "Require branch inventory evidence before approval request.",
        "Ask HQ to verify stock availability before restock commitment.",
        "Keep project in validation_pending until missing information is resolved."
      ],
      proceed_recommendation: "human_review_required",
      human_review_level: "required"
    }
  },
  proceed_with_caution: {
    validation: {
      groundedness_score: 78,
      missing_information: ["HQ stock availability"],
      unsupported_claims: [],
      contradiction_flags: [],
      impact_analysis:
        "The plan is mostly grounded, but HQ stock availability is still needed before approval.",
      mitigation_steps: [
        "Confirm HQ stock availability.",
        "Proceed only with a quantity supported by inventory records."
      ],
      proceed_recommendation: "proceed_with_caution",
      human_review_level: "recommended"
    }
  }
} satisfies Record<string, ValidationOutput>;

export const MOCK_APPROVAL_RECOMMENDATION = {
  restock_request: {
    approval_recommendation: {
      request_summary:
        "Branch requests approval for restock action after reporting low stock and rising demand.",
      decision_recommendation: "revise_requested",
      reason_for_recommendation:
        "The request direction is reasonable, but current stock quantity, sales rate, and requested restock quantity must be confirmed before approval.",
      risk_level: "medium",
      urgency_level: "high",
      confidence_score: 74,
      required_human_checks: [
        "Verify current stock quantity.",
        "Verify recent sales rate.",
        "Confirm requested restock quantity and HQ stock availability."
      ]
    }
  },
  pricing_adjustment: {
    approval_recommendation: {
      request_summary:
        "Branch requests approval for pricing adjustment to reduce overstock risk.",
      decision_recommendation: "revise_requested",
      reason_for_recommendation:
        "Pricing action could affect margin and customer expectations, and the input does not include stock quantity, margin impact, or promotion duration.",
      risk_level: "high",
      urgency_level: "medium",
      confidence_score: 67,
      required_human_checks: [
        "Confirm margin impact.",
        "Confirm current stock quantity.",
        "Confirm promotion duration and branch scope."
      ]
    }
  }
} satisfies Record<string, ApprovalRecommendationOutput>;

export const MOCK_OUTCOME_REVIEW = {
  successful_execution_next_phase: {
    outcome_review: {
      outcome_summary:
        "Branch submitted evidence that stock verification was completed and a restock request was prepared.",
      success_level: "successful",
      unresolved_issues: ["HQ approval is still required before restock action."],
      lessons_learned: [
        "Stock gap should be quantified before requesting HQ decision.",
        "Recent sales rate improves confidence in restock urgency."
      ],
      next_phase_required: true,
      next_phase_plan: {
        phase_name: "Request HQ restock approval",
        objective:
          "Submit verified stock gap and demand evidence for HQ approval decision.",
        rationale:
          "Execution evidence confirms the branch completed verification and now needs HQ decision support.",
        action_steps: [
          "Attach stock quantity and recent sales evidence.",
          "Submit requested restock or transfer quantity.",
          "Ask HQ to approve, reject, revise, or escalate the request."
        ],
        responsible_party: "Branch Office",
        required_inputs: [
          "Verified stock quantity",
          "Recent sales rate",
          "Requested restock quantity",
          "HQ stock availability if known"
        ],
        expected_output: "Approval request ready for HQ decision.",
        dependencies: [
          "Completed stock verification",
          "Branch execution_update",
          "HQ approval workflow"
        ],
        estimated_risk: "medium",
        impact_if_successful:
          "HQ can make a grounded restock decision and reduce stockout risk.",
        confidence_score: 81
      },
      improvement_suggestions: [
        "Use a standard stock verification checklist before restock approval requests.",
        "Include sales rate and requested quantity in every inventory escalation."
      ]
    }
  },
  failed_execution: {
    outcome_review: {
      outcome_summary:
        "Branch execution_update does not provide enough evidence to confirm the planned action was completed.",
      success_level: "failed",
      unresolved_issues: [
        "Evidence text is incomplete.",
        "No clear result or next action is provided."
      ],
      lessons_learned: [
        "Execution updates need evidence and measurable outcome details."
      ],
      next_phase_required: true,
      next_phase_plan: {
        phase_name: "Resubmit execution evidence",
        objective:
          "Collect and submit missing execution evidence so the project can move forward.",
        rationale:
          "The submitted execution_update is not sufficient to determine outcome success.",
        action_steps: [
          "Collect concrete evidence for the executed action.",
          "Summarize what was completed and what remains unresolved.",
          "Submit updated execution_update for review."
        ],
        responsible_party: "Branch Office",
        required_inputs: [
          "Evidence text",
          "Outcome summary",
          "Unresolved issues"
        ],
        expected_output: "Complete execution_update ready for outcome review.",
        dependencies: ["Branch evidence records"],
        estimated_risk: "low",
        impact_if_successful:
          "HQ and branch can make the next workflow decision with clearer evidence.",
        confidence_score: 70
      },
      improvement_suggestions: [
        "Require outcome_summary and evidence_text before accepting execution_update."
      ]
    }
  }
} satisfies Record<string, OutcomeReviewOutput>;

export const MOCK_AI_RESPONSES = {
  input_understanding: MOCK_INPUT_UNDERSTANDING,
  project_identification: MOCK_PROJECT_IDENTIFICATION,
  phase_plan_generation: MOCK_PHASE_PLAN_GENERATION,
  validation: MOCK_VALIDATION,
  approval_recommendation: MOCK_APPROVAL_RECOMMENDATION,
  outcome_review: MOCK_OUTCOME_REVIEW
} as const;
