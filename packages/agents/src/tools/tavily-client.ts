import { tavily, type TavilyClient } from "@tavily/core";

let client: TavilyClient | undefined;

export function getTavilyClient(): TavilyClient {
  if (!client) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("Set TAVILY_API_KEY.");
    client = tavily({ apiKey });
  }
  return client;
}
