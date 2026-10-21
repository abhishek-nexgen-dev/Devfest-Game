import { z } from "zod";
import { GameStatus } from "./Game.Type";

/**
 * Validator for creating a new Game (SUPER_ADMIN & ADMIN)
 */
export const createGameValidator = z
  .object({
    game_name: z
      .string()
      .trim()
      .min(2, "Game name must be at least 2 characters")
      .max(150, "Game name must not exceed 150 characters"),

    description: z.string().trim().optional().nullable(),

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

    start_time: z.coerce.date({
      required_error: "start_time is required",
      invalid_type_error: "Invalid start_time format",
    }),

    end_time: z.coerce.date({
      required_error: "end_time is required",
      invalid_type_error: "Invalid end_time format",
    }),

    status: z
      .nativeEnum(GameStatus, {
        errorMap: () => ({ message: "Status must be UPCOMING, ACTIVE, CLOSED, or COMPLETED" }),
      })
      .optional()
      .default(GameStatus.UPCOMING),

    created_by: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export type createGame_Type = z.infer<typeof createGameValidator>;

/**
 * Validator for updating an existing Game (SUPER_ADMIN & ADMIN)
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
      .nativeEnum(GameStatus, {
        errorMap: () => ({ message: "Status must be UPCOMING, ACTIVE, CLOSED, or COMPLETED" }),
      })
      .optional(),

    created_by: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return data.end_time > data.start_time;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    },
  );

export type updateGame_Type = z.infer<typeof updateGameValidator>;
