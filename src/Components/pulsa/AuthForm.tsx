"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, DEMO_ADMIN, DEMO_MODE, loadSession, login, loginDemoAdmin, register } from "@/lib/api";
import { HeartIcon } from "./Icons";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function startDemoAdmin() {
    setBusy(true);
    setError("");
    try {
      await loginDemoAdmin();
      router.push("/users");
    } catch {
      setError("Could not start the demo. Please try again.");
      setBusy(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired")) setError("Your session has expired. Please log in again.");
    // /login?demo=admin (the portfolio's Admin tab) opens the demo admin straight away,
    // unless someone is already signed in with a real account in this browser.
    if (mode === "login" && params.get("demo") === "admin") {
      const s = loadSession();
      if (!s || s.demo || s.user.readOnly) void startDemoAdmin();
      else router.replace("/users");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // The public demo admin login typed by hand works like the button (also while the API sleeps).
    if (mode === "login" && email.toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password) return startDemoAdmin();

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
      {mode === "login" && (
        <>
          <button type="button" className="btn btn-ghost" onClick={startDemoAdmin} disabled={busy}>
            Demo admin
          </button>
          <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
            Read-only demo admin: <code>{DEMO_ADMIN.email}</code> / <code>{DEMO_ADMIN.password}</code>. Changes are not saved.
          </p>
        </>
      )}
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
