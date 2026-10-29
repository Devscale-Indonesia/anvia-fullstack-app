import { serve } from "@hono/node-server";
import { DEFAULT_MODEL_ID, MODEL_OPTIONS, isModelId, runAgent } from "@anvia/agents";
import { agentToClientStream, parseClientStreamRequest } from "@anvia/client";
import { createClientStreamResponse } from "@anvia/server";
import { db } from "@anvia/db";
import { PrismaMemoryStore } from "@anvia/memory-prisma/v8";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import type { Message } from "@anvia/core";

const app = new Hono();

// Conversation memory lives in Postgres (see packages/db).
const memoryStore = new PrismaMemoryStore({ client: db });
await memoryStore.validate();

// Single user for now. Replace with the real user id once auth exists.
const USER_ID = "default-user";

function scopeFor(sessionId: string) {
  return { sessionId, userId: USER_ID };
}

// First user text in a conversation, used as the sidebar title.
function firstUserText(messages: readonly { message: Message }[]): string | undefined {
  const first = messages.find((m) => m.message.role === "user")?.message;
  if (!first) return undefined;
  if (typeof first.content === "string") return first.content;
  return first.content.find((part) => part.type === "text")?.text;
}

app.use("*", cors());

app.get("/", (c) => c.json({ name: "anvia-api", status: "ok" }));

const helloSchema = z.object({
  name: z.string().min(1),
});

app.post("/hello", zValidator("json", helloSchema), (c) => {
  const { name } = c.req.valid("json");
  return c.json({ message: `Hello, ${name}!` });
});

// Models the user can choose from. The id goes back to /chat as ?model=.
app.get("/models", (c) =>
  c.json({
    default: DEFAULT_MODEL_ID,
    models: MODEL_OPTIONS.map(({ id, label, provider }) => ({ id, label, provider })),
  }),
);

app.post("/chat", async (c) => {
  // const route = routeAgent(body.messages) -> "hr" | "finance" | "operations"
  const sessionId = c.req.query("sessionId");
  if (!sessionId) return c.text("sessionId query parameter is required.", 400);

  const modelId = c.req.query("model") ?? DEFAULT_MODEL_ID;
  if (!isModelId(modelId)) return c.text(`Unknown model "${modelId}".`, 400);

  const body = parseClientStreamRequest(await c.req.json());
  if (body.type !== "messages") {
    return c.text("This endpoint accepts messages only.", 400);
  }
  const events = agentToClientStream({
    events: runAgent({
      messages: body.messages,
      memory: { store: memoryStore, session: scopeFor(sessionId) },
      modelId,
    }),
  });
  return createClientStreamResponse({ events });
});

// Sessions of the current user, newest first, for the sidebar.
app.get("/sessions", async (c) => {
  const inspector = memoryStore.inspector;
  if (!inspector) throw new Error("Memory store does not support listing sessions.");

  const conversations = await inspector.listConversations({ limit: 50, userId: USER_ID });
  const sessions = await Promise.all(
    conversations.map(async (summary) => {
      const conversation = await inspector.getConversation({ ref: summary.ref });
      return {
        id: summary.sessionId,
        updatedAt: summary.updatedAt,
        title: (conversation && firstUserText(conversation.messages)) ?? "New chat",
      };
    }),
  );
  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return c.json(sessions);
});

// Saved messages of one session, used to prefill the chat on page load.
app.get("/sessions/:id/messages", async (c) => {
  return c.json(await memoryStore.load({ scope: scopeFor(c.req.param("id")) }));
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
