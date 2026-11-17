import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../lib/errors";
import { ROLES, type Role } from "../models/User";

export type AuthUser = { id: string; role: Role };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function readToken(req: Request): AuthUser | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw ApiError.unauthorized("Malformed Authorization header");
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    if (!payload.sub || !ROLES.includes(payload.role)) throw new Error("bad payload");
    return { id: payload.sub, role: payload.role as Role };
  } catch {
    throw ApiError.unauthorized("Invalid or expired access token");
  }
}

/** Requires a valid access token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
}

/** Attaches req.user when a valid token is present; anonymous otherwise. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (user) req.user = user;
  next();
}

/** Requires one of the given roles (use after requireAuth). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

export const staffRoles: Role[] = ["coach", "admin"];

export function isStaffRole(role: Role | undefined) {
  return role === "coach" || role === "admin";
}
