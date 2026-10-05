# Participant & Game Management System

## 1. Overview

This system will manage **participants, games, game registrations, game submissions, scores, and the leaderboard** for GDG Ranchi DevFest 2026.

The system will have only **two roles**:

1. **Super Admin**
2. **Participant**

The system will be independent of Commudle. Participants can register themselves through the website, while the Super Admin manages participants, games, and scores.

The main goal is to keep the system **simple, reliable, and easy to operate during the event**.

---

# 2. Main System Flow

```text
                    GDG Ranchi Game System
                             │
              ┌──────────────┴──────────────┐
              │                             │
         SUPER ADMIN                   PARTICIPANT
              │                             │
      Manage Participants              Register Account
      Manage Games                     View Games
      Manage Registrations             Register for Game
      Manage Submissions               Submit Game
      Update Scores                    View Own Results
      View Leaderboard                 View Leaderboard
              │                             │
              └──────────────┬──────────────┘
                             │
                         LEADERBOARD
```

---

# 3. Roles

## 3.1 Super Admin

The Super Admin has complete control over the game management system.

### Super Admin can:

- Login to admin dashboard
- View all participants
- Search participants
- Edit participants
- Disable participants
- Enable participants
- Create games
- Edit games
- Activate games
- Close games
- View game registrations
- View game submissions
- Update participant scores
- View participant game history
- View leaderboard
- Manage final event data

---

# 4. Participant

Participants use the public website/dashboard.

### Participant can:

- Register their account
- Enter personal information
- View their participant profile
- View available games
- Register for games
- Submit completed games
- View their registered games
- View submitted games
- View scores
- View total points
- View leaderboard
- View their current rank

Participants **cannot**:

- Edit their game score
- Create games
- Edit other participants
- Disable participants
- Manage the leaderboard
- Manage other users

---

# 5. Participant Registration

Participants can register themselves through a public registration form.

### Registration form

```text
Name *
Email *
Mobile Number *
Organization
City
Profile Photo
Other required information
Password *
Confirm Password *
```

After successful registration:

```text
Registration
     ↓
Create Participant Account
     ↓
Generate Participant ID
     ↓
Participant Dashboard
```

---

# 6. Participant ID

Every participant should receive a unique Participant ID.

Example:

```text
GDG26-0001
GDG26-0002
GDG26-0003
```

The Participant ID can be used internally to identify a participant.

It should be:

- Unique
- Easy to read
- Stable
- Never reused

Example:

```text
Participant ID: GDG26-0042
Name: Abhishek Kumar
Email: abhishek@example.com
```

---

# 7. Participant Status

Participants should not be permanently deleted by default.

Instead, use a status.

```text
ACTIVE
DISABLED
```

### Active

The participant can:

- Login
- Register for games
- Submit games
- View results

### Disabled

The participant cannot:

- Login
- Register for new games
- Submit games

However, their previous registrations and scores remain stored.

This protects historical event data.

---

# 8. Participant Dashboard

After login, the participant sees a simple dashboard.

```text
┌─────────────────────────────────────┐
│ Welcome, Abhishek                   │
│ Participant ID: GDG26-0042          │
├─────────────────────────────────────┤
│ Total Games       5                 │
│ Completed Games   3                 │
│ Total Points      240               │
│ Current Rank      #12               │
└─────────────────────────────────────┘
```

### Dashboard sections

- Profile
- Available Games
- My Games
- My Results
- Leaderboard

---

# 9. Games

The Super Admin creates and manages games.

A game can contain:

```text
Game Name
Description
Maximum Score
Start Time
End Time
Status
```

Example:

```text
Game Name: Tech Quiz

Description:
Test your knowledge of technology and programming.

Maximum Score: 100

Start Time: 10:00 AM
End Time: 11:00 AM

Status: ACTIVE
```

---

# 10. Game Status

Every game should have a status.

```text
UPCOMING
ACTIVE
CLOSED
```

### UPCOMING

The game has not started yet.

