# SwaraSangam — Architecture & Technical Overview

## What Is This?

SwaraSangam is a Carnatic music learning platform. It connects students with verified teachers, manages courses/sessions/assignments, stores student practice recordings, and handles events and community posts.

---

## Tech Stack

### Backend (`/api` — port 4000)

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | **Node.js 20** | Non-blocking I/O, great npm ecosystem |
| Language | **TypeScript** | Type safety across all controllers and models |
| Framework | **Express 4** | Minimal, composable, well-understood |
| ORM | **Prisma 5** | Type-safe DB queries, auto-migrations, schema-as-code |
| Database | **PostgreSQL 16** | Relational — courses, enrollments, sessions all need joins |
| Auth | **JWT + httpOnly cookie** | Stateless tokens; cookie auth for browsers, Bearer header for mobile |
| Password hashing | **bcryptjs** | Industry-standard salted hashing (never stored plain) |
| Validation | **Zod** | Schema-based validation at the route layer before any controller runs |
| File uploads | **Multer (disk storage)** | Streams audio directly to disk (`uploads/recordings/`), 150 MB limit |
| AI Chat | **Anthropic SDK (Claude)** | Powers the AI Guru chat at `/api/ai/chat` |
| API Docs | **Swagger (swagger-jsdoc + swagger-ui-express)** | Auto-generated docs at `/api/docs` from JSDoc comments in route files |
| Error handling | **express-async-errors** | Automatically catches async errors without try/catch in every controller |
| CORS | Custom origin whitelist | Allows `localhost:3001`, any LAN IP on port 3001 (mobile testing on same Wi-Fi) |
| Process management | **tsx watch** (dev), `node dist/` (prod) | tsx hot-reloads TS in dev; compiled JS in prod |

### Frontend (`/web` — port 3001)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14 (App Router)** | File-based routing, RSC, SSR, standalone Docker build |
| Language | **TypeScript** | Same type safety as the API |
| Styling | **Tailwind CSS** | Utility-first, no CSS files to maintain |
| HTTP client | `src/lib/api.ts` — thin wrapper over `fetch` | Centralised, credentials: 'include' for cookie auth |
| Auth state | **React Context (`AuthContext`)** | Global user object, `useAuth()` hook used on every protected page |
| Layout | `DashboardLayout` + `Sidebar` components | Shared shell used by student, teacher, admin, and content-manager pages |
| Icons | **lucide-react** | Tree-shakable SVG icons |
| API proxying | Next.js `rewrites()` in `next.config.mjs` | Forwards `/api/*` requests to Express — avoids CORS issues from the browser |

---

## Repository Layout

```
music-api/
├── api/                     ← Express backend (its own git repo)
│   ├── prisma/
│   │   └── schema.prisma    ← Single source of truth for all DB models
│   ├── src/
│   │   ├── index.ts         ← App bootstrap, middleware, Swagger, health
│   │   ├── middleware/
│   │   │   ├── auth.ts      ← authenticate() + requireRole()
│   │   │   ├── validate.ts  ← Zod validation wrapper
│   │   │   └── errorHandler.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts    ← Singleton Prisma client
│   │   │   └── upload.ts    ← Multer config for audio uploads
│   │   ├── routes/          ← One file per domain, wires HTTP verb → controller
│   │   └── controllers/     ← Business logic, Prisma queries, response shaping
│   ├── tests/               ← Jest + supertest test suite (130 tests)
│   ├── uploads/recordings/  ← Audio files (gitignored, volume-mounted in Docker)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── jest.config.js
│
└── web/                     ← Next.js frontend (its own git repo)
    ├── src/
    │   ├── app/             ← Next.js App Router pages
    │   │   ├── student/     ← 13 student pages
    │   │   ├── teacher/     ← 11 teacher pages
    │   │   ├── admin/       ← 2 admin pages
    │   │   └── content-manager/ ← Content Manager portal
    │   ├── components/      ← DashboardLayout, Sidebar, TamburaSVG
    │   ├── contexts/        ← AuthContext
    │   └── lib/api.ts       ← All API calls in one file
    ├── next.config.mjs      ← output: standalone, rewrites /api/* → Express
    └── Dockerfile
```

---

## Database Models (Prisma Schema)

```
User (id, email, password, role, status)
 ├── StudentProfile (displayName, level, xp, streak, ragas[])
 │    ├── Enrollment[] → Course
 │    ├── AssignmentSubmission[] → Assignment
 │    └── Attendance[] → Session
 ├── TeacherProfile (displayName, specialization[], hourlyRate, isVerified)
 │    ├── Course[]
 │    ├── Session[]
 │    ├── Assignment[]
 │    ├── Resource[]
 │    └── Earning[]
 ├── Notification[]
 ├── Recording[]
 ├── UserSettings
 └── Post[], Comment[]

Event → EventRegistration[]
```

**Key design choices:**
- `User` holds identity (email/password/role). Profile tables hold domain data — a TEACHER has a `TeacherProfile`, a STUDENT has a `StudentProfile`. This keeps auth separate from domain.
- `Enrollment` is the join between a student and a course. It tracks payment, status, and is the anchor for attendance/assignment queries.
- `Recording.url` stores the relative path to the file on disk (e.g. `/uploads/recordings/abc.webm`). The file itself lives in `uploads/`.
- `Resource.sharedWith` is a `String[]` of student profile IDs — a simple denormalized share list without a join table.

---

## Authentication Flow

```
Browser                        Express API                    PostgreSQL
  │                                │                               │
  │  POST /api/auth/login          │                               │
  │  { email, password }  ────────►│                               │
  │                                │  SELECT user WHERE email=?   │
  │                                │──────────────────────────────►│
  │                                │◄──────────────────────────────│
  │                                │  bcrypt.compare(password)     │
  │                                │  jwt.sign({ id, role })       │
  │◄───────────────────────────────│                               │
  │  Set-Cookie: token=<jwt>       │                               │
  │  { user, token }               │                               │
  │                                │                               │
  │  GET /api/students (cookie)    │                               │
  │──────────────────────────────►│                               │
  │                                │  authenticate middleware:     │
  │                                │  jwt.verify(cookie || Bearer) │
  │                                │  requireRole('TEACHER')       │
  │◄───────────────────────────────│                               │
  │  200 { students: [...] }       │                               │
```

- Token is set as an **httpOnly cookie** (browser) and also returned in JSON (mobile/API clients).
- Every protected route runs `authenticate` then optionally `requireRole('TEACHER', 'ADMIN')`.
- `requireRole` is variadic — `requireRole('ADMIN', 'CONTENT_MANAGER')` allows either role.

---

## Roles

| Role | What They Can Do |
|------|-----------------|
| `STUDENT` | Enroll in courses, view sessions, submit assignments, upload practice recordings, use AI chat, register for events, post in community |
| `TEACHER` | Create/manage courses (→ PENDING_REVIEW), schedule sessions, create assignments, grade submissions, upload resources, view student list, earnings, monthly reports |
| `ADMIN` | All of the above + approve/reject courses, suspend/restore users, verify teachers, view platform stats, manage payments |
| `CONTENT_MANAGER` | Manage events (create/publish/delete), broadcast notifications, pin/delete community posts |
