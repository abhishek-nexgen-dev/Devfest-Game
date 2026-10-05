# GDG Ranchi DevFest 2026

# Games, Teams, Leaderboard & Certificate Management System

## 1. Project Overview

The GDG Ranchi DevFest 2026 Games & Certificate System is an independent platform for managing:

- Participants
- Teams
- Games
- Game registrations
- Game submissions
- Individual scores
- Team scores
- Individual leaderboard
- Team leaderboard
- Certificates
- Certificate verification
- Admin management
- Activity/history

The system will be built using Google/Firebase services with PostgreSQL as the main database.

---

# 2. Final Technology Stack

```text
Firebase
│
├── SQL Connect
│     └── PostgreSQL
│
├── Authentication
│     ├── Participant Login
│     └── Super Admin Login
│
└── Storage
      └── Participant Images / Files / Certificates
```

Application layer:

```text
Frontend
   ↓
Next.js / React
   ↓
Node.js / TypeScript API
   ↓
Firebase SQL Connect
   ↓
PostgreSQL
```

Recommended supporting technologies:

```text
Node.js
TypeScript
Express
Zod
Firebase Admin SDK
PostgreSQL
Firebase SQL Connect
Firebase Authentication
Firebase Storage
```

---

# 3. Why PostgreSQL?

The system has many relationships:

```text
Participant
     │
     ├── Team
     │
     ├── Game Registration
     │
     ├── Submission
     │
     ├── Score
     │
     └── Certificate
```

And:

```text
Team
 │
 ├── Members
 │
 ├── Game Registrations
 │
 ├── Submissions
 │
 └── Team Score
```

This is naturally relational data.

PostgreSQL gives us:

- Foreign keys
- Transactions
- Constraints
- JOINs
- Aggregations
- Ranking queries
- Unique constraints
- Strong data consistency
- Easy reporting
- Easy score calculations

---

# 4. Main System

The complete system has six major areas:

```text
                    DevFest System
                         │
        ┌────────────────┼─────────────────┐
        │                │                 │
        ▼                ▼                 ▼
   Participants       Teams             Games
        │                │                 │
        └────────────────┼─────────────────┘
                         │
                         ▼
                      Scores
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
      Individual Leaderboard   Team Leaderboard
              │                     │
              └──────────┬──────────┘
                         ▼
                    Certificates
```

---

# 5. Roles

Only two roles will exist.

```text
SUPER_ADMIN
PARTICIPANT
```

No separate organizer, moderator, evaluator, or team-admin role is required initially.

---

# 6. Super Admin

Super Admin can:

### Participants

- View participants
- Search participants
- Filter participants
- Edit participants
- Disable participants
- Enable participants
- View participant history
- View participant's team
- View participant's games
- View participant's scores

### Teams

- Create teams
- Edit teams
- Disable teams
- Enable teams
- Add members
- Remove members
- View team members
- View team score
- View team leaderboard position

### Games

- Create games
- Edit games
- Activate games
- Close games
- View registrations
- View submissions
- Update scores
- View game leaderboard

### Certificates

- Generate certificates
- Issue certificates
- Re-generate certificates
- Verify certificates
- View certificate history

### Dashboard

- Total participants
- Total teams
- Total games
- Active games
- Completed games
- Total registrations
- Total submissions
- Total points
- Top participants
- Top teams

---

# 7. Participant

Participant can:

- Register
- Login
- View profile
- View Participant ID
- View team
- View team members
- View available games
- Register for games
- Submit games
- View own submissions
- View own scores
- View team score
- View individual leaderboard
- View team leaderboard
- View certificate
- Download certificate

Participant cannot:

- Edit another participant
- Change scores
- Create games
- Delete games
- Manage teams
- Manage certificates
- Access admin APIs

---

# 8. Participant Registration

Registration form:

```text
Full Name *
Email *
Mobile *
Organization
City
Profile Image
Password *
Confirm Password *
Team
```

Depending on the event rules, team can be:

```text
Join Existing Team
Create Team
No Team
```

The final option depends on whether every participant must belong to a team.

---

# 9. Participant ID

Every participant receives a unique Participant ID.

Example:

```text
GDGR-0001
GDGR-0002
GDGR-0003
```

Participant ID should never change after creation.

It can be used for:

- Participant identification
- Game registration
- Certificate identification
- Admin search
- Certificate verification

---

# 10. Team System

Teams are a first-class entity.

Example:

```text
Team: Code Warriors

Members:
├── Abhishek
├── Rahul
├── Amit
└── Ankit
```

Each team receives a unique Team ID.

Example:

```text
TEAM-001
TEAM-002
TEAM-003
```

---

# 11. Team Rules

Recommended initial rules:

```text
Team
├── Team ID
├── Team Name
├── Team Code
├── Status
├── Created At
└── Updated At
```

Team status:

```text
ACTIVE
DISABLED
```

---

# 12. Team Membership

A participant can belong to one team at a time.

Relationship:

```text
Team
  │
  ├── Participant
  ├── Participant
  ├── Participant
  └── Participant
```

Database relationship:

