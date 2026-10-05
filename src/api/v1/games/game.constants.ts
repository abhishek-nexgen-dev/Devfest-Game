/**
 * GDG Ranchi DevFest 2026 - Game Module Constants
 */

export class GameConstants {
  public static readonly GAME_TYPE = {
    INDIVIDUAL: "INDIVIDUAL",
    TEAM: "TEAM",
  } as const;

  public static readonly GAME_STATUS = {
    UPCOMING: "UPCOMING",
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED",
  } as const;

  public static readonly ROUTES = {
    ROOT: "/",
    BY_ID: "/:id",
    ACTIVATE: "/:id/activate",
    CLOSE: "/:id/close",
  } as const;

  public static readonly MESSAGES = {
    GAME_CREATED: "Game created successfully.",
    GAME_UPDATED: "Game updated successfully.",
    GAME_FETCHED: "Game details retrieved successfully.",
    GAMES_LISTED: "Games list fetched successfully.",
    GAME_NOT_FOUND: "Game not found.",
    GAME_ACTIVATED: "Game has been activated.",
    GAME_CLOSED: "Game has been closed.",
    GAME_NOT_ACTIVE: "Game is currently not active for submissions.",
  } as const;
}

export const GameConstant = GameConstants;
