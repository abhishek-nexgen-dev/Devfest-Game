import { z } from "zod";
import { AuthConstants } from "./auth.constants";
import { validateBody } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Authentication Input Validators
 * Type-safe Zod schema validation for all authentication endpoints.
 */
export class AuthValidator {
  /**
   * Registration payload schema with password confirmation matching.
   */
  public static readonly REGISTER_SCHEMA = z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name cannot exceed 100 characters"),
      email: z
        .string()
        .trim()
        .email("A valid email address is required")
        .max(150, "Email cannot exceed 150 characters"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password cannot exceed 64 characters")
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
      confirmPassword: z.string().min(1, "Confirm password is required"),
      mobile: z
        .string()
        .trim()
        .regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid 10-15 digit mobile number"),
      organization: z.string().trim().max(100).optional(),
      city: z.string().trim().max(60).optional(),
      profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: AuthConstants.MESSAGES.PASSWORDS_DO_NOT_MATCH,
      path: ["confirmPassword"],
    });

  /**
   * User login payload schema.
   */
  public static readonly LOGIN_SCHEMA = z.object({
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  });

  /**
   * Password change payload schema with verification.
   */
  public static readonly CHANGE_PASSWORD_SCHEMA = z
    .object({
      oldPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters long")
        .max(64, "New password cannot exceed 64 characters")
        .regex(/[A-Za-z]/, "New password must contain at least one letter")
        .regex(/[0-9]/, "New password must contain at least one number"),
      confirmNewPassword: z.string().min(1, "Confirm new password is required"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: AuthConstants.MESSAGES.PASSWORDS_DO_NOT_MATCH,
      path: ["confirmNewPassword"],
    });

  /**
   * Express middleware for validating registration request bodies.
   */
  public static readonly VALIDATE_REGISTER = validateBody(AuthValidator.REGISTER_SCHEMA);

  /**
   * Express middleware for validating login request bodies.
   */
  public static readonly VALIDATE_LOGIN = validateBody(AuthValidator.LOGIN_SCHEMA);

  /**
   * Express middleware for validating password update request bodies.
   */
  public static readonly VALIDATE_CHANGE_PASSWORD = validateBody(
    AuthValidator.CHANGE_PASSWORD_SCHEMA,
  );
}
