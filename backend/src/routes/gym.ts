import crypto from "node:crypto";
import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { addDays, today } from "../lib/dates";
import { ApiError } from "../lib/errors";
import { escapeRegex, pageMeta, paginationQuery, sortSpec } from "../lib/pagination";
import { boolQuery, dateString, objectId, parse } from "../lib/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { ContactMessage } from "../models/ContactMessage";
import { Member, MEMBER_STATUSES, MEMBERSHIP_TYPES } from "../models/Member";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { JOB_TYPES, Staff } from "../models/Staff";
import { User } from "../models/User";

/* ------------------------------------------------------------------ members */

const memberFields = {
  memberCode: z.string().trim().regex(/^C\d{6}$/, "Expected C + 6 digits, e.g. C123456"),
  fullName: z.string().trim().min(2).max(80),
  email: z.union([z.string().trim().toLowerCase().email().max(254), z.literal("")]),
  phone: z.string().trim().max(30),
  gender: z.enum(["male", "female"]),
  birthDate: dateString.nullable(),
  image: z.string().trim().max(500),
  membershipType: z.enum(MEMBERSHIP_TYPES),
  status: z.enum(MEMBER_STATUSES),
  remainingAccesses: z.number().int().min(0).max(1000),
  startDate: dateString,
  endDate: dateString,
  height: z.number().min(50).max(260).nullable(),
  weight: z.number().min(20).max(400).nullable(),
  goals: z.string().trim().max(300),
  coach: z.string().trim().max(80),
  notes: z.string().trim().max(2000),
  isBlacklisted: z.boolean(),
  userId: objectId.nullable(),
};
const memberCreate = z
  .object(memberFields)
  .partial()
  .required({ fullName: true, gender: true, membershipType: true, startDate: true, endDate: true })
  .strict()
  .refine((m) => m.startDate <= m.endDate, { message: "endDate must be on or after startDate", path: ["endDate"] });
const memberPatch = z.object(memberFields).partial().strict();
const memberList = z.object({
  ...paginationQuery,
  q: z.string().trim().max(100).optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
  membershipType: z.enum(MEMBERSHIP_TYPES).optional(),
  coach: z.string().trim().max(80).optional(),
  blacklisted: boolQuery.optional(),
  sort: z.string().optional(),
});

function memberKey(key: string) {
  return isValidObjectId(key) ? { _id: key } : { memberCode: key.toUpperCase() };
}

async function newMemberCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = `C${crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")}`;
    if (!(await Member.exists({ memberCode: code }))) return code;
  }
  throw new Error("Could not allocate a member code");
}

export const membersRouter = Router();
membersRouter.use(requireAuth, requireRole("coach", "admin"));

membersRouter.get("/", async (req, res) => {
  const q = parse(memberList, req.query);
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.membershipType) filter.membershipType = q.membershipType;
  if (q.coach) filter.coach = new RegExp(`^${escapeRegex(q.coach)}$`, "i");
  if (q.blacklisted !== undefined) filter.isBlacklisted = q.blacklisted;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }, { memberCode: rx }];
  }
  const sort = sortSpec(
    q.sort,
    ["fullName", "createdAt", "endDate", "lastVisit", "remainingAccesses", "memberCode"],
    "-createdAt",
  );
  const [data, total] = await Promise.all([
    Member.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Member.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(q.page, q.limit, total) });
});

membersRouter.get("/:id", async (req, res) => {
  const member = await Member.findOne(memberKey(String(req.params.id)));
  if (!member) throw ApiError.notFound("Member");
  res.json({ data: member });
});

membersRouter.post("/", requireRole("admin"), async (req, res) => {
  const body = parse(memberCreate, req.body);
  const member = await Member.create({ ...body, memberCode: body.memberCode ?? (await newMemberCode()) });
  res.status(201).json({ data: member });
});

membersRouter.patch("/:id", requireRole("admin"), async (req, res) => {
  const body = parse(memberPatch, req.body);
  const member = await Member.findOne(memberKey(String(req.params.id)));
  if (!member) throw ApiError.notFound("Member");
  member.set(body);
  if (member.startDate > member.endDate) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", [
      { path: "endDate", message: "endDate must be on or after startDate" },
    ]);
  }
  await member.save();
  res.json({ data: member });
});

membersRouter.delete("/:id", requireRole("admin"), async (req, res) => {
  const member = await Member.findOneAndDelete(memberKey(String(req.params.id)));
  if (!member) throw ApiError.notFound("Member");
  res.status(204).end();
});

membersRouter.post("/:id/check-in", async (req, res) => {
  const key = memberKey(String(req.params.id));
  const now = new Date();
  const member = await Member.findOneAndUpdate(
    { ...key, status: "active", isBlacklisted: false, remainingAccesses: { $gt: 0 } },
    { $inc: { remainingAccesses: -1 }, $push: { checkInHistory: now }, $set: { lastVisit: now } },
    { new: true },
  );
  if (member) {
    res.json({ data: member });
    return;
  }
  const existing = await Member.findOne(key);
  if (!existing) throw ApiError.notFound("Member");
  if (existing.isBlacklisted) throw ApiError.conflict("Member is blacklisted");
  if (existing.status !== "active") throw ApiError.conflict(`Membership is ${existing.status}`);
  throw ApiError.conflict("No accesses left on this membership");
});

