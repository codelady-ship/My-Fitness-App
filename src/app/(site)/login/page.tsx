import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import PageHero from "@/src/Components/pulsa/PageHero";
import AuthForm from "@/src/Components/pulsa/AuthForm";

export const metadata: Metadata = pageMeta("/login", "Log in", "Log in to Pulsa to see your heart-rate zones, recovery trends and today's adaptive cardio plan, built from the data your watch or chest strap records.");

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
