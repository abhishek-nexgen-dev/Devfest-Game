import { z } from "zod";

/**
 * Validator for each game entry inside participant's games array
 */
export const participantGameItemValidator = z.object({
  game_id: z.coerce.number().int().positive("Valid game_id is required"),
  game_name: z.string().trim().optional(),
  Total_game_point: z.coerce.number().int().min(0, "Points cannot be negative").optional(),
  isCompleted: z.boolean().optional(),
  point: z.coerce.number().int().min(0, "Points cannot be negative").optional(),
});

export type IParticipantGameItemInput = z.infer<typeof participantGameItemValidator>;

/**
 * Validator for creating a new Participant (Public — anyone can create)
 */
export const createParticipantValidator = z.object({
  ticket_id: z
    .string({ required_error: "Ticket ID is required" })
    .trim()
    .min(1, "Ticket ID is required")
    .max(32, "Ticket ID must not exceed 32 characters"),

  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must not exceed 150 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),

  mobile_number: z
    .string()
    .trim()
    .max(20, "Mobile number must not exceed 20 characters")
    .optional()
    .default("N/A")
    .transform((val) => (!val || val.trim() === "" ? "N/A" : val.trim())),

  social_link: z
    .string()
    .trim()
    .optional()
    .default("N/A")
    .transform((val) => (!val || val.trim() === "" ? "N/A" : val.trim())),

  profile_image: z.string().trim().optional().nullable().default(null),

  location: z
    .string()
    .trim()
    .max(150, "Location must not exceed 150 characters")
    .optional()
    .default("Ranchi")
    .transform((val) => (!val || val.trim() === "" ? "Ranchi" : val.trim())),

  track: z
    .string()
    .trim()
    .max(100, "Track must not exceed 100 characters")
    .optional()
    .nullable()
    .default(null),

  github_url: z.string().trim().optional().nullable().default(null),

  primary_language: z.preprocess(
    (val) => {
      if (Array.isArray(val)) {
        const cleaned = val.map((s) => String(s).trim()).filter(Boolean);
        return cleaned.length > 0 ? cleaned : ["General"];
      }
      if (typeof val === "string") {
        const cleaned = val.split(/[,;/]/).map((s) => s.trim()).filter(Boolean);
        return cleaned.length > 0 ? cleaned : ["General"];
      }
      return ["General"];
    },
    z
      .array(
        z
          .string()
          .trim()
          .min(1, "Programming language cannot be empty")
          .max(100, "Programming language must not exceed 100 characters"),
      )
      .min(1, "At least one primary programming/tech language is required"),
  ),

  games: z.array(participantGameItemValidator).optional().default([]),

  total_points: z.coerce.number().int().min(0).optional().default(0),

  is_certificate_claim: z.boolean().optional().default(false),
});

export type createParticipant_Type = z.infer<typeof createParticipantValidator>;

/**
 * Normalizes incoming bulk payload into an array of participants.
 * Supports:
 * - Direct array: [ { ... }, { ... } ]
 * - Object wrapper: { participants: [ ... ] }, { data: [ ... ] }, or { items: [ ... ] }
 * - Single participant object: { ticket_id: ... }
 */
const normalizeBulkInput = (input: unknown): unknown => {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    const payload = input as Record<string, unknown>;
    if (Array.isArray(payload.participants)) return payload.participants;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if ("ticket_id" in payload) return [payload];
  }
  return input;
};

export const bulkCreateParticipantValidator = z.preprocess(
  normalizeBulkInput,
  z
    .array(createParticipantValidator)
    .min(1, "At least one participant is required for bulk creation"),
);

export type bulkCreateParticipant_Type = z.infer<typeof bulkCreateParticipantValidator>;

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
    .max(20, "Mobile number must not exceed 20 characters")
    .optional(),

  social_link: z.string().trim().optional(),

  profile_image: z.string().trim().optional().nullable(),

  location: z
    .string()
    .trim()
    .max(150, "Location must not exceed 150 characters")
    .optional(),

  track: z
    .string()
    .trim()
    .max(100, "Track must not exceed 100 characters")
    .optional()
    .nullable(),

  github_url: z.string().trim().optional().nullable(),

  primary_language: z
    .preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        if (Array.isArray(val)) {
          const cleaned = val.map((s) => String(s).trim()).filter(Boolean);
          return cleaned.length > 0 ? cleaned : undefined;
        }
        if (typeof val === "string") {
          const cleaned = val.split(/[,;/]/).map((s) => s.trim()).filter(Boolean);
          return cleaned.length > 0 ? cleaned : undefined;
        }
        return val;
      },
      z
        .array(
          z
            .string()
            .trim()
            .min(1, "Programming language cannot be empty")
            .max(100, "Programming language must not exceed 100 characters"),
        )
        .min(1, "At least one primary programming/tech language is required"),
    )
    .optional(),

  games: z.array(participantGameItemValidator).optional(),

  total_points: z.coerce.number().int().min(0).optional(),

  is_certificate_claim: z.boolean().optional(),
});

export type updateParticipant_Type = z.infer<typeof updateParticipantValidator>;

/**
 * Validator for participant query params (pagination, filtering, searching)
 */
export const participantQueryValidator = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().trim().optional(),
  track: z.string().trim().optional(),
  is_certificate_claim: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  has_games: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  sort_by: z
    .string()
    .trim()
    .default("total_points")
    .transform((val) => {
      const allowed = ["total_points", "created_at", "ticket_id", "name", "id", "updated_at"];
      const lower = val.toLowerCase();
      return allowed.includes(lower) ? lower : "total_points";
    }),
  order: z
    .string()
    .trim()
    .toUpperCase()
    .default("DESC")
    .transform((val) => (val === "ASC" ? "ASC" : "DESC")),
  all: z
    .preprocess((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true" || val === "1";
      }
      return Boolean(val);
    }, z.boolean().default(false))
    .default(false),
});

export type ParticipantQuery_Type = z.infer<typeof participantQueryValidator>;