Participants can see the game but cannot submit it.

### ACTIVE

The game is currently available.

Participants can register and submit the game.

### CLOSED

The game has ended.

New registrations/submissions should not be allowed.

---

# 11. Create Game

Only the Super Admin can create games.

Example:

```text
Create Game

Game Name: Coding Challenge

Description:
Solve the given programming challenges.

Maximum Score: 100

Start Time: 2:00 PM
End Time: 3:00 PM

Status: UPCOMING
```

After creation:

```text
Game
 ↓
UPCOMING
 ↓
ACTIVE
 ↓
CLOSED
```

---

# 12. Manage Games

The Super Admin can:

- Create game
- Edit game
- Change game status
- View registrations
- View submissions
- View results
- Close game

Example admin table:

| Game             | Max Score | Registrations | Submissions | Status   |
| ---------------- | --------: | ------------: | ----------: | -------- |
| Tech Quiz        |       100 |           450 |         430 | Closed   |
| Coding Challenge |       100 |           320 |         300 | Active   |
| Memory Game      |        50 |           280 |           0 | Upcoming |

---

# 13. Game Registration

A participant can register for an available game.

```text
Participant Dashboard
        ↓
Available Games
        ↓
Select Game
        ↓
Register
        ↓
Registration Successful
```

Example:

```text
Tech Quiz

Maximum Score: 100
Status: ACTIVE

[ Register for Game ]
```

---

# 14. Duplicate Registration Protection

A participant must not be able to register for the same game twice.

For example:

```text
Abhishek → Tech Quiz → Registered
```

If Abhishek tries again:

```text
Already Registered
```

The backend must enforce this rule.

---

# 15. Game Submission

After registering and playing the game, the participant submits the game.

Example:

```text
Tech Quiz
     ↓
Start Game
     ↓
Complete Game
     ↓
Submit Game
```

After submission:

```text
Status: SUBMITTED
Score: 0
Points: 0
```

The initial score should be **0 by default**.

The Super Admin can later update the actual score.

---

# 16. Score Management

Only the Super Admin can change scores.

Example:

```text
Participant: Abhishek Kumar
Game: Tech Quiz

Current Score: 0

Maximum Score: 100

New Score: 85

[Update Score]
```

After update:

```text
Score: 85
Points: 85
```

---

# 17. Score Validation

The backend must validate the score.

If:

```text
Maximum Score = 100
```

Then:

```text
0 ≤ Score ≤ 100
```

Invalid:

```text
Score = 120
```

The backend should reject it.

The score should never be trusted only from the frontend.

---

# 18. Score and Points

The system should store both **score** and **points**.

For a simple implementation:

```text
Score = 85
Points = 85
```

This gives flexibility if the event later wants different scoring rules.

For example:

```text
Game Score = 80
Leaderboard Points = 100
```

The current implementation can simply use:

```text
Points = Score
```

unless a different game-specific rule is required.

---

# 19. Participant Game History

Every participant should be able to see their game history.

Example:

```text
My Games

Game                Score    Points    Status
------------------------------------------------
Tech Quiz             85       85      Submitted
Memory Game            70       70      Submitted
Coding Challenge       0        0       Registered
Puzzle Game            95       95      Submitted
```

At the bottom:

```text
Total Games: 4
Completed Games: 3
Total Points: 250
```

---

# 20. Search Participant

The Super Admin should be able to search participants.

Search using:

- Participant ID
- Name
- Email
- Mobile number

Example:

```text
Search: GDG26-0042
```

Result:

```text
Abhishek Kumar
GDG26-0042
abhishek@example.com
9876543210
```

---

# 21. Participant Details Page

The Super Admin should be able to open a participant profile.

```text
Participant Details
────────────────────────────

Name: Abhishek Kumar
Participant ID: GDG26-0042
Email: abhishek@example.com
Mobile: 9876543210
Organization: NexGen Studio
City: Ranchi

Status: ACTIVE

Game History
────────────────────────────

Game              Score    Points
Tech Quiz           85       85
Memory Game         70       70
Coding Challenge     0        0

Total Points: 155
```

