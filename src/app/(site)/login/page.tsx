import type { Metadata } from "next";
import PageHero from "@/src/Components/pulsa/PageHero";
import AuthForm from "@/src/Components/pulsa/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Pulsa to see your heart metrics and today's plan.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <>
      <PageHero eyebrow="Welcome back" lines={["Log [in]"]} lead="Your heart data and today's plan are waiting." />
      <section className="section">
        <AuthForm mode="login" />
      </section>
    </>
  );
}
