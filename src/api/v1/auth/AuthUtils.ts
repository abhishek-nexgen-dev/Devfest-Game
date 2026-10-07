import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";
import { AuthRole, IUserDoc, ISanitizedUser, IAuthTokenPayload } from "./Auth.type";
import { env_Constant } from "../../../constants/env.constant";
import { AuthConstants } from "./auth.constants";

export interface IUserLookupResult {
  empty: boolean;
  exists: boolean;
  id?: string;
  data: () => IUserDoc | null;
  user: IUserDoc | null;
}

const formatIsoDate = (val?: Date | string | null): string => {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  return new Date(val).toISOString();
};

export class AuthUtils {
  public static SANITIZE_USER(user: any): ISanitizedUser {
    const { password: _pwd, passwordHash: _hash, ...sanitized } = user;
    return {
      id: sanitized.id || "",
      name: sanitized.name || "",
      email: sanitized.email,
      role: sanitized.role || "ADMIN",
      status: sanitized.status || "ACTIVE",
      createdAt: formatIsoDate(sanitized.createdAt),
      updatedAt: formatIsoDate(sanitized.updatedAt),
    };
  }

  public static NORMALIZE_EMAIL(email: string): string {
    return email.trim().toLowerCase();
  }

  public static async HASH_PASSWORD(password: string): Promise<string> {
    return await bcrypt.hash(password, AuthConstants.SALT_ROUNDS);
  }

  public static async COMPARE_PASSWORD(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  public static GENERATE_TOKEN(payload: IAuthTokenPayload): string {
    const secret = env_Constant.JWT_SECRET || "devfest_super_secret_jwt_key_2026";
    return jwt.sign(payload, secret, {
      expiresIn: (env_Constant.JWT_EXPIRES_IN || "7d") as any,
    });
  }

  public static VERIFY_TOKEN(token: string): IAuthTokenPayload {
    const secret = env_Constant.JWT_SECRET || "devfest_super_secret_jwt_key_2026";
    return jwt.verify(token, secret) as IAuthTokenPayload;
  }

  /**
   * Find an Admin / Super Admin user by email using pg.query
   */
  Find_User_By_Email = async (email: string): Promise<IUserLookupResult> => {
    const normalized = email.trim().toLowerCase();

    const result = await pg.query<IUserDoc>(
      `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM ${COLLECTIONS.USERS}
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
      `,
      [normalized],
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const data: IUserDoc = {
        ...row,
        createdAt: formatIsoDate(row.createdAt),
        updatedAt: formatIsoDate(row.updatedAt),
      };
      return {
        empty: false,
        exists: true,
        id: data.id,
        data: () => data,
        user: data,
      };
    }

    return {
      empty: true,
      exists: false,
      data: () => null,
      user: null,
    };
  };

  /**
   * Find an Admin / Super Admin user by primary ID using pg.query
   */
  Find_User_By_Id = async (id: string): Promise<IUserDoc | null> => {
    const result = await pg.query<IUserDoc>(
      `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM ${COLLECTIONS.USERS}
      WHERE id = $1
      LIMIT 1;
      `,
      [id],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      createdAt: formatIsoDate(row.createdAt),
      updatedAt: formatIsoDate(row.updatedAt),
    };
  };

  /**
   * Count users by role ('SUPER_ADMIN' or 'ADMIN') using pg.query
   */
  Count_Users_By_Role = async (role: AuthRole): Promise<number> => {
    const result = await pg.query<{ count: number }>(
      `
      SELECT COUNT(*)::int AS count
      FROM ${COLLECTIONS.USERS}
      WHERE role = $1;
      `,
      [role],
    );
    return Number(result.rows[0]?.count ?? 0);
  };

  /**
   * Save Admin / Super Admin user record to PostgreSQL using pg.query
   */
  Save_User = async (userDoc: IUserDoc): Promise<void> => {
    await pg.query(
      `
      INSERT INTO ${COLLECTIONS.USERS} (
        id, name, email, password_hash, role, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;
      `,
      [
        userDoc.id,
        userDoc.name,
        userDoc.email,
        userDoc.passwordHash,
        userDoc.role,
        userDoc.status,
        formatIsoDate(userDoc.createdAt),
        formatIsoDate(userDoc.updatedAt),
      ],
    );
  };

  /**
   * Update User password in PostgreSQL using pg.query
   */
  Update_User_Password = async (userId: string, newHash: string): Promise<void> => {
    const now = new Date().toISOString();
    await pg.query(
      `
      UPDATE ${COLLECTIONS.USERS}
      SET password_hash = $1, updated_at = $2
      WHERE id = $3;
      `,
      [newHash, now, userId],
    );
  };

  /**
   * Hash a plain text password using bcrypt
   */
  Hash_Password = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, AuthConstants.SALT_ROUNDS);
  };

  /**
   * Compare plain text password against stored hash
   */
  Compare_Password = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  };

  /**
   * Generate JWT authentication token
   */
  Generate_Token = (payload: IAuthTokenPayload): string => {
    const secret = env_Constant.JWT_SECRET || "devfest_super_secret_jwt_key_2026";
    return jwt.sign(payload, secret, {
      expiresIn: (env_Constant.JWT_EXPIRES_IN || "7d") as any,
    });
  };

  /**
   * Verify and decode a JWT authentication token
   */
  Verify_Token = (token: string): IAuthTokenPayload => {
    const secret = env_Constant.JWT_SECRET || "devfest_super_secret_jwt_key_2026";
    return jwt.verify(token, secret) as IAuthTokenPayload;
  };

  /**
   * Extract authentication token from Express Request (Header or Cookie)
   */
  Extract_Token = (req: {
    headers: { authorization?: string };
    cookies?: Record<string, string>;
  }): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }
    if (req.cookies && req.cookies[AuthConstants.COOKIE_NAME]) {
      return req.cookies[AuthConstants.COOKIE_NAME];
    }
    return null;
  };

  /**
   * Sanitize user record for client responses
   */
  Sanitize_User = (user: IUserDoc): ISanitizedUser => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: formatIsoDate(user.createdAt),
      updatedAt: formatIsoDate(user.updatedAt),
    };
  };
}

export const authUtils = new AuthUtils();
export default authUtils;
