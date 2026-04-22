import type { IsoDateString, RiskLevel } from "@/types/common";

export type Plan = {
  id: string;
  phase_id: string;
  objective: string;
  rationale: string;
  action_steps: string[];
  required_inputs: string[];
  expected_output: string;
  dependencies: string[];
  estimated_risk: RiskLevel;
  impact_if_successful: string;
  confidence_score: number;
  version: number;
  created_at: IsoDateString;
};
