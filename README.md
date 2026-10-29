# Anvia HR Assistant

A full-stack AI agent app, built for **Devscale Indonesia — AI Product Engineering, Batch 2**.

The app is an HR assistant for **PT Maju Jaya Sakti**, a fictional company. Employees ask about leave, payroll, BPJS, and working hours in Indonesian or English. The agent answers from company policy and Indonesian labor rules, searches the web when it needs current figures, and remembers each conversation.

> All company policies and labor-rule figures in this repo are **mock data for teaching**. Do not use them for real HR or legal decisions.

## What you will learn

- Structuring a **pnpm workspace** monorepo with apps and shared packages.
- Building an agent with **`@anvia/core`**: instructions, static context, tools, and a model.
- Calling models through **OpenRouter** with the OpenAI-compatible client.
- Streaming agent output from a **Hono** API to a **React** UI with `@anvia/server`, `@anvia/client`, `@anvia/react`, and `@anvia/react-ui`.
- Saving conversations per session with **`@anvia/memory-prisma`**, **Prisma 8**, and **Postgres 16**.
- Measuring answer quality with **evals**: an LLM judge, answer relevancy, and regex checks.
- Tracing agent runs and eval results with **Anvia Lens**.

## Architecture

```
Browser (apps/web, Vite :5173)
   │  /api/*  ── Vite proxy strips /api ──▶
   ▼
API (apps/api, Hono :3000)
   │  runAgent({ messages, memory })
   ▼
Agent (packages/agents)
   ├── Model ──────────▶ OpenRouter (openai/gpt-6-luna)
   ├── Tools ──────────▶ Tavily (search_web, read_webpage)
   ├── Memory ─────────▶ packages/db ──▶ Postgres 16 (Docker :5433)
   └── Tracing ────────▶ Anvia Lens
```

## Project structure

```
.
├── apps/
│   ├── api/                  Hono API: /chat, /sessions, /sessions/:id/messages
│   └── web/                  React + Vite + Tailwind + TanStack Router (file-based)
│       └── src/routes/
│           ├── __root.tsx    Layout and sidebar (session list)
│           ├── index.tsx     "/"        New chat composer
│           └── s.$id.tsx     "/s/:id"   Chat for one session
├── packages/
│   ├── agents/               The HR agent
│   │   └── src/
│   │       ├── agent.ts          runAgent(): builds and streams the agent
│   │       ├── models.ts         getModel(): OpenRouter model
│   │       ├── instructions.ts   System prompt
│   │       ├── lens.ts           Anvia Lens client
│   │       ├── context/          Static documents (company policy, labor rules)
│   │       ├── tools/            search-web, read-webpage (Tavily)
│   │       └── evals/            4 eval files, 5 cases each
│   └── db/                   Prisma 8 contract and database client
│       ├── prisma/schema.prisma  Contract (memory models)
│       └── src/index.ts          exports `db`
├── infra/lens/               Optional: self-hosted Anvia Lens (Docker Compose)
├── docker-compose.dev.yaml   Postgres 16 for local development
└── .env.example              Environment variables template
```

## Prerequisites

- **Node.js 24 or newer** (the scripts use the native `--env-file-if-exists` flag)
- **pnpm** (this repo was built with pnpm 12)
- **Docker** for Postgres
- API keys for **OpenRouter**, **Tavily**, and **Anvia Lens**

## Getting started

1. **Install dependencies**

   ```sh
   pnpm install
   ```

2. **Create your `.env`** in the repo root and fill in the keys:

   ```sh
   cp .env.example .env
   ```

   Every app and script reads this one root file through Node's `--env-file-if-exists` flag, so there is no `dotenv` package.

3. **Start Postgres 16**

   ```sh
   docker compose -f docker-compose.dev.yaml up -d
   ```

4. **Create the database tables** from the Prisma contract:

   ```sh
   pnpm -C packages/db db:init
   ```

5. **Run the API and the web app** in two terminals:

   ```sh
   pnpm run dev:api
   pnpm run dev:web
   ```

   Open http://localhost:5173. The API must be running first: it validates the memory tables at startup.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | `packages/agents/src/models.ts` | Model calls through OpenRouter |
| `TAVILY_API_KEY` | `packages/agents/src/tools/` | Web search and page reading |
| `ANVIA_LENS_BASE_URL` | `packages/agents/src/lens.ts` | Lens server URL |
| `ANVIA_LENS_PUBLIC_KEY` | `packages/agents/src/lens.ts` | Lens credentials |
| `ANVIA_LENS_SECRET_KEY` | `packages/agents/src/lens.ts` | Lens credentials |
| `DATABASE_URL` | `packages/db` | Postgres connection |

## How it works

### 1. The agent (`packages/agents`)

`runAgent()` in `src/agent.ts` puts the pieces together:

