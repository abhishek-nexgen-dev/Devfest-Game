export type AuthRole = "SUPER_ADMIN" | "ADMIN";
export type AuthUserStatus = "ACTIVE" | "DISABLED";

export interface IUserDoc {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  department?: string;
  status: AuthUserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISanitizedUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  department?: string;
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

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  sort_by?: string;
  order?: "ASC" | "DESC";
  all?: boolean;
}

export interface PaginatedAdminsResponse {
  admins: ISanitizedUser[];
  pagination: PaginationMetadata;
}
