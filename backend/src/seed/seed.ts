/**
 * Wipes the database and inserts realistic demo data.
 *   npm run seed            (dev, uses MONGODB_URI from .env)
 *   npm run seed:prod -- --force   (after build, against a production DB)
 */
import crypto from "node:crypto";
import { config } from "../config";
import { connectDb, disconnectDb } from "../db";
import { seedDatabase } from "./data";

async function main() {
  if (config.isProd && !process.argv.includes("--force")) {
    throw new Error("Refusing to wipe a production database without --force");
  }
  let adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(12).toString("base64url");
    console.log(`SEED_ADMIN_PASSWORD not set — generated one for this run: ${adminPassword}`);
  }
  if (adminPassword.length < 8) throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters");

  await connectDb(config.mongoUri);
  const result = await seedDatabase({
    adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@pulsa.example",
    adminPassword,
    demoPassword: process.env.SEED_DEMO_PASSWORD || "pulsa-demo-2026",
  });
  console.log("Seeded:", JSON.stringify(result, null, 2));
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
