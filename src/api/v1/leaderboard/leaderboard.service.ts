import { dataStore } from "../../../core/database/firestore.store";
import {
  IIndividualLeaderboardEntry,
  ITeamLeaderboardEntry,
} from "./leaderboard.types";

/**
 * GDG Ranchi DevFest 2026 - Leaderboard Service
 * Cloud Firestore document-driven aggregation with deterministic tie-breaker rules.
 */
export class LeaderboardService {
  public async GET_INDIVIDUAL_LEADERBOARD(): Promise<IIndividualLeaderboardEntry[]> {
    const allResults = await dataStore.results.getAll();
    const participantMap = new Map<
      string,
      {
        totalScore: number;
        gamesPlayed: number;
        maxSingleScore: number;
        lastUpdate: Date;
      }
    >();

    for (const res of allResults) {
      if (!res.participantId) continue;
      const current = participantMap.get(res.participantId) || {
        totalScore: 0,
        gamesPlayed: 0,
        maxSingleScore: 0,
        lastUpdate: new Date(0),
      };

      current.totalScore += res.score;
      current.gamesPlayed += 1;
      if (res.score > current.maxSingleScore) {
        current.maxSingleScore = res.score;
      }
      const updateDate = new Date(res.updatedAt);
      if (updateDate > current.lastUpdate) {
        current.lastUpdate = updateDate;
      }

      participantMap.set(res.participantId, current);
    }

    const leaderboard: IIndividualLeaderboardEntry[] = [];

    for (const [participantId, stats] of participantMap.entries()) {
      const p = await dataStore.participants.getById(participantId);
      leaderboard.push({
        rank: 0,
        participantId: p?.participantId || participantId,
        name: p?.name || "Participant",
        organization: p?.organization || null,
        city: p?.city || null,
        totalScore: stats.totalScore,
        gamesPlayed: stats.gamesPlayed,
      });
    }

    // Sort with Deterministic Tie-Breaker
    leaderboard.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.gamesPlayed - a.gamesPlayed;
    });

    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  public async GET_TOP3(): Promise<IIndividualLeaderboardEntry[]> {
    const full = await this.GET_INDIVIDUAL_LEADERBOARD();
    return full.slice(0, 3);
  }

  public async GET_TEAM_LEADERBOARD(): Promise<ITeamLeaderboardEntry[]> {
    const allResults = await dataStore.results.getAll();
    const teamMap = new Map<
      string,
      {
        totalScore: number;
        gamesPlayed: number;
      }
    >();

    for (const res of allResults) {
      if (!res.teamId) continue;
      const current = teamMap.get(res.teamId) || {
        totalScore: 0,
        gamesPlayed: 0,
      };
      current.totalScore += res.score;
      current.gamesPlayed += 1;
      teamMap.set(res.teamId, current);
    }

    const leaderboard: ITeamLeaderboardEntry[] = [];

    for (const [teamId, stats] of teamMap.entries()) {
      const team = await dataStore.teams.getById(teamId);
      const members = await dataStore.teamMembers.find((m) => m.teamId === teamId);

      leaderboard.push({
        rank: 0,
        teamId,
        teamName: team?.teamName || "Team",
        teamCode: team?.teamCode || "CODE",
        totalScore: stats.totalScore,
        gamesPlayed: stats.gamesPlayed,
        memberCount: members.length,
      });
    }

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}
