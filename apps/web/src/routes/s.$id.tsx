import { createFileRoute, useLocation } from "@tanstack/react-router";
import type { Message } from "@anvia/core";
import { createHttpClientTransport, type UIMessage } from "@anvia/client";
import { initialMessagesFromMemory, useChat } from "@anvia/react";
import {
  ChatProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@anvia/react-ui";
import { useEffect, useMemo, useRef } from "react";
import { ModelPicker, useModelChoice } from "../model-picker";

export const Route = createFileRoute("/s/$id")({
  // Load the saved messages of this session before the page renders.
  loader: async ({ params }) => {
    const res = await fetch(`/api/sessions/${params.id}/messages`);
    if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
    const messages = (await res.json()) as Message[];
    return { initialMessages: initialMessagesFromMemory(messages) };
  },
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const { initialMessages } = Route.useLoaderData();

  // key={id}: a new session gets a fresh chat state.
  return <Chat key={id} sessionId={id} initialMessages={initialMessages} />;
}

function Chat({ sessionId, initialMessages }: { sessionId: string; initialMessages: UIMessage[] }) {
  const { models, model, setModel } = useModelChoice();

  // /api/chat is proxied to the API's /chat route (see vite.config.ts).
  const transport = useMemo(() => {
    const query = new URLSearchParams({ sessionId });
    if (model) query.set("model", model);
    return createHttpClientTransport({ endpoint: `/api/chat?${query}` });
  }, [sessionId, model]);
  const chat = useChat({ transport, initialMessages });
  const lastMessageId = chat.messages.at(-1)?.id;

  // First message sent from the new-chat composer.
  const pendingMessage = useLocation({
    select: (location) => (location.state as { pendingMessage?: string }).pendingMessage,
  });
  const sentPending = useRef(false);

  useEffect(() => {
    if (!pendingMessage) return;

    // Wait one tick. In StrictMode, React runs this effect, cleans it up, then runs it again.
    // useChat aborts any request that is in flight at that cleanup, so the send must not start before it.
    const timer = window.setTimeout(() => {
      if (sentPending.current) return;
      sentPending.current = true;
      void chat.sendMessage({ text: pendingMessage });

      // Clear the pending message from history, so a refresh does not send it again.
      const { pendingMessage: _ignored, ...rest } = window.history.state ?? {};
      window.history.replaceState(rest, "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingMessage, chat]);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-12 items-center px-4 text-sm font-medium text-zinc-400">
        Anvia Business Assistant
        <ModelPicker models={models} model={model} onChange={setModel} />
      </header>

      <ChatProvider controller={chat}>
        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
              <ThreadPrimitive.Empty>
                <div className="mt-24 text-center text-2xl font-semibold text-zinc-100">
                  What can I help you with?
                </div>
              </ThreadPrimitive.Empty>

              <ThreadPrimitive.Messages className="flex flex-col gap-6">
                <MessagePrimitive.Root>
                  {(message) => (
                    <div
                      className={
                        message.role === "user"
                          ? "ml-auto w-fit max-w-[80%] rounded-3xl bg-zinc-800 px-4 py-2.5"
                          : "max-w-full leading-7 text-zinc-100"
                      }
                    >
                      <MessagePrimitive.Content>
                        {/* Parts owns the smooth stream for the message that is currently streaming.
                            Newly revealed text gets data-state="revealing", which fades in (styles.css). */}
                        <MessagePrimitive.Parts
                          stream={{
                            isStreaming: chat.status === "streaming" && message.id === lastMessageId,
                            resetKey: message.id,
                            flushImmediately: chat.status === "error",
                          }}
                        >
                          {(part) =>
                            part.type === "text" ? (
                              // No children: the Markdown reads the part's text itself and streams per block.
                              <MessagePrimitive.Markdown className="message-markdown space-y-3 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" />
                            ) : null
                          }
                        </MessagePrimitive.Parts>
                      </MessagePrimitive.Content>
                    </div>
                  )}
                </MessagePrimitive.Root>
              </ThreadPrimitive.Messages>

              <ThreadPrimitive.Error className="text-sm text-red-400" />
            </div>
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="mx-auto w-full max-w-3xl px-4 pb-6">
            <div className="flex items-center gap-2 rounded-3xl border border-zinc-700 bg-zinc-800 p-2 focus-within:border-zinc-500">
              <ComposerPrimitive.Input
                className="flex-1 bg-transparent px-3 py-2 leading-6 text-zinc-100 outline-none placeholder:text-zinc-500"
                placeholder="Ask about leave, payroll, stock, orders..."
              />
              <ComposerPrimitive.Submit className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-300 disabled:bg-zinc-600 disabled:text-zinc-400">
                ↑
              </ComposerPrimitive.Submit>
            </div>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </ChatProvider>
    </main>
  );
}
