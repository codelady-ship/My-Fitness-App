import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/src/Components/pulsa/Hero";
import { ArrowIcon } from "@/src/Components/pulsa/Icons";
import { getPublicStats } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FEATURES = [
  { n: "01", title: "Reads every beat", text: "Connect a watch or chest strap. Pulsa turns raw heart rate into zones, recovery and trends you can understand." },
  { n: "02", title: "Adapts daily", text: "Slept badly? Resting HR up? Your plan for today changes before you lace up, not after you are exhausted." },
  { n: "03", title: "Real coaches", text: "Certified cardio coaches review your week, answer questions and adjust the program with you." },
];

export default async function Home() {
  const { data: stats } = await getPublicStats();
  return (
    <>
      <Hero stats={stats} />
      <section className="section" aria-labelledby="how-title" style={{ paddingTop: "clamp(40px, 6vw, 90px)" }}>
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" className="display section-title">
          Your heart, <span style={{ color: "var(--coral-ink)" }}>decoded</span>
        </h2>
        <div className="grid-cards">
          {FEATURES.map((f, i) => (
            <article key={f.n} className="glass-solid lift reveal" style={{ padding: 26, ["--i" as string]: i }}>
              <span className="badge badge-coral">{f.n}</span>
              <h3 style={{ margin: "16px 0 8px", fontSize: 21, fontWeight: 700 }}>{f.title}</h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                {f.text}
              </p>
            </article>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <Link href="/pricing" className="btn btn-coral">
            See pricing <ArrowIcon />
          </Link>
          <Link href="/coaches" className="btn btn-ghost">
            Meet the coaches
          </Link>
        </div>
      </section>
    </>
  );
}
