import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { addDays, today } from "../lib/dates";
import { Coach } from "../models/Coach";
import { ContactMessage } from "../models/ContactMessage";
import { Member } from "../models/Member";
import { MetricDay, normalizeSeries, type HeartPoint } from "../models/MetricDay";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { PricingPlan } from "../models/PricingPlan";
import { Program } from "../models/Program";
import { RefreshToken } from "../models/RefreshToken";
import { Staff } from "../models/Staff";
import { User } from "../models/User";
import { ensureDemoAdmin } from "./demoAdmin";

/* Deterministic PRNG so every seed run produces the same demo data. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 86_400_000;
const daysAgoDate = (n: number, hour = 9) => {
  const d = new Date(Date.now() - n * DAY_MS);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

/* ------------------------------------------------------------------ coaches */

const COACHES = [
  { name: "Leyla Taghizade", title: "Head Cardio Coach", specialties: ["Zone 2", "Marathon prep"], yearsExperience: 9, rating: 4.9, reviewsCount: 312, bio: "Former 10k runner who builds aerobic bases one calm Zone 2 session at a time." },
  { name: "Rauf Gasimov", title: "HIIT & Conditioning Coach", specialties: ["HIIT", "Rowing"], yearsExperience: 7, rating: 4.8, reviewsCount: 241, bio: "Short, sharp interval work with heart-rate caps so you push hard and still recover." },
  { name: "Kamran Rahimli", title: "Recovery Specialist", specialties: ["HRV", "Breathwork", "Sleep"], yearsExperience: 6, rating: 4.8, reviewsCount: 188, bio: "Reads your HRV and sleep data to decide when to push and when to rest." },
  { name: "Gunay Abbasova", title: "Heart-Health Coach", specialties: ["Blood pressure", "Walking programs"], yearsExperience: 11, rating: 4.9, reviewsCount: 402, bio: "Gentle, steady programs for lowering resting heart rate and blood pressure." },
  { name: "Javid Ismayilov", title: "Endurance Coach", specialties: ["Cycling", "Triathlon"], yearsExperience: 8, rating: 4.7, reviewsCount: 159, bio: "Long rides, smart pacing, and a training plan that adapts to every heartbeat." },
  { name: "Nargiz Valiyeva", title: "Fat-Burn Coach", specialties: ["Fat-burn zone", "Strength + cardio"], yearsExperience: 5, rating: 4.6, reviewsCount: 97, bio: "Combines fat-burn cardio with light strength work for lasting results." },
];

/* ----------------------------------------------------------------- programs */

const PROGRAMS = [
  { slug: "zone-2-foundations", title: "Zone 2 Foundations", coach: 0, level: "beginner", focus: "endurance", durationWeeks: 6, sessionsPerWeek: 4, minutesPerSession: 40, targetZone: { minPct: 60, maxPct: 70 }, enrolledCount: 1840, summary: "Build an aerobic base with calm, conversational cardio." },
  { slug: "hiit-heart-boost", title: "HIIT Heart Boost", coach: 1, level: "advanced", focus: "hiit", durationWeeks: 4, sessionsPerWeek: 3, minutesPerSession: 30, targetZone: { minPct: 80, maxPct: 92 }, enrolledCount: 960, summary: "Short intervals that raise VO2 max without wrecking recovery." },
  { slug: "resting-rate-reset", title: "Resting Rate Reset", coach: 3, level: "beginner", focus: "heart-health", durationWeeks: 8, sessionsPerWeek: 5, minutesPerSession: 30, targetZone: { minPct: 55, maxPct: 68 }, enrolledCount: 2310, summary: "Lower your resting heart rate with daily walks and breathing." },
  { slug: "fat-burn-flow", title: "Fat-Burn Flow", coach: 5, level: "intermediate", focus: "fat-burn", durationWeeks: 6, sessionsPerWeek: 4, minutesPerSession: 45, targetZone: { minPct: 65, maxPct: 75 }, enrolledCount: 1405, summary: "Steady fat-burn zone cardio with two light strength days." },
  { slug: "recovery-reboot", title: "Recovery Reboot", coach: 2, level: "beginner", focus: "recovery", durationWeeks: 3, sessionsPerWeek: 5, minutesPerSession: 20, targetZone: { minPct: 50, maxPct: 60 }, enrolledCount: 720, summary: "HRV-guided easy days, mobility and sleep habits." },
  { slug: "half-marathon-heart", title: "Half Marathon Heart", coach: 4, level: "intermediate", focus: "endurance", durationWeeks: 12, sessionsPerWeek: 4, minutesPerSession: 55, targetZone: { minPct: 65, maxPct: 85 }, enrolledCount: 1120, summary: "Heart-rate-paced plan to finish 21.1 km strong." },
] as const;

