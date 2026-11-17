import { z, ZodTypeAny } from "zod";
import { ApiError } from "./errors";

/** Parse `data` with `schema` or throw a 400 VALIDATION_ERROR with field details. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  throw new ApiError(
    400,
    "VALIDATION_ERROR",
    "Request validation failed",
    result.error.issues.map((i) => ({ path: i.path.join(".") || "(root)", message: i.message })),
  );
}

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Invalid calendar date");

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const boolQuery = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

export const email = z.string().trim().toLowerCase().email().max(254);
