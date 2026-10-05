/**
 * GDG Ranchi DevFest 2026 - Firestore Document Models & MongoDB-Compatible Schema
 * Enterprise-grade document definitions for Google Cloud Firestore.
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "VOLUNTEER" | "PARTICIPANT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type GameType = "INDIVIDUAL" | "TEAM";
export type GameStatus = "UPCOMING" | "ACTIVE" | "CLOSED";

export interface UserDoc {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantDoc {
  id: string;
  userId: string;
  participantId: string; // Sequential identifier e.g. GDGR-1001 or GDG26-0001
  name: string;
  mobile: string;
  organization?: string | null;
  city?: string | null;
  profilePhoto?: string | null;
  status?: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

export interface TeamDoc {
  id: string;
  teamName: string;
  teamCode: string;
  leaderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberDoc {
  id: string;
  teamId: string;
  participantId: string;
  joinedAt: string;
}

export interface GameDoc {
  id: string;
  title: string;
  description: string;
  gameType: GameType;
  status: GameStatus;
  maxScore: number;
  startTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameRegistrationDoc {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  registeredAt: string;
}

export interface GameSubmissionDoc {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  submissionData: string;
  submittedAt: string;
}

export interface GameResultDoc {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  score: number;
  points?: number;
  verified: boolean;
  verifiedBy?: string | null;
  updatedAt: string;
}

export interface ScoreUpdateLogDoc {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  oldScore: number;
  newScore: number;
  updatedBy: string;
  reason?: string | null;
  createdAt: string;
}

export interface CertificateDoc {
  id: string;
  certificateNo: string;
  participantId: string;
  participantName: string;
  verificationHash: string;
  certificateUrl?: string | null;
  issuedAt: string;
}

export interface ActivityLogDoc {
  id: string;
  userId?: string | null;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
