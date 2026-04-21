export type RuntimeMode = "mock" | "real";

const requestedMode = process.env.SYNAPSECORE_MODE === "real" ? "real" : "mock";

export const runtimeConfig = {
  mode: requestedMode as RuntimeMode,
  aiApiKey: process.env.OPENAI_API_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

export function isRealModeEnabled() {
  return runtimeConfig.mode === "real";
}

export function shouldUseMockAi() {
  return !isRealModeEnabled() || runtimeConfig.aiApiKey.length === 0;
}

export function shouldUseMockDatabase() {
  return !isRealModeEnabled() || runtimeConfig.databaseUrl.length === 0;
}
