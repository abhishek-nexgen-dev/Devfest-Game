# GDG Ranchi DevFest 2026 — Implementation Plan

## Participant, Games, Leaderboard & Certificate Management System

---

## 1. Executive Summary & Overview

The **GDG Ranchi DevFest 2026 Game Management System** is an event-critical backend engineered to handle the full competition lifecycle for approximately **800 to 1,000 live participants and ~10 active games** during DevFest 2026.

The system is independent of Commudle and operates with two primary user personas:

1. **Super Admin**: Controls games, manages participant statuses, moderates scores, inspects audit logs, and awards certificates.
2. **Participant**: Registers self-service account, forms or joins teams, registers for active games, submits solutions, tracks real-time personal points, and views the leaderboard.

---

## 2. Architectural Decision: Cloud Firestore Enterprise

In accordance with event architectural requirements:

- **No SQL Databases**: PostgreSQL, MySQL, SQLite are strictly excluded.
- **No Relational ORMs**: Prisma is completely removed.
- **No Third-Party Mongo Providers**: MongoDB Atlas / Mongoose are not used.

### Primary Cloud Stack:

- **Runtime**: Node.js 22 LTS with TypeScript
- **Web Framework**: Express.js
- **Primary Database**: Cloud Firestore Enterprise — Native Mode
  - Google Cloud Project: `gdg-ranchi-f44c9`
  - Firestore Database ID: `ai-studio-devfestgame-ca5cb9b4-9f77-480c-b389-e5947a48e0d6`
- **Authentication**: JWT Tokens + Firebase Admin SDK Authentication
- **Storage**: Firebase Storage / Cloud Storage for Firebase for participant photos and digital certificate assets
- **Request Validation**: Zod runtime schema validation

---

## 3. System Workload & Scale Estimation

| Parameter             | Anticipated Scale             | Firestore Read / Write Impact                                  |
| :-------------------- | :---------------------------- | :------------------------------------------------------------- |
| **Participants**      | 800 – 1,000                   | ~1,000 document writes on registration; indexed point queries  |
| **Games**             | ~10 games                     | Catalog cached in memory / queried infrequently (~10 docs)     |
| **Registrations**     | Max 10,000 (1,000 × 10)       | Single document write per participant per game                 |
| **Submissions**       | ~5,000 to 8,000               | Single document write per submission with initial score = 0    |
| **Score Updates**     | ~5,000 to 8,000               | Single update + immutable audit log write                      |
| **Leaderboard Reads** | High concurrency during event | In-memory cached / atomic query aggregations with tie-breakers |

Cloud Firestore Enterprise easily handles millions of daily operations, ensuring sub-second response times without locking bottlenecks.

---

## 4. Cloud Firestore Collections & Schemas

### 4.1 Collection: `users`

Stores login credentials, roles, and account statuses.

- `id` (string, Document ID): User UUID / Auth UID
- `email` (string, indexed): Normalized lowercase email address
- `password` (string): Bcryptjs hashed password
- `role` (string): `"SUPER_ADMIN"` or `"PARTICIPANT"`
- `status` (string): `"ACTIVE"` or `"DISABLED"`
- `createdAt` (ISO 8601 string)
- `updatedAt` (ISO 8601 string)

### 4.2 Collection: `participants`

Stores public and event-specific participant profiles.

- `id` (string, Document ID): Unique participant record ID
- `userId` (string, indexed): References `users.id`
- `participantId` (string, unique, indexed): Formatted ID (e.g. `GDG26-0001`)
- `name` (string): Full participant name
- `email` (string, indexed): Participant email
- `mobile` (string, indexed): Contact mobile number
- `organization` (string, optional): College / Company / Community
- `city` (string, optional): City of residence
- `profilePhoto` (string, optional): Storage URL
- `status` (string): `"ACTIVE"` or `"DISABLED"`
- `totalPoints` (number, indexed): Cumulative verified game points
- `completedGames` (number): Count of submitted/completed games
- `createdAt` (ISO 8601 string)
- `updatedAt` (ISO 8601 string)

### 4.3 Collection: `games`

Defines available competitions and tracks.

