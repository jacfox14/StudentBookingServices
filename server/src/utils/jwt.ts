import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../models/User.js";

export interface AppJwtPayload {
  sub: number;
  role: Role;
  email: string;
}

export const signToken = (payload: AppJwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_TTL,
  } as SignOptions);

export const verifyToken = (token: string): AppJwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as AppJwtPayload;
  return decoded;
};
