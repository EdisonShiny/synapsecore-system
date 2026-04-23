import type {
  IssueThread,
  OfficeAccount,
  PlanDatasetSubmission,
  PlanInsight,
  ProjectRecord
} from "@/types/system";
import { nowIso } from "@/src/utils/date";

export type SystemDatabase = {
  offices: OfficeAccount[];
  projects: ProjectRecord[];
  issues: IssueThread[];
  planSubmissions: PlanDatasetSubmission[];
  planInsights: PlanInsight[];
};

const globalStore = globalThis as typeof globalThis & {
  synapsecoreSystemStore?: SystemDatabase;
};

function createDefaultOffices(): OfficeAccount[] {
  const createdAt = nowIso();

  return [
    {
      id: "office-hq-demo",
      name: "Alicia Tan",
      officeName: "SynapseCore HQ",
      role: "HQ",
      branch_id: null,
      location: "Kuala Lumpur, Malaysia",
      address: "Level 18, Menara Synapse, Kuala Lumpur",
      email: "hq@synapsecore.demo",
      personInChargeName: "Alicia Tan",
      position: "Head of Operations",
      contactNumber: "+60 12-600 0100",
      createdAt,
      updatedAt: createdAt
    },
    {
      id: "office-branch-demo-1",
      name: "Daniel Lee",
      officeName: "SynapseCore Johor Branch",
      role: "Branch Office",
      branch_id: "office-branch-demo-1",
      location: "Johor Bahru, Malaysia",
      address: "Suite 9-3, Persada Business Centre, Johor Bahru",
      email: "johor.branch@synapsecore.demo",
      personInChargeName: "Daniel Lee",
      position: "Branch Manager",
      contactNumber: "+60 12-600 0200",
      createdAt,
      updatedAt: createdAt
    }
  ];
}

function createEmptyStore(): SystemDatabase {
  return {
    offices: createDefaultOffices(),
    projects: [],
    issues: [],
    planSubmissions: [],
    planInsights: []
  };
}

export function getSystemStore() {
  if (!globalStore.synapsecoreSystemStore) {
    globalStore.synapsecoreSystemStore = createEmptyStore();
  }

  return globalStore.synapsecoreSystemStore;
}

export function resetSystemStore() {
  globalStore.synapsecoreSystemStore = createEmptyStore();
  return globalStore.synapsecoreSystemStore;
}