```text
teams
   │
   └── team_members
             │
             └── participants
```

---

# 13. Team Creation

Depending on the event workflow, there are two possible approaches.

### Option A — Admin Creates Teams

```text
Super Admin
     ↓
Create Team
     ↓
Add Participants
```

### Option B — Participant Creates Team

```text
Participant
     ↓
Create Team
     ↓
Receive Team Code
     ↓
Other Participants Join
```

For an event system where the admin needs strict control, **Option A is safer**.

If self-created teams are required, add approval/status later.

---

# 14. Team Code

Each team can have a unique joining code.

Example:

```text
CW2026
DEVX26
RANCHI01
```

Participant can enter the code:

```text
Team Code
    ↓
Validate
    ↓
Join Team
```

The backend must verify:

- Team exists
- Team is active
- Participant is not already in another team
- Team capacity has not been reached

---

# 15. Game System

Every game is represented as a database record.

Example:

```text
Game
├── ID
├── Name
├── Description
├── Rules
├── Max Score
├── Status
├── Start Time
├── End Time
└── Created By
```

---

# 16. Game Status

Use:

```text
UPCOMING
ACTIVE
CLOSED
```

Flow:

```text
UPCOMING
    ↓
ACTIVE
    ↓
CLOSED
```

---

# 17. Game Types

The system should support both:

```text
INDIVIDUAL
TEAM
```

Example:

```text
Game 1
Type: INDIVIDUAL

Game 2
Type: TEAM
```

This is important.

Not every DevFest game necessarily needs to be played by a team.

---

# 18. Individual Game

Example:

```text
Game:
Tech Quiz

Type:
INDIVIDUAL

Maximum Score:
100
```

Participant registers personally.

```text
Participant
      ↓
Register
      ↓
Submit
      ↓
Score
```

---

# 19. Team Game

Example:

```text
Game:
Treasure Hunt

Type:
TEAM

Maximum Score:
100
```

The team registers.

```text
Team
 ↓
Register
 ↓
Submit
 ↓
Team Score
```

The team score can then be reflected in the team's leaderboard.

---

# 20. Game Registration

For individual games:

```text
Participant → Game
```

For team games:

```text
Team → Game
```

The database must prevent duplicate registration.

---

# 21. Game Submission

Submission depends on game type.

### Individual

```text
Participant
    ↓
Game
    ↓
Submission
```

### Team

```text
Team
    ↓
Game
    ↓
Submission
```

A submission may contain:

```text
Answer
Text
Image
File
URL
Screenshot
Evidence
```

Depending on the game.

---

# 22. Score System

Every score starts with:

```text
0
```

Example:

```text
Game Maximum Score = 100

Initial Score = 0
```

Admin can update:

```text
0 → 50
50 → 75
75 → 90
```

---

# 23. Score Validation

Backend must enforce:

```text
0 <= score <= max_score
```

If:

```text
max_score = 100
```

Then:

```text
score = 90  ✅
score = 100 ✅
score = 101 ❌
score = -10 ❌
```

Never trust the frontend for score validation.

---

# 24. Individual Score

For an individual game:

```text
Participant
     ↓
Game Result
     ↓
Score
```

Example:

```text
Abhishek
Tech Quiz
Score = 80
```

---

# 25. Team Score

For a team game:

```text
Team
 ↓
Game Result
 ↓
Team Score
```

Example:

```text
Code Warriors
Treasure Hunt
Score = 90
```

---

# 26. Team Score Distribution

This needs to be decided before implementation.

Recommended approach:

### Team games

The score belongs to the **team**.

```text
Team Score = 90
```

Do not automatically give 90 points to every member for individual ranking unless the event rules explicitly require it.

Instead maintain:

```text
Team Total
Individual Total
```

separately.

This avoids double-counting.

---

# 27. Leaderboard System

There should be two leaderboards.

```text
LEADERBOARDS
│
├── Individual Leaderboard
│
└── Team Leaderboard
```

---

# 28. Individual Leaderboard

Example:

```text
Rank | Participant | Points
-----+-------------+-------
1    | Abhishek    | 450
2    | Rahul       | 420
3    | Amit        | 390
4    | Ankit       | 350
```

Sort:

```text
Total Points DESC
```

---

# 29. Team Leaderboard

Example:

```text
Rank | Team          | Points
-----+---------------+-------
1    | Code Warriors | 820
2    | Dev Titans    | 760
3    | Bug Hunters   | 710
4    | Tech Ninjas   | 680
```

---

# 30. Team Leaderboard Calculation

For team games:

```text
Team Total =
SUM(all completed team-game scores)
```

Example:

```text
Game 1 = 100
Game 2 = 80
Game 3 = 90

Team Total = 270
```

---

# 31. Individual Leaderboard Calculation

For individual games:

```text
Participant Total =
SUM(all completed individual-game scores)
```

Example:

```text
Game 1 = 90
Game 2 = 70
Game 3 = 80

Total = 240
```

---

# 32. If Team Games Also Affect Individual Ranking

If the event wants team-game points to count toward individual participant ranking, define an explicit rule.