The participant's profile image can also be displayed.

---

# 22. Manage Participants

The Super Admin can view all participants.

Example:

| Participant ID | Name  | Email                                         | Mobile   | Games | Points | Status   |
| -------------- | ----- | --------------------------------------------- | -------- | ----: | -----: | -------- |
| GDG26-0001     | Rahul | [rahul@example.com](mailto:rahul@example.com) | 98xxxxxx |     4 |    280 | Active   |
| GDG26-0002     | Priya | [priya@example.com](mailto:priya@example.com) | 97xxxxxx |     3 |    210 | Active   |
| GDG26-0003     | Amit  | [amit@example.com](mailto:amit@example.com)   | 96xxxxxx |     2 |    120 | Disabled |

Actions:

```text
View
Edit
Disable
Enable
```

---

# 23. Leaderboard

The leaderboard shows participants ranked by total points.

Example:

| Rank | Participant | Games | Total Points |
| ---: | ----------- | ----: | -----------: |
|    1 | Rahul       |     5 |          450 |
|    2 | Priya       |     5 |          420 |
|    3 | Amit        |     5 |          390 |
|    4 | Abhishek    |     4 |          350 |

The leaderboard should automatically update when scores change.

---

# 24. Ranking Calculation

The basic ranking rule:

```text
Total Points =
Game 1 Points
+ Game 2 Points
+ Game 3 Points
+ ...
```

Example:

```text
Tech Quiz          80
Memory Game        70
Coding Challenge   90
Puzzle Game        60
----------------------
Total Points      300
```

Leaderboard:

```text
ORDER BY total_points DESC
```

---

# 25. Tie-Breaker

Tie-breaking should be decided **before the event**.

Recommended order:

```text
1. Higher Total Points
2. Higher Highest Game Score
3. More Completed Games
4. Earlier Final Submission
```

For example:

```text
Rahul       300 points
Abhishek    300 points
```

Then compare the next tie-breaker.

This avoids confusion when deciding the top 3 winners.

---

# 26. Top 3 Winners

The final leaderboard determines the winners.

```text
🥇 Rank 1 → Winner
🥈 Rank 2 → Runner-up
🥉 Rank 3 → Third Place
```

The Super Admin should have a final leaderboard view for announcing winners and distributing goodies.

---

# 27. Admin Dashboard

The Super Admin dashboard should provide a quick overview.

```text
┌────────────────────────────────────────────┐
│              ADMIN DASHBOARD               │
├────────────┬────────────┬──────────────────┤
│ Participants│ Games      │ Registrations    │
│     900     │     10     │      4,500       │
├────────────┼────────────┼──────────────────┤
│ Submissions│ Completed  │ Total Points     │
│    4,100    │    4,100   │     350,000      │
└────────────┴────────────┴──────────────────┘
```

Below that:

- Recent registrations
- Recent submissions
- Top participants
- Active games
- Games requiring attention

---

# 28. Recommended Pages

## Public Pages

```text
/
├── Home
├── Register
├── Login
└── Leaderboard
```

## Participant Pages

```text
/dashboard
/profile
/games
/my-games
/my-results
/leaderboard
```

## Super Admin Pages

```text
/admin
/admin/participants
/admin/participants/:id
/admin/games
/admin/games/create
/admin/games/:id
/admin/registrations
/admin/submissions
/admin/scores
/admin/leaderboard
```

---

# 29. Database

For this system, **PostgreSQL** is a good choice.

The expected workload is small.

Even with:

```text
900 participants
10 games
```

The maximum game registrations would roughly be:

```text
900 × 10 = 9,000 registrations
```

This is very small for PostgreSQL.

There is no need to introduce Redis, RabbitMQ, Elasticsearch, microservices, or Kubernetes just for this system.

---

# 30. Main Database Tables

The system can start with these tables:

