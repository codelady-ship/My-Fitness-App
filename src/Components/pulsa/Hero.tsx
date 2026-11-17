"use client";
import Link from "next/link";
import BgVideo from "./BgVideo";
import Gauge from "./Gauge";
import LineChart from "./LineChart";
import { HeartIcon } from "./Icons";
import { useCountUp, useParallax } from "./hooks";
import { MEDIA } from "@/lib/site";
import type { PublicStats } from "@/lib/api/types";

const LINES = ["First", "Personal", "Heart", "Coach"];
const AVATAR_BG = ["#ff8a75", "#6f86c6", "#16213a", "#f2a07b"];
const TREND = [38, 38.6, 39.1, 38.9, 40.2, 41, 40.8, 42.1, 43, 44.2];

function Stats() {
  const steps = useCountUp(24, { delay: 900 });
  const recovery = useCountUp(1.32, { delay: 900, decimals: 2 });
  return (
    <dl className="gauge-stats">
      <div>
        <dt>Steps today</dt>
        <dd>{steps}k</dd>
      </div>
      <div>
        <dt>Recovery</dt>
        <dd>{recovery.toFixed(2)}</dd>
      </div>
    </dl>
  );
}

export default function Hero({ stats }: { stats: PublicStats }) {
  const stage = useParallax<HTMLDivElement>();

  return (
    <section className="hero" aria-labelledby="hero-title" ref={stage}>
      <BgVideo {...MEDIA.hero} />
      {/* nav is rendered by the layout above this section; spacer keeps the grid honest */}
      <div className="hero-body">
        <div className="hero-copy">
          <h1 id="hero-title" className="display hero-title">
            {LINES.map((word, i) => (
              <span className="line" key={word}>
                <span style={{ ["--i" as string]: i }} className={word === "Heart" ? "outline" : undefined}>
                  {word}
                </span>
              </span>
            ))}
          </h1>
          <p className="hero-lead">
            Cardio coaching that reads every beat, adapts your plan daily and turns your heart data into real progress.
          </p>
          <div className="hero-cta">
            <Link href="/register" className="btn btn-glass">
              Start Tracking
              <span className="heart-dot">
                <HeartIcon size={14} />
              </span>
            </Link>
            <Link href="/programs" className="btn btn-ghost">
              See programs
            </Link>
          </div>
        </div>

        <div className="hero-stage">
          <div className="px hero-people" style={{ ["--depth" as string]: 4 }}>
            <div className="float" style={{ ["--float-dur" as string]: "6.2s", ["--float-delay" as string]: "-1.4s" }}>
              <div className="pop" style={{ ["--pop-delay" as string]: "0.75s", display: "flex", alignItems: "center", gap: 14 }}>
                <span className="hero-index glass">01</span>
                <div className="avatars glass" aria-label={`${stats.membersLabel.replace("+", "")} people train with Pulsa`} role="img">
                  {stats.initials.map((initials, i) => (
                    <span key={initials + i} style={{ background: AVATAR_BG[i % AVATAR_BG.length] }} aria-hidden="true">
                      {initials}
                    </span>
                  ))}
                  <span className="count" aria-hidden="true">
                    {stats.membersLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px insights" style={{ ["--depth" as string]: 14 }}>
            <div className="float" style={{ ["--float-dur" as string]: "7s" }}>
              <article className="glass-card insights-card pop" style={{ ["--pop-delay" as string]: "0.6s" }} aria-labelledby="ci-title">
                <div className="card-head">
                  <h2 id="ci-title">Cardio Insights</h2>
                  <span className="live-dot">Live</span>
                </div>
                <Gauge value={72} percent={72} label="Resting heart rate 72 bpm; 72% of today's target zone reached" />
                <Stats />
              </article>
            </div>
          </div>

          <div className="px mini-chart" style={{ ["--depth" as string]: 9 }}>
            <div className="float" style={{ ["--float-dur" as string]: "5.2s", ["--float-delay" as string]: "-2.6s" }}>
              <article className="glass mini-chart-card pop" style={{ ["--pop-delay" as string]: "0.85s" }} aria-labelledby="mc-title">
                <div className="card-head">
                  <h2 id="mc-title" style={{ fontSize: 13 }}>
                    Fitness score
                  </h2>
                  <span className="badge badge-coral">+16% · 10 wk</span>
                </div>
                <LineChart values={TREND} width={250} height={70} delay={1.1} label="Fitness score rising from 38 to 44 over ten weeks" />
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