- `id` (string, Document ID): e.g. `game-tech-quiz`
- `title` (string): Display name
- `description` (string, optional): Problem statement / rules
- `gameType` (string): `"INDIVIDUAL"` or `"TEAM"`
- `status` (string, indexed): `"UPCOMING"`, `"ACTIVE"`, or `"CLOSED"`
- `maxScore` (number): Maximum allowable score (e.g. 100)
- `startTime` (ISO 8601 string, optional)
- `endTime` (ISO 8601 string, optional)
- `createdAt` (ISO 8601 string)
- `updatedAt` (ISO 8601 string)

### 4.4 Collection: `teams`

Stores competitive teams.

- `id` (string, Document ID): Unique team ID
- `teamName` (string, unique): Display team name
- `teamCode` (string, unique, indexed): 6-character code (e.g. `GDG-8391`)
- `leaderId` (string, indexed): References `participants.id`
- `memberIds` (array of strings): Array of `participants.id` (up to 6 members)
- `totalPoints` (number): Sum of verified team game points
- `createdAt` (ISO 8601 string)
- `updatedAt` (ISO 8601 string)

### 4.5 Collection: `game_registrations`

Enforces game entry and duplicate protection.

- `id` (string, Document ID): e.g. `reg-xxxx`
- `gameId` (string, indexed): References `games.id`
- `participantId` (string, indexed, optional): References `participants.id`
- `teamId` (string, indexed, optional): References `teams.id`
- `status` (string): `"REGISTERED"` or `"CANCELLED"`
- `registeredAt` (ISO 8601 string)

### 4.6 Collection: `game_submissions`

Records submitted solutions.

- `id` (string, Document ID): e.g. `sub-xxxx`
- `gameId` (string, indexed): References `games.id`
- `participantId` (string, indexed, optional): References `participants.id`
- `teamId` (string, indexed, optional): References `teams.id`
- `submissionData` (string, optional): Text solution, URL, or JSON data
- `status` (string): `"SUBMITTED"` or `"EVALUATED"`
- `submittedAt` (ISO 8601 string)

### 4.7 Collection: `game_results`

Stores the official evaluated scores and points.

- `id` (string, Document ID): e.g. `res-xxxx`
- `gameId` (string, indexed): References `games.id`
- `participantId` (string, indexed, optional): References `participants.id`
- `teamId` (string, indexed, optional): References `teams.id`
- `score` (number): Evaluated raw score (0 <= score <= game.maxScore)
- `points` (number): Leaderboard points awarded (default = score)
- `verified` (boolean): `true` once evaluated by Super Admin
- `verifiedBy` (string, optional): Admin user ID who assigned score
- `submittedAt` (ISO 8601 string)
- `updatedAt` (ISO 8601 string)

### 4.8 Collection: `score_update_logs`

Immutable audit log of all scoring events.

- `id` (string, Document ID): e.g. `slog-xxxx`
- `gameId` (string): Game evaluated
- `participantId` (string, optional): Participant evaluated
- `teamId` (string, optional): Team evaluated
- `oldScore` (number): Previous score
- `newScore` (number): Updated score
- `oldPoints` (number): Previous points
- `newPoints` (number): Updated points
- `updatedBy` (string): Admin user ID
- `reason` (string, optional): Moderation explanation
- `createdAt` (ISO 8601 string)

### 4.9 Collection: `certificates`

Official cryptographically verifiable certificates.

- `id` (string, Document ID): e.g. `cert-xxxx`
- `certificateNo` (string, unique): e.g. `GDG26-CERT-0001`
- `participantId` (string, indexed): References `participants.id`
- `participantName` (string): Name printed on certificate
- `verificationHash` (string, unique, indexed): SHA-256 tamper-proof hash
- `certificateUrl` (string, optional): Cloud Storage PDF link
- `issuedAt` (ISO 8601 string)

### 4.10 Collection: `activity_logs`

System-wide administrative and security audit trail.

