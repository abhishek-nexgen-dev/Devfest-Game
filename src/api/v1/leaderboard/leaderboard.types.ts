/**
 * GDG Ranchi DevFest 2026 - Leaderboard Types
 */

export interface ILeaderboardParticipantRank {
  rank: number;
  participantId: string;
  name: string;
  organization?: string | null;
  city?: string | null;
  totalPoints: number;
  completedGames: number;
}

export interface ILeaderboardTeamRank {
  rank: number;
  teamId: string;
  teamName: string;
  teamCode: string;
  totalPoints: number;
  membersCount: number;
}
