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

const demoReadOnly = () =>
  new ApiError(403, "DEMO_READ_ONLY", "This is a read-only demo admin: changes are not saved.");

/**
 * The public demo admin (isDemo user, `demo: true` in its token) is denied by default.
 *
 * There is no list of forbidden URLs to keep in sync with the routes (and to get wrong on case,
 * trailing slashes or encoding): the rule lives on the route itself, so the only matching is Express's own.
 * - `requireAuth` refuses the demo token outright. Every authenticated route starts here.
 * - `requireAuthDemoReadable` is the allow-list: only routes mounted behind it can be read by the demo
 *   token, and even there only with GET/HEAD. A write is 403 DEMO_READ_ONLY everywhere.
 * - `optionalAuth` routes are public pages: the demo token gets the anonymous answer, nothing more.
 */
function authenticate(req: Request, demoMayRead: boolean) {
  const user = readToken(req);
  if (!user) throw ApiError.unauthorized();
  if (user.demo) {
    if (!READ_METHODS.includes(req.method)) throw demoReadOnly();
    if (!demoMayRead) throw ApiError.forbidden("The demo admin cannot open this.");
  }
  req.user = user;
}

/** Requires a valid access token. The read-only demo admin is refused (see `requireAuthDemoReadable`). */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  authenticate(req, false);
  next();
}

/**
 * Requires a valid access token; the demo admin may read (GET/HEAD) here and can never write.
 * Use only on routes whose answers hold no visitors' personal data.
 */
export function requireAuthDemoReadable(req: Request, _res: Response, next: NextFunction) {
  authenticate(req, true);
  next();
}

/** Attaches req.user when a valid token is present; anonymous otherwise. The demo admin stays anonymous. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (user?.demo) {
    if (!READ_METHODS.includes(req.method)) throw demoReadOnly();
  } else if (user) {
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
