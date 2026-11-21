import { Router, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { dateString, email, objectId, parse } from "../lib/validate";
import { requireAuth, requireAuthDemoReadable } from "../middleware/auth";
import { Coach } from "../models/Coach";
import { User } from "../models/User";
import { consumeRefreshToken, issueTokens, revokeAllForUser } from "../services/tokens";

const password = z.string().min(8, "Password must be at least 8 characters").max(128);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
});
const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
const refreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });
const meSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    avatarUrl: z.string().trim().max(500),
    birthDate: dateString.nullable(),
    gender: z.enum(["male", "female", "other"]).nullable(),
    goal: z.string().trim().max(200).nullable(),
    coachId: objectId.nullable(),
  })
  .partial()
  .strict();
const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });

// Dummy hash so a login for an unknown email costs the same time as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function authRouter(authLimiter: RequestHandler) {
  const router = Router();

  router.post("/register", authLimiter, async (req, res) => {
    const body = parse(registerSchema, req.body);
    if (await User.exists({ email: body.email })) throw ApiError.conflict("Email is already registered");
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
      role: "member",
    });
    const tokens = await issueTokens(user);
    res.status(201).json({ data: { user, ...tokens } });
  });

  router.post("/login", authLimiter, async (req, res) => {
    const body = parse(loginSchema, req.body);
    const user = await User.findOne({ email: body.email }).select("+passwordHash");
    const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw ApiError.unauthorized("Invalid email or password");
    const tokens = await issueTokens(user);
    res.json({ data: { user, ...tokens } });
  });

  router.post("/refresh", authLimiter, async (req, res) => {
    const { refreshToken } = parse(refreshSchema, req.body);
    const userId = await consumeRefreshToken(refreshToken);
    const user = userId ? await User.findById(userId) : null;
    if (!user) throw ApiError.unauthorized("Invalid or expired refresh token");
    const tokens = await issueTokens(user);
    res.json({ data: { user, ...tokens } });
  });

  router.post("/logout", async (req, res) => {
    const { refreshToken } = parse(refreshSchema, req.body);
    await consumeRefreshToken(refreshToken);
    res.status(204).end();
  });

  router.get("/me", requireAuthDemoReadable, async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw ApiError.unauthorized("Account no longer exists");
    res.json({ data: user });
  });

  router.patch("/me", requireAuth, async (req, res) => {
    const body = parse(meSchema, req.body);
    if (body.coachId && !(await Coach.exists({ _id: body.coachId, isActive: true }))) {
      throw ApiError.notFound("Coach");
    }
    const user = await User.findByIdAndUpdate(req.user!.id, body, { new: true, runValidators: true });
    if (!user) throw ApiError.unauthorized("Account no longer exists");
    res.json({ data: user });
  });

  router.post("/change-password", requireAuth, async (req, res) => {
    const body = parse(changePasswordSchema, req.body);
    const user = await User.findById(req.user!.id).select("+passwordHash");
    if (!user) throw ApiError.unauthorized("Account no longer exists");
    if (!(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      throw ApiError.unauthorized("Current password is incorrect");
    }
    user.passwordHash = await bcrypt.hash(body.newPassword, 10);
    await user.save();
    await revokeAllForUser(user._id);
    res.status(204).end();
  });

  return router;
}
