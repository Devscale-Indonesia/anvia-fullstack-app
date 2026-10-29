import { AnthropicClient } from "@anvia/anthropic";
import type { JsonObject } from "@anvia/core";
import { OpenAIClient } from "@anvia/openai";

export type ModelProvider = "openai" | "anthropic";

export type ModelOption = {
  // Stable key the client sends and the API validates.
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string;
};

export const MODEL_OPTIONS: readonly ModelOption[] = [
  // Canonical OpenRouter model ID, called through the OpenAI-compatible client.
  { id: "openai", label: "OpenAI GPT-6 Luna", provider: "openai", modelId: "openai/gpt-6-luna" },
  { id: "anthropic", label: "Anthropic Claude Haiku 5.5", provider: "anthropic", modelId: "claude-haiku-5-5" },
];

export const DEFAULT_MODEL_ID = MODEL_OPTIONS[0].id;

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let openAIClient: OpenAIClient | undefined;
let anthropicClient: AnthropicClient | undefined;

function getOpenAIClient(): OpenAIClient {
  if (!openAIClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Set OPENROUTER_API_KEY.");
    openAIClient = new OpenAIClient({ apiKey, baseUrl: OPENROUTER_BASE_URL });
  }
  return openAIClient;
}

function getAnthropicClient(): AnthropicClient {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Set ANTHROPIC_API_KEY.");
    anthropicClient = new AnthropicClient({ apiKey });
  }
  return anthropicClient;
}

export function isModelId(value: string): boolean {
  return MODEL_OPTIONS.some((option) => option.id === value);
}

export function getModel(id: string = DEFAULT_MODEL_ID) {
  const option = MODEL_OPTIONS.find((candidate) => candidate.id === id);
  if (!option) throw new Error(`Unknown model "${id}".`);

  if (option.provider === "anthropic") {
    return getAnthropicClient().completionModel({ modelId: option.modelId });
  }
  return getOpenAIClient().completionModel({ modelId: option.modelId, api: "chat" });
}

// Anthropic automatic prompt caching: one top-level cache_control, and the breakpoint moves forward as
// the conversation grows. Cached reads need a prompt of at least 512 tokens on Haiku 5.5.
// https://platform.claude.com/docs/en/build-with-claude/prompt-caching
export function getProviderOptions(id: string = DEFAULT_MODEL_ID): JsonObject | undefined {
  const option = MODEL_OPTIONS.find((candidate) => candidate.id === id);
  if (option?.provider === "anthropic") return { cache_control: { type: "ephemeral" } };
  return undefined;
}
