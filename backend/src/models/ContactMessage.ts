import { Schema, model } from "mongoose";

const contactSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "archived"], default: "new", index: true },
  },
  { timestamps: true },
);

export const ContactMessage = model("ContactMessage", contactSchema);
