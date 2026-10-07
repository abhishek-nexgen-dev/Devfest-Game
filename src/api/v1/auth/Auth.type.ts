export type AuthRole = "SUPER_ADMIN" | "ADMIN";
export type AuthUserStatus = "ACTIVE" | "DISABLED";

export interface IUserDoc {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  status: AuthUserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISanitizedUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  status: AuthUserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthTokenPayload {
  userId: string;
  email: string;
  role: AuthRole;
}

export interface IAuthResponse {
  user: ISanitizedUser;
  token: string;
}