For example:

```text
Team Game Score = 100
Team has 4 members
```

Possible approaches:

### Approach A

Only team gets 100.

```text
Team = +100
Individuals = +0
```

### Approach B

Every member receives 100.

```text
Member 1 = +100
Member 2 = +100
Member 3 = +100
Member 4 = +100
```

### Approach C

Split score.

```text
100 / 4 = 25

Each member = +25
```

For fairness and clarity, **Approach A is recommended unless the event specifically defines another rule.**

---

# 33. Leaderboard Tie Breaker

Recommended:

```text
1. Higher total points
2. Higher highest individual game score
3. More completed games
4. Earlier final submission
```

This should be defined before the event starts.

---

# 34. Top 3 Winners

Team leaderboard:

```text
🥇 Rank 1
🥈 Rank 2
🥉 Rank 3
```

Individual leaderboard can also have:

```text
🥇 Rank 1
🥈 Rank 2
🥉 Rank 3
```

If goodies are specifically for teams, use the team leaderboard as the winner source.

---

# 35. Participant Dashboard

Participant sees:

```text
Welcome, Abhishek

Participant ID
GDGR-0001

Team
Code Warriors

Team Rank
#2

Individual Rank
#5

Total Points
320

Games
10

Completed
7
```

---

# 36. Participant Game History

```text
Game               Type        Status       Score
---------------------------------------------------
Tech Quiz          Individual  Completed    80
Treasure Hunt      Team        Completed    90
Coding Challenge   Individual  Submitted    0
Puzzle Hunt        Team        Registered   0
```

---

# 37. Team Dashboard

A team dashboard should show:

```text
Team: Code Warriors

Team ID: TEAM-001

Members:
- Abhishek
- Rahul
- Amit
- Ankit

Games:
10

Completed:
7

Team Points:
820

Team Rank:
#2
```

---

# 38. Team Game History

```text
Game             Status       Team Score
-----------------------------------------
Treasure Hunt    Completed    90
Puzzle Hunt      Completed    80
Tech Challenge   Submitted    0
```

---

# 39. Super Admin Dashboard

Admin dashboard:

```text
------------------------------------------
Participants             900
Active Participants      880
Disabled Participants     20

Teams                    150

Games                     10
Active Games               2
Closed Games               6

Registrations            5,200
Submissions              4,100

Total Points            320,000
------------------------------------------
```

---

# 40. Admin Participant Search

Search by:

```text
Name
Email
Mobile
Participant ID
Team ID
Team Name
Organization
City
```

Filters:

```text
Active
Disabled
Has Team
No Team
Completed
Incomplete
```

---

# 41. Admin Participant Details

Admin should see:

```text
Participant
├── Basic Information
├── Participant ID
├── Team
├── Team Members
├── Registered Games
├── Submitted Games
├── Scores
├── Total Points
├── Individual Rank
├── Certificate
└── Activity History
```

---

# 42. Admin Team Details

Admin should see:

```text
Team
├── Team ID
├── Team Name
├── Status
├── Members
├── Games
├── Registrations
├── Submissions
├── Scores
├── Total Points
├── Team Rank
└── Activity History
```

---

# 43. Certificate System

Certificates should be part of the same platform.

Certificate flow:

```text
Participant
      ↓
Meets certificate criteria
      ↓
Admin approves/issues
      ↓
Certificate generated
      ↓
PDF stored
      ↓
Participant downloads
```

---

# 44. Certificate Types

Possible types:

```text
PARTICIPATION
GAME_PARTICIPATION
WINNER
TEAM_WINNER
SPECIAL_RECOGNITION
```

Only create the types actually needed for DevFest.

---

# 45. Certificate Number

Every certificate gets a unique certificate number.

Example:

```text
GDG-RN-2026-CERT-00001
```

This should be unique.

---

# 46. Certificate Verification

Every certificate should have a verification code.

Example:

```text
Certificate ID:
GDG-RN-2026-CERT-00001

Verification:
VER-8A91K2
```

Public verification page:

```text
/certificate/verify/VER-8A91K2
```

Result:

```text
Certificate Verified

Name:
Abhishek Kumar

Event:
GDG Ranchi DevFest 2026

Certificate:
Participation

Issued:
2026
```

Do not expose unnecessary private participant information.

---

# 47. Certificate Storage

Store actual PDF files in:

```text
Firebase Storage
```

PostgreSQL stores:

```text
certificate_id
participant_id
certificate_number
verification_code
certificate_type
file_url
issued_at
```

---

# 48. Firebase Authentication

Authentication handles:

```text
Participant Login
Super Admin Login
```

The application should not store passwords manually in PostgreSQL.

Use Firebase Authentication.

Flow:

```text
User
 ↓
Firebase Auth
 ↓
Identity verified
 ↓
Backend verifies Firebase token
 ↓
Backend identifies participant/admin
 ↓
Access granted
```

---

# 49. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Example:

```text
Participant
    ↓
Can view own data
Can register games
Can submit
Can view leaderboard
Can view certificate

Super Admin
    ↓
Can manage everything
```

---

