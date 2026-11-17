import { Schema, model } from "mongoose";

const pricingPlanSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: "" },
    priceMonthly: { type: Number, required: true, min: 0 },
    priceYearly: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    features: { type: [String], default: [] },
    highlighted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PricingPlan = model("PricingPlan", pricingPlanSchema);
