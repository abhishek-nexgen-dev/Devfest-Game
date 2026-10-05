/**
 * GDG Ranchi DevFest 2026 - Participant Module Constants
 */

export class ParticipantConstants {
  public static readonly DEFAULT_PAGE = 1;
  public static readonly DEFAULT_LIMIT = 20;
  public static readonly MAX_LIMIT = 100;

  public static readonly ROUTES = {
    ROOT: "/",
    ME: "/me",
    ME_GAMES: "/me/games",
    ME_SCORES: "/me/scores",
    ME_TEAM: "/me/team",
    ME_CERTIFICATE: "/me/certificate",
    BY_ID: "/:id",
    STATUS: "/:id/status",
  } as const;

  public static readonly MESSAGES = {
    PROFILE_FETCHED: "Participant profile fetched successfully.",
    PROFILE_UPDATED: "Participant profile updated successfully.",
    PARTICIPANTS_LISTED: "Participants retrieved successfully.",
    PARTICIPANT_NOT_FOUND: "Participant record not found.",
    GAMES_FETCHED: "Registered games fetched successfully.",
    SCORES_FETCHED: "Participant score details fetched successfully.",
    TEAM_FETCHED: "Participant team membership fetched successfully.",
    CERTIFICATE_FETCHED: "Participant certificate fetched successfully.",
    STATUS_UPDATED: "Participant account status updated successfully.",
    NO_TEAM: "Participant is not currently enrolled in any team.",
    NO_CERTIFICATE: "No certificate has been issued for this participant yet.",
    UNAUTHORIZED_ACCESS: "You are not authorized to access or modify this profile.",
  } as const;
}

export const ParticipantConstant = ParticipantConstants;