# 50. Never Trust the Frontend

The frontend may hide an Admin button.

That is not security.

Backend must verify:

```text
Firebase Token
       ↓
User
       ↓
Role
       ↓
Permission
```

Example:

```text
POST /api/admin/games
```

must reject a participant even if they manually call the API.

---

# 51. PostgreSQL Database

Recommended tables:

```text
users
participants
teams
team_members
games
game_registrations
game_submissions
game_results
score_update_logs
certificates
activity_logs
```

---

# 52. users Table

Stores application-level user information.

```text
users
├── id
├── firebase_uid
├── role
├── status
├── created_at
└── updated_at
```

Role:

```text
PARTICIPANT
SUPER_ADMIN
```

---

# 53. participants Table

```text
participants
├── id
├── user_id
├── participant_id
├── full_name
├── email
├── mobile
├── organization
├── city
├── image_url
├── status
├── created_at
└── updated_at
```

---

# 54. teams Table

```text
teams
├── id
├── team_id
├── team_name
├── team_code
├── status
├── created_at
└── updated_at
```

Constraints:

```text
team_id UNIQUE
team_code UNIQUE
```

---

# 55. team_members Table

```text
team_members
├── id
├── team_id
├── participant_id
├── joined_at
└── left_at
```

Important constraint:

```text
participant_id
```

should not be allowed to belong to multiple active teams if the event rule is one-team-per-participant.

---

# 56. games Table

```text
games
├── id
├── name
├── description
├── rules
├── game_type
├── max_score
├── status
├── start_at
├── end_at
├── created_by
├── created_at
└── updated_at
```

Game type:

```text
INDIVIDUAL
TEAM
```

---

# 57. game_registrations Table

For individual and team registrations.

```text
game_registrations
├── id
├── game_id
├── participant_id
├── team_id
├── status
├── registered_at
└── updated_at
```

For an individual game:

```text
participant_id = value
team_id = NULL
```

For a team game:

```text
team_id = value
participant_id = NULL
```

---

# 58. game_submissions Table

```text
game_submissions
├── id
├── game_id
├── participant_id
├── team_id
├── submission_text
├── submission_url
├── file_url
├── submitted_at
└── updated_at
```

---

# 59. game_results Table

```text
game_results
├── id
├── game_id
├── participant_id
├── team_id
├── score
├── max_score
├── status
├── scored_by
├── scored_at
└── updated_at
```

Score:

```text
DEFAULT 0
```

---

# 60. score_update_logs Table

Never silently change scores.

Store history:

```text
score_update_logs
├── id
├── result_id
├── old_score
├── new_score
├── changed_by
├── reason
└── changed_at
```

Example:

```text
Old Score: 60
New Score: 80
Changed By: Super Admin
Reason: Answer re-evaluated
```

---

# 61. certificates Table

```text
certificates
├── id
├── participant_id
├── team_id
├── certificate_number
├── certificate_type
├── verification_code
├── file_url
├── issued_at
├── issued_by
└── status
```

---

# 62. activity_logs Table

Recommended for auditing.

Example events:

```text
PARTICIPANT_CREATED
PARTICIPANT_DISABLED
TEAM_CREATED
TEAM_UPDATED
GAME_CREATED
GAME_ACTIVATED
GAME_CLOSED
GAME_REGISTERED
SUBMISSION_CREATED
SCORE_UPDATED
CERTIFICATE_ISSUED
```

---

# 63. Database Relationship

Complete relationship:

```text
users
  │
  └── participants
          │
          ├──────── team_members ──────── teams
          │                                  │
          │                                  │
          ├──── game_registrations ──────── games
          │                                  │
          ├──── game_submissions ───────────┤
          │                                  │
          └──── game_results ────────────────┘
                    │
                    └── score_update_logs

participants
     │
     └── certificates
```

---

# 64. Team-Wise Database Logic

Team leaderboard:

```sql
SELECT
    team_id,
    SUM(score) AS total_points
FROM game_results
WHERE team_id IS NOT NULL
GROUP BY team_id
ORDER BY total_points DESC;
```

Individual leaderboard:

```sql
SELECT
    participant_id,
    SUM(score) AS total_points
FROM game_results
WHERE participant_id IS NOT NULL
GROUP BY participant_id
ORDER BY total_points DESC;
```

The exact queries should later account for completed/valid results and game types.

---

# 65. Backend Architecture

Recommended:

```text
Node.js
│
├── Controllers
├── Services
├── Routes
├── Middleware
├── Database
├── Validators
├── Utilities
└── Firebase
```

Request flow:

```text
Client
  ↓
Route
  ↓
Authentication Middleware
  ↓
Authorization Middleware
  ↓
Controller
  ↓
Service
  ↓
PostgreSQL
```

---

# 66. Recommended Backend Structure

```text
src/
│
├── config/
│   ├── env.ts
│   └── firebase.ts
│
├── db/
│   ├── client.ts
│   ├── migrations/
│   └── queries/
│
├── modules/
│   ├── auth/
│   ├── participants/
│   ├── teams/
│   ├── games/
│   ├── submissions/
│   ├── scores/
│   ├── leaderboard/
│   └── certificates/
│
├── middleware/
│   ├── auth.ts
│   ├── role.ts
│   └── error.ts
│
├── utils/
│
├── app.ts
└── server.ts
```

