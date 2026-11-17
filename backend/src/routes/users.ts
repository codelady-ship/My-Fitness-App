import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { escapeRegex, pageMeta, paginationQuery } from "../lib/pagination";
import { objectId, parse } from "../lib/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { MetricDay } from "../models/MetricDay";
import { ROLES, User } from "../models/User";
import { revokeAllForUser } from "../services/tokens";

const listQuery = z.object({
  ...paginationQuery,
  role: z.enum(ROLES).optional(),
  q: z.string().trim().max(100).optional(),
});
const idParams = z.object({ id: objectId });
const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    role: z.enum(ROLES),
    coachId: objectId.nullable(),
    programId: objectId.nullable(),
  })
  .partial()
  .strict();

export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole("admin"));

usersRouter.get("/", async (req, res) => {
  const q = parse(listQuery, req.query);
  const filter: Record<string, unknown> = {};
  if (q.role) filter.role = q.role;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: 1 }).skip((q.page - 1) * q.limit).limit(q.limit),
    User.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(q.page, q.limit, total) });
});

usersRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User");
  res.json({ data: user });
});

usersRouter.patch("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(patchSchema, req.body);
  const user = await User.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User");
  // A role change must not keep old tokens alive with the old role for long.
  if (body.role) await revokeAllForUser(user._id);
  res.json({ data: user });
});

usersRouter.delete("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  if (id === req.user!.id) throw ApiError.conflict("You cannot delete your own account here");
  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound("User");
  await Promise.all([MetricDay.deleteMany({ userId: user._id }), revokeAllForUser(user._id)]);
  res.status(204).end();
});
