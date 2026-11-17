"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import useDataStore from "@/Store/DataStore";
import PageHeader from "@/src/Components/PageHeader";
import Gauge from "@/src/Components/pulsa/Gauge";
import LineChart from "@/src/Components/pulsa/LineChart";
import { CheckIcon } from "@/src/Components/pulsa/Icons";
import { useSession } from "@/src/Components/pulsa/useSession";
import { daysSince, formatDate } from "@/lib/utils";
import { ICard } from "@/Interface/card";
import { API_URL, getHeartMetrics, getTodayPlan, loadSession, type DailyPlan, type HeartMetrics, type PlanItem } from "@/lib/api";
import { makeSeedMetrics, makeSeedPlan } from "@/lib/api/seed";
import { COOL_DOWN_MS } from "@/lib/api/client";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

/** Fixed colours per status, so the chart looks the same on every render. */
const STATUS_COLOURS: Record<ICard["status"], { bg: string; border: string }> = {
  active: { bg: "rgba(255, 106, 85, 0.75)", border: "#ff6a55" },
  passive: { bg: "rgba(111, 134, 198, 0.6)", border: "#6f86c6" },
  expired: { bg: "rgba(22, 33, 58, 0.35)", border: "rgba(22, 33, 58, 0.6)" },
};

const NEW_MEMBER_DAYS = 30;
const PLAN_KEY = "pulsa-plan-done";

