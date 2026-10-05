/**
 * GDG Ranchi DevFest 2026 - Authentication Constants
 * Centralized constant definitions, message codes, cookie policies, and route definitions.
 */

export class AuthConstants {
  public static readonly ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    PARTICIPANT: "PARTICIPANT",
  } as const;

  public static readonly USER_STATUS = {
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
  } as const;

  public static readonly COOKIE_NAME = "token";

  public static readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/",
  };

  public static readonly SALT_ROUNDS = 10;
  public static readonly TOKEN_EXPIRY = "7d";
  public static readonly PARTICIPANT_ID_PREFIX = "GDGR";

  public static readonly ROUTES = {
    ROOT: "/",
    REGISTER: "/register",
    LOGIN: "/login",
    LOGOUT: "/logout",
    ME: "/me",
    CHANGE_PASSWORD: "/change-password",
    VERIFY: "/verify",
    INIT_ADMIN: "/init-admin",
  } as const;

  public static readonly MESSAGES = {
    REGISTER_SUCCESS: "User registered successfully.",
    LOGIN_SUCCESS: "Login successful.",
    LOGOUT_SUCCESS: "Logged out successfully.",
    PROFILE_FETCHED: "Current user profile fetched successfully.",
    PASSWORD_CHANGED: "Password changed successfully.",
    SESSION_VALID: "Session token is valid.",
    ADMIN_SEEDED: "Super Admin initialized successfully.",
    ADMIN_ALREADY_EXISTS: "Super Admin account already exists.",

    // Error messages
    EMAIL_ALREADY_EXISTS: "An account with this email address already exists.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    ACCOUNT_DISABLED: "Your account is disabled. Please contact GDG Ranchi organizers.",
    USER_NOT_FOUND: "User account not found.",
    PARTICIPANT_NOT_FOUND: "Associated participant record not found.",
    INVALID_OLD_PASSWORD: "The current password provided is incorrect.",
    PASSWORDS_DO_NOT_MATCH: "Password and Confirm Password do not match.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    TOKEN_MISSING:
      "Authentication token is missing. Please provide Authorization Bearer header or cookie.",
    TOKEN_EXPIRED: "Authentication token has expired or is invalid.",
    FORBIDDEN: "You do not have permission to access this resource.",
  } as const;
}

// Aliases for developer convenience
export const AuthConstant = AuthConstants;
export const AUTH_ROLES = AuthConstants.ROLES;
export const AUTH_MESSAGES = AuthConstants.MESSAGES;
export const AUTH_ROUTES = AuthConstants.ROUTES;
export const AUTH_COOKIE_NAME = AuthConstants.COOKIE_NAME;
export const AUTH_COOKIE_OPTIONS = AuthConstants.COOKIE_OPTIONS;
