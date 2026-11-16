"use client";
import React from "react";
import Swal from "sweetalert2";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";
import PageHeader from "../../Components/PageHeader";
import { daysSince } from "../../../lib/utils";
import { ICard } from "../../../Interface/card";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

/** Fixed colours per status, so the chart looks the same on every render. */
const STATUS_COLOURS: Record<ICard["status"], { bg: string; border: string }> = {
  active: { bg: "rgba(34, 197, 94, 0.6)", border: "rgb(22, 163, 74)" },
  passive: { bg: "rgba(245, 158, 11, 0.6)", border: "rgb(217, 119, 6)" },
  expired: { bg: "rgba(239, 68, 68, 0.6)", border: "rgb(220, 38, 38)" },
};

const NEW_MEMBER_DAYS = 30;

const Dashboard = () => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const { cards, ready, resetDemoData } = useDataStore();

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

  const text = darkMode ? "#e5e7eb" : "#374151";
  const grid = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  const chartData = {
    labels: cards.map((c) => c.owner),
    datasets: [
      {
        label: "Remaining visits",
        data: cards.map((c) => c.remainingAccesses),
        backgroundColor: cards.map((c) => STATUS_COLOURS[c.status].bg),
        borderColor: cards.map((c) => STATUS_COLOURS[c.status].border),
        borderWidth: 1,
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
      confirmButtonColor: "#d97706",
      background: darkMode ? "#111827" : "#fff",
      color: darkMode ? "#f9fafb" : "#111827",
    }).then((r) => r.isConfirmed && resetDemoData());
  };

  const panel = darkMode ? "bg-gray-800" : "bg-yellow-50 border border-amber-100";

  return (
    <div>
      <PageHeader title="Dashboard">
        <button
          type="button"
          onClick={onReset}
          className={`rounded-lg border border-amber-600 px-3 py-1.5 text-sm font-semibold ${
            darkMode ? "text-amber-400 hover:bg-gray-800" : "text-amber-700 hover:bg-amber-100"
          }`}
        >
          Reset demo data
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`flex items-center justify-between rounded-xl p-4 shadow-sm ${panel}`}>
            <h2 className="font-semibold">{s.label}</h2>
            <span className="text-3xl font-semibold text-amber-600">{ready ? s.value : "–"}</span>
          </div>
        ))}

        <section className={`col-span-full rounded-xl p-4 shadow-sm ${panel}`}>
          <h2 className="mb-1 text-lg font-semibold">Remaining visits per member</h2>
          <p className={`mb-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Bar colour shows the card status:{" "}
            <span className="font-semibold text-green-600">active</span>,{" "}
            <span className="font-semibold text-amber-600">passive</span>,{" "}
            <span className="font-semibold text-red-600">expired</span>.
          </p>
          <div className="relative h-80 w-full">
            {ready && (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: text }, grid: { color: grid } },
                    y: {
                      beginAtZero: true,
                      ticks: { color: text, precision: 0 },
                      grid: { color: grid },
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
