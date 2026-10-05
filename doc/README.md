# GDG Ranchi DevFest 2026 Documentation

This directory contains the architectural documentation, data models, and operational implementation plan for the **GDG Ranchi DevFest 2026 Participant & Game Management Backend**.

## Documentation Index

- **[Auth Module Architecture & API Specification](../src/api/v1/Auth/AuthDoc.md)**:
  Detailed OOP Domain documentation for Authentication & Authorization, covering:
  - Class responsibilities (`AuthConstant`, `AuthUtils`, `AuthValidator`, `AuthService`, `AuthController`, `AuthRouter`, `AuthDoc`)
  - Endpoints (`/register`, `/login`, `/logout`, `/me`, `/change-password`)
  - Request/response contracts, bcrypt hashing (10 salt rounds), JWT session handling
  - Audit logging in Cloud Firestore `activity_logs`

- **[Implementation Plan](./implementation-plan.md)**:
  Comprehensive system blueprint covering:
  1. System Overview & Core Principles
  2. Cloud Firestore Enterprise (Native Mode) Architecture
  3. Super Admin & Participant Role RBAC Specifications
  4. Public Self-Registration & Atomic Participant ID Generation (`GDG26-0001`...)
  5. Participant Status Lifecycle (`ACTIVE` vs `DISABLED`) & Historical Data Protection
  6. Competitive Team Framework, Invite Codes & Shared Scoring
  7. Games Catalog, Lifecycles (`UPCOMING`, `ACTIVE`, `CLOSED`) & Constraints
  8. Duplicate Registration Protection & Validation Gates
  9. Game Submission Flow & Default Score = 0 Integrity Guarantee
  10. Score Moderation, Server-Side Bounds Enforcement & Immutable Audit Trails
  11. Deterministic Tie-Breaker Leaderboard Algorithms & Top 3 Podium Selection
  12. Cryptographic Certificate Issuance & Public SHA-256 Verification Hash
  13. Cloud Firestore Collections, Schemas, & Security Rules
  14. Firebase Authentication & Cloud Storage Integration
  15. Real-Time Admin Dashboard Metrics & Security Audit Logs
  16. Event-Day Operational Runbook (Before, During, and After Event)
