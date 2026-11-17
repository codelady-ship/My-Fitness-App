import { Schema, model } from "mongoose";

const coachSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: "Cardio Coach" },
    bio: { type: String, default: "" },
    specialties: { type: [String], default: [] },
    yearsExperience: { type: Number, default: 0 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    avatarUrl: { type: String, default: "" },
    initials: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

coachSchema.pre("save", function () {
  if (!this.initials || this.isModified("name")) this.initials = initialsOf(this.name);
});

export const Coach = model("Coach", coachSchema);
