import { z } from "zod";
import { ApiError } from "./errors";

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export function pageMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Turn `-rating` into `{ rating: -1 }`, allowing only whitelisted fields. */
export function sortSpec(sort: string | undefined, allowed: string[], fallback: string): Record<string, 1 | -1> {
  const s = sort || fallback;
  const desc = s.startsWith("-");
  const field = desc ? s.slice(1) : s;
  if (!allowed.includes(field)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", [
      { path: "sort", message: `Sort by one of: ${allowed.join(", ")} (prefix - for descending)` },
    ]);
  }
  return { [field]: desc ? -1 : 1, _id: 1 };
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
