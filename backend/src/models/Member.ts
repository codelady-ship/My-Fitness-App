import { Schema, model } from "mongoose";

export const MEMBERSHIP_TYPES = ["Year", "Monthly"] as const;
export const MEMBER_STATUSES = ["active", "expired", "passive"] as const;

const memberSchema = new Schema(
  {
    memberCode: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female"], required: true },
    birthDate: { type: String, default: null },
    image: { type: String, default: "" },
    membershipType: { type: String, enum: MEMBERSHIP_TYPES, required: true, index: true },
    status: { type: String, enum: MEMBER_STATUSES, default: "active", index: true },
    remainingAccesses: { type: Number, default: 0, min: 0 },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    lastVisit: { type: Date, default: null },
    checkInHistory: { type: [Date], default: [] },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    goals: { type: String, default: "" },
    coach: { type: String, default: "", index: true },
    notes: { type: String, default: "" },
    isBlacklisted: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);
memberSchema.index({ checkInHistory: 1 });
memberSchema.index({ createdAt: -1 });

export const Member = model("Member", memberSchema);
