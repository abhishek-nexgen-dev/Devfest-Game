# Participant & Game Management System — Detailed Implementation Plan

## 1. Overview

This system manages **Admin & Super Admin authentication, participants, games, game participation (`games` array with `game_id`, `is_completed`, `points`), total points, certificates (`is_certificate_claim`), and the leaderboard** for **GDG Ranchi DevFest 2026**.

### Core Architecture Principles

1. **Authenticated Administrative Roles (`users` table)**:
   - **`SUPER_ADMIN`** (Strictly **1** account allowed in the system, initialized via `POST /api/v1/init-admin`)
   - **`ADMIN`** (Event Organizers created by `SUPER_ADMIN` via `POST /api/v1/add-admin`)
2. **Public Participant Flow (`participants` table)**:
   - Participants register publicly via `POST /api/v1/participants` using their unique `ticket_id`, personal details, and an array of programming/tech languages (`primary_language TEXT[]`).
   - No password or login is required for participants to register, view data, or **join games**.
   - Public attendees can **join games** via `POST /api/v1/participants/join-game` (or `POST / PUT / PATCH /api/v1/participants/:ticketId`) by providing flat body `{ email, ticket_id, game_id }` or `{ email, ticket_id, games: [{ game_id }] }` (backend auto-looks up `game_name` by `game_id`, `isCompleted` / `is_completed` defaults to `false`, and `point` / `points` defaults to `0`).
   - Administrative profile edits, manual score adjustments, and certificate claim overrides remain strictly protected for **`SUPER_ADMIN`** and **`ADMIN`** accounts.
3. **Database Engine**:
   - **PostgreSQL** via the native `pg` (`Pool`) package in `src/core/database/postgres.ts`.
   - Direct parameterized SQL queries (`pg.query(...)`) inside module `Utils` classes (`AuthUtils.ts`, `Participants.Utils.ts`, `Games.Utils.ts`) — **no ORM/Prisma, no Firebase/Firestore**.
4. **Standardized Response & Error Handling**:
   - All controllers use `throw new Error(...)` inside `try / catch` blocks and return responses through `SendResponse.SuccessResponse(res, data, message)` (`200 OK`) and `SendResponse.ErrorResponse(res, error, message)` (`500`).

---

# 2. Main System Flow

```text
                        GDG Ranchi DevFest 2026 Game System
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               │                                                   │
     SUPER ADMIN & ADMIN                                 PUBLIC / PARTICIPANT
   (Authenticated via JWT)                               (No Auth Required)
               │                                                   │
  • POST /api/v1/init-admin (1 Super Admin)         • POST /api/v1/participants
  • POST /api/v1/auth/login                         • GET  /api/v1/participants
  • POST /api/v1/add-admin (Super Admin only)       • GET  /api/v1/participants/:ticketId
  • Create, Edit, Activate & Close Games            • GET  /api/v1/games
  • Update Participant Profile & Games Array        • GET  /api/v1/games/:id
    [{ game_id, is_completed, points }]             • GET  /api/v1/leaderboard
  • Auto-Calculate Participant total_points
  • Update is_certificate_claim
               │                                                   │
               └─────────────────────────┬─────────────────────────┘
                                         │
                                  PostgreSQL (pg)
                         ┌───────────────┼───────────────┐
                         ↓               ↓               ↓
                       users           games        participants
```

---

# 3. Roles & Permissions (RBAC)

## 3.1 `SUPER_ADMIN` (Strictly 1 Allowed)

The `SUPER_ADMIN` has complete control over the DevFest 2026 game management system.

### Super Admin Capabilities:

- Initialize the single Super Admin account once via `POST /api/v1/init-admin` (subsequent calls throw `"Only one Super Admin is allowed. Super Admin account already exists."`)
- Login via `POST /api/v1/auth/login`
- Create `ADMIN` accounts via `POST /api/v1/add-admin` (`name`, `email`, `password`)
- Change password (`POST /api/v1/change-password`), view own profile (`GET /api/v1/me`), verify session (`GET /api/v1/verify`), and logout (`POST /api/v1/logout`)
- View, search, and update all participants (`PUT / PATCH /api/v1/participants/:ticketId`)
- Create, edit, activate (`ACTIVE`), and close (`CLOSED`) games
- Assign games to participants and update `games` (`[{ game_id, is_completed, points }]`), `total_points`, and `is_certificate_claim`
- View real-time leaderboard and announce Top 3 winners

