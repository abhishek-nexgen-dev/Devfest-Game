import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { env_Constant } from "../../../constants/env.constant";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../../../shared/errors/AppError";
import { AuthConstants } from "./auth.constants";
import { AuthUtils } from "./auth.utils";
import {
  IRegisterUserDto,
  ILoginUserDto,
  IChangePasswordDto,
  IAuthResponseData,
  ISanitizedUser,
  ISanitizedParticipant,
  AuthRole,
  AuthUserStatus,
} from "./auth.types";

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  role: AuthRole;
  status: AuthUserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredParticipant {
  id: string;
  userId: string;
  participantId: string;
  name: string;
  mobile: string;
  organization?: string | null;
  city?: string | null;
  profilePhoto?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GDG Ranchi DevFest 2026 - Authentication Business Logic Service
 * Enterprise Firestore document-driven authentication and session management.
 */
export class AuthService {
  // Public static mirrors for fast access and testing
  public static readonly memoryUsers = new Map<string, StoredUser>();
  public static readonly memoryParticipants = new Map<string, StoredParticipant>();

  /**
   * Look up a user record by email address.
   */
  public async FIND_USER_BY_EMAIL(email: string): Promise<StoredUser | null> {
    const normalizedEmail = AuthUtils.NORMALIZE_EMAIL(email);

    // 1. Check dataStore (Firestore + Memory sync)
    const foundDoc = await dataStore.users.findOne((u) => u.email === normalizedEmail);
    if (foundDoc) {
      return {
        id: foundDoc.id,
        email: foundDoc.email,
        password: foundDoc.password,
        role: foundDoc.role as AuthRole,
        status: foundDoc.status as AuthUserStatus,
        createdAt: new Date(foundDoc.createdAt),
        updatedAt: new Date(foundDoc.updatedAt),
      };
    }

    // 2. Direct memory store check
    for (const user of AuthService.memoryUsers.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }

    return null;
  }

  /**
   * Look up a user record by user UUID.
   */
  public async FIND_USER_BY_ID(userId: string): Promise<StoredUser | null> {
    const foundDoc = await dataStore.users.getById(userId);
    if (foundDoc) {
      return {
        id: foundDoc.id,
        email: foundDoc.email,
        password: foundDoc.password,
        role: foundDoc.role as AuthRole,
        status: foundDoc.status as AuthUserStatus,
        createdAt: new Date(foundDoc.createdAt),
        updatedAt: new Date(foundDoc.updatedAt),
      };
    }

    return AuthService.memoryUsers.get(userId) || null;
  }

  /**
   * Look up participant record associated with a user ID.
   */
  public async FIND_PARTICIPANT_BY_USER_ID(
    userId: string,
  ): Promise<StoredParticipant | null> {
    const p = await dataStore.participants.findOne((item) => item.userId === userId);
    if (p) {
      return {
        id: p.id,
        userId: p.userId,
        participantId: p.participantId,
        name: p.name,
        mobile: p.mobile,
        organization: p.organization,
        city: p.city,
        profilePhoto: p.profilePhoto,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      };
    }

    for (const mem of AuthService.memoryParticipants.values()) {
      if (mem.userId === userId) {
        return mem;
      }
    }

    return null;
  }

  /**
   * Look up participant record by public Participant ID code (e.g. GDGR-1042).
   */
  public async FIND_PARTICIPANT_BY_CODE(
    participantId: string,
  ): Promise<StoredParticipant | null> {
    const p = await dataStore.participants.findOne(
      (item) => item.participantId === participantId,
    );
    if (p) {
      return {
        id: p.id,
        userId: p.userId,
        participantId: p.participantId,
        name: p.name,
        mobile: p.mobile,
        organization: p.organization,
        city: p.city,
        profilePhoto: p.profilePhoto,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      };
    }

    for (const mem of AuthService.memoryParticipants.values()) {
      if (mem.participantId === participantId) {
        return mem;
      }
    }

    return null;
  }

  /**
   * Register a new participant with credentials, auto-generated Participant ID,
   * and Firestore document records.
   */
  public async REGISTER_USER(dto: IRegisterUserDto): Promise<IAuthResponseData> {
    const normalizedEmail = AuthUtils.NORMALIZE_EMAIL(dto.email);

    // 1. Conflict Check: Email uniqueness
    const existingUser = await this.FIND_USER_BY_EMAIL(normalizedEmail);
    if (existingUser) {
      throw new ConflictError(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // 2. Hash plain text password using bcrypt
    const hashedPassword = await AuthUtils.HASH_PASSWORD(dto.password);

    // 3. Generate sequential Participant ID
    const formattedParticipantId = await dataStore.generateNextParticipantId();

    const timestampIso = new Date().toISOString();
    const userId = "usr-" + Math.random().toString(36).substring(2, 10) + Date.now();
    const participantDbId =
      "part-" + Math.random().toString(36).substring(2, 10) + Date.now();

    const userDoc = {
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      role: AuthConstants.ROLES.PARTICIPANT,
      status: AuthConstants.USER_STATUS.ACTIVE,
      createdAt: timestampIso,
      updatedAt: timestampIso,
    };

    const participantDoc = {
      id: participantDbId,
      userId,
      participantId: formattedParticipantId,
      name: dto.name.trim(),
      mobile: dto.mobile.trim(),
      organization: dto.organization?.trim() || null,
      city: dto.city?.trim() || null,
      profilePhoto: null,
      status: "ACTIVE" as const,
      createdAt: timestampIso,
      updatedAt: timestampIso,
    };

    // Save to Firestore collections
    await dataStore.saveDocument("users", dataStore.users, userDoc);
    await dataStore.saveDocument("participants", dataStore.participants, participantDoc);

    const storedUser: StoredUser = {
      ...userDoc,
      createdAt: new Date(timestampIso),
      updatedAt: new Date(timestampIso),
    };
    const storedParticipant: StoredParticipant = {
      ...participantDoc,
      createdAt: new Date(timestampIso),
      updatedAt: new Date(timestampIso),
    };

    AuthService.memoryUsers.set(storedUser.id, storedUser);
    AuthService.memoryParticipants.set(storedParticipant.id, storedParticipant);

    // 4. Generate JWT access token
    const token = AuthUtils.GENERATE_ACCESS_TOKEN({
      userId: storedUser.id,
      email: storedUser.email,
      role: storedUser.role,
      participantId: storedParticipant.participantId,
    });

    const sanitizedUser: ISanitizedUser = AuthUtils.SANITIZE_USER(storedUser);
    const sanitizedParticipant: ISanitizedParticipant = {
      id: storedParticipant.id,
      userId: storedParticipant.userId,
      participantId: storedParticipant.participantId,
      name: storedParticipant.name,
      mobile: storedParticipant.mobile,
      organization: storedParticipant.organization,
      city: storedParticipant.city,
      profilePhoto: storedParticipant.profilePhoto,
      createdAt: storedParticipant.createdAt,
      updatedAt: storedParticipant.updatedAt,
    };

    logger.info(
      `User registered successfully in Firestore: ${sanitizedUser.email} [${sanitizedParticipant.participantId}]`,
    );

    return {
      user: sanitizedUser,
      participant: sanitizedParticipant,
      token,
    };
  }

  /**
   * Authenticate user credentials and issue signed JWT.
   */
  public async LOGIN_USER(dto: ILoginUserDto): Promise<IAuthResponseData> {
    const normalizedEmail = AuthUtils.NORMALIZE_EMAIL(dto.email);

    const user = await this.FIND_USER_BY_EMAIL(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.status !== AuthConstants.USER_STATUS.ACTIVE) {
      throw new ForbiddenError(AuthConstants.MESSAGES.ACCOUNT_DISABLED);
    }

    const isPasswordValid = await AuthUtils.COMPARE_PASSWORD(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    }

    let participant: ISanitizedParticipant | undefined = undefined;
    if (user.role === AuthConstants.ROLES.PARTICIPANT) {
      const partRecord = await this.FIND_PARTICIPANT_BY_USER_ID(user.id);
      if (partRecord) {
        participant = {
          id: partRecord.id,
          userId: partRecord.userId,
          participantId: partRecord.participantId,
          name: partRecord.name,
          mobile: partRecord.mobile,
          organization: partRecord.organization,
          city: partRecord.city,
          profilePhoto: partRecord.profilePhoto,
          createdAt: partRecord.createdAt,
          updatedAt: partRecord.updatedAt,
        };
      }
    }

    const token = AuthUtils.GENERATE_ACCESS_TOKEN({
      userId: user.id,
      email: user.email,
      role: user.role,
      participantId: participant?.participantId,
    });

    const sanitizedUser = AuthUtils.SANITIZE_USER(user);
    logger.info(`User logged in successfully: ${sanitizedUser.email} (${sanitizedUser.role})`);

    return {
      user: sanitizedUser,
      participant,
      token,
    };
  }

  /**
   * Retrieve current user profile and team details.
   */
  public async GET_CURRENT_USER_PROFILE(userId: string): Promise<{
    user: ISanitizedUser;
    participant?: ISanitizedParticipant | null;
    team?: {
      id: string;
      teamName: string;
      teamCode: string;
      isLeader: boolean;
    } | null;
  }> {
    const user = await this.FIND_USER_BY_ID(userId);
    if (!user) {
      throw new NotFoundError(AuthConstants.MESSAGES.USER_NOT_FOUND);
    }

    let participant: ISanitizedParticipant | null = null;
    let teamInfo: {
      id: string;
      teamName: string;
      teamCode: string;
      isLeader: boolean;
    } | null = null;

    if (user.role === AuthConstants.ROLES.PARTICIPANT) {
      const partRecord = await this.FIND_PARTICIPANT_BY_USER_ID(user.id);
      if (partRecord) {
        participant = {
          id: partRecord.id,
          userId: partRecord.userId,
          participantId: partRecord.participantId,
          name: partRecord.name,
          mobile: partRecord.mobile,
          organization: partRecord.organization,
          city: partRecord.city,
          profilePhoto: partRecord.profilePhoto,
          createdAt: partRecord.createdAt,
          updatedAt: partRecord.updatedAt,
        };

        const member = await dataStore.teamMembers.findOne(
          (m) => m.participantId === partRecord.id,
        );
        if (member) {
          const team = await dataStore.teams.getById(member.teamId);
          if (team) {
            teamInfo = {
              id: team.id,
              teamName: team.teamName,
              teamCode: team.teamCode,
              isLeader: team.leaderId === partRecord.id,
            };
          }
        }
      }
    }

    return {
      user: AuthUtils.SANITIZE_USER(user),
      participant,
      team: teamInfo,
    };
  }

  /**
   * Update password for authenticated user.
   */
  public async CHANGE_USER_PASSWORD(
    userId: string,
    dto: IChangePasswordDto,
  ): Promise<void> {
    const user = await this.FIND_USER_BY_ID(userId);
    if (!user) {
      throw new NotFoundError(AuthConstants.MESSAGES.USER_NOT_FOUND);
    }

    const isOldValid = await AuthUtils.COMPARE_PASSWORD(dto.oldPassword, user.password);
    if (!isOldValid) {
      throw new BadRequestError(AuthConstants.MESSAGES.INVALID_OLD_PASSWORD);
    }

    const hashedNewPassword = await AuthUtils.HASH_PASSWORD(dto.newPassword);
    const nowIso = new Date().toISOString();

    await dataStore.updateDocument("users", dataStore.users, userId, {
      password: hashedNewPassword,
      updatedAt: nowIso,
    });

    user.password = hashedNewPassword;
    user.updatedAt = new Date(nowIso);
    AuthService.memoryUsers.set(userId, user);

    logger.info(`Password successfully updated for user ${user.email}`);
  }

  /**
   * Verify an active JWT token.
   */
  public async VERIFY_SESSION(
    token: string,
  ): Promise<{ valid: boolean; user: ISanitizedUser }> {
    try {
      const decoded = AuthUtils.VERIFY_ACCESS_TOKEN(token);
      const user = await this.FIND_USER_BY_ID(decoded.userId);
      if (!user || user.status !== AuthConstants.USER_STATUS.ACTIVE) {
        throw new UnauthorizedError(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
      }

      return {
        valid: true,
        user: AuthUtils.SANITIZE_USER(user),
      };
    } catch {
      throw new UnauthorizedError(AuthConstants.MESSAGES.TOKEN_EXPIRED);
    }
  }

  /**
   * Bootstrap Super Admin user in Cloud Firestore if absent.
   */
  public async INITIALIZE_SUPER_ADMIN(): Promise<void> {
    const adminEmail = AuthUtils.NORMALIZE_EMAIL(env_Constant.INITIAL_ADMIN_EMAIL);
    const existingAdmin = await this.FIND_USER_BY_EMAIL(adminEmail);

    if (!existingAdmin) {
      const hashedPassword = await AuthUtils.HASH_PASSWORD(
        env_Constant.INITIAL_ADMIN_PASSWORD,
      );
      const nowIso = new Date().toISOString();
      const adminId = "admin-super-001";

      const adminDoc = {
        id: adminId,
        email: adminEmail,
        password: hashedPassword,
        role: AuthConstants.ROLES.SUPER_ADMIN,
        status: AuthConstants.USER_STATUS.ACTIVE,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await dataStore.saveDocument("users", dataStore.users, adminDoc);
      AuthService.memoryUsers.set(adminId, {
        ...adminDoc,
        createdAt: new Date(nowIso),
        updatedAt: new Date(nowIso),
      });

      logger.info(
        `👑 Initial Super Admin bootstrapped in Cloud Firestore: ${adminEmail}`,
      );
    }
  }
}
