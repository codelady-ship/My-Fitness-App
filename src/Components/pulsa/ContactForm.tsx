"use client";
import { useState } from "react";
import { ApiError, sendContact } from "@/lib/api";
import { HeartIcon } from "./Icons";

type Errors = Partial<Record<"name" | "email" | "message", string>>;
const TOPICS = ["Programs", "Coaching", "Pricing & billing", "My account", "Something else"];

export default function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "saved" | "error">("idle");
  const [serverError, setServerError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const input = {
      name: (data.name ?? "").trim(),
      email: (data.email ?? "").trim(),
      topic: data.topic ?? TOPICS[0],
      message: (data.message ?? "").trim(),
    };
    const next: Errors = {};
    if (input.name.length < 2) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(input.email)) next.email = "Please enter a valid email address.";
    if (input.message.length < 10) next.message = "Please write at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    setStatus("sending");
    setServerError("");
    try {
      const { source } = await sendContact(input);
      setStatus(source === "api" ? "sent" : "saved");
      form.reset();
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <span id={`${k}-error`} className="field-error">
        {errors[k]}
      </span>
    ) : null;

  return (
    <form className="glass-solid" style={{ padding: "clamp(20px, 3vw, 32px)", display: "grid", gap: 16 }} onSubmit={onSubmit} noValidate>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <label className="field">
          Name
          <input
            className="input"
            name="name"
            autoComplete="name"
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {err("name")}
        </label>
        <label className="field">
          Email
          <input
            className="input"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {err("email")}
        </label>
      </div>
      <label className="field">
        Topic
        <select className="input" name="topic" defaultValue={TOPICS[0]}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Message
        <textarea
          className="input"
          name="message"
          required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {err("message")}
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
        <button type="submit" className="btn btn-coral" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"} <HeartIcon size={14} />
        </button>
        <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 14 }}>
          {status === "sent" && (
            <span style={{ color: "#17794f", fontWeight: 600 }}>Thanks! Your message was sent. We will reply by email.</span>
          )}
          {status === "saved" && (
            <span className="muted">
              Our server is offline right now, so your message was saved in this browser. Please also email hello@pulsa.example.
            </span>
          )}
          {status === "error" && <span className="field-error">{serverError}</span>}
        </p>
      </div>
    </form>
  );
}
