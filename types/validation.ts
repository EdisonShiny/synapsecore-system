import type { HumanReviewLevel, IsoDateString, ProceedRecommendation } from "@/types/common";

export type Validation = {
  id: string;
  phase_id: string;
  groundedness_score: number;
  missing_information: string[];
  unsupported_claims: string[];
  contradiction_flags: string[];
  impact_analysis: string;
  mitigation_steps: string[];
  proceed_recommendation: ProceedRecommendation;
  human_review_level: HumanReviewLevel;
  validated_at: IsoDateString;
};
