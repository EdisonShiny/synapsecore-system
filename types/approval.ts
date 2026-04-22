import type { ApprovalStatus, IsoDateString, RiskLevel } from "@/types/common";

export type Approval = {
  id: string;
  project_id: string;
  phase_id: string | null;
  request_type: string;
  request_summary: string;
  ai_recommendation: string;
  risk_level: RiskLevel;
  decision: Exclude<ApprovalStatus, "pending"> | null;
  decision_note: string | null;
  decided_by: string | null;
  decided_at: IsoDateString | null;
  status: ApprovalStatus;
};
