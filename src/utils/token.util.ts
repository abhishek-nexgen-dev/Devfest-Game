import jwt from "jsonwebtoken";
import { env_Constant } from "../constants/env.constant";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "PARTICIPANT";
  participantId?: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env_Constant.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env_Constant.JWT_SECRET) as TokenPayload;
};
