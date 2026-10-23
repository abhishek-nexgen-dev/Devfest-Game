import { z } from "zod";
import { GameStatus, GameTypeEnum } from "./Game.Type";

/**
 * Validator for creating a new Game (SUPER_ADMIN, ADMIN & Public Arena Manager)
 */
export const createGameValidator = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),

    game_name: z
      .string({ required_error: "Game name is required" })
      .trim()
      .min(2, "Game name must be at least 2 characters")
      .max(150, "Game name must not exceed 150 characters"),

    description: z.string().trim().optional().nullable().default(""),

    max_score: z.coerce
      .number()
      .int()
      .min(0, "Maximum score cannot be negative")
      .optional()
      .default(100),

    registrations: z.coerce
      .number()
      .int()
      .min(0, "Registrations cannot be negative")
      .optional()
      .default(0),

    submissions: z.coerce
      .number()
      .int()
      .min(0, "Submissions cannot be negative")
      .optional()
      .default(0),

    start_time: z.coerce
      .date({
        invalid_type_error: "Invalid start_time format",
      })
      .optional()
      .default(() => new Date()),

    end_time: z.coerce
      .date({
        invalid_type_error: "Invalid end_time format",
      })
      .optional()
      .default(() => new Date(Date.now() + 86400000)), // +24 hours

    status: z
      .union([
        z.nativeEnum(GameStatus),
        z.enum(["UPCOMING", "ACTIVE", "CLOSED", "COMPLETED"]),
      ])
      .optional()
      .default(GameStatus.ACTIVE),

    game_type: z
      .union([
        z.nativeEnum(GameTypeEnum),
        z.enum([
          "ON_BOOTH",
          "ON_STAGE",
          "QUIZ_ARENA",
          "HACK_SPRINT",
          "OPEN_CHALLENGE",
          "INDIVIDUAL",
          "TEAM",
        ]),
      ])
      .optional()
      .default(GameTypeEnum.ON_BOOTH),

    is_completed: z.coerce.boolean().optional().default(false),

    external_url: z.string().trim().optional().nullable(),

    tagline: z.string().trim().optional().nullable(),

    track: z.string().trim().optional().nullable().default("Flagship Devtrack"),

    venue: z.string().trim().optional().nullable().default("Main Stage"),

    rules: z.string().trim().optional().nullable(),

    created_by: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return data.end_time >= data.start_time;
      }
      return true;
    },
    {
      message: "End time must be after or equal to start time",
      path: ["end_time"],
    },
  );

export type createGame_Type = z.infer<typeof createGameValidator>;

/**
 * Validator for updating an existing Game (SUPER_ADMIN, ADMIN & Arena Manager)
 */
export const updateGameValidator = z
  .object({
    game_name: z
      .string()
      .trim()
      .min(2, "Game name must be at least 2 characters")
      .max(150, "Game name must not exceed 150 characters")
      .optional(),

    description: z.string().trim().optional().nullable(),

    max_score: z.coerce.number().int().min(0, "Maximum score cannot be negative").optional(),

    registrations: z.coerce.number().int().min(0, "Registrations cannot be negative").optional(),

    submissions: z.coerce.number().int().min(0, "Submissions cannot be negative").optional(),

    start_time: z.coerce
      .date({
        invalid_type_error: "Invalid start_time format",
      })
      .optional(),

    end_time: z.coerce
      .date({
        invalid_type_error: "Invalid end_time format",
      })
      .optional(),

    status: z
      .union([
        z.nativeEnum(GameStatus),
        z.enum(["UPCOMING", "ACTIVE", "CLOSED", "COMPLETED"]),
      ])
      .optional(),

    game_type: z
      .union([
        z.nativeEnum(GameTypeEnum),
        z.enum([
          "ON_BOOTH",
          "ON_STAGE",
          "QUIZ_ARENA",
          "HACK_SPRINT",
          "OPEN_CHALLENGE",
          "INDIVIDUAL",
          "TEAM",
        ]),
      ])
      .optional(),

    is_completed: z.coerce.boolean().optional(),

    external_url: z.string().trim().optional().nullable(),

    tagline: z.string().trim().optional().nullable(),

    track: z.string().trim().optional().nullable(),

    venue: z.string().trim().optional().nullable(),

    rules: z.string().trim().optional().nullable(),

    created_by: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return data.end_time >= data.start_time;
      }
      return true;
    },
    {
      message: "End time must be after or equal to start time",
      path: ["end_time"],
    },
  );

export type updateGame_Type = z.infer<typeof updateGameValidator>;
