/**
 * GDG Ranchi DevFest 2026 - Team Constants
 */

export class TeamConstants {
  public static readonly CODE_PREFIX = "CW";
  public static readonly MAX_MEMBERS = 4;

  public static readonly ROUTES = {
    ROOT: "/",
    JOIN: "/join",
    BY_ID: "/:id",
    MEMBERS: "/:id/members",
    REMOVE_MEMBER: "/:id/members/:participantId",
  } as const;

  public static readonly MESSAGES = {
    TEAM_CREATED: "Team created successfully.",
    TEAM_FETCHED: "Team details fetched successfully.",
    TEAMS_LISTED: "Teams retrieved successfully.",
    JOIN_SUCCESS: "Joined team successfully.",
    MEMBER_ADDED: "Member added to team.",
    MEMBER_REMOVED: "Member removed from team.",
    TEAM_NOT_FOUND: "Team not found.",
    ALREADY_IN_TEAM: "You are already a member of an active team.",
    TEAM_FULL: "Team has reached its maximum member capacity.",
    NOT_TEAM_LEADER: "Only the team leader or administrator can perform this action.",
    INVALID_TEAM_CODE: "Invalid team joining code.",
  } as const;
}

export const TeamConstant = TeamConstants;
