import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Member totals, new registrations, cards ending soon and remaining visits per member.",
  alternates: { canonical: "/dashboard" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
