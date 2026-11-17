import type { Metadata } from "next";
import PageHero from "@/src/Components/pulsa/PageHero";
import AuthForm from "@/src/Components/pulsa/AuthForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Pulsa account and start tracking your heart.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <>
      <PageHero eyebrow="Start tracking" lines={["Join [Pulsa]"]} lead="Free to start. Connect a watch later; your first plan is ready in a minute." />
      <section className="section">
        <AuthForm mode="register" />
      </section>
    </>
  );
}
