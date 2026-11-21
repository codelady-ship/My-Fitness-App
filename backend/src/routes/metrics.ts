import { Router, type Request } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { addDays, diffDays, today } from "../lib/dates";
import { ApiError } from "../lib/errors";
import { pageMeta } from "../lib/pagination";
import { boolQuery, dateString, objectId, parse } from "../lib/validate";
import { isStaffRole, requireAuthDemoReadable } from "../middleware/auth";
import { Coach } from "../models/Coach";
import { MetricDay, normalizeSeries } from "../models/MetricDay";
import { User } from "../models/User";
import { aggregate, downsample, summarize, type DayRow } from "../services/metrics";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm");

const metricFields = z
  .object({
    restingBpm: z.number().int().min(25).max(220).nullable(),
    steps: z.number().int().min(0).max(200_000).nullable(),
    recoveryScore: z.number().min(0).max(3).nullable(),
    hrvMs: z.number().min(0).max(300).nullable(),
    sleepMinutes: z.number().int().min(0).max(1440).nullable(),
    activeMinutes: z.number().int().min(0).max(1440).nullable(),
    heartRate: z
      .array(z.object({ t: time, bpm: z.number().int().min(25).max(240) }).strict())
      .max(1440),
    source: z.enum(["manual", "device", "seed"]),
  })
  .partial()
  .strict();

const batchSchema = z.object({
  days: z
    .array(metricFields.extend({ date: dateString }))
    .min(1)
    .max(366)
    .refine((days) => new Set(days.map((d) => d.date)).size === days.length, "Each date may appear only once"),
});

const dateParams = z.object({ date: dateString });
const userQuery = { userId: objectId.optional() };

const listQuery = z.object({
  ...userQuery,
  from: dateString.optional(),
  to: dateString.optional(),
  includeSeries: boolQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(366).default(30),
});
const summaryQuery = z.object({
  ...userQuery,
  days: z.coerce.number().int().min(1).max(90).default(7),
  to: dateString.optional(),
});
const aggregateQuery = z.object({
  ...userQuery,
  from: dateString.optional(),
  to: dateString.optional(),
  interval: z.enum(["day", "week", "month"]).default("day"),
});
const seriesQuery = z.object({
  ...userQuery,
  date: dateString,
  bucket: z.coerce.number().int().min(1).max(240).default(15),
});

const NO_SERIES = { heartRate: 0 } as const;

/**
 * Whose data a read targets: own by default. With ?userId, admins may read
 * anyone; coaches only users whose coachId is their own coach profile.
 */
async function targetUser(req: Request, userId?: string): Promise<Types.ObjectId> {
  if (!userId || userId === req.user!.id) return new Types.ObjectId(req.user!.id);
  // The public demo admin reads its own sample metrics only, never another account's.
  if (req.user!.demo) throw ApiError.forbidden("The demo admin cannot see visitors' personal data.");
  const role = req.user!.role;
  if (!isStaffRole(role)) throw ApiError.forbidden("Only coaches and admins can read other users' metrics");
  if (role === "admin") {
    if (!(await User.exists({ _id: userId }))) throw ApiError.notFound("User");
    return new Types.ObjectId(userId);
  }
  const profile = await Coach.findOne({ userId: req.user!.id }, { _id: 1 }).lean();
  // Same 403 whether the user is missing or just not this coach's client (no user enumeration).
  if (!profile || !(await User.exists({ _id: userId, coachId: profile._id }))) {
    throw ApiError.forbidden("Coaches can only read metrics of their own clients");
  }
  return new Types.ObjectId(userId);
}

function range(from: string | undefined, to: string | undefined, defaultDays: number) {
  const end = to ?? today();
  const start = from ?? addDays(end, -(defaultDays - 1));
  if (start > end) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", [{ path: "from", message: "from must be on or before to" }]);
  }
  if (diffDays(start, end) > 365) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", [{ path: "from", message: "Range may cover at most 366 days" }]);
  }
  return { from: start, to: end };
}