const PLANS = [
  { slug: "starter", name: "Starter", tagline: "Track your heart for free", priceMonthly: 0, priceYearly: 0, features: ["Resting bpm & steps tracking", "7-day heart summary", "1 starter program"], highlighted: false, order: 1 },
  { slug: "pro", name: "Pro", tagline: "Daily adaptive plan + coach chat", priceMonthly: 19, priceYearly: 182, features: ["Everything in Starter", "Daily adaptive plan", "Heart-rate zones & charts", "All programs", "Coach chat"], highlighted: true, order: 2 },
  { slug: "elite", name: "Elite", tagline: "1-on-1 coaching that reads every beat", priceMonthly: 39, priceYearly: 374, features: ["Everything in Pro", "Personal coach", "Weekly video check-in", "Custom programs"], highlighted: false, order: 3 },
];

/* ------------------------------------------------------- gym admin (legacy) */

type GymSeed = [code: string, name: string, image: string, gender: "male" | "female", birth: string, phone: string, type: "Year" | "Monthly", started: number, registered: number, lastVisit: number, remaining: number, status: "active" | "expired" | "passive", height: number, weight: number, goals: string, coach: string, notes: string, blacklisted?: boolean];

const GYM_MEMBERS: GymSeed[] = [
  ["C123456", "Elvin Mammadov", "/download2.jpg", "male", "1990-05-12", "+994 50 123 45 67", "Year", 120, 130, 1, 5, "active", 180, 78, "Increase muscle mass", "Rauf Gasimov", "Good progress on bench press."],
  ["C654321", "Aysel Aliyeva", "/download1.jpg", "female", "1995-02-15", "+994 70 123 45 67", "Monthly", 45, 75, 16, 0, "expired", 165, 60, "Lose weight", "Leyla Taghizade", "Asked about renewing next month."],
  ["C654322", "Tural Hasanov", "", "male", "1988-07-20", "+994 70 123 45 68", "Year", 200, 210, 9, 1, "passive", 177, 82, "Increase physical strength", "Rauf Gasimov", "Paused because of travel."],
  ["C654323", "Sevinj Karimova", "/image.jpg", "female", "1993-08-10", "+994 70 123 45 69", "Monthly", 70, 100, 38, 0, "expired", 168, 65, "More cardio", "Kamran Rahimli", "Did not renew yet."],
  ["C654324", "Orkhan Mammadli", "", "male", "1985-11-23", "+994 70 123 45 70", "Monthly", 12, 12, 0, 3, "active", 180, 85, "Improve body composition", "Leyla Taghizade", "New member, first program set."],
  ["C654325", "Nigar Javadova", "/download1.jpg", "female", "1998-03-14", "+994 70 123 45 71", "Monthly", 20, 20, 2, 2, "active", 162, 58, "More cardio", "Kamran Rahimli", "Prefers morning classes."],
  ["C654326", "Anar Suleymanov", "", "male", "1992-04-18", "+994 70 123 45 72", "Monthly", 95, 160, 64, 0, "expired", 175, 79, "Improve body composition", "Leyla Taghizade", "Blacklisted after repeated unpaid visits.", true],
  ["C654327", "Zahra Guliyeva", "/image.jpg", "female", "1993-05-16", "+994 70 123 45 73", "Monthly", 25, 90, 6, 4, "passive", 170, 64, "Increase physical strength", "Rauf Gasimov", "Recovering from a knee injury."],
  ["C654328", "Farid Aliyev", "/download2.jpg", "male", "1989-10-22", "+994 70 123 45 74", "Year", 150, 340, 1, 5, "active", 182, 90, "Increase muscle mass", "Rauf Gasimov", "Second year with us."],
  ["C789012", "Murad Guliyev", "", "male", "1994-11-11", "+994 70 123 45 75", "Monthly", 5, 5, 0, 2, "active", 174, 79, "Increase physical strength", "Kamran Rahimli", "Joined this week."],
];

