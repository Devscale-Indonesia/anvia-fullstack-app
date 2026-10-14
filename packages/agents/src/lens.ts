import { LensClient } from "@anvia/lens";

let client: LensClient | undefined;

// Anvia Lens records every agent run as a trace (model calls, tool calls, results).
// The client is created on first use so importing this file does not need credentials.
export function getLens(): LensClient {
  if (!client) {
    client = new LensClient({
      baseUrl: process.env.ANVIA_LENS_BASE_URL,
      publicKey: process.env.ANVIA_LENS_PUBLIC_KEY,
      secretKey: process.env.ANVIA_LENS_SECRET_KEY,
      serviceName: "anvia-hr-agent",
    });
  }
  return client;
}
