import { OpenAIClient } from "@anvia/openai";

// Canonical OpenRouter model ID.
export const DEFAULT_MODEL_ID = "openai/gpt-6-luna";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let client: OpenAIClient | undefined;

function getClient(): OpenAIClient {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Set OPENROUTER_API_KEY.");
    client = new OpenAIClient({ apiKey, baseUrl: OPENROUTER_BASE_URL });
  }
  return client;
}

export function getModel(modelId: string = DEFAULT_MODEL_ID) {
  return getClient().completionModel({ modelId, api: "chat" });
}
