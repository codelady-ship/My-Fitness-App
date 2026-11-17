import { Schema, model } from "mongoose";

const pointSchema = new Schema(
  { t: { type: String, required: true }, bpm: { type: Number, required: true } },
  { _id: false },
);

const metricDaySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    restingBpm: { type: Number, default: null },
    steps: { type: Number, default: null },
    recoveryScore: { type: Number, default: null },
    hrvMs: { type: Number, default: null },
    sleepMinutes: { type: Number, default: null },
    activeMinutes: { type: Number, default: null },
    heartRate: { type: [pointSchema], default: [] },
    // Pre-computed from heartRate so range aggregates never load the series.
    hrStats: {
      type: new Schema(
        { min: Number, max: Number, sum: Number, count: Number },
        { _id: false },
      ),
      default: () => ({ min: null, max: null, sum: 0, count: 0 }),
    },
    source: { type: String, enum: ["manual", "device", "seed"], default: "manual" },
  },
  { timestamps: true },
);

metricDaySchema.index({ userId: 1, date: -1 }, { unique: true });

metricDaySchema.set("toJSON", {
  versionKey: false,
  transform: (_d, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.hrStats;
    return ret;
  },
});

export type HeartPoint = { t: string; bpm: number };
export type HrStats = { min: number | null; max: number | null; sum: number; count: number };

/** Sort by time, keep the last value for duplicate times, compute stats. */
export function normalizeSeries(points: HeartPoint[]): { heartRate: HeartPoint[]; hrStats: HrStats } {
  const byTime = new Map<string, number>();
  for (const p of points) byTime.set(p.t, p.bpm);
  const heartRate = [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, bpm]) => ({ t, bpm }));
  let min: number | null = null;
  let max: number | null = null;
  let sum = 0;
  for (const p of heartRate) {
    min = min === null ? p.bpm : Math.min(min, p.bpm);
    max = max === null ? p.bpm : Math.max(max, p.bpm);
    sum += p.bpm;
  }
  return { heartRate, hrStats: { min, max, sum, count: heartRate.length } };
}

export const MetricDay = model("MetricDay", metricDaySchema);
