import type { ApprovalStatus, IsoDateString, Priority, ProjectStatus, SourceType, UserRole } from "@/types/common";

export type Project = {
  id: string;
  title: string;
  summary: string;
  project_type: string;
  branch_id: string;
  created_by: string;
  owner_role: UserRole;
  priority: Priority;
  status: ProjectStatus;
  ai_confidence: number;
  approval_status: ApprovalStatus;
  created_at: IsoDateString;
  updated_at: IsoDateString;
};

export type ProjectInput = {
  id: string;
  project_id: string | null;
  source_type: SourceType;
  raw_text: string;
  file_url: string | null;
  uploaded_by: string;
  created_at: IsoDateString;
};
