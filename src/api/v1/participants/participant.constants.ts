/**
 * GDG Ranchi DevFest 2026 - Participant Module Constants
 */

export class ParticipantConstants {
  public static readonly DEFAULT_PAGE = 1;
  public static readonly DEFAULT_LIMIT = 20;
  public static readonly MAX_LIMIT = 100;

  public static readonly MESSAGES = {
    PARTICIPANT_CREATED: "Participant created successfully.",
    PROFILE_FETCHED: "Participant profile fetched successfully.",
    PROFILE_UPDATED: "Participant profile updated successfully.",
    PARTICIPANT_DELETED: "Participant deleted successfully.",
    PARTICIPANTS_LISTED: "Participants retrieved successfully.",
    PARTICIPANT_NOT_FOUND: "Participant record not found.",
    TICKET_ID_REQUIRED: "Ticket ID is required.",
    TICKET_ALREADY_EXISTS: "A participant with this ticket ID already exists.",
    EMAIL_ALREADY_EXISTS: "A participant with this email address already exists.",
    UNAUTHORIZED_ACCESS: "You are not authorized to access or modify this profile.",
  } as const;
}

export const ParticipantConstant = ParticipantConstants;
export default ParticipantConstants;
