"use client";
import { useEffect, useState } from "react";
import { useCountUp } from "./hooks";

const TICKS = 30;
const SWEEP = 200; // degrees
const CX = 120;
const CY = 128;
const R_OUT = 106;
const R_IN = 90;

const ticks = Array.from({ length: TICKS }, (_, i) => {
  const deg = 90 + SWEEP / 2 - (i * SWEEP) / (TICKS - 1);
  const a = (deg * Math.PI) / 180;
  const p = (r: number) => [CX + r * Math.cos(a), CY - r * Math.sin(a)].map((n) => +n.toFixed(2));
  const [x1, y1] = p(R_IN);
  const [x2, y2] = p(R_OUT);
  return { x1, y1, x2, y2 };
});

type Props = {
  /** number shown in the centre, counts up */
  value: number;
  /** share of the arc that lights up, 0–100 */
  percent: number;
  unit?: string;
  label: string;
  /** ms before the count-up starts (lets the card pop in first) */
  delay?: number;
};

/** Semicircle gauge: 30 ticks on a 200° arc; ticks light one by one, the value counts up. */
export default function Gauge({ value, percent, unit = "resting bpm", label, delay = 900 }: Props) {
  const [on, setOn] = useState(false);
  const shown = useCountUp(value, { delay });
  const lit = Math.round((Math.max(0, Math.min(100, percent)) / 100) * TICKS);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`gauge${on ? " is-on" : ""}`} role="img" aria-label={label}>
      <svg viewBox="0 0 240 150" aria-hidden="true">
        {ticks.map((t, i) => (
          <line key={i} {...t} className={`tick${i < lit ? " lit" : ""}`} style={{ ["--t" as string]: i }} />
        ))}
      </svg>
      <div className="gauge-value" aria-hidden="true">
        <strong>{shown}</strong>
        <span>{unit}</span>
      </div>
    </div>
  );
}
