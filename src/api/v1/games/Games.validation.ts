import { z } from "zod";
import { GameStatus, GameTypeEnum, GameTrackEnum } from "./Game.Type";

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
        ]),
      ])
      .optional()
      .default(GameTypeEnum.ON_BOOTH),

    is_completed: z.coerce.boolean().optional().default(false),

    tagline: z.string().trim().optional().nullable(),

    track: z
      .union([
        z.nativeEnum(GameTrackEnum),
        z.enum(["Conference", "Beginner Track", "Flagship Dev Track", "All Track"]),
      ])
      .optional()
      .default(GameTrackEnum.FLAGSHIP_DEV_TRACK),

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
        ]),
      ])
      .optional(),

    is_completed: z.coerce.boolean().optional(),

    tagline: z.string().trim().optional().nullable(),

    track: z
      .union([
        z.nativeEnum(GameTrackEnum),
        z.enum(["Conference", "Beginner Track", "Flagship Dev Track", "All Track"]),
      ])
      .optional(),

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

/**
 * Validator for searching, filtering, sorting, and paginating games
 */
export const gameQueryValidator = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  type: z.string().trim().optional(),
  game_type: z.string().trim().optional(),
  status: z.string().trim().optional(),
  track: z.string().trim().optional(),
  is_completed: z.preprocess((val) => {
    if (typeof val === "string") {
      if (val.toLowerCase() === "true" || val === "1") return true;
      if (val.toLowerCase() === "false" || val === "0") return false;
    }
    return val;
  }, z.boolean().optional()),
  sort_by: z
    .enum([
      "id",
      "game_name",
      "max_score",
      "registrations",
      "submissions",
      "start_time",
      "end_time",
      "status",
      "game_type",
      "track",
      "created_at",
    ])
    .default("id"),
  order: z.enum(["ASC", "DESC", "asc", "desc"]).default("ASC"),
  all: z.preprocess((val) => {
    if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
    return Boolean(val);
  }, z.boolean().default(false)),
});

export type gameQuery_Type = z.infer<typeof gameQueryValidator>;
