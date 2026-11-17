import mongoose from "mongoose";

// Every document is serialized with a string `id` and without `_id` / `__v`.
mongoose.set("strictQuery", true);
mongoose.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    if (ret._id) ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export async function connectDb(uri: string) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function dbState(): "up" | "down" {
  return mongoose.connection.readyState === 1 ? "up" : "down";
}
