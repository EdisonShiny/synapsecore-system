export type RuntimeMode = "mock" | "real";

const requestedMode = process.env.SYNAPSECORE_MODE === "real" ? "real" : "mock";

export const runtimeConfig = {
  mode: requestedMode as RuntimeMode,
  aiApiKey: process.env.ZAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  aiEndpoint: process.env.ZAI_API_URL ?? "",
  aiModel: process.env.ZAI_MODEL ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

export function isRealModeEnabled() {
  return runtimeConfig.mode === "real";
}

export function isAiConfigured() {
  return (
    runtimeConfig.aiApiKey.length > 0 &&
    runtimeConfig.aiEndpoint.length > 0 &&
    runtimeConfig.aiModel.length > 0
  );
}

export function shouldUseMockAi() {
  return !isRealModeEnabled() || !isAiConfigured();
}

export function shouldUseMockDatabase() {
  return !isRealModeEnabled() || runtimeConfig.databaseUrl.length === 0;
}
