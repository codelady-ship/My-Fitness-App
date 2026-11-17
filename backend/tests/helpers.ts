import bcrypt from "bcryptjs";
import request from "supertest";
import { createApp } from "../src/app";
import { User, type Role } from "../src/models/User";
import { issueTokens } from "../src/services/tokens";

export const app = createApp({ rateLimit: { enabled: false }, corsOrigins: ["http://localhost:3000"] });
export const api = () => request(app);

let n = 0;
let cachedHash: string | undefined;

/** Create a user directly in the DB and return an access token for it. */
export async function makeUser(role: Role = "member", extra: Record<string, unknown> = {}) {
  n += 1;
  cachedHash ??= await bcrypt.hash("password123", 4);
  const user = await User.create({
    name: `Test ${role} ${n}`,
    email: `${role}${n}-${Date.now()}@test.example`,
    passwordHash: cachedHash,
    role,
    ...extra,
  });
  const { accessToken } = await issueTokens(user);
  return { user, id: String(user._id), token: accessToken, auth: { Authorization: `Bearer ${accessToken}` } };
}