---

## 3.2 `ADMIN` (Event Organizers)

`ADMIN` accounts are created exclusively by the `SUPER_ADMIN`.

### Admin Capabilities:

- Login via `POST /api/v1/auth/login`
- View and update participants (`PUT / PATCH /api/v1/participants/:ticketId`)
- Update participant `games` array (`game_id`, `is_completed`, `points`), `total_points`, and `is_certificate_claim`
- Create and manage games
- View leaderboard and game statistics

### Admin Restrictions:

- **Cannot** call `POST /api/v1/add-admin` (enforced by `authorizeRoles("SUPER_ADMIN")`)
- **Cannot** initialize or overwrite the `SUPER_ADMIN` account

---

# 4. Participant (Public Access)

Participants interact with the public registration and lookup endpoints without needing an authentication token.

### Participant / Public Capabilities:

- Register their participant profile via `POST /api/v1/participants` with `ticket_id` and `primary_language` array
- View all registered participants via `GET /api/v1/participants`
- View their individual profile, game history (`games` array), `total_points`, and certificate status (`is_certificate_claim`) via `GET /api/v1/participants/:ticketId`
- **Join games** via `POST /api/v1/participants/join-game` (or `POST / PUT / PATCH /api/v1/participants/:ticketId`) by providing flat body `{ email, ticket_id, game_id }` or `{ email, ticket_id, games: [{ game_id }] }` (backend auto-looks up `game_name` by `game_id`, `isCompleted` / `is_completed` defaults to `false`, and `point` / `points` defaults to `0`)
- View available games and leaderboard rankings

### Participant Restrictions (Unauthenticated / Public Users Cannot):

- Modify other attendees' profiles or join games using a mismatched email address
- Arbitrarily award points or claim certificates (restricted to `SUPER_ADMIN` and `ADMIN`)
- Alter attendee `name`, `mobile_number`, `location`, or `primary_language` via the public join endpoint
- Create, edit, or close games
- Create admin accounts

---

# 5. Participant Registration

Anyone can register a new participant through the public registration endpoint (`POST /api/v1/participants`).

### Registration Fields (`createParticipantValidator`)

```text
ticket_id *          (Unique DevFest Ticket ID, e.g., "GDG26-0001", max 32 chars)
name *               (Full Name, 2–150 chars)
email *              (Valid Email Address, normalized to lowercase)
mobile_number *      (Mobile Number, 10–20 chars)
social_link *        (LinkedIn / X / Portfolio URL)
profile_image        (Optional Avatar URL)
location *           (City / Location, 1–150 chars)
github_url           (Optional GitHub Profile URL)
primary_language *   (Non-empty Array of Programming/Tech Languages, e.g., ["TypeScript", "Python", "Go"])
games                (Optional JSONB Array of { game_id, is_completed, points }, defaults to [])
total_points         (Optional Integer >= 0, defaults to 0)
is_certificate_claim (Optional Boolean, defaults to false)
```

### Registration Flow

```text
Public Registration Form
           ↓
POST /api/v1/participants
           ↓
Zod Validation (createParticipantValidator)
           ↓
Check Duplicate ticket_id (FIND_PARTICIPANT_BY_TICKET_ID)
           ↓
PostgreSQL Trigger Validates games[] Foreign Keys & Calculates total_points
           ↓
Insert into participants Table (CREATE_PARTICIPANT)
           ↓
Return 200 OK via SendResponse.SuccessResponse
```

---

# 6. Ticket ID (`ticket_id`) & Identity Key (`id`)

Every participant record in PostgreSQL has two identifiers:

1. **`id` (`BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`)**:
   - Auto-incrementing internal primary key generated by PostgreSQL (`1`, `2`, `3`, ...).
2. **`ticket_id` (`VARCHAR(32) NOT NULL UNIQUE`)**:
   - Unique event ticket identifier used in public and admin API routes (`/api/v1/participants/:ticketId`).

Example:

```text
id: 1
ticket_id: GDG26-0001
name: Abhishek Kumar
email: abhishek@example.com
primary_language: ["TypeScript", "Node.js", "Python"]
```

