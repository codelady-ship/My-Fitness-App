/**
 * Typed Pulsa API, following docs/API.md (contract v1) on `feature/pulsa-backend`.
 * The `map*` helpers are the only place that knows the server's JSON shape.
 */
import { API_URL, ApiError, ApiUnavailable, readRefreshToken, request, safeStorage, sessionStorageKey, withFallback } from "./client";
import { makeSeedMetrics, makeSeedPlan, seedCoaches, seedPlans, seedPrograms, seedPublicStats } from "./seed";
import type {
  Coach,
  ContactInput,
  DailyPlan,
  HeartMetrics,
  Member,
  PricingPlan,
  Program,
  PublicStats,
  Role,
  Session,
  Staff,
  User,
} from "./types";
import { makeSeedCards } from "@/Mock/cards";
import { staffData } from "@/Mock/staff";

export * from "./types";
export { ApiError, ApiUnavailable, API_URL } from "./client";

/** True when no API is configured: the whole site runs on bundled demo data. */
export const DEMO_MODE = !API_URL;

type Raw = Record<string, unknown>;
const str = (v: unknown, d = "") => (v === undefined || v === null ? d : String(v));
const num = (v: unknown, d = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d;
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const zoneOf = (v: unknown) => num(String(v ?? "").replace(/\D/g, ""), 2);
/** % of max heart rate -> zone 1–5 */
const zoneFromPct = (maxPct: number) => (maxPct <= 60 ? 1 : maxPct <= 70 ? 2 : maxPct <= 80 ? 3 : maxPct <= 90 ? 4 : 5);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/* ---------- mappers (server JSON -> frontend types) ---------- */

const mapProgram = (r: Raw): Program => {
  const tz = (r.targetZone ?? {}) as Raw;
  return {
    id: str(r.slug ?? r.id),
    title: str(r.title),
    summary: str(r.summary),
    level: capital(str(r.level, "beginner")) as Program["level"],
    weeks: num(r.durationWeeks, 8),
    sessionsPerWeek: num(r.sessionsPerWeek, 3),
    zone: tz.maxPct !== undefined ? zoneFromPct(num(tz.maxPct, 70)) : 2,
    tags: [r.focus ? capital(str(r.focus).replace(/-/g, " ")) : "", r.minutesPerSession ? `${num(r.minutesPerSession)} min` : ""].filter(
      Boolean,
    ),
  };
};

const mapCoach = (r: Raw): Coach => ({
  id: str(r.id),
  name: str(r.name),
  role: str(r.title, "Coach"),
  specialty: Array.isArray(r.specialties) ? (r.specialties as unknown[]).map(String).join(" & ") : "",
  bio: str(r.bio),
  years: num(r.yearsExperience),
  rating: num(r.rating, 5),
  reviews: num(r.reviewsCount),
});

const mapPlan = (r: Raw): PricingPlan => ({
  id: str(r.slug ?? r.id),
  name: str(r.name),
  monthly: num(r.priceMonthly),
  yearly: num(r.priceYearly, num(r.priceMonthly) * 10),
  blurb: str(r.tagline),
  features: Array.isArray(r.features) ? (r.features as unknown[]).map(String) : [],
  featured: Boolean(r.highlighted),
});

const mapUser = (r: Raw): User => ({
  id: str(r.id),
  name: str(r.name, str(r.email).split("@")[0]),
  email: str(r.email),
  role: (["admin", "coach"].includes(str(r.role)) ? r.role : "member") as Role,
  ...(r.isDemo === true ? { readOnly: true } : {}),
});

const mapMember = (r: Raw): Member => {
  const name = str(r.fullName);
  const now = new Date().toISOString();
  const lastVisit = str(r.lastVisit, "");
  return {
    // The UI shows and routes by card code; the API accepts id or memberCode on every /members/:id route.
    id: str(r.memberCode ?? r.id),
    owner: name,
    fullName: name,
    image: str(r.image),
    remainingAccesses: num(r.remainingAccesses),
    status: (["active", "passive", "expired"].includes(str(r.status)) ? r.status : "active") as Member["status"],
    lastUsed: lastVisit,
    lastVisit,
    gender: (r.gender === "male" ? "male" : "female") as Member["gender"],
    birthDate: str(r.birthDate),
    email: str(r.email),
    phone: str(r.phone),
    membershipType: (r.membershipType === "Year" ? "Year" : "Monthly") as Member["membershipType"],
    startDate: str(r.startDate),
    endDate: str(r.endDate),
    height: num(r.height),
    weight: num(r.weight),
    goals: str(r.goals),
    coach: str(r.coach),
    checkInHistory: Array.isArray(r.checkInHistory) ? (r.checkInHistory as unknown[]).map(String) : [],
    notes: str(r.notes),
    isBlacklisted: Boolean(r.isBlacklisted),
    createdAt: str(r.createdAt, now),
    updatedAt: str(r.updatedAt, now),
  };
};

/** The API stores image URLs (max 500 chars); photos uploaded as data URLs stay in this browser only. */
const urlImage = (v: string) => (v && !v.startsWith("data:") && v.length <= 500 ? v : "");

/** Only contract fields (the API validates strictly); empty optional strings are left out so validation does not trip on them. */
const memberBody = (m: Member) => {
  const body: Raw = {
    memberCode: m.id,
    fullName: m.fullName || m.owner,
    email: m.email,
    phone: m.phone,
    gender: m.gender,
    birthDate: m.birthDate,
    image: urlImage(m.image),
    membershipType: m.membershipType,
    status: m.status,
    remainingAccesses: m.remainingAccesses,
    startDate: m.startDate,
    endDate: m.endDate,
    height: m.height,
    weight: m.weight,
    goals: m.goals,
    coach: m.coach,
    notes: m.notes,
    isBlacklisted: m.isBlacklisted,
  };
  for (const k of Object.keys(body)) if (body[k] === "" || body[k] === null || body[k] === undefined) delete body[k];
  return body;
};

const mapStaff = (r: Raw): Staff => ({
  id: str(r.id),
  FName: str(r.firstName),
  Lname: str(r.lastName),
  email: str(r.email),
  tel: str(r.phone),
  birth: str(r.birthDate),
  gender: (r.gender === "male" ? "male" : "female") as Staff["gender"],
  image: str(r.image),
  jobType: str(r.jobType, "Trainer"),
});

const staffBody = (s: Staff) => {
  const body: Raw = {
    firstName: s.FName,
    lastName: s.Lname,
    email: s.email,
    phone: s.tel,
    birthDate: s.birth,
    gender: s.gender,
    image: urlImage(s.image),
    jobType: s.jobType,
  };
  for (const k of Object.keys(body)) if (body[k] === "") delete body[k];
  return body;
};

/* ---------- public reads ---------- */

export const getPrograms = () =>
  withFallback(
    async () => arr(await request("/programs?limit=50", { auth: false })).map(mapProgram),
    () => seedPrograms,
  );
export const getCoaches = () =>
  withFallback(
    async () => arr(await request("/coaches?limit=50", { auth: false })).map(mapCoach),
    () => seedCoaches,
  );
export const getPlans = () =>
  withFallback(
    async () => arr(await request("/pricing-plans", { auth: false })).map(mapPlan),
    () => seedPlans,
  );
export const getPublicStats = () =>
  withFallback<PublicStats>(
    async () => {
      const r = (await request("/stats/public", { auth: false })) as Raw;
      const initials = Array.isArray(r.featuredInitials) ? (r.featuredInitials as unknown[]).map(String).slice(0, 4) : [];
      return {
        membersLabel: str(r.membersLabel, seedPublicStats.membersLabel),
        initials: initials.length ? initials : seedPublicStats.initials,
      };
    },
    () => seedPublicStats,
  );

export async function sendContact(input: ContactInput): Promise<{ source: "api" | "demo" }> {
  try {
    await request("/contact", {
      method: "POST",
      body: { name: input.name, email: input.email, subject: input.topic, message: input.message },
      auth: false,
    });
    return { source: "api" };
  } catch (err) {
    if (err instanceof ApiUnavailable) {
      // Keep the message on this device so nothing typed is lost.
      try {
        const key = "pulsa-outbox";
        const outbox = JSON.parse(localStorage.getItem(key) ?? "[]");
        outbox.push({ ...input, savedAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(outbox));
      } catch {
        /* storage blocked */
      }
      return { source: "demo" };
    }
    throw err;
  }
}

/* ---------- auth ---------- */

type StoredSession = Session & { refreshToken?: string };

const saveSession = (s: StoredSession): Session => {
  // Falls back to memory when storage is blocked (e.g. inside a cross-site iframe).
  safeStorage.set(sessionStorageKey, JSON.stringify(s));
  window.dispatchEvent(new Event("pulsa-session"));
  return s;
};

export const loadSession = (): Session | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = safeStorage.get(sessionStorageKey);
    const s = raw ? (JSON.parse(raw) as Session) : null;
    // A demo session left over from demo mode is not valid once a real API is configured
    // (the "Demo admin" sandbox is the exception: it is started on purpose while the API is down).
    if (s?.demo && !DEMO_MODE && !s.sandbox) {
      safeStorage.remove(sessionStorageKey);
      return null;
    }
    return s;
  } catch {
    return null;
  }
};

