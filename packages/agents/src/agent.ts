import { Agent, type AgentStream, type MemoryScope, type MemoryStore, type Message, type UserMessage } from "@anvia/core";
import { BASE_INSTRUCTIONS } from "./instructions";
import { getModel, DEFAULT_MODEL_ID } from "./models";
import { staticContext } from "./context/document";
import { getLens } from "./lens";
import { readWebpageTool } from "./tools/read-webpage";
import { searchWebTool } from "./tools/search-web";

export type RunAgentOptions = {
  messages: readonly Message[];
  // Optional. The store (e.g. PrismaMemoryStore) keeps the conversation per session.
  memory?: {
    store: MemoryStore;
    session: MemoryScope;
  };
  modelId?: string;
  maxTurns?: number;
  abortSignal?: AbortSignal;
};

export function runAgent(options: RunAgentOptions): AgentStream<string> {
  const agent = new Agent({
    id: "anvia-assistant",
    model: getModel(options.modelId ?? DEFAULT_MODEL_ID),
    instructions: BASE_INSTRUCTIONS,
    context: staticContext,
    tools: [searchWebTool, readWebpageTool],
    maxTurns: options.maxTurns ?? 25,
    memory: options.memory ? { store: options.memory.store, savePolicy: "turn" } : undefined,
    observability: {
      observers: { lens: getLens().observer({ captureMode: "full" }) },
      primaryTrace: "lens",
    },
  });

  if (options.memory) {
    // The memory store already holds earlier turns, so send only the latest user message.
    const prompt = [...options.messages].reverse().find((m): m is UserMessage => m.role === "user");
    if (!prompt) throw new Error("runAgent needs at least one user message.");
    return agent.stream({
      prompt,
      session: options.memory.session,
      abortSignal: options.abortSignal,
    });
  }

  return agent.stream({
    messages: options.messages,
    abortSignal: options.abortSignal,
  });
}
