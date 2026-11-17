"use client";
import Link from "next/link";
import { useState } from "react";
import type { PricingPlan } from "@/lib/api/types";
import { CheckIcon } from "./Icons";

export default function PricingTable({ plans }: { plans: PricingPlan[] }) {
  const [yearly, setYearly] = useState(false);

  return (
    <>
      <div
        className="glass"
        role="group"
        aria-label="Billing period"
        style={{ display: "inline-flex", padding: 5, borderRadius: 999, marginBottom: 26 }}
      >
        {[
          [false, "Monthly"],
          [true, "Yearly · save 20%"],
        ].map(([value, label]) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={yearly === value}
            onClick={() => setYearly(value as boolean)}
            className={`btn btn-sm ${yearly === value ? "btn-ink" : ""}`}
            style={yearly === value ? undefined : { background: "transparent" }}
          >
            {label as string}
          </button>
        ))}
      </div>

      <ul className="grid-cards" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {plans.map((p, i) => {
          const price = yearly ? p.yearly : p.monthly;
          return (
            <li
              key={p.id}
              className={`${p.featured ? "glass-card" : "glass-solid"} lift reveal`}
              style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, position: "relative", ["--i" as string]: i }}
            >
              {p.featured && (
                <span className="badge badge-coral" style={{ position: "absolute", top: 20, right: 20, background: "#fff" }}>
                  Most popular
                </span>
              )}
              <h2 className="display" style={{ margin: 0, fontSize: 30 }}>
                {p.name}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                {p.blurb}
              </p>
              <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="display" style={{ fontSize: 56, textTransform: "none" }}>
                  {price === 0 ? "Free" : `$${price}`}
                </span>
                {price > 0 && <span className="muted">/ {yearly ? "year" : "month"}</span>}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, flex: 1 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--coral)",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      <CheckIcon size={12} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/register?plan=${encodeURIComponent(p.id)}`} className={`btn ${p.featured ? "btn-coral" : "btn-ink"}`}>
                {price === 0 ? "Start free" : `Choose ${p.name}`}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
