# GDG Ranchi DevFest 2026 — Participant Module Specification

Comprehensive architectural and API reference for the **Participant Registration, Game Participation & Profile Management** subsystem powering the **GDG Ranchi DevFest 2026 Game Backend**.

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Access Control & Permissions](#2-access-control--permissions)
3. [PostgreSQL Database & Schema](#3-postgresql-database--schema)
4. [Validation Rules (`Participants.validation.ts`)](#4-validation-rules-participantsvalidationts)
5. [Standardized Response Format (`SendResponse`)](#5-standardized-response-format-sendresponse)
6. [API Endpoints Reference](#6-api-endpoints-reference)
   - [1. POST /api/v1/participant/create](#1-post-apiv1participantcreate)
   - [2. GET /api/v1/participants/get](#2-get-apiv1participantsget)
   - [3. GET /api/v1/participant/:ticketId](#3-get-apiv1participantticketid)
   - [4. POST /api/v1/participant/join-game (Public Self-Service Game Join)](#4-post-apiv1participantjoin-game-public-self-service-game-join)
   - [5. PUT /api/v1/participant/:ticketId (Admin Profile Update)](#5-put-apiv1participantticketid-admin-profile-update)
   - [6. PATCH /api/v1/participants/update/game-score (Admin Game Score Update)](#6-patch-apiv1participantsupdategame-score-admin-game-score-update)
7. [Error Messages & Constants](#7-error-messages--constants)

---

## 1. Overview & Architecture

The Participant module allows DevFest attendees to register their participant profile with a unique `ticket_id`, personal details, and an array of programming languages (`primary_language`).

Attendees can publicly **join games** by submitting their `ticket_id`, registered `email`, and `game_id` directly in `req.body` via `POST /api/v1/participant/join-game`.

### 🎮 Automated Join Game Invariants

1. **Auto Game Name Lookup**: The backend and database automatically look up `game_name` from the `games` table using `game_id`. The client only needs to provide `game_id`.
2. **Default Completion Status (`false`)**: `isCompleted` automatically defaults to `false` when joining a game. Attendees do **not** need to send this in `req.body`.
3. **Default Score (`0`)**: `Total_game_point` automatically defaults to `0` upon joining. Attendees do **not** need to send this in `req.body`.
4. **Game History Merging**: Joining a new game appends it to the participant's `games` array without overwriting previously completed games.
5. **Registration Counter**: Automatically increments the `registrations` counter on the `games` table.

Full profile updates and manual score adjustments remain protected for **`SUPER_ADMIN`** and **`ADMIN`** accounts.

### Directory Structure

```text
src/api/v1/participants/
├── Participants.type.ts         # IParticipantDoc & IParticipantGameItem interfaces
├── Participants.Schema.ts       # PostgreSQL DDL for `participants` table + games FK trigger
├── Participants.validation.ts   # Zod validation schemas for create, update & public join game
├── Participants.Utils.ts        # Direct parameterized pg.query helpers
├── Participants.Service.ts      # Business logic (create, getAll, getByTicketId, joinGame, updateParticipant)
├── Participants.controller.ts   # Express controller using throw new Error + SendResponse
├── Participant.routes.ts        # Express router (public create/read/join, protected admin update)
├── participant.constants.ts     # Centralized messages and constants
└── ParticipantDoc.md            # Participant module API specification
```

---

## 2. Access Control & Permissions

| Operation                          | Endpoint                                 | Method  | Access Level                             | Description                                                                                                                                 |
| :--------------------------------- | :--------------------------------------- | :------ | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Create New Participant**         | `/api/v1/participant/create`             | `POST`  | **Public** (Rate-Limited)                | Register new attendee profile (`ticket_id`, languages)                                                                                      |
| **Get All Participants**           | `/api/v1/participants/get`               | `GET`   | **Public** (Anyone)                      | Retrieve all participants ordered by `total_points DESC`                                                                                    |
| **Get Participant by `ticket_id`** | `/api/v1/participant/:ticketId`          | `GET`   | **Public** (Anyone)                      | Fetch attendee profile, games array with `game_name`, and score                                                                             |
| **Public Join Game**               | `/api/v1/participant/join-game`          | `POST`  | **Public** (`optionalAuth`)              | Join games with `email`, `ticket_id`, `game_id` in `req.body`. Auto-populates `game_name`, `Total_game_point: 0`, and `isCompleted: false`. |
| **Admin Participant Update**       | `/api/v1/participant/:ticketId`          | `PUT`   | **Protected** (`SUPER_ADMIN` & `ADMIN`)  | Update attendee profile directly (profile information only; games are managed via `/join-game`)                                             |
| **Update Participant Game Score**  | `/api/v1/participants/update/game-score` | `PATCH` | **Protected** (`SUPER_ADMIN` & `ADMIN`)  | Update single game score (`Total_game_point`) via query params `ticket_id` & `game_id`, and recalculate `total_points`                     |

---

## 3. PostgreSQL Database & Schema

Defined in [`src/api/v1/participants/Participants.Schema.ts`](Participants.Schema.ts) and initialized automatically at startup via [`src/core/database/schema.ts`](../../../core/database/schema.ts):

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

  track VARCHAR(100),

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
CREATE INDEX IF NOT EXISTS idx_participants_total_points ON participants (total_points DESC);
CREATE INDEX IF NOT EXISTS idx_participants_track ON participants (track);
```

### Foreign Key, Name Lookup & Score Synchronization Trigger (`trigger_participants_games_fk`)

Each item in `participants.games` (`JSONB` array) has the shape:

```json
{
  "game_id": 1,
  "game_name": "Code Combat Challenge",
  "Total_game_point": 0,
  "isCompleted": false
}
```

- **Foreign Key Verification**: A `BEFORE INSERT OR UPDATE` trigger verifies that every `game_id` exists in `games(id)`.
- **Automatic `game_name` Population**: The trigger performs `SELECT game_name INTO v_game_name FROM games WHERE id = v_game_id;` and automatically writes `game_name` into the stored JSON object.
- **Automatic `total_points` Calculation**: The trigger automatically computes `total_points = SUM(points)` across all entries in `games`.
- **Field Defaults**: Defaults `Total_game_point` to `0` and `isCompleted` to `false` when a participant joins a game.

---

## 4. Validation Rules (`Participants.validation.ts`)

### Participant Schema Fields

| Field                      | Type                     | Create Rule                          | Public Join Game Rule                        | Admin Update Rule                      |
| :------------------------- | :----------------------- | :----------------------------------- | :------------------------------------------- | :------------------------------------- |
| `ticket_id`                | `string`                 | Required, `1–32` chars, unique       | In path or body; matches registered ticket   | Required in path/body, `1–32` chars    |
| `email`                    | `string`                 | Required, valid email                | Required; must match ticket's email          | Optional, valid email                  |
| `games`                    | `IParticipantGameItem[]` | Optional (default `[]`)              | Managed via `/join-game`                     | Not updated (managed via `/join-game`) |
| `games[].game_id`          | `number`                 | Required positive integer            | Required positive integer                    | Required positive integer              |
| `games[].game_name`        | `string`                 | Optional (auto-fetched by `game_id`) | Optional (auto-fetched by `game_id`)         | Optional (auto-fetched by `game_id`)   |
| `games[].Total_game_point` | `number`                 | Optional (default `0`)               | Optional (defaults to `0` automatically)     | Optional integer $\ge 0$               |
| `games[].isCompleted`      | `boolean`                | Optional (default `false`)           | Optional (defaults to `false` automatically) | Optional boolean                       |
| `name`                     | `string`                 | Required, `2–150` chars              | Ignored (read-only for participants)         | Optional, `2–150` chars                |
| `mobile_number`            | `string`                 | Required, `10–20` chars              | Ignored (read-only for participants)         | Optional, `10–20` chars                |
| `social_link`              | `string`                 | Required, non-empty                  | Ignored (read-only for participants)         | Optional, non-empty                    |
| `location`                 | `string`                 | Required, `1–150` chars              | Ignored (read-only for participants)         | Optional, `1–150` chars                |
| `track`                    | `string`                 | Optional, `1–100` chars              | Ignored (read-only for participants)         | Optional, `1–100` chars                |
| `primary_language`         | `string[]`               | Required array ($\ge 1$)             | Ignored (read-only for participants)         | Optional array ($\ge 1$)               |
| `total_points`             | `number`                 | Optional (default `0`)               | Ignored (auto-calculated by trigger)         | Optional integer $\ge 0$               |
| `is_certificate_claim`     | `boolean`                | Optional (default `false`)           | Ignored (restricted to admins)               | Optional boolean                       |

### `joinParticipantGameValidator`

```ts
export const joinParticipantGameValidator = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .max(255, "Email must not exceed 255 characters"),

    ticket_id: z
      .string()
      .trim()
      .min(1, "Ticket ID is required")
      .max(32, "Ticket ID must not exceed 32 characters"),

    game_id: z.coerce.number().int().positive("Valid game_id is required").optional(),

    games: z.array(participantGameItemValidator).optional(),
  })
  .refine(
    (data) => data.game_id !== undefined || (Array.isArray(data.games) && data.games.length > 0),
    {
      message: "Valid game_id is required to join a game.",
      path: ["game_id"],
    },
  );
```

---

## 5. Standardized Response Format (`SendResponse`)

All responses return standardized envelopes with both `success` and `status` flags:

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

### 1. `POST /api/v1/participant/create`

**Access**: Public (Rate-Limited via `participantLimiter`)  
**Description**: Registers a new participant profile with their DevFest ticket ID.

#### Request Headers

```http
Content-Type: application/json
```

#### Request Body

```json
{
  "ticket_id": "GDG26-0001",
  "name": "Abhishek Kumar",
  "email": "abhishek@example.com",
  "mobile_number": "9876543210",
  "social_link": "https://linkedin.com/in/abhishek",
  "profile_image": "https://example.com/avatar.png",
  "location": "Ranchi",
  "track": "Web & Cloud",
  "github_url": "https://github.com/abhishek",
  "primary_language": ["TypeScript", "Node.js", "Python"]
}
```

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "status": true,
  "message": "Participant created successfully.",
  "data": {
    "id": "1",
    "ticket_id": "GDG26-0001",
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile_number": "9876543210",
    "social_link": "https://linkedin.com/in/abhishek",
    "profile_image": "https://example.com/avatar.png",
    "location": "Ranchi",
    "track": "Web & Cloud",
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Node.js", "Python"],
    "games": [],
    "total_points": 0,
    "is_certificate_claim": false,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:00:00.000Z"
  }
}
```

---

### 2. `GET /api/v1/participants/get`

**Access**: Public  
**Description**: Fetches all registered participants ordered by `total_points DESC` (leaderboard order).

#### cURL Example

```bash
curl -X GET http://localhost:3000/api/v1/participants/get
```

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "status": true,
  "message": "Participants retrieved successfully.",
  "data": [
    {
      "ticket_id": "GDG26-0001",
      "name": "Abhishek Kumar",
      "profile_image": "https://example.com/avatar.png",
      "games": [
        {
          "game_id": 1,
          "game_name": "Code Combat Challenge",
          "Total_game_point": 90,
          "isCompleted": true,
          "is_completed": true,
          "point": 90,
          "points": 90
        }
      ],
      "social_link": "https://linkedin.com/in/abhishek",
      "track": "Web & Cloud",
      "is_certificate_claim": false
    }
  ]
}
```

---

### 3. `GET /api/v1/participant/:ticketId`

**Access**: Public  
**Description**: Fetches full participant profile by their unique `ticket_id`.

#### URL Parameters

- `ticketId` _(string, required)_: The unique registration ticket ID (e.g. `GDG26-0001`).

#### cURL Example

```bash
curl -X GET http://localhost:3000/api/v1/participant/GDG26-0001
```

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "status": true,
  "message": "Participant profile fetched successfully.",
  "data": {
    "id": "1",
    "ticket_id": "GDG26-0001",
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile_number": "9876543210",
    "social_link": "https://linkedin.com/in/abhishek",
    "profile_image": "https://example.com/avatar.png",
    "location": "Ranchi",
    "track": "Web & Cloud",
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Node.js", "Python"],
    "games": [
      {
        "game_id": 1,
        "game_name": "Code Combat Challenge",
        "Total_game_point": 0,
        "isCompleted": false,
        "is_completed": false,
        "point": 0,
        "points": 0
      }
    ],
    "total_points": 0,
    "is_certificate_claim": false,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:05:00.000Z"
  }
}
```

---

### 4. `POST /api/v1/participant/join-game` (Public Self-Service Game Join)

This canonical endpoint allows registered DevFest attendees to join any game by submitting their email, ticket ID, and game ID directly in `req.body`.

**Access**: **Public** (`optionalAuth`, verified against registered ticket ID and email in database)  
**Method**: `POST`  
**Endpoint**: `POST /api/v1/participant/join-game`

#### Request Body (`req.body`)

```json
{
  "email": "abhishek@example.com",
  "ticket_id": "GDG26-0001",
  "game_id": 1
}
```

#### Key Behaviors & Validations

1. **User Verification**: The system finds the participant by `ticket_id` and `email`:
   - If participant ticket does not exist: throws `"You can't join game. Participant not found."`
   - If ticket exists but email does not match: throws `"You can't join game. Provided email does not match this ticket ID."`
2. **Game Verification**: The system finds the game by `game_id`:
   - If game does not exist: throws `"You can't join game. Game with ID <id> does not exist."`
3. **Duplicate Prevention**: If the participant has already joined this game, the system rejects it:
   - Throws `"You can't join game. You have already joined this game."`
4. **Automated Game Details Injection**:
   - `game_name` is automatically fetched from the `games` table and attached.
   - `Total_game_point` automatically defaults to `0` upon joining.
   - `isCompleted` automatically defaults to `false` upon joining.
5. **Games Array Structure**:
   Inside the participant's `games` array, each joined game item looks like:
   ```json
   {
     "game_id": 1,
     "game_name": "Code Combat Challenge",
     "Total_game_point": 0,
     "isCompleted": false
   }
   ```
6. **Registration Counter**: Automatically increments `registrations` counter on the `games` table.

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/participant/join-game \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abhishek@example.com",
    "ticket_id": "GDG26-0001",
    "game_id": 1
  }'
```

#### Success Response (`HTTP 200 OK`)

```json
{
  "success": true,
  "status": true,
  "message": "Participant joined game successfully.",
  "data": {
    "id": "1",
    "ticket_id": "GDG26-0001",
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile_number": "9876543210",
    "social_link": "https://linkedin.com/in/abhishek",
    "profile_image": "https://example.com/avatar.png",
    "location": "Ranchi",
    "track": "Web & Cloud",
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Node.js", "Python"],
    "games": [
      {
        "game_id": 1,
        "game_name": "Code Combat Challenge",
        "Total_game_point": 0,
        "isCompleted": false,
        "is_completed": false,
        "point": 0,
        "points": 0
      }
    ],
    "total_points": 0,
    "is_certificate_claim": false,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:12:00.000Z"
  }
}
```

#### Error Responses

**1. Participant Not Found (`HTTP 500`)**

```json
{
  "success": false,
  "status": false,
  "message": "You can't join game. Participant not found.",
  "error": {}
}
```

**2. Email Mismatch (`HTTP 500`)**

```json
{
  "success": false,
  "status": false,
  "message": "You can't join game. Provided email does not match this ticket ID.",
  "error": {}
}
```

**3. Game Not Found (`HTTP 500`)**

```json
{
  "success": false,
  "status": false,
  "message": "You can't join game. Game with ID 999999 does not exist.",
  "error": {}
}
```

**4. Already Joined (`HTTP 500`)**

```json
{
  "success": false,
  "status": false,
  "message": "You can't join game. You have already joined this game.",
  "error": {}
}
```

---

### 5. `PUT /api/v1/participant/:ticketId` (Participant Profile Update)

**Access**: **Protected** (`SUPER_ADMIN` & `ADMIN` only)  
**Method**: `PUT`  
**Endpoint**: `PUT /api/v1/participant/:ticketId`  
**Description**: Updates attendee profile information directly based on `ticket_id` via PostgreSQL without modifying `games`. (Games are managed strictly via the dedicated `POST /api/v1/participant/join-game` endpoint).

> [!NOTE]
> `updateParticipant` validates all fields using Zod (`ticketIdValidator` and `updateParticipantValidator`). No loops are executed—updates are applied directly to PostgreSQL via parameterized query. `games` are not updated through this endpoint.

#### URL Parameters

- `ticketId` _(string, required)_: The participant's unique registration ticket ID (e.g. `GDG26-0001`). Validated by `ticketIdValidator`.

#### Request Headers

```http
Authorization: Bearer <SUPER_ADMIN_OR_ADMIN_JWT_TOKEN>
Content-Type: application/json
```

#### Request Body (`updateParticipantValidator`)

All fields are optional for partial updates:

```json
{
  "name": "Abhishek Kumar",
  "email": "abhishek@example.com",
  "mobile_number": "9876543210",
  "social_link": "https://linkedin.com/in/abhishek",
  "profile_image": "https://example.com/avatar.png",
  "location": "Jamshedpur",
  "track": "AI & Machine Learning",
  "github_url": "https://github.com/abhishek",
  "primary_language": ["TypeScript", "Rust", "Go"],
  "is_certificate_claim": true
}
```

#### cURL Example

```bash
curl -X PUT http://localhost:3000/api/v1/participant/GDG26-0001 \
  -H "Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Jamshedpur",
    "track": "AI & Machine Learning",
    "primary_language": ["TypeScript", "Rust", "Go"],
    "is_certificate_claim": true
  }'
```

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "status": true,
  "message": "Participant profile updated successfully.",
  "data": {
    "id": "1",
    "ticket_id": "GDG26-0001",
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile_number": "9876543210",
    "social_link": "https://linkedin.com/in/abhishek",
    "profile_image": "https://example.com/avatar.png",
    "location": "Jamshedpur",
    "track": "AI & Machine Learning",
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Rust", "Go"],
    "games": [
      {
        "game_id": 1,
        "game_name": "Code Combat Challenge",
        "Total_game_point": 0,
        "isCompleted": false
      }
    ],
    "total_points": 0,
    "is_certificate_claim": true,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:15:00.000Z"
  }
}
```

#### Error Responses

**1. Ticket ID Missing / Invalid (`HTTP 500`)**

```json
{
  "success": false,
  "status": false,
  "message": "Ticket ID is required",
  "error": {}
}
```

**2. Participant Not Found (`HTTP 500`)**

```json
{
  "success": false,
  "status": false,
  "message": "Participant not found.",
  "error": {}
}
```

---

### 6. `PATCH /api/v1/participants/update/game-score` (Admin Game Score Update)

**Access**: **Protected** (`SUPER_ADMIN` & `ADMIN` only)  
**Method**: `PATCH`  
**Endpoint**: `PATCH /api/v1/participants/update/game-score`  
**Description**: Updates a participant's score (`Total_game_point`) and completion status (`isCompleted`) for a specific game within their joined games array, keeping all other games in their history intact.

#### Key Invariants & Automated Behaviors
1. **Single Game Score Updated**: Updates only the specified `game_id` within the attendee's `games` JSONB array (`Total_game_point: score`, `isCompleted: isCompleted`).
2. **Automatic Total Score Calculation**: PostgreSQL's `validate_and_sync_participant_games()` database trigger automatically recalculates and synchronizes the participant's `total_points` column as the sum of all games' scores (`SUM(Total_game_point)`).
3. **Game & Score Validation**:
   - Verifies the game exists in the `games` table via `GamesUtils.FIND_GAME_BY_ID`.
   - Validates that `score >= 0`.
   - If the game has a configured `max_score`, rejects scores exceeding `max_score`.
4. **Submissions Counter**: Automatically increments `games.submissions` (`submissions = submissions + 1`) when `isCompleted: true`.
5. **Attendee Game Lookup**: Finds the game within the participant's joined `games` list (`currentGames.findIndex((g) => Number(g.game_id) === numericGameId)`).
6. **Parameter Input Structure**:
   - `ticket_id`: Passed via **Query Parameter** (`?ticket_id=...`).
   - `game_id`: Passed via **Query Parameter** (`?game_id=...`).
   - `score`: Passed via **JSON Request Body** (`{ "score": <number> }`).
   - `isCompleted`: Passed via **JSON Request Body** (`{ "isCompleted": <boolean> }`).

#### Query Parameters
- `ticket_id` _(string, required)_: The participant's unique registration ticket ID (e.g. `GDG26-0001`).
- `game_id` _(string | number, required)_: The unique ID of the game being scored (e.g. `1`).

#### Request Headers
```http
Authorization: Bearer <SUPER_ADMIN_OR_ADMIN_JWT_TOKEN>
Content-Type: application/json
```

#### Request Body (`application/json`)
```json
{
  "score": 95,
  "isCompleted": true
}
```

#### cURL Example

```bash
curl -X PATCH "http://localhost:3000/api/v1/participants/update/game-score?ticket_id=GDG26-0001&game_id=1" \
  -H "Authorization: Bearer <ADMIN_OR_SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 95,
    "isCompleted": true
  }'
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Participant game score updated successfully.",
  "data": {
    "id": "1",
    "ticket_id": "GDG26-0001",
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile_number": "9876543210",
    "social_link": "https://linkedin.com/in/abhishek",
    "profile_image": "https://example.com/avatar.png",
    "location": "Ranchi",
    "track": "AI & Machine Learning",
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Go"],
    "games": [
      {
        "game_id": 1,
        "game_name": "Code Combat Challenge",
        "Total_game_point": 95,
        "isCompleted": true
      }
    ],
    "total_points": 95,
    "is_certificate_claim": false,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:45:00.000Z"
  }
}
```

#### Error Responses

##### 1. Ticket ID Missing / Empty (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Ticket ID is required.",
  "error": {}
}
```

##### 2. Game ID Missing / Invalid (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Valid Game ID is required.",
  "error": {}
}
```

##### 3. Score Missing / Invalid (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Valid non-negative score is required.",
  "error": {}
}
```

##### 4. Game Not Found (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Game not found.",
  "error": {}
}
```

##### 5. Score Exceeds Maximum Score (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Score (120) cannot exceed maximum allowed score of 100.",
  "error": {}
}
```

##### 6. Participant Not Found (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Participant record not found.",
  "error": {}
}
```

---

## 7. Error Messages & Constants

Defined in [`src/api/v1/participants/participant.constants.ts`](participant.constants.ts):

| Constant Key            | Message String                                               | Usage Context                                         |
| :---------------------- | :----------------------------------------------------------- | :---------------------------------------------------- |
| `PARTICIPANT_CREATED`   | `"Participant created successfully."`                        | Returned when participant registers                   |
| `PARTICIPANTS_LISTED`   | `"Participants retrieved successfully."`                     | Returned when listing all participants                |
| `PROFILE_FETCHED`       | `"Participant profile fetched successfully."`                | Returned when fetching participant by ticket ID       |
| `PROFILE_UPDATED`       | `"Participant profile updated successfully."`                | Returned after Admin profile/points update            |
| `GAME_JOINED`           | `"Participant joined game successfully."`                    | Returned when public participant joins game           |
| `PARTICIPANT_NOT_FOUND` | `"Participant record not found."`                            | Thrown when `ticket_id` does not exist                |
| `TICKET_ID_REQUIRED`    | `"Ticket ID is required."`                                   | Thrown when `ticket_id` is empty                      |
| `TICKET_ALREADY_EXISTS` | `"A participant with this ticket ID already exists."`        | Thrown on duplicate registration                      |
| `EMAIL_ALREADY_EXISTS`  | `"A participant with this email address already exists."`    | Thrown on duplicate email registration                |
| `EMAIL_REQUIRED`        | `"Email is required to join a game."`                        | Thrown when public join request omits email           |
| `EMAIL_MISMATCH`        | `"Provided email does not match this ticket ID."`            | Thrown when email does not match ticket owner         |
| `GAMES_REQUIRED`        | `"Games list is required to join a game."`                   | Thrown when public join request has empty games array |
| `UNAUTHORIZED_ACCESS`   | `"You are not authorized to access or modify this profile."` | Thrown on forbidden operations                        |
