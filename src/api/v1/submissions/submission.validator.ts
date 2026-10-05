import { z } from "zod";
import { validateBody, validateParams } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Submission Validators
 */
export class SubmissionValidator {
  public static readonly CREATE_SCHEMA = z.object({
    gameId: z.string().min(1, "Game ID is required"),
    submissionData: z.string().min(1, "Submission content or URL is required"),
  });

  public static readonly PARAMS_ID_SCHEMA = z.object({
    id: z.string().min(1, "Submission ID is required"),
  });

  public static readonly VALIDATE_CREATE = validateBody(SubmissionValidator.CREATE_SCHEMA);
  public static readonly VALIDATE_PARAMS_ID = validateParams(SubmissionValidator.PARAMS_ID_SCHEMA);
}
