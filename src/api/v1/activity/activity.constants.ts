/**
 * GDG Ranchi DevFest 2026 - Activity Log Constants
 */

export class ActivityConstants {
  public static readonly ROUTES = {
    ROOT: "/",
    BY_USER: "/user/:userId",
  } as const;

  public static readonly MESSAGES = {
    LOGS_FETCHED: "Activity logs retrieved successfully.",
  } as const;
}

export const ActivityConstant = ActivityConstants;
