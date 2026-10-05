/**
 * GDG Ranchi DevFest 2026 - Participant Data Contracts & Types
 */

import { ISanitizedParticipant } from "../auth/auth.types";

export interface IUpdateParticipantDto {
  name?: string;
  mobile?: string;
  organization?: string;
  city?: string;
  profilePhoto?: string;
}

export interface IParticipantFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  organization?: string;
  city?: string;
  status?: "ACTIVE" | "DISABLED";
}

export interface IParticipantGameItem {
  gameId: string;
  title: string;
  gameType: "INDIVIDUAL" | "TEAM";
  status: "UPCOMING" | "ACTIVE" | "CLOSED";
  registeredAt: Date | string;
  score?: number;
  maxScore: number;
}

export interface IParticipantTeamDetails {
  teamId: string;
  teamName: string;
  teamCode: string;
  isLeader: boolean;
  joinedAt: Date | string;
  memberCount: number;
}

export interface IParticipantScoreSummary {
  participantId: string;
  participantName: string;
  totalScore: number;
  rank?: number;
  completedGames: number;
  breakdown: Array<{
    gameId: string;
    gameTitle: string;
    score: number;
    maxScore: number;
    verified: boolean;
  }>;
}

export interface IParticipantListResponse {
  participants: ISanitizedParticipant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
