import { addDays, monthEnd, monthStart, round, weekStart } from "../lib/dates";
import type { HeartPoint, HrStats } from "../models/MetricDay";

/** The subset of a MetricDay the aggregations need (no heart-rate series). */
export type DayRow = {
  date: string;
  restingBpm?: number | null;
  steps?: number | null;
  recoveryScore?: number | null;
  hrvMs?: number | null;
  sleepMinutes?: number | null;
  activeMinutes?: number | null;
  hrStats?: Partial<HrStats> | null;
};

type NumKey = "restingBpm" | "steps" | "recoveryScore" | "hrvMs" | "sleepMinutes" | "activeMinutes";

const values = (rows: DayRow[], key: NumKey) =>
  rows.map((r) => r[key]).filter((v): v is number => typeof v === "number");

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const r = (n: number | null, digits = 1) => (n === null ? null : round(n, digits));

export const GAUGE_MAX = 100;
export const GAUGE_TICKS = 30;

export function gauge(value: number | null) {
  const fraction = value === null ? null : round(Math.min(1, Math.max(0, value / GAUGE_MAX)), 2);
  return {
    value,
    min: 0,
    max: GAUGE_MAX,
    fraction,
    ticks: GAUGE_TICKS,
    litTicks: fraction === null ? 0 : Math.round(fraction * GAUGE_TICKS),
    unit: "bpm",
  };
}

/** Summary over `days` days ending at `to` (inclusive). `rows` may be in any order. */
export function summarize(rows: DayRow[], to: string, days: number) {
  const from = addDays(to, -(days - 1));
  const inWindow = rows.filter((d) => d.date >= from && d.date <= to).sort((a, b) => a.date.localeCompare(b.date));

  const hasCore = (d: DayRow) =>
    d.restingBpm != null || d.steps != null || d.recoveryScore != null;
  const latestRow = [...inWindow].reverse().find(hasCore) ?? null;

  // Trend: second half of the window minus the first half (by calendar position).
  const mid = addDays(from, Math.floor(days / 2));
  const first = inWindow.filter((d) => d.date < mid);
  const second = inWindow.filter((d) => d.date >= mid);
  const trend = (key: NumKey, digits: number) => {
    const a = avg(values(first, key));
    const b = avg(values(second, key));
    return a === null || b === null ? null : round(b - a, digits);
  };

  const steps = values(inWindow, "steps");
  const active = values(inWindow, "activeMinutes");

  return {
    window: { from, to, days, daysWithData: inWindow.length },
    latest: latestRow
      ? {
          date: latestRow.date,
          restingBpm: latestRow.restingBpm ?? null,
          steps: latestRow.steps ?? null,
          recoveryScore: latestRow.recoveryScore ?? null,
        }
      : null,
    averages: {
      restingBpm: r(avg(values(inWindow, "restingBpm"))),
      steps: r(avg(steps), 0),
      recoveryScore: r(avg(values(inWindow, "recoveryScore")), 2),
      hrvMs: r(avg(values(inWindow, "hrvMs"))),
      sleepMinutes: r(avg(values(inWindow, "sleepMinutes")), 0),
    },
    totals: {
      steps: steps.length ? sum(steps) : null,
      activeMinutes: active.length ? sum(active) : null,
    },
    trend: {
      restingBpm: trend("restingBpm", 1),
      steps: trend("steps", 0),
      recoveryScore: trend("recoveryScore", 2),
    },
    gauge: gauge(latestRow?.restingBpm ?? null),
  };
}

export type Interval = "day" | "week" | "month";

function bucketBounds(date: string, interval: Interval): [string, string] {
  if (interval === "day") return [date, date];
  if (interval === "week") {
    const s = weekStart(date);
    return [s, addDays(s, 6)];
  }
  return [monthStart(date), monthEnd(date)];
}

/** Group days into day/week/month buckets; empty buckets are omitted. */
export function aggregate(rows: DayRow[], interval: Interval) {
  const groups = new Map<string, { end: string; rows: DayRow[] }>();
  for (const row of [...rows].sort((a, b) => a.date.localeCompare(b.date))) {
    const [start, end] = bucketBounds(row.date, interval);
    const g = groups.get(start) ?? { end, rows: [] };
    g.rows.push(row);
    groups.set(start, g);
  }

  return [...groups.entries()].map(([start, g]) => {
    const rb = values(g.rows, "restingBpm");
    const st = values(g.rows, "steps");
    let hrMin: number | null = null;
    let hrMax: number | null = null;
    let hrSum = 0;
    let hrCount = 0;
    for (const row of g.rows) {
      const s = row.hrStats;
      if (!s || !s.count) continue;
      if (s.min != null) hrMin = hrMin === null ? s.min : Math.min(hrMin, s.min);
      if (s.max != null) hrMax = hrMax === null ? s.max : Math.max(hrMax, s.max);
      hrSum += s.sum ?? 0;
      hrCount += s.count;
    }
    return {
      start,
      end: g.end,
      days: g.rows.length,
      restingBpm: {
        avg: r(avg(rb)),
        min: rb.length ? Math.min(...rb) : null,
        max: rb.length ? Math.max(...rb) : null,
      },
      steps: { avg: r(avg(st), 0), total: st.length ? sum(st) : null },
      recoveryScore: { avg: r(avg(values(g.rows, "recoveryScore")), 2) },
      heartRate: { min: hrMin, max: hrMax, avg: hrCount ? round(hrSum / hrCount, 1) : null },
    };
  });
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Downsample a heart-rate series into fixed-minute buckets (average per bucket). */
export function downsample(points: HeartPoint[], bucketMinutes: number) {
  const buckets = new Map<number, { sum: number; n: number }>();
  let min: number | null = null;
  let max: number | null = null;
  let total = 0;
  for (const p of points) {
    const key = Math.floor(toMinutes(p.t) / bucketMinutes) * bucketMinutes;
    const b = buckets.get(key) ?? { sum: 0, n: 0 };
    b.sum += p.bpm;
    b.n += 1;
    buckets.set(key, b);
    min = min === null ? p.bpm : Math.min(min, p.bpm);
    max = max === null ? p.bpm : Math.max(max, p.bpm);
    total += p.bpm;
  }
  const out = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([m, b]) => ({ t: toTime(m), bpm: Math.round(b.sum / b.n) }));
  return {
    points: out,
    stats: {
      min,
      max,
      avg: points.length ? round(total / points.length, 1) : null,
      count: points.length,
    },
  };
}