/* -------------------------------------------------------------------- staff */

const staffFields = {
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30),
  birthDate: dateString.nullable(),
  gender: z.enum(["male", "female"]),
  image: z.string().trim().max(500),
  jobType: z.enum(JOB_TYPES),
};
const staffCreate = z
  .object(staffFields)
  .partial({ phone: true, birthDate: true, image: true })
  .strict();
const staffPatch = z.object(staffFields).partial().strict();
const staffList = z.object({
  ...paginationQuery,
  q: z.string().trim().max(100).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  sort: z.string().optional(),
});
const idParams = z.object({ id: objectId });

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("coach", "admin"));

staffRouter.get("/", async (req, res) => {
  const q = parse(staffList, req.query);
  const filter: Record<string, unknown> = {};
  if (q.jobType) filter.jobType = q.jobType;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
  }
  const sort = sortSpec(q.sort, ["firstName", "lastName", "jobType", "createdAt"], "firstName");
  const [data, total] = await Promise.all([
    Staff.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Staff.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(q.page, q.limit, total) });
});

staffRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  const staff = await Staff.findById(id);
  if (!staff) throw ApiError.notFound("Staff member");
  res.json({ data: staff });
});

staffRouter.post("/", requireRole("admin"), async (req, res) => {
  const body = parse(staffCreate, req.body);
  const staff = await Staff.create(body);
  res.status(201).json({ data: staff });
});

staffRouter.patch("/:id", requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(staffPatch, req.body);
  const staff = await Staff.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!staff) throw ApiError.notFound("Staff member");
  res.json({ data: staff });
});

staffRouter.delete("/:id", requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const staff = await Staff.findByIdAndDelete(id);
  if (!staff) throw ApiError.notFound("Staff member");
  res.status(204).end();
});

/* -------------------------------------------------------- dashboard / admin */

const countBy = async <T extends string>(
  model: typeof Member | typeof Staff | typeof User,
  field: string,
  keys: readonly T[],
) => {
  const rows: { _id: string; n: number }[] = await (model as typeof Member).aggregate([
    { $group: { _id: `$${field}`, n: { $sum: 1 } } },
  ]);
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
  for (const r of rows) if (r._id in out) out[r._id as T] = r.n;
  return out;
};

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("coach", "admin"));

adminRouter.get("/stats", async (_req, res) => {
  const now = new Date();
  const day = today();
  const [
    memberTotal,
    byStatus,
    blacklisted,
    newLast30Days,
    expiringNext7Days,
    membershipTypes,
    staffTotal,
    byJobType,
    byRole,
    remaining,
    contactNew,
    subscribed,
  ] = await Promise.all([
    Member.countDocuments(),
    countBy(Member, "status", MEMBER_STATUSES),
    Member.countDocuments({ isBlacklisted: true }),
    Member.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 30 * 86_400_000) } }),
    Member.countDocuments({ status: "active", endDate: { $gte: day, $lte: addDays(day, 7) } }),
    countBy(Member, "membershipType", MEMBERSHIP_TYPES),
    Staff.countDocuments(),
    countBy(Staff, "jobType", JOB_TYPES),
    countBy(User, "role", ["member", "coach", "admin"] as const),
    Member.find({}, { memberCode: 1, fullName: 1, remainingAccesses: 1, _id: 0 }).sort({ memberCode: 1 }).lean(),
    ContactMessage.countDocuments({ status: "new" }),
    NewsletterSubscriber.countDocuments({ status: "subscribed" }),
  ]);

  res.json({
    data: {
      members: { total: memberTotal, ...byStatus, blacklisted, newLast30Days, expiringNext7Days },
      membershipTypes,
      staff: { total: staffTotal, byJobType },
      users: { total: byRole.member + byRole.coach + byRole.admin, ...byRole },
      remainingAccesses: remaining,
      contact: { new: contactNew },
      newsletter: { subscribed },
    },
  });
});

adminRouter.get("/activity", async (req, res) => {
  const { days } = parse(z.object({ days: z.coerce.number().int().min(1).max(90).default(14) }), req.query);
  const end = today();
  const start = addDays(end, -(days - 1));
  const since = new Date(`${start}T00:00:00Z`);
  const dayExpr = (field: string) => ({ $dateToString: { format: "%Y-%m-%d", date: field, timezone: "UTC" } });

  const [checkIns, registrations] = await Promise.all([
    Member.aggregate<{ _id: string; n: number }>([
      { $match: { checkInHistory: { $gte: since } } },
      { $unwind: "$checkInHistory" },
      { $match: { checkInHistory: { $gte: since } } },
      { $group: { _id: dayExpr("$checkInHistory"), n: { $sum: 1 } } },
    ]),
    Member.aggregate<{ _id: string; n: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: dayExpr("$createdAt"), n: { $sum: 1 } } },
    ]),
  ]);
  const ci = new Map(checkIns.map((r) => [r._id, r.n]));
  const reg = new Map(registrations.map((r) => [r._id, r.n]));
  const data = Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    return { date, checkIns: ci.get(date) ?? 0, registrations: reg.get(date) ?? 0 };
  });
  res.json({ data });
});
