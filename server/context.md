# FAQ Platform — Server Context

This document is the canonical compact reference for the `server/` codebase.
Designed for LLMs to understand the full architecture without reading every file.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ (ESM — `type: "module"`) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 8 |
| Cache / Queues | **Upstash Redis** (serverless, TLS) via ioredis |
| Job Queues | BullMQ (deadline, AI summarization, FAQ generation, notifications) |
| Realtime | Socket.io 4 |
| AI Provider | Gemini (primary) / OpenAI (switchable via `AI_PROVIDER` env) |
| Auth | JWT (access 15m) + HttpOnly refresh token (7d) with rotation |
| Validation | Zod (all request body/query/params) |
| Logging | Pino + pino-http (pretty in dev, JSON in prod) |

---

## 📁 Directory Structure

```
server/
├── server.js                       # Entrypoint — HTTP server, graceful shutdown
├── .env                            # Environment variables (see credentials section below)
├── src/
│   ├── app.js                      # Express bootstrap — middleware stack, route mounting
│   ├── configs/
│   │   ├── env.config.js           # Zod-validated env schema (fails fast on bad config)
│   │   ├── mongodb.config.js       # Mongoose connection with pooling + lifecycle logs
│   │   ├── redis.config.js         # Upstash Redis via ioredis (TLS, two connections)
│   │   ├── socket.config.js        # Socket.io init + room management
│   │   ├── auth.config.js          # JWT + bcrypt + cookie constants
│   │   ├── ai.config.js            # AI provider settings, vector search config
│   │   └── queue.config.js         # BullMQ queue names + job defaults
│   ├── middlewares/
│   │   ├── auth.middleware.js      # authenticate, authorize(roles), optionalAuthenticate
│   │   ├── error.middleware.js     # Centralized error handler + 404 handler
│   │   ├── validate.middleware.js  # validateBody/validateQuery/validateParams (Zod)
│   │   ├── rateLimit.middleware.js # publicLimiter, authLimiter, aiLimiter, strictAuthLimiter
│   │   └── sanitize.middleware.js  # XSS sanitization on req.body + req.query
│   ├── utils/
│   │   ├── logger.js               # Pino logger singleton
│   │   ├── errors.js               # AppError class hierarchy (NotFound, Validation, etc.)
│   │   ├── asyncHandler.js         # Wraps async controllers, forwards errors to next()
│   │   ├── apiResponse.js          # ApiResponse.success/created/paginated/error
│   │   ├── tokenService.js         # signAccessToken, signRefreshToken, verifyAccessToken/Refresh
│   │   ├── hashService.js          # hashPassword, comparePassword (bcryptjs)
│   │   ├── pagination.js           # buildPagination, buildSortStage, buildPaginationMeta
│   │   └── cache.js                # cacheGet/Set/Del/Pattern + withCache() helper
│   └── modules/
│       ├── auth/                   # Register, login, refresh, logout, change-password
│       ├── users/                  # User schema, UserRepository
│       ├── faq/                    # FAQ schema, FAQRepository, FAQService (3-tier search), FAQController
│       ├── queries/                # Query + ContributorResponse schemas, full submission workflow
│       ├── contributors/           # Accept / answer / skip workflow, reputation updates
│       ├── admin/                  # FAQ approval, user management, dashboard stats
│       ├── notifications/          # Notification schema, mark-read endpoints
│       ├── ai/
│       │   ├── providers/          # AIProvider (abstract), GeminiProvider, OpenAIProvider, factory
│       │   └── service/            # EmbeddingService (cached), AIValidationService (relevance/summarize/draft)
│       ├── queues/
│       │   ├── deadline.queue.js   # Queue definitions (deadline, ai-summarization, faq-generation, notifications)
│       │   └── workers.js          # All BullMQ workers registered here
│       └── realtime/
│           └── constants/events.js # SOCKET_EVENTS constants (shared across modules)
```

---

## 🔑 Environment Variables (`.env`)

### Required
```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb+srv://...

# Upstash Redis — get from console.upstash.com → your DB → Connect → ioredis
UPSTASH_REDIS_HOST=your-db.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=your_upstash_password

# OR use the full URL (takes precedence):
# UPSTASH_REDIS_URL=rediss://default:<password>@<host>:6379

CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=at_least_32_chars
JWT_REFRESH_SECRET=at_least_32_chars
GEMINI_API_KEY=your_gemini_key
```

### Optional
```env
AI_PROVIDER=gemini          # or "openai"
OPENAI_API_KEY=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
QUERY_DEADLINE_HOURS=24
MIN_CONTRIBUTOR_RESPONSES=2
```

---

## 🔄 Upstash Redis Architecture

**Why Upstash?** Serverless Redis — no local instance needed, TLS by default, free tier available.

