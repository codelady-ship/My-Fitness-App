import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members",
  description: "Search, filter, add, edit and delete gym members. Changes are saved in your browser.",
  alternates: { canonical: "/users" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