/** Build the $set for an upsert: only the fields that were sent. */
function toUpdate(fields: z.infer<typeof metricFields>) {
  const { heartRate, ...rest } = fields;
  const set: Record<string, unknown> = { ...rest };
  if (heartRate) Object.assign(set, normalizeSeries(heartRate));
  return set;
}

export const metricsRouter = Router();
metricsRouter.use(requireAuthDemoReadable);

metricsRouter.put("/days/:date", async (req, res) => {
  const { date } = parse(dateParams, req.params);
  const body = parse(metricFields, req.body);
  const day = await MetricDay.findOneAndUpdate(
    { userId: req.user!.id, date },
    { $set: toUpdate(body), $setOnInsert: { userId: req.user!.id, date } },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ data: day });
});

metricsRouter.post("/batch", async (req, res) => {
  const { days } = parse(batchSchema, req.body);
  const userId = new Types.ObjectId(req.user!.id);
  const result = await MetricDay.bulkWrite(
    days.map(({ date, ...fields }) => ({
      updateOne: {
        filter: { userId, date },
        update: { $set: toUpdate(fields), $setOnInsert: { userId, date } },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  // Every day is either inserted or matched an existing one.
  res.json({ data: { upserted: result.upsertedCount + result.matchedCount } });
});

metricsRouter.get("/days", async (req, res) => {
  const q = parse(listQuery, req.query);
  const userId = await targetUser(req, q.userId);
  const { from, to } = range(q.from, q.to, 30);
  const filter = { userId, date: { $gte: from, $lte: to } };
  const [data, total] = await Promise.all([
    MetricDay.find(filter, q.includeSeries ? {} : NO_SERIES)
      .sort({ date: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
    MetricDay.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(q.page, q.limit, total) });
});

metricsRouter.get("/days/:date", async (req, res) => {
  const { date } = parse(dateParams, req.params);
  const q = parse(z.object(userQuery), req.query);
  const userId = await targetUser(req, q.userId);
  const day = await MetricDay.findOne({ userId, date });
  if (!day) throw ApiError.notFound("Metrics for this day");
  res.json({ data: day });
});

metricsRouter.delete("/days/:date", async (req, res) => {
  const { date } = parse(dateParams, req.params);
  const result = await MetricDay.deleteOne({ userId: req.user!.id, date });
  if (!result.deletedCount) throw ApiError.notFound("Metrics for this day");
  res.status(204).end();
});

async function loadRows(userId: Types.ObjectId, from: string, to: string): Promise<DayRow[]> {
  return MetricDay.find({ userId, date: { $gte: from, $lte: to } }, NO_SERIES).lean<DayRow[]>();
}

metricsRouter.get("/summary", async (req, res) => {
  const q = parse(summaryQuery, req.query);
  const userId = await targetUser(req, q.userId);
  const to = q.to ?? today();
  const rows = await loadRows(userId, addDays(to, -(q.days - 1)), to);
  res.json({ data: summarize(rows, to, q.days) });
});

metricsRouter.get("/aggregate", async (req, res) => {
  const q = parse(aggregateQuery, req.query);
  const userId = await targetUser(req, q.userId);
  const { from, to } = range(q.from, q.to, 30);
  const rows = await loadRows(userId, from, to);
  res.json({ data: { interval: q.interval, from, to, buckets: aggregate(rows, q.interval) } });
});

metricsRouter.get("/series", async (req, res) => {
  const q = parse(seriesQuery, req.query);
  const userId = await targetUser(req, q.userId);
  const day = await MetricDay.findOne({ userId, date: q.date }, { heartRate: 1 }).lean();
  const { points, stats } = downsample(day?.heartRate ?? [], q.bucket);
  res.json({
    data: {
      date: q.date,
      bucketMinutes: q.bucket,
      points,
      stats: stats.count ? stats : { min: null, max: null, avg: null, count: 0 },
    },
  });
});
