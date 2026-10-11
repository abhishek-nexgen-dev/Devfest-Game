# GDG Ranchi DevFest 2026 — AI Agent Instructions & Architectural Guidelines

This document provides strict architectural invariants, coding rules, patterns, and workflows for any **AI Assistant or Agent** working on the **GDG Ranchi DevFest 2026 Game Backend**.

---

## 🎯 1. Core System Philosophy

The **DevFest 2026 Game Backend** is a high-performance, deterministic Node.js + TypeScript service that manages:
1. **Admins & Super Admin Authentication** (`users` table)
2. **Challenges & Quizzes** (`games` table)
3. **Attendee Registration & Progress** (`participants` table)
4. **Scoring, Leaderboard & Certificates**

---

## 🚫 2. Strict Architectural Invariants (NEVER VIOLATE)

### 2.1 Pure PostgreSQL (`pg` `Pool`) — No ORMs or Firebase
- **DO NOT** install or introduce Prisma, TypeORM, Sequelize, Mongoose, or any other ORM.
- **DO NOT** use Firebase, Firestore, Google Cloud Storage, or external cloud SDKs.
- All database interactions use the native PostgreSQL driver `pg` via [`src/core/database/postgres.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/core/database/postgres.ts).

### 2.2 Inline Parameterized Queries inside Module `Utils`
- Parameterized SQL statements (`pg.query(...)`) MUST be placed directly inside module `Utils` classes:
  - `src/api/v1/auth/AuthUtils.ts`
  - `src/api/v1/games/Games.Utils.ts`
  - `src/api/v1/participants/Participants.Utils.ts`
- **DO NOT** create separate `.query.ts` files.
- Always use parameterized queries (`$1`, `$2`, ...) to prevent SQL injection.
- When writing `UPDATE` statements with `COALESCE`, provide explicit SQL type casts (e.g., `COALESCE($1::varchar, game_name)`, `COALESCE($6::timestamptz, start_time)`, `WHERE id = $9::bigint`) to avoid PostgreSQL prepared-statement type inference errors.

### 2.3 Error Handling & Standardized Response Envelope
- In controllers and middleware, always use `throw new Error(...)` inside `try / catch` blocks.
- In `catch (error: any)`, extract the message:
  ```typescript
  const message =
    error?.name === "ZodError"
      ? error.errors?.[0]?.message || "Validation failed"
      : error instanceof Error
        ? error.message
        : "Operation failed";
  SendResponse.ErrorResponse(res, error, message);
  ```
- All responses MUST use [`SendResponse`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/utils/SendResponse.ts):
  - **Success (`200 OK`)**:
    ```json
    {
      "success": true,
      "status": true,
      "message": "<Informative message>",
      "data": { ... }
    }
    ```
  - **Error (`500 Internal Server Error`)**:
    ```json
    {
      "success": false,
      "status": false,
      "message": "<Descriptive error message>",
      "error": { ... }
    }
    ```
  *(Note: Both `success` and `status` flags MUST be preserved for client and test suite compatibility).*

### 2.4 Super Admin Single-Instance Guard
- There can only be **strictly 1 `SUPER_ADMIN`** in the entire database.
- `POST /api/v1/init-admin` seeds the Super Admin once. Any subsequent call MUST throw `AuthConstants.MESSAGES.ADMIN_ALREADY_EXISTS`.
- Only `SUPER_ADMIN` can create regular `ADMIN` accounts (`authorizeRoles("SUPER_ADMIN")`).

### 2.5 Schema Dependency Order in `src/core/database/schema.ts`
Because `participants` has a database trigger verifying foreign keys against `games(id)`, the execution order in [`initSchemas()`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/core/database/schema.ts) must always be:
1. `await AuthSchema();`
2. `await Games_Schema();`
3. `await Participants_Schema();`

---

## 🗄️ 3. Database Schema & Triggers Specification

### 3.1 `users` Table
- `id` (`VARCHAR(128) PRIMARY KEY`)
- `name` (`VARCHAR(150) NOT NULL`)
- `email` (`VARCHAR(255) NOT NULL UNIQUE`)
- `password_hash` (`TEXT NOT NULL`)
- `role` (`VARCHAR(32) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN'))`)
- `status` (`VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED'))`)

### 3.2 `games` Table
- `id` (`BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`)
- `game_name` (`VARCHAR(150) NOT NULL UNIQUE`)
- `description` (`TEXT`)
- `max_score` (`INTEGER NOT NULL DEFAULT 100 CHECK (max_score >= 0)`)
- `registrations` (`INTEGER NOT NULL DEFAULT 0 CHECK (registrations >= 0)`)
- `submissions` (`INTEGER NOT NULL DEFAULT 0 CHECK (submissions >= 0)`)
- `start_time` (`TIMESTAMPTZ NOT NULL`)
- `end_time` (`TIMESTAMPTZ NOT NULL`)
- `status` (`VARCHAR(32) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED'))`)
- `CHECK (end_time > start_time)`

### 3.3 `participants` Table
- `id` (`BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`)
- `ticket_id` (`VARCHAR(32) NOT NULL UNIQUE`)
- `name` (`VARCHAR(150) NOT NULL`)
- `email` (`VARCHAR(255) NOT NULL`)
- `mobile_number` (`VARCHAR(20) NOT NULL`)
- `social_link` (`TEXT NOT NULL`)
- `profile_image` (`TEXT`)
- `location` (`VARCHAR(150) NOT NULL`)
- `github_url` (`TEXT`)
- `primary_language` (`TEXT[] NOT NULL` — array of languages)
- `games` (`JSONB NOT NULL DEFAULT '[]'::jsonb` — array of `{ game_id, game_name, is_completed, points }`)
- `total_points` (`INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0)`)
- `is_certificate_claim` (`BOOLEAN NOT NULL DEFAULT FALSE`)

#### Foreign Key, Name Lookup & Synchronization Trigger (`trigger_participants_games_fk`):
- Verifies every `game_id` inside `participants.games` exists in `games(id)`.
- Automatically looks up `game_name` from `games` table by `game_id` and embeds it into each game entry.
- Automatically defaults `is_completed` to `false` and `points` to `0` when participant joins a game.
- Automatically calculates and sets `total_points = SUM(points)` across all entries in `games`.

---

## 🏗️ 4. Standard 8-File Module Pattern

Every domain module under `src/api/v1/<module>/` MUST follow this exact 8-file structure:

```text
src/api/v1/<module>/
├── <Module>.type.ts         # TypeScript interfaces & enums
├── <Module>.Schema.ts       # PostgreSQL DDL table creation, indexes & triggers
├── <Module>.validation.ts   # Zod validation schemas with type coercion
├── <Module>.Utils.ts        # Inlined parameterized SQL query methods
├── <Module>.Service.ts      # Business logic & validations
├── <Module>.Controller.ts   # Express request handlers using SendResponse
├── <Module>.Routes.ts       # Express router mounted in src/routes/routes.ts
└── <Module>Doc.md           # Exhaustive API reference with curl, req & res specs
```

---

## 🍃 5. MongoDB & `mongosh` Environment

MongoDB v8.3.8 and `mongosh` v2.13.0 are installed on the host. When working with MongoDB in this environment:
- **Port / Socket**: `27018` / `/tmp/mongodb-27018.sock`
- **Data Path**: `.mongo_data/` (configured in `.gitignore`)
- **CLI Commands**:
  ```bash
  # Start MongoDB background daemon:
  npm run mongo:start

  # Connect to interactive MongoDB shell:
  npm run mongosh

  # Execute one-off eval query:
  npm run mongosh -- --eval "db.status.find()"

  # Stop MongoDB daemon:
  npm run mongo:stop
  ```

---

## 🧪 6. Testing & Quality Standards

- **TypeScript Verification**: Always run `./node_modules/.bin/tsc` after editing code. Zero compiler errors permitted.
- **Integration Test Execution**:
  ```bash
  # Run all test suites:
  npm test

  # Run Game module tests:
  npm test tests/game.test.ts

  # Run Auth module tests:
  npm test tests/auth.test.ts
  ```
- **In-Memory / Isolated Test Runners**:
  When testing against PostgreSQL in isolated environments, ensure the PostgreSQL process is online (e.g. using `/tmp/.s.PGSQL.5432` or persistent cluster in `.postgres_data/`).
- **Code Style**:
  - Keep docstrings and comments intact.
  - Maintain clickable markdown file links (`[File.ts](file:///absolute/path/to/File.ts)`).
