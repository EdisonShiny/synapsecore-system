import type {
  ApprovalStatus,
  PhaseStatus as ContractPhaseStatus,
  SynapseEntity,
  UserRole
} from "@/types/common";

export type { SynapseEntity, UserRole };

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

export type ApprovalState = ApprovalStatus;

export type ConfidenceLevel = "high" | "medium" | "low";

export type PhaseStatus = ContractPhaseStatus;
