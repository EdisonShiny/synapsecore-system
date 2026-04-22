export type RuntimeMode = "mock" | "real";

const requestedMode = process.env.SYNAPSECORE_MODE === "real" ? "real" : "mock";

export const runtimeConfig = {
  mode: requestedMode as RuntimeMode,
  zaiApiKey: process.env.ILMU_API_KEY ?? process.env.ZAI_API_KEY ?? "",
  zaiBaseUrl: process.env.ILMU_BASE_URL ?? process.env.ZAI_BASE_URL ?? "https://api.ilmu.ai/v1",
  zaiModel: process.env.ILMU_MODEL ?? process.env.ZAI_MODEL ?? "ilmu-nemo-nano",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

export function isRealModeEnabled() {
  return runtimeConfig.mode === "real";
}

export function shouldUseMockAi() {
  return !isRealModeEnabled() || runtimeConfig.zaiApiKey.length === 0;
}

export function shouldUseMockDatabase() {
  return !isRealModeEnabled() || runtimeConfig.databaseUrl.length === 0;
}
