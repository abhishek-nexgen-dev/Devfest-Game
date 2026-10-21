import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";
import { AuthRole, IUserDoc, ISanitizedUser, IAuthTokenPayload } from "./Auth.type";
import { env_Constant } from "../../../constants/env.constant";
import { AuthConstants } from "./auth.constants";

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
      department: sanitized.department || "Operations",
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
  Find_User_By_Email = async (email: string): Promise<IUserDoc | null> => {
    const normalized = email.trim().toLowerCase();

    const result = await pg.query<IUserDoc>(
      `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        COALESCE(department, 'Operations') AS department,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM ${COLLECTIONS.USERS}
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
      `,
      [normalized],
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
        COALESCE(department, 'Operations') AS department,
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
        id, name, email, password_hash, role, department, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;
      `,
      [
        userDoc.id,
        userDoc.name,
        userDoc.email,
        userDoc.passwordHash,
        userDoc.role,
        userDoc.department || "Operations",
        userDoc.status,
        formatIsoDate(userDoc.createdAt),
        formatIsoDate(userDoc.updatedAt),
      ],
    );
  };

  /**
   * Fetch all Admin and Super Admin users
   */
  Find_All_Admins = async (): Promise<IUserDoc[]> => {
    const result = await pg.query<IUserDoc>(
      `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        COALESCE(department, 'Operations') AS department,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM ${COLLECTIONS.USERS}
      ORDER BY created_at DESC;
      `,
    );

    return result.rows.map((row) => ({
      ...row,
      createdAt: formatIsoDate(row.createdAt),
      updatedAt: formatIsoDate(row.updatedAt),
    }));
  };

  /**
   * Delete an admin by ID
   */
  Delete_Admin_By_Id = async (id: string): Promise<boolean> => {
    const result = await pg.query(
      `DELETE FROM ${COLLECTIONS.USERS} WHERE id = $1 AND role <> 'SUPER_ADMIN';`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  };

  /**
   * Update admin status
   */
  Update_Admin_Status = async (id: string, status: "ACTIVE" | "DISABLED"): Promise<IUserDoc | null> => {
    const now = new Date().toISOString();
    const result = await pg.query<IUserDoc>(
      `
      UPDATE ${COLLECTIONS.USERS}
      SET status = $1, updated_at = $2
      WHERE id = $3
      RETURNING
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        COALESCE(department, 'Operations') AS department,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
      `,
      [status, now, id],
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
      department: user.department || "Operations",
      status: user.status,
      createdAt: formatIsoDate(user.createdAt),
      updatedAt: formatIsoDate(user.updatedAt),
    };
  };
}

export const authUtils = new AuthUtils();
export default authUtils;
