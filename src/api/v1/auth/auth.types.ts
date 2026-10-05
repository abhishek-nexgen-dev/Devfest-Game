/**
 * GDG Ranchi DevFest 2026 - Authentication Data Contracts & Types
 */

export type AuthRole = "SUPER_ADMIN" | "PARTICIPANT";
export type AuthUserStatus = "ACTIVE" | "DISABLED";

export interface IRegisterUserDto {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  mobile: string;
  organization?: string;
  city?: string;
  profilePhoto?: string;
}

export interface ILoginUserDto {
  email: string;
  password: string;
}

export interface IChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
}

export interface IAuthTokenPayload {
  userId: string;
  email: string;
  role: AuthRole;
  participantId?: string;
}

export interface ISanitizedUser {
  id: string;
  email: string;
  role: AuthRole;
  status: AuthUserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISanitizedParticipant {
  id: string;
  userId: string;
  participantId: string;
  name: string;
  mobile: string;
  organization?: string | null;
  city?: string | null;
  profilePhoto?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAuthResponseData {
  user: ISanitizedUser;
  participant?: ISanitizedParticipant | null;
  token: string;
}

export interface IUserProfileResponse extends ISanitizedUser {
  participant?: ISanitizedParticipant | null;
  team?: {
    id: string;
    teamName: string;
    teamCode: string;
    isLeader: boolean;
  } | null;
}

export interface ISessionVerificationResponse {
  valid: boolean;
  user: ISanitizedUser;
  participant?: ISanitizedParticipant | null;
}
