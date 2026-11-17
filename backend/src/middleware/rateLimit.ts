import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

export type RateLimitOptions = { enabled: boolean; scale?: number };

function limiter(windowMs: number, limit: number, opts: RateLimitOptions): RequestHandler {
  if (!opts.enabled) return (_req, _res, next) => next();
  return rateLimit({
    windowMs,
    limit: Math.max(1, Math.round(limit * (opts.scale ?? 1))),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json({
        error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" },
      });
    },
  });
}

const MIN = 60_000;

export function makeLimiters(opts: RateLimitOptions) {
  return {
    global: limiter(15 * MIN, 300, opts),
    auth: limiter(15 * MIN, 20, opts),
    forms: limiter(60 * MIN, 10, opts),
  };
}