export const logout = () => {
  const refreshToken = readRefreshToken();
  if (refreshToken) void request("/auth/logout", { method: "POST", body: { refreshToken }, auth: false }).catch(() => {});
  safeStorage.remove(sessionStorageKey);
  window.dispatchEvent(new Event("pulsa-session"));
};

const toSession = (raw: unknown): StoredSession => {
  const r = (raw ?? {}) as Raw;
  const token = str(r.accessToken);
  if (!token) throw new ApiError("The server did not return a session token.", 500);
  return { token, refreshToken: str(r.refreshToken) || undefined, user: mapUser((r.user ?? {}) as Raw), demo: false };
};

const WAKING_UP = "The server is waking up. Please try again in a minute.";

/**
 * Demo session, ONLY in demo mode (no NEXT_PUBLIC_API_URL): lets visitors explore the dashboard.
 * "admin@…" gets the admin role. With a real API configured, an unreachable server never creates a session.
 */
const demoSession = (email: string, name?: string): Session => ({
  token: "demo",
  demo: true,
  user: { id: "demo", email, name: name || email.split("@")[0], role: email.toLowerCase().startsWith("admin@") ? "admin" : "member" },
});

export async function login(email: string, password: string): Promise<Session> {
  try {
    return saveSession(toSession(await request("/auth/login", { method: "POST", body: { email, password }, auth: false })));
  } catch (err) {
    if (err instanceof ApiUnavailable) {
      if (DEMO_MODE) return saveSession(demoSession(email));
      throw new ApiError(WAKING_UP, 503);
    }
    if (err instanceof ApiError && err.status === 401) throw new ApiError("Wrong email or password.", 401, err.code);
    throw err;
  }
}