```text
users
participants
games
game_registrations
game_results
score_update_logs
```

Optional:

```text
activity_logs
email_logs
```

---

# 31. Users Table

Used for authentication.

```text
users

id
name
email
password_hash
role
status
created_at
updated_at
```

Role:

```text
SUPER_ADMIN
PARTICIPANT
```

---

# 32. Participants Table

Stores participant information.

```text
participants

id
participant_id
user_id
name
email
mobile
image_url
organization
city
status
created_at
updated_at
```

Example:

```text
id: UUID
participant_id: GDG26-0042
name: Abhishek Kumar
email: abhishek@example.com
mobile: 9876543210
status: ACTIVE
```

---

# 33. Games Table

```text
games

id
name
description
max_score
status
start_time
end_time
created_at
updated_at
```

Example:

```text
name: Tech Quiz
max_score: 100
status: ACTIVE
```

---

# 34. Game Registrations Table

This connects participants with games.

```text
game_registrations

id
participant_id
game_id
status
registered_at
created_at
updated_at
```

Important database rule:

```text
UNIQUE(participant_id, game_id)
```

This prevents duplicate registration.

---

# 35. Game Results Table

Stores the result of a game.

```text
game_results

id
participant_id
game_id
score
points
status
submitted_at
updated_at
created_at
```

Default:

```text
score = 0
points = 0
```

---

# 36. Score Update Logs

Whenever an admin changes a score, the system should keep a record.

```text
score_update_logs

id
participant_id
game_id
old_score
new_score
old_points
new_points
updated_by
reason
created_at
```

Example:

```text
Old Score: 70
New Score: 80

Updated By: Admin
Reason: Manual evaluation correction
Time: 2026-10-04 15:30
```

This is useful if a score is accidentally changed.

---

# 37. Database Relationship

```text
USER
 │
 └──── PARTICIPANT
          │
          ├──────── GAME REGISTRATION
          │                 │
          │                 └──── GAME
          │
          └──────── GAME RESULT
                            │
                            └──── GAME
```

Simplified:

```text
Participants
     │
     ├────< Game Registrations >──── Games
     │
     └────< Game Results >────────── Games
```

---

# 38. Backend Architecture

Recommended stack:

```text
Frontend
React / Next.js

        ↓

Backend
Node.js
TypeScript
Express

        ↓

ORM
Prisma

        ↓

Database
PostgreSQL
```

External services:

```text
Participant Image
       ↓
Cloudinary

Email
       ↓
Email Provider
```

---

# 39. Backend Structure

A simple structure is enough.

```text
src/
│
├── modules/
│   ├── auth/
│   ├── participants/
│   ├── games/
│   ├── registrations/
│   ├── results/
│   └── leaderboard/
│
├── middleware/
│   ├── auth.ts
│   └── role.ts
│
├── database/
│
├── utils/
│
├── routes/
│
├── app.ts
└── server.ts
```

Keep modules separated by responsibility.

---

# 40. Authentication

Participants and Super Admin both need authentication.

Recommended:

```text
Email
+
Password
```

Passwords must never be stored directly.

Store:

```text
password_hash
```

Use a secure password hashing algorithm such as Argon2 or bcrypt.

---

# 41. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Example:

```text
Participant
    ↓
GET /games
    ✓

Participant
    ↓
POST /games
    ✗

Super Admin
    ↓
POST /games
    ✓
```

Every protected backend operation should check the user's role.

---

# 42. Important Backend Rules

The backend should enforce:

### Rule 1

Disabled participants cannot perform game actions.

### Rule 2

Participant cannot register twice for the same game.

### Rule 3

Participant cannot update their own score.

### Rule 4

Only Super Admin can update scores.

### Rule 5

Score cannot exceed maximum score.

### Rule 6

Closed games cannot accept new submissions.

### Rule 7

Leaderboard must use server-side data.

### Rule 8

Participant can only view their own private profile/results.

### Rule 9

Participant ID must be unique.

