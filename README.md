# Skill Swap University

A campus peer-to-peer skill exchange for a single university. Students **offer**
skills they can teach, **request** help with skills they want to learn, get
transparently matched, hold sessions (online video or in person), and earn
**karma** and **badges** for helping their peers.

Built as a working MERN product (not a UI mock): the matching engine, karma
ledger, messaging authorization, session lifecycle and real-time layer are all
implemented and covered by automated tests.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start (Windows / PowerShell)](#quick-start-windows--powershell)
- [Environment variables](#environment-variables)
- [Seeding demo data](#seeding-demo-data)
- [Demo accounts](#demo-accounts)
- [Running tests](#running-tests)
- [How matching works](#how-matching-works)
- [Karma & badges](#karma--badges)
- [AI skill verification](#ai-skill-verification)
- [Real-time & WebRTC](#real-time--webrtc)
- [API reference](#api-reference)
- [Privacy & safety](#privacy--safety)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Auth & onboarding** — JWT auth, bcrypt password hashing, multi-step
  onboarding with skill interests and campus geolocation.
- **Skill offers** — publish what you can teach, with level, format, weekly
  availability and optional supporting evidence (file upload).
- **Help requests** — describe what you need; the engine immediately surfaces
  the best matching helpers and notifies them.
- **Transparent matching** — weighted score with a visible breakdown and reasons
  (skill, availability, distance, trust, verified bonus). Works with no location.
- **Messaging** — 1:1 private conversations over Socket.IO with REST fallback,
  read receipts and strict participant authorization.
- **Sessions** — accept → schedule → start → dual-confirm completion → review.
  Karma is awarded **exactly once** via an idempotent ledger.
- **Video calls** — WebRTC peer connection with Socket.IO signalling for online
  sessions.
- **Karma, badges & leaderboard** — all-time and weekly leaderboards, 10 badge
  definitions with progress tracking.
- **AI-assisted skill verification** — assessment-based "verified" indicator with
  a deterministic demo provider by default and an optional real OpenAI provider.
- **Insights** — personal analytics: sessions taught/learned, success rate, karma
  trend, top skills and recent reviews.
- **Demo mode** — every seeded record is flagged `isDemo` and clearly labelled in
  the UI.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite 5, React Router 6, Tailwind CSS 3, Framer Motion, Recharts, Lucide, Socket.IO client |
| Backend   | Node.js, Express 4, Mongoose 8, Socket.IO 4, JWT, bcryptjs, express-validator, multer, helmet, express-rate-limit |
| Database  | MongoDB (local, Docker, Atlas, or in-memory for tests) |
| Testing   | Jest + Supertest + mongodb-memory-server |

## Repository layout

```
Skill Swap University/
├─ server/                 # Express + MongoDB API
│  ├─ src/
│  │  ├─ config/           # env + database connection
│  │  ├─ constants/        # skill catalog + badge definitions
│  │  ├─ controllers/      # request handlers
│  │  ├─ middleware/       # auth, error handling, rate limiting, uploads
│  │  ├─ models/           # Mongoose schemas
│  │  ├─ routes/           # route definitions
│  │  ├─ services/         # matching, karma, availability, badges, AI, notifications
│  │  ├─ sockets/          # Socket.IO server (messaging, notifications, WebRTC)
│  │  ├─ utils/            # tokens, distance, serializers, response helpers
│  │  ├─ app.js            # Express app
│  │  └─ server.js         # HTTP + socket bootstrap
│  ├─ seeds/seed.js        # demo data seeder
│  ├─ tests/               # Jest integration tests
│  └─ .env.example
├─ client/                 # React + Vite SPA
│  ├─ src/
│  │  ├─ components/       # UI kit, cards, layout, map
│  │  ├─ context/          # Auth, Toast, Socket providers
│  │  ├─ lib/              # api client, socket, utils/constants
│  │  ├─ pages/            # one file per screen
│  │  ├─ App.jsx           # routes
│  │  └─ main.jsx
│  └─ .env.example
├─ scripts/dev.js          # runs the API + client together (npm run dev)
└─ README.md
```

## Prerequisites

- **Node.js 18+** (developed on Node 24) and npm 9+.
- **MongoDB** — one of:
  - Local `mongod` / MongoDB Community Server, or
  - Docker Desktop (`docker run -d -p 27017:27017 --name ssu-mongo mongo:7`), or
  - A MongoDB Atlas connection string.
- A browser with camera/microphone access (only needed for online sessions).

## Quick start (Windows / PowerShell)

From the repository root you can install everything and run both apps together:

```powershell
npm run setup        # installs server/ and client/ dependencies
npm run dev          # starts BOTH the API (5000) and the web app (5173)
```

Then open <http://localhost:5173>. `npm run dev` runs the backend and frontend
side by side (no extra dependency) and stops both when you press `Ctrl+C`.

Prefer separate terminals? Run each app on its own:

```powershell
npm run server       # backend  -> http://localhost:5000
npm run client       # frontend -> http://localhost:5173  (separate terminal)
```

The base **skill catalogue is created automatically on backend startup**, so a
fresh database is immediately usable. `npm run seed` is only needed to load the
optional demo students and sample content.

Or run the two apps manually:

**1) Backend**

```powershell
cd server
Copy-Item .env.example .env      # then edit .env (set JWT_SECRET, MONGODB_URI)
npm install
npm run seed                     # optional: load demo data (needs MongoDB running)
npm run dev                      # http://localhost:5000  (or: npm start)
```

**2) Frontend**

```powershell
cd client
npm install
npm run dev                      # http://localhost:5173
```

Then open <http://localhost:5173>. The Vite dev server proxies `/api`,
`/uploads` and `/socket.io` to the backend on port 5000, so no frontend env
vars are required for local development.

> **macOS / Linux**: the same commands work; replace `Copy-Item` with `cp`.

## Environment variables

### Server (`server/.env`)

| Variable | Default | Notes |
|----------|---------|-------|
| `NODE_ENV` | `development` | `test` disables request logging and uses in-memory DB in tests |
| `PORT` | `5000` | API + Socket.IO port |
| `CLIENT_URL` | `http://localhost:5173` | Used for links/CORS |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/skill_swap_university` | Local or Atlas URI |
| `JWT_SECRET` | (dev placeholder) | **Set a long random value** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `BCRYPT_ROUNDS` | `10` | Password hashing cost |
| `CAMPUS_NAME` | `Skill Swap University` | Branding |
| `ALLOWED_EMAIL_DOMAINS` | empty | e.g. `student.ssu.edu` |
| `ALLOW_ANY_EMAIL` | `true` | When true, skip the email-domain check (demo) |
| `AI_PROVIDER` | `demo` | `demo` or `openai` |
| `OPENAI_API_KEY` | empty | Required for real AI grading |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `AI_PASS_THRESHOLD` | `70` | Verification pass mark (0–100) |
| `UPLOAD_DIR` | `uploads` | Local upload directory |
| `MAX_UPLOAD_MB` | `5` | Max upload size |
| `RATE_LIMIT_WINDOW_MINUTES` / `RATE_LIMIT_MAX` | `15` / `300` | General API limiter |
| `AUTH_RATE_LIMIT_MAX` | `30` | Auth + AI limiter |

### Client (`client/.env`) — optional

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `/api` | Full API base URL when not using the proxy |
| `VITE_SOCKET_URL` | current origin | Socket.IO server URL |
| `VITE_PROXY_TARGET` | `http://localhost:5000` | Dev proxy target |

## Seeding demo data

The base **skill catalogue (categories + skills) is upserted automatically on
every backend startup**, so onboarding, discover and offers work on a fresh
database without any manual step.

To load the optional demo content, with MongoDB running:

```powershell
cd server
npm run seed
```

This creates ~16 fictional students (all `isDemo: true`), active offers, open
help requests, a few completed sessions with reviews and karma history, badges,
notifications, and a demo conversation. Re-running the seed clears previous demo
records first (user-created data is preserved).

## Demo accounts

Any seeded student logs in with:

- **Email:** `demo1@demo.ssu.edu` … `demo16@demo.ssu.edu`
- **Password:** `DemoPass123`

`demo1` is a good starting point (most populated availability and history).

## Running tests

Backend integration tests use `mongodb-memory-server`, so **no MongoDB install
is required** to run them.

```powershell
cd server
npm test          # Jest + Supertest, serial, in-memory DB
npm run lint      # ESLint

cd ../client
npm run lint
npm run build     # production build smoke check
```

Covered today:

- `tests/auth.test.js` — register, duplicate, validation, login, `/me`, profile update.
- `tests/matching.test.js` — ranking, verified bonus, self-match guard.
- `tests/karma.test.js` — session accept/start/complete, karma amounts, **idempotency**.
- `tests/conversations.test.js` — conversation creation and participant authorization.

## How matching works

The matching engine (`server/src/services/matchingService.js`) scores each active
offer against a request with a fully transparent breakdown:

```text
skill relevance   40   exact skill (related category = 16)
availability      25   overlap between request slots and offer slots
distance          20   decays to 0 at 6 km; neutral (10) when location unknown
trust             15   rating (70%) + completed sessions (30%)
verified bonus  + 10   assessment-verified for the requested skill
                       score clamped to 100
```

Skill and availability always outweigh distance. When location permission is
unavailable the distance term degrades to a neutral value so matching keeps
working on skill and availability alone. Distance is only ever exposed as a
fuzzy label ("Nearby on campus"), never exact coordinates.

## Karma & badges

Karma is written to an append-only `KarmaTransaction` ledger with a **unique
compound index on `(user, reason, refId)`**, which guarantees idempotency — a
duplicated "complete session" request can never double-award points.

| Event | Points |
|-------|--------|
| Teach a session | +10 |
| Learn in a session | +5 |
| Session completion bonus (both) | +2 |
| First teaching session | +5 |
| Review received | +3 |
| Skill verification passed | +15 |

Sessions require **both** participants to confirm completion before karma is
awarded. Ten badge definitions (first-steps → campus-legend) unlock automatically
from computed metrics; progress is shown on the Karma & badges page.

## AI skill verification

Verification produces an **assessment-based indicator**, clearly labelled as such.

- **Demo mode (default):** questions are generated locally and answers are graded
  by a transparent heuristic (length, structure, use of examples). Results carry
  `mode: 'demo'`.
- **Real mode:** set `AI_PROVIDER=openai` and `OPENAI_API_KEY`. The service
  generates questions and grades answers via the Chat Completions API and falls
  back to demo mode on any provider error.

Passing (`AI_PASS_THRESHOLD`) marks matching offers as verified, adds a verified
badge, and awards karma.

## Real-time & WebRTC

Socket.IO authenticates with the same JWT and uses these rooms:

- `user:<id>` — personal notifications.
- `conversation:<id>` — live chat messages.
- `rtc:<room>` — WebRTC signalling for online sessions.

Events include `message:new`, `conversation:updated`, `rtc:signal`,
`rtc:peer-joined`, `rtc:peer-left`. Messaging works over REST too, so the app
degrades gracefully if the socket is unavailable. Video calls use public STUN
servers; peers are matched by a per-session room code.

## API reference

Base path: `/api` (except `GET /api/health`). All routes require a bearer token
except `auth/register` and `auth/login`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Service health check |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Log in |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/profile` | Update profile |
| PATCH | `/auth/privacy` | Privacy / discovery prefs |
| POST | `/auth/location` | Set campus location |
| PATCH | `/auth/availability` | Set weekly availability |
| PATCH | `/auth/skills` | Set learning interests |
| POST | `/auth/avatar` | Upload profile photo |
| GET | `/skills`, `/skills/categories` | Skill catalog |
| GET | `/users` | Discover students (filters: `q`, `category`, `skill`, `day`, `availableNow`) |
| GET | `/users/:id` | Student profile + offers |
| GET | `/users/me/insights` | Personal analytics |
| POST/GET | `/offers` | Create / list skill offers |
| POST | `/offers/evidence` | Upload supporting evidence |
| PATCH/DELETE | `/offers/:id` | Update / withdraw offer |
| POST/GET | `/requests` | Create / list help requests |
| GET | `/requests/:id` | Request detail + matches |
| GET | `/requests/:id/matches` | Ranked matches |
| PATCH/DELETE | `/requests/:id` | Update / cancel request |
| POST | `/sessions/:requestId/accept` | Accept a request and schedule a session |
| GET | `/sessions`, `/sessions/:id` | List / read sessions |
| POST | `/sessions/:id/start` | Start a session |
| POST | `/sessions/:id/complete` | Confirm completion (both needed) |
| POST | `/sessions/:id/cancel` | Cancel a session |
| POST | `/sessions/:id/review` | Leave a review |
| GET/POST | `/conversations` | List / start a conversation |
| GET/POST | `/conversations/:id/messages` | Read / send messages |
| POST | `/conversations/:id/read` | Mark conversation read |
| GET | `/notifications` | List notifications |
| POST | `/notifications/:id/read`, `/notifications/read-all` | Mark read |
| GET | `/karma/me`, `/karma/leaderboard`, `/karma/badges` | Karma, leaderboard, badges |
| POST | `/verification/start` | Start a skill assessment |
| POST | `/verification/:id/submit` | Submit answers |
| GET | `/verification/history`, `/verification/:id` | Assessment history / detail |

## Privacy & safety

- Single-campus academic prototype; no admin/moderation portal by design.
- Exact coordinates are never exposed — only a coarse distance label.
- Location sharing is opt-in and can be disabled (coordinates are cleared).
- Conversation access is participant-only; non-participants receive `403`.
- Secrets live only in `server/.env`, which is git-ignored.

## Troubleshooting

- **Registration fails / "Registration failed"** — the most common cause is the
  **backend not running**. Start it (`npm run dev` from the root, or `npm run
  server`) and make sure MongoDB is up. The frontend proxies `/api` to port 5000,
  so if only the client is running, every request fails.
- **`Cannot reach the server`** — ensure the backend is running on port 5000 and
  that `CORS_ORIGINS` includes the URL you opened (e.g. `http://localhost:5173`
  **and** `http://127.0.0.1:5173`).
- **Mongo connection refused** — start MongoDB (`mongod`, Docker, or Atlas) and
  confirm `MONGODB_URI`. The API exits on a failed startup connection.
- **Seed fails** — the seeder needs a reachable MongoDB; run it after the DB is up.
- **Video call shows "Waiting for your partner"** — both peers must open the same
  session's video room; camera/mic permissions must be granted. Corporate
  networks may block peer-to-peer connections without a TURN server.
- **`npm test` first run is slow** — `mongodb-memory-server` downloads a MongoDB
  binary once, then caches it.

---

Built as a portfolio-grade full-stack prototype. Demo data is fictional and every
demo record is labelled as such in the UI.
