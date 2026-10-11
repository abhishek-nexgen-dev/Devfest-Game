import { z } from "zod";

/**
 * Validator for each game entry inside participant's games array
 */
export const participantGameItemValidator = z.object({
  game_id: z.coerce.number().int().positive("Valid game_id is required"),
  game_name: z.string().trim().optional(),
  Total_game_point: z.coerce.number().int().min(0, "Points cannot be negative").optional(),
  isCompleted: z.boolean().optional(),
  is_completed: z.boolean().optional(),
  point: z.coerce.number().int().min(0, "Points cannot be negative").optional(),
  points: z.coerce.number().int().min(0, "Points cannot be negative").optional(),
});

export type IParticipantGameItemInput = z.infer<typeof participantGameItemValidator>;

/**
 * Validator for creating a new Participant (Public — anyone can create)
 */
export const createParticipantValidator = z.object({
  ticket_id: z
    .string()
    .trim()
    .min(1, "Ticket ID is required")
    .max(32, "Ticket ID must not exceed 32 characters"),

  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must not exceed 150 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),

  mobile_number: z
    .string()
    .trim()
    .min(10, "Mobile number must be at least 10 digits")
    .max(20, "Mobile number must not exceed 20 characters"),

  social_link: z.string().trim().min(1, "Social link is required"),

  profile_image: z.string().trim().optional().nullable(),

  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(150, "Location must not exceed 150 characters"),

  github_url: z.string().trim().optional().nullable(),

  primary_language: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Programming language cannot be empty")
        .max(100, "Programming language must not exceed 100 characters"),
    )
    .min(1, "At least one primary programming/tech language is required"),

  games: z.array(participantGameItemValidator).optional().default([]),

  total_points: z.coerce.number().int().min(0).optional().default(0),

  is_certificate_claim: z.boolean().optional().default(false),
});

export type createParticipant_Type = z.infer<typeof createParticipantValidator>;

/**
 * Validator for ticket_id parameter / identifier
 */
export const ticketIdValidator = z
  .string({ required_error: "Ticket ID is required" })
  .trim()
  .min(1, "Ticket ID is required")
  .max(32, "Ticket ID must not exceed 32 characters");

/**
 * Validator for public participant joining a game
 * Takes email and ticket_id + game_id (or games array)
 * game_name is resolved automatically from the database
 * isCompleted defaults to false, Total_game_point defaults to 0
 */
export const joinParticipantGameValidator = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .max(255, "Email must not exceed 255 characters"),

    ticket_id: z
      .string({ required_error: "Ticket ID is required" })
      .trim()
      .min(1, "Ticket ID is required")
      .max(32, "Ticket ID must not exceed 32 characters"),

    game_id: z.coerce.number().int().positive("Valid game_id is required").optional(),

    games: z.array(participantGameItemValidator).optional(),
  })
  .refine(
    (data) => data.game_id !== undefined || (Array.isArray(data.games) && data.games.length > 0),
    {
      message: "Valid game_id is required.",
      path: ["game_id"],
    },
  );

export type joinParticipantGame_Type = z.infer<typeof joinParticipantGameValidator>;

/**
 * Validator for updating an existing Participant (SUPER_ADMIN & ADMIN full updates or public join)
 */
export const updateParticipantValidator = z.object({
  ticket_id: z.string().trim().max(32, "Ticket ID must not exceed 32 characters").optional(),

  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must not exceed 150 characters")
    .optional(),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .optional(),

  mobile_number: z
    .string()
    .trim()
    .min(10, "Mobile number must be at least 10 digits")
    .max(20, "Mobile number must not exceed 20 characters")
    .optional(),

  social_link: z.string().trim().min(1, "Social link cannot be empty").optional(),

  profile_image: z.string().trim().optional().nullable(),

  location: z
    .string()
    .trim()
    .min(1, "Location cannot be empty")
    .max(150, "Location must not exceed 150 characters")
    .optional(),

  github_url: z.string().trim().optional().nullable(),

  primary_language: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Programming language cannot be empty")
        .max(100, "Programming language must not exceed 100 characters"),
    )
    .min(1, "At least one primary programming/tech language is required")
    .optional(),

  games: z.array(participantGameItemValidator).optional(),

  total_points: z.coerce.number().int().min(0).optional(),

  is_certificate_claim: z.boolean().optional(),
});

export type updateParticipant_Type = z.infer<typeof updateParticipantValidator>;
