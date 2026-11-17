import { ageFrom, round } from "../lib/dates";
import type { DayRow } from "./metrics";

export type Intensity = "rest" | "easy" | "moderate" | "hard";

const ZONES: Record<Intensity, { name: string; minPct: number; maxPct: number }> = {
  rest: { name: "Zone 1", minPct: 50, maxPct: 60 },
  easy: { name: "Zone 2", minPct: 60, maxPct: 70 },
  moderate: { name: "Zone 3", minPct: 70, maxPct: 80 },
  hard: { name: "Zone 4", minPct: 80, maxPct: 90 },
};

const STEP_FACTOR: Record<Intensity, number> = { rest: 0.8, easy: 1, moderate: 1.05, hard: 1.1 };

const TEMPLATES: Record<
  Intensity,
  { headline: string; sessions: { title: string; minutes: number; zone: string }[] }
> = {
  rest: {
    headline: "Recovery day",
    sessions: [
      { title: "Easy walk", minutes: 20, zone: "Zone 1" },
      { title: "Mobility & breathing", minutes: 10, zone: "Zone 1" },
    ],
  },
  easy: {
    headline: "Easy aerobic day",
    sessions: [
      { title: "Warm-up walk", minutes: 5, zone: "Zone 1" },
      { title: "Zone 2 steady cardio", minutes: 30, zone: "Zone 2" },
      { title: "Cool-down stretch", minutes: 5, zone: "Zone 1" },
    ],
  },
  moderate: {
    headline: "Steady cardio day",
    sessions: [
      { title: "Warm-up walk", minutes: 8, zone: "Zone 1" },
      { title: "Tempo intervals", minutes: 24, zone: "Zone 3" },
      { title: "Cool-down", minutes: 8, zone: "Zone 1" },
    ],
  },
  hard: {
    headline: "Push day — you are well recovered",
    sessions: [
      { title: "Dynamic warm-up", minutes: 10, zone: "Zone 2" },
      { title: "Threshold intervals 5 × 4 min", minutes: 30, zone: "Zone 4" },
      { title: "Cool-down jog", minutes: 10, zone: "Zone 1" },
    ],
  },
};

export type PlanInput = {
  date: string;
  /** Days before `date` (most recent last or any order); used for baseline + latest. */
  history: DayRow[];
  birthDate?: string | null;
  program?: { id: string; title: string } | null;
};

export function buildDailyPlan({ date, history, birthDate, program }: PlanInput) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latest =
    [...sorted].reverse().find((d) => d.restingBpm != null || d.recoveryScore != null) ?? null;

  const last7 = sorted.slice(-7);
  const rbs = last7.map((d) => d.restingBpm).filter((v): v is number => typeof v === "number");
  const steps = last7.map((d) => d.steps).filter((v): v is number => typeof v === "number");
  const baseline = rbs.length ? rbs.reduce((a, b) => a + b, 0) / rbs.length : null;
  const avgSteps = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : null;

  const age = ageFrom(birthDate, date) ?? 30;
  const maxHr = Math.max(120, 220 - age);

  const reasons: string[] = [];
  let intensity: Intensity;
  const rec = latest?.recoveryScore ?? null;
  const rb = latest?.restingBpm ?? null;
  const delta = rb !== null && baseline !== null ? rb - baseline : null;

  if (!latest) {
    intensity = "easy";
    reasons.push("No heart data yet — start easy and log your resting heart rate tomorrow morning.");
  } else if ((rec !== null && rec < 0.8) || (delta !== null && delta >= 7)) {
    intensity = "rest";
  } else if ((rec !== null && rec < 0.95) || (delta !== null && delta >= 4)) {
    intensity = "easy";
  } else if (rec !== null && rec >= 1.2 && (delta === null || delta <= 1)) {
    intensity = "hard";
  } else {
    intensity = "moderate";
  }

  if (latest) {
    if (rec !== null) {
      reasons.push(
        rec < 0.95
          ? `Recovery ${rec.toFixed(2)} is below your baseline.`
          : rec >= 1.2
            ? `Recovery ${rec.toFixed(2)} is well above your baseline.`
            : `Recovery ${rec.toFixed(2)} is near your baseline.`,
      );
    }
    if (rb !== null && baseline !== null && delta !== null) {
      reasons.push(
        delta >= 4
          ? `Resting heart rate ${rb} bpm is ${round(delta, 1)} bpm above your 7-day average.`
          : `Resting heart rate ${rb} bpm is in line with your 7-day average.`,
      );
    }
  }

  const zone = ZONES[intensity];
  const tpl = TEMPLATES[intensity];
  const stepsGoal = avgSteps === null
    ? 8000
    : Math.max(4000, Math.round((avgSteps * STEP_FACTOR[intensity]) / 500) * 500);

  return {
    date,
    intensity,
    headline: tpl.headline,
    targetZone: {
      ...zone,
      minBpm: Math.round((maxHr * zone.minPct) / 100),
      maxBpm: Math.round((maxHr * zone.maxPct) / 100),
    },
    durationMinutes: tpl.sessions.reduce((a, s) => a + s.minutes, 0),
    stepsGoal,
    sessions: tpl.sessions,
    reasons,
    basedOn: {
      date: latest?.date ?? null,
      restingBpm: rb,
      recoveryScore: rec,
      baselineRestingBpm: baseline === null ? null : round(baseline, 1),
      avgSteps: avgSteps === null ? null : Math.round(avgSteps),
      maxHr,
    },
    program: program ?? null,
  };
}