---

# 67. API Structure

## Authentication

```text
GET /api/auth/me
```

Firebase handles actual authentication.

Backend verifies the Firebase ID token.

---

# 68. Participant APIs

```text
GET    /api/participants/me
PATCH  /api/participants/me

GET    /api/participants/me/games
GET    /api/participants/me/scores
GET    /api/participants/me/team
GET    /api/participants/me/certificate
```

---

# 69. Team APIs

```text
GET    /api/teams
GET    /api/teams/:teamId
POST   /api/teams
PATCH  /api/teams/:teamId

POST   /api/teams/:teamId/members
DELETE /api/teams/:teamId/members/:participantId

GET    /api/teams/:teamId/games
GET    /api/teams/:teamId/score
```

Admin-only endpoints should be protected.

---

# 70. Game APIs

```text
GET    /api/games
GET    /api/games/:gameId

POST   /api/games
PATCH  /api/games/:gameId

POST   /api/games/:gameId/register
POST   /api/games/:gameId/submit

POST   /api/games/:gameId/activate
POST   /api/games/:gameId/close
```

---

# 71. Score APIs

```text
GET   /api/scores
GET   /api/scores/:resultId

PATCH /api/scores/:resultId
GET   /api/scores/:resultId/history
```

Only Super Admin can update scores.

---

# 72. Leaderboard APIs

```text
GET /api/leaderboard/individual
GET /api/leaderboard/teams
GET /api/leaderboard/games/:gameId
```

Participant dashboard can also request:

```text
GET /api/leaderboard/me
GET /api/leaderboard/my-team
```

---

# 73. Certificate APIs

```text
GET  /api/certificates/me

POST /api/admin/certificates/generate
POST /api/admin/certificates/:id/issue

GET /api/certificates/verify/:code
```

---

# 74. Storage

Firebase Storage can contain:

```text
participants/
    participant-id/
        profile.jpg

submissions/
    game-id/
        participant-id/

certificates/
    year/
        certificate-number.pdf
```

Avoid random unstructured file paths.

---

# 75. File Upload Flow

```text
Participant
      ↓
Upload
      ↓
Backend validates
      ↓
Firebase Storage
      ↓
Storage URL
      ↓
PostgreSQL
```

Store the URL/reference in PostgreSQL.

Don't store large images or PDFs directly inside PostgreSQL.

---

# 76. Security

Important rules:

```text
Firebase Auth
      ↓
Token verification
      ↓
Role verification
      ↓
Permission check
      ↓
Database operation
```

Never trust:

- participant ID from frontend
- user role from frontend
- score from frontend
- team ID from frontend
- certificate ownership from frontend

The backend should derive sensitive identity from the authenticated Firebase user.

---

# 77. Score Security

Only Super Admin:

```text
PATCH /scores/:id
```

Backend checks:

```text
Authenticated?
     ↓
Firebase token valid?
     ↓
Role = SUPER_ADMIN?
     ↓
Result exists?
     ↓
Score >= 0?
     ↓
Score <= max_score?
     ↓
Update transaction
     ↓
Write score history
```

---

# 78. Score Update Transaction

When an admin changes:

```text
60 → 80
```

perform:

```text
BEGIN
   ↓
Update result
   ↓
Insert score history
   ↓
Insert activity log
   ↓
COMMIT
```

If something fails:

```text
ROLLBACK
```

This prevents incomplete score updates.

---

# 79. Game Lifecycle

```text
UPCOMING
    │
    │ Admin activates
    ▼
ACTIVE
    │
    │ Admin closes
    ▼
CLOSED
```

Rules:

### UPCOMING

Participants can see the game.

Registration may be allowed depending on configuration.

### ACTIVE

Participants can register/submit according to game rules.

### CLOSED

No new submissions.

Admin can still review/update scores.

---

# 80. Participant Game Lifecycle

```text
AVAILABLE
    ↓
REGISTERED
    ↓
SUBMITTED
    ↓
SCORED
    ↓
COMPLETED
```

---

# 81. Team Game Lifecycle

```text
AVAILABLE
    ↓
TEAM REGISTERED
    ↓
TEAM SUBMITTED
    ↓
TEAM SCORED
    ↓
COMPLETED
```

---

# 82. Duplicate Protection

The database should prevent duplicate registration.

Example:

```text
participant + game
```

must be unique for individual games.

For team games:

```text
team + game
```

must be unique.

This should be enforced at the database level, not only in frontend code.

---

# 83. Team Member Rules

Recommended:

```text
One participant
        ↓
One active team
```

If the participant changes teams, the backend should record the membership history rather than silently overwriting it.

---

# 84. Dashboard Statistics

Admin dashboard:

```text
Participants
Teams
Active Participants
Disabled Participants

Games
Active Games
Closed Games

Individual Registrations
Team Registrations

Submissions
Pending Submissions

Individual Points
Team Points

Top 10 Participants
Top 10 Teams
```

