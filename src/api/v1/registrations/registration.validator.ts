import { z } from "zod";
import { validateBody, validateParams } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Registration Validators
 */
export class RegistrationValidator {
  public static readonly REGISTER_SCHEMA = z.object({
    gameId: z.string().min(1, "Game ID is required"),
  });

  public static readonly GAME_PARAMS_SCHEMA = z.object({
    gameId: z.string().min(1, "Game ID is required"),
  });

  public static readonly VALIDATE_REGISTER = validateBody(RegistrationValidator.REGISTER_SCHEMA);
  public static readonly VALIDATE_GAME_PARAMS = validateParams(
    RegistrationValidator.GAME_PARAMS_SCHEMA,
  );
}
