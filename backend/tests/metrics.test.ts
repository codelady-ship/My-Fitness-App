import { beforeAll, describe, expect, it } from "vitest";
import { addDays, today } from "../src/lib/dates";
import { aggregate, downsample, summarize } from "../src/services/metrics";
import { buildDailyPlan } from "../src/services/plan";
import { api, makeUser } from "./helpers";

type Auth = { Authorization: string };
let me: Auth;
let meId = "";
let other: Auth;
let coach: Auth;

const T = today();
const d = (n: number) => addDays(T, -n);

beforeAll(async () => {
  const u = await makeUser("member", { birthDate: "1996-01-01" });
  me = u.auth;
  meId = u.id;
  other = (await makeUser("member")).auth;
  coach = (await makeUser("coach")).auth;
});

describe("metrics ingest", () => {
  it("PUT upserts one day and merges later updates", async () => {
    const first = await api()
      .put(`/api/v1/metrics/days/${T}`)
      .set(me)
      .send({ restingBpm: 72, steps: 24000, heartRate: [{ t: "06:15", bpm: 80 }, { t: "06:00", bpm: 60 }, { t: "06:15", bpm: 70 }] })
      .expect(200);
    expect(first.body.data).toMatchObject({ date: T, restingBpm: 72, steps: 24000, recoveryScore: null, source: "manual" });
    // sorted, duplicate time keeps the last value, internal stats hidden
    expect(first.body.data.heartRate).toEqual([{ t: "06:00", bpm: 60 }, { t: "06:15", bpm: 70 }]);
    expect(first.body.data).not.toHaveProperty("hrStats");

    const merged = await api().put(`/api/v1/metrics/days/${T}`).set(me).send({ recoveryScore: 1.32 }).expect(200);
    expect(merged.body.data).toMatchObject({ restingBpm: 72, steps: 24000, recoveryScore: 1.32 });
    expect(merged.body.data.heartRate).toHaveLength(2);
    expect(merged.body.data.id).toBe(first.body.data.id);
  });

  it("validates values and dates", async () => {
    const bad = await api().put(`/api/v1/metrics/days/${T}`).set(me).send({ restingBpm: 400, heartRate: [{ t: "25:00", bpm: 60 }] }).expect(400);
    const paths = bad.body.error.details.map((x: { path: string }) => x.path);
    expect(paths).toEqual(expect.arrayContaining(["restingBpm", "heartRate.0.t"]));
    await api().put("/api/v1/metrics/days/2026-02-30").set(me).send({ steps: 1 }).expect(400);
    await api().put(`/api/v1/metrics/days/${T}`).send({ steps: 1 }).expect(401);
  });

  it("POST /batch upserts many days", async () => {
    const days = [1, 2, 3, 4, 5, 6].map((n) => ({
      date: d(n),
      restingBpm: 70 + (n % 3),
      steps: 10000 + n * 100,
      recoveryScore: 1.0,
      heartRate: [{ t: "08:00", bpm: 90 + n }, { t: "18:00", bpm: 150 + n }],
    }));
    const res = await api().post("/api/v1/metrics/batch").set(me).send({ days }).expect(200);
    expect(res.body.data.upserted).toBe(6);
    const dup = await api().post("/api/v1/metrics/batch").set(me).send({ days: [{ date: T }, { date: T }] }).expect(400);
    expect(dup.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("metrics queries", () => {
  it("lists days newest first without series unless asked", async () => {
    const res = await api().get("/api/v1/metrics/days?limit=3").set(me).expect(200);
    expect(res.body.meta).toMatchObject({ total: 7, limit: 3, totalPages: 3 });
    expect(res.body.data.map((x: { date: string }) => x.date)).toEqual([T, d(1), d(2)]);
    expect(res.body.data[0]).not.toHaveProperty("heartRate");
    const withSeries = await api().get(`/api/v1/metrics/days?from=${T}&to=${T}&includeSeries=true`).set(me).expect(200);
    expect(withSeries.body.data[0].heartRate).toHaveLength(2);
    await api().get(`/api/v1/metrics/days?from=${T}&to=${d(1)}`).set(me).expect(400);
  });

  it("isolates users; coaches may read with ?userId", async () => {
    const mine = await api().get("/api/v1/metrics/days").set(other).expect(200);
    expect(mine.body.meta.total).toBe(0);
    await api().get(`/api/v1/metrics/days?userId=${meId}`).set(other).expect(403);
    const asCoach = await api().get(`/api/v1/metrics/summary?userId=${meId}`).set(coach).expect(200);
    expect(asCoach.body.data.latest.restingBpm).toBe(72);
  });

  it("summary feeds the gauge", async () => {
    const res = await api().get("/api/v1/metrics/summary?days=7").set(me).expect(200);
    const s = res.body.data;
    expect(s.window).toEqual({ from: d(6), to: T, days: 7, daysWithData: 7 });
    expect(s.latest).toEqual({ date: T, restingBpm: 72, steps: 24000, recoveryScore: 1.32 });
    expect(s.gauge).toEqual({ value: 72, min: 0, max: 100, fraction: 0.72, ticks: 30, litTicks: 22, unit: "bpm" });
    // steps: 24000 + 10100..10600
    expect(s.totals.steps).toBe(24000 + 10100 + 10200 + 10300 + 10400 + 10500 + 10600);
    expect(s.averages.recoveryScore).toBe(1.05);
  });

  it("summary for a user without data is all nulls, not 404", async () => {
    const res = await api().get("/api/v1/metrics/summary").set(other).expect(200);
    expect(res.body.data.latest).toBeNull();
    expect(res.body.data.window.daysWithData).toBe(0);
    expect(res.body.data.gauge).toMatchObject({ value: null, fraction: null, litTicks: 0 });
  });

  it("aggregate by day and week", async () => {
    const byDay = await api().get(`/api/v1/metrics/aggregate?from=${d(6)}&to=${T}`).set(me).expect(200);
    expect(byDay.body.data.buckets).toHaveLength(7);
    const lastDay = byDay.body.data.buckets.at(-1);
    expect(lastDay).toMatchObject({ start: T, end: T, days: 1, restingBpm: { avg: 72, min: 72, max: 72 }, heartRate: { min: 60, max: 70, avg: 65 } });

    const byWeek = await api().get(`/api/v1/metrics/aggregate?from=${d(6)}&to=${T}&interval=week`).set(me).expect(200);
    const weeks = byWeek.body.data.buckets;
    expect(weeks.reduce((a: number, b: { days: number }) => a + b.days, 0)).toBe(7);
    for (const w of weeks) expect(new Date(`${w.start}T00:00:00Z`).getUTCDay()).toBe(1); // Monday
    await api().get(`/api/v1/metrics/aggregate?from=2020-01-01&to=${T}`).set(me).expect(400);
  });

  it("series downsamples into buckets", async () => {
    const res = await api().get(`/api/v1/metrics/series?date=${T}&bucket=30`).set(me).expect(200);
    expect(res.body.data).toEqual({
      date: T,
      bucketMinutes: 30,
      points: [{ t: "06:00", bpm: 65 }],
      stats: { min: 60, max: 70, avg: 65, count: 2 },
    });
    const empty = await api().get(`/api/v1/metrics/series?date=${d(40)}`).set(me).expect(200);
    expect(empty.body.data.points).toEqual([]);
    expect(empty.body.data.stats.min).toBeNull();
  });

  it("deletes a day", async () => {
    await api().delete(`/api/v1/metrics/days/${d(6)}`).set(me).expect(204);
    await api().get(`/api/v1/metrics/days/${d(6)}`).set(me).expect(404);
  });

  it("plan/today adapts to the metrics", async () => {
    const res = await api().get("/api/v1/plan/today").set(me).expect(200);
    const p = res.body.data;
    expect(p.date).toBe(T);
    expect(["rest", "easy", "moderate", "hard"]).toContain(p.intensity);
    expect(p.basedOn.restingBpm).toBe(72);
    expect(p.basedOn.maxHr).toBe(220 - (Number(T.slice(0, 4)) - 1996));
    expect(p.targetZone.minBpm).toBeLessThan(p.targetZone.maxBpm);
    expect(p.sessions.length).toBeGreaterThan(0);
    const fresh = await api().get("/api/v1/plan/today").set(other).expect(200);
    expect(fresh.body.data).toMatchObject({ intensity: "easy", stepsGoal: 8000 });
  });
});

describe("metric services (unit)", () => {
  const rows = [
    { date: "2026-11-09", restingBpm: 70, steps: 10000, recoveryScore: 1, hrStats: { min: 50, max: 150, sum: 300, count: 3 } },
    { date: "2026-11-10", restingBpm: 74, steps: 12000, recoveryScore: 1.2, hrStats: { min: 55, max: 160, sum: 200, count: 2 } },
    { date: "2026-11-16", restingBpm: 68, steps: 8000, recoveryScore: 0.9 },
  ];

  it("aggregate groups by Monday weeks and merges heart-rate stats", () => {
    const weeks = aggregate(rows, "week");
    expect(weeks.map((w) => [w.start, w.end, w.days])).toEqual([
      ["2026-11-09", "2026-11-15", 2],
      ["2026-11-16", "2026-11-22", 1],
    ]);
    expect(weeks[0]!.heartRate).toEqual({ min: 50, max: 160, avg: 100 });
    expect(weeks[0]!.steps).toEqual({ avg: 11000, total: 22000 });
    expect(aggregate(rows, "month")[0]).toMatchObject({ start: "2026-11-01", end: "2026-11-30", days: 3 });
  });

  it("summarize computes trend second half minus first half", () => {
    const s = summarize(rows, "2026-11-16", 8);
    expect(s.window.from).toBe("2026-11-09");
    expect(s.trend.restingBpm).toBe(68 - 72);
  });

  it("downsample averages per bucket", () => {
    const out = downsample([{ t: "00:00", bpm: 60 }, { t: "00:10", bpm: 70 }, { t: "00:20", bpm: 90 }], 15);
    expect(out.points).toEqual([{ t: "00:00", bpm: 65 }, { t: "00:15", bpm: 90 }]);
  });

  it("plan rules pick intensity", () => {
    const base = Array.from({ length: 6 }, (_, i) => ({ date: `2026-11-0${i + 1}`, restingBpm: 60, steps: 10000, recoveryScore: 1 }));
    const plan = (latest: { restingBpm: number; recoveryScore: number }) =>
      buildDailyPlan({ date: "2026-11-07", history: [...base, { date: "2026-11-07", steps: 10000, ...latest }], birthDate: "1996-11-07" }).intensity;
    expect(plan({ restingBpm: 60, recoveryScore: 0.7 })).toBe("rest");
    expect(plan({ restingBpm: 70, recoveryScore: 1 })).toBe("rest"); // ≥ baseline + 7
    expect(plan({ restingBpm: 60, recoveryScore: 0.9 })).toBe("easy");
    expect(plan({ restingBpm: 60, recoveryScore: 1.3 })).toBe("hard");
    expect(plan({ restingBpm: 60, recoveryScore: 1.05 })).toBe("moderate");
    const p = buildDailyPlan({ date: "2026-11-07", history: base, birthDate: "1996-11-07" });
    expect(p.basedOn.maxHr).toBe(190);
    expect(p.targetZone).toMatchObject({ minBpm: 133, maxBpm: 152 });
    expect(p.stepsGoal).toBe(10500);
  });
});
