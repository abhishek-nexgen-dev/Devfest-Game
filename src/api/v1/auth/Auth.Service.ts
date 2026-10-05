import { Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import {
  signUp_Type,
  signUpValidator,
  login_Type,
  loginValidator,
  changePassword_Type,
  changePasswordValidator,
} from "./Auth.validation";
import AuthUtils from "./AuthUtils";
import {
  IUserDoc,
  IParticipantDoc,
  IAuthResponse,
  ISanitizedUser,
  ISanitizedParticipant,
} from "./Auth.type";
import { AuthConstants } from "./auth.constants";
import { env_Constant } from "../../../constants/env.constant";
import { logger } from "../../../core/logger/logger";

class AuthService {
  /**
   * Register / Sign Up a new participant
   */
  async signUp(data: signUp_Type): Promise<IAuthResponse> {
    const validatedData = signUpValidator.parse(data);

    const { name, email, mobile, organization, city, profilePhoto, password } = validatedData;

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if participant or user with this email already exists
    const existingUser = await AuthUtils.Find_User_By_Email(normalizedEmail);
    if (!existingUser.empty) {
      throw new Error(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // 2. Hash password with bcrypt
    const passwordHash = await AuthUtils.Hash_Password(password);

    // 3. Generate sequential Participant ID
    const participantId = await AuthUtils.Generate_Participant_Id();

    const now = new Date().toISOString();
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const participantDbId = `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 4. Optionally create user in Firebase Admin Auth
    let firebaseUid = userId;
    try {
      const formattedPhone = mobile.startsWith("+") ? mobile : `+91${mobile.replace(/^0+/, "")}`;

      const firebaseUser = await getAuth().createUser({
        email: normalizedEmail,
        password,
        displayName: name,
        phoneNumber: formattedPhone,
        photoURL: profilePhoto || undefined,
      });
      firebaseUid = firebaseUser.uid;
      logger.info(`🔥 Firebase Auth account created for ${normalizedEmail} (UID: ${firebaseUid})`);
    } catch (fbErr: any) {
      logger.info(
        `Firebase Auth notice: ${fbErr?.message || "Running in direct Firestore mode"}. Storing credentials in Firestore.`,
      );
    }

    // 5. Create User document in Firestore
    const userDoc: IUserDoc = {
      id: userId,
      uid: firebaseUid,
      email: normalizedEmail,
      passwordHash,
      role: "PARTICIPANT",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    await AuthUtils.Save_User(userDoc);

    // 6. Create Participant document in Firestore
    const participantDoc: IParticipantDoc = {
      id: participantDbId,
      userId,
      participantId,
      uid: firebaseUid,
      name: name.trim(),
      email: normalizedEmail,
      mobile: mobile.trim(),
      organization: organization?.trim() || null,
      city: city?.trim() || null,
      profilePhoto: profilePhoto?.trim() || null,
      status: "ACTIVE",
      totalPoints: 0,
      completedGames: 0,
      createdAt: now,
      updatedAt: now,
    };
    await AuthUtils.Save_Participant(participantDoc);

    // 7. Generate JWT token
    const token = AuthUtils.Generate_Token({
      userId,
      email: normalizedEmail,
      role: "PARTICIPANT",
      participantId,
    });

    const sanitizedUser: ISanitizedUser = AuthUtils.Sanitize_User(userDoc);
    const sanitizedParticipant: ISanitizedParticipant =
      AuthUtils.Sanitize_Participant(participantDoc);

    // 8. Record audit activity
    await AuthUtils.Save_Activity_Log({
      id: `act-${Date.now()}`,
      action: "USER_REGISTERED",
      userId,
      email: normalizedEmail,
      participantId,
      createdAt: now,
    });

    logger.info(`✅ Participant successfully registered: ${normalizedEmail} [${participantId}]`);

    return {
      user: sanitizedUser,
      participant: sanitizedParticipant,
      token,
    };
  }

  /**
   * Participant & Super Admin Login
   */
  async login(data: login_Type): Promise<IAuthResponse> {
    const validatedData = loginValidator.parse(data);
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    // 1. Look up user by email
    let userSnap = await AuthUtils.Find_User_By_Email(normalizedEmail);

    let userDoc: IUserDoc | null = null;

    if (!userSnap.empty && userSnap.data) {
      userDoc = userSnap.data() as IUserDoc;
    } else {
      // Check if it's the seeded Super Admin logging in for first time
      const initialAdminEmail = env_Constant.INITIAL_ADMIN_EMAIL?.toLowerCase();
      if (normalizedEmail === initialAdminEmail) {
        await this.initSuperAdmin();
        userSnap = await AuthUtils.Find_User_By_Email(normalizedEmail);
        if (!userSnap.empty && userSnap.data) {
          userDoc = userSnap.data() as IUserDoc;
        }
      }
    }

    if (!userDoc) {
      throw new Error(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    }

    // 2. Check if account is disabled
    if (userDoc.status === "DISABLED" || userDoc.status === "SUSPENDED") {
      throw new Error(AuthConstants.MESSAGES.ACCOUNT_DISABLED);
    }

    // 3. Verify password hash
    const isPasswordValid = await AuthUtils.Compare_Password(
      validatedData.password,
      userDoc.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    }

    // 4. Fetch associated participant record
    let participantDoc: IParticipantDoc | null = null;
    if (userDoc.role === "PARTICIPANT") {
      participantDoc = await AuthUtils.Find_Participant_By_User_Id(userDoc.id);
    }

    // 5. Generate JWT Token
    const token = AuthUtils.Generate_Token({
      userId: userDoc.id,
      email: userDoc.email,
      role: userDoc.role,
      participantId: participantDoc?.participantId,
    });

    const sanitizedUser: ISanitizedUser = AuthUtils.Sanitize_User(userDoc);
    const sanitizedParticipant: ISanitizedParticipant | null = participantDoc
      ? AuthUtils.Sanitize_Participant(participantDoc)
      : null;

    // 6. Record login in activity logs
    await AuthUtils.Save_Activity_Log({
      id: `act-${Date.now()}`,
      action: "USER_LOGIN",
      userId: userDoc.id,
      email: userDoc.email,
      createdAt: new Date().toISOString(),
    });

    logger.info(`🔑 User logged in: ${userDoc.email} (${userDoc.role})`);

    return {
      user: sanitizedUser,
      participant: sanitizedParticipant,
      token,
    };
  }

  /**
   * Get Current Authenticated User Profile
   */
  async getCurrentUser(userId: string) {
    const userDoc = await AuthUtils.Find_User_By_Id(userId);
    if (!userDoc) {
      throw new Error(AuthConstants.MESSAGES.USER_NOT_FOUND);
    }

    const participantDoc = await AuthUtils.Find_Participant_By_User_Id(userId);

    const sanitizedUser = AuthUtils.Sanitize_User(userDoc);
    const sanitizedParticipant = participantDoc
      ? AuthUtils.Sanitize_Participant(participantDoc)
      : null;

    return {
      ...sanitizedUser,
      user: sanitizedUser,
      participant: sanitizedParticipant,
    };
  }

  /**
   * Change Password
   */
  async changePassword(userId: string, data: changePassword_Type): Promise<void> {
    const validatedData = changePasswordValidator.parse(data);
    const userDoc = await AuthUtils.Find_User_By_Id(userId);
    if (!userDoc) {
      throw new Error(AuthConstants.MESSAGES.USER_NOT_FOUND);
    }

    const currentPlainPassword = validatedData.oldPassword || validatedData.currentPassword || "";
    const isCurrentValid = await AuthUtils.Compare_Password(
      currentPlainPassword,
      userDoc.passwordHash,
    );
    if (!isCurrentValid) {
      throw new Error(AuthConstants.MESSAGES.INVALID_OLD_PASSWORD);
    }

    const newPasswordHash = await AuthUtils.Hash_Password(validatedData.newPassword);
    await AuthUtils.Update_User_Password(userId, newPasswordHash);

    logger.info(`🔒 Password successfully updated for user: ${userDoc.email}`);
  }

  /**
   * Verify Session Token
   */
  async verifySession(token: string) {
    const payload = AuthUtils.Verify_Token(token);
    const userDoc = await AuthUtils.Find_User_By_Id(payload.userId);
    if (!userDoc || userDoc.status !== "ACTIVE") {
      throw new Error(AuthConstants.MESSAGES.TOKEN_EXPIRED);
    }

    const participantDoc = await AuthUtils.Find_Participant_By_User_Id(userDoc.id);

    return {
      valid: true,
      user: AuthUtils.Sanitize_User(userDoc),
      participant: participantDoc ? AuthUtils.Sanitize_Participant(participantDoc) : null,
    };
  }

  /**
   * Seed Super Admin Account in Cloud Firestore if missing
   */
  async initSuperAdmin(): Promise<void> {
    const adminEmail = (env_Constant.INITIAL_ADMIN_EMAIL || "admin@gdgranchi.in")
      .trim()
      .toLowerCase();
    const adminPassword = env_Constant.INITIAL_ADMIN_PASSWORD || "AdminPass@2026";

    const snap = await AuthUtils.Find_User_By_Email(adminEmail);
    if (!snap) {
      return;
    }

    const passwordHash = await AuthUtils.Hash_Password(adminPassword);
    const now = new Date().toISOString();
    const adminId = "admin-super-001";

    const adminUser: IUserDoc = {
      id: adminId,
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    await AuthUtils.Save_User(adminUser);
    logger.info(`👑 Super Admin account initialized: ${adminEmail}`);
  }
}

export const authService = new AuthService();

