import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request } from "express";
import { env_Constant } from "../../../constants/env.constant";
import { AuthConstants } from "./auth.constants";
import { IAuthTokenPayload, ISanitizedUser } from "./auth.types";

/**
 * GDG Ranchi DevFest 2026 - Authentication Utility Toolkit
 * Cryptographic helpers, password hashing, JWT manipulation, and identifier formatting.
 */
export class AuthUtils {
  /**
   * Hashes plain-text password using bcrypt.
   */
  public static async HASH_PASSWORD(
    password: string,
    saltRounds: number = AuthConstants.SALT_ROUNDS,
  ): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares plain-text password against a bcrypt hash.
   */
  public static async COMPARE_PASSWORD(
    plainText: string,
    hashedPassword?: string | null,
  ): Promise<boolean> {
    if (!hashedPassword) return false;
    return bcrypt.compare(plainText, hashedPassword);
  }

  /**
   * Generates a signed JWT access token containing the authenticated user identity.
   */
  public static GENERATE_ACCESS_TOKEN(payload: IAuthTokenPayload): string {
    return jwt.sign(payload, env_Constant.JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  /**
   * Verifies and decodes a signed JWT access token.
   * Throws JsonWebTokenError or TokenExpiredError if invalid.
   */
  public static VERIFY_ACCESS_TOKEN(token: string): IAuthTokenPayload {
    return jwt.verify(token, env_Constant.JWT_SECRET) as IAuthTokenPayload;
  }

  /**
   * Generates a unique, standardized Participant ID string.
   * Format: GDGR-XXXX (4 numeric characters).
   */
  public static GENERATE_PARTICIPANT_ID(
    prefix: string = AuthConstants.PARTICIPANT_ID_PREFIX,
  ): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${randomSuffix}`;
  }

  /**
   * Strips password hash and sensitive fields from a user entity before returning in responses.
   */
  public static SANITIZE_USER(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    password?: string;
  }): ISanitizedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
      status: user.status as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Extracts JWT token from either the Authorization header (Bearer scheme) or HTTP cookies.
   */
  public static EXTRACT_TOKEN_FROM_REQUEST(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }
    if (req.cookies && req.cookies[AuthConstants.COOKIE_NAME]) {
      return req.cookies[AuthConstants.COOKIE_NAME];
    }
    return null;
  }

  /**
   * Standardizes email addresses (lowercased, trimmed).
   */
  public static NORMALIZE_EMAIL(email: string): string {
    return email.trim().toLowerCase();
  }
}
