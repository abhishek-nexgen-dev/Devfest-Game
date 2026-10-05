import { z } from "zod";
import { validateBody, validateParams } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Game Validators
 */
export class GameValidator {
  public static readonly CREATE_GAME_SCHEMA = z.object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().max(1000).optional(),
    gameType: z.enum(["INDIVIDUAL", "TEAM"]),
    maxScore: z.coerce.number().int().positive().max(1000).default(100),
  });

  public static readonly UPDATE_GAME_SCHEMA = z.object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    gameType: z.enum(["INDIVIDUAL", "TEAM"]).optional(),
    maxScore: z.coerce.number().int().positive().max(1000).optional(),
    status: z.enum(["UPCOMING", "ACTIVE", "CLOSED"]).optional(),
  });

  public static readonly PARAMS_ID_SCHEMA = z.object({
    id: z.string().min(1, "Game ID is required"),
  });

  public static readonly VALIDATE_CREATE = validateBody(GameValidator.CREATE_GAME_SCHEMA);
  public static readonly VALIDATE_UPDATE = validateBody(GameValidator.UPDATE_GAME_SCHEMA);
  public static readonly VALIDATE_PARAMS_ID = validateParams(GameValidator.PARAMS_ID_SCHEMA);
}