- **Model**: `getModel()` points the `@anvia/openai` client at OpenRouter's OpenAI-compatible endpoint. The default model is `openai/gpt-6-luna`.
- **Instructions**: `src/instructions.ts` defines the HR assistant's role, source priority, and rules (no invented policies, no sensitive personal data).
- **Context**: `src/context/` holds static `Document`s attached to every run: company policies and Indonesian labor rules.
- **Tools**: `search_web` and `read_webpage` use Tavily. The agent uses them only for current figures the context does not cover.
- **Memory** (optional): with `memory: { store, session }`, the agent sends only the latest user message. The store supplies earlier turns.
- **Tracing**: every run is recorded in Anvia Lens with `captureMode: "full"`, which includes prompt and response text.

`runAgent()` returns `agent.stream()`, an async iterable of events.

### 2. The database (`packages/db`)

The database uses **Prisma 8**, where the schema is called a **contract**:

- `prisma/schema.prisma` is the contract. The memory models were generated by the `@anvia/memory-prisma` CLI.
- `pnpm -C packages/db db:emit` writes `schema.json` and `schema.d.ts` from the contract. Run it after you change the contract.
- `pnpm -C packages/db db:init` creates the tables in Postgres.
- `src/index.ts` exports `db`, the typed client.

### 3. The API (`apps/api`)

| Method | Path | What it does |
|---|---|---|
| `POST` | `/chat?sessionId=…` | Runs the agent with memory for that session and streams the events |
| `GET` | `/sessions` | Lists the user's sessions, newest first, titled by the first question |
| `GET` | `/sessions/:id/messages` | Returns a session's saved messages |

There is one user for now: `default-user`.

### 4. The web app (`apps/web`)

- `/` shows only a composer. Sending a message creates a session ID and navigates to `/s/:id`.
- `/s/:id` loads the saved messages in a route `loader` and passes them to `useChat({ initialMessages })`.
- The chat UI uses headless primitives from `@anvia/react-ui`, styled with Tailwind, in dark mode only.
- Answers stream smoothly. Newly revealed text gets `data-state="revealing"`, and CSS in `src/styles.css` fades it in.

## Evals

The eval cases test the agent against the mock context. There are 4 files with 5 cases each, in `packages/agents/src/evals/`:

| Command | File | Topic |
|---|---|---|
| `pnpm run evals:1` | `working-time.ts` | Working hours and overtime |
| `pnpm run evals:2` | `leave.ts` | Leave |
| `pnpm run evals:3` | `payroll.ts` | Payroll, THR, minimum wage |
| `pnpm run evals:4` | `benefits-employment.ts` | BPJS, probation, resignation |
| `pnpm run evals` | all of the above | Stops at the first file that fails |

Each case is scored with three metrics:

- **correctness**: `gEval`, an LLM judge with a 0–10 rubric that compares the answer with `expected`. It passes at 0.7.
- **answer_relevancy**: an LLM check that the answer addresses the question. It passes at 0.7.
- **contains_numbers**: a regex from `metadata.pattern` that the answer must match, such as `\b14\b`. No LLM is involved.

Each file sends its results to Anvia Lens through `runEvalCli({ reporters })`.

## Useful commands

| Command | What it does |
|---|---|
| `pnpm run dev:api` | Start the API with auto-reload |
| `pnpm run dev:web` | Start the web app |
| `pnpm run typecheck` | Typecheck every package |
| `pnpm run build` | Build every package |
| `pnpm run evals` | Run all evals |
| `pnpm -C packages/db db:emit` | Regenerate contract artifacts |
| `pnpm -C packages/db db:init` | Create the tables in Postgres |
| `docker compose -f docker-compose.dev.yaml down` | Stop Postgres (data is kept in a volume) |

## Troubleshooting

- **`Set OPENROUTER_API_KEY.`** or **`Anvia Lens baseUrl is required`**: the root `.env` is missing or a value is empty. Check that no key appears twice. The last line wins, so an empty duplicate overrides your value.
- **Port 5432 already in use**: Postgres is mapped to host port **5433** to avoid clashing with other local databases. Keep `DATABASE_URL` on 5433.
- **Vite opens on 5174**: port 5173 is taken, so Vite picks the next one. The proxy still works.
- **`Ignored build scripts` during install**: pnpm blocks dependency install scripts by default. `pnpm-workspace.yaml` allows `esbuild` and denies `workerd`, which this project does not need.
- **The agent does not reply on the first message in development**: React StrictMode runs effects twice, and `useChat` aborts the in-flight request on cleanup. `s.$id.tsx` sends the first message after one timer tick to avoid this. Keep that pattern if you change the code.

## Notes

- **Prisma 8 is a release candidate.** The CLI is `8.0.0-rc.22` and `@prisma/orm-postgres` is `8.0.0-rc.17`. `@anvia/memory-prisma` lists `rc.11` as its peer, so pnpm may show a peer warning.
- **Lens captures full payloads.** Employee questions and answers are sent to Lens. Switch `captureMode` to `"safe"` in `agent.ts` if that is not acceptable.
- **Single user.** Every session belongs to `default-user`. Real authentication is not implemented.

## Exercises

1. Add a tool, such as a leave-balance calculator, and register it in `runAgent()`.
2. Add a new eval case that the agent currently fails, then improve the instructions or context until it passes.
3. Replace `default-user` with a real user ID sent from the client.
4. Add a "Delete chat" action to the sidebar.
5. Route questions to different agents (HR, finance, operations). See the comment in the `/chat` route.
