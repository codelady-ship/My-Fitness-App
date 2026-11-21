/**
 * Small fetch wrapper for the Pulsa API (contract: docs/API.md on `feature/pulsa-backend`).
 *
 * - Base URL: NEXT_PUBLIC_API_URL, e.g. https://pulsa-api.onrender.com — the /api/v1 prefix is added
 *   unless the value already ends with it. Unset = demo mode.
 * - Envelopes: success `{ data, meta? }`, error `{ error: { code, message, details } }`.
 * - Every request times out after 8 s.
 * - Network errors, timeouts and 5xx answers are "unavailable": callers fall back to bundled demo data,
 *   so the deployed site never breaks when the API sleeps or is down.
 * - 4xx answers are real errors (wrong password, validation) and are shown to the user.
 * - Access tokens live 15 min: on a 401 the refresh token is rotated once and the request retried.
 */

const RAW_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
export const API_URL = !RAW_URL ? "" : /\/api\/v\d+$/.test(RAW_URL) ? RAW_URL : `${RAW_URL}/api/v1`;
export const TIMEOUT_MS = 8000;
const SESSION_KEY = "pulsa-session";
export const sessionStorageKey = SESSION_KEY;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The API could not be reached (not configured, offline, timeout or 5xx). */
export class ApiUnavailable extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "ApiUnavailable";
  }
}

// After a failure, skip the API for a short while so every widget doesn't wait 8 s again.
let downUntil = 0;
export const COOL_DOWN_MS = 30_000;

/**
 * localStorage with an in-memory fallback. Inside a cross-site iframe (the portfolio embeds the admin)
 * a browser may block storage; the session then lives in memory and survives client-side navigation.
 */
const memory = new Map<string, string>();
export const safeStorage = {
  get(key: string): string | null {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch {
      /* storage blocked */
    }
    return memory.get(key) ?? null;
  },
  set(key: string, value: string) {
    memory.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage blocked: the in-memory copy is used */
    }
  },
  remove(key: string) {
    memory.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** The same, shaped for zustand persist (createJSONStorage). */
export const safeStateStorage = {
  getItem: (key: string) => safeStorage.get(key),
  setItem: (key: string, value: string) => safeStorage.set(key, value),
  removeItem: (key: string) => safeStorage.remove(key),
};

type Stored = { token?: string; refreshToken?: string; demo?: boolean };

const readStored = (): Stored | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = safeStorage.get(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
};

export const readToken = (): string | null => {
  const s = readStored();
  return s && !s.demo ? (s.token ?? null) : null;
};

export const readRefreshToken = (): string | null => {
  const s = readStored();
  return s && !s.demo ? (s.refreshToken ?? null) : null;
};

/** Clear the stored session and send the visitor to the login page. */
function expireSession() {
  if (typeof window === "undefined") return;
  safeStorage.remove(SESSION_KEY);
  window.dispatchEvent(new Event("pulsa-session"));
  if (!window.location.pathname.startsWith("/login")) window.location.assign("/login?expired=1");
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const stored = readStored();
  if (!stored?.refreshToken || stored.demo) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });
        if (!res.ok) {
          // The refresh token was rejected (expired, rotated or revoked): end the session.
          if (res.status === 400 || res.status === 401 || res.status === 403) expireSession();
          return false;
        }
        const json = await res.json();
        const data = json?.data;
        if (!data?.accessToken) return false;
        safeStorage.set(
          SESSION_KEY,
          JSON.stringify({ ...stored, token: data.accessToken, refreshToken: data.refreshToken ?? stored.refreshToken }),
        );
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

/** Accept both `{ data, meta? }` envelopes and bare JSON. */
const unwrap = (json: unknown): unknown =>
  json && typeof json === "object" && !Array.isArray(json) && "data" in json && Object.keys(json).every((k) => k === "data" || k === "meta")
    ? (json as { data: unknown }).data
    : json;

type Options = { method?: string; body?: unknown; auth?: boolean; retried?: boolean };

export async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, auth = true, retried = false } = opts;
  if (!API_URL) throw new ApiUnavailable("NEXT_PUBLIC_API_URL is not set");
  if (Date.now() < downUntil) throw new ApiUnavailable("API recently unreachable");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? readToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    downUntil = Date.now() + COOL_DOWN_MS;
    throw new ApiUnavailable(controller.signal.aborted ? "Timed out" : String(err));
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 500) {
    downUntil = Date.now() + COOL_DOWN_MS;
    throw new ApiUnavailable(`Server error ${res.status}`);
  }

  if (res.status === 401 && token && !retried && (await refreshAccessToken())) {
    return request<T>(path, { ...opts, retried: true });
  }

  const text = res.status === 204 ? "" : await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const e = (json as { error?: { code?: string; message?: string; details?: { path: string; message: string }[] } } | null)?.error;
    let msg = e?.message ?? `Request failed (${res.status})`;
    if (e?.code === "VALIDATION_ERROR" && e.details?.length) msg = e.details.map((d) => d.message).join(". ");
    if (res.status === 429) msg = "Too many attempts. Please wait a few minutes and try again.";
    throw new ApiError(msg, res.status, e?.code, e?.details);
  }
  return unwrap(json) as T;
}

/** Run an API read; when the API is unavailable (or the visitor may not read it) return the demo value. */
export async function withFallback<T>(load: () => Promise<T | null>, demo: () => T): Promise<{ data: T; source: "api" | "demo" }> {
  try {
    const data = await load();
    // null = reachable but empty (e.g. no metrics yet): show the demo sample, labelled as such.
    return data === null ? { data: demo(), source: "demo" } : { data, source: "api" };
  } catch (err) {
    if (err instanceof ApiUnavailable) return { data: demo(), source: "demo" };
    if (err instanceof ApiError && [401, 403, 404, 429].includes(err.status)) return { data: demo(), source: "demo" };
    // Unexpected response shapes should not break the page either.
    if (err instanceof TypeError) return { data: demo(), source: "demo" };
    throw err;
  }
}
