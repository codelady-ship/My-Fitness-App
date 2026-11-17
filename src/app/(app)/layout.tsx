import ClientShell from "@/src/Components/ClientShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
