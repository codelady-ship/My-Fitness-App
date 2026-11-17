import type { Metadata } from "next";
import PageHero from "@/src/Components/pulsa/PageHero";
import PricingTable from "@/src/Components/pulsa/PricingTable";
import { getPlans } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pulsa plans: Starter is free, Pulse adds a daily adaptive plan, Coach+ adds a personal cardio coach.",
  alternates: { canonical: "/pricing" },
};

const FAQ = [
  ["Do I need a heart-rate monitor?", "Any watch or chest strap that records heart rate works. Without one you can still log sessions by hand."],
  ["Can I cancel any time?", "Yes. Monthly plans stop at the end of the month; yearly plans can be refunded within 14 days."],
  ["Is Pulsa medical advice?", "No. Pulsa is a training tool. If you have a heart condition, talk to your doctor before starting any program."],
  ["Is there a student discount?", "Yes, 30% off Pulse and Coach+ with a valid student email. Write to us from the contact page."],
];

export default async function PricingPage() {
  const { data: plans, source } = await getPlans();
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        lines={["Simple plans,", "[strong] hearts"]}
        lead="Start free. Upgrade when you want a plan that adapts every day or a coach who knows your numbers."
      />
      <section className="section" aria-label="Plans">
        <PricingTable plans={plans} />
        {source === "demo" && (
          <p className="demo-note" style={{ marginTop: 18 }}>
            Showing demo prices.
          </p>
        )}
      </section>
      <section className="section" aria-labelledby="faq-title">
        <h2 id="faq-title" className="display section-title">
          Questions
        </h2>
        <div style={{ display: "grid", gap: 12, maxWidth: 860 }}>
          {FAQ.map(([q, a]) => (
            <details key={q} className="glass-solid faq" style={{ padding: "18px 22px", borderRadius: 20 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 17 }}>{q}</summary>
              <p className="muted" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
