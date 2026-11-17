import mongoose from "mongoose";
import { afterAll, beforeAll, inject } from "vitest";
import { connectDb, disconnectDb } from "../src/db";

// Each test file starts from an empty database.
beforeAll(async () => {
  await connectDb(inject("mongoUri"));
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
});

afterAll(async () => {
  await disconnectDb();
});
