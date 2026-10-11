# GDG Ranchi DevFest 2026 — Participant Module Specification

Comprehensive architectural and API reference for the **Participant Registration & Management** subsystem powering the **GDG Ranchi DevFest 2026 Game Backend**.

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Access Control & Permissions](#2-access-control--permissions)
3. [PostgreSQL Database & Schema](#3-postgresql-database--schema)
4. [Validation Rules (`Participants.validation.ts`)](#4-validation-rules-participantsvalidationts)
5. [Standardized Response Format (`SendResponse`)](#5-standardized-response-format-sendresponse)
6. [API Endpoints Reference](#6-api-endpoints-reference)
   - [1. POST /api/v1/participant/create](#1-post-apiv1participantcreate)
   - [2. GET /api/v1/participant/get](#2-get-apiv1participantget)
   - [3. GET /api/v1/participant/:ticketId](#3-get-apiv1participantticketid)
   - [4. PUT / PATCH /api/v1/participants/:ticketId](#4-put--patch-apiv1participantsticketid)
7. [Error Messages & Constants](#7-error-messages--constants)

---

## 1. Overview & Architecture

The Participant module allows DevFest attendees to register their participant profile using their unique `ticket_id`, array of programming/tech languages (`primary_language`), game progress array (`games`), `total_points`, and `is_certificate_claim` flag, while restricting profile and score updates exclusively to **`SUPER_ADMIN`** and **`ADMIN`** accounts.

### Directory Structure

```text
src/api/v1/participants/
├── Participants.type.ts         # IParticipantDoc & IParticipantGameItem interfaces
├── Participants.Schema.ts       # PostgreSQL DDL for `participants` table + games FK trigger
├── Participants.validation.ts   # Zod validation schemas for create & update
├── Participants.Utils.ts        # Direct parameterized pg.query helpers
├── Participants.Service.ts      # Business logic (create, getAll, getByTicketId, update)
├── Participants.controller.ts   # Express controller using throw new Error + SendResponse
├── Participant.routes.ts        # Express router (public create/read, protected admin update)
├── participant.constants.ts     # Centralized messages and constants
└── ParticipantDoc.md            # Participant module API specification
```

---

## 2. Access Control & Permissions

| Operation                          | Endpoint                               | Method | Access Level                                 |
| :--------------------------------- | :------------------------------------- | :----- | :------------------------------------------- |
| **Create New Participant**         | `/api/v1/participant/create` *(alias: `/api/v1/participants`)* | `POST` | **Public** (Anyone — no token required)      |
| **Get All Participants**           | `/api/v1/participant/get` *(alias: `/api/v1/participants`)*     | `GET`  | **Public** (Anyone — no token required)      |
| **Get Participant by `ticket_id`** | `/api/v1/participant/:ticketId` *(alias: `/api/v1/participants/:ticketId`)* | `GET`  | **Public** (Anyone — no token required)      |
| **Update Participant**             | `/api/v1/participants/:ticketId` *(alias: `/api/v1/participant/:ticketId`)* | `PUT` / `PATCH` | **Protected** (`SUPER_ADMIN` & `ADMIN` only) |

---

## 3. PostgreSQL Database & Schema

Defined in [`src/api/v1/participants/Participants.Schema.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/participants/Participants.Schema.ts) and initialized automatically at startup via [`src/core/database/schema.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/core/database/schema.ts):

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
CREATE INDEX IF NOT EXISTS idx_participants_total_points ON participants (total_points DESC);
```

### Foreign Key & Score Synchronization Trigger (`trigger_participants_games_fk`)

Each item in `participants.games` (`JSONB` array) has the shape:
```json
{
  "game_id": 1,
  "is_completed": true,
  "points": 90
}
```

- **Foreign Key Verification**: A `BEFORE INSERT OR UPDATE` trigger verifies that every `game_id` exists in `games(id)`.
- **Automatic `total_points` Calculation**: The trigger automatically computes `total_points = SUM(points)` across all entries in `games`.

---

## 4. Validation Rules (`Participants.validation.ts`)

| Field                  | Type                     | Create Rule                                      | Update Rule                                           |
| :--------------------- | :----------------------- | :----------------------------------------------- | :---------------------------------------------------- |
| `ticket_id`            | `string`                 | Required, `1–32` chars, unique                   | Used as URL parameter `:ticketId`                     |
| `name`                 | `string`                 | Required, `2–150` chars, trimmed                 | Optional, `2–150` chars                               |
| `email`                | `string`                 | Required, valid email, normalized to lowercase   | Optional, valid email                                 |
| `mobile_number`        | `string`                 | Required, `10–20` chars                          | Optional, `10–20` chars                               |
| `social_link`          | `string`                 | Required, non-empty string                       | Optional, non-empty string                            |
| `profile_image`        | `string \| null`         | Optional                                         | Optional                                              |
| `location`             | `string`                 | Required, `1–150` chars                          | Optional, `1–150` chars                               |
| `github_url`           | `string \| null`         | Optional                                         | Optional                                              |
| `primary_language`     | `string[]` (`TEXT[]`)    | Required array with $\ge 1$ non-empty language   | Optional array with $\ge 1$ language                  |
| `games`                | `IParticipantGameItem[]` | Optional (defaults to `[]`); validates `game_id` | Optional array of `{ game_id, is_completed, points }` |
| `total_points`         | `number`                 | Optional (defaults to `0`)                       | Optional integer $\ge 0$                              |
| `is_certificate_claim` | `boolean`                | Optional (defaults to `false`)                   | Optional boolean                                      |

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

**Access**: Public (Anyone — no auth required)  
**Route Aliases**: `POST /api/v1/participants`  
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
  "github_url": "https://github.com/abhishek",
  "primary_language": ["TypeScript", "Node.js", "Python"]
}
```

#### cURL Example
```bash
curl -X POST http://localhost:3000/api/v1/participant/create \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "GDG26-0001",
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile_number": "9876543210",
    "social_link": "https://linkedin.com/in/abhishek",
    "profile_image": "https://example.com/avatar.png",
    "location": "Ranchi",
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Node.js", "Python"]
  }'
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

#### Error Response: Duplicate Ticket ID (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "A participant with this Ticket ID is already registered.",
  "error": {}
}
```

---

### 2. `GET /api/v1/participant/get`

**Access**: Public  
**Route Aliases**: `GET /api/v1/participants`  
**Description**: Fetches all registered participants ordered by `total_points DESC`.

#### cURL Example
```bash
curl -X GET http://localhost:3000/api/v1/participant/get
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "status": true,
  "message": "Participants list fetched successfully.",
  "data": [
    {
      "ticket_id": "GDG26-0001",
      "name": "Abhishek Kumar",
      "profile_image": "https://example.com/avatar.png",
      "games": [
        {
          "game_id": 1,
          "is_completed": true,
          "points": 90
        }
      ],
      "social_link": "https://linkedin.com/in/abhishek",
      "is_certificate_claim": false
    }
  ]
}
```

---

### 3. `GET /api/v1/participant/:ticketId`

**Access**: Public  
**Route Aliases**: `GET /api/v1/participants/:ticketId`  
**Description**: Fetches full participant profile by their unique `ticket_id`.

#### URL Parameters
- `ticketId` *(string, required)*: The unique registration ticket ID (e.g. `GDG26-0001`).

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
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Node.js", "Python"],
    "games": [
      {
        "game_id": 1,
        "is_completed": true,
        "points": 90
      }
    ],
    "total_points": 90,
    "is_certificate_claim": false,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:05:00.000Z"
  }
}
```

#### Error Response: Not Found (`500 Internal Server Error`)
```json
{
  "success": false,
  "status": false,
  "message": "Participant not found.",
  "error": {}
}
```

---

### 4. `PUT` / `PATCH /api/v1/participants/:ticketId`

**Access**: Protected (`SUPER_ADMIN`, `ADMIN`)  
**Route Aliases**: `PUT /api/v1/participant/:ticketId`, `PATCH /api/v1/participants/:ticketId`  
**Description**: Updates a participant's profile, game progress, and certificate claim status. Automatically validates every `game_id` and recalculates `total_points`.

#### Request Headers
```http
Authorization: Bearer <SUPER_ADMIN_OR_ADMIN_JWT_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "location": "Jamshedpur",
  "primary_language": ["TypeScript", "Rust", "Go"],
  "games": [
    {
      "game_id": 1,
      "is_completed": true,
      "points": 90
    }
  ],
  "is_certificate_claim": true
}
```

#### cURL Example
```bash
curl -X PUT http://localhost:3000/api/v1/participants/GDG26-0001 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Jamshedpur",
    "primary_language": ["TypeScript", "Rust", "Go"],
    "games": [
      {
        "game_id": 1,
        "is_completed": true,
        "points": 90
      }
    ],
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
    "github_url": "https://github.com/abhishek",
    "primary_language": ["TypeScript", "Rust", "Go"],
    "games": [
      {
        "game_id": 1,
        "is_completed": true,
        "points": 90
      }
    ],
    "total_points": 90,
    "is_certificate_claim": true,
    "created_at": "2026-10-11T06:00:00.000Z",
    "updated_at": "2026-10-11T06:10:00.000Z"
  }
}
```

---

## 7. Error Messages & Constants

Defined in [`src/api/v1/participants/participant.constants.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/participants/participant.constants.ts):

| Constant Key | Message String |
| :--- | :--- |
| `PARTICIPANT_CREATED` | `"Participant created successfully."` |
| `PARTICIPANTS_LISTED` | `"Participants list fetched successfully."` |
| `PROFILE_FETCHED` | `"Participant profile fetched successfully."` |
| `PROFILE_UPDATED` | `"Participant profile updated successfully."` |
| `PARTICIPANT_NOT_FOUND` | `"Participant not found."` |
| `TICKET_ALREADY_EXISTS` | `"A participant with this Ticket ID is already registered."` |
| `TICKET_ID_REQUIRED` | `"Ticket ID is required."` |