---

# 85. Participant Dashboard

```text
Profile
Participant ID
Team
Team Members

Individual Rank
Individual Points

Team Rank
Team Points

Total Games
Completed Games
Pending Games

Certificate
```

---

# 86. Team Leaderboard UI

Example:

```text
🏆 Team Leaderboard

Rank   Team              Members   Points
-------------------------------------------
🥇 1   Code Warriors        4       820
🥈 2   Dev Titans           5       760
🥉 3   Bug Hunters          4       710
   4   Tech Ninjas          3       680
   5   Binary Squad         5       640
```

---

# 87. Individual Leaderboard UI

```text
🏆 Individual Leaderboard

Rank   Participant        Team             Points
---------------------------------------------------
🥇 1   Abhishek            Code Warriors      450
🥈 2   Rahul               Dev Titans         420
🥉 3   Amit                Bug Hunters        390
   4   Ankit               Code Warriors      350
```

---

# 88. Game Leaderboard

Each game can have its own leaderboard.

Example:

```text
Tech Quiz

Rank   Participant       Score
------------------------------
1      Abhishek           95
2      Rahul              90
3      Amit               88
```

For team game:

```text
Treasure Hunt

Rank   Team              Score
-----------------------------
1      Code Warriors      98
2      Dev Titans         92
3      Bug Hunters        87
```

---

# 89. Search and Filtering

Admin should be able to filter:

### Participants

```text
Name
Team
City
Organization
Status
Score range
```

### Teams

```text
Team name
Team ID
Status
Member count
Score range
```

### Games

```text
Status
Type
Date
```

---

# 90. Event-Day Flow

Before event:

```text
Create Games
      ↓
Create Teams
      ↓
Register Participants
      ↓
Verify Participants
      ↓
Activate Games
```

During event:

```text
Participant Login
      ↓
View Games
      ↓
Register
      ↓
Play
      ↓
Submit
      ↓
Admin Reviews
      ↓
Score
      ↓
Leaderboard Updates
```

After event:

```text
Close Games
      ↓
Finalize Scores
      ↓
Finalize Team Leaderboard
      ↓
Finalize Individual Leaderboard
      ↓
Determine Winners
      ↓
Generate Certificates
      ↓
Publish Verification
```

---

# 91. Final Score Lock

This is highly recommended.

After the event:

```text
SCORES_OPEN
     ↓
SCORES_REVIEW
     ↓
SCORES_FINAL
     ↓
LEADERBOARD_FINAL
```

Once finalized, normal admins should not be able to modify scores.

If an exceptional correction is needed, require a special audited operation.

---

# 92. Certificate Eligibility

Define rules before implementation.

Example:

```text
Participation Certificate
    ↓
Registered + completed required participation

Winner Certificate
    ↓
Top 3 individual/team

Special Certificate
    ↓
Admin selected
```

Don't make certificate eligibility dependent on frontend calculations.

The backend should determine eligibility.

---

# 93. Certificate Generation Flow

```text
Eligibility Check
       ↓
Generate Certificate Number
       ↓
Generate Verification Code
       ↓
Create PDF
       ↓
Upload PDF to Firebase Storage
       ↓
Save metadata in PostgreSQL
       ↓
Certificate Issued
```

---

# 94. Certificate Verification

Public route:

```text
/certificate/verify/:code
```

Backend:

```text
Verification Code
       ↓
Find Certificate
       ↓
Check Status
       ↓
Return Public Verification Data
```

Possible response:

```text
Certificate Valid

GDG Ranchi DevFest 2026

Name: Abhishek Kumar
Certificate Type: Participation
Issued: 2026
Status: VALID
```

---

# 95. Backup Strategy

PostgreSQL is the source of truth.

Important data:

```text
Participants
Teams
Games
Registrations
Submissions
Results
Scores
Certificates
```

Use database backups.

Firebase Storage should also have a recovery/retention strategy for:

```text
Images
Submissions
Certificates
```

---

# 96. Performance

Expected scale:

```text
Participants ≈ 900
Games ≈ 10
Maximum participant-game relationships ≈ 9,000
```

This is a small workload for PostgreSQL.

The system should easily handle this with proper indexes and queries.

---

# 97. Important PostgreSQL Indexes

Recommended indexes:

```text
participants.participant_id
participants.email

teams.team_id
teams.team_code

team_members.team_id
team_members.participant_id

game_registrations.game_id
game_registrations.participant_id
game_registrations.team_id

game_results.game_id
game_results.participant_id
game_results.team_id

certificates.certificate_number
certificates.verification_code
```

---

# 98. Data Consistency

Use database constraints wherever possible.

Examples:

```text
email UNIQUE
participant_id UNIQUE
team_id UNIQUE
team_code UNIQUE
certificate_number UNIQUE
verification_code UNIQUE
```

And foreign keys:

```text
game_results.game_id
        ↓
games.id
```

```text
team_members.team_id
        ↓
teams.id
```

---

# 99. Error Handling

Frontend should receive clean errors.

