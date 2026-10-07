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
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
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

export const AuthValidator = {
  ADD_ADMIN_SCHEMA: addAdminValidator,
  LOGIN_SCHEMA: loginValidator,
  CHANGE_PASSWORD_SCHEMA: changePasswordValidator,
};

export default AuthValidator;
