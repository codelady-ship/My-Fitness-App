import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/src/Components/pulsa/PageHero";
import { getCoaches } from "@/lib/api";
import { MEDIA, pageMeta } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = pageMeta("/coaches", "Coaches", "Meet the Pulsa cardio coaches: endurance, HIIT, cardiac recovery, cycling, HRV and running specialists who review your heart data and adjust your plan.");

const TINTS = ["#ff8a75", "#6f86c6", "#16213a", "#f2a07b", "#8aa0d6", "#d9442f"];
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function CoachesPage() {
  const { data: coaches, source } = await getCoaches();
  return (
    <>
      <PageHero
        eyebrow="Coaches"
        lines={["Humans who", "read [hearts]"]}
        lead="Certified coaches look at your data every week, answer your questions and change the plan with you, not at you."
        media={MEDIA.coaches}
      />
      <section className="section" aria-label="All coaches">
        <ul className="grid-cards" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {coaches.map((c, i) => (
            <li
              key={c.id}
              className="glass-solid lift reveal"
              style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, ["--i" as string]: i }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    borderRadius: 20,
                    background: `linear-gradient(145deg, ${TINTS[i % TINTS.length]}, ${TINTS[(i + 2) % TINTS.length]})`,
                    color: "#fff",
                    font: "800 22px/1 var(--font-display)",
                    boxShadow: "0 14px 26px -16px rgba(22,33,58,.8)",
                  }}
                >
                  {initials(c.name)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{c.name}</h2>
                  <p className="muted" style={{ margin: "2px 0 0", fontSize: 14 }}>
                    {c.role}
                  </p>
                </div>
              </div>
              {c.specialty && (
                <span className="badge badge-coral" style={{ alignSelf: "flex-start" }}>
                  {c.specialty}
                </span>
              )}
              <p className="muted" style={{ margin: 0, lineHeight: 1.6, flex: 1 }}>
                {c.bio}
              </p>
              <dl style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: 0 }}>
                {[
                  ["Rating", `★ ${c.rating.toFixed(1)}`],
                  ["Years", String(c.years)],
                  ["Reviews", String(c.reviews)],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: "8px 10px", borderRadius: 14, background: "rgba(255,255,255,.55)" }}>
                    <dt className="muted" style={{ fontSize: 12 }}>
                      {k}
                    </dt>
                    <dd style={{ margin: 0, fontWeight: 700 }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        {source === "demo" && (
          <p className="demo-note" style={{ marginTop: 18 }}>
            Showing demo coaches.
          </p>
        )}
        <div
          className="glass-card"
          style={{ marginTop: 28, padding: "26px 28px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}
        >
          <div>
            <h2 className="display" style={{ margin: 0, fontSize: 28 }}>
              Want a coach of your own?
            </h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Coach+ pairs you with one of them and adds weekly check-ins.
            </p>
          </div>
          <Link href="/pricing" className="btn btn-coral">
            See Coach+
          </Link>
        </div>
      </section>
    </>
  );
}
