import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-semibold text-amber-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 opacity-80">This page does not exist.</p>
      <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600">
        Go to the dashboard
      </Link>
    </div>
  );
}