### Rule 10

Important admin changes should be logged.

---

# 43. API Plan

## Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

## Participant

```text
GET    /participants/me
PATCH  /participants/me
GET    /participants/me/games
GET    /participants/me/results
```

## Admin Participants

```text
GET    /admin/participants
GET    /admin/participants/:id
PATCH  /admin/participants/:id
PATCH  /admin/participants/:id/status
```

## Games

```text
GET    /games
GET    /games/:id
```

## Admin Games

```text
POST   /admin/games
PATCH  /admin/games/:id
PATCH  /admin/games/:id/status
DELETE /admin/games/:id
```

Instead of physically deleting an important game, it may be safer to close/archive it.

## Game Registration

```text
POST /games/:gameId/register
GET  /my-games
```

## Game Submission

```text
POST /games/:gameId/submit
```

## Admin Results

```text
GET   /admin/results
GET   /admin/results/:id
PATCH /admin/results/:id/score
```

## Leaderboard

```text
GET /leaderboard
```

---

# 44. Game Lifecycle

A game follows this lifecycle:

```text
CREATE
  ↓
UPCOMING
  ↓
ACTIVE
  ↓
CLOSED
```

Participant:

```text
Available
    ↓
Registered
    ↓
Playing
    ↓
Submitted
    ↓
Score Updated
    ↓
Completed
```

---

# 45. Complete Participant Flow

```text
Participant visits website
          ↓
      Register
          ↓
    Account created
          ↓
 Participant ID generated
          ↓
       Login
          ↓
 Participant Dashboard
          ↓
     View Games
          ↓
 Select available game
          ↓
     Register Game
          ↓
       Play Game
          ↓
    Submit Game
          ↓
 Score = 0 initially
          ↓
 Super Admin evaluates
          ↓
 Score updated
          ↓
 Points calculated
          ↓
 Leaderboard updated
          ↓
 Participant sees result
```

---

# 46. Complete Admin Flow

```text
Super Admin Login
       ↓
Admin Dashboard
       ↓
Manage Participants
       ↓
Manage Games
       ↓
Participants Register
       ↓
Participants Submit Games
       ↓
Admin Views Submissions
       ↓
Admin Updates Scores
       ↓
Points Updated
       ↓
Leaderboard Updated
       ↓
Final Top 3
```

---

# 47. Event-Day Workflow

The system should be designed for fast operation during the event.

### Before Event

```text
Create games
Configure maximum scores
Check participant registration
Test admin dashboard
Test game registration
Test score updates
Take database backup
```

### During Event

```text
Participant registers
        ↓
Participant joins game
        ↓
Participant submits game
        ↓
Admin checks submission
        ↓
Admin updates score
        ↓
Leaderboard updates
```

### After Event

```text
Close games
     ↓
Verify scores
     ↓
Verify leaderboard
     ↓
Confirm Top 3
     ↓
Distribute goodies
     ↓
Final database backup
```

---

# 48. Dashboard Statistics

Super Admin should see:

```text
Total Participants
Active Participants
Disabled Participants

Total Games
Active Games
Closed Games

Total Registrations
Total Submissions

Total Points
Top 3 Participants
```

---

# 49. Performance Requirements

The system does not require complicated infrastructure.

Expected scale:

```text
Participants: ~900
Games: ~10
Registrations: ~9,000 maximum
Results: ~9,000 maximum
```

A small PostgreSQL instance can easily handle this workload.

The bigger concern is not database performance.

The important things are:

- Correct database constraints
- Good validation
- Reliable authentication
- Backups
- Stable hosting
- Simple admin UI

---

# 50. Recommended Infrastructure

Simple production setup:

```text
                Internet
                   │
                   ↓
             Web Application
                   │
                   ↓
             Node.js API
                   │
                   ↓
              PostgreSQL
```

Optional:

```text
Participant Photo
       ↓
Cloudinary

Email
       ↓
Email Provider
```

For this event, avoid unnecessary services such as:

