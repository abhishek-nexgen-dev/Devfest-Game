/**
 * GDG Ranchi DevFest 2026 - Result Constants
 */

export class ResultConstants {
  public static readonly ROUTES = {
    ROOT: "/",
    BY_ID: "/:id",
    GAME_RESULTS: "/game/:gameId",
    LOGS: "/:id/logs",
  } as const;

  public static readonly MESSAGES = {
    SCORE_UPDATED: "Score recorded and verified successfully.",
    RESULT_FETCHED: "Game result fetched successfully.",
    RESULTS_LISTED: "Game results list fetched successfully.",
    RESULT_NOT_FOUND: "Result entry not found.",
    INVALID_SCORE: "Score must be non-negative and cannot exceed maximum game score.",
  } as const;
}

export const ResultConstant = ResultConstants;
