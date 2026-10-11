# GDG Ranchi DevFest 2026 — Documentation Index

This directory contains the architectural documentation, database schemas, implementation plan, and security guidelines for the **GDG Ranchi DevFest 2026 Participant & Game Management Backend**.

---

## 📚 Documentation Files

1. **[Root Project Reference & Quickstart (`README.md`)](../README.md)**
   - Complete project overview, architecture diagram, 100% security breakdown, API catalog, schema blueprints, and local quickstart guide.

2. **[Detailed System Implementation Plan (`implementation-plan.md`)](./implementation-plan.md)**
   - System overview, main architecture flow, and RBAC (`SUPER_ADMIN`, `ADMIN`, and public participant access)
   - PostgreSQL (`pg` `Pool`) connection lifecycle (`src/core/database/postgres.ts`) supporting both local `DB_*` parameters and remote/Supabase `DATABASE_URL`
   - Global schema initializer (`src/core/database/schema.ts`) executing `AuthSchema()`, `Games_Schema()`, and `Participants_Schema()`
   - Full PostgreSQL table definitions (`users`, `games`, `participants`) and PL/pgSQL triggers (`trigger_participants_games_fk`, `trigger_users_updated_at`, `trigger_games_updated_at`, `trigger_participants_updated_at`)
   - Standardized response pattern (`SendResponse.SuccessResponse` & `SendResponse.ErrorResponse`)
   - Complete API specification, security architecture, and phased development roadmap

3. **[Authentication Module Specification (`AuthDoc.md`)](../src/api/v1/auth/AuthDoc.md)**
   - `SUPER_ADMIN` (limit: 1) and `ADMIN` authentication architecture
   - Endpoints:
     - `POST /api/v1/init-admin`
     - `POST /api/v1/auth/login`
     - `POST /api/v1/add-admin`
     - `GET /api/v1/me`
     - `POST /api/v1/change-password`
     - `GET /api/v1/verify`
     - `POST /api/v1/logout`
   - JWT Bearer & HTTP-only cookie session handling, Zod schemas, brute-force rate limiting (`authLimiter`), and cURL examples

4. **[Participant Module Specification (`ParticipantDoc.md`)](../src/api/v1/participants/ParticipantDoc.md)**
   - Participant registration & lookup (`POST /api/v1/participant/create`, `GET /api/v1/participants/get`, `GET /api/v1/participant/:ticketId`)
   - Anti-bot ticket rate limiting (`participantLimiter`)
   - Public join game via `POST /api/v1/participant/join-game` (takes `email`, `ticket_id`, `game_id` in `req.body`; verifies user by ticket & email, verifies game by `game_id`, auto-populates `game_name`, defaults `Total_game_point: 0`, and defaults `isCompleted: false`)
   - Protected `SUPER_ADMIN` & `ADMIN` participant profile updates via `PUT /api/v1/participant/:ticketId` (direct PostgreSQL parameterized query based on `ticket_id`; games are managed via `/join-game`)
   - Protected `SUPER_ADMIN` & `ADMIN` game score updates via `PATCH /api/v1/participants/update/game-score` (updates `Total_game_point`, `isCompleted`, and auto-recalculates `total_points`)
   - PostgreSQL schema details for `primary_language TEXT[]`, `games JSONB` (`[{ game_id, game_name, Total_game_point, isCompleted }]` with auto-lookup and foreign-key validation to `games.id`), `total_points`, and `is_certificate_claim`
   - Complete request/response JSON examples and cURL commands

5. **[Game Module Specification (`GameDoc.md`)](../src/api/v1/games/GameDoc.md)**
   - Protected `SUPER_ADMIN` & `ADMIN` game creation and updates (`POST /api/v1/game/create`, `PATCH /api/v1/game/:id`, `PATCH /api/v1/games/:id`)
   - Public game listing & lookup (`GET /api/v1/game/get`, `GET /api/v1/game/:id`, `GET /api/v1/game/name/:name`)
   - Game lifecycle endpoints (`PATCH /api/v1/game/:id/activate`, `PATCH /api/v1/game/:id/close`)
   - PostgreSQL `games` schema (`game_name`, `description`, `max_score`, `registrations`, `submissions`, `start_time`, `end_time`, `status`)
   - Request/response JSON examples and cURL commands

6. **[AI Agent Instructions & Architecture Guidelines (`ai-instructions.md`)](./ai-instructions.md)**
   - Strict architectural invariants (no ORMs, pure `pg` queries in `Utils`, `SendResponse`, `SUPER_ADMIN` single-instance rule)
   - Database schema, trigger specifications, and schema initialization order
   - Standard 8-file module pattern for future extensions
   - Defense-in-depth security model: Helmet, Rate Limiting, 100% Parameterized queries, Prototype pollution & null-byte stripping, 1MB payload caps
   - MongoDB and `mongosh` setup, scripts, and commands
   - Testing standards and verification commands