---

# 7. Admin Account Status (`users.status`)

Admin accounts in the `users` table use a `status` constraint:

```text
ACTIVE
DISABLED
```

- **`ACTIVE`**: Admin/Super Admin can log in (`POST /api/v1/auth/login`) and pass session verification (`GET /api/v1/verify`).
- **`DISABLED`**: Login and session verification throw an error (`AuthConstants.MESSAGES.ACCOUNT_DISABLED` / `TOKEN_EXPIRED`).

---

# 8. Participant Profile & Game Progress Structure

When querying `GET /api/v1/participants/:ticketId`, the participant record includes their complete profile, tech stack array, played games array, total points, and certificate claim status:

```json
{
  "id": "1",
  "ticket_id": "GDG26-0001",
  "name": "Abhishek Kumar",
  "email": "abhishek@example.com",
  "mobile_number": "9876543210",
  "social_link": "https://linkedin.com/in/abhishek",
  "profile_image": "https://example.com/avatar.png",
  "location": "Ranchi",
  "github_url": "https://github.com/abhishek",
  "primary_language": ["TypeScript", "Node.js", "Python"],
  "games": [
    {
      "game_id": 1,
      "is_completed": true,
      "points": 85
    },
    {
      "game_id": 2,
      "is_completed": false,
      "points": 0
    }
  ],
  "total_points": 85,
  "is_certificate_claim": false,
  "created_at": "2026-10-08T04:30:00.000Z",
  "updated_at": "2026-10-08T04:35:00.000Z"
}
```

---

# 9. Games (`games` Table)

`SUPER_ADMIN` and `ADMIN` create and manage DevFest games.

### Game Fields (`Games.Schema.ts`)

```text
id              (BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY)
game_name       (VARCHAR(150) NOT NULL UNIQUE)
description     (TEXT)
max_score       (INTEGER NOT NULL DEFAULT 100 CHECK (max_score >= 0))
registrations   (INTEGER NOT NULL DEFAULT 0 CHECK (registrations >= 0))
submissions     (INTEGER NOT NULL DEFAULT 0 CHECK (submissions >= 0))
start_time      (TIMESTAMPTZ NOT NULL)
end_time        (TIMESTAMPTZ NOT NULL, CHECK (end_time > start_time))
status          (VARCHAR(32) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED')))
created_at      (TIMESTAMPTZ NOT NULL DEFAULT NOW())
updated_at      (TIMESTAMPTZ NOT NULL DEFAULT NOW())
```

Example:

```text
id: 1
game_name: Tech Quiz
description: Test your knowledge of technology and programming.
max_score: 100
registrations: 450
submissions: 430
start_time: 2026-10-10T10:00:00.000Z
end_time: 2026-10-10T11:00:00.000Z
status: ACTIVE
```

---

# 10. Game Status Lifecycle

Every game in `games` has a `status` enforced by `CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED'))`:

```text
UPCOMING  ──►  ACTIVE  ──►  CLOSED
```

- **`UPCOMING`**: Game is scheduled but has not started yet.
- **`ACTIVE`**: Game is live; participants can play and admins can record completions and points.
- **`CLOSED`**: Game has ended; final submissions and scores are locked.

---

# 11. Participant `games` Array & Foreign Key Enforcement

Instead of splitting participant game progress across multiple join tables, each participant row in `participants` stores a `games` `JSONB` array where each item contains:

```typescript
export interface IParticipantGameItem {
  game_id: number;       // Foreign Key referencing games(id)
  game_name?: string;    // Official game title automatically resolved from games table
  isCompleted?: boolean; // Completion flag (defaults to false)
  is_completed?: boolean;// Dual snake_case alias for seamless API compatibility
  point?: number;        // Points earned (defaults to 0 on join)
  points?: number;       // Dual snake_case alias for seamless API compatibility
}
```

### Database-Level Foreign Key, Name Lookup & Points Trigger (`validate_and_sync_participant_games`)

In `src/api/v1/participants/Participants.Schema.ts`, a PL/pgSQL `BEFORE INSERT OR UPDATE` trigger (`trigger_participants_games_fk`) runs automatically on every write to `participants`:

