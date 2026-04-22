import type { IsoDateString, PhaseStatus, UserRole } from "@/types/common";

export type Phase = {
  id: string;
  project_id: string;
  phase_name: string;
  phase_order: number;
  objective: string;
  responsible_party: UserRole;
  status: PhaseStatus;
  due_date: IsoDateString | null;
  created_at: IsoDateString;
  updated_at: IsoDateString;
};
