import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

type SessionSummary = {
  id: string;
  updatedAt: string;
  title: string;
};

export const Route = createRootRoute({
  loader: async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
    return { sessions: (await res.json()) as SessionSummary[] };
  },
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100">
      <Sidebar />
      <Outlet />
    </div>
  );
}

function Sidebar() {
  const { sessions } = Route.useLoaderData();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-zinc-950 p-3 text-sm text-zinc-100 md:flex">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 hover:bg-zinc-900"
      >
        <span className="text-lg leading-none">+</span>
        New chat
      </Link>

      <p className="mt-6 px-3 text-xs font-medium text-zinc-500">Chats</p>
      <nav className="mt-2 flex flex-col gap-1 overflow-y-auto">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to="/s/$id"
            params={{ id: session.id }}
            className="truncate rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900"
            activeProps={{ className: "truncate rounded-lg bg-zinc-800 px-3 py-2 text-zinc-100" }}
          >
            {session.title}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          D
        </span>
        <span className="truncate">default-user</span>
      </div>
    </aside>
  );
}
