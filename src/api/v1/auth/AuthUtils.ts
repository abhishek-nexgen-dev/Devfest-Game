import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Timestamp } from "firebase-admin/firestore";
import {
  UsersCollection,
  ParticipantsCollection,
  SignUpCollection,
  ActivityLogsCollection,
} from "./Auth.schema";
import {
  IUserDoc,
  IParticipantDoc,
  ISanitizedUser,
  ISanitizedParticipant,
  IAuthTokenPayload,
} from "./Auth.type";
import { env_Constant } from "../../../constants/env.constant";
import { AuthConstants } from "./auth.constants";
import { logger } from "../../../core/logger/logger";
import { hasRemoteCredentials } from "../../../infrastructure/firebase/firebase.utils";

// Resilient memory cache backing Cloud Firestore for offline / local zero-credential resilience
export const memoryUsers = new Map<string, IUserDoc>();
export const memoryParticipants = new Map<string, IParticipantDoc>();
export const memorySignUps = new Map<string, any>();
export const memoryActivityLogs = new Map<string, any>();

export interface IUserLookupResult {
  empty: boolean;
  exists: boolean;
  id?: string;
  data: () => IUserDoc | null;
  user: IUserDoc | null;
}

export class AuthUtils {
  // Static Helper Methods for Direct Unit Test & Utility Access
  public static GENERATE_PARTICIPANT_ID(prefix = "GDGR"): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
  }

  public static SANITIZE_USER(user: any): ISanitizedUser {
    const { password, passwordHash, ...sanitized } = user;
    return {
      id: sanitized.id || "",
      uid: sanitized.uid,
      email: sanitized.email || "",
      role: sanitized.role || "PARTICIPANT",
      status: sanitized.status || "ACTIVE",
      createdAt:
        typeof sanitized.createdAt === "string"
          ? sanitized.createdAt
          : sanitized.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt:
        typeof sanitized.updatedAt === "string"
          ? sanitized.updatedAt
          : sanitized.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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
   * Find a user by email address in users collection or fallback cache
   */
  Find_User_By_Email = async (email: string): Promise<IUserLookupResult> => {
    const normalized = email.trim().toLowerCase();

    // 1. Try remote Firestore query if credentials available
    if (hasRemoteCredentials) {
      try {
        const snapshot = await UsersCollection.where("email", "==", normalized).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = { id: doc.id, ...(doc.data() as Omit<IUserDoc, "id">) };
          memoryUsers.set(data.id, data);
          return {
            empty: false,
            exists: true,
            id: data.id,
            data: () => data,
            user: data,
          };
        }
      } catch (err: any) {
        logger.warn(`Firestore read notice: ${err?.message || "Local mode"}. Checking memory cache.`);
      }
    }

    // 2. Check local memory cache
    for (const user of memoryUsers.values()) {
      if (user.email.toLowerCase() === normalized) {
        return {
          empty: false,
          exists: true,
          id: user.id,
          data: () => user,
          user: user,
        };
      }
    }

    return {
      empty: true,
      exists: false,
      data: () => null,
      user: null,
    };
  };

  /**
   * Find a user document by primary ID
   */
  Find_User_By_Id = async (id: string): Promise<IUserDoc | null> => {
    if (hasRemoteCredentials) {
      try {
        const doc = await UsersCollection.doc(id).get();
        if (doc.exists) {
          const data = { id: doc.id, ...(doc.data() as Omit<IUserDoc, "id">) };
          memoryUsers.set(id, data);
          return data;
        }
      } catch (err: any) {
        logger.warn(`Firestore read notice: ${err?.message || "Local mode"}. Checking memory cache.`);
      }
    }
    return memoryUsers.get(id) || null;
  };

  /**
   * Find a participant record by userId or participantId
   */
  Find_Participant_By_User_Id = async (userId: string): Promise<IParticipantDoc | null> => {
    if (hasRemoteCredentials) {
      try {
        const snapshot = await ParticipantsCollection.where("userId", "==", userId).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = { id: doc.id, ...(doc.data() as Omit<IParticipantDoc, "id">) };
          memoryParticipants.set(data.id, data);
          return data;
        }
        const doc = await ParticipantsCollection.doc(userId).get();
        if (doc.exists) {
          const data = { id: doc.id, ...(doc.data() as Omit<IParticipantDoc, "id">) };
          memoryParticipants.set(data.id, data);
          return data;
        }
      } catch (err: any) {
        logger.warn(`Firestore read notice: ${err?.message || "Local mode"}. Checking memory cache.`);
      }
    }

    for (const part of memoryParticipants.values()) {
      if (part.userId === userId || part.id === userId || part.participantId === userId) {
        return part;
      }
    }
    return null;
  };

  /**
   * Save User document to Firestore & memory cache
   */
  Save_User = async (userDoc: IUserDoc): Promise<void> => {
    memoryUsers.set(userDoc.id, userDoc);
    if (hasRemoteCredentials) {
      try {
        await UsersCollection.doc(userDoc.id).set(userDoc);
      } catch (err: any) {
        logger.warn(`Firestore write notice: ${err?.message || "Local cache preserved"}`);
      }
    }
  };

  /**
   * Save Participant document to Firestore & memory cache
   */
  Save_Participant = async (partDoc: IParticipantDoc): Promise<void> => {
    memoryParticipants.set(partDoc.id, partDoc);
    if (hasRemoteCredentials) {
      try {
        await ParticipantsCollection.doc(partDoc.id).set(partDoc);
        await SignUpCollection.doc(partDoc.participantId).set(partDoc);
      } catch (err: any) {
        logger.warn(`Firestore write notice: ${err?.message || "Local cache preserved"}`);
      }
    }
  };

  /**
   * Update User password in Firestore & memory cache
   */
  Update_User_Password = async (userId: string, newHash: string): Promise<void> => {
    const cached = memoryUsers.get(userId);
    if (cached) {
      cached.passwordHash = newHash;
      cached.updatedAt = new Date().toISOString();
      memoryUsers.set(userId, cached);
    }
    if (hasRemoteCredentials) {
      try {
        await UsersCollection.doc(userId).update({
          passwordHash: newHash,
          updatedAt: Timestamp.now(),
        });
      } catch (err: any) {
        logger.warn(`Firestore update notice: ${err?.message || "Local cache preserved"}`);
      }
    }
  };

  /**
   * Save activity audit log
   */
  Save_Activity_Log = async (logData: any): Promise<void> => {
    memoryActivityLogs.set(logData.id, logData);
    if (hasRemoteCredentials) {
      try {
        await ActivityLogsCollection.doc(logData.id).set(logData);
      } catch (err) {
        // Ignore in offline mode
      }
    }
  };

  /**
   * Generate sequential, unique DevFest 2026 Participant ID (e.g. GDG26-0001)
   */
  Generate_Participant_Id = async (): Promise<string> => {
    let maxNum = 0;

    if (hasRemoteCredentials) {
      try {
        const snapshot = await ParticipantsCollection.get();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const match = data.participantId?.match(/(?:GDG26|GDGR)-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      } catch (err: any) {
        logger.warn(`Firestore count notice: ${err?.message || "Using memory store"}`);
      }
    }

    for (const part of memoryParticipants.values()) {
      const match = part.participantId?.match(/(?:GDG26|GDGR)-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(4, "0");
    return `GDG26-${padded}`;
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
    const created =
      typeof user.createdAt === "string"
        ? user.createdAt
        : user.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
    const updated =
      typeof user.updatedAt === "string"
        ? user.updatedAt
        : user.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString();

    return {
      id: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: created,
      updatedAt: updated,
    };
  };

  /**
   * Sanitize participant record for client responses
   */
  Sanitize_Participant = (p: IParticipantDoc): ISanitizedParticipant => {
    const created =
      typeof p.createdAt === "string"
        ? p.createdAt
        : p.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
    const updated =
      typeof p.updatedAt === "string"
        ? p.updatedAt
        : p.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString();

    return {
      id: p.id,
      userId: p.userId,
      participantId: p.participantId,
      name: p.name,
      email: p.email,
      mobile: p.mobile,
      organization: p.organization || null,
      city: p.city || null,
      profilePhoto: p.profilePhoto || null,
      status: p.status,
      totalPoints: p.totalPoints ?? 0,
      completedGames: p.completedGames ?? 0,
      createdAt: created,
      updatedAt: updated,
    };
  };
}

export const authUtils = new AuthUtils();
export default authUtils;
