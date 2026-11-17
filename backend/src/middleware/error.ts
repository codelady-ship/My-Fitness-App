import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { config } from "../config";
import { ApiError } from "../lib/errors";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
}

type HttpLikeError = { type?: string; status?: number; statusCode?: number; code?: number; keyValue?: object };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let apiErr: ApiError;
  const e = err as HttpLikeError;

  if (err instanceof ApiError) {
    apiErr = err;
  } else if (err instanceof ZodError) {
    apiErr = new ApiError(
      400,
      "VALIDATION_ERROR",
      "Request validation failed",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  } else if (e?.type === "entity.parse.failed") {
    apiErr = ApiError.badRequest("Malformed JSON body");
  } else if (e?.type === "entity.too.large") {
    apiErr = ApiError.badRequest("Request body too large");
  } else if (err instanceof mongoose.Error.CastError) {
    apiErr = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (err instanceof mongoose.Error.ValidationError) {
    apiErr = new ApiError(
      400,
      "VALIDATION_ERROR",
      "Request validation failed",
      Object.values(err.errors).map((x) => ({ path: x.path, message: x.message })),
    );
  } else if (e?.code === 11000) {
    const fields = Object.keys(e.keyValue ?? {}).join(", ") || "value";
    apiErr = ApiError.conflict(`A record with this ${fields} already exists`);
  } else {
    if (!config.isTest) console.error(err);
    apiErr = new ApiError(500, "INTERNAL_ERROR", "Something went wrong");
  }

  const body: { error: { code: string; message: string; details?: unknown } } = {
    error: { code: apiErr.code, message: apiErr.message },
  };
  if (apiErr.details?.length) body.error.details = apiErr.details;
  res.status(apiErr.status).json(body);
}