```text
RabbitMQ       ❌
Redis          ❌
Kafka          ❌
Microservices  ❌
Kubernetes     ❌
Elasticsearch  ❌
```

A simple application is easier to maintain and safer during an event.

---

# 51. Backup Strategy

Because this system contains participant and game results, backups are important.

Recommended:

```text
Before Event
     ↓
Database Backup
     ↓
During Event
     ↓
Periodic Backup
     ↓
After Event
     ↓
Final Backup
```

At minimum, keep a reliable database backup before the event begins.

---

# 52. Security

The system should include:

- HTTPS
- Password hashing
- Secure authentication tokens/cookies
- Role-based authorization
- Input validation
- Rate limiting for authentication
- Server-side score validation
- Unique database constraints
- Secure environment variables
- Database backups
- Protection against unauthorized admin access

Never put:

```text
DATABASE_URL
JWT_SECRET
EMAIL_PASSWORD
CLOUDINARY_SECRET
```

inside frontend code.

---

# 53. What Participants Can See

Participants should have a clean experience.

```text
Dashboard
│
├── My Profile
│
├── Available Games
│
├── My Games
│
├── My Results
│
└── Leaderboard
```

They should not see admin functionality.

---

# 54. What Super Admin Can See

```text
Admin Dashboard
│
├── Participants
│
├── Games
│
├── Registrations
│
├── Submissions
│
├── Scores
│
└── Leaderboard
```

---

# 55. Important UX Rules

Because this will be used during a live event:

### Keep registration fast

Avoid unnecessary fields.

### Show clear status

For example:

```text
Registered ✓
Submitted ✓
Score Pending
Score: 85
```

### Prevent accidental actions

For example:

```text
Are you sure you want to disable this participant?
```

### Make scores obvious

```text
Current Score: 85 / 100
```

### Make leaderboard easy to understand

```text
Rank | Name | Games | Points
```

---

# 56. Error Handling

The system should show simple messages.

Instead of:

```text
UNIQUE_CONSTRAINT_VIOLATION
```

Show:

```text
You are already registered for this game.
```

Instead of:

```text
FORBIDDEN
```

Show:

```text
You don't have permission to perform this action.
```

Instead of:

```text
BAD_REQUEST
```

Show the actual problem.

---

# 57. Development Plan

## Phase 1 — Project Setup

```text
Frontend
Backend
PostgreSQL
Prisma
Environment configuration
```

## Phase 2 — Authentication

```text
Register
Login
Logout
Role management
Protected routes
```

## Phase 3 — Participants

```text
Participant profile
Participant ID
Admin participant management
Enable/disable participant
Search
```

## Phase 4 — Games

```text
Create game
Edit game
Game status
Maximum score
Game listing
```

## Phase 5 — Game Registration

```text
Register for game
Duplicate protection
My games
Registration status
```

## Phase 6 — Game Submission

```text
Submit game
Submission status
Default score = 0
Admin submission list
```

## Phase 7 — Scores

```text
Admin score update
Score validation
Points calculation
Score update history
```

## Phase 8 — Leaderboard

```text
Total points
Ranking
Tie-breaker
Top 3
```

## Phase 9 — Dashboard

```text
Admin statistics
Participant dashboard
Game statistics
Recent activity
```

## Phase 10 — Testing

Test:

```text
Registration
Login
Participant permissions
Admin permissions
Game registration
Duplicate registration
Game submission
Score update
Invalid score
Leaderboard
Disabled participant
```

## Phase 11 — Deployment

```text
Production database
Production backend
Production frontend
HTTPS
Environment variables
Backups
Monitoring
```

---

# 58. Final Architecture

