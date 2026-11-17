import { Schema, model } from "mongoose";

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const FOCUSES = ["endurance", "fat-burn", "hiit", "recovery", "heart-health"] as const;

const programSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    level: { type: String, enum: LEVELS, required: true, index: true },
    focus: { type: String, enum: FOCUSES, required: true, index: true },
    durationWeeks: { type: Number, required: true },
    sessionsPerWeek: { type: Number, required: true },
    minutesPerSession: { type: Number, required: true },
    targetZone: {
      type: new Schema({ minPct: Number, maxPct: Number }, { _id: false }),
      required: true,
    },
    coachId: { type: Schema.Types.ObjectId, ref: "Coach", default: null, index: true },
    imageUrl: { type: String, default: "" },
    isPublished: { type: Boolean, default: true, index: true },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Program = model("Program", programSchema);