/**
 * Public read-only demo admin, seeded by `npm run seed:demo-admin` (backend/src/seed/demoAdmin.ts).
 * The password is public by design: the API refuses every write from this account.
 */
export const DEMO_ADMIN = { email: "demo-admin@pulsa.example", password: "pulsa-demo-admin" } as const;

/**
 * "Demo admin" button. With the API up: signs in as the read-only demo admin (writes get 403).
 * With the API down or not configured: an in-browser sandbox admin on the bundled demo copy,
 * so the admin works in the portfolio iframe even while the free server sleeps.
 */
export async function loginDemoAdmin(): Promise<Session> {
  try {
    return saveSession(toSession(await request("/auth/login", { method: "POST", body: DEMO_ADMIN, auth: false })));
  } catch (err) {
    // Unreachable, or reachable but not seeded yet / rate limited: fall back to the sandbox.
    if (err instanceof ApiUnavailable || err instanceof ApiError) {
      return saveSession({
        token: "demo",
        demo: true,
        sandbox: true,
        user: { id: "demo-admin", email: DEMO_ADMIN.email, name: "Demo Admin", role: "admin" },
      });
    }
    throw err;
  }
}

export async function register(name: string, email: string, password: string): Promise<Session> {
  try {
    return saveSession(toSession(await request("/auth/register", { method: "POST", body: { name, email, password }, auth: false })));
  } catch (err) {
    if (err instanceof ApiUnavailable) {
      if (DEMO_MODE) return saveSession(demoSession(email, name));
      throw new ApiError(WAKING_UP, 503);
    }
    if (err instanceof ApiError && err.status === 409)
      throw new ApiError("An account with this email already exists. Try logging in.", 409, err.code);
    throw err;
  }
}

/* ---------- signed-in data ---------- */

