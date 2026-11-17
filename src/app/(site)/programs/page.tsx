import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/src/Components/pulsa/PageHero";
import { getPrograms } from "@/lib/api";
import { MEDIA, pageMeta } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = pageMeta("/programs", "Programs", "Heart-rate based cardio programs: Zone 2 base, HIIT intervals, recovery, half marathon prep, cycling threshold and HRV training, each with target zones.");

const ZONE_NAMES = ["", "Recovery", "Aerobic", "Tempo", "Threshold", "VO₂ max"];

export default async function ProgramsPage() {
  const { data: programs, source } = await getPrograms();
  return (
    <>
      <PageHero
        eyebrow="Programs"
        lines={["Train by", "[heart], not", "by guess"]}
        lead="Every program is built around heart-rate zones and adapts to your recovery each morning. Pick a goal; Pulsa handles the pacing."
        media={MEDIA.programs}
      />
      <section className="section" aria-label="All programs">
        <ul className="grid-cards" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {programs.map((p, i) => (
            <li
              key={p.id}
              className="glass-solid lift reveal"
              style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, ["--i" as string]: i }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span className="badge">{p.level}</span>
                <span className="badge badge-coral">
                  Zone {p.zone} · {ZONE_NAMES[p.zone] ?? ""}
                </span>
              </div>
              <h2 className="display" style={{ margin: 0, fontSize: 28, lineHeight: 1 }}>
                {p.title}
              </h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6, flex: 1 }}>
                {p.summary}
              </p>
              <div className="zone-bar" role="img" aria-label={`Intensity: zone ${p.zone} of 5`}>
                {[1, 2, 3, 4, 5].map((z) => (
                  <span key={z} className={z <= p.zone ? "on" : ""} />
                ))}
              </div>
              <dl style={{ display: "flex", gap: 24, margin: 0, fontSize: 14 }}>
                <div>
                  <dt className="muted">Length</dt>
                  <dd style={{ margin: 0, fontWeight: 700 }}>{p.weeks} weeks</dd>
                </div>
                <div>
                  <dt className="muted">Sessions</dt>
                  <dd style={{ margin: 0, fontWeight: 700 }}>{p.sessionsPerWeek} / week</dd>
                </div>
              </dl>
              {p.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.tags.map((t) => (
                    <span key={t} className="badge">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/register?program=${encodeURIComponent(p.id)}`}
                className="btn btn-ink btn-sm"
                style={{ alignSelf: "flex-start" }}
              >
                Start {p.title}
                <span className="sr-only"> program</span>
              </Link>
            </li>
          ))}
        </ul>
        {source === "demo" && (
          <p className="demo-note" style={{ marginTop: 18 }}>
            Showing demo programs.
          </p>
        )}
      </section>
    </>
  );
}
