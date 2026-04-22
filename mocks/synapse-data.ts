import type {
  AiAnalysis,
  Approval,
  Branch,
  ExecutionUpdate,
  Phase,
  Plan,
  Project,
  ProjectInput,
  User,
  Validation
} from "@/types";

type SeedData = {
  branches: Branch[];
  users: User[];
  projects: Project[];
  project_inputs: ProjectInput[];
  ai_analysis: AiAnalysis[];
  phases: Phase[];
  plans: Plan[];
  validations: Validation[];
  execution_updates: ExecutionUpdate[];
  approvals: Approval[];
};

export const seedData: SeedData = {
  branches: [
    {
      id: "branch-north",
      name: "North Branch",
      region: "Northern Region",
      manager_name: "Amina Yusuf",
      status: "active"
    },
    {
      id: "branch-south",
      name: "South Branch",
      region: "Southern Region",
      manager_name: "Daniel Ong",
      status: "active"
    },
    {
      id: "branch-central",
      name: "Central Branch",
      region: "Central Region",
      manager_name: "Mira Tan",
      status: "active"
    }
  ],
  users: [
    {
      id: "user-hq-1",
      name: "Hannah Quill",
      email: "hq@synapsecore.local",
      role: "HQ",
      branch_id: null,
      created_at: "2026-04-01T08:00:00.000Z"
    },
    {
      id: "user-branch-1",
      name: "Noah Idris",
      email: "north.branch@synapsecore.local",
      role: "Branch Office",
      branch_id: "branch-north",
      created_at: "2026-04-01T08:10:00.000Z"
    },
    {
      id: "user-branch-2",
      name: "Sara Lee",
      email: "south.branch@synapsecore.local",
      role: "Branch Office",
      branch_id: "branch-south",
      created_at: "2026-04-01T08:15:00.000Z"
    },
    {
      id: "user-branch-3",
      name: "Kavin Raj",
      email: "central.branch@synapsecore.local",
      role: "Branch Office",
      branch_id: "branch-central",
      created_at: "2026-04-01T08:20:00.000Z"
    }
  ],
  projects: [
    {
      id: "project-low-stock",
      title: "North branch low stock with rising demand",
      summary: "Low stock alert for high-demand household essentials in North Branch.",
      project_type: "inventory_response",
      branch_id: "branch-north",
      created_by: "user-branch-1",
      owner_role: "Branch Office",
      priority: "high",
      status: "approval_pending",
      ai_confidence: 88,
      approval_status: "pending",
      created_at: "2026-04-10T08:30:00.000Z",
      updated_at: "2026-04-19T08:30:00.000Z"
    },
    {
      id: "project-overstock",
      title: "South branch overstock risk",
      summary: "Seasonal goods inventory is accumulating beyond the branch sell-through pace.",
      project_type: "inventory_optimization",
      branch_id: "branch-south",
      created_by: "user-branch-2",
      owner_role: "Branch Office",
      priority: "medium",
      status: "validation_pending",
      ai_confidence: 81,
      approval_status: "revise_requested",
      created_at: "2026-04-08T09:00:00.000Z",
      updated_at: "2026-04-20T11:00:00.000Z"
    },
    {
      id: "project-feedback",
      title: "Central branch negative product feedback trend",
      summary: "Customer feedback indicates a quality issue on a recently promoted product line.",
      project_type: "customer_response",
      branch_id: "branch-central",
      created_by: "user-branch-3",
      owner_role: "Branch Office",
      priority: "high",
      status: "active",
      ai_confidence: 84,
      approval_status: "pending",
      created_at: "2026-04-09T08:00:00.000Z",
      updated_at: "2026-04-18T08:00:00.000Z"
    },
    {
      id: "project-escalation",
      title: "Urgent branch escalation for fulfillment disruption",
      summary: "Central Branch reported a logistics disruption that threatens same-week delivery commitments.",
      project_type: "branch_escalation",
      branch_id: "branch-central",
      created_by: "user-branch-3",
      owner_role: "Branch Office",
      priority: "critical",
      status: "escalated",
      ai_confidence: 92,
      approval_status: "escalated",
      created_at: "2026-04-11T07:30:00.000Z",
      updated_at: "2026-04-20T07:30:00.000Z"
    },
    {
      id: "project-pricing",
      title: "HQ approval request for targeted pricing action",
      summary: "South Branch requested approval for a short-term pricing action to reduce overstock risk.",
      project_type: "pricing_action",
      branch_id: "branch-south",
      created_by: "user-branch-2",
      owner_role: "Branch Office",
      priority: "medium",
      status: "approval_pending",
      ai_confidence: 79,
      approval_status: "pending",
      created_at: "2026-04-12T10:00:00.000Z",
      updated_at: "2026-04-19T09:30:00.000Z"
    },
    {
      id: "project-next-phase",
      title: "North branch restock execution improvement cycle",
      summary: "A completed restock cycle is being reviewed for the next phase generation after execution.",
      project_type: "execution_improvement",
      branch_id: "branch-north",
      created_by: "user-branch-1",
      owner_role: "Branch Office",
      priority: "high",
      status: "executing",
      ai_confidence: 86,
      approval_status: "approved",
      created_at: "2026-04-07T10:30:00.000Z",
      updated_at: "2026-04-20T10:30:00.000Z"
    }
  ],
  project_inputs: [
    {
      id: "input-low-stock",
      project_id: "project-low-stock",
      source_type: "branch_report",
      raw_text: "North Branch reports detergent stock-out risk while weekly demand grows 18 percent. Requesting urgent restock approval.",
      file_url: null,
      uploaded_by: "user-branch-1",
      created_at: "2026-04-10T08:00:00.000Z"
    },
    {
      id: "input-overstock",
      project_id: "project-overstock",
      source_type: "branch_report",
      raw_text: "South Branch has 6 weeks of excess seasonal inventory and weaker conversion than forecast.",
      file_url: null,
      uploaded_by: "user-branch-2",
      created_at: "2026-04-08T08:15:00.000Z"
    },
    {
      id: "input-feedback",
      project_id: "project-feedback",
      source_type: "feedback",
      raw_text: "Customer feedback shows a negative trend on the insulated bottle line after the latest promotion.",
      file_url: null,
      uploaded_by: "user-branch-3",
      created_at: "2026-04-09T07:45:00.000Z"
    },
    {
      id: "input-escalation",
      project_id: "project-escalation",
      source_type: "manual_form",
      raw_text: "Central Branch escalates carrier disruption impacting outbound orders for the next 72 hours.",
      file_url: null,
      uploaded_by: "user-branch-3",
      created_at: "2026-04-11T07:00:00.000Z"
    },
    {
      id: "input-pricing",
      project_id: "project-pricing",
      source_type: "market_news",
      raw_text: "Competitive discounting in South region is accelerating. Branch requests approval for controlled pricing action.",
      file_url: null,
      uploaded_by: "user-branch-2",
      created_at: "2026-04-12T09:30:00.000Z"
    },
    {
      id: "input-next-phase",
      project_id: "project-next-phase",
      source_type: "outcome_update",
      raw_text: "Initial restock action recovered shelf availability to 94 percent. Branch wants AI next phase guidance.",
      file_url: null,
      uploaded_by: "user-branch-1",
      created_at: "2026-04-20T09:45:00.000Z"
    }
  ],
  ai_analysis: [
    {
      id: "analysis-low-stock",
      input_id: "input-low-stock",
      issue_type: "inventory_shortage",
      business_area: "inventory",
      branch: "North Branch",
      urgency: "high",
      summary: "Demand is rising faster than replenishment velocity, creating immediate low stock risk.",
      risks: ["Lost sales if replenishment is delayed", "Customer churn due to repeated stock-outs"],
      opportunities: ["Targeted restock", "Demand-based allocation adjustment"],
      missing_information: ["Supplier lead time confirmation"],
      confidence_score: 88,
      suggest_project_creation: true,
      created_at: "2026-04-10T08:05:00.000Z"
    },
    {
      id: "analysis-overstock",
      input_id: "input-overstock",
      issue_type: "overstock_risk",
      business_area: "inventory",
      branch: "South Branch",
      urgency: "medium",
      summary: "Inventory accumulation is outpacing expected demand and may require pricing or redistribution action.",
      risks: ["Margin erosion", "Aging stock"],
      opportunities: ["Pricing action", "Inter-branch transfer"],
      missing_information: ["Updated weekly sell-through by SKU", "HQ margin floor guidance"],
      confidence_score: 81,
      suggest_project_creation: true,
      created_at: "2026-04-08T08:20:00.000Z"
    },
    {
      id: "analysis-feedback",
      input_id: "input-feedback",
      issue_type: "negative_feedback_trend",
      business_area: "customer_experience",
      branch: "Central Branch",
      urgency: "high",
      summary: "Customer complaints suggest a product issue with a meaningful brand risk if left unresolved.",
      risks: ["Reputation impact", "Return volume increase"],
      opportunities: ["Rapid issue isolation", "Targeted communication"],
      missing_information: ["Root cause confirmation from supplier"],
      confidence_score: 84,
      suggest_project_creation: true,
      created_at: "2026-04-09T08:00:00.000Z"
    },
    {
      id: "analysis-escalation",
      input_id: "input-escalation",
      issue_type: "fulfillment_disruption",
      business_area: "operations",
      branch: "Central Branch",
      urgency: "critical",
      summary: "A logistics disruption needs immediate HQ coordination and contingency routing.",
      risks: ["Service level breach", "Revenue loss"],
      opportunities: ["Alternative carrier routing", "HQ escalation protocol"],
      missing_information: [],
      confidence_score: 92,
      suggest_project_creation: true,
      created_at: "2026-04-11T07:05:00.000Z"
    },
    {
      id: "analysis-pricing",
      input_id: "input-pricing",
      issue_type: "pricing_action",
      business_area: "commercial",
      branch: "South Branch",
      urgency: "medium",
      summary: "South Branch needs HQ approval for a controlled pricing action due to market pressure and excess stock.",
      risks: ["Margin compression"],
      opportunities: ["Faster stock clearance"],
      missing_information: ["Final pricing guardrails"],
      confidence_score: 79,
      suggest_project_creation: true,
      created_at: "2026-04-12T09:40:00.000Z"
    },
    {
      id: "analysis-next-phase",
      input_id: "input-next-phase",
      issue_type: "outcome_review",
      business_area: "execution",
      branch: "North Branch",
      urgency: "medium",
      summary: "Execution recovered availability and supports a follow-up optimization phase.",
      risks: ["Stock rebound if monitoring stops"],
      opportunities: ["Next phase generation", "Forecast tuning"],
      missing_information: ["Regional demand uplift confirmation"],
      confidence_score: 86,
      suggest_project_creation: false,
      created_at: "2026-04-20T09:50:00.000Z"
    }
  ],
  phases: [
    {
      id: "phase-low-stock-1",
      project_id: "project-low-stock",
      phase_name: "Demand validation",
      phase_order: 1,
      objective: "Validate stock-out severity and confirm replenishment action.",
      responsible_party: "Branch Office",
      status: "validating",
      due_date: "2026-04-22T00:00:00.000Z",
      created_at: "2026-04-10T08:30:00.000Z",
      updated_at: "2026-04-19T08:00:00.000Z"
    },
    {
      id: "phase-overstock-1",
      project_id: "project-overstock",
      phase_name: "Inventory review",
      phase_order: 1,
      objective: "Collect sell-through data and determine the safest reduction action.",
      responsible_party: "Branch Office",
      status: "validating",
      due_date: "2026-04-23T00:00:00.000Z",
      created_at: "2026-04-08T09:00:00.000Z",
      updated_at: "2026-04-20T11:00:00.000Z"
    },
    {
      id: "phase-feedback-1",
      project_id: "project-feedback",
      phase_name: "Issue isolation",
      phase_order: 1,
      objective: "Isolate the product quality issue and define the remediation path.",
      responsible_party: "HQ",
      status: "planned",
      due_date: "2026-04-24T00:00:00.000Z",
      created_at: "2026-04-09T08:10:00.000Z",
      updated_at: "2026-04-18T08:10:00.000Z"
    },
    {
      id: "phase-escalation-1",
      project_id: "project-escalation",
      phase_name: "Contingency response",
      phase_order: 1,
      objective: "Activate HQ-led contingency steps for fulfillment protection.",
      responsible_party: "HQ",
      status: "blocked",
      due_date: "2026-04-21T18:00:00.000Z",
      created_at: "2026-04-11T07:30:00.000Z",
      updated_at: "2026-04-20T07:30:00.000Z"
    },
    {
      id: "phase-pricing-1",
      project_id: "project-pricing",
      phase_name: "Pricing approval pack",
      phase_order: 1,
      objective: "Prepare the approval request for controlled regional pricing action.",
      responsible_party: "Branch Office",
      status: "approved",
      due_date: "2026-04-22T00:00:00.000Z",
      created_at: "2026-04-12T10:00:00.000Z",
      updated_at: "2026-04-19T09:30:00.000Z"
    },
    {
      id: "phase-next-phase-1",
      project_id: "project-next-phase",
      phase_name: "Restock execution",
      phase_order: 1,
      objective: "Execute the approved replenishment action and collect outcome evidence.",
      responsible_party: "Branch Office",
      status: "completed",
      due_date: "2026-04-18T00:00:00.000Z",
      created_at: "2026-04-07T10:40:00.000Z",
      updated_at: "2026-04-19T12:00:00.000Z"
    },
    {
      id: "phase-next-phase-2",
      project_id: "project-next-phase",
      phase_name: "Demand monitoring improvement",
      phase_order: 2,
      objective: "Improve demand monitoring after the first restock outcome.",
      responsible_party: "HQ",
      status: "pending",
      due_date: "2026-04-27T00:00:00.000Z",
      created_at: "2026-04-20T10:45:00.000Z",
      updated_at: "2026-04-20T10:45:00.000Z"
    }
  ],
  plans: [
    {
      id: "plan-low-stock-1",
      phase_id: "phase-low-stock-1",
      objective: "Confirm demand pattern and approve replenishment action.",
      rationale: "Urgent inventory signals require grounded validation before HQ approval.",
      action_steps: ["Compare last 4 weeks demand", "Confirm supplier lead time", "Prepare restock request"],
      required_inputs: ["Weekly sales trend", "Current stock level", "Supplier ETA"],
      expected_output: "A validated restock recommendation.",
      dependencies: ["Branch inventory report"],
      estimated_risk: "medium",
      impact_if_successful: "Prevents lost sales from near-term stock-out.",
      confidence_score: 87,
      version: 1,
      created_at: "2026-04-10T08:40:00.000Z"
    },
    {
      id: "plan-overstock-1",
      phase_id: "phase-overstock-1",
      objective: "Reduce excess inventory without avoidable margin damage.",
      rationale: "Overstock may require price action, redistribution, or both.",
      action_steps: ["Collect SKU-level aging data", "Model transfer option", "Model pricing action"],
      required_inputs: ["SKU aging", "Margin floor", "Regional demand comparison"],
      expected_output: "A validated overstock action pack.",
      dependencies: ["HQ margin guidance"],
      estimated_risk: "medium",
      impact_if_successful: "Reduces inventory exposure and carrying cost.",
      confidence_score: 80,
      version: 1,
      created_at: "2026-04-08T09:20:00.000Z"
    },
    {
      id: "plan-feedback-1",
      phase_id: "phase-feedback-1",
      objective: "Resolve the negative feedback trend with evidence-backed remediation.",
      rationale: "Fast issue isolation limits further customer harm.",
      action_steps: ["Review complaint themes", "Check batch consistency", "Draft corrective action"],
      required_inputs: ["Feedback exports", "Supplier response", "Return data"],
      expected_output: "A corrective action plan for HQ review.",
      dependencies: ["Supplier quality report"],
      estimated_risk: "high",
      impact_if_successful: "Stabilizes sentiment and reduces returns.",
      confidence_score: 84,
      version: 1,
      created_at: "2026-04-09T08:20:00.000Z"
    },
    {
      id: "plan-escalation-1",
      phase_id: "phase-escalation-1",
      objective: "Protect orders during the fulfillment disruption.",
      rationale: "Critical disruption needs cross-team contingency response.",
      action_steps: ["Reassign urgent shipments", "Notify impacted branches", "Escalate vendor response"],
      required_inputs: ["Open order list", "Carrier update", "Alternative capacity"],
      expected_output: "A live contingency execution plan.",
      dependencies: ["Carrier confirmation"],
      estimated_risk: "high",
      impact_if_successful: "Reduces immediate service level impact.",
      confidence_score: 90,
      version: 1,
      created_at: "2026-04-11T07:40:00.000Z"
    },
    {
      id: "plan-pricing-1",
      phase_id: "phase-pricing-1",
      objective: "Prepare the approval packet for pricing action.",
      rationale: "HQ needs a bounded recommendation before approving pricing action.",
      action_steps: ["Define discount guardrails", "Estimate stock clearance impact", "Draft approval summary"],
      required_inputs: ["Current pricing", "Margin guardrails", "Clearance forecast"],
      expected_output: "HQ-ready approval request.",
      dependencies: ["HQ pricing policy"],
      estimated_risk: "medium",
      impact_if_successful: "Clears excess stock with controlled risk.",
      confidence_score: 78,
      version: 1,
      created_at: "2026-04-12T10:10:00.000Z"
    },
    {
      id: "plan-next-phase-2",
      phase_id: "phase-next-phase-2",
      objective: "Improve post-restock monitoring and demand sensing.",
      rationale: "The first execution recovered availability and supports a second optimization phase.",
      action_steps: ["Review outcome evidence", "Tune reorder threshold", "Schedule branch checkpoints"],
      required_inputs: ["Outcome review", "Demand trend", "Replenishment cadence"],
      expected_output: "A next phase monitoring plan.",
      dependencies: ["Execution outcome review"],
      estimated_risk: "low",
      impact_if_successful: "Improves replenishment quality and reduces repeat shortages.",
      confidence_score: 86,
      version: 1,
      created_at: "2026-04-20T10:50:00.000Z"
    }
  ],
  validations: [
    {
      id: "validation-low-stock-1",
      phase_id: "phase-low-stock-1",
      groundedness_score: 83,
      missing_information: ["Supplier lead time confirmation"],
      unsupported_claims: [],
      contradiction_flags: [],
      impact_analysis: "Proceeding without supplier confirmation may create a timing mismatch, but the business impact of delay is moderate to high.",
      mitigation_steps: ["Request supplier ETA before final approval", "Limit first restock quantity to validated demand band"],
      proceed_recommendation: "proceed_with_caution",
      human_review_level: "recommended",
      validated_at: "2026-04-19T08:10:00.000Z"
    },
    {
      id: "validation-overstock-1",
      phase_id: "phase-overstock-1",
      groundedness_score: 62,
      missing_information: ["Updated weekly sell-through by SKU", "HQ margin floor guidance"],
      unsupported_claims: ["Projected clearance timeline is not grounded in current sell-through evidence."],
      contradiction_flags: [],
      impact_analysis: "The plan needs more evidence before pricing action is safe to approve.",
      mitigation_steps: ["Collect current SKU sell-through", "Confirm margin floor with HQ"],
      proceed_recommendation: "human_review_required",
      human_review_level: "required",
      validated_at: "2026-04-20T11:00:00.000Z"
    },
    {
      id: "validation-feedback-1",
      phase_id: "phase-feedback-1",
      groundedness_score: 78,
      missing_information: ["Supplier root cause confirmation"],
      unsupported_claims: [],
      contradiction_flags: [],
      impact_analysis: "The project can continue, but supplier confirmation remains a material dependency.",
      mitigation_steps: ["Escalate supplier confirmation window"],
      proceed_recommendation: "proceed_with_caution",
      human_review_level: "recommended",
      validated_at: "2026-04-18T08:20:00.000Z"
    },
    {
      id: "validation-pricing-1",
      phase_id: "phase-pricing-1",
      groundedness_score: 85,
      missing_information: [],
      unsupported_claims: [],
      contradiction_flags: [],
      impact_analysis: "Approval request is grounded and ready for HQ decision.",
      mitigation_steps: ["Monitor margin impact weekly"],
      proceed_recommendation: "proceed",
      human_review_level: "optional",
      validated_at: "2026-04-19T09:10:00.000Z"
    }
  ],
  execution_updates: [
    {
      id: "execution-next-phase-1",
      phase_id: "phase-next-phase-1",
      submitted_by: "user-branch-1",
      outcome_summary: "Restock completed and shelf availability improved to 94 percent.",
      evidence_text: "Branch confirmed replenishment receipt and two-day sales stabilization.",
      file_url: null,
      success_level: "successful",
      unresolved_issues: ["Need tighter demand monitoring to avoid recurrence."],
      submitted_at: "2026-04-19T11:45:00.000Z"
    },
    {
      id: "execution-escalation-1",
      phase_id: "phase-escalation-1",
      submitted_by: "user-branch-3",
      outcome_summary: "Fallback routing started, but same-day carrier response remains incomplete.",
      evidence_text: "Partial mitigation applied while orders remain exposed.",
      file_url: null,
      success_level: "partial",
      unresolved_issues: ["Alternative carrier capacity not yet confirmed."],
      submitted_at: "2026-04-20T07:50:00.000Z"
    }
  ],
  approvals: [
    {
      id: "approval-low-stock-1",
      project_id: "project-low-stock",
      phase_id: "phase-low-stock-1",
      request_type: "restock_approval",
      request_summary: "North Branch requests approval for urgent restock action.",
      ai_recommendation: "Approve with supplier ETA check.",
      risk_level: "medium",
      decision: null,
      decision_note: null,
      decided_by: null,
      decided_at: null,
      status: "pending"
    },
    {
      id: "approval-overstock-1",
      project_id: "project-overstock",
      phase_id: "phase-overstock-1",
      request_type: "pricing_or_transfer",
      request_summary: "South Branch proposes pricing action to reduce overstock risk.",
      ai_recommendation: "Revise request after collecting sell-through evidence and HQ margin guidance.",
      risk_level: "medium",
      decision: "revise_requested",
      decision_note: "Need updated sell-through data before approval.",
      decided_by: "user-hq-1",
      decided_at: "2026-04-20T11:10:00.000Z",
      status: "revise_requested"
    },
    {
      id: "approval-pricing-1",
      project_id: "project-pricing",
      phase_id: "phase-pricing-1",
      request_type: "pricing_action",
      request_summary: "South Branch requests approval for pricing action to reduce overstock.",
      ai_recommendation: "Approve with weekly margin monitoring.",
      risk_level: "medium",
      decision: null,
      decision_note: null,
      decided_by: null,
      decided_at: null,
      status: "pending"
    },
    {
      id: "approval-escalation-1",
      project_id: "project-escalation",
      phase_id: "phase-escalation-1",
      request_type: "escalation_response",
      request_summary: "Critical escalation requires HQ intervention and vendor coordination.",
      ai_recommendation: "Escalate immediately.",
      risk_level: "high",
      decision: "escalated",
      decision_note: "HQ escalation protocol activated.",
      decided_by: "user-hq-1",
      decided_at: "2026-04-20T08:00:00.000Z",
      status: "escalated"
    }
  ]
};
