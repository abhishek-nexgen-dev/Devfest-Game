import { z } from "zod";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Participant Input Validators
 */
export class ParticipantValidator {
  /**
   * Schema for updating participant profile details.
   */
  public static readonly UPDATE_PROFILE_SCHEMA = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    mobile: z
      .string()
      .trim()
      .regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid mobile number")
      .optional(),
    organization: z.string().trim().max(100).optional(),
    city: z.string().trim().max(60).optional(),
    profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
  });

  /**
   * Schema for filtering and searching participants list.
   */
  public static readonly FILTER_SCHEMA = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    organization: z.string().trim().optional(),
    city: z.string().trim().optional(),
    status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  });

  /**
   * Schema for URL path ID parameters.
   */
  public static readonly PARAMS_ID_SCHEMA = z.object({
    id: z.string().min(1, "Target ID is required"),
  });

  public static readonly UPDATE_STATUS_SCHEMA = z.object({
    status: z.enum(["ACTIVE", "DISABLED"]),
  });

  public static readonly VALIDATE_UPDATE_PROFILE = validateBody(
    ParticipantValidator.UPDATE_PROFILE_SCHEMA,
  );
  public static readonly VALIDATE_FILTER = validateQuery(ParticipantValidator.FILTER_SCHEMA);
  public static readonly VALIDATE_PARAMS_ID = validateParams(ParticipantValidator.PARAMS_ID_SCHEMA);
  public static readonly VALIDATE_UPDATE_STATUS = validateBody(
    ParticipantValidator.UPDATE_STATUS_SCHEMA,
  );
}
