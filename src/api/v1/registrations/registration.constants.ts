/**
 * GDG Ranchi DevFest 2026 - Registration Constants
 */

export class RegistrationConstants {
  public static readonly ROUTES = {
    ROOT: "/",
    BY_GAME: "/game/:gameId",
  } as const;

  public static readonly MESSAGES = {
    REGISTER_SUCCESS: "Registered for game successfully.",
    ALREADY_REGISTERED: "You are already registered for this game.",
    REGISTRATIONS_FETCHED: "Game registrations fetched successfully.",
    GAME_NOT_FOUND: "Target game not found.",
    GAME_CLOSED: "This game is closed for registrations.",
    TEAM_REQUIRED: "A team is required to register for this team game.",
  } as const;
}

export const RegistrationConstant = RegistrationConstants;
