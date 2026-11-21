import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

export const ROLES = ["member", "coach", "admin"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "member", index: true },
    /** Public read-only showcase login (the portfolio's "Demo admin"): every write is refused server-side. */
    isDemo: { type: Boolean, default: false },
    avatarUrl: { type: String, default: "" },
    birthDate: { type: String, default: null },
    gender: { type: String, enum: ["male", "female", "other", null], default: null },
    goal: { type: String, default: null },
    programId: { type: Schema.Types.ObjectId, ref: "Program", default: null },
    coachId: { type: Schema.Types.ObjectId, ref: "Coach", default: null },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;
export const User = model("User", userSchema);
