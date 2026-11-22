"use client";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import useDataStore from "@/Store/DataStore";
import PageHeader from "@/src/Components/PageHeader";
import Gauge from "@/src/Components/pulsa/Gauge";
import LineChart from "@/src/Components/pulsa/LineChart";
import { CheckIcon } from "@/src/Components/pulsa/Icons";
import ConfirmDialog from "@/src/Components/admin/ConfirmDialog";
import StatusBadge from "@/src/Components/admin/StatusBadge";
import { Badge } from "@/src/Components/ui/badge";
import { Button } from "@/src/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/Components/ui/card";
import { Skeleton } from "@/src/Components/ui/skeleton";
import { cn } from "@/lib/cn";
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
  const [resetOpen, setResetOpen] = useState(false);

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


  const history = metrics.history;
  const first = history[0]?.bpm ?? metrics.restingBpm;
  const last = history[history.length - 1]?.bpm ?? metrics.restingBpm;
  const doneCount = plan.filter((p) => p.done).length;
  const firstName = session?.user.name.split(" ")[0];
  // Members only see their own heart data; gym admin widgets are for coaches/admins (and demo visitors).
  const showAdmin = !session || session.user.role !== "member";


  const metric = "rounded-xl bg-muted px-3.5 py-2.5";
  const metricLabel = "text-xs text-muted-foreground";
  const metricValue = "mt-0.5 font-heading text-lg leading-tight font-bold tabular-nums";

  return (
    <div>
      <PageHeader title={firstName ? `Hi, ${firstName}` : "Overview"}>
        {dataSource === "demo" && showAdmin && (
          <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ---- heart metrics ---- */}
        <Card className="xl:col-span-4" role="region" aria-labelledby="hr-title">
          <CardHeader>
            <CardTitle id="hr-title">Cardio Insights</CardTitle>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground before:size-1.5 before:rounded-full before:bg-primary">
              {metricsSource === "api" ? "Live" : metricsSource === "loading" ? "Loading" : "Demo"}
            </span>
          </CardHeader>
          <CardContent>
            {metricsSource === "loading" ? (
              <div aria-busy="true" aria-label="Loading heart metrics" className="grid gap-3">
                <Skeleton className="h-40" />
                <Skeleton className="h-14" />
              </div>
            ) : (
              <>
                <div className="mx-auto max-w-80">
                  <Gauge
                    key={metrics.restingBpm + "-" + metrics.zoneScore}
                    value={metrics.restingBpm}
                    percent={metrics.zoneScore}
                    delay={300}
                    label={`Resting heart rate ${metrics.restingBpm} bpm; ${metrics.zoneScore}% of today's target zone reached`}
                  />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className={metric}>
                    <dt className={metricLabel}>Steps today</dt>
                    <dd className={metricValue}>{(metrics.steps / 1000).toFixed(metrics.steps >= 10000 ? 0 : 1)}k</dd>
                  </div>
                  <div className={metric}>
                    <dt className={metricLabel}>Recovery</dt>
                    <dd className={metricValue}>{metrics.recovery.toFixed(2)}</dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-8" role="region" aria-labelledby="trend-title">
          <CardHeader>
            <CardTitle id="trend-title">Resting heart rate · last {history.length} days</CardTitle>
            <Badge variant={last < first ? "coral" : "default"}>
              {last === first ? "Steady" : `${last < first ? "▼" : "▲"} ${Math.abs(first - last)} bpm`}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {metricsSource === "loading" ? (
              <Skeleton aria-busy="true" aria-label="Loading trend" className="h-52" />
            ) : (
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
            )}
            <dl className="mt-auto grid grid-cols-3 gap-2.5 pt-4">
              <div className={metric}>
                <dt className={metricLabel}>HRV</dt>
                <dd className={metricValue}>{metrics.hrv} ms</dd>
              </div>
              <div className={metric}>
                <dt className={metricLabel}>Sleep</dt>
                <dd className={metricValue}>
                  {Math.floor(metrics.sleepMinutes / 60)}h {metrics.sleepMinutes % 60}m
                </dd>
              </div>
              <div className={metric}>
                <dt className={metricLabel}>Zone score</dt>
                <dd className={metricValue}>{metrics.zoneScore}%</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* ---- daily plan ---- */}
        <Card className={showAdmin ? "xl:col-span-5" : "xl:col-span-12"} role="region" aria-labelledby="plan-title">
          <CardHeader>
            <CardTitle id="plan-title">Today&apos;s plan</CardTitle>
            <Badge>
              {doneCount}/{plan.length} done
            </Badge>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <Skeleton className="h-12" />
            ) : (
              <>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <strong className="font-heading text-[22px] leading-none font-extrabold tracking-[-0.02em] uppercase">{day.headline}</strong>
                  <Badge variant="coral" className="capitalize">
                    {day.intensity}
                  </Badge>
                </p>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
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
            <ul className="mt-4 grid gap-2" aria-busy={planLoading}>
              {planLoading &&
                [0, 1, 2].map((i) => (
                  <li key={i}>
                    <Skeleton className="h-14" />
                  </li>
                ))}
              {!planLoading &&
                plan.map((p) => (
                  <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border py-1 pr-3 pl-1">
                    {/* 44px tap area around a 26px tick */}
                    <button
                      type="button"
                      className="group grid size-11 cursor-pointer place-items-center rounded-full"
                      aria-pressed={p.done}
                      onClick={() => toggle(p)}
                      aria-label={`Mark "${p.title}" as ${p.done ? "not done" : "done"}`}
                    >
                      <span
                        className={cn(
                          "grid size-[26px] place-items-center rounded-full border-2 text-white transition-colors",
                          p.done ? "border-foreground bg-foreground" : "border-[#8891a4] bg-background group-hover:border-foreground",
                        )}
                      >
                        {p.done && <CheckIcon size={13} />}
                      </span>
                    </button>
                    <div className="min-w-0">
                      <div className={cn("text-sm font-semibold", p.done && "text-muted-foreground line-through")}>{p.title}</div>
                      <div className="text-[13px] text-muted-foreground">
                        {p.minutes} min in zone {p.zone}
                      </div>
                    </div>
                    <Badge variant="coral" title={`Heart-rate zone ${p.zone}`}>
                      Z{p.zone} · {p.minutes}′
                    </Badge>
                  </li>
                ))}
            </ul>
            {!planLoading && day.reasons.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-[13px] leading-relaxed text-muted-foreground">
                {day.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ---- gym overview: coaches, admins and demo visitors only ---- */}
        {showAdmin && (
          <>
            <section className="grid grid-cols-2 gap-4 xl:col-span-7" aria-labelledby="gym-title">
              <h2 id="gym-title" className="sr-only">
                Gym overview
              </h2>
              {stats.map((s) => (
                <Card key={s.label} className="justify-between gap-3 px-5">
                  <span className="text-[13px] leading-snug text-muted-foreground">{s.label}</span>
                  <span className="font-heading text-4xl leading-none font-extrabold tracking-[-0.04em] tabular-nums">{ready ? s.value : "–"}</span>
                </Card>
              ))}
            </section>

            <Card className="xl:col-span-12" role="region" aria-labelledby="visits-title">
              <CardHeader>
                <CardTitle id="visits-title" className="flex flex-wrap items-center gap-2">
                  Remaining visits per member {dataSource === "demo" && <Badge>Demo gym data</Badge>}
                </CardTitle>
                <span className="flex flex-wrap gap-2">
                  <StatusBadge tone="active">active</StatusBadge>
                  <StatusBadge tone="passive">passive</StatusBadge>
                  <StatusBadge tone="expired">expired</StatusBadge>
                </span>
              </CardHeader>
              <CardContent>
                <div className="relative h-72 w-full sm:h-80">
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
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="Members and staff go back to the original demo list. Your changes in this browser are removed."
        confirmLabel="Reset"
        onConfirm={resetDemoData}
      />
    </div>
  );
};

export default Dashboard;
