import {
  addAdmin_Type,
  addAdminValidator,
  login_Type,
  loginValidator,
  changePassword_Type,
  changePasswordValidator,
} from "./Auth.validation";
import AuthUtils from "./AuthUtils";
import { IUserDoc, IAuthResponse, ISanitizedUser } from "./Auth.type";
import { AuthConstants } from "./auth.constants";
import { env_Constant } from "../../../constants/env.constant";
import { logger } from "../../../core/logger/logger";

class AuthService {
  /**
   * Super Admin & Admin Login
   * - Validates input credentials using Zod schema
   * - Finds user in PostgreSQL by normalized lowercase email
   * - Checks account status (blocks DISABLED accounts)
   * - Verifies password securely against bcrypt hash
   * - Issues cryptographically signed JWT token
   * - Returns sanitized user profile and token
   */
  async login(data: login_Type): Promise<IAuthResponse> {
    const validatedData = loginValidator.parse(data);
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    const userDoc = await AuthUtils.Find_User_By_Email(normalizedEmail);
    if (!userDoc) {
      throw new Error(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    }

    if (userDoc.status === "DISABLED") {
      throw new Error(AuthConstants.MESSAGES.ACCOUNT_DISABLED);
    }

    const isPasswordValid = await AuthUtils.Compare_Password(
      validatedData.password,
      userDoc.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    }

    const token = AuthUtils.Generate_Token({
      userId: userDoc.id,
      email: userDoc.email,
      role: userDoc.role,
    });

    const sanitizedUser: ISanitizedUser = AuthUtils.Sanitize_User(userDoc);

    logger.info(`🔑 Admin logged in successfully: ${userDoc.email} (${userDoc.role})`);

    return {
      user: sanitizedUser,
      token,
    };
  }

  /**
   * Super Admin adds an Admin (name, email, password)
   * Enforces email uniqueness and secure password hashing.
   */
  async addAdmin(data: addAdmin_Type): Promise<{ user: ISanitizedUser }> {
    const validatedData = addAdminValidator.parse(data);
    const { name, email, password } = validatedData;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await AuthUtils.Find_User_By_Email(normalizedEmail);
    if (existingUser) {
      throw new Error(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await AuthUtils.Hash_Password(password);
    const now = new Date().toISOString();
    const adminId = `adm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const adminDoc: IUserDoc = {
      id: adminId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    await AuthUtils.Save_User(adminDoc);
    logger.info(`🛡️ Admin account created by Super Admin: ${normalizedEmail}`);

    return {
      user: AuthUtils.Sanitize_User(adminDoc),
    };
  }

  /**
   * Get Current Authenticated Admin / Super Admin Profile
   */
  async getCurrentUser(userId: string) {
    const userDoc = await AuthUtils.Find_User_By_Id(userId);
    if (!userDoc) {
      throw new Error(AuthConstants.MESSAGES.USER_NOT_FOUND);
    }

    const sanitizedUser = AuthUtils.Sanitize_User(userDoc);

    return sanitizedUser;
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

    logger.info(`🔒 Password successfully updated for: ${userDoc.email}`);
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

    return {
      valid: true,
      user: AuthUtils.Sanitize_User(userDoc),
    };
  }

  /**
   * Initialize the 1 Super Admin Account in PostgreSQL.
   * Throws an error if a Super Admin already exists.
   */
  async initSuperAdmin(): Promise<{ user: ISanitizedUser }> {
    const adminEmail = (env_Constant.INITIAL_ADMIN_EMAIL || "admin@gdgranchi.in")
      .trim()
      .toLowerCase();
    const adminPassword = env_Constant.INITIAL_ADMIN_PASSWORD || "AdminPass@2026";
    const adminName = env_Constant.INITIAL_ADMIN_NAME || "GDG Ranchi Super Admin";

    const superAdminCount = await AuthUtils.Count_Users_By_Role("SUPER_ADMIN");
    if (superAdminCount >= 1) {
      throw new Error(AuthConstants.MESSAGES.ADMIN_ALREADY_EXISTS);
    }

    const existingAdmin = await AuthUtils.Find_User_By_Email(adminEmail);
    if (existingAdmin) {
      throw new Error(AuthConstants.MESSAGES.ADMIN_ALREADY_EXISTS);
    }

    const passwordHash = await AuthUtils.Hash_Password(adminPassword);
    const now = new Date().toISOString();
    const adminId = "admin-super-001";

    const adminUser: IUserDoc = {
      id: adminId,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    await AuthUtils.Save_User(adminUser);
    logger.info(`👑 Super Admin account initialized: ${adminEmail}`);

    return {
      user: AuthUtils.Sanitize_User(adminUser),
    };
  }

  // Compatibility aliases
  LOGIN_USER = (data: login_Type) => this.login(data);
  ADD_ADMIN = (data: addAdmin_Type) => this.addAdmin(data);
  FIND_USER_BY_EMAIL = async (email: string): Promise<ISanitizedUser | null> => {
    const user = await AuthUtils.Find_User_By_Email(email);
    if (!user) return null;
    return AuthUtils.Sanitize_User(user);
  };
}

export const authService = new AuthService();
export default authService;