```text
                    ┌───────────────────────┐
                    │       WEBSITE         │
                    │   React / Next.js     │
                    └───────────┬───────────┘
                                │
                                │ HTTPS
                                ↓
                    ┌───────────────────────┐
                    │       BACKEND         │
                    │ Node.js + TypeScript  │
                    │       Express         │
                    └───────────┬───────────┘
                                │
                                ↓
                    ┌───────────────────────┐
                    │      PostgreSQL       │
                    │                       │
                    │ Users                 │
                    │ Participants          │
                    │ Games                 │
                    │ Registrations         │
                    │ Results               │
                    │ Score Logs             │
                    └───────────────────────┘
                         │             │
                         │             │
                         ↓             ↓
                    Cloudinary       Email
```

---

# 59. Final Role Structure

There are only **two roles**.

```text
SUPER ADMIN
│
├── Manage Participants
│   ├── View
│   ├── Search
│   ├── Edit
│   ├── Disable
│   └── Enable
│
├── Manage Games
│   ├── Create
│   ├── Edit
│   ├── Activate
│   └── Close
│
├── Manage Registrations
│
├── Manage Submissions
│
├── Update Scores
│
└── View Leaderboard
```

```text
PARTICIPANT
│
├── Register
├── Login
├── View Profile
├── View Games
├── Register for Games
├── Submit Games
├── View Own Games
├── View Own Scores
├── View Total Points
└── View Leaderboard
```

---

# 60. Final Feature Checklist

## Super Admin

- [x] Login
- [x] Dashboard
- [x] Manage participants
- [x] Edit participants
- [x] Disable participants
- [x] Enable participants
- [x] Search participants
- [x] Create games
- [x] Manage games
- [x] Activate/close games
- [x] View registrations
- [x] View submissions
- [x] Update scores
- [x] Score defaults to 0
- [x] Score validation
- [x] Score update history
- [x] View leaderboard
- [x] Final Top 3

## Participant

- [x] Self registration
- [x] Login
- [x] Participant ID
- [x] Profile
- [x] View available games
- [x] Register for games
- [x] Submit games
- [x] View registered games
- [x] View submitted games
- [x] View individual scores
- [x] View total games
- [x] View total points
- [x] View leaderboard
- [x] View current rank

---

# 61. Final Recommended Stack

```text
Frontend
React / Next.js
TypeScript

Backend
Node.js
Express
TypeScript

Database
PostgreSQL

ORM
Prisma

Authentication
JWT / Secure Cookie
Argon2 or bcrypt

Images
Cloudinary

Email
Resend / Brevo / SMTP

Hosting
Small VPS / Render / Similar

Version Control
Git + GitHub
```

The architecture should remain a **single application** initially.

---

# 62. Core Principle

The most important principle for this project is:

> **Keep the system simple enough that the GDG Ranchi team can operate it easily during the event.**

We do not need a complicated distributed architecture for approximately 900 participants.

The core system is simply:

```text
Participants
      ↓
Games
      ↓
Registrations
      ↓
Submissions
      ↓
Scores
      ↓
Points
      ↓
Leaderboard
      ↓
Top 3 Winners
```

Everything else exists to make this flow secure, reliable, and easy to manage.

---

# 63. Final System Summary

```text
                GDG RANCHI DEVFEST 2026
                         │
              Participant Registration
                         │
                         ↓
                  Participant ID
                         │
                         ↓
                  Participant Login
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        View Available Games    View Leaderboard
              │
              ↓
        Register for Game
              │
              ↓
          Play Game
              │
              ↓
        Submit Game
              │
              ↓
        Score = 0 initially
              │
              ↓
         SUPER ADMIN
              │
              ↓
         Update Score
              │
              ↓
        Calculate Points
              │
              ↓
          Leaderboard
              │
              ↓
          ┌───┴───┐
          ↓       ↓
       Rank 1   Rank 2   Rank 3
          │       │       │
          └───────┴───────┘
                  ↓
             TOP 3 WINNERS
```

## Final Scope

**2 roles**

**6 core database concepts**

```text
Users
Participants
Games
Registrations
Results
Score Logs
```

**1 backend**

**1 PostgreSQL database**

**1 participant flow**

**1 leaderboard**

**No unnecessary microservices.**
