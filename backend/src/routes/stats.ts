import { Router } from "express";
import { config } from "../config";
import { Coach, initialsOf } from "../models/Coach";
import { Program } from "../models/Program";
import { User } from "../models/User";

const FALLBACK_INITIALS = ["AR", "MK", "JS", "TL"];

export function compactCount(n: number): string {
  if (n < 1000) return `+${n}`;
  if (n < 1_000_000) return `+${(Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, "")}k`;
  return `+${(Math.floor(n / 100_000) / 10).toFixed(1).replace(/\.0$/, "")}m`;
}

export const statsRouter = Router();

statsRouter.get("/public", async (_req, res) => {
  const [users, coaches, programs, recent] = await Promise.all([
    User.countDocuments({ role: "member" }),
    Coach.countDocuments({ isActive: true }),
    Program.countDocuments({ isPublished: true }),
    User.find({ role: "member" }, { name: 1 }).sort({ createdAt: -1 }).limit(4).lean(),
  ]);
  const members = users + config.publicMemberBase;
  const initials = recent.map((u) => initialsOf(u.name)).filter(Boolean);
  res.json({
    data: {
      members,
      membersLabel: compactCount(members),
      coaches,
      programs,
      featuredInitials: initials.length === 4 ? initials : FALLBACK_INITIALS,
    },
  });
});
