/**
 * Shapes the frontend works with. The backend (branch `feature/pulsa-backend`, docs/API.md)
 * is mapped onto these in `lib/api/index.ts`, so pages never depend on raw server JSON.
 */
import type { ICard } from "@/Interface/card";
import type { IStaff } from "@/Interface/staff";

export type Role = "member" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
  /** true when the API was unreachable and the session only exists in this browser */
  demo: boolean;
}

export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Program {
  id: string;
  title: string;
  summary: string;
  level: Level;
  weeks: number;
  sessionsPerWeek: number;
  /** main heart-rate zone, 1–5 */
  zone: number;
  tags: string[];
}

export interface Coach {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  years: number;
  rating: number;
  reviews: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  blurb: string;
  features: string[];
  featured?: boolean;
}

export interface HeartPoint {
  /** ISO date */
  date: string;
  bpm: number;
}

export interface HeartMetrics {
  restingBpm: number;
  /** 0–100, how much of the target zone was reached today */
  zoneScore: number;
  steps: number;
  recovery: number;
  hrv: number;
  /** average sleep per night, minutes */
  sleepMinutes: number;
  history: HeartPoint[];
}

export interface PlanItem {
  id: string;
  title: string;
  zone: number;
  minutes: number;
  /** ticked off in this browser (the API has no completion endpoint) */
  done: boolean;
}

export interface DailyPlan {
  date: string;
  intensity: "rest" | "easy" | "moderate" | "hard";
  headline: string;
  /** e.g. "Zone 3 · 133–152 bpm" */
  target: string;
  durationMinutes: number;
  stepsGoal: number;
  items: PlanItem[];
  reasons: string[];
}

export interface PublicStats {
  membersLabel: string;
  initials: string[];
}

export interface ContactInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export type Member = ICard;
export type Staff = IStaff;

/** Every read returns where the data came from, so the UI can show a quiet "demo data" badge. */
export interface Result<T> {
  data: T;
  source: "api" | "demo";
}
