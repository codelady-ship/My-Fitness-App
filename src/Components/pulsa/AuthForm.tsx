"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, DEMO_MODE, login, register } from "@/lib/api";
import { HeartIcon } from "./Icons";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired")) setError("Your session has expired. Please log in again.");
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = (data.email ?? "").trim();
    const password = data.password ?? "";
    const name = (data.name ?? "").trim();

    if (mode === "register" && name.length < 2) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (password.length < (mode === "register" ? 8 : 1)) {
      return setError(mode === "register" ? "Use at least 8 characters for your password." : "Please enter your password.");
    }

    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form
      className="glass-solid"
      style={{ padding: "clamp(22px, 3vw, 34px)", display: "grid", gap: 16, width: "min(100%, 460px)" }}
      onSubmit={onSubmit}
      noValidate
    >
      {mode === "register" && (
        <label className="field">
          Name
          <input className="input" name="name" autoComplete="name" required />
        </label>
      )}
      <label className="field">
        Email
        <input className="input" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        Password
        <span style={{ position: "relative", display: "block" }}>
          <input
            className="input"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 8 : undefined}
            required
            style={{ paddingRight: 80 }}
          />
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowPw((s) => !s)}
            aria-pressed={showPw}
            style={{ position: "absolute", right: 5, top: 5, minHeight: 36, background: "transparent" }}
          >
            {showPw ? "Hide" : "Show"}
            <span className="sr-only"> password</span>
          </button>
        </span>
      </label>
      <p role="alert" aria-live="assertive" className="field-error" style={{ margin: 0, minHeight: 0 }}>
        {error}
      </p>
      <button type="submit" className="btn btn-coral" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"} <HeartIcon size={14} />
      </button>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        {mode === "login" ? (
          <>
            New to Pulsa?{" "}
            <Link href="/register" style={{ color: "var(--coral-ink)", fontWeight: 600 }}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--coral-ink)", fontWeight: 600 }}>
              Log in
            </Link>
          </>
        )}
      </p>
      {DEMO_MODE && (
        <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
          Demo mode: no server is connected, so any email and password start a demo session in this browser. An email starting with{" "}
          <code>admin@</code> opens the admin view.
        </p>
      )}
    </form>
  );
}
