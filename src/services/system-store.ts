import type {
  IssueThread,
  OfficeAccount,
  PlanDatasetSubmission,
  PlanInsight,
  ProjectRecord
} from "@/types/system";

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

function createEmptyStore(): SystemDatabase {
  return {
    offices: [],
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
