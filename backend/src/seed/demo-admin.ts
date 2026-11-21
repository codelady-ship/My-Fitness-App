/**
 * Adds (or resets) only the read-only demo admin, without wiping anything:
 *   npm run seed:demo-admin           (dev, uses MONGODB_URI from .env)
 *   npm run seed:demo-admin:prod      (after build, e.g. against the production DB)
 */
import { config } from "../config";
import { connectDb, disconnectDb } from "../db";
import { DEMO_ADMIN_EMAIL, ensureDemoAdmin } from "./demoAdmin";

async function main() {
  await connectDb(config.mongoUri);
  await ensureDemoAdmin();
  console.log(`Demo admin ready: ${DEMO_ADMIN_EMAIL} (read-only)`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
