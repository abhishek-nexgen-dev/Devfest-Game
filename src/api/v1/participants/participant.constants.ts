/**
 * GDG Ranchi DevFest 2026 - Participant Module Constants
 */

export class ParticipantConstants {
  public static readonly DEFAULT_PAGE = 1;
  public static readonly DEFAULT_LIMIT = 20;
  public static readonly MAX_LIMIT = 100;

  public static readonly MESSAGES = {
    PARTICIPANT_CREATED: "Participant created successfully.",
    PARTICIPANTS_BULK_CREATED: "Participants created successfully in bulk.",
    BULK_PARTICIPANTS_REQUIRED: "At least one participant is required for bulk creation.",
    PROFILE_FETCHED: "Participant profile fetched successfully.",
    PROFILE_UPDATED: "Participant profile updated successfully.",
    PARTICIPANT_DELETED: "Participant deleted successfully.",
    PARTICIPANTS_LISTED: "Participants retrieved successfully.",
    PARTICIPANT_NOT_FOUND: "Participant record not found.",
    TICKET_ID_REQUIRED: "Ticket ID is required.",
    TICKET_ALREADY_EXISTS: "A participant with this ticket ID already exists.",
    EMAIL_ALREADY_EXISTS: "A participant with this email address already exists.",
    UNAUTHORIZED_ACCESS: "You are not authorized to access or modify this profile.",
    EMAIL_REQUIRED: "Email is required to join a game.",
    EMAIL_MISMATCH: "Provided email does not match this ticket ID.",
    GAME_JOINED: "Participant joined game successfully.",
    GAMES_REQUIRED: "Games list is required to join a game.",
  } as const;
}

export const ParticipantConstant = ParticipantConstants;
export default ParticipantConstants;
