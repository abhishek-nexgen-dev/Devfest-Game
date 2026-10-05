/**
 * GDG Ranchi DevFest 2026 - Result Types
 */

export interface IUpdateScoreDto {
  gameId: string;
  participantId?: string;
  teamId?: string;
  score: number;
  reason?: string;
}

export interface IResultRecord {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  score: number;
  verified: boolean;
  verifiedBy?: string | null;
  updatedAt: Date | string;
}

export interface IScoreLogItem {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  oldScore: number;
  newScore: number;
  updatedBy: string;
  reason?: string | null;
  createdAt: Date | string;
}