1. **JSON Array Check**: Ensures `NEW.games` is a valid JSON array (defaults `NULL` to `'[]'::jsonb`).
2. **Foreign Key Validation (`game_id` $\rightarrow$ `games.id`)**:
   - Loops through every element in `NEW.games`.
   - Verifies `SELECT game_name INTO v_game_name FROM games WHERE id = v_game_id`.
   - If any `game_id` does not exist in the `games` table, PostgreSQL aborts the query with:
     `Foreign key violation: game_id <id> does not exist in games`.
3. **Automatic `game_name` Injection**: Automatically injects official `game_name` into the stored JSON object.
4. **Default Status & Score**: Defaults `isCompleted` / `is_completed` to `false` and `point` / `points` to `0`.
5. **Automatic `total_points` Synchronization**:
   - Sums points across all elements in `NEW.games`.
   - Automatically sets `NEW.total_points = v_calculated_points`.

---

# 12. Score & Points Management (Admin Only)

Only `SUPER_ADMIN` and `ADMIN` can update a participant's game progress, points, and certificate claim status via `PUT / PATCH /api/v1/participants/:ticketId`.

### Example Admin Update Request

```http
PATCH /api/v1/participants/GDG26-0001
Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>
Content-Type: application/json

{
  "games": [
    {
      "game_id": 1,
      "is_completed": true,
      "points": 85
    },
    {
      "game_id": 2,
      "is_completed": true,
      "points": 70
    }
  ],
  "is_certificate_claim": true
}
```

### Result After PostgreSQL Trigger Execution

- Both `game_id: 1` and `game_id: 2` are verified against `games(id)`.
- `total_points` is automatically computed as $85 + 70 = 155$.
- `is_certificate_claim` is updated to `true`.
- `updated_at` is automatically updated to `NOW()`.

---

# 13. Certificate Claim Tracking (`is_certificate_claim`)

Each participant has a boolean column `is_certificate_claim BOOLEAN NOT NULL DEFAULT FALSE`:

- Defaults to `false` when the participant registers.
- Updated to `true` by `SUPER_ADMIN` or `ADMIN` once the participant qualifies for or claims their DevFest 2026 certificate.

---

# 14. Leaderboard & Ranking Calculation

Participants are ranked by `total_points DESC` (indexed via `idx_participants_total_points ON participants (total_points DESC)`).

### Total Points Formula

$$\text{total\_points} = \sum_{i=1}^{n} \text{games}[i].\text{points}$$

### Tie-Breaker Order

1. **Higher `total_points`** (`ORDER BY total_points DESC`)
2. **More Completed Games** (count of items in `games` where `is_completed = true`)
3. **Earlier Registration / Update Timestamp** (`created_at ASC`)

---

# 15. PostgreSQL Database Tables & DDL Reference

Defined in `src/constants/collections.ts`:

```typescript
export const COLLECTIONS = {
  USERS: "users",
  PARTICIPANTS: "participants",
  GAMES: "games",
  CERTIFICATES: "certificates",
  ACTIVITY_LOGS: "activityLogs",
} as const;
```

## 15.1 `users` Table (`src/api/v1/auth/Auth.schema.ts`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL
    CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
