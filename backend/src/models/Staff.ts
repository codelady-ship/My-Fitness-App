import { Schema, model } from "mongoose";

export const JOB_TYPES = ["Trainer", "Instructor", "Manager", "Receptionist"] as const;

const staffSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    birthDate: { type: String, default: null },
    gender: { type: String, enum: ["male", "female"], required: true },
    image: { type: String, default: "" },
    jobType: { type: String, enum: JOB_TYPES, required: true, index: true },
  },
  { timestamps: true },
);

export const Staff = model("Staff", staffSchema);
