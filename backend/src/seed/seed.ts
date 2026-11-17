/**
 * Wipes the database and inserts realistic demo data.
 *   npm run seed            (dev, uses MONGODB_URI from .env)
 *   npm run seed:prod -- --force   (after build, against a production DB)
 */
import crypto from "node:crypto";
import { config } from "../config";
import { connectDb, disconnectDb } from "../db";
import { seedDatabase } from "./data";

/** Read a password from env, or generate a random one and print it once. */
function passwordFrom(name: string): string {
  let value = process.env[name];
  if (!value) {
    value = crypto.randomBytes(12).toString("base64url");
    console.log(`${name} not set — generated one for this run: ${value}`);
  }
  if (value.length < 8) throw new Error(`${name} must be at least 8 characters`);
  return value;
}

async function main() {
  if (config.isProd && !process.argv.includes("--force")) {
    throw new Error("Refusing to wipe a production database without --force");
  }
  // The demo member is a low-privilege showcase login; its default password is
  // public in the README, so production must set its own.
  if (config.isProd && !process.env.SEED_DEMO_PASSWORD) {
    throw new Error("Set SEED_DEMO_PASSWORD when seeding a production database");
  }
  const adminPassword = passwordFrom("SEED_ADMIN_PASSWORD");
  // Coaches can read their own clients' data, so the coach login never uses the demo password.
  const coachPassword = passwordFrom("SEED_COACH_PASSWORD");
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "pulsa-demo-2026";
  if (demoPassword.length < 8) throw new Error("SEED_DEMO_PASSWORD must be at least 8 characters");

  await connectDb(config.mongoUri);
  const result = await seedDatabase({
    adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@pulsa.example",
    adminPassword,
    coachPassword,
    demoPassword,
  });
  console.log("Seeded:", JSON.stringify(result, null, 2));
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