```

## 15.2 `games` Table (`src/api/v1/games/Games.Schema.ts`)

```sql
CREATE TABLE IF NOT EXISTS games (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 100
    CHECK (max_score >= 0),
  registrations INTEGER NOT NULL DEFAULT 0
    CHECK (registrations >= 0),
  submissions INTEGER NOT NULL DEFAULT 0
    CHECK (submissions >= 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'UPCOMING'
    CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_games_status ON games (status);
CREATE INDEX IF NOT EXISTS idx_games_game_name ON games (game_name);
```

## 15.3 `participants` Table (`src/api/v1/participants/Participants.Schema.ts`)

```sql
CREATE TABLE IF NOT EXISTS participants (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  social_link TEXT NOT NULL,
  profile_image TEXT,
  location VARCHAR(150) NOT NULL,
  github_url TEXT,
  primary_language TEXT[] NOT NULL,
  games JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_points INTEGER NOT NULL DEFAULT 0
    CHECK (total_points >= 0),
  is_certificate_claim BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_ticket_id ON participants (ticket_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants (email);
CREATE INDEX IF NOT EXISTS idx_participants_mobile_number ON participants (mobile_number);
CREATE INDEX IF NOT EXISTS idx_participants_total_points ON participants (total_points DESC);
```

---

# 16. Database Relationships

```text
┌─────────────────────────────────────────┐
│                  users                  │
│  id (PK), name, email, password_hash,   │
│  role ('SUPER_ADMIN' | 'ADMIN'), status │
└─────────────────────────────────────────┘
         (Manages via Admin JWT)
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌───────────────────┐   ┌───────────────────────────────────────────────────┐
│       games       │   │                   participants                    │
│                   │   │                                                   │
│ id (BIGINT PK) ◄──┼───┼── games: JSONB Array                              │
│ game_name         │   │     [{ game_id (FK -> games.id),                  │
│ description       │   │        is_completed: boolean,                     │
│ max_score         │   │        points: number }]                          │
│ registrations     │   │                                                   │
│ submissions       │   │ id (BIGINT PK), ticket_id (UNIQUE),               │
│ start_time        │   │ name, email, mobile_number, social_link,          │
│ end_time          │   │ profile_image, location, github_url,              │
│ status            │   │ primary_language (TEXT[]),                        │
└───────────────────┘   │ total_points, is_certificate_claim                │
                        └───────────────────────────────────────────────────┘
```

---

# 17. Backend Architecture & Code Organization

### Technology Stack

- **Runtime**: Node.js + TypeScript (`tsx watch src/server.ts` in development, `tsc` for production build)
- **Framework**: Express.js (`helmet`, `cors`, `cookie-parser`, `morgan`, `express-rate-limit`)
- **Database Driver**: `pg` (`Pool` & `Client` in `src/core/database/postgres.ts`)
- **Validation**: `zod` (`Auth.validation.ts`, `Participants.validation.ts`, `env.constant.ts`)
- **Authentication**: `jsonwebtoken` (JWT in `Authorization: Bearer <token>` or HTTP-only `token` cookie) + `bcryptjs`
- **Response Utility**: `src/utils/SendResponse.ts`
- **Package Manager**: `pnpm`

### Codebase Directory Structure

```text
src/
├── api/
│   └── v1/
│       ├── auth/
│       │   ├── Auth.type.ts           # AuthRole, IUserDoc, ISanitizedUser, IAuthTokenPayload
│       │   ├── Auth.schema.ts         # AuthSchema() -> creates users table & trigger
│       │   ├── Auth.validation.ts     # addAdminValidator, loginValidator, changePasswordValidator
│       │   ├── AuthUtils.ts           # Direct pg.query methods + bcrypt & JWT helpers
│       │   ├── Auth.Service.ts        # initSuperAdmin, login, addAdmin, getCurrentUser, changePassword, verifySession
│       │   ├── Auth.controller.ts     # Express handlers using throw new Error + SendResponse
│       │   ├── Auth.router.ts         # /init-admin, /auth/login, /add-admin, /me, /change-password, /verify, /logout
│       │   ├── auth.constants.ts      # AuthConstants (ROLES, USER_STATUS, MESSAGES, COOKIE_OPTIONS)
│       │   └── AuthDoc.md             # Complete Auth API documentation
│       │
│       ├── participants/
│       │   ├── Participants.type.ts       # IParticipantGameItem, IParticipantDoc
│       │   ├── Participants.Schema.ts     # Participants_Schema() -> creates participants table & FK trigger
│       │   ├── Participants.validation.ts # createParticipantValidator, updateParticipantValidator
│       │   ├── Participants.Utils.ts      # FIND_ALL_PARTICIPANT, FIND_PARTICIPANT_BY_TICKET_ID, CREATE_PARTICIPANT, UPDATE_PARTICIPANT_BY_TICKET_ID
│       │   ├── Participants.Service.ts    # createParticipant, getAllParticipants, getParticipantByTicketId, updateParticipant
│       │   ├── Participants.controller.ts # Express handlers using throw new Error + SendResponse
│       │   ├── Participant.routes.ts      # Public POST/GET /participants, Public Join & Admin PUT/PATCH/POST /participants/:ticketId
│       │   ├── participant.constants.ts   # ParticipantConstants
│       │   └── ParticipantDoc.md          # Complete Participant API documentation
│       │
│       ├── games/
│       │   ├── Games.Schema.ts        # Games_Schema() -> creates games table & trigger
│       │   └── game.constants.ts      # GameConstants (GAME_STATUS, MESSAGES, ROUTES)
│       │
│       ├── leaderboard/
│       │   └── leaderboard.constants.ts
│       ├── certificates/
│       │   └── certificate.constants.ts
│       └── activity/
│           └── activity.constants.ts
│
├── constants/
│   ├── collections.ts                 # Table names (users, participants, games, certificates, activityLogs)
│   ├── env.constant.ts                # Zod-validated environment config (PORT, DATABASE_URL, DB_*, JWT_*, INITIAL_ADMIN_*)
│   └── error.constant.ts              # Centralized ErrorMessages
│
├── core/
│   ├── database/
│   │   ├── postgres.ts                # pg.Pool + connectDatabase() (supports Local DB_* and Supabase DATABASE_URL)
│   │   └── schema.ts                  # initSchemas() -> runs AuthSchema(), Games_Schema(), Participants_Schema()
│   └── logger/
│       └── logger.ts                  # Structured console logger
│
├── middleware/
│   └── auth.middleware.ts             # authenticate, optionalAuth, authorizeRoles(...roles)
│
├── routes/
│   └── routes.ts                      # Main /api/v1 router mounting authRouter, ParticipantRoutes, /docs
│
├── utils/
│   └── SendResponse.ts                # Standardized SuccessResponse (200) & ErrorResponse (500)
│
├── app.ts                             # Express application setup, security middleware, /health, error handler
└── server.ts                          # Entry point: connectDatabase() -> initSchemas() -> app.listen()
```

---

# 18. Coding Conventions & Patterns Used Across All Modules

## 18.1 Standardized Response Class (`src/utils/SendResponse.ts`)

Every controller and middleware uses `SendResponse`:

```typescript
import type { Response } from "express";

class SendResponse {
  static SuccessResponse(res: Response, data: unknown, message: string) {
    res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  static ErrorResponse(res: Response, error: unknown, message: string) {
    res.status(500).json({
      success: false,
      message,
      error,
    });
  }
}

export default SendResponse;
```

## 18.2 Controller Error Handling Pattern

Controllers never write inline `res.status(4xx).json(...)` for guard checks. Instead:

- Guard checks inside `try` blocks always `throw new Error(...)`.
- Successful operations return via `SendResponse.SuccessResponse(res, result, message)`.
- All thrown errors (including Zod validation errors and service errors) are caught in `catch (error: any)` and returned via `SendResponse.ErrorResponse(res, error, message)`.

## 18.3 Direct `pg.query` in Module `Utils` Classes

SQL queries are written directly inside each module's `Utils` class (`AuthUtils.ts`, `Participants.Utils.ts`) using parameterized placeholders (`$1, $2, ...`) — no separate `.query.ts` files.

---

# 19. Complete API Specification (`Base Prefix: /api/v1`)

## 19.1 Authentication Endpoints (`src/api/v1/auth/`)

| Method | Path                      | Access        | Description                                                       |
| :----- | :------------------------ | :------------ | :---------------------------------------------------------------- |
| `POST` | `/api/v1/init-admin`      | Public        | Seeds the 1 `SUPER_ADMIN` from `.env`; throws error if one exists |
| `POST` | `/api/v1/auth/login`      | Public        | Authenticates `SUPER_ADMIN` or `ADMIN`, sets cookie & returns JWT |
| `POST` | `/api/v1/add-admin`       | `SUPER_ADMIN` | Creates a new `ADMIN` account (`name`, `email`, `password`)       |
| `GET`  | `/api/v1/me`              | Protected     | Returns the authenticated `SUPER_ADMIN` or `ADMIN` profile        |
| `POST` | `/api/v1/change-password` | Protected     | Updates password for the authenticated `SUPER_ADMIN` or `ADMIN`   |
| `GET`  | `/api/v1/verify`          | Protected     | Verifies JWT token validity and `ACTIVE` user status              |
| `POST` | `/api/v1/logout`          | Public        | Clears the `token` HTTP-only cookie                               |

## 19.2 Participant Endpoints (`src/api/v1/participants/`)

| Method          | Path                             | Access                  | Description                                                                        |
| :-------------- | :------------------------------- | :---------------------- | :--------------------------------------------------------------------------------- |
| `POST`          | `/api/v1/participants`           | Public (Anyone)         | Registers a new participant (`ticket_id`, `primary_language: string[]`, etc.)      |
| `GET`           | `/api/v1/participants`           | Public                  | Lists all participants ordered by `created_at DESC`                                |
| `GET`           | `/api/v1/participants/:ticketId` | Public                  | Fetches a single participant by `ticket_id`                                        |
| `PUT` / `PATCH` | `/api/v1/participants/:ticketId` | `SUPER_ADMIN` & `ADMIN` | Updates participant profile, `games` array, `total_points`, `is_certificate_claim` |

## 19.3 Games Endpoints (`src/api/v1/games/` — Completed ✅)

| Method          | Path                             | Access                  | Description                                                                   |
| :-------------- | :------------------------------- | :---------------------- | :---------------------------------------------------------------------------- |
| `POST`          | `/api/v1/game/create`            | `SUPER_ADMIN` & `ADMIN` | Creates a new game (`game_name`, `max_score`, `start_time`, `end_time`, etc.) |
| `GET`           | `/api/v1/game/get`               | Public                  | Lists all games ordered by `created_at DESC`                                  |
| `GET`           | `/api/v1/game/:id`               | Public                  | Fetches a single game by `id`                                                 |
| `GET`           | `/api/v1/game/name/:name`        | Public                  | Fetches a single game by `game_name`                                          |
| `PATCH` / `PUT` | `/api/v1/game/:id`               | `SUPER_ADMIN` & `ADMIN` | Updates game details, `status` (`UPCOMING`, `ACTIVE`, `CLOSED`), counters     |
| `PATCH`         | `/api/v1/game/:id/activate`      | `SUPER_ADMIN` & `ADMIN` | Activates a game (sets status to `ACTIVE`)                                    |
| `PATCH`         | `/api/v1/game/:id/close`         | `SUPER_ADMIN` & `ADMIN` | Closes a game (sets status to `CLOSED`)                                       |

## 19.4 Leaderboard Endpoints (Planned / Next Phase)

| Method | Path                  | Access | Description                                        |
| :----- | :-------------------- | :----- | :------------------------------------------------- |
| `GET`  | `/api/v1/leaderboard` | Public | Returns participants ranked by `total_points DESC` |

---

# 20. Environment Configuration (`.env`)

The backend supports both **Local PostgreSQL** and **Supabase / Remote PostgreSQL** via `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=*

# Option 1: Remote / Supabase PostgreSQL Connection URL (Uncomment to use Supabase)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.mdscondvnaggskmyluqg.supabase.co:5432/postgres

# Option 2: Local PostgreSQL Database Configuration (pg) — Active when DATABASE_URL is commented out
DB_USER=postgres
DB_HOST=localhost
DB_NAME=devfest_game_db
DB_PASSWORD=postgres
DB_PORT=5432

# JWT Authentication
JWT_SECRET=devfest_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# Initial Super Admin Seed Credentials
INITIAL_ADMIN_EMAIL=admin@gdgranchi.in
INITIAL_ADMIN_PASSWORD=AdminPass@2026
INITIAL_ADMIN_NAME=GDG Ranchi Super Admin
```

---

# 21. Development Phases & Status Checklist

## Phase 1 — Database & Core Setup (Completed ✅)

- [x] Remove Firebase/Firestore completely and configure native `pg` (`Pool`) in `src/core/database/postgres.ts`
- [x] Support both local `DB_*` config (with auto-creation of `devfest_game_db` on `3D000`) and remote `DATABASE_URL` (with SSL)
- [x] Create global schema initializer `src/core/database/schema.ts` (`initSchemas`)
- [x] Create standardized `SendResponse` utility (`src/utils/SendResponse.ts`)

## Phase 2 — Admin & Super Admin Authentication (Completed ✅)

- [x] Create `users` table schema (`src/api/v1/auth/Auth.schema.ts`) for `SUPER_ADMIN` and `ADMIN`
- [x] Inline parameterized `pg.query` calls inside `src/api/v1/auth/AuthUtils.ts`
- [x] Enforce single `SUPER_ADMIN` in `POST /api/v1/init-admin` (throws error if already exists)
- [x] Implement `POST /api/v1/add-admin` restricted to `SUPER_ADMIN`
- [x] Implement `POST /api/v1/auth/login`, `GET /api/v1/me`, `POST /api/v1/change-password`, `GET /api/v1/verify`, `POST /api/v1/logout`
- [x] Document Auth API in `src/api/v1/auth/AuthDoc.md` and verify with `tests/auth.test.ts`

## Phase 3 — Participants Module (Completed ✅)

- [x] Create `participants` table schema (`src/api/v1/participants/Participants.Schema.ts`) with:
  - `ticket_id VARCHAR(32) NOT NULL UNIQUE`
  - `primary_language TEXT[] NOT NULL` (array of programming/tech languages)
  - `games JSONB NOT NULL DEFAULT '[]'::jsonb` (`[{ game_id, is_completed, points }]`)
  - `total_points INTEGER NOT NULL DEFAULT 0`
  - `is_certificate_claim BOOLEAN NOT NULL DEFAULT FALSE`
  - PL/pgSQL trigger `trigger_participants_games_fk` validating `game_id` foreign key against `games(id)` and auto-summing `total_points`
- [x] Implement `Participants.type.ts`, `Participants.validation.ts`, `Participants.Utils.ts`, `Participants.Service.ts`, `Participants.controller.ts`, and `Participant.routes.ts`
- [x] Public `POST /api/v1/participants`, `GET /api/v1/participants`, `GET /api/v1/participants/:ticketId`
- [x] `SUPER_ADMIN` & `ADMIN` protected `PUT / PATCH /api/v1/participants/:ticketId`
- [x] Document Participant API in `src/api/v1/participants/ParticipantDoc.md`

## Phase 4 — Games Schema & Module (Completed ✅)

- [x] Create `games` table schema (`src/api/v1/games/Games.Schema.ts`) with `game_name`, `description`, `max_score`, `registrations`, `submissions`, `start_time`, `end_time`, `status`, indexes, and `updated_at` trigger
- [x] Register `Games_Schema()` before `Participants_Schema()` in `src/core/database/schema.ts`
- [x] Implement `Game.Type.ts`, `Games.validation.ts`, `Games.Utils.ts`, `Game.Service.ts`, `Games.Controller.ts`, `Games.Routes.ts`, and `GameDoc.md`
- [x] Implement all 7 game endpoints and lifecycle transitions (`activateGame`, `closeGame`, name lookup)
- [x] Verify complete test suite with 21 unit & PostgreSQL integration tests (`tests/game.test.ts`)

## Phase 5 — System Security & Hardening (Completed ✅)

- [x] Configure advanced **Helmet** security headers (strict CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, disable X-Powered-By)
- [x] Build multi-tier rate limiting engine (`src/middleware/rateLimiter.ts`):
  - `apiLimiter`: 300 requests / 15m globally on `/api/v1` against DoS/scraping
  - `authLimiter`: 10 requests / 15m on sensitive auth routes against brute force & credential stuffing
  - `participantLimiter`: 30 requests / 15m on public participant registration against ticket flooding
- [x] Audit and guarantee 100% SQL injection immunity:
  - All SQL queries across `AuthUtils.ts`, `Games.Utils.ts`, and `Participants.Utils.ts` use native PostgreSQL parameterized queries (`$1`, `$2`, ...)
  - Protocol-level parameter separation prevents SQL concatenation
  - Explicit PostgreSQL type casting (`$1::varchar`, `$6::timestamptz`, `$8::text[]`, `$9::jsonb`, `$9::bigint`)
- [x] Build security input sanitization middleware (`src/middleware/security.middleware.ts`) stripping prototype pollution keys (`__proto__`, `constructor`, `prototype`) and null bytes (`\0`)
- [x] Enforce 1MB request body payload limit rejecting memory exhaustion DoS attacks with HTTP 413
- [x] Verify complete security test suite with 12 automated penetration tests (`tests/security.test.ts`)

## Phase 6 — Leaderboard & Certificates (Pending ⏳)

- [ ] Implement Leaderboard endpoint (`GET /api/v1/leaderboard`) querying `participants` ordered by `total_points DESC`
- [ ] Implement Certificate verification/claim endpoints (`POST /api/v1/participants/:ticketId/claim-certificate`)

