import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ModelPicker, useModelChoice } from "../model-picker";

declare module "@tanstack/react-router" {
  interface HistoryState {
    pendingMessage?: string;
  }
}

export const Route = createFileRoute("/")({
  component: NewChat,
});

// New chat: the composer only. The first message is sent from the session page.
function NewChat() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const { models, model, setModel } = useModelChoice();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;

    const id = crypto.randomUUID();
    void navigate({ to: "/s/$id", params: { id }, state: { pendingMessage: message } });
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-12 items-center px-4 text-sm font-medium text-zinc-400">
        Anvia Business Assistant
        <ModelPicker models={models} model={model} onChange={setModel} />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-100">What can I help you with?</h1>

        <form onSubmit={submit} className="w-full max-w-3xl">
          <div className="flex items-center gap-2 rounded-3xl border border-zinc-700 bg-zinc-800 p-2 focus-within:border-zinc-500">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="flex-1 bg-transparent px-3 py-2 leading-6 text-zinc-100 outline-none placeholder:text-zinc-500"
              placeholder="Ask about stock, orders, customers..."
            />
            <button
              type="submit"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-300 disabled:bg-zinc-600 disabled:text-zinc-400"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