const STAFF = [
  ["Leyla", "Taghizade", "+994 50 200 10 01", "1991-03-08", "female", "/image.jpg", "Trainer"],
  ["Rauf", "Gasimov", "+994 50 200 10 02", "1987-09-21", "male", "/download2.jpg", "Trainer"],
  ["Kamran", "Rahimli", "+994 50 200 10 03", "1993-12-02", "male", "", "Instructor"],
  ["Gunay", "Abbasova", "+994 50 200 10 04", "1996-06-14", "female", "/download1.jpg", "Instructor"],
  ["Elnur", "Babayev", "+994 50 200 10 05", "1982-01-30", "male", "", "Manager"],
  ["Sabina", "Huseynova", "+994 50 200 10 06", "1999-04-11", "female", "", "Receptionist"],
  ["Javid", "Ismayilov", "+994 50 200 10 07", "1994-08-25", "male", "", "Trainer"],
  ["Nargiz", "Valiyeva", "+994 50 200 10 08", "1990-11-17", "female", "", "Instructor"],
] as const;

/* ------------------------------------------------------------ app members */

// Created oldest → newest, so the four newest are AR, MK, JS, TL for the hero avatars.
const APP_MEMBERS = [
  "Kenan Huseynli", "Lala Mammadova", "Emil Rustamov", "Sabina Orujova", "Rashad Novruzov",
  "Gulnar Ahmadova", "Samir Babayev", "Narmin Quliyeva", "Vusal Ismayilzade", "Fidan Hasanli",
  "Ilkin Mehdiyev", "Konul Aliyeva", "Teymur Lazimov", "Jala Safarova", "Murad Karimov", "Aylin Rzayeva",
];

/* ---------------------------------------------------------- heart metrics */

/** One day of heart-rate points every `step` minutes, shaped like a real day. */
function daySeries(rand: () => number, resting: number, step: number, workoutHour: number, peak: number): HeartPoint[] {
  const pts: HeartPoint[] = [];
  for (let m = 0; m < 1440; m += step) {
    const h = m / 60;
    let bpm: number;
    if (h < 6.5) bpm = resting - 6 + rand() * 4; // sleep
    else if (h < 8) bpm = resting + 6 + rand() * 10; // waking, commute
    else if (h >= workoutHour && h < workoutHour + 0.75) {
      const x = (h - workoutHour) / 0.75; // 0..1 through the workout
      bpm = resting + (peak - resting) * Math.sin(Math.PI * Math.min(1, x * 1.15)) + rand() * 6;
    } else if (h >= workoutHour + 0.75 && h < workoutHour + 1.25) bpm = resting + 25 - (h - workoutHour - 0.75) * 30 + rand() * 5;
    else if (h >= 22.5) bpm = resting - 2 + rand() * 4;
    else bpm = resting + 10 + rand() * 14; // daytime
    pts.push({ t: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, bpm: Math.round(bpm) });
  }
  return pts;
}

type MetricOpts = { days: number; seriesDays: number; seed: number; restStart: number; restEnd: number; stepsBase: number; pinToday?: boolean };