Example:

```json
{
  "success": false,
  "message": "You are already registered for this game."
}
```

Possible errors:

```text
Participant not found
Team not found
Game not found
Game is closed
Already registered
Not a team member
Invalid score
Score exceeds maximum
Certificate not found
Unauthorized
Forbidden
```

---

# 100. Development Phases

## Phase 1 — Foundation

```text
Node.js
TypeScript
Express
Environment configuration
Firebase Admin
SQL Connect
PostgreSQL
```

---

## Phase 2 — Authentication

```text
Firebase Authentication
Firebase token verification
User creation
Role system
Participant authentication
Super Admin authentication
```

---

## Phase 3 — Participants

```text
Registration
Participant ID
Profile
Image upload
Status
Admin management
Search
```

---

## Phase 4 — Teams

```text
Create team
Team ID
Team code
Team members
Join team
Leave/change team
Admin team management
```

---

## Phase 5 — Games

```text
Create game
Edit game
Activate game
Close game
Individual games
Team games
Game registration
```

---

## Phase 6 — Submissions

```text
Individual submission
Team submission
File upload
Submission history
Submission status
```

---

## Phase 7 — Scoring

```text
Score = 0 by default
Score validation
Admin score update
Score history
Audit logs
Score finalization
```

---

## Phase 8 — Leaderboards

```text
Individual leaderboard
Team leaderboard
Game leaderboard
Ranking
Tie-breakers
Top 3
```

---

## Phase 9 — Certificates

```text
Eligibility
Certificate number
Verification code
PDF generation
Firebase Storage
Certificate download
Certificate verification
```

---

## Phase 10 — Finalization

```text
Security testing
Load testing
Database backup
Score lock
Leaderboard lock
Certificate testing
Admin testing
Participant testing
Production deployment
```

---

# 101. Final Project Structure

```text
devfest-system/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   └── lib/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── participants/
│   │   │   ├── teams/
│   │   │   ├── games/
│   │   │   ├── submissions/
│   │   │   ├── scores/
│   │   │   ├── leaderboard/
│   │   │   └── certificates/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── migrations/
│   └── package.json
│
└── docs/
    ├── architecture.md
    ├── database.md
    ├── api.md
    ├── authentication.md
    ├── games.md
    ├── teams.md
    ├── leaderboard.md
    └── certificates.md
```

---

# 102. Complete User Flow

```text
                    Participant
                         │
                         ▼
                   Registration
                         │
                         ▼
                   Firebase Auth
                         │
                         ▼
                  Participant ID
                         │
                         ▼
                     Join Team
                         │
                         ▼
                  Participant Dashboard
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
          Games        Team        Leaderboard
            │            │            │
            ▼            ▼            ▼
       Registration   Members      Individual
            │                       + Team
            ▼
         Submission
            │
            ▼
          Score
            │
            ├───────────────┐
            ▼               ▼
       Individual        Team Score
       Leaderboard       Leaderboard
            │               │
            └───────┬───────┘
                    ▼
               Final Results
                    │
                    ▼
              Certificate
                    │
                    ▼
              Verification
```

---

# 103. Complete Admin Flow

```text
Super Admin
     │
     ▼
Login
     │
     ▼
Admin Dashboard
     │
     ├── Participants
     │
     ├── Teams
     │
     ├── Games
     │
     ├── Registrations
     │
     ├── Submissions
     │
     ├── Scores
     │
     ├── Leaderboards
     │
     └── Certificates
```

---

# 104. Final Architecture

```text
                         GDG Ranchi DevFest 2026
                                  │
                                  ▼
                         Next.js / React
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
             Firebase Authentication       Node.js API
                     │                         │
                     │                ┌────────┴────────┐
                     │                │                 │
                     │                ▼                 ▼
                     │        Firebase SQL Connect   Firebase
                     │                │              Storage
                     │                ▼                 │
                     │          PostgreSQL              │
                     │                │                 │
                     │       ┌────────┼────────┐        │
                     │       │        │        │        │
                     │       ▼        ▼        ▼        ▼
                     │   Participants Teams   Games   Files
                     │                │
                     │                ▼
                     │          Registrations
                     │                │
                     │                ▼
                     │           Submissions
                     │                │
                     │                ▼
                     │             Scores
                     │           ┌────┴────┐
                     │           ▼         ▼
                     │      Individual    Team
                     │      Leaderboard  Leaderboard
                     │           │         │
                     │           └────┬────┘
                     │                ▼
                     │          Final Winners
                     │                │
                     │                ▼
                     └────────── Certificates
```

---

# 105. Final Google/Firebase Services

The project should use these:

```text
Firebase
│
├── Authentication
│     └── Participant + Super Admin
│
├── SQL Connect
│     └── PostgreSQL
│
└── Storage
      ├── Participant Images
      ├── Game Submission Files
      └── Certificate PDFs
```

No need for:

```text
Firestore
Realtime Database
```

unless a future requirement specifically makes them useful.

---

# 106. Final Database Source of Truth

PostgreSQL is the **single source of truth** for:

