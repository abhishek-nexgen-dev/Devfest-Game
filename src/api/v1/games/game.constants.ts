/**
 * GDG Ranchi DevFest 2026 - Game Module Constants
 */

export class GameConstants {
  public static readonly GAME_TYPE = {
    ON_BOOTH: "ON_BOOTH",
    ON_STAGE: "ON_STAGE",
    QUIZ_ARENA: "QUIZ_ARENA",
    HACK_SPRINT: "HACK_SPRINT",
    OPEN_CHALLENGE: "OPEN_CHALLENGE",
    INDIVIDUAL: "INDIVIDUAL",
    TEAM: "TEAM",
  } as const;

  public static readonly GAME_STATUS = {
    UPCOMING: "UPCOMING",
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED",
    COMPLETED: "COMPLETED",
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
    GAME_ALREADY_EXISTS: "A game with this name already exists.",
    GAME_ID_REQUIRED: "Valid Game ID is required.",
    INVALID_TIME_RANGE: "End time must be after or equal to start time.",
    GAME_ACTIVATED: "Game has been activated.",
    GAME_CLOSED: "Game has been closed.",
    GAME_NOT_ACTIVE: "Game is currently not active for submissions.",
  } as const;
}

export const GameConstant = GameConstants;
