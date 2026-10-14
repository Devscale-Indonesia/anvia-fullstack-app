import { createTool } from "@anvia/core";
import { z } from "zod";
import { getTavilyClient } from "./tavily-client";

export const searchWebTool = createTool({
  name: "search_web",
  description:
    "Search the web for current information. Returns titles, URLs and short content excerpts. Use read_webpage to read a result in full.",
  inputSchema: z.object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(10).default(5),
  }),
  execute: async ({ query, maxResults }) => {
    const response = await getTavilyClient().search(query, { maxResults });
    return {
      results: response.results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      })),
    };
  },
});
