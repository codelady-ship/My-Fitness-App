import type { Viewport } from "next";
import ClientShell from "@/src/Components/ClientShell";
import "./admin.css";

// The admin is white; the public pages keep the root layout's pale blue theme colour.
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
