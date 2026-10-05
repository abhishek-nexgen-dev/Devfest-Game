import { z } from "zod";
import { validateBody, validateParams } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Result Validators
 */
export class ResultValidator {
  public static readonly UPDATE_SCORE_SCHEMA = z.object({
    gameId: z.string().min(1, "Game ID is required"),
    participantId: z.string().optional(),
    teamId: z.string().optional(),
    score: z.coerce.number().int().min(0, "Score cannot be negative"),
    reason: z.string().trim().max(255).optional(),
  });

  public static readonly PARAMS_ID_SCHEMA = z.object({
    id: z.string().min(1, "ID is required"),
  });

  public static readonly VALIDATE_UPDATE_SCORE = validateBody(ResultValidator.UPDATE_SCORE_SCHEMA);
  public static readonly VALIDATE_PARAMS_ID = validateParams(ResultValidator.PARAMS_ID_SCHEMA);
}
