/**
 * GDG Ranchi DevFest 2026 - Leaderboard Constants
 */

export class LeaderboardConstants {
  public static readonly ROUTES = {
    ROOT: "/",
    INDIVIDUAL: "/individual",
    TEAMS: "/teams",
    GAME: "/game/:gameId",
  } as const;

  public static readonly MESSAGES = {
    INDIVIDUAL_FETCHED: "Individual leaderboard retrieved successfully.",
    TEAMS_FETCHED: "Team leaderboard retrieved successfully.",
    GAME_LEADERBOARD_FETCHED: "Game leaderboard retrieved successfully.",
  } as const;
}

export const LeaderboardConstant = LeaderboardConstants;