**Two ioredis connections are created:**
| Connection | Variable | Purpose |
|---|---|---|
| `redisClient` | Cache | General caching, `withCache()`, rate limiting |
| `bullMQRedisConnection` | BullMQ | Job queues — requires `maxRetriesPerRequest: null` and `lazyConnect: true` |

**Key rule:** Upstash uses `rediss://` (TLS), not `redis://`. The config sets `tls: {}` on every ioredis instance automatically.

---

## 🗄️ Database Schemas

| Schema | Key Fields |
|---|---|
| `User` | name, email, password (hashed), role, expertise, reputation, refreshToken, refreshTokenFamily |
| `FAQ` | title, answer, category, tags, embedding (vector, `select: false`), published, views, upvotes |
| `Query` | question, category, status, deadline, embedding, creator, acceptedContributors, responseCount, resolvedAnswer, resolvedAt |
| `ContributorResponse` | query, contributor, answer, confidence, skipped, accepted |
| `Notification` | recipient, type, message, read, metadata(queryId, faqId) |

---

## 🔌 API Routes

| Prefix | Module | Auth |
|---|---|---|
| `POST /api/v1/auth/register` | AuthController | Public |
| `POST /api/v1/auth/login` | AuthController | Public |
| `POST /api/v1/auth/refresh` | AuthController | Public |
| `POST /api/v1/auth/logout` | AuthController | JWT |
| `GET  /api/v1/auth/me` | AuthController | JWT |
| `GET  /api/v1/faqs` | FAQController | Public |
| `GET  /api/v1/faqs/search?q=` | FAQController | Public |
| `POST /api/v1/faqs/resolve` | FAQController | AI rate limited |
| `POST /api/v1/queries` | QueryController | JWT |
| `GET  /api/v1/queries/feed` | QueryController | Public |
| `POST /api/v1/contributors/queries/:id/accept` | ContributorController | contributor/admin |
| `POST /api/v1/contributors/queries/:id/answer` | ContributorController | contributor/admin |
| `GET  /api/v1/admin/faqs/pending` | AdminController | admin |
| `POST /api/v1/admin/faqs/:id/approve` | AdminController | admin |
| `GET  /api/v1/notifications` | NotificationController | JWT |

---

## ⚡ Query Submission Workflow

```
User POSTs question
    │
    ▼
FAQService.resolveQuery()
    ├── Exact match? → Return FAQ immediately
    ├── Text search match? → Return FAQ immediately
    └── Vector search match? → Return FAQ immediately
         │ (no match)
         ▼
AIValidationService.validateRelevance()
    └── Off-topic? → Reject with 400
         │ (relevant)
         ▼
EmbeddingService.embed(question)
         │
         ▼
Query persisted to MongoDB (status: "open")
         │
         ▼
deadlineQueue.add() — delayed job (QUERY_DEADLINE_HOURS)
         │
         ▼
Socket.io → io.to("feed:contributors").emit("query:new")
```

---

## 🔄 BullMQ Pipeline (Post-Deadline)

```
deadlineWorker fires when deadline expires
    ├── < MIN_CONTRIBUTOR_RESPONSES → mark "expired", notify creator
    └── >= MIN_CONTRIBUTOR_RESPONSES → mark "processing"
         │
         ▼
aiSummarizationWorker
    └── AI.summarizeAnswers(question, answers[])
         │
         ▼
faqGenerationWorker
    └── AI.draftFAQ() → persist FAQ (published: false) → notify admin via Socket.io
         │
         ▼
notificationWorker
    └── Socket.io → io.to("user:{creatorId}").emit("notification:user")
```

---

## 🔐 Auth Flow

- **Access token:** 15m JWT, sent in `Authorization: Bearer` header
- **Refresh token:** 7d JWT, stored in HttpOnly cookie + hashed in DB
- **Rotation:** Every refresh call issues new tokens; old hashed token is replaced
- **Reuse detection:** If stored hash doesn't match → revoke entire family → force re-login

---

## ✅ Admin Resolution + Reputation
- When an admin publishes a query to FAQ, the selected contributor response is marked `accepted` and the contributor gains **+10 reputation** (`incrementReputationAndAccepted`).
- The query is updated to `completed` with `resolvedAnswer` and `resolvedAt`.
- Socket events emitted: `contributor:answer-accepted` (notifies contributor) and `notification:user` (notifies query creator).

---

## 🏛️ Architecture Patterns

| Pattern | Usage |
|---|---|
| Repository | All DB access isolated in `repository/` classes — services never use Mongoose directly |
| Provider abstraction | `AIProvider` abstract class → `GeminiProvider` / `OpenAIProvider` — swap via env |
| Cache-aside | `withCache(key, loader, ttl)` in `utils/cache.js` |
| asyncHandler | Wraps every async controller to forward errors to Express error middleware |
| Centralized errors | `AppError` hierarchy — `NotFoundError`, `ValidationError`, `UnauthorizedError`, etc. |