export function generateMetrics(userId: Types.ObjectId, o: MetricOpts) {
  const rand = rng(o.seed);
  const end = today();
  const docs = [];
  for (let i = o.days - 1; i >= 0; i--) {
    const date = addDays(end, -i);
    const progress = (o.days - 1 - i) / Math.max(1, o.days - 1);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const restDay = weekday === 0;
    let restingBpm = Math.round(o.restStart + (o.restEnd - o.restStart) * progress + (rand() - 0.5) * 4);
    let steps = Math.round(o.stepsBase * (restDay ? 0.6 : 1) * (0.75 + rand() * 0.6));
    let recoveryScore = Math.round((0.85 + rand() * 0.45 + progress * 0.08) * 100) / 100;
    if (o.pinToday && i === 0) {
      // Matches the landing-page hero: 72 bpm, 24k steps, 1.32 recovery.
      restingBpm = 72;
      steps = 24000;
      recoveryScore = 1.32;
    }
    const hrvMs = Math.round(45 + recoveryScore * 12 + (rand() - 0.5) * 8);
    const sleepMinutes = Math.round(380 + rand() * 110);
    const activeMinutes = restDay ? Math.round(10 + rand() * 15) : Math.round(30 + rand() * 45);
    const withSeries = i < o.seriesDays;
    const series = withSeries
      ? normalizeSeries(daySeries(rand, restingBpm, i < 7 ? 5 : 15, restDay ? 10 : 17 + Math.floor(rand() * 2), restDay ? restingBpm + 40 : 140 + Math.round(rand() * 25)))
      : { heartRate: [], hrStats: { min: null, max: null, sum: 0, count: 0 } };
    docs.push({ userId, date, restingBpm, steps, recoveryScore, hrvMs, sleepMinutes, activeMinutes, ...series, source: "seed" as const });
  }
  return docs;
}

/* -------------------------------------------------------------------- seed */

export type SeedOptions = {
  adminEmail: string;
  adminPassword: string;
  demoPassword: string;
  /** Coach login password (never the demo one: coaches can read client data). */
  coachPassword: string;
  /** Smaller data set (used by tests). */
  light?: boolean;
};

