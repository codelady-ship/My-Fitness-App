import { Schema, model } from "mongoose";

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed", index: true },
  },
  { timestamps: true },
);

export const NewsletterSubscriber = model("NewsletterSubscriber", subscriberSchema);
