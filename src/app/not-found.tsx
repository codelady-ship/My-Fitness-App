import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main id="main" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px var(--pad)" }}>
      <div className="glass-solid" style={{ padding: "40px 32px", textAlign: "center", maxWidth: 460 }}>
        <p className="display" style={{ margin: 0, fontSize: 80, color: "var(--coral)" }}>
          404
        </p>
        <h1 style={{ margin: "8px 0 0", fontSize: 26 }}>Page not found</h1>
        <p className="muted" style={{ margin: "10px 0 0" }}>
          This page skipped a beat. It does not exist or was moved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <Link href="/" className="btn btn-coral">
            Go home
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
