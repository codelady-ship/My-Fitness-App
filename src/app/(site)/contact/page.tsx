import type { Metadata } from "next";
import PageHero from "@/src/Components/pulsa/PageHero";
import ContactForm from "@/src/Components/pulsa/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about Pulsa programs, coaching or your account? Send us a message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" lines={["Talk to a", "[human]"]} lead="Questions about a program, coaching or your account? We answer within one working day." />
      <section className="section" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", alignItems: "start" }}>
        <ContactForm />
        <aside className="glass-card" style={{ padding: 26 }} aria-label="Other ways to reach us">
          <h2 className="display" style={{ margin: 0, fontSize: 26 }}>
            Other ways
          </h2>
          <dl style={{ display: "grid", gap: 14, margin: "18px 0 0" }}>
            <div>
              <dt className="muted" style={{ fontSize: 13 }}>
                Email
              </dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>hello@pulsa.example</dd>
            </div>
            <div>
              <dt className="muted" style={{ fontSize: 13 }}>
                Coaching hours
              </dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>Mon–Sat, 08:00–20:00 (GMT+4)</dd>
            </div>
            <div>
              <dt className="muted" style={{ fontSize: 13 }}>
                Studio
              </dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>Baku, Azerbaijan</dd>
            </div>
          </dl>
          <p className="muted" style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.6 }}>
            Pulsa is a training tool, not a medical service. In an emergency call your local emergency number.
          </p>
        </aside>
      </section>
    </>
  );
}
