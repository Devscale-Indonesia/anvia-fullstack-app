import { createTool } from "@anvia/core";
import { z } from "zod";
import { getTavilyClient } from "./tavily-client";

// Keeps a single page from flooding the model's context window.
const MAX_CONTENT_CHARS = 20_000;

export const readWebpageTool = createTool({
  name: "read_webpage",
  description:
    "Read the full text of one or more web pages as markdown. Use this after search_web when a result needs more detail.",
  inputSchema: z.object({
    urls: z.array(z.string().url()).min(1).max(5),
  }),
  execute: async ({ urls }) => {
    const response = await getTavilyClient().extract(urls, { format: "markdown" });
    return {
      pages: response.results.map((page) => ({
        url: page.url,
        title: page.title,
        content: page.rawContent.slice(0, MAX_CONTENT_CHARS),
        truncated: page.rawContent.length > MAX_CONTENT_CHARS,
      })),
      failed: response.failedResults.map((failure) => failure.url),
    };
  },
});
