# GDG Ranchi DevFest 2026 — Authentication Module Specification

Comprehensive architectural and API reference for the Authentication and Authorization subsystem powering the **GDG Ranchi DevFest 2026 Participant & Game Management Backend**.

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Roles & Permissions (RBAC)](#2-roles--permissions-rbac)
3. [Cloud Firestore Collections & Schemas](#3-cloud-firestore-collections--schemas)
4. [Sequential Participant ID Generation](#4-sequential-participant-id-generation)
5. [Token & Cookie Session Handling](#5-token--cookie-session-handling)
6. [API Endpoints Reference](#6-api-endpoints-reference)
   - [POST /api/v1/auth/register](#post-apiv1authregister)
   - [POST /api/v1/auth/login](#post-apiv1authlogin)
   - [GET /api/v1/auth/me](#get-apiv1authme)
   - [POST /api/v1/auth/change-password](#post-apiv1authchange-password)
   - [GET /api/v1/auth/verify](#get-apiv1authverify)
   - [POST /api/v1/auth/logout](#post-apiv1authlogout)
   - [POST /api/v1/auth/init-admin](#post-apiv1authinit-admin)
7. [Middleware Guards](#7-middleware-guards)
8. [Error Codes & Centralized Constants](#8-error-codes--centralized-constants)
9. [Testing & Verification](#9-testing--verification)

---

## 1. Overview & Architecture

The Authentication module provides secure, production-grade identity management tailored for 800–1,000 active DevFest participants and administrative organizers.

### Technology Stack

- **Runtime**: Node.js v22+ with TypeScript 5.9
- **Database**: Cloud Firestore Enterprise — Native Mode (with MongoDB compatibility)
- **Token Format**: HMAC SHA-256 JWT (`jsonwebtoken`)
- **Password Hashing**: Bcrypt (`bcryptjs`) with 10 salt rounds
- **Schema Validation**: Runtime assertion via Zod 3.25
- **Package Manager**: Exclusively managed via `pnpm`

### Directory Structure

```text
src/api/v1/auth/
├── Auth.type.ts         # User, Participant, JWT payload TypeScript definitions
├── Auth.schema.ts       # Typed Firestore collections (Users, Participants, SignUp)
├── Auth.validation.ts   # Zod validation schemas (signUp, login, changePassword)
├── AuthUtils.ts         # Bcrypt, JWT, sequential ID generator, resilient store
├── Auth.Service.ts      # Domain business logic (signUp, login, changePassword)
├── Auth.controller.ts   # HTTP Controller handling requests, responses, cookies
├── Auth.router.ts       # Express router endpoints
└── auth.constants.ts    # Roles, error codes, cookie options, status constants
```

---

## 2. Roles & Permissions (RBAC)

The system enforces two strict roles:

| Role              | Target Users           | Allowed Actions                                                                                    |
| :---------------- | :--------------------- | :------------------------------------------------------------------------------------------------- |
| **`SUPER_ADMIN`** | Organizers & Core Team | Full access: Seed admin, moderate scores, close games, inspect audit logs, ban users.              |
| **`PARTICIPANT`** | DevFest Attendees      | Self-registration, team creation/join, game registration, entry submission, certificate retrieval. |

### Account Statuses

- **`ACTIVE`**: Full platform participation permitted.
- **`DISABLED`**: Access revoked by admin; historical submissions and points are safely preserved.
- **`SUSPENDED`**: Temporary block during investigation.

---

## 3. Cloud Firestore Collections & Schemas

The authentication module interfaces with the following native Firestore collections:

### 3.1 `users` Collection

Stores authentication credentials and account metadata.

```typescript
interface IUserDoc {
  id: string; // Primary user UUID: 'usr-<timestamp>-<hash>'
  uid?: string; // Firebase Auth UID (if service account configured)
  email: string; // Normalized lowercase email (Unique index)
  passwordHash: string; // Bcrypt hash (10 salt rounds)
  role: "SUPER_ADMIN" | "PARTICIPANT";
  status: "ACTIVE" | "DISABLED" | "SUSPENDED";
  createdAt: string; // ISO 8601 Timestamp
  updatedAt: string; // ISO 8601 Timestamp
}
```

### 3.2 `participants` Collection

Stores event-specific profile information linked to a user account.

```typescript
interface IParticipantDoc {
  id: string; // Primary UUID: 'part-<timestamp>-<hash>'
  userId: string; // Foreign Key referencing users.id
  participantId: string; // Human-readable sequential ID: 'GDG26-0001'
  uid?: string; // Firebase Auth UID
  name: string; // Full display name
  email: string; // Normalized email
  mobile: string; // 10-digit mobile number
  organization?: string | null; // University, company, or community
  city?: string | null; // Hometown / location
  profilePhoto?: string | null; // Cloud Storage avatar URL
  status: "ACTIVE" | "DISABLED";
  totalPoints: number; // Cumulative score points (default: 0)
  completedGames: number; // Total verified completed games (default: 0)
  highestSingleScore?: number; // Tie-breaker metric
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 `signup` Collection

Provides fast $O(1)$ indexing by `participantId`.

### 3.4 `activityLogs` Collection

Immutable audit trail capturing all authentication actions:

- `USER_REGISTERED`
- `USER_LOGIN`
- `PASSWORD_CHANGED`
- `ADMIN_SEEDED`

---

## 4. Sequential Participant ID Generation

Every registered participant receives an event badge identifier following the convention:

$$\text{Format: } \mathbf{GDG26\text{-}XXXX}$$

- Examples: `GDG26-0001`, `GDG26-0002`, `GDG26-0010`
- **Algorithm**:
  1. Inspects highest numerical suffix in `participants` collection matching `GDG26-(\d+)`.
  2. Increments highest counter by 1 ($N = N_{\max} + 1$).
  3. Left-pads number to 4 digits (`String(N).padStart(4, "0")`).

---

## 5. Token & Cookie Session Handling

The system implements a **dual-transport authentication strategy**:

1. **HTTP Authorization Header**:

   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```

2. **HTTP-Only Secure Cookie**:
   - **Name**: `token`
   - **HttpOnly**: `true` (immune to Cross-Site Scripting / XSS extraction)
   - **SameSite**: `lax`
   - **Max-Age**: `604800000` (7 days)
   - **Secure**: Enabled in `production` environment

### JWT Payload Structure

```json
{
  "userId": "usr-1791222089564-9e4fl",
  "email": "abhishek@example.com",
  "role": "PARTICIPANT",
  "participantId": "GDG26-0001",
  "iat": 1791222089,
  "exp": 1791826889
}
```

---

## 6. API Endpoints Reference

Base Path: `/api/v1/auth`

---

### POST `/api/v1/auth/register`

Self-register a new DevFest participant account. _(Alias: `/api/v1/auth/signup`)_

- **Access**: Public
- **Headers**: `Content-Type: application/json`

#### Request Body

```json
{
  "name": "Abhishek Kumar",
  "email": "abhishek@example.com",
  "mobile": "9876543210",
  "organization": "GDG Ranchi",
  "city": "Ranchi",
  "profilePhoto": "",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```

#### Validation Rules

- `name`: 2 to 100 characters, trimmed.
- `email`: Valid email format, normalized to lowercase, unique in database.
- `mobile`: Valid 10-digit Indian phone number (`/^(?:\+91)?[6-9]\d{9}$/`).
- `password`: Minimum 8 characters, maximum 128 characters.
- `confirmPassword`: Must match `password` identically.

#### Success Response (`201 Created`)

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "usr-1791222089564-9e4fl",
      "email": "abhishek@example.com",
      "role": "PARTICIPANT",
      "status": "ACTIVE",
      "createdAt": "2026-10-05T17:41:29.564Z",
      "updatedAt": "2026-10-05T17:41:29.564Z"
    },
    "participant": {
      "id": "part-1791222089564-l5e51",
      "userId": "usr-1791222089564-9e4fl",
      "participantId": "GDG26-0001",
      "name": "Abhishek Kumar",
      "email": "abhishek@example.com",
      "mobile": "9876543210",
      "organization": "GDG Ranchi",
      "city": "Ranchi",
      "profilePhoto": null,
      "status": "ACTIVE",
      "totalPoints": 0,
      "completedGames": 0,
      "createdAt": "2026-10-05T17:41:29.564Z",
      "updatedAt": "2026-10-05T17:41:29.564Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

- **`400 Bad Request`**: Validation failure (e.g. invalid phone number, password mismatch):

  ```json
  { "success": false, "message": "Passwords do not match" }
  ```

- **`409 Conflict`**: Email already registered:

  ```json
  { "success": false, "message": "An account with this email address already exists." }
  ```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Abhishek Kumar",
    "email": "abhishek@example.com",
    "mobile": "9876543210",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123"
  }'
```

---

### POST `/api/v1/auth/login`

Authenticate participant or Super Admin credentials. _(Alias: `/api/v1/auth/signin`)_

- **Access**: Public
- **Headers**: `Content-Type: application/json`

#### Request Body

```json
{
  "email": "abhishek@example.com",
  "password": "SecurePassword123"
}
```

#### Success Response (`200 OK`)

Sets `Set-Cookie: token=...; HttpOnly; SameSite=Lax; Path=/`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { ... },
    "participant": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

- **`401 Unauthorized`**:

  ```json
  { "success": false, "message": "Invalid email or password." }
  ```

- **`403 Forbidden`**:

  ```json
  { "success": false, "message": "Your account is disabled. Please contact GDG Ranchi organizers." }
  ```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abhishek@example.com",
    "password": "SecurePassword123"
  }'
```

---

### GET `/api/v1/auth/me`

Fetch current authenticated user and linked participant record.

- **Access**: Protected (`authenticate`)
- **Headers**: `Authorization: Bearer <TOKEN>` or Cookie

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Current user profile fetched successfully.",
  "data": {
    "id": "usr-1791222089564-9e4fl",
    "email": "abhishek@example.com",
    "role": "PARTICIPANT",
    "status": "ACTIVE",
    "createdAt": "2026-10-05T17:41:29.564Z",
    "updatedAt": "2026-10-05T17:41:29.564Z",
    "user": { ... },
    "participant": {
      "participantId": "GDG26-0001",
      "name": "Abhishek Kumar",
      "totalPoints": 0,
      "completedGames": 0
    }
  }
}
```

#### cURL Example

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

### POST `/api/v1/auth/change-password`

Update user account password.

- **Access**: Protected (`authenticate`)
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`

#### Request Body

```json
{
  "oldPassword": "SecurePassword123",
  "newPassword": "NewSecurePassword2026",
  "confirmNewPassword": "NewSecurePassword2026"
}
```

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

#### Error Responses

- **`400 Bad Request`**:

  ```json
  { "success": false, "message": "The current password provided is incorrect." }
  ```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "SecurePassword123",
    "newPassword": "NewSecurePassword2026",
    "confirmNewPassword": "NewSecurePassword2026"
  }'
```

---

### GET `/api/v1/auth/verify`

Verify session token validity and account status.

- **Access**: Protected (`authenticate`)
- **Headers**: `Authorization: Bearer <TOKEN>` or Cookie

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Session token is valid.",
  "data": {
    "valid": true,
    "user": { ... },
    "participant": { ... }
  }
}
```

---

### POST `/api/v1/auth/logout`

Clear session cookie and invalidate local browser state.

- **Access**: Public

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### POST `/api/v1/auth/init-admin`

Seed initial Super Admin account using credentials defined in `.env` (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`). Safe for multiple invocations (idempotent).

- **Access**: Public

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Super Admin initialized successfully."
}
```

---

## 7. Middleware Guards

Implemented in [`src/middleware/auth.middleware.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/middleware/auth.middleware.ts):

### `authenticate`

- Extracts JWT from `Authorization: Bearer <token>` or `req.cookies.token`.

- Verifies signature and expiration using `JWT_SECRET`.
- Attaches decoded payload to `req.user` and token to `req.token`.
- Returns `401 Unauthorized` if token is missing or expired.

### `optionalAuth`

- Silently inspects token if present without halting execution for unauthenticated users.

### `authorizeRoles(...roles: string[])`

- Ensures `req.user.role` matches specified roles (e.g. `authorizeRoles("SUPER_ADMIN")`).

- Returns `403 Forbidden` if user role is insufficient.

---

## 8. Error Codes & Centralized Constants

Exported from [`src/api/v1/auth/auth.constants.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/auth/auth.constants.ts):

```typescript
export class AuthConstants {
  public static readonly ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    PARTICIPANT: "PARTICIPANT",
  } as const;

  public static readonly MESSAGES = {
    REGISTER_SUCCESS: "User registered successfully.",
    LOGIN_SUCCESS: "Login successful.",
    LOGOUT_SUCCESS: "Logged out successfully.",
    PROFILE_FETCHED: "Current user profile fetched successfully.",
    PASSWORD_CHANGED: "Password changed successfully.",
    SESSION_VALID: "Session token is valid.",
    ADMIN_SEEDED: "Super Admin initialized successfully.",

    EMAIL_ALREADY_EXISTS: "An account with this email address already exists.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    ACCOUNT_DISABLED: "Your account is disabled. Please contact GDG Ranchi organizers.",
    USER_NOT_FOUND: "User account not found.",
    INVALID_OLD_PASSWORD: "The current password provided is incorrect.",
    PASSWORDS_DO_NOT_MATCH: "Password and Confirm Password do not match.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    TOKEN_MISSING:
      "Authentication token is missing. Please provide Authorization Bearer header or cookie.",
    TOKEN_EXPIRED: "Authentication token has expired or is invalid.",
    FORBIDDEN: "You do not have permission to access this resource.",
  } as const;
}
```

---

## 9. Testing & Verification

The authentication subsystem includes an automated test suite ([`tests/auth.test.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/tests/auth.test.ts)) covering:

- Unit tests for password hashing & JWT verification
- Zod schema validation edge cases
- Service-level registration, duplicate rejection, and login
- Supertest HTTP integration endpoints

### Run Tests

```bash
pnpm test
```

### Type Check Codebase

```bash
pnpm tsc --noEmit
```

### Production Build

```bash
pnpm build
```