const signedIn = () => {
  const s = loadSession();
  return !!s && !s.demo;
};

/** GET /metrics/summary?days=14 + GET /metrics/days for the 14-day resting-HR line. null = no data yet. */
export const getHeartMetrics = () =>
  withFallback<HeartMetrics>(
    async () => {
      if (!signedIn()) return null;
      const to = new Date();
      const from = new Date(to.getTime() - 13 * 864e5);
      const [summary, days] = await Promise.all([
        request<Raw>("/metrics/summary?days=14"),
        request<unknown>(`/metrics/days?from=${isoDay(from)}&to=${isoDay(to)}&limit=14`),
      ]);
      const win = (summary.window ?? {}) as Raw;
      if (!num(win.daysWithData)) return null;
      const latest = (summary.latest ?? {}) as Raw;
      const avg = (summary.averages ?? {}) as Raw;
      const gauge = (summary.gauge ?? {}) as Raw;
      const history = arr(days)
        .filter((d) => d.restingBpm !== null && d.restingBpm !== undefined)
        .map((d) => ({ date: str(d.date), bpm: num(d.restingBpm) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const seed = makeSeedMetrics();
      const resting = num(latest.restingBpm ?? avg.restingBpm, seed.restingBpm);
      return {
        restingBpm: Math.round(resting),
        zoneScore: Math.round(num(gauge.fraction, resting / 100) * 100),
        steps: num(latest.steps ?? avg.steps),
        recovery: num(latest.recoveryScore ?? avg.recoveryScore, 1),
        hrv: Math.round(num(avg.hrvMs)),
        sleepMinutes: Math.round(num(avg.sleepMinutes)),
        history: history.length >= 2 ? history : seed.history,
      };
    },
    () => makeSeedMetrics(),
  );

/** GET /plan/today. Ticks are kept in this browser (the contract has no completion endpoint). */
export const getTodayPlan = () =>
  withFallback<DailyPlan>(
    async () => {
      if (!signedIn()) return null;
      const r = await request<Raw>("/plan/today");
      const tz = (r.targetZone ?? {}) as Raw;
      const date = str(r.date);
      return {
        date,
        intensity: (["rest", "easy", "moderate", "hard"].includes(str(r.intensity)) ? r.intensity : "moderate") as DailyPlan["intensity"],
        headline: str(r.headline, "Today"),
        target: tz.name ? `${str(tz.name)}${tz.minBpm ? ` · ${num(tz.minBpm)}–${num(tz.maxBpm)} bpm` : ""}` : "",
        durationMinutes: num(r.durationMinutes),
        stepsGoal: num(r.stepsGoal),
        items: arr(r.sessions).map((s, i) => ({
          id: `${date}-${i}`,
          title: str(s.title),
          minutes: num(s.minutes),
          zone: zoneOf(s.zone),
          done: false,
        })),
        reasons: Array.isArray(r.reasons) ? (r.reasons as unknown[]).map(String) : [],
      };
    },
    () => makeSeedPlan(),
  );

/* ---------- admin: members & staff (coach/admin token required; anonymous = demo data) ---------- */

export const getMembers = () =>
  withFallback(
    async () => {
      if (!signedIn()) return null;
      return arr(await request("/members?limit=100")).map(mapMember);
    },
    () => makeSeedCards(),
  );

export const getStaff = () =>
  withFallback(
    async () => {
      if (!signedIn()) return null;
      return arr(await request("/staff?limit=100")).map(mapStaff);
    },
    () => staffData,
  );

const enc = encodeURIComponent;
export const api = {
  createMember: async (m: Member) => mapMember(await request<Raw>("/members", { method: "POST", body: memberBody(m) })),
  updateMember: async (m: Member) => mapMember(await request<Raw>(`/members/${enc(m.id)}`, { method: "PATCH", body: memberBody(m) })),
  deleteMember: (id: string) => request(`/members/${enc(id)}`, { method: "DELETE" }),
  createStaff: async (s: Staff) => mapStaff(await request<Raw>("/staff", { method: "POST", body: staffBody(s) })),
  updateStaff: async (s: Staff) => mapStaff(await request<Raw>(`/staff/${enc(s.id)}`, { method: "PATCH", body: staffBody(s) })),
  deleteStaff: (id: string) => request(`/staff/${enc(id)}`, { method: "DELETE" }),
};