- `id` (string, Document ID): e.g. `act-xxxx`
- `userId` (string, optional): Actor user ID
- `action` (string): Event name (e.g. `PARTICIPANT_REGISTERED`, `SCORE_UPDATED`)
- `details` (string, optional): Summary description
- `ipAddress` (string, optional): Client IP
- `createdAt` (ISO 8601 string)

---

## 5. Security Architecture & Firestore Rules

All data is guarded using an Attribute-Based Access Control (ABAC) fortress in `firestore.rules`:

1. **Global Default Deny**: All unmapped paths are closed by default.
2. **Super Admin Access**: Super Admins identified via verified administrative emails (`admin@gdgranchi.in`) or user role lookups have full moderation permissions.
3. **Participant Boundary Isolation**: Participants can only read public games, view public leaderboards, and update their own profiles.
4. **Score Immutability from Clients**: The `game_results` and `score_update_logs` collections strictly reject client writes; only authenticated Super Admin backend calls can modify scores.

---

## 6. Business Logic & Invariants

### 6.1 Unique Participant ID Generation

Every participant receives a sequential human-readable identifier upon registration:

```text
GDG26-0001
GDG26-0002
...
GDG26-1000
```

Generated via an atomic counter in the data store to guarantee strict uniqueness and zero collisions.

### 6.2 Participant Status Lifecycle

- **`ACTIVE`**: Participant can login, register for games, submit entries, and appear on leaderboards.
- **`DISABLED`**: Participant is blocked from login and game interactions.
- **Historical Preservation**: Disabling a participant never purges their historical submissions, score logs, or past registrations.

### 6.3 Duplicate Registration Protection

The backend validates:

- `game_registrations` query for `gameId + participantId` (Individual)
- `game_registrations` query for `gameId + teamId` (Team)
  If a match exists, a `409 ConflictError` is returned immediately.

### 6.4 Initial Score Integrity Policy

Upon game submission:

- `score` is initialized to **`0`**.
- `points` is initialized to **`0`**.
- `verified` is set to **`false`**.
  Participants can never set or alter their own score.

### 6.5 Super Admin Score Moderation

- Validates `0 <= score <= game.maxScore`.
- Writes immutable entry to `score_update_logs`.
- Updates `game_results`.
- Atomically recalculates the participant's `totalPoints` (sum of verified points).
- If team game, atomically recalculates team's `totalPoints`.

### 6.6 Deterministic Tie-Breaker Algorithm

When participants have identical total points, the leaderboard sorts deterministically:

1. **Higher Total Points** (Primary)
2. **Higher Highest Single Game Score** (Tie-breaker 1)
3. **More Completed Games** (Tie-breaker 2)
4. **Earlier Final Submission Timestamp** (Tie-breaker 3)

Podium winners are tagged with:

- 🥇 Rank 1: **Winner**
- 🥈 Rank 2: **Runner-up**
- 🥉 Rank 3: **Third Place**

---

## 7. Event-Day Operational Runbook

### Phase 1: Pre-Event (Before Event Begins)

1. Verify Cloud Firestore Enterprise connectivity via `/health`.
2. Ensure seeded Super Admin account (`admin@gdgranchi.in`) is functional.
3. Review and configure initial DevFest games with title, maxScore, and set status to `UPCOMING` or `ACTIVE`.
4. Run integration test suite (`npm test`) to verify all 61 tests pass.

### Phase 2: Live Event (During DevFest)

1. Public participants register via `/api/v1/auth/register` and receive Participant IDs.
2. Super Admin activates games (`PATCH /api/v1/games/:id/status` with `status: "ACTIVE"`).
3. Participants register and submit solutions.
4. Organizers evaluate submissions and assign scores via `/api/v1/admin/results/:id/score`.
5. Public and participants monitor `/api/v1/leaderboard` for live rank updates.

### Phase 3: Post-Event (Event Conclusion)

1. Super Admin closes games (`status: "CLOSED"`).
2. Review final score update audit logs via `/api/v1/admin/score-logs`.
3. Verify final podium winners via `/api/v1/leaderboard/top3`.
4. Issue cryptographically verifiable digital certificates via `/api/v1/admin/certificates/issue`.
5. Winners and attendees verify credentials publicly via `/api/v1/certificates/verify/:hash`.
