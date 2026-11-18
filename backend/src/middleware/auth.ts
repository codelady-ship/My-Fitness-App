import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../lib/errors";
import { ROLES, type Role } from "../models/User";

export type AuthUser = { id: string; role: Role; demo?: boolean };

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
    return { id: payload.sub, role: payload.role as Role, ...(payload.demo === true ? { demo: true } : {}) };
  } catch {
    throw ApiError.unauthorized("Invalid or expired access token");
  }
}

const READ_METHODS = ["GET", "HEAD", "OPTIONS"];
/** Lists with real visitors' personal data (accounts, contact form, newsletter): never shown to the public demo login. */
const DEMO_HIDDEN = ["/api/v1/users", "/api/v1/contact", "/api/v1/newsletter"];

/**
 * The public demo admin (isDemo user, `demo: true` in its token) may look but not touch:
 * every write is refused with 403 DEMO_READ_ONLY, and lists with visitors' personal data stay hidden.
 */
function demoGuard(req: Request, user: AuthUser) {
  if (!user.demo) return;
  if (!READ_METHODS.includes(req.method)) {
    throw new ApiError(403, "DEMO_READ_ONLY", "This is a read-only demo admin: changes are not saved.");
  }
  const path = (req.originalUrl.split("?")[0] ?? "").replace(/\/+$/, "");
  if (DEMO_HIDDEN.some((p) => path === p || path.startsWith(p + "/")) || "userId" in req.query) {
    throw ApiError.forbidden("The demo admin cannot see visitors' personal data.");
  }
}

/** Requires a valid access token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (!user) throw ApiError.unauthorized();
  demoGuard(req, user);
  req.user = user;
  next();
}

/** Attaches req.user when a valid token is present; anonymous otherwise. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (user) {
    demoGuard(req, user);
    req.user = user;
  }
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
