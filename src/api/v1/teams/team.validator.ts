import { z } from "zod";
import { validateBody, validateParams } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Team Validators
 */
export class TeamValidator {
  public static readonly CREATE_TEAM_SCHEMA = z.object({
    teamName: z
      .string()
      .trim()
      .min(3, "Team name must be at least 3 characters")
      .max(50, "Team name cannot exceed 50 characters"),
  });

  public static readonly JOIN_TEAM_SCHEMA = z.object({
    teamCode: z
      .string()
      .trim()
      .min(4, "Team code must be at least 4 characters")
      .max(20, "Team code cannot exceed 20 characters"),
  });

  public static readonly PARAMS_ID_SCHEMA = z.object({
    id: z.string().min(1, "Team ID is required"),
  });

  public static readonly VALIDATE_CREATE = validateBody(TeamValidator.CREATE_TEAM_SCHEMA);
  public static readonly VALIDATE_JOIN = validateBody(TeamValidator.JOIN_TEAM_SCHEMA);
  public static readonly VALIDATE_PARAMS_ID = validateParams(TeamValidator.PARAMS_ID_SCHEMA);
}
