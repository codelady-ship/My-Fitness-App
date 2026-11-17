import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { escapeRegex, pageMeta, paginationQuery, sortSpec } from "../lib/pagination";
import { objectId, parse } from "../lib/validate";
import { isStaffRole, optionalAuth, requireAuth, requireRole } from "../middleware/auth";
import { Coach, initialsOf } from "../models/Coach";
import { Program } from "../models/Program";
import { User } from "../models/User";

const listQuery = z.object({
  ...paginationQuery,
  q: z.string().trim().max(100).optional(),
  specialty: z.string().trim().max(60).optional(),
  sort: z.string().optional(),
});

const fields = {
  name: z.string().trim().min(2).max(80),
  title: z.string().trim().max(80),
  bio: z.string().trim().max(2000),
  specialties: z.array(z.string().trim().min(1).max(40)).max(12),
  yearsExperience: z.number().int().min(0).max(60),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().min(0),
  avatarUrl: z.string().trim().max(500),
  userId: objectId.nullable(),
  isActive: z.boolean(),
};
const createSchema = z.object(fields).partial().required({ name: true }).strict();
const patchSchema = z.object(fields).partial().strict();
const idParams = z.object({ id: objectId });

export const coachesRouter = Router();

coachesRouter.get("/", optionalAuth, async (req, res) => {
  const q = parse(listQuery, req.query);
  const filter: Record<string, unknown> = {};
  if (req.user?.role !== "admin") filter.isActive = true;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ name: rx }, { title: rx }, { bio: rx }];
  }
  if (q.specialty) filter.specialties = new RegExp(`^${escapeRegex(q.specialty)}$`, "i");
  const sort = sortSpec(q.sort, ["name", "rating", "yearsExperience", "createdAt"], "-rating");
  const [data, total] = await Promise.all([
    Coach.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Coach.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(q.page, q.limit, total) });
});

coachesRouter.get("/:id", optionalAuth, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const coach = await Coach.findById(id);
  if (!coach || (!coach.isActive && req.user?.role !== "admin")) throw ApiError.notFound("Coach");
  const programFilter: Record<string, unknown> = { coachId: coach._id };
  if (!isStaffRole(req.user?.role)) programFilter.isPublished = true;
  const programs = await Program.find(programFilter).sort({ enrolledCount: -1 });
  res.json({ data: { ...coach.toJSON(), programs } });
});

coachesRouter.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const body = parse(createSchema, req.body);
  const coach = await Coach.create(body);
  res.status(201).json({ data: coach });
});

coachesRouter.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(patchSchema, req.body);
  const update: Record<string, unknown> = { ...body };
  if (body.name) update.initials = initialsOf(body.name);
  const coach = await Coach.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!coach) throw ApiError.notFound("Coach");
  res.json({ data: coach });
});

coachesRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const coach = await Coach.findByIdAndDelete(id);
  if (!coach) throw ApiError.notFound("Coach");
  await Promise.all([
    Program.updateMany({ coachId: coach._id }, { coachId: null }),
    User.updateMany({ coachId: coach._id }, { coachId: null }),
  ]);
  res.status(204).end();
});
