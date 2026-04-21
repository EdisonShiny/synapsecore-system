import type { IsoDateString, Urgency } from "@/types/common";

export type AiAnalysis = {
  id: string;
  input_id: string;
  issue_type: string;
  business_area: string;
  branch: string;
  urgency: Urgency;
  summary: string;
  risks: string[];
  opportunities: string[];
  missing_information: string[];
  confidence_score: number;
  suggest_project_creation: boolean;
  created_at: IsoDateString;
};