export async function seedDatabase(opts: SeedOptions) {
  await Promise.all(
    [User, RefreshToken, Coach, Program, PricingPlan, MetricDay, Member, Staff, ContactMessage, NewsletterSubscriber].map((m) =>
      (m as typeof User).deleteMany({}),
    ),
  );
  await Promise.all([User, MetricDay, Member, Program, PricingPlan, Staff].map((m) => (m as typeof User).syncIndexes()));

  // Background members get an unguessable password nobody knows; only demo/coach/admin can log in.
  const [adminHash, coachHash, demoHash, crowdHash] = await Promise.all([
    bcrypt.hash(opts.adminPassword, 10),
    bcrypt.hash(opts.coachPassword, 10),
    bcrypt.hash(opts.demoPassword, 10),
    bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 10),
  ]);

  // Coaches + one coach login linked to the head coach.
  const coaches = await Coach.create(COACHES.map((c) => ({ ...c, avatarUrl: "" })));
  const coachUser = await User.create({ name: "Leyla Taghizade", email: "coach@pulsa.example", passwordHash: coachHash, role: "coach", birthDate: "1991-03-08", gender: "female" });
  coaches[0]!.userId = coachUser._id;
  await coaches[0]!.save();

  const programs = await Program.create(PROGRAMS.map(({ coach, ...p }) => ({ ...p, coachId: coaches[coach]!._id, isPublished: true })));
  await PricingPlan.create(PLANS);

  const admin = await User.create({ name: "Pulsa Admin", email: opts.adminEmail.toLowerCase(), passwordHash: adminHash, role: "admin" });
  // Public read-only admin for the portfolio demo (writes are refused by the API).
  const demoAdmin = await ensureDemoAdmin();

  const demo = new User({
    createdAt: daysAgoDate(120),
    updatedAt: daysAgoDate(1),
    name: "Demo Runner",
    email: "demo@pulsa.example",
    passwordHash: demoHash,
    role: "member",
    birthDate: "1996-04-20",
    gender: "female",
    goal: "Lower resting heart rate below 70",
    programId: programs[0]!._id,
    coachId: coaches[0]!._id,
  });
  await demo.save({ timestamps: false });

  const appMembers = opts.light ? APP_MEMBERS.slice(-4) : APP_MEMBERS;
  const members = [];
  for (const [i, name] of appMembers.entries()) {
    const u = new User({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@pulsa.example`,
      passwordHash: crowdHash,
      role: "member",
      programId: programs[i % programs.length]!._id,
      coachId: coaches[i % coaches.length]!._id,
      createdAt: daysAgoDate(appMembers.length - i, 12),
      updatedAt: daysAgoDate(appMembers.length - i, 12),
    });
    await u.save({ timestamps: false });
    members.push(u);
  }

  const metricDocs = [
    ...generateMetrics(demo._id, { days: opts.light ? 30 : 90, seriesDays: opts.light ? 3 : 30, seed: 7, restStart: 78, restEnd: 71, stepsBase: 11000, pinToday: true }),
    ...members.flatMap((u, i) =>
      generateMetrics(u._id, { days: opts.light ? 7 : 30, seriesDays: opts.light ? 0 : 3, seed: 100 + i, restStart: 62 + (i % 5) * 3, restEnd: 60 + (i % 5) * 3, stepsBase: 7000 + (i % 4) * 1500 }),
    ),
  ];
  await MetricDay.insertMany(metricDocs);

  await Member.insertMany(
    GYM_MEMBERS.map(([memberCode, fullName, image, gender, birthDate, phone, membershipType, started, registered, lastVisit, remaining, status, height, weight, goals, coach, notes, blacklisted]) => {
      const length = membershipType === "Year" ? 365 : 30;
      return {
        memberCode, fullName, image, gender, birthDate, phone, membershipType, status, height, weight, goals, coach, notes,
        email: `${fullName.toLowerCase().replace(/\s+/g, ".")}@mail.example`,
        remainingAccesses: remaining,
        isBlacklisted: !!blacklisted,
        startDate: addDays(today(), -started),
        endDate: addDays(today(), length - started),
        lastVisit: daysAgoDate(lastVisit, 8),
        checkInHistory: [lastVisit + 14, lastVisit + 7, lastVisit + 3, lastVisit].map((d) => daysAgoDate(d, 8)),
        createdAt: daysAgoDate(registered),
        updatedAt: daysAgoDate(lastVisit),
      };
    }),
    { timestamps: false } as never,
  );

  await Staff.create(
    STAFF.map(([firstName, lastName, phone, birthDate, gender, image, jobType]) => ({
      firstName, lastName, phone, birthDate, gender, image, jobType,
      email: `${firstName}.${lastName}@myfitness.example`.toLowerCase(),
    })),
  );

  await ContactMessage.create([
    { name: "Ramin Aliyev", email: "ramin@mail.example", subject: "Programs", message: "Which program is best to lower my resting heart rate before a 10k?", status: "new" },
    { name: "Sara Mammadli", email: "sara@mail.example", subject: "Pricing", message: "Is there a student discount for the Pro plan?", status: "new" },
    { name: "Tofig Karimli", email: "tofig@mail.example", subject: "Coaching", message: "Can Gunay coach me remotely? I live outside Baku.", status: "read" },
  ]);

  await NewsletterSubscriber.create(
    Array.from({ length: opts.light ? 3 : 14 }, (_, i) => ({ email: `reader${i + 1}@mail.example` })),
  );

  return {
    admin: { email: admin.email },
    demoAdmin: { email: demoAdmin.email, readOnly: true },
    demo: { email: demo.email },
    coach: { email: coachUser.email },
    counts: {
      coaches: coaches.length,
      programs: programs.length,
      pricingPlans: PLANS.length,
      users: appMembers.length + 4,
      metricDays: metricDocs.length,
      gymMembers: GYM_MEMBERS.length,
      staff: STAFF.length,
    },
  };
}