```text
Participants
Teams
Team Membership
Games
Registrations
Submissions
Results
Scores
Leaderboards
Certificates
Audit Logs
```

Firebase Authentication is the source of truth for:

```text
Authentication Identity
```

Firebase Storage is the source of truth for:

```text
Files
Images
PDFs
```

---

# 107. Final Role Model

```text
                    System
                      │
             ┌────────┴────────┐
             ▼                 ▼
        SUPER ADMIN        PARTICIPANT
             │                 │
       Full Management      Own Data
             │                 │
       ┌─────┼─────┐       ┌───┼────┐
       ▼     ▼     ▼       ▼   ▼    ▼
   Players Teams Games   Games Team Scores
       │     │     │       │    │
       └─────┴─────┘       └────┴────┘
             │                  │
             ▼                  ▼
          Scores            Leaderboards
             │                  │
             └────────┬─────────┘
                      ▼
                 Certificates
```

---

# 108. Final Feature Checklist

## Authentication

- [ ] Participant registration
- [ ] Participant login
- [ ] Super Admin login
- [ ] Firebase token verification
- [ ] Role authorization

## Participants

- [ ] Participant ID
- [ ] Profile
- [ ] Profile image
- [ ] Status
- [ ] Search
- [ ] Enable/disable
- [ ] Game history
- [ ] Score history

## Teams

- [ ] Team creation
- [ ] Team ID
- [ ] Team code
- [ ] Team members
- [ ] Join team
- [ ] Remove member
- [ ] Team status
- [ ] Team history

## Games

- [ ] Create game
- [ ] Edit game
- [ ] Individual game
- [ ] Team game
- [ ] Activate
- [ ] Close
- [ ] Registration
- [ ] Submission

## Scores

- [ ] Default score = 0
- [ ] Score validation
- [ ] Admin scoring
- [ ] Score history
- [ ] Audit log
- [ ] Final score lock

## Leaderboards

- [ ] Individual leaderboard
- [ ] Team leaderboard
- [ ] Game leaderboard
- [ ] Ranking
- [ ] Tie-breaker
- [ ] Top 3
- [ ] Final leaderboard lock

## Certificates

- [ ] Eligibility
- [ ] Certificate number
- [ ] Verification code
- [ ] PDF generation
- [ ] Firebase Storage
- [ ] Download
- [ ] Public verification

## Admin

- [ ] Dashboard
- [ ] Participant management
- [ ] Team management
- [ ] Game management
- [ ] Submission management
- [ ] Score management
- [ ] Leaderboard management
- [ ] Certificate management
- [ ] Activity logs

---

# 109. Recommended Build Order

Do not build everything at once.

Build in this exact order:

```text
01. Firebase Project
        ↓
02. Firebase Authentication
        ↓
03. SQL Connect / PostgreSQL
        ↓
04. Node.js Backend
        ↓
05. Database Schema + Migrations
        ↓
06. User / Role System
        ↓
07. Participant Module
        ↓
08. Team Module
        ↓
09. Game Module
        ↓
10. Registration Module
        ↓
11. Submission Module
        ↓
12. Score Module
        ↓
13. Individual Leaderboard
        ↓
14. Team Leaderboard
        ↓
15. Certificate Module
        ↓
16. Firebase Storage
        ↓
17. Admin Dashboard
        ↓
18. Security Testing
        ↓
19. Event Testing
        ↓
20. Production
```

---

# 110. Final Decision

For **GDG Ranchi DevFest 2026 Games + Teams + Leaderboard + Certificates**, the final architecture is:

```text
                    ┌──────────────────────┐
                    │  GDG Ranchi DevFest  │
                    │        2026          │
                    └──────────┬───────────┘
                               │
                         Next.js / React
                               │
                    ┌──────────┴──────────┐
                    │                     │
             Firebase Auth           Node.js API
                    │                     │
                    │              SQL Connect
                    │                     │
                    │                PostgreSQL
                    │                     │
                    │       ┌─────────────┼──────────────┐
                    │       │             │              │
                    │       ▼             ▼              ▼
                    │   Participants    Teams          Games
                    │       │             │              │
                    │       └─────────────┼──────────────┘
                    │                     │
                    │                Registrations
                    │                     │
                    │                Submissions
                    │                     │
                    │                  Scores
                    │                 /      \
                    │                /        \
                    │               ▼          ▼
                    │          Individual     Team
                    │          Leaderboard  Leaderboard
                    │               \          /
                    │                \        /
                    │                 ▼      ▼
                    │                Winners
                    │                   │
                    └───────────────────┤
                                        ▼
                                  Certificates
                                        │
                                        ▼
                                 Firebase Storage
```

### The core principle

> **PostgreSQL manages the relationships and business data. Firebase Authentication manages identity. Firebase Storage manages files. Node.js manages the business logic. The frontend presents the system.**

And the most important design decision for the updated requirement is:

> **Teams, individual participants, individual games, and team games are separate concepts. Do not try to force everything into one score model.**

That will make the **team leaderboard, individual leaderboard, scoring, history, and certificates** much easier to maintain and much safer for the actual DevFest event.
