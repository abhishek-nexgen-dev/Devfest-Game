import { z } from "zod";

/**
 * Validator for Super Admin adding an Admin (name, email, password)
 */
export const addAdminValidator = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must not exceed 128 characters"),

  role: z.enum(["SUPER_ADMIN", "ADMIN"]).optional().default("ADMIN"),
  department: z.string().optional().default("Operations"),
});

export type addAdmin_Type = z.infer<typeof addAdminValidator>;

/**
 * Validator for Admin & Super Admin Login
 */
export const loginValidator = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters"),
});

export type login_Type = z.infer<typeof loginValidator>;

/**
 * Validator for changing password
 */
export const changePasswordValidator = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => Boolean(data.oldPassword || data.currentPassword), {
    message: "Current password is required",
    path: ["currentPassword"],
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type changePassword_Type = z.infer<typeof changePasswordValidator>;

/**
 * Validator for admin query params (pagination, filtering, searching)
 */
export const adminQueryValidator = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.string().trim().optional(),
  status: z.string().trim().optional(),
  department: z.string().trim().optional(),
  sort_by: z
    .string()
    .trim()
    .default("created_at")
    .transform((val) => {
      const allowed = ["created_at", "name", "email", "role", "status", "department", "id"];
      const lower = val.toLowerCase();
      return allowed.includes(lower) ? lower : "created_at";
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

export type adminQuery_Type = z.infer<typeof adminQueryValidator>;

export const AuthValidator = {
  ADD_ADMIN_SCHEMA: addAdminValidator,
  LOGIN_SCHEMA: loginValidator,
  CHANGE_PASSWORD_SCHEMA: changePasswordValidator,
  ADMIN_QUERY_SCHEMA: adminQueryValidator,
};

export default AuthValidator;
