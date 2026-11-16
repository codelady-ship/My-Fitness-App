import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership cards",
  description: "Membership cards with status, end date and remaining visits.",
  alternates: { canonical: "/cards" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
