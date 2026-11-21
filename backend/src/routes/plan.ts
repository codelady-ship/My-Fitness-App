import { Router } from "express";
import { z } from "zod";
import { addDays, today } from "../lib/dates";
import { ApiError } from "../lib/errors";
import { dateString, parse } from "../lib/validate";
import { requireAuthDemoReadable } from "../middleware/auth";
import { MetricDay } from "../models/MetricDay";
import { Program } from "../models/Program";
import { User } from "../models/User";
import { buildDailyPlan } from "../services/plan";
import type { DayRow } from "../services/metrics";

const query = z.object({ date: dateString.optional() });

export const planRouter = Router();

planRouter.get("/today", requireAuthDemoReadable, async (req, res) => {
  const { date = today() } = parse(query, req.query);
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized("Account no longer exists");

  // Last 14 days up to and including the plan day (morning resting HR counts).
  const history = await MetricDay.find(
    { userId: user._id, date: { $gte: addDays(date, -13), $lte: date } },
    { heartRate: 0 },
  ).lean<DayRow[]>();

  const program = user.programId ? await Program.findById(user.programId, { title: 1 }) : null;

  res.json({
    data: buildDailyPlan({
      date,
      history,
      birthDate: user.birthDate,
      program: program ? { id: String(program._id), title: program.title } : null,
    }),
  });
});
