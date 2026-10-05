import { Timestamp } from "firebase-admin/firestore";

export type AuthRole = "SUPER_ADMIN" | "ADMIN" | "VOLUNTEER" | "PARTICIPANT";
export type AuthUserStatus = "ACTIVE" | "DISABLED" | "SUSPENDED";

export interface IUserDoc {
  id: string;
  uid?: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  status: AuthUserStatus;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface IParticipantDoc {
  id: string;
  userId: string;
  participantId: string; // e.g. GDG26-0001
  uid?: string;
  name: string;
  email: string;
  mobile: string;
  organization?: string | null;
  city?: string | null;
  profilePhoto?: string | null;
  status: "ACTIVE" | "DISABLED";
  totalPoints: number;
  completedGames: number;
  highestSingleScore?: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface ISanitizedUser {
  id: string;
  uid?: string;
  email: string;
  role: AuthRole;
  status: AuthUserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ISanitizedParticipant {
  id: string;
  userId: string;
  participantId: string;
  name: string;
  email: string;
  mobile: string;
  organization?: string | null;
  city?: string | null;
  profilePhoto?: string | null;
  status: "ACTIVE" | "DISABLED";
  totalPoints: number;
  completedGames: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthTokenPayload {
  userId: string;
  email: string;
  role: AuthRole;
  participantId?: string;
}

export interface IAuthResponse {
  user: ISanitizedUser;
  participant?: ISanitizedParticipant | null;
  token: string;
}

