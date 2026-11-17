import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { pageMeta, paginationQuery } from "../lib/pagination";
import { email, objectId, parse } from "../lib/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { ContactMessage } from "../models/ContactMessage";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";

const STATUSES = ["new", "read", "archived"] as const;

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email,
    subject: z.string().trim().max(120).optional(),
    message: z.string().trim().min(10).max(2000),
  })
  .strict();
const contactListQuery = z.object({ ...paginationQuery, status: z.enum(STATUSES).optional() });
const idParams = z.object({ id: objectId });

export function contactRouter(formLimiter: RequestHandler) {
  const router = Router();

  router.post("/", formLimiter, async (req, res) => {
    const body = parse(contactSchema, req.body);
    const msg = await ContactMessage.create(body);
    res.status(201).json({ data: { id: String(msg._id), status: msg.status, createdAt: msg.createdAt } });
  });

  router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
    const q = parse(contactListQuery, req.query);
    const filter = q.status ? { status: q.status } : {};
    const [data, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1, _id: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
      ContactMessage.countDocuments(filter),
    ]);
    res.json({ data, meta: pageMeta(q.page, q.limit, total) });
  });

  router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    const { id } = parse(idParams, req.params);
    const { status } = parse(z.object({ status: z.enum(STATUSES) }).strict(), req.body);
    const msg = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!msg) throw ApiError.notFound("Message");
    res.json({ data: msg });
  });

  router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    const { id } = parse(idParams, req.params);
    const msg = await ContactMessage.findByIdAndDelete(id);
    if (!msg) throw ApiError.notFound("Message");
    res.status(204).end();
  });

  return router;
}

const subscribeSchema = z.object({ email }).strict();
const subscriberListQuery = z.object({
  ...paginationQuery,
  status: z.enum(["subscribed", "unsubscribed"]).optional(),
});

export function newsletterRouter(formLimiter: RequestHandler) {
  const router = Router();

  router.post("/", formLimiter, async (req, res) => {
    const { email: addr } = parse(subscribeSchema, req.body);
    const existing = await NewsletterSubscriber.findOne({ email: addr });
    if (existing) {
      if (existing.status !== "subscribed") {
        existing.status = "subscribed";
        await existing.save();
      }
      res.status(200).json({ data: { email: addr, status: "subscribed" } });
      return;
    }
    await NewsletterSubscriber.create({ email: addr });
    res.status(201).json({ data: { email: addr, status: "subscribed" } });
  });

  router.post("/unsubscribe", formLimiter, async (req, res) => {
    const { email: addr } = parse(subscribeSchema, req.body);
    await NewsletterSubscriber.updateOne({ email: addr }, { status: "unsubscribed" });
    res.json({ data: { email: addr, status: "unsubscribed" } });
  });

  router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
    const q = parse(subscriberListQuery, req.query);
    const filter = q.status ? { status: q.status } : {};
    const [data, total] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ createdAt: -1, _id: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
      NewsletterSubscriber.countDocuments(filter),
    ]);
    res.json({ data, meta: pageMeta(q.page, q.limit, total) });
  });

  return router;
}
