import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { config } from "../config";
import { RefreshToken } from "../models/RefreshToken";
import type { Role } from "../models/User";

const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export function signAccessToken(userId: string, role: Role) {
  return jwt.sign({ role }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.accessTtl,
    algorithm: "HS256",
  });
}

export async function issueTokens(user: { _id: Types.ObjectId; role: Role }) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hash(refreshToken),
    expiresAt: new Date(Date.now() + config.refreshTtlDays * 86_400_000),
  });
  return {
    accessToken: signAccessToken(String(user._id), user.role),
    refreshToken,
    expiresIn: config.accessTtl,
  };
}

/** Consumes (deletes) a refresh token and returns its user id, or null if invalid/expired. */
export async function consumeRefreshToken(token: string): Promise<string | null> {
  const doc = await RefreshToken.findOneAndDelete({ tokenHash: hash(token) });
  if (!doc || doc.expiresAt.getTime() < Date.now()) return null;
  return String(doc.userId);
}

export async function revokeAllForUser(userId: string | Types.ObjectId) {
  await RefreshToken.deleteMany({ userId });
}
