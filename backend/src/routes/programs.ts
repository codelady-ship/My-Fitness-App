import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { escapeRegex, pageMeta, paginationQuery, sortSpec } from "../lib/pagination";
import { slugify } from "../lib/slug";
import { objectId, parse } from "../lib/validate";
import { isStaffRole, optionalAuth, requireAuth, requireRole } from "../middleware/auth";
import { Coach } from "../models/Coach";
import { FOCUSES, LEVELS, Program } from "../models/Program";
import { User } from "../models/User";

const listQuery = z.object({
  ...paginationQuery,
  level: z.enum(LEVELS).optional(),
  focus: z.enum(FOCUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.string().optional(),
});

const baseFields = {
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes").max(80),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(300),
  description: z.string().trim().max(5000),
  level: z.enum(LEVELS),
  focus: z.enum(FOCUSES),
  durationWeeks: z.number().int().min(1).max(52),
  sessionsPerWeek: z.number().int().min(1).max(14),
  minutesPerSession: z.number().int().min(5).max(240),
  targetZone: z
    .object({ minPct: z.number().int().min(40).max(100), maxPct: z.number().int().min(40).max(100) })
    .refine((z) => z.minPct <= z.maxPct, "minPct must be ≤ maxPct"),
  coachId: objectId.nullable(),
  imageUrl: z.string().trim().max(500),
  isPublished: z.boolean(),
};

const createSchema = z
  .object(baseFields)
  .partial({ slug: true, summary: true, description: true, coachId: true, imageUrl: true, isPublished: true })
  .strict();
const patchSchema = z.object(baseFields).partial().strict();
const idParams = z.object({ id: objectId });

async function assertCoach(coachId: string | null | undefined) {
  if (coachId && !(await Coach.exists({ _id: coachId }))) throw ApiError.notFound("Coach");
}

export const programsRouter = Router();

programsRouter.get("/", optionalAuth, async (req, res) => {
  const q = parse(listQuery, req.query);
  const filter: Record<string, unknown> = {};
  if (!isStaffRole(req.user?.role)) filter.isPublished = true;
  if (q.level) filter.level = q.level;
  if (q.focus) filter.focus = q.focus;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ title: rx }, { summary: rx }];
  }
  const sort = sortSpec(q.sort, ["title", "durationWeeks", "enrolledCount", "createdAt"], "-enrolledCount");
  const [data, total] = await Promise.all([
    Program.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Program.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(q.page, q.limit, total) });
});

programsRouter.get("/:idOrSlug", optionalAuth, async (req, res) => {
  const key = String(req.params.idOrSlug);
  const program = await Program.findOne(isValidObjectId(key) ? { _id: key } : { slug: key.toLowerCase() });
  if (!program || (!program.isPublished && !isStaffRole(req.user?.role))) throw ApiError.notFound("Program");
  res.json({ data: program });
});

programsRouter.post("/", requireAuth, requireRole("coach", "admin"), async (req, res) => {
  const body = parse(createSchema, req.body);
  await assertCoach(body.coachId);
  const slug = body.slug ?? slugify(body.title);
  if (!slug) throw ApiError.badRequest("Could not build a slug from the title; send one");
  const program = await Program.create({ ...body, slug });
  res.status(201).json({ data: program });
});

programsRouter.patch("/:id", requireAuth, requireRole("coach", "admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(patchSchema, req.body);
  await assertCoach(body.coachId);
  const program = await Program.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!program) throw ApiError.notFound("Program");
  res.json({ data: program });
});

programsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const program = await Program.findByIdAndDelete(id);
  if (!program) throw ApiError.notFound("Program");
  await User.updateMany({ programId: program._id }, { programId: null });
  res.status(204).end();
});

programsRouter.post("/:id/enroll", requireAuth, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const program = await Program.findOne({ _id: id, isPublished: true });
  if (!program) throw ApiError.notFound("Program");
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized("Account no longer exists");
  if (String(user.programId) !== String(program._id)) {
    if (user.programId) await Program.updateOne({ _id: user.programId, enrolledCount: { $gt: 0 } }, { $inc: { enrolledCount: -1 } });
    user.programId = program._id;
    await user.save();
    await Program.updateOne({ _id: program._id }, { $inc: { enrolledCount: 1 } });
  }
  res.json({ data: user });
});

programsRouter.delete("/:id/enroll", requireAuth, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized("Account no longer exists");
  if (String(user.programId) === id) {
    user.programId = null;
    await user.save();
    await Program.updateOne({ _id: id, enrolledCount: { $gt: 0 } }, { $inc: { enrolledCount: -1 } });
  }
  res.json({ data: user });
});
