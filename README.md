# CrowdSourced FAQ Platform

> An AI-assisted, crowd-sourced internship and career Q&A platform where users ask questions, expert contributors answer them, and AI synthesizes the best responses into a permanent, searchable FAQ knowledge base.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [How It Works — End-to-End Flow](#how-it-works--end-to-end-flow)
  - [1. Ask a Question (RAG Flow)](#1-ask-a-question-rag-flow)
  - [2. Query Submission](#2-query-submission)
  - [3. Contributor Answering](#3-contributor-answering)
  - [4. Query Deadline & AI Summarization](#4-query-deadline--ai-summarization)
  - [5. Admin Review & FAQ Publishing](#5-admin-review--faq-publishing)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Real-time Events (Socket.io)](#real-time-events-socketio)
- [AI & RAG Pipeline](#ai--rag-pipeline)
- [User Roles & Permissions](#user-roles--permissions)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Overview

The CrowdSourced FAQ Platform solves a real problem for students navigating internships and careers: **the same questions get asked again and again with no central, trusted answer**.

This platform creates a self-improving knowledge loop:

1. A user asks a question
2. The AI instantly searches the vector knowledge base and generates a grounded answer (RAG)
3. If unsatisfied, the user submits the question to contributors
4. Expert contributors answer within a deadline window
5. AI synthesizes the best answers into a structured FAQ entry
6. An admin reviews and publishes the FAQ
7. The next user who asks the same question gets an instant answer from the knowledge base

Every published FAQ enriches the vector knowledge base, making the system smarter over time.

---

## Key Features

### For Users
- **RAG-powered instant answers** — type a question and get an AI-synthesized answer backed by the knowledge base before submitting anything
- **Semantic FAQ search** — MongoDB Atlas Vector Search finds the closest matching answer even when wording differs
- **Related FAQ cards** — expandable results showing best match and alternatives with match type badges (exact, semantic, text)
- **Graceful degradation** — if OpenRouter is unavailable, related FAQs are still shown via fallback FAQ search
- **Google OAuth** sign-in alongside email/password authentication
- **Real-time notifications** — instant alerts when queries get answered or published

### For Contributors
- **Live contributor feed** — real-time stream of open queries via Socket.io
- **Accept / Answer / Skip / Flag** workflow for structured contribution
- **Flagging system** — queries that accumulate enough flags are auto-removed from the feed
- **Reputation system** — contributors earn +5 reputation points per submitted answer
- **Personal response history** — track all contributed answers

### For Admins
- **Dashboard stats** — open queries, published FAQs, pending reviews, top contributors
- **Admin review queue** — all expired queries with AI-synthesized answers land here
- **Publish, edit-and-approve, or reject** FAQ drafts
- **User management** — view all users, change roles, deactivate accounts
- **Instant flag removal** — admin flag immediately removes a query from the feed

### Platform
- **Vector embeddings stored in MongoDB Atlas** — 768-dimension Jina embeddings with cosine similarity
- **BullMQ deadline jobs** — Redis-backed queue fires when a query's contributor window closes
- **Upstash Redis caching** — 24-hour embedding cache, 10-minute FAQ list cache
- **Multi-provider AI** — swappable between OpenRouter, Gemini, OpenAI, AWS Bedrock, Jina
- **Full security stack** — Helmet, CORS, rate limiting, XSS sanitization, NoSQL injection prevention, JWT with refresh tokens
- **Structured logging** — Pino + pino-http with log-level routing per HTTP status

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT (React + Vite)                   │
│                                                                  │
│  AskQueryPage  ─── RAG Preview ─────────────────────────────┐   │
│  ContributorFeed  ─── Socket.io live feed ──────────────┐   │   │
│  AdminDashboard   ─── Review queue ─────────────────┐   │   │   │
└──────────────────────┬──────────────────────────────┼───┼───┼───┘
                       │ HTTP (REST)                  │   │   │
                       ▼                              │ WS│   │ WS
┌──────────────────────────────────────────────────────────────────┐
│                     SERVER (Express.js)                          │
│                                                                  │
│  /api/v1/auth        Auth module (JWT, Google OAuth)            │
│  /api/v1/queries     Query module + RAG endpoint                │
│  /api/v1/faqs        FAQ module (search, resolve, vote)         │
│  /api/v1/contributors  Contributor workflow                     │
│  /api/v1/admin       Admin management                           │
│  /api/v1/notifications  User notifications                      │
│                                                                  │
│  Socket.io ─── rooms: feed:contributors, room:admin, user:{id}  │
│  BullMQ ─────── deadline queue (Redis-backed)                   │
└──────┬──────────────────────┬───────────────────┬───────────────┘
       │                      │                   │
       ▼                      ▼                   ▼
┌─────────────┐   ┌────────────────────┐  ┌──────────────┐
│  MongoDB    │   │  Upstash Redis     │  │  OpenRouter  │
│  Atlas      │   │  (Cache + Queue)   │  │  (AI / RAG)  │
│             │   │                    │  │              │
│  - FAQs     │   │  - Embedding cache │  │  + Jina AI   │
│  - Queries  │   │  - FAQ list cache  │  │  (Embeddings)│
│  - Users    │   │  - BullMQ jobs     │  └──────────────┘
│  - Responses│   └────────────────────┘
│  - Notifs   │
│             │
│  Vector     │
│  Search     │
│  Index      │
└─────────────┘
```

---

## How It Works — End-to-End Flow

### 1. Ask a Question (RAG Flow)

When a user types a question on the Ask page and moves focus away from the textarea:

```
User types question
       │
       ▼
POST /api/v1/queries/ask  (public, rate-limited)
       │
       ├── Generate embedding via Jina AI
       │
       ├── MongoDB Atlas Vector Search
       │     └── Finds semantically similar published FAQs
       │         (cosine similarity ≥ 0.82, up to 5 results)
       │
       ├── Full-text search (concurrent)
       │     └── Merges results, deduplicates
       │
       └── OpenRouter RAG generation
             └── Context = retrieved FAQs
             └── Returns plain-text synthesized answer (no markdown)
                 with post-processing strip for any ** * # ` characters

Response to client:
{
  aiAnswer: "plain text answer...",
  relatedFAQs: [{ title, answer, category, matchType, isBest }, ...]
}
```

**Fallback behaviour:** If OpenRouter fails, the client automatically retries with `POST /api/v1/faqs/resolve` to show related FAQs without the AI answer. If both fail, nothing is shown (no error displayed to user).

---

### 2. Query Submission

If the user is not satisfied with the AI answer, they submit the query:

```
POST /api/v1/queries  (auth required, rate-limited)
       │
       ├── Check existing FAQs (resolveQuery)
       │     └── If match found → return FAQ immediately (no submission)
       │
       ├── AI relevance validation (OpenRouter)
       │     └── Classifies into: internship / placement / resume /
       │         dsa / coding-interview / career / general
       │
       ├── Generate embedding (Jina AI, 768 dimensions)
       │
       ├── Persist Query document (MongoDB)
       │     └── status: "open"
       │     └── deadline = now + QUERY_DEADLINE_HOURS
       │
       ├── Schedule BullMQ deadline job
       │     └── Fires after deadline window expires
       │
       └── Emit Socket.io event → feed:contributors room
             └── Contributors see new query appear in real time
```

---

### 3. Contributor Answering

Contributors see the live feed and interact through a structured workflow:

```
GET  /api/v1/queries/feed      → paginated list of open/in-progress queries
POST /api/v1/contributors/queries/:id/accept  → lock in, create response slot
POST /api/v1/contributors/queries/:id/answer  → submit answer text + confidence
POST /api/v1/contributors/queries/:id/skip    → pass without penalty
POST /api/v1/contributors/queries/:id/flag    → mark as inappropriate

Rules:
- Must accept before answering
- Cannot answer own queries
- One answer per contributor per query
- Flagging: contributor flag toggles (flag/unflag)
- Admin flag: immediately removes query from feed
- FLAG_THRESHOLD reached: query auto-removed + creator notified
- Each accepted answer → +5 reputation points
```

---

### 4. Query Deadline & AI Summarization

When a query's deadline fires (BullMQ job):

```
BullMQ deadline job fires
       │
       ├── Collect all contributor answers for the query
       │
       ├── If answers exist:
       │     └── OpenRouter summarizes all answers into one coherent response
       │         (SUMMARIZATION_SYSTEM_PROMPT)
       │
       ├── If no answers:
       │     └── Mark as "expired" with placeholder message
       │
       ├── Update query status → "admin-review"
       │
       └── Emit Socket.io events:
             ├── feed:contributors  → query removed from feed
             ├── user:{creatorId}   → "your query is being reviewed"
             └── room:admin         → new item in review queue
```

A background sweep (`QueryExpiryService.sweepExpiredQueries`) also runs on each feed request to catch any jobs that were missed.

---

### 5. Admin Review & FAQ Publishing

```
Admin Dashboard → Pending Review Queue
       │
       ├── View query + AI-synthesized answer + all contributor responses
       │
       ├── Option A: Publish as-is
       │     └── POST /api/v1/admin/queries/:id/publish-faq
       │
       ├── Option B: Edit then approve
       │     └── PUT  /api/v1/admin/faqs/:id/edit-approve
       │           └── Admin edits title, answer, category, tags
       │
       └── Option C: Reject
             └── DELETE /api/v1/admin/faqs/:id/reject

On publish:
       ├── FAQ document created with embedding
       ├── Status → "completed"
       ├── Emit Socket.io → all clients (faq:published)
       └── FAQ now appears in vector search results for future queries
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Primary database |
| MongoDB Atlas Vector Search | Semantic FAQ retrieval (768-dim cosine) |
| Socket.io | Real-time bidirectional events |
| BullMQ + Redis | Query deadline job queue |
| Upstash Redis | Embedding cache + FAQ list cache |
| OpenRouter | Chat completions for RAG + validation + summarization |
| Jina AI | Text embeddings (jina-embeddings-v3, 768 dims) |
| JWT (access + refresh) | Stateless authentication |
| Google OAuth | Social sign-in |
| Helmet + CORS | HTTP security headers |
| express-rate-limit | Per-route rate limiting |
| Zod | Runtime environment + request validation |
| Pino | Structured JSON logging |
| BullMQ Board | Visual queue monitoring |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| React Router v7 | Client-side routing |
| TanStack Query v5 | Server state, caching, mutations |
| Zustand | Client auth state |
| React Hook Form + Zod | Form validation |
| Socket.io-client | Real-time event subscriptions |
| Axios | HTTP client with interceptors |
| Tailwind CSS v4 | Utility-first styling |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |

---

## Project Structure

```
crowdsourced-faq-project/
├── client/                          # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── AskQueryPage.jsx     # RAG-powered ask UI
│       │   ├── FAQPage.jsx          # Browse published FAQs
│       │   ├── LiveContributorFeed.jsx  # Real-time contributor feed
│       │   └── dashboard/           # Admin dashboard pages
│       ├── services/
│       │   └── api.js               # All HTTP service methods
│       ├── store/
│       │   └── authStore.js         # Zustand auth state
│       ├── hooks/                   # Custom React hooks
│       ├── contexts/                # React context providers
│       └── lib/
│           └── axios.js             # Axios instance + interceptors
│
└── server/                          # Express.js backend
    └── src/
        ├── configs/
        │   ├── env.config.js        # Zod-validated env vars
        │   ├── ai.config.js         # AI provider configuration
        │   ├── mongodb.config.js    # MongoDB connection
        │   ├── redis.config.js      # Redis/Upstash connection
        │   ├── socket.config.js     # Socket.io setup
        │   └── queue.config.js      # BullMQ setup
        ├── middlewares/
        │   ├── auth.middleware.js   # JWT authenticate + authorize
        │   ├── validate.middleware.js  # Zod body/params/query validation
        │   ├── rateLimit.middleware.js # Per-route rate limiters
        │   ├── error.middleware.js  # Global error handler
        │   ├── sanitize.middleware.js  # XSS sanitization
        │   └── mongoSanitize.middleware.js  # NoSQL injection prevention
        ├── modules/
        │   ├── ai/
        │   │   ├── providers/       # Gemini, OpenAI, OpenRouter, Bedrock, Jina
        │   │   └── service/
        │   │       ├── embedding.service.js    # Embedding + cache
        │   │       ├── aiValidation.service.js # Relevance + summarization + FAQ draft
        │   │       └── rag.service.js          # RAG answer generation
        │   ├── auth/                # Register, login, Google OAuth, refresh
        │   ├── faq/                 # FAQ CRUD, vector search, text search, voting
        │   ├── queries/             # Query submit, feed, expiry, RAG endpoint
        │   ├── contributors/        # Accept, answer, skip, flag workflow
        │   ├── admin/               # Dashboard, review queue, user management
        │   ├── notifications/       # User notification persistence
        │   ├── queues/              # BullMQ deadline queue + processor
        │   ├── realtime/            # Socket.io rooms + event constants
        │   └── users/               # User repository
        └── utils/
            ├── errors.js            # Custom error classes
            ├── apiResponse.js       # Standardized JSON responses
            ├── cache.js             # Redis get/set/del helpers
            ├── pagination.js        # Pagination builder
            └── logger.js            # Pino logger instance
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Authentication — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register with email + password |
| POST | `/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/auth/google` | Public | Google OAuth sign-in |
| POST | `/auth/refresh` | Public | Refresh access token via cookie |
| POST | `/auth/logout` | Auth | Clear tokens |
| GET | `/auth/me` | Auth | Get current user profile |
| PATCH | `/auth/change-password` | Auth | Update password |

### FAQs — `/faqs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/faqs` | Public | List published FAQs (paginated, filterable) |
| GET | `/faqs/:id` | Public | Get single FAQ |
| GET | `/faqs/search?q=` | Public | Full-text search FAQs |
| POST | `/faqs/resolve` | Public | Resolve question via exact + vector + text search |
| GET | `/faqs/stats` | Public | FAQ counts (total, published, pending) |
| POST | `/faqs/:id/vote` | Auth | Upvote or downvote a FAQ |

### Queries — `/queries`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/queries/ask` | Public | RAG pipeline: vector search + AI answer |
| GET | `/queries/feed` | Public | Open/in-progress query feed (paginated) |
| POST | `/queries` | Auth | Submit a new query to contributors |
| GET | `/queries/my` | Auth | My submitted queries |
| GET | `/queries/:id` | Public | Get single query |
| GET | `/queries/:id/responses` | Public | Get contributor responses for a query |
| DELETE | `/queries/:id` | Auth | Delete own open query |
| GET | `/queries/admin/stats` | Admin | Query status breakdown |

### Contributors — `/contributors`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/contributors/queries/:id/accept` | Auth | Accept a query to answer |
| POST | `/contributors/queries/:id/answer` | Auth | Submit answer + confidence score |
| POST | `/contributors/queries/:id/skip` | Auth | Skip a query |
| POST | `/contributors/queries/:id/flag` | Auth | Flag / unflag a query |
| GET | `/contributors/my-responses` | Auth | My contribution history |

### Admin — `/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Full dashboard statistics |
| GET | `/admin/top-contributors` | Admin | Leaderboard by reputation |
| GET | `/admin/queries/pending-review` | Admin | Queries awaiting admin review |
| POST | `/admin/queries/:id/publish-faq` | Admin | Publish query as FAQ |
| GET | `/admin/faqs/pending` | Admin | FAQ drafts pending approval |
| POST | `/admin/faqs/:id/approve` | Admin | Approve a FAQ draft |
| PUT | `/admin/faqs/:id/edit-approve` | Admin | Edit and approve a FAQ draft |
| DELETE | `/admin/faqs/:id/reject` | Admin | Reject and delete a FAQ draft |
| GET | `/admin/users` | Admin | List all users |
| PATCH | `/admin/users/:userId/role` | Admin | Change user role |
| DELETE | `/admin/users/:userId` | Admin | Deactivate a user |

### Notifications — `/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Auth | Get all notifications for current user |
| POST | `/notifications/read-all` | Auth | Mark all as read |
| PATCH | `/notifications/:id/read` | Auth | Mark one as read |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server health check + uptime |

---

## Real-time Events (Socket.io)

The server manages three Socket.io rooms:

| Room | Who joins |
|---|---|
| `feed:contributors` | All logged-in contributors viewing the feed |
| `room:admin` | All logged-in admins |
| `user:{userId}` | Each user's personal notification room |

### Events emitted by the server

| Event | Room | Payload |
|---|---|---|
| `query:new` | `feed:contributors` | `{ queryId, question, category, deadline, createdAt }` |
| `query:updated` | `feed:contributors` | `{ queryId, status, responseCount, acceptedContributorsCount }` |
| `query:expired` | `feed:contributors` | `{ queryId, question }` |
| `query:flagged` | `feed:contributors` | `{ queryId, flagCount }` |
| `query:removed` | `feed:contributors` | `{ queryId }` |
| `contributor:accepted` | `user:{creatorId}` | `{ queryId, contributorId, responseId }` |
| `contributor:answer` | `room:admin` | `{ queryId, contributorId, responseCount }` |
| `faq:published` | All clients | `{ faqId, title, category, publishedAt }` |
| `faq:pending-review` | `room:admin` | `{ queryId, title, aiSynthesizedAnswer, category }` |
| `admin:notification` | `room:admin` | `{ type, message, queryId }` |
| `notification:user` | `user:{userId}` | `{ type, message, queryId }` |

---

## AI & RAG Pipeline

### Providers

The platform supports multiple AI providers, configured via `AI_PROVIDER` env variable:

| Provider | Chat | Embeddings |
|---|---|---|
| `openrouter` | Yes (via OpenAI-compatible API) | No — uses Jina fallback |
| `gemini` | Yes | Yes (text-embedding-004) |
| `openai` | Yes | Yes (text-embedding-3-small) |
| `bedrock` | Yes | Yes (amazon.titan-embed-text-v2) |
| `jina` | No | Yes (jina-embeddings-v3) |

### RAG Answer Generation

```
POST /queries/ask
  │
  ├── Embed question (Jina, 768 dims, cached 24h in Redis)
  │
  ├── MongoDB Atlas Vector Search
  │     index: faq_vector_index
  │     similarity: cosine
  │     threshold: 0.82
  │     limit: 5 (over-fetch 10, filter by score)
  │
  ├── MongoDB Full-Text Search (concurrent)
  │     min score: 1.5
  │     limit: 5
  │
  ├── Merge + deduplicate results
  │
  └── OpenRouter chat completion
        system: plain-text formatting rules + content rules
        context: up to 5 retrieved FAQ entries
        max_tokens: 600
        temperature: 0.3
        post-process: strip ** * _ # ` ~ markdown characters
```

### AI Summarization (on query expiry)

When a query deadline fires, all contributor answers are fed into `summarizeAnswers()`:

```
SUMMARIZATION_SYSTEM_PROMPT
  + question + contributor answers (1..N)
  → synthesized plain answer
  → sanitized (strip markdown, normalize whitespace)
  → stored as aiSynthesizedAnswer on the Query document
```

### FAQ Drafting

After summarization, `draftFAQ()` creates a structured entry:

```
FAQ_DRAFT_SYSTEM_PROMPT
  + question + synthesized answer
  → JSON: { title, answer, category, tags }
  → stored as unpublished FAQ draft
  → admin reviews and publishes
```

---

## User Roles & Permissions

| Role | Can Ask | Can Contribute | Can Flag | Can Admin |
|---|---|---|---|---|
| `user` | Yes | No | No | No |
| `contributor` | Yes | Yes | Yes | No |
| `admin` | No | No | Yes (instant remove) | Yes |

- Admins cannot submit queries
- Contributors cannot answer or flag their own queries
- Role changes are performed by admins via `PATCH /admin/users/:userId/role`

---

## Environment Variables

Create a `.env` file in `/server` with the following:

```env
# Server
NODE_ENV=development
PORT=4000

# MongoDB Atlas
MONGO_URI=mongodb+srv://...

# Upstash Redis (use rediss:// for TLS)
UPSTASH_REDIS_URL=rediss://...

# CORS — comma-separated origins
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>

# AI Provider — openrouter | gemini | openai | bedrock | jina
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_CHAT_MODEL=openrouter/auto       # optional, defaults to auto
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # optional

# Jina Embeddings (required when AI_PROVIDER=openrouter or bedrock)
JINA_API_KEY=jina_...
JINA_EMBEDDING_MODEL=jina-embeddings-v3
JINA_BASE_URL=https://api.jina.ai/v1

# Other AI providers (optional, only if using that provider)
GEMINI_API_KEY=...
OPENAI_API_KEY=...

# Vector Search
EMBEDDING_DIMENSIONS=768
VECTOR_SEARCH_INDEX=faq_vector_index
VECTOR_SIMILARITY_THRESHOLD=0.82

# Query Workflow
QUERY_DEADLINE_HOURS=1        # decimals ok: 0.083 = 5 min
MIN_CONTRIBUTOR_RESPONSES=2
FLAG_THRESHOLD=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_PUBLIC=100
RATE_LIMIT_MAX_AUTH=200
RATE_LIMIT_MAX_AI=10
```

Create a `.env` file in `/client` with:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

> **MongoDB Atlas Setup Required:** Create a Vector Search index named `faq_vector_index` on the `faqs` collection, field `embedding`, type `knnVector`, dimensions `768`, similarity `cosine`.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- MongoDB Atlas account (free tier works)
- Upstash Redis account (free tier works)
- OpenRouter API key (or any supported AI provider)
- Jina AI API key (for embeddings when using OpenRouter)

### Installation

```bash
# Clone the repository
git clone https://github.com/IndSumit07/CrowdSourced-FAQ-Project.git
cd CrowdSourced-FAQ-Project

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running in Development

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
cd client
npm run dev
```

The server runs on `http://localhost:4000` and the client on `http://localhost:5173`.

### Seed the FAQ Knowledge Base

```bash
cd server
npm run seed:faqs
```

This seeds the database with the initial FAQ entries from `faqs.json` and generates embeddings for each, populating the vector search index.

---

## Scripts

### Server

| Script | Command | Description |
|---|---|---|
| `dev` | `nodemon server.js` | Start with hot-reload |
| `start` | `node server.js` | Production start |
| `seed:faqs` | `node scripts/seed-faqs.js` | Seed FAQ knowledge base |
| `lint` | `eslint src --ext .js` | Lint source files |

### Client

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start dev server |
| `build` | `vite build` | Production bundle |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Lint source files |

---

## License

This project was built as part of an internship at IIT Ropar. All rights reserved.
