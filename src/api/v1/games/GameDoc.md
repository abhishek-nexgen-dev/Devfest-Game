# GDG Ranchi DevFest 2026 — Game Module Specification

Comprehensive architectural and API reference for the **Game Management** subsystem powering the **GDG Ranchi DevFest 2026 Game Backend**.

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Access Control & Permissions](#2-access-control--permissions)
3. [PostgreSQL Database & Schema](#3-postgresql-database--schema)
4. [Validation Rules (`Games.validation.ts`)](#4-validation-rules-gamesvalidationts)
5. [Standardized Response Format (`SendResponse`)](#5-standardized-response-format-sendresponse)
6. [API Endpoints Reference](#6-api-endpoints-reference)
   - [1. POST /api/v1/game/create](#1-post-apiv1gamecreate)
   - [2. GET /api/v1/game/get](#2-get-apiv1gameget)
   - [3. GET /api/v1/game/:id](#3-get-apiv1gameid)
   - [4. GET /api/v1/game/name/:name](#4-get-apiv1gamenamename)
   - [5. PATCH / PUT /api/v1/game/:id](#5-patch--put-apiv1gameid)
   - [6. PATCH /api/v1/game/:id/activate](#6-patch-apiv1gameidactivate)
   - [7. PATCH /api/v1/game/:id/close](#7-patch-apiv1gameidclose)
7. [Error Messages & Constants](#7-error-messages--constants)

---

## 1. Overview & Architecture

The Game module manages DevFest challenges, quizzes, and coding activities. It stores each game's name (`game_name`), `description`, `max_score`, `registrations`, `submissions`, `start_time`, `end_time`, and `status` (`UPCOMING`, `ACTIVE`, `CLOSED`).

Every game's primary key (`games.id`) is also referenced as a foreign key by the `participants.games` JSONB array via the database-level `trigger_participants_games_fk` trigger.

### Directory Structure

```text
src/api/v1/games/
├── Game.Type.ts           # GameStatus enum & GameType interface
├── Games.Schema.ts        # PostgreSQL DDL for `games` table, indexes & updated_at trigger
├── Games.validation.ts    # Zod validation schemas for create & update
├── Games.Utils.ts         # Direct parameterized SQL queries with explicit type casts
├── Game.Service.ts        # Game business logic (create, update, activate, close, lookups)
├── Games.Controller.ts    # Express controller using throw new Error + SendResponse
├── Games.Routes.ts        # Express router with RBAC protection and route aliases
├── game.constants.ts      # Centralized messages, statuses, and constants
└── GameDoc.md             # Game module API specification
```

---

## 2. Access Control & Permissions

| Operation              | Endpoint                                                    | Method | Access Level                                 |
| :--------------------- | :---------------------------------------------------------- | :----- | :------------------------------------------- |
| **Create New Game**    | `/api/v1/game/create` *(alias: `/api/v1/games`, `/api/v1/games/create`)* | `POST` | **Protected** (`SUPER_ADMIN` & `ADMIN` only) |
| **Fetch All Games**    | `/api/v1/game/get` *(alias: `/api/v1/games`, `/api/v1/games/get`)*       | `GET`  | **Public** (Anyone — no token required)      |
| **Fetch Game by `id`** | `/api/v1/game/:id` *(alias: `/api/v1/games/:id`, `/api/v1/game/get/:id`)*| `GET`  | **Public** (Anyone — no token required)      |
| **Fetch Game by Name** | `/api/v1/game/name/:name` *(alias: `/api/v1/games/name/:name`)*          | `GET`  | **Public** (Anyone — no token required)      |
| **Update Game by `id`**| `/api/v1/game/:id` *(alias: `/api/v1/games/:id`)*                        | `PATCH` / `PUT` | **Protected** (`SUPER_ADMIN` & `ADMIN` only) |
| **Activate Game**      | `/api/v1/game/:id/activate` *(alias: `/api/v1/games/:id/activate`)*      | `PATCH` | **Protected** (`SUPER_ADMIN` & `ADMIN` only) |
| **Close Game**         | `/api/v1/game/:id/close` *(alias: `/api/v1/games/:id/close`)*            | `PATCH` | **Protected** (`SUPER_ADMIN` & `ADMIN` only) |

---

## 3. PostgreSQL Database & Schema

Defined in [`src/api/v1/games/Games.Schema.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/games/Games.Schema.ts):

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

---

## 4. Validation Rules (`Games.validation.ts`)

| Field           | Type                         | Create Rule                                        | Update Rule                              |
| :-------------- | :--------------------------- | :------------------------------------------------- | :--------------------------------------- |
| `game_name`     | `string`                     | Required, `2–150` chars, unique                    | Optional, `2–150` chars                  |
| `description`   | `string \| null`             | Optional, nullable                                 | Optional, nullable                       |
| `max_score`     | `number` (integer)           | Optional, integer `>= 0` (default `100`)           | Optional, integer `>= 0`                 |
| `registrations` | `number` (integer)           | Optional, integer `>= 0` (default `0`)             | Optional, integer `>= 0`                 |
| `submissions`   | `number` (integer)           | Optional, integer `>= 0` (default `0`)             | Optional, integer `>= 0`                 |
| `start_time`    | `Date \| ISO-8601 string`    | Required, valid timestamp                          | Optional, valid timestamp                |
| `end_time`      | `Date \| ISO-8601 string`    | Required, valid timestamp, must be `> start_time`  | Optional, valid timestamp (`> start_time`)|
| `status`        | `'UPCOMING'\|'ACTIVE'\|'CLOSED'` | Optional, defaults to `'UPCOMING'`             | Optional (`'UPCOMING'\|'ACTIVE'\|'CLOSED'`) |

---

## 5. Standardized Response Format (`SendResponse`)

All responses return standardized envelopes with both `success` and `status` flags for 100% client and test compatibility:

### Success Response Envelope (`HTTP 200`)
```json
{
  "success": true,
  "status": true,
  "message": "<Informative success message>",
  "data": { ... }
}
```

### Error Response Envelope (`HTTP 500`)
```json
{
  "success": false,
  "status": false,
  "message": "<Descriptive error message>",
  "error": { ... }
}
```

---

## 6. API Endpoints Reference

### 1. `POST /api/v1/game/create`

**Access**: Protected (`SUPER_ADMIN`, `ADMIN`)  
**Route Aliases**: `POST /api/v1/games`, `POST /api/v1/games/create`  
**Description**: Creates a new game with unique `game_name` and validated timeframe.

#### Request Headers
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "game_name": "Cloud Quiz Blitz",
  "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
  "max_score": 100,
  "registrations": 0,
  "submissions": 0,
  "start_time": "2026-11-15T10:00:00.000Z",
  "end_time": "2026-11-15T12:00:00.000Z",
  "status": "UPCOMING"
}
```

#### cURL Example
```bash
curl -X POST http://localhost:3000/api/v1/game/create \
  -H "Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "game_name": "Cloud Quiz Blitz",
    "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
    "max_score": 100,
    "start_time": "2026-11-15T10:00:00.000Z",
    "end_time": "2026-11-15T12:00:00.000Z",
    "status": "UPCOMING"
  }'
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Game created successfully.",
  "data": {
    "id": "1",
    "game_name": "Cloud Quiz Blitz",
    "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
    "max_score": 100,
    "registrations": 0,
    "submissions": 0,
    "start_time": "2026-11-15T10:00:00.000Z",
    "end_time": "2026-11-15T12:00:00.000Z",
    "status": "UPCOMING",
    "created_at": "2026-10-11T06:20:00.000Z",
    "updated_at": "2026-10-11T06:20:00.000Z"
  }
}
```

#### Error Response: Duplicate Game Name (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "A game with this name already exists.",
  "error": {}
}
```

#### Error Response: Invalid Time Range (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "End time must be after start time",
  "error": {
    "issues": [
      {
        "code": "custom",
        "message": "End time must be after start time",
        "path": ["end_time"]
      }
    ]
  }
}
```

---

### 2. `GET /api/v1/game/get`

**Access**: Public  
**Route Aliases**: `GET /api/v1/games`, `GET /api/v1/games/get`  
**Description**: Fetches all games ordered by `created_at DESC`.

#### cURL Example
```bash
curl -X GET http://localhost:3000/api/v1/game/get
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Games list fetched successfully.",
  "data": [
    {
      "id": "2",
      "game_name": "Bug Hunt Challenge",
      "description": "Find and fix bugs in open source repos",
      "max_score": 200,
      "registrations": 45,
      "submissions": 12,
      "start_time": "2026-11-16T09:00:00.000Z",
      "end_time": "2026-11-16T12:00:00.000Z",
      "status": "UPCOMING",
      "created_at": "2026-10-11T06:25:00.000Z",
      "updated_at": "2026-10-11T06:25:00.000Z"
    },
    {
      "id": "1",
      "game_name": "Cloud Quiz Blitz",
      "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
      "max_score": 100,
      "registrations": 30,
      "submissions": 5,
      "start_time": "2026-11-15T10:00:00.000Z",
      "end_time": "2026-11-15T12:00:00.000Z",
      "status": "UPCOMING",
      "created_at": "2026-10-11T06:20:00.000Z",
      "updated_at": "2026-10-11T06:20:00.000Z"
    }
  ]
}
```

---

### 3. `GET /api/v1/game/:id`

**Access**: Public  
**Route Aliases**: `GET /api/v1/games/:id`, `GET /api/v1/game/get/:id`, `GET /api/v1/games/get/:id`  
**Description**: Fetches a single game by its integer primary key `id`.

#### URL Parameters
- `id` *(number, required)*: Unique numeric identifier of the game (e.g. `1`).

#### cURL Example
```bash
curl -X GET http://localhost:3000/api/v1/game/1
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Game details retrieved successfully.",
  "data": {
    "id": "1",
    "game_name": "Cloud Quiz Blitz",
    "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
    "max_score": 100,
    "registrations": 30,
    "submissions": 5,
    "start_time": "2026-11-15T10:00:00.000Z",
    "end_time": "2026-11-15T12:00:00.000Z",
    "status": "UPCOMING",
    "created_at": "2026-10-11T06:20:00.000Z",
    "updated_at": "2026-10-11T06:20:00.000Z"
  }
}
```

#### Error Response: Not Found (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Game not found.",
  "error": {}
}
```

#### Error Response: Invalid ID (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Valid Game ID is required.",
  "error": {}
}
```

---

### 4. `GET /api/v1/game/name/:name`

**Access**: Public  
**Route Aliases**: `GET /api/v1/games/name/:name`  
**Description**: Looks up a single game by its unique `game_name` (case-insensitive).

#### URL Parameters
- `name` *(string, required)*: The name of the game (URL encoded).

#### cURL Example
```bash
curl -X GET "http://localhost:3000/api/v1/game/name/Cloud%20Quiz%20Blitz"
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Game details retrieved successfully.",
  "data": {
    "id": "1",
    "game_name": "Cloud Quiz Blitz",
    "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
    "max_score": 100,
    "registrations": 30,
    "submissions": 5,
    "start_time": "2026-11-15T10:00:00.000Z",
    "end_time": "2026-11-15T12:00:00.000Z",
    "status": "UPCOMING",
    "created_at": "2026-10-11T06:20:00.000Z",
    "updated_at": "2026-10-11T06:20:00.000Z"
  }
}
```

---

### 5. `PATCH` / `PUT /api/v1/game/:id`

**Access**: Protected (`SUPER_ADMIN`, `ADMIN`)  
**Route Aliases**: `PATCH /api/v1/games/:id`, `PUT /api/v1/games/:id`  
**Description**: Updates one or more fields of an existing game. Preserves unmodified fields via SQL `COALESCE`.

#### Request Headers
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "status": "ACTIVE",
  "max_score": 150,
  "registrations": 45,
  "submissions": 12
}
```

#### cURL Example
```bash
curl -X PATCH http://localhost:3000/api/v1/game/1 \
  -H "Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "max_score": 150,
    "registrations": 45,
    "submissions": 12
  }'
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Game updated successfully.",
  "data": {
    "id": "1",
    "game_name": "Cloud Quiz Blitz",
    "description": "Fast-paced Google Cloud & Kubernetes trivia challenge",
    "max_score": 150,
    "registrations": 45,
    "submissions": 12,
    "start_time": "2026-11-15T10:00:00.000Z",
    "end_time": "2026-11-15T12:00:00.000Z",
    "status": "ACTIVE",
    "created_at": "2026-10-11T06:20:00.000Z",
    "updated_at": "2026-10-11T06:30:00.000Z"
  }
}
```

---

### 6. `PATCH /api/v1/game/:id/activate`

**Access**: Protected (`SUPER_ADMIN`, `ADMIN`)  
**Route Aliases**: `PATCH /api/v1/games/:id/activate`  
**Description**: Convenience endpoint to set a game's status to `ACTIVE`.

#### cURL Example
```bash
curl -X PATCH http://localhost:3000/api/v1/game/1/activate \
  -H "Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>"
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Game has been activated.",
  "data": {
    "id": "1",
    "game_name": "Cloud Quiz Blitz",
    "status": "ACTIVE",
    "updated_at": "2026-10-11T06:35:00.000Z"
  }
}
```

---

### 7. `PATCH /api/v1/game/:id/close`

**Access**: Protected (`SUPER_ADMIN`, `ADMIN`)  
**Route Aliases**: `PATCH /api/v1/games/:id/close`  
**Description**: Convenience endpoint to set a game's status to `CLOSED`.

#### cURL Example
```bash
curl -X PATCH http://localhost:3000/api/v1/game/1/close \
  -H "Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>"
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Game has been closed.",
  "data": {
    "id": "1",
    "game_name": "Cloud Quiz Blitz",
    "status": "CLOSED",
    "updated_at": "2026-10-11T06:40:00.000Z"
  }
}
```

---

## 7. Error Messages & Constants

Defined in [`src/api/v1/games/game.constants.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/games/game.constants.ts):

| Constant Key | Message String |
| :--- | :--- |
| `GAME_CREATED` | `"Game created successfully."` |
| `GAME_UPDATED` | `"Game updated successfully."` |
| `GAME_FETCHED` | `"Game details retrieved successfully."` |
| `GAMES_LISTED` | `"Games list fetched successfully."` |
| `GAME_NOT_FOUND` | `"Game not found."` |
| `GAME_ALREADY_EXISTS` | `"A game with this name already exists."` |
| `GAME_ID_REQUIRED` | `"Valid Game ID is required."` |
| `INVALID_TIME_RANGE` | `"End time must be after start time."` |
| `GAME_ACTIVATED` | `"Game has been activated."` |
| `GAME_CLOSED` | `"Game has been closed."` |
| `GAME_NOT_ACTIVE` | `"Game is currently not active for submissions."` |
