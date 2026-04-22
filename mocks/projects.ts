import type { Project } from "@/types/synapse";

export const mockProjects: Project[] = [
  {
    id: "PRJ-101",
    title: "Stock Reorder - North Branch",
    branch: "North",
    status: "validation_pending",
    validation: "proceed",
    approval: "pending",
    priority: "high"
  },
  {
    id: "PRJ-102",
    title: "Overstock Risk - South Branch",
    branch: "South",
    status: "approval_pending",
    validation: "proceed_with_caution",
    approval: "approved",
    priority: "high"
  },
  {
    id: "PRJ-103",
    title: "Product Feedback Analysis",
    branch: "HQ",
    status: "executing",
    validation: "human_review_required",
    approval: "revise_requested",
    priority: "critical"
  },
  {
    id: "PRJ-104",
    title: "Pricing Strategy Review",
    branch: "East",
    status: "active",
    validation: "proceed",
    approval: "approved",
    priority: "medium"
  },
  {
    id: "PRJ-105",
    title: "Branch Escalation - West",
    branch: "West",
    status: "escalated",
    validation: "do_not_proceed",
    approval: "rejected",
    priority: "critical"
  },
  {
    id: "PRJ-106",
    title: "Inventory Optimization",
    branch: "HQ",
    status: "completed",
    validation: "proceed",
    approval: "approved",
    priority: "medium"
  },
  {
    id: "PRJ-107",
    title: "Market Demand Forecast",
    branch: "North",
    status: "draft",
    validation: "proceed_with_caution",
    approval: "pending",
    priority: "low"
  },
  {
    id: "PRJ-108",
    title: "Supply Chain Efficiency",
    branch: "South",
    status: "executing",
    validation: "proceed",
    approval: "approved",
    priority: "high"
  }
];
