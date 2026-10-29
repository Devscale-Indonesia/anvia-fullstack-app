import { readFileSync } from "node:fs";
import { McpClient, McpClientGroup, type McpServer } from "@anvia/mcp";

// MCP servers are registered in mcp.json at the repo root (same shape as Claude Code's `mcpServers`).
// "ssrfProtection": "disabled" is needed for servers on a private network, such as a Tailscale host.
type McpServerConfig = {
  type: "http";
  url: string;
  headers?: Record<string, string>;
  ssrfProtection?: "strict" | "disabled";
};

const CONFIG_URL = new URL("../../../mcp.json", import.meta.url);
const CONNECT_TIMEOUT_MS = 10_000;

function loadClients(): McpClient[] {
  const { mcpServers = {} } = JSON.parse(readFileSync(CONFIG_URL, "utf8")) as {
    mcpServers?: Record<string, McpServerConfig>;
  };

  return Object.entries(mcpServers).map(
    ([name, config]) =>
      new McpClient({
        name,
        versionNegotiation: { mode: "auto" },
        transport: {
          type: "streamableHttp",
          url: config.url,
          headers: config.headers,
          ssrfProtection: config.ssrfProtection,
        },
      }),
  );
}

let group: Promise<McpClientGroup> | undefined;

// Connects once and reuses the connection. If a server is unreachable, the agent runs without its
// tools and the next call tries again.
export async function getMcpServers(): Promise<readonly McpServer[]> {
  group ??= McpClientGroup.connect({
    clients: loadClients(),
    abortSignal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
  });

  try {
    return (await group).servers;
  } catch (error) {
    group = undefined;
    console.warn("MCP servers unavailable, continuing without them:", error);
    return [];
  }
}

export async function closeMcpServers(): Promise<void> {
  const current = group;
  group = undefined;
  await (await current?.catch(() => undefined))?.close();
}
