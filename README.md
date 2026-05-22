# Olive Chat

AI chatbot with inference logging and ingestion — built with Next.js, OpenRouter, and Prisma.

## Features

- **Multi-turn chat** via OpenRouter API (GPT-4o-mini, or any supported model)
- **Inference logging** — every prompt, completion, token count, latency, and model is persisted
- **Logs dashboard** — aggregate stats (total tokens, avg latency, model breakdown) + per-conversation filtering
- **User authentication** — email/password signup/login with JWT session cookies
- **Conversation history** — sidebar lists all conversations; each shows a preview of the last message
- **Per-conversation logs** — click "Logs" in the chat header to view inference data for that conversation
- **Profile & theme** — edit display name, toggle light/dark/system theme
- **Responsive** — desktop-first with sidebar layout

## Architecture

```
app/
├── api/
│   ├── auth/     # signup, login, logout, me (GET + PATCH)
│   ├── chat/     # POST — sends messages to OpenRouter, logs inference
│   ├── conversations/  # GET list, GET by id, DELETE
│   └── logs/     # GET paginated logs, GET aggregate stats
├── logs/         # Logs dashboard page
├── profile/      # Profile & theme settings page
└── page.tsx      # Main chat UI (auth screen + sidebar + chat)
lib/
├── auth.ts       # JWT, bcrypt, cookie helpers
├── openrouter.ts # OpenRouter API client (chat + streaming)
├── inference-logger.ts  # Log ingestion + stats aggregation
└── prisma.ts     # Prisma client singleton
prisma/
└── schema.prisma # User, Conversation, Message, InferenceLog
```

### Data models

| Model | Key fields |
|-------|-----------|
| `User` | id, email, password (hashed), name |
| `Conversation` | id, userId, createdAt, updatedAt |
| `Message` | id, conversationId, role (user/assistant), content |
| `InferenceLog` | id, conversationId, messageId, model, prompt/completion tokens, latencyMs, prompt, completion |

Every assistant response is automatically logged with full inference metadata.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL instance

### 1. Clone and install

```bash
git clone <repo>
cd olive-chatbot
pnpm install
```

### 2. Set environment variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/olivechatbot"
OPENROUTER_API_KEY="sk-or-v1-..."
JWT_SECRET="generate-a-random-secret"
```

### 3. Run database migrations

```bash
pnpm prisma migrate dev
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Makefile

```bash
make dev       # start dev server
make build     # build for production
make lint      # run eslint
make typecheck # run tsc
make db-studio # open Prisma Studio
```

## Deployment (Vercel)

The project is configured for Vercel. Key things:

- **Build command**: `prisma generate && next build` (set in `package.json`)
- **`.npmrc`**: `ignore-scripts=false` — required for pnpm v10 to run Prisma's build scripts
- **`postinstall`**: `prisma generate` — ensures the client is available on CI/Vercel
- Add `DATABASE_URL`, `OPENROUTER_API_KEY`, and `JWT_SECRET` to Vercel environment variables

## API reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Sign in, sets session cookie |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Current user |
| `/api/auth/me` | PATCH | Update display name |
| `/api/chat` | POST | Send message, get AI response |
| `/api/conversations` | GET | List user's conversations |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations/[id]` | GET | Get conversation with messages |
| `/api/conversations/[id]` | DELETE | Delete conversation |
| `/api/logs?limit=&offset=&conversationId=&model=` | GET | Paginated inference logs |
| `/api/logs/stats` | GET | Aggregate statistics |

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS v4, shadcn/ui, @base-ui/react
- **Auth**: jose (JWT), bcryptjs
- **Database**: PostgreSQL via Prisma ORM
- **API Gateway**: OpenRouter
