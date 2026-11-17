import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { slugify } from "../lib/slug";
import { objectId, parse } from "../lib/validate";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth";
import { PricingPlan } from "../models/PricingPlan";

const fields = {
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(40),
  name: z.string().trim().min(2).max(40),
  tagline: z.string().trim().max(160),
  priceMonthly: z.number().min(0).max(10000),
  priceYearly: z.number().min(0).max(100000),
  currency: z.string().trim().length(3).toUpperCase(),
  features: z.array(z.string().trim().min(1).max(120)).max(20),
  highlighted: z.boolean(),
  order: z.number().int().min(0).max(1000),
  isActive: z.boolean(),
};
const createSchema = z
  .object(fields)
  .partial()
  .required({ name: true, priceMonthly: true, priceYearly: true })
  .strict();
const patchSchema = z.object(fields).partial().strict();
const idParams = z.object({ id: objectId });

export const pricingRouter = Router();

pricingRouter.get("/", optionalAuth, async (req, res) => {
  const filter = req.user?.role === "admin" ? {} : { isActive: true };
  const data = await PricingPlan.find(filter).sort({ order: 1, priceMonthly: 1 });
  res.json({ data });
});

pricingRouter.get("/:idOrSlug", optionalAuth, async (req, res) => {
  const key = String(req.params.idOrSlug);
  const plan = await PricingPlan.findOne(isValidObjectId(key) ? { _id: key } : { slug: key.toLowerCase() });
  if (!plan || (!plan.isActive && req.user?.role !== "admin")) throw ApiError.notFound("Pricing plan");
  res.json({ data: plan });
});

pricingRouter.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const body = parse(createSchema, req.body);
  const plan = await PricingPlan.create({ ...body, slug: body.slug ?? slugify(body.name) });
  res.status(201).json({ data: plan });
});

pricingRouter.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(patchSchema, req.body);
  const plan = await PricingPlan.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!plan) throw ApiError.notFound("Pricing plan");
  res.json({ data: plan });
});

pricingRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = parse(idParams, req.params);
  const plan = await PricingPlan.findByIdAndDelete(id);
  if (!plan) throw ApiError.notFound("Pricing plan");
  res.status(204).end();
});
