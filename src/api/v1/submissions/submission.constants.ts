/**
 * GDG Ranchi DevFest 2026 - Submission Constants
 */

export class SubmissionConstants {
  public static readonly ROUTES = {
    ROOT: "/",
    BY_GAME: "/game/:gameId",
    BY_ID: "/:id",
  } as const;

  public static readonly MESSAGES = {
    SUBMIT_SUCCESS: "Game entry submitted successfully.",
    ALREADY_SUBMITTED: "You have already submitted an entry for this game.",
    SUBMISSIONS_FETCHED: "Game submissions fetched successfully.",
    SUBMISSION_NOT_FOUND: "Submission entry not found.",
    NOT_REGISTERED: "You must register for this game before submitting.",
    GAME_CLOSED: "This game is closed. Submissions are no longer accepted.",
  } as const;
}

export const SubmissionConstant = SubmissionConstants;
