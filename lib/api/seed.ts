/** Bundled demo data used whenever the API is not configured, slow (8 s) or down. */
import type { Coach, DailyPlan, HeartMetrics, PricingPlan, Program, PublicStats } from "./types";
import { daysAgo } from "@/lib/utils";

export const seedPrograms: Program[] = [
  {
    id: "zone2-base",
    title: "Zone 2 Base",
    summary: "Long, easy sessions that build the aerobic engine and lower your resting heart rate.",
    level: "Beginner",
    weeks: 8,
    sessionsPerWeek: 4,
    zone: 2,
    tags: ["Endurance", "Fat burn"],
  },
  {
    id: "hiit-intervals",
    title: "HIIT Intervals",
    summary: "Short, hard efforts with coached recovery, adapted daily to how your heart responds.",
    level: "Advanced",
    weeks: 6,
    sessionsPerWeek: 3,
    zone: 5,
    tags: ["VO₂ max", "Speed"],
  },
  {
    id: "heart-recovery",
    title: "Heart Recovery",
    summary: "Gentle, low-impact cardio after illness or a long break, with strict upper limits.",
    level: "Beginner",
    weeks: 10,
    sessionsPerWeek: 3,
    zone: 1,
    tags: ["Low impact", "Rehab"],
  },
  {
    id: "half-marathon",
    title: "Half Marathon Prep",
    summary: "A 12-week build with tempo runs, long runs and taper, paced by heart rate.",
    level: "Intermediate",
    weeks: 12,
    sessionsPerWeek: 4,
    zone: 3,
    tags: ["Running", "Race"],
  },
  {
    id: "cycle-threshold",
    title: "Cycle Threshold",
    summary: "Indoor and outdoor rides that push your threshold up without burning you out.",
    level: "Intermediate",
    weeks: 8,
    sessionsPerWeek: 3,
    zone: 4,
    tags: ["Cycling", "Power"],
  },
  {
    id: "calm-hrv",
    title: "Calm & HRV",
    summary: "Breathing, mobility and easy walks that raise heart-rate variability and sleep quality.",
    level: "Beginner",
    weeks: 4,
    sessionsPerWeek: 5,
    zone: 1,
    tags: ["Stress", "Sleep"],
  },
];

export const seedCoaches: Coach[] = [
  {
    id: "c1",
    name: "Leyla Taghizade",
    role: "Head coach",
    specialty: "Endurance & Zone 2",
    bio: "Former middle-distance runner. Builds plans that feel easy and still move the numbers.",
    years: 11,
    rating: 4.9,
    reviews: 214,
  },
  {
    id: "c2",
    name: "Rauf Gasimov",
    role: "Performance coach",
    specialty: "HIIT & VO₂ max",
    bio: "Turns interval data into short, sharp sessions that fit a busy week.",
    years: 8,
    rating: 4.8,
    reviews: 168,
  },
  {
    id: "c3",
    name: "Gunay Abbasova",
    role: "Recovery coach",
    specialty: "Cardiac rehab & low impact",
    bio: "Works with people coming back after illness, injury or a long break.",
    years: 9,
    rating: 5.0,
    reviews: 121,
  },
  {
    id: "c4",
    name: "Kamran Rahimli",
    role: "Cycling coach",
    specialty: "Threshold & power",
    bio: "Rides, races and coaches. Loves a well-paced climb.",
    years: 6,
    rating: 4.7,
    reviews: 97,
  },
  {
    id: "c5",
    name: "Nargiz Valiyeva",
    role: "Wellbeing coach",
    specialty: "HRV, breath & sleep",
    bio: "Helps you lower stress so your heart can actually recover.",
    years: 7,
    rating: 4.9,
    reviews: 143,
  },
  {
    id: "c6",
    name: "Javid Ismayilov",
    role: "Run coach",
    specialty: "5k to half marathon",
    bio: "Patient, data-driven and allergic to junk miles.",
    years: 5,
    rating: 4.8,
    reviews: 88,
  },
];

export const seedPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    monthly: 0,
    yearly: 0,
    blurb: "Track your heart and try the basics.",
    features: ["Resting heart rate & zones", "7-day history", "One starter program", "Community support"],
  },
  {
    id: "pulse",
    name: "Pulse",
    monthly: 12,
    yearly: 115,
    blurb: "A plan that adapts every day.",
    features: ["Everything in Starter", "Daily adaptive plan", "Unlimited history & insights", "All programs", "Recovery score"],
    featured: true,
  },
  {
    id: "coach",
    name: "Coach+",
    monthly: 39,
    yearly: 375,
    blurb: "A real coach in your pocket.",
    features: ["Everything in Pulse", "Personal coach & weekly check-in", "Chat with your coach", "Race & rehab plans"],
  },
];

/** 14 days of resting heart rate drifting slowly down, so the chart tells a story. */
export const makeSeedMetrics = (now = new Date()): HeartMetrics => {
  const base = [78, 77, 78, 76, 76, 75, 76, 74, 74, 73, 74, 73, 72, 72];
  return {
    restingBpm: 72,
    zoneScore: 72,
    steps: 24000,
    recovery: 1.32,
    hrv: 58,
    sleepMinutes: 440,
    history: base.map((bpm, i) => ({ date: daysAgo(base.length - 1 - i, now), bpm })),
  };
};

export const makeSeedPlan = (now = new Date()): DailyPlan => ({
  date: now.toISOString().slice(0, 10),
  intensity: "moderate",
  headline: "Steady cardio day",
  target: "Zone 3 · 133–152 bpm",
  durationMinutes: 40,
  stepsGoal: 10500,
  items: [
    { id: "s1", title: "Warm-up walk", minutes: 8, zone: 1, done: false },
    { id: "s2", title: "Tempo intervals", minutes: 24, zone: 3, done: false },
    { id: "s3", title: "Cool-down", minutes: 8, zone: 1, done: false },
  ],
  reasons: ["Recovery 1.32 is above your baseline.", "Resting heart rate 72 bpm is in line with your 7-day average."],
});

export const seedPublicStats: PublicStats = { membersLabel: "+12.4k", initials: ["AR", "MK", "JS", "TL"] };
