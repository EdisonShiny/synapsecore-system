import type { IsoDateString, SuccessLevel } from "@/types/common";

export type ExecutionUpdate = {
  id: string;
  phase_id: string;
  submitted_by: string;
  outcome_summary: string;
  evidence_text: string;
  file_url: string | null;
  success_level: SuccessLevel;
  unresolved_issues: string[];
  submitted_at: IsoDateString;
};
