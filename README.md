# GDG Ranchi DevFest 2026 — Participant & Game Management Backend

[![Node.js Version](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Package Manager](https://img.shields.io/badge/pnpm-10+-orange.svg)](https://pnpm.io/)
[![Database](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/Prisma-5.22-teal.svg)](https://www.prisma.io/)
[![Code Style](https://img.shields.io/badge/Code%20Style-Prettier-ff69b4.svg)](https://prettier.io)
[![Linter](https://img.shields.io/badge/Linter-ESLint-4B32C3.svg)](https://eslint.org)
[![Git Hooks](https://img.shields.io/badge/Git%20Hooks-Husky-darkgreen.svg)](https://typicode.github.io/husky)

Production-grade, lightweight backend API designed to manage **participants, games, game registrations, game submissions, scores, and the real-time leaderboard** for **GDG Ranchi DevFest 2026**.

The project structure is modeled after [CommDesk-Backend](https://github.com/NexGenStudioDev/CommDesk-Backend), featuring domain-modular organization, strict role-based access control, comprehensive validations, and automated Git hooks.

---

## 📖 Detailed Implementation Plan

A comprehensive architectural and operational blueprint is documented in:
👉 [Implementation Plan README](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/doc/implementation-plan/README.md)

---

## 🚀 Key Features

- **Two Strict Roles**:
  - **Super Admin**: Manage participants, create and control game lifecycles (`UPCOMING`, `ACTIVE`, `CLOSED`), update participant scores with audit logging, view full metrics dashboard, and declare Top 3 winners.
  - **Participant**: Public registration, unique persistent ID (`GDG26-XXXX`), join available games, submit game results, and track personal ranking.
- **Deterministic Tie-Breaker Leaderboard**:
  1. Higher Total Points
  2. Higher Highest Game Score
  3. More Completed Games
  4. Earlier Final Submission Timestamp
- **Zero Score Defaults**: New game submissions are recorded with `score = 0` until vetted and scored by Super Admin.
- **Duplicate Registration Guard**: PostgreSQL unique constraints guarantee that participants cannot register for the same game twice.
- **Event Data Integrity**: Participants can be enabled or disabled without ever deleting historical event scores and logs.
- **Lightweight & High Performance**: Clean Express + Prisma architecture on PostgreSQL — no heavy microservices or message broker overhead needed for ~900 live participants.

---

## 📂 Folder Structure

The project follows the established modular architecture of `CommDesk-Backend`:

```text
├── .dockerignore
├── .env.example
├── .gitignore
├── .husky/
│   └── pre-commit
├── .lintstagedrc.json
├── .prettierignore
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
├── eslint.config.mjs
├── jest.config.ts
├── package.json
├── tsconfig.json
│
├── doc/
│   ├── README.md
│   └── implementation-plan/
│       └── README.md
│
├── prisma/
│   └── schema.prisma
│
└── src/
    ├── Scripts/
    │   └── seed.ts
    ├── api/
    │   └── v1/
    │       ├── Auth/             # Register, Login, JWT, Roles
    │       ├── Participant/      # Profile, Status, ID Gen, History
    │       ├── Game/             # Game CRUD, Lifecycle Transitions
    │       ├── Registration/     # Game Join, Duplicate Protection
    │       ├── Submission/       # Game Submissions, Default 0
    │       ├── Score/            # Score Moderation, Range Checks, Audit
    │       └── Leaderboard/      # Server Aggregate, Tie-Breaker, Podium
    ├── constants/
    │   ├── env.constant.ts
    │   └── error.constant.ts
    ├── core/
    │   ├── database/             # PostgreSQL Pool & Prisma Client
    │   └── logger/               # Structured logging
    ├── doc/                      # CommDesk-style feature markdown docs
    ├── infrastructure/
    │   ├── email/                # SMTP / Transactional Mail
    │   └── storage/              # Cloudinary Profile Media
    ├── middleware/
    │   ├── auth.middleware.ts    # JWT Verification
    │   ├── role.middleware.ts    # RBAC Enforcement
    │   ├── error.middleware.ts   # Centralized Error Handler
    │   └── validate.middleware.ts# Zod Schema Validator
    ├── routes/
    │   └── routes.ts             # Central Route Aggregator
    ├── shared/
    │   └── errors/
    │       └── AppError.ts       # Custom Application Error
    ├── utils/
    │   ├── response.util.ts      # Standardized Response Wrapper
    │   ├── token.util.ts         # JWT Sign & Verify Utilities
    │   └── participantId.util.ts # Atomic GDG26-XXXX Generator
    ├── app.ts                    # Express Application Factory
    └── server.ts                 # HTTP Server Bootstrapper
```

---

## 🛠️ Tech Stack & Tooling

| Layer / Tool         | Technology                 |
| :------------------- | :------------------------- |
| **Package Manager**  | `pnpm`                     |
| **Language**         | TypeScript (ES2022)        |
| **Framework**        | Express.js                 |
| **Database**         | PostgreSQL 16              |
| **ORM**              | Prisma ORM                 |
| **Authentication**   | JWT + Bcrypt               |
| **Validation**       | Zod                        |
| **Code Formatter**   | Prettier                   |
| **Linter**           | ESLint + TypeScript ESLint |
| **Git Hooks**        | Husky + lint-staged        |
| **Testing**          | Jest + ts-jest + Supertest |
| **Containerization** | Docker & Docker Compose    |

---

## ⚡ Quick Start Guide

### 1. Prerequisites

- Node.js `>= 20.x`
- `pnpm` `>= 9.x`
- PostgreSQL database or Docker

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd Devfest-Game

# Install packages using pnpm
pnpm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your connection details:

```bash
cp .env.example .env
```

### 4. Database Setup with Prisma

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run Database Migrations
pnpm prisma:migrate
```

### 5. Running the Application

```bash
# Development Mode (with hot-reload via nodemon & ts-node)
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Start Production Server
pnpm start
```

---

## 🧪 Testing, Linting & Formatting

```bash
# Run unit & integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Check linting errors
pnpm lint

# Automatically fix linting errors
pnpm lint:fix

# Format all files using Prettier
pnpm format
```

---

## 🐳 Docker Setup

Run PostgreSQL and the API service in isolated containers:

```bash
# Start PostgreSQL and Backend API
docker compose up -d

# Check running status
docker compose ps
```

---

## 👥 Event Roles & Permissions

- **Super Admin**:
  - Default seeded account credentials configured in `.env`.
  - Has complete event moderation access to all games, participants, and scoring tables.
- **Participant**:
  - Self-service registration through public web form.
  - Receives auto-generated `participant_id` (e.g., `GDG26-0042`).
  - Restricted from scoring or modifying other users.

---

## 📄 License

Developed for **GDG Ranchi DevFest 2026**. Released under the ISC License.
