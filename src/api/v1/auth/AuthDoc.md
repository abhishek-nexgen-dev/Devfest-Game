# GDG Ranchi DevFest 2026 — Authentication Module Specification

Comprehensive architectural and API reference for the **Admin & Super Admin Authentication and Authorization** subsystem powering the **GDG Ranchi DevFest 2026 Game Backend**.

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Roles & Permissions (RBAC)](#2-roles--permissions-rbac)
3. [PostgreSQL Database & Schema](#3-postgresql-database--schema)
4. [Token & Cookie Session Handling](#4-token--cookie-session-handling)
5. [Standardized Response Utility (`SendResponse`)](#5-standardized-response-utility-sendresponse)
6. [API Endpoints Reference](#6-api-endpoints-reference)
   - [POST /api/v1/init-admin](#post-apiv1init-admin)
   - [POST /api/v1/auth/login](#post-apiv1authlogin)
   - [POST /api/v1/add-admin](#post-apiv1add-admin)
   - [GET /api/v1/me](#get-apiv1me)
   - [POST /api/v1/change-password](#post-apiv1change-password)
   - [GET /api/v1/verify](#get-apiv1verify)
   - [POST /api/v1/logout](#post-apiv1logout)
7. [Middleware Guards](#7-middleware-guards)
8. [Error Codes & Centralized Constants](#8-error-codes--centralized-constants)
9. [Testing & Verification](#9-testing--verification)

---

## 1. Overview & Architecture

The Authentication module is exclusively dedicated to **`SUPER_ADMIN`** and **`ADMIN`** accounts (no public signup). All data persistence is backed by **PostgreSQL** using parameterized `pg.query(...)` calls inside [`AuthUtils.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/auth/AuthUtils.ts).

### Technology Stack

- **Runtime**: Node.js v22+ with TypeScript 5.9
- **Database**: PostgreSQL 17 via `pg` (`Pool` in [`src/core/database/postgres.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/core/database/postgres.ts))
- **Token Format**: HMAC SHA-256 JWT (`jsonwebtoken`)
- **Password Hashing**: Bcrypt (`bcryptjs`) with 10 salt rounds
- **Schema Validation**: Runtime validation via Zod 3.25
- **Response Formatting**: Centralized [`SendResponse`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/utils/SendResponse.ts) (`SuccessResponse` & `ErrorResponse`)
- **Package Manager**: `pnpm`

### Directory Structure

```text
src/
├── api/v1/auth/
│   ├── Auth.type.ts         # AuthRole ('SUPER_ADMIN' | 'ADMIN'), IUserDoc, JWT payload types
│   ├── Auth.schema.ts       # PostgreSQL DDL for the `users` table, indexes, and triggers
│   ├── Auth.validation.ts   # Zod validation schemas (addAdmin, login, changePassword)
│   ├── AuthUtils.ts         # Direct parameterized pg.query helpers, Bcrypt & JWT utilities
│   ├── Auth.Service.ts      # Business logic (initSuperAdmin, login, addAdmin, changePassword)
│   ├── Auth.controller.ts   # Express controller using throw new Error + SendResponse
│   ├── Auth.router.ts       # Express routes for Super Admin & Admin auth
│   ├── auth.constants.ts    # Roles, messages, cookie options, and route constants
│   └── AuthDoc.md           # Module specification & API reference
├── core/database/
│   ├── postgres.ts          # PostgreSQL connection pool & auto-database creation
│   └── schema.ts            # Global schema runner (AuthSchema, Participants_Schema)
└── utils/
    └── SendResponse.ts      # Standardized SuccessResponse (200) & ErrorResponse (500)
```

---

## 2. Roles & Permissions (RBAC)

The authentication module strictly enforces two administrative roles:

| Role              | Limit        | Target Users            | Allowed Actions                                                                                          |
| :---------------- | :----------- | :---------------------- | :------------------------------------------------------------------------------------------------------- |
| **`SUPER_ADMIN`** | **Only 1**   | Lead Organizer          | Full system authority: Initialize Super Admin once, create `ADMIN` accounts, manage all games and users. |
| **`ADMIN`**       | Configurable | Event Organizers & Team | Manage games, participants, scores, leaderboards, and certificates; cannot create other Admin accounts.  |

### Account Statuses

- **`ACTIVE`**: Account is permitted to sign in and access protected endpoints.
- **`DISABLED`**: Account is blocked from signing in or verifying sessions.

---

## 3. PostgreSQL Database & Schema

### 3.1 Global Schema Initialization ([`src/core/database/schema.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/core/database/schema.ts))

On server startup ([`src/server.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/server.ts)), `connectDatabase()` verifies/creates the PostgreSQL database (`devfest_game_db`) and `initSchemas()` executes all table schemas:

```typescript
export const initSchemas = async (): Promise<void> => {
  await AuthSchema();
  await Games_Schema();
  await Participants_Schema();
};
```

### 3.2 `users` Table DDL ([`src/api/v1/auth/Auth.schema.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/auth/Auth.schema.ts))

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL
    CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
```

An automatic `BEFORE UPDATE` PL/pgSQL trigger (`trigger_users_updated_at`) updates `updated_at = NOW()` on every row modification.

---

## 4. Token & Cookie Session Handling

The system supports dual-transport JWT authentication:

1. **HTTP Authorization Header**:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```
2. **HTTP-Only Cookie**:
   - **Cookie Name**: `token`
   - **HttpOnly**: `true`
   - **SameSite**: `lax`
   - **Max-Age**: 7 days (`604800000` ms)
   - **Secure**: `true` in `production`

### JWT Payload Structure

```json
{
  "userId": "admin-super-001",
  "email": "admin@gdgranchi.in",
  "role": "SUPER_ADMIN",
  "iat": 1791222089,
  "exp": 1791826889
}
```

---

## 5. Standardized Response Utility (`SendResponse`)

All controllers and auth middlewares return responses through [`SendResponse`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/utils/SendResponse.ts) and use `throw new Error(...)` inside `try / catch` blocks:

```typescript
class SendResponse {
  static SuccessResponse(res: Response, data: unknown, message: string) {
    res.status(200).json({
      success: true,
      status: true,
      message,
      data,
    });
  }

  static ErrorResponse(res: Response, error: unknown, message: string) {
    res.status(500).json({
      success: false,
      status: false,
      message,
      error,
    });
  }
}
```

---

## 6. API Endpoints Reference

Base Prefix: `/api/v1`

---

### POST `/api/v1/init-admin`

Initialize the single **`SUPER_ADMIN`** account using credentials from `.env` (`INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`).
Strictly enforces that **only 1 Super Admin** can exist in PostgreSQL — calling this endpoint again throws an error.

- **Access**: Public (One-time initialization)

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Super Admin initialized successfully.",
  "data": {
    "user": {
      "id": "admin-super-001",
      "name": "GDG Ranchi Super Admin",
      "email": "admin@gdgranchi.in",
      "role": "SUPER_ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-10-07T18:00:00.000Z",
      "updatedAt": "2026-10-07T18:00:00.000Z"
    }
  }
}
```

#### Error Response when Super Admin Already Exists (`500`)

```json
{
  "success": false,
  "message": "Only one Super Admin is allowed. Super Admin account already exists.",
  "error": {}
}
```

#### cURL Example

```bash
curl -X POST http://0.0.0.0:3000/api/v1/init-admin
```

---

### POST `/api/v1/auth/login`

Authenticate a `SUPER_ADMIN` or `ADMIN` user with email and password.

- **Access**: Public
- **Headers**: `Content-Type: application/json`

#### Request Body

```json
{
  "email": "admin@gdgranchi.in",
  "password": "AdminPass@2026"
}
```

#### Success Response (`200 OK`)

Sets `Set-Cookie: token=<JWT>; HttpOnly; Path=/; SameSite=Lax`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "admin-super-001",
      "name": "GDG Ranchi Super Admin",
      "email": "admin@gdgranchi.in",
      "role": "SUPER_ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-10-07T18:00:00.000Z",
      "updatedAt": "2026-10-07T18:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (`500`)

```json
{
  "success": false,
  "message": "Invalid email or password.",
  "error": {}
}
```

#### cURL Example

```bash
curl -X POST http://0.0.0.0:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gdgranchi.in",
    "password": "AdminPass@2026"
  }'
```

---

### POST `/api/v1/add-admin`

Create a new `ADMIN` user account. Exclusively accessible by **`SUPER_ADMIN`**.

- **Access**: Protected (`authenticate`, `authorizeRoles("SUPER_ADMIN")`)
- **Headers**: `Authorization: Bearer <SUPER_ADMIN_TOKEN>`, `Content-Type: application/json`

#### Request Body

```json
{
  "name": "DevFest Admin",
  "email": "eventadmin@gdgranchi.in",
  "password": "AdminEvent2026"
}
```

#### Validation Rules

- `name`: 2 to 100 characters, trimmed.
- `email`: Valid email address, normalized to lowercase, unique in `users` table.
- `password`: 8 to 128 characters.

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Admin account created successfully.",
  "data": {
    "user": {
      "id": "adm-1791394800000-x8k2p",
      "name": "DevFest Admin",
      "email": "eventadmin@gdgranchi.in",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-10-07T18:10:00.000Z",
      "updatedAt": "2026-10-07T18:10:00.000Z"
    }
  }
}
```

#### Error Responses (`500`)

- Duplicate email:
  ```json
  {
    "success": false,
    "message": "An account with this email address already exists.",
    "error": {}
  }
  ```
- Non-Super Admin caller:
  ```json
  {
    "success": false,
    "message": "You do not have permission to access this resource.",
    "error": {}
  }
  ```

#### cURL Example

```bash
curl -X POST http://0.0.0.0:3000/api/v1/add-admin \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevFest Admin",
    "email": "eventadmin@gdgranchi.in",
    "password": "AdminEvent2026"
  }'
```

---

### GET `/api/v1/me`

Fetch the currently authenticated `SUPER_ADMIN` or `ADMIN` profile.

- **Access**: Protected (`authenticate`)
- **Headers**: `Authorization: Bearer <TOKEN>` or Cookie

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Current user profile fetched successfully.",
  "data": {
    "id": "admin-super-001",
    "name": "GDG Ranchi Super Admin",
    "email": "admin@gdgranchi.in",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-10-07T18:00:00.000Z",
    "updatedAt": "2026-10-07T18:00:00.000Z",
    "user": {
      "id": "admin-super-001",
      "name": "GDG Ranchi Super Admin",
      "email": "admin@gdgranchi.in",
      "role": "SUPER_ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-10-07T18:00:00.000Z",
      "updatedAt": "2026-10-07T18:00:00.000Z"
    }
  }
}
```

---

### POST `/api/v1/change-password`

Change the password of the currently authenticated `SUPER_ADMIN` or `ADMIN`.

- **Access**: Protected (`authenticate`)
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`

#### Request Body

```json
{
  "oldPassword": "AdminEvent2026",
  "newPassword": "NewAdminPass2027",
  "confirmNewPassword": "NewAdminPass2027"
}
```

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": null
}
```

---

### GET `/api/v1/verify`

Verify that the current JWT token is valid and the user account is `ACTIVE` in PostgreSQL.

- **Access**: Protected (`authenticate`)
- **Headers**: `Authorization: Bearer <TOKEN>` or Cookie

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Session token is valid.",
  "data": {
    "valid": true,
    "user": {
      "id": "admin-super-001",
      "name": "GDG Ranchi Super Admin",
      "email": "admin@gdgranchi.in",
      "role": "SUPER_ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-10-07T18:00:00.000Z",
      "updatedAt": "2026-10-07T18:00:00.000Z"
    }
  }
}
```

---

### POST `/api/v1/logout`

Clear the `token` HTTP-only session cookie.

- **Access**: Public

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

## 7. Middleware Guards

Implemented in [`src/middleware/auth.middleware.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/middleware/auth.middleware.ts):

- **`authenticate`**: Extracts JWT from `Authorization: Bearer <token>` or `req.cookies.token`, verifies signature, and attaches `req.user` and `req.token`. Throws `Error` caught via `SendResponse.ErrorResponse` if missing or expired.
- **`optionalAuth`**: Attaches `req.user` if a valid token is present without blocking unauthenticated requests.
- **`authorizeRoles(...roles: string[])`**: Verifies `req.user.role` is included in `roles` (e.g. `authorizeRoles("SUPER_ADMIN")`), otherwise throws `Error(AuthConstants.MESSAGES.FORBIDDEN)` and responds via `SendResponse.ErrorResponse`.

---

## 8. Error Codes & Centralized Constants

Defined in [`src/api/v1/auth/auth.constants.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/src/api/v1/auth/auth.constants.ts):

```typescript
export class AuthConstants {
  public static readonly ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
  } as const;

  public static readonly USER_STATUS = {
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
  } as const;

  public static readonly MESSAGES = {
    LOGIN_SUCCESS: "Login successful.",
    LOGOUT_SUCCESS: "Logged out successfully.",
    PROFILE_FETCHED: "Current user profile fetched successfully.",
    PASSWORD_CHANGED: "Password changed successfully.",
    SESSION_VALID: "Session token is valid.",
    ADMIN_SEEDED: "Super Admin initialized successfully.",
    ADMIN_ADDED: "Admin account created successfully.",
    ADMIN_ALREADY_EXISTS: "Only one Super Admin is allowed. Super Admin account already exists.",
    ONLY_ONE_ADMIN_ALLOWED: "Only 1 Admin account is allowed.",
    EMAIL_ALREADY_EXISTS: "An account with this email address already exists.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    ACCOUNT_DISABLED: "Your account is disabled.",
    USER_NOT_FOUND: "Admin user account not found.",
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

Run the test suite in [`tests/auth.test.ts`](file:///home/abhishek-nexgen-dev/Desktop/Danger%20Zone/Devfest-Game/tests/auth.test.ts):

```bash
# Run Jest unit & integration tests
pnpm test

# Type-check with TypeScript compiler
pnpm tsc --noEmit

# Build production bundle
pnpm build
```
