import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff",
  description: "Gym trainers, instructors and front-desk staff. Add, edit and delete staff members.",
  alternates: { canonical: "/staff" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
