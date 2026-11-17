import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import PageHero from "@/src/Components/pulsa/PageHero";
import AuthForm from "@/src/Components/pulsa/AuthForm";

export const metadata: Metadata = pageMeta("/register", "Create account", "Create a free Pulsa account, connect a watch or chest strap and start tracking heart-rate zones, recovery and progress with a plan that adapts daily.");

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