const Dashboard = () => {
  const { cards, ready, resetDemoData, source: dataSource } = useDataStore();
  const { session } = useSession();
  const [metrics, setMetrics] = useState<HeartMetrics>(() => makeSeedMetrics());
  const [day, setDay] = useState<DailyPlan>(() => makeSeedPlan());
  const [plan, setPlan] = useState<PlanItem[]>(() => makeSeedPlan().items);
  const [metricsSource, setMetricsSource] = useState<"api" | "demo" | "loading">("loading");
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let retry = 0;
    const load = (attempt: number) => {
      getHeartMetrics().then((r) => {
        if (!alive) return;
        setMetrics(r.data);
        setMetricsSource(r.source);
        // A free-tier API may be cold-starting (30–60 s): try once more after the cool-down.
        const s = loadSession();
        if (r.source === "demo" && attempt === 0 && API_URL && s && !s.demo) {
          retry = window.setTimeout(() => load(1), COOL_DOWN_MS + 2000);
        }
      });
      loadPlan();
    };
    const loadPlan = () =>
      getTodayPlan().then((r) => {
        if (!alive) return;
        // Ticks done offline are remembered for today in this browser.
        let local: Record<string, boolean> = {};
        try {
          const saved = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "{}");
          if (saved.day === new Date().toDateString()) local = saved.done ?? {};
        } catch {
          /* ignore */
        }
        setDay(r.data);
        setPlan(r.data.items.map((p) => (p.id in local ? { ...p, done: local[p.id] } : p)));
        setPlanLoading(false);
      });
    load(0);
    return () => {
      alive = false;
      clearTimeout(retry);
    };
  }, []);

  const toggle = (item: PlanItem) => {
    const done = !item.done;
    setPlan((items) => {
      const next = items.map((p) => (p.id === item.id ? { ...p, done } : p));
      try {
        localStorage.setItem(
          PLAN_KEY,
          JSON.stringify({ day: new Date().toDateString(), done: Object.fromEntries(next.map((p) => [p.id, p.done])) }),
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const activeCount = cards.filter((c) => c.status === "active").length;
  // Members whose registration date is within the last 30 days, counted from today.
  const newRegistrations = cards.filter((c) => {
    const d = daysSince(c.createdAt);
    return d >= 0 && d <= NEW_MEMBER_DAYS;
  }).length;
  const expiringSoon = cards.filter((c) => {
    const d = -daysSince(c.endDate);
    return c.status !== "expired" && d >= 0 && d <= 7;
  }).length;

  const text = "rgba(22, 33, 58, 0.62)";
  const grid = "rgba(22, 33, 58, 0.07)";

  const chartData = {
    labels: cards.map((c) => c.owner.split(" ")[0]),
    datasets: [
      {
        label: "Remaining visits",
        data: cards.map((c) => c.remainingAccesses),
        backgroundColor: cards.map((c) => STATUS_COLOURS[c.status].bg),
        borderColor: cards.map((c) => STATUS_COLOURS[c.status].border),
        borderWidth: 1,
        borderRadius: 10,
        borderSkipped: false as const,
        maxBarThickness: 38,
      },
    ],
  };

  const stats = [
    { label: "Total members", value: cards.length },
    { label: "Active members", value: activeCount },
    { label: `New in last ${NEW_MEMBER_DAYS} days`, value: newRegistrations },
    { label: "Cards ending in 7 days", value: expiringSoon },
  ];

  const onReset = () => {
    Swal.fire({
      title: "Reset demo data?",
      text: "Members and staff go back to the original demo list. Your changes in this browser are removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reset",
      confirmButtonColor: "#ff6a55",
    }).then((r) => r.isConfirmed && resetDemoData());
  };

  const history = metrics.history;
  const first = history[0]?.bpm ?? metrics.restingBpm;
  const last = history[history.length - 1]?.bpm ?? metrics.restingBpm;
  const doneCount = plan.filter((p) => p.done).length;
  const firstName = session?.user.name.split(" ")[0];

  return (
    <div>
      <PageHeader title={firstName ? `Hi, ${firstName}` : "Overview"}>
        {dataSource === "demo" && (
          <button type="button" onClick={onReset} className="btn btn-ghost btn-sm">
            Reset demo data
          </button>
        )}
      </PageHeader>

      <div className="dash-grid">
        {/* ---- heart metrics ---- */}
        <section className="glass-card panel span-4 pop" style={{ ["--pop-delay" as string]: "0.05s" }} aria-labelledby="hr-title">
          <div className="card-head">
            <h2 id="hr-title">Cardio Insights</h2>
            <span className="live-dot">{metricsSource === "api" ? "Live" : metricsSource === "loading" ? "Loading" : "Demo"}</span>
          </div>
          {metricsSource === "loading" ? (
            <div aria-busy="true" aria-label="Loading heart metrics" style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <span className="skeleton" style={{ height: 150 }} />
              <span className="skeleton" style={{ height: 54 }} />
            </div>
          ) : (
            <>
              <Gauge
                key={metrics.restingBpm + "-" + metrics.zoneScore}
                value={metrics.restingBpm}
                percent={metrics.zoneScore}
                delay={300}
                label={`Resting heart rate ${metrics.restingBpm} bpm; ${metrics.zoneScore}% of today's target zone reached`}
              />
              <dl className="gauge-stats">
                <div>
                  <dt>Steps today</dt>
                  <dd>{(metrics.steps / 1000).toFixed(metrics.steps >= 10000 ? 0 : 1)}k</dd>
                </div>
                <div>
                  <dt>Recovery</dt>
                  <dd>{metrics.recovery.toFixed(2)}</dd>
                </div>
              </dl>
            </>
          )}
        </section>

        <section className="glass panel span-8 pop" style={{ ["--pop-delay" as string]: "0.12s" }} aria-labelledby="trend-title">
          <div className="card-head" style={{ flexWrap: "wrap" }}>
            <h2 id="trend-title">Resting heart rate · last {history.length} days</h2>
            <span className={`badge ${last < first ? "badge-coral" : ""}`}>
              {last === first ? "Steady" : `${last < first ? "▼" : "▲"} ${Math.abs(first - last)} bpm`}
            </span>
          </div>
          {metricsSource === "loading" ? (
            <span className="skeleton" aria-busy="true" aria-label="Loading trend" style={{ height: 200, marginTop: 14 }} />
          ) : (
            <div style={{ marginTop: 14 }}>
              <LineChart
                key={history.map((h) => h.bpm).join(",")}
                values={history.map((h) => h.bpm)}
                width={640}
                height={180}
                delay={0.35}
                strokeWidth={3.5}
                label={`Resting heart rate went from ${first} to ${last} bpm between ${formatDate(history[0]?.date ?? "")} and ${formatDate(
                  history[history.length - 1]?.date ?? "",
                )}`}
              />
            </div>
          )}
          <dl className="gauge-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div>
              <dt>HRV</dt>
              <dd>{metrics.hrv} ms</dd>
            </div>
            <div>
              <dt>Sleep</dt>
              <dd>
                {Math.floor(metrics.sleepMinutes / 60)}h {metrics.sleepMinutes % 60}m
              </dd>
            </div>
            <div>
              <dt>Zone score</dt>
              <dd>{metrics.zoneScore}%</dd>
            </div>
          </dl>
        </section>

        {/* ---- daily plan ---- */}
        <section className="glass panel span-5 pop" style={{ ["--pop-delay" as string]: "0.18s" }} aria-labelledby="plan-title">
          <div className="card-head">
            <h2 id="plan-title">Today&apos;s plan</h2>
            <span className="badge">
              {doneCount}/{plan.length} done
            </span>
          </div>
          {planLoading ? (
            <span className="skeleton" style={{ height: 48, marginTop: 10 }} />
          ) : (
            <>
              <p style={{ margin: "10px 0 0", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
                <strong className="display" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>
                  {day.headline}
                </strong>
                <span className="badge badge-coral" style={{ textTransform: "capitalize" }}>
                  {day.intensity}
                </span>
              </p>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                {[
                  day.target,
                  day.durationMinutes ? `${day.durationMinutes} min` : "",
                  day.stepsGoal ? `${day.stepsGoal.toLocaleString("en-US")} steps goal` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </>
          )}
          <ul className="plan-list" aria-busy={planLoading}>
            {planLoading && [0, 1, 2].map((i) => <li key={i} className="skeleton" style={{ height: 54 }} />)}
            {!planLoading &&
              plan.map((p) => (
                <li key={p.id} className={`plan-item${p.done ? " done" : ""}`}>
                  <button
                    type="button"
                    className="check"
                    aria-pressed={p.done}
                    onClick={() => toggle(p)}
                    aria-label={`Mark "${p.title}" as ${p.done ? "not done" : "done"}`}
                  >
                    {p.done && <CheckIcon size={14} />}
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div className="title" style={{ fontWeight: 600 }}>
                      {p.title}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {p.minutes} min in zone {p.zone}
                    </div>
                  </div>
                  <span className="badge badge-coral" title={`Heart-rate zone ${p.zone}`}>
                    Z{p.zone} · {p.minutes}′
                  </span>
                </li>
              ))}
          </ul>
          {!planLoading && day.reasons.length > 0 && (
            <ul className="muted" style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              {day.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- gym overview ---- */}
        <section
          className="span-7"
          aria-labelledby="gym-title"
          style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignContent: "start" }}
        >
          <h2 id="gym-title" className="sr-only">
            Gym overview
          </h2>
          {stats.map((s, i) => (
            <div key={s.label} className="glass panel stat lift pop" style={{ ["--pop-delay" as string]: `${0.22 + i * 0.05}s` }}>
              <span className="label">{s.label}</span>
              <span className="value">{ready ? s.value : "–"}</span>
            </div>
          ))}
        </section>

        <section className="glass panel span-12 pop" style={{ ["--pop-delay" as string]: "0.4s" }} aria-labelledby="visits-title">
          <div className="card-head" style={{ flexWrap: "wrap" }}>
            <h2 id="visits-title">Remaining visits per member</h2>
            <span className="muted" style={{ fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span className="status status-active">active</span>
              <span className="status status-passive">passive</span>
              <span className="status status-expired">expired</span>
            </span>
          </div>
          <div className="relative h-80 w-full" style={{ marginTop: 12 }}>
            {ready && (
              <Bar
                data={chartData}
                aria-label="Bar chart of remaining visits per member, coloured by card status"
                role="img"
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: "#16213a", padding: 10, cornerRadius: 12, displayColors: false },
                  },
                  scales: {
                    x: { ticks: { color: text, font: { family: "Inter" } }, grid: { display: false } },
                    y: {
                      beginAtZero: true,
                      ticks: { color: text, precision: 0 },
                      grid: { color: grid },
                      border: { display: false },
                      title: { display: true, text: "Remaining visits", color: text },
                    },
                  },
                }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
