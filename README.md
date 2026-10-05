# GDG Ranchi DevFest 2026 — Participant & Game Management Backend

[![Node.js Version](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/Cloud%20Firestore-Enterprise%20Native-orange.svg)](https://firebase.google.com/docs/firestore)
[![Authentication](https://img.shields.io/badge/Firebase%20Auth-Admin%20SDK-yellow.svg)](https://firebase.google.com/docs/auth)
[![Storage](https://img.shields.io/badge/Cloud%20Storage-Firebase-blue.svg)](https://firebase.google.com/docs/storage)
[![Validation](https://img.shields.io/badge/Validation-Zod-3.25-purple.svg)](https://zod.dev)

High-performance, event-ready backend system designed for **GDG Ranchi DevFest 2026** to manage **800–1,000 participants, competitive games, team collaboration, registrations, submissions, score moderation, real-time deterministic tie-breaker leaderboards, cryptographic certificates, and administrative audit trails**.

Built with **Node.js, TypeScript, Express, and Google Cloud / Firebase Admin SDK** using **Cloud Firestore Enterprise (Native Mode)** as the primary database.

---

## 🏛️ Architecture & Services

- **Primary Database**: Cloud Firestore Enterprise — Native Mode (Project: `gdg-ranchi-f44c9`, Database: `ai-studio-devfestgame-ca5cb9b4-9f77-480c-b389-e5947a48e0d6`)
- **Authentication**: JWT & Firebase Admin Auth
- **Storage**: Firebase Storage / Google Cloud Storage for participant avatars and certificates
- **Validation**: Strict schema runtime validation via Zod
- **Roles**: Two strict roles — `SUPER_ADMIN` and `PARTICIPANT`
- **Zero ORM Overhead**: Direct native Firestore Enterprise collections and documents; No Prisma, No PostgreSQL, No SQL bottlenecks.

---

## 🚀 Core Features

### 1. Participant Self-Service & Profile Management

- Public self-registration form (`Name`, `Email`, `Mobile`, `Organization`, `City`, `Password`, `Confirm Password`).
- Auto-generates unique, human-readable, sequential Participant ID (`GDG26-0001`, `GDG26-0002`, ...).
- Participant status: `ACTIVE` or `DISABLED` (disabled participants cannot register or submit, but their historical scores remain preserved).
- Private dashboard summary (`Total Games`, `Completed Games`, `Total Points`, `Current Rank`).

### 2. Team Collaboration

- Participants can create teams (generates unique invite code e.g. `GDG-5281`).
- Other participants join using the team code (up to 6 members).
- Support for team games and shared team scoring.

### 3. Games Catalog & Lifecycle

- Super Admin controls game lifecycle: `UPCOMING` → `ACTIVE` → `CLOSED`.
- Maximum score per game is strictly configured and validated.
- Support for both `INDIVIDUAL` and `TEAM` game formats.

### 4. Duplicate Registration & Submission Protection

- Strict atomic validation ensures participants and teams can register for an active game only once.
- Participants cannot submit without registering first.
- Participants cannot submit twice for the same game.
- Closed or upcoming games automatically reject registrations and submissions.

### 5. Score Moderation & Initial Score Policy

- New submissions automatically default to `Score = 0`, `Points = 0` until vetted by Super Admin.
- Only Super Admin can evaluate submissions and assign scores.
- Strict server-side bounds check: `0 <= Score <= MaxScore`.
- Immutable audit logging in `score_update_logs` recording `oldScore`, `newScore`, `oldPoints`, `newPoints`, `updatedBy`, `reason`, and timestamp.
- Participant and team `totalPoints` are atomically recalculated.

### 6. Deterministic Tie-Breaker Leaderboards

- **Individual Leaderboard**: Ranks all participants using pre-event tie-breaking criteria:
  1. Higher `Total Points` (Primary)
  2. Higher `Highest Single Game Score` (Tie-breaker 1)
  3. More `Completed Games` (Tie-breaker 2)
  4. Earlier `Final Submission Timestamp` (Tie-breaker 3)
- **Top 3 Winners**: Identifies 🥇 Rank 1 Winner, 🥈 Rank 2 Runner-up, 🥉 Rank 3 Third Place.
- **Team Leaderboard**: Ranks teams by accumulated team points.

### 7. Cryptographic Certificates

- Super Admin can issue verifiable completion and winner certificates.
- Generates unique Certificate No (`GDG26-CERT-0001`) and tamper-proof SHA-256 verification hash.
- Public certificate verification endpoint (`/api/v1/certificates/verify/:hash`).

### 8. Admin Audit & Activity Logs

- Comprehensive audit trail recording registrations, logins, status changes, score updates, and certificate issuances.

---

## 📂 Project Directory Structure

```text
├── .env.example                     # Environment variables template
├── firebase-applet-config.json      # Google Cloud / Firebase provisioned credentials
├── firebase-blueprint.json          # Intermediate schema blueprint for Firestore
├── firestore.rules                  # Hardened ABAC security rules for Firestore Enterprise
├── package.json                     # Node.js dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── doc/
│   ├── README.md                    # Documentation index
│   └── implementation-plan.md       # Comprehensive 98-section system implementation blueprint
├── src/
│   ├── app.ts                       # Express application factory & middleware setup
│   ├── server.ts                    # HTTP server bootstrapper (Port 3000, 0.0.0.0)
│   ├── api/v1/
│   │   ├── Admin/                   # Admin dashboard metrics, participant moderation, logs
│   │   ├── Auth/                    # Register, login, logout, current user profile
│   │   ├── Certificate/             # Issue, verify, list participant certificates
│   │   ├── Game/                    # Game catalog & CRUD endpoints
│   │   ├── Leaderboard/             # Individual, Top 3 podium, and Team leaderboards
│   │   ├── Participant/             # My profile, stats, avatar upload
│   │   ├── Registration/            # Game registration & /my-games
│   │   ├── Score/                   # Score evaluation, result listings, score audit logs
│   │   ├── Submission/              # Game submissions & /my-submissions
│   │   └── Team/                    # Team creation, invite code join, team details
│   ├── constants/
│   │   ├── env.constant.ts          # Zod-validated environment configuration
│   │   └── error.constant.ts        # Centralized user-friendly error messages
│   ├── core/
│   │   ├── database/
│   │   │   ├── firestore.ts         # Firebase Admin SDK & native Firestore Enterprise init
│   │   │   ├── firestore.store.ts   # Collection operations, atomic counters, resilient store
│   │   │   └── db.config.ts         # Connection lifecycle, Super Admin seed, default games
│   │   └── logger/
│   │       └── logger.ts            # Structured application logging
│   ├── infrastructure/
│   │   ├── email/mailer.ts          # SMTP transactional email service
│   │   └── storage/firebase.ts      # Cloud Storage / Firebase Storage avatar upload
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT Bearer & Cookie authentication
│   │   ├── role.middleware.ts       # RBAC role authorization (SUPER_ADMIN vs PARTICIPANT)
│   │   ├── error.middleware.ts      # Centralized error handler
│   │   └── validate.middleware.ts   # Zod request payload validation
│   ├── routes/
│   │   └── routes.ts                # Main API v1 routing orchestrator
│   ├── services/                    # Domain business logic services
│   ├── shared/
│   │   ├── errors/AppError.ts       # Operational error subclasses (400, 401, 403, 404, 409)
│   │   └── types/game.types.ts      # TypeScript interfaces for all Firestore documents
│   ├── utils/
│   │   ├── response.util.ts         # Standardized API response format
│   │   └── token.util.ts            # JWT signing and verification
│   └── validator/                   # Zod schemas for all request payloads
└── tests/
    ├── app.test.ts                  # Health & basic route tests
    ├── db.test.ts                   # Database connection lifecycle tests
    ├── env.test.ts                  # Zod environment variable parsing tests
    ├── game-system.test.ts          # End-to-end integration test suite (30 scenarios)
    ├── middleware.test.ts           # Middleware unit tests
    └── utils.test.ts                # Utilities & Error class unit tests
```

---

## 📡 REST API Reference

All routes are mounted under `/api/v1`.

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint                | Description                            | Access        |
| :----- | :---------------------- | :------------------------------------- | :------------ |
| `POST` | `/api/v1/auth/register` | Self-register new participant account  | Public        |
| `POST` | `/api/v1/auth/login`    | Login with email and password          | Public        |
| `POST` | `/api/v1/auth/logout`   | Clear authentication token cookie      | Public        |
| `GET`  | `/api/v1/auth/me`       | Get current authenticated user details | Authenticated |

### 2. Participant Profile (`/api/v1/participants`)

| Method  | Endpoint                        | Description                             | Access      |
| :------ | :------------------------------ | :-------------------------------------- | :---------- |
| `GET`   | `/api/v1/participants/me`       | Get personal profile, stats, and rank   | Participant |
| `PATCH` | `/api/v1/participants/me`       | Update name, mobile, organization, city | Participant |
| `POST`  | `/api/v1/participants/me/photo` | Upload profile photo to Cloud Storage   | Participant |

### 3. Games Catalog (`/api/v1/games`)

| Method  | Endpoint                     | Description                                         | Access        |
| :------ | :--------------------------- | :-------------------------------------------------- | :------------ |
| `GET`   | `/api/v1/games`              | List all games with participant registration status | Public / Auth |
| `GET`   | `/api/v1/games/:id`          | Get details and stats for a single game             | Public / Auth |
| `POST`  | `/api/v1/games/:id/register` | Register for active game (duplicate protected)      | Participant   |
| `POST`  | `/api/v1/games/:id/submit`   | Submit game entry (initial score defaults to 0)     | Participant   |
| `POST`  | `/api/v1/games`              | Create new game                                     | Super Admin   |
| `PATCH` | `/api/v1/games/:id`          | Update game parameters                              | Super Admin   |
| `PATCH` | `/api/v1/games/:id/status`   | Change status (`UPCOMING`, `ACTIVE`, `CLOSED`)      | Super Admin   |

### 4. Participant Games & Submissions Shortcuts

| Method | Endpoint                 | Description                                      | Access      |
| :----- | :----------------------- | :----------------------------------------------- | :---------- |
| `GET`  | `/api/v1/my-games`       | List games participant has registered for        | Participant |
| `GET`  | `/api/v1/my-submissions` | List submitted entries with current score status | Participant |

### 5. Teams (`/api/v1/teams`)

| Method | Endpoint               | Description                                    | Access        |
| :----- | :--------------------- | :--------------------------------------------- | :------------ |
| `POST` | `/api/v1/teams/create` | Create a team and receive a unique invite code | Participant   |
| `POST` | `/api/v1/teams/join`   | Join team using invite code (e.g. `GDG-1234`)  | Participant   |
| `GET`  | `/api/v1/teams/me`     | Get team members and leader details            | Participant   |
| `GET`  | `/api/v1/teams`        | List competitive teams                         | Public / Auth |

### 6. Leaderboards (`/api/v1/leaderboard`)

| Method | Endpoint                    | Description                                   | Access |
| :----- | :-------------------------- | :-------------------------------------------- | :----- |
| `GET`  | `/api/v1/leaderboard`       | Full individual leaderboard with tie-breakers | Public |
| `GET`  | `/api/v1/leaderboard/top3`  | Top 3 podium winners (🥇, 🥈, 🥉)             | Public |
| `GET`  | `/api/v1/leaderboard/teams` | Team leaderboard ranked by total points       | Public |

### 7. Certificates (`/api/v1/certificates`)

| Method | Endpoint                            | Description                                    | Access      |
| :----- | :---------------------------------- | :--------------------------------------------- | :---------- |
| `GET`  | `/api/v1/certificates/verify/:hash` | Publicly verify certificate authenticity       | Public      |
| `GET`  | `/api/v1/certificates/my`           | Get participant's issued certificates          | Participant |
| `POST` | `/api/v1/admin/certificates/issue`  | Issue cryptographically verifiable certificate | Super Admin |

### 8. Super Admin Operations (`/api/v1/admin`)

| Method  | Endpoint                                | Description                                         | Access      |
| :------ | :-------------------------------------- | :-------------------------------------------------- | :---------- |
| `GET`   | `/api/v1/admin/dashboard/stats`         | Event metrics, active/closed counts, top 3          | Super Admin |
| `GET`   | `/api/v1/admin/participants`            | Search participants by ID, Name, Email, Mobile      | Super Admin |
| `GET`   | `/api/v1/admin/participants/:id`        | View full participant profile & game history        | Super Admin |
| `PATCH` | `/api/v1/admin/participants/:id/status` | Enable or disable participant (`ACTIVE`/`DISABLED`) | Super Admin |
| `GET`   | `/api/v1/admin/results`                 | List all game results for evaluation                | Super Admin |
| `PATCH` | `/api/v1/admin/results/:id/score`       | Update score with range check & audit log           | Super Admin |
| `GET`   | `/api/v1/admin/score-logs`              | Immutable audit trail of score modifications        | Super Admin |
| `GET`   | `/api/v1/admin/registrations`           | View all registrations across games                 | Super Admin |
| `GET`   | `/api/v1/admin/submissions`             | View all submitted game entries                     | Super Admin |
| `GET`   | `/api/v1/admin/logs`                    | Administrative and security activity audit logs     | Super Admin |

---

## ⚡ Quick Start & Running Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default Super Admin credentials seeded automatically on initial boot:

- **Email**: `admin@gdgranchi.in`
- **Password**: `AdminPass@2026`

### 3. Run Development Server

```bash
npm run dev
```

Server runs on port **3000** (`http://0.0.0.0:3000`).

### 4. Health Check

```bash
curl http://localhost:3000/health
```

### 5. Run Test Suite

```bash
npm test
```

Executes all 6 test suites and 61 tests validating complete game flows.

### 6. Code Formatting & Linting

```bash
npm run lint
npm run format
```

---

## 📄 License

Developed for **GDG Ranchi DevFest 2026**. Released under the ISC License.
