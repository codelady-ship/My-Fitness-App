import bcrypt from "bcryptjs";
import { User } from "../models/User";

/**
 * Public "Demo admin" login for the portfolio. Its password is public by design (shown on the login
 * page): the account is flagged `isDemo`, so the API refuses every write it tries (403 DEMO_READ_ONLY)
 * and hides lists with visitors' personal data. Keep these in sync with lib/api/index.ts (DEMO_ADMIN).
 */
export const DEMO_ADMIN_EMAIL = "demo-admin@pulsa.example";
export const DEMO_ADMIN_PASSWORD = "pulsa-demo-admin";

/** Create or reset the demo admin. Idempotent and touches no other data. */
export async function ensureDemoAdmin() {
  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  return User.findOneAndUpdate(
    { email: DEMO_ADMIN_EMAIL },
    { $set: { name: "Demo Admin", passwordHash, role: "admin", isDemo: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
