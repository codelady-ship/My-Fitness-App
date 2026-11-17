/**
 * Compact OpenAPI 3.1 description of the API, served at GET /api/v1/openapi.json.
 * The full field-level contract (request/response examples, rules) is docs/API.md.
 */
type Access = "public" | "user" | "coach" | "admin";
type Route = [method: string, path: string, tag: string, summary: string, access: Access, body?: string];

const routes: Route[] = [
  ["get", "/health", "System", "Health check (DB status)", "public"],
  ["post", "/auth/register", "Auth", "Create a member account; returns tokens", "public", "Register"],
  ["post", "/auth/login", "Auth", "Log in; returns access + refresh token", "public", "Login"],
  ["post", "/auth/refresh", "Auth", "Rotate refresh token; returns a new pair", "public", "RefreshToken"],
  ["post", "/auth/logout", "Auth", "Revoke a refresh token", "public", "RefreshToken"],
  ["get", "/auth/me", "Auth", "Current user", "user"],
  ["patch", "/auth/me", "Auth", "Update own profile", "user"],
  ["post", "/auth/change-password", "Auth", "Change password (revokes all refresh tokens)", "user"],
  ["get", "/users", "Users", "List users (?role&q&page&limit)", "admin"],
  ["get", "/users/{id}", "Users", "Get user", "admin"],
  ["patch", "/users/{id}", "Users", "Update user role / coach / program", "admin"],
  ["delete", "/users/{id}", "Users", "Delete user and their metrics", "admin"],
  ["get", "/programs", "Programs", "List programs (?level&focus&q&sort&page&limit)", "public"],
  ["get", "/programs/{idOrSlug}", "Programs", "Get program by id or slug", "public"],
  ["post", "/programs", "Programs", "Create program", "coach"],
  ["patch", "/programs/{id}", "Programs", "Update program", "coach"],
  ["delete", "/programs/{id}", "Programs", "Delete program", "admin"],
  ["post", "/programs/{id}/enroll", "Programs", "Enroll current user", "user"],
  ["delete", "/programs/{id}/enroll", "Programs", "Leave program", "user"],
  ["get", "/coaches", "Coaches", "List coaches (?q&specialty&sort&page&limit)", "public"],
  ["get", "/coaches/{id}", "Coaches", "Get coach with their programs", "public"],
  ["post", "/coaches", "Coaches", "Create coach", "admin"],
  ["patch", "/coaches/{id}", "Coaches", "Update coach", "admin"],
  ["delete", "/coaches/{id}", "Coaches", "Delete coach", "admin"],
  ["get", "/pricing-plans", "Pricing", "List active pricing plans", "public"],
  ["get", "/pricing-plans/{idOrSlug}", "Pricing", "Get pricing plan", "public"],
  ["post", "/pricing-plans", "Pricing", "Create pricing plan", "admin"],
  ["patch", "/pricing-plans/{id}", "Pricing", "Update pricing plan", "admin"],
  ["delete", "/pricing-plans/{id}", "Pricing", "Delete pricing plan", "admin"],
  ["put", "/metrics/days/{date}", "Metrics", "Upsert one day of heart metrics (merge)", "user", "MetricDayInput"],
  ["post", "/metrics/batch", "Metrics", "Upsert up to 366 days", "user"],
  ["get", "/metrics/days", "Metrics", "List days (?from&to&includeSeries&userId&page&limit)", "user"],
  ["get", "/metrics/days/{date}", "Metrics", "One day incl. heart-rate series", "user"],
  ["delete", "/metrics/days/{date}", "Metrics", "Delete one day", "user"],
  ["get", "/metrics/summary", "Metrics", "Gauge + averages + trend (?days&to&userId)", "user"],
  ["get", "/metrics/aggregate", "Metrics", "Day/week/month buckets (?from&to&interval&userId)", "user"],
  ["get", "/metrics/series", "Metrics", "Downsampled heart-rate series (?date&bucket&userId)", "user"],
  ["get", "/plan/today", "Plan", "Rule-based adaptive plan for today (?date)", "user"],
  ["post", "/contact", "Contact", "Send a contact message", "public", "Contact"],
  ["get", "/contact", "Contact", "List contact messages", "admin"],
  ["patch", "/contact/{id}", "Contact", "Set message status", "admin"],
  ["delete", "/contact/{id}", "Contact", "Delete message", "admin"],
  ["post", "/newsletter", "Newsletter", "Subscribe (201 new, 200 existing)", "public", "Email"],
  ["post", "/newsletter/unsubscribe", "Newsletter", "Unsubscribe", "public", "Email"],
  ["get", "/newsletter", "Newsletter", "List subscribers", "admin"],
  ["get", "/stats/public", "Stats", "Public counters for the hero (+12.4k)", "public"],
  ["get", "/members", "Gym admin", "List members / membership cards", "coach"],
  ["get", "/members/{id}", "Gym admin", "Get member by id or memberCode", "coach"],
  ["post", "/members", "Gym admin", "Create member", "admin"],
  ["patch", "/members/{id}", "Gym admin", "Update member", "admin"],
  ["delete", "/members/{id}", "Gym admin", "Delete member", "admin"],
  ["post", "/members/{id}/check-in", "Gym admin", "Record a visit (uses one access)", "coach"],
  ["get", "/staff", "Gym admin", "List staff", "coach"],
  ["get", "/staff/{id}", "Gym admin", "Get staff member", "coach"],
  ["post", "/staff", "Gym admin", "Create staff member", "admin"],
  ["patch", "/staff/{id}", "Gym admin", "Update staff member", "admin"],
  ["delete", "/staff/{id}", "Gym admin", "Delete staff member", "admin"],
  ["get", "/admin/stats", "Gym admin", "Dashboard counters", "coach"],
  ["get", "/admin/activity", "Gym admin", "Check-ins & registrations per day (?days)", "coach"],
];

const ACCESS_NOTE: Record<Access, string> = {
  public: "Public.",
  user: "Requires login (any role).",
  coach: "Requires role coach or admin.",
  admin: "Requires role admin.",
};

const str = { type: "string" };
const schemas = {
  Error: {
    type: "object",
    properties: {
      error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: {
            type: "string",
            enum: ["VALIDATION_ERROR", "BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "INTERNAL_ERROR"],
          },
          message: str,
          details: { type: "array", items: { type: "object", properties: { path: str, message: str } } },
        },
      },
    },
  },
  Register: {
    type: "object",
    required: ["name", "email", "password"],
    properties: { name: str, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 } },
  },
  Login: { type: "object", required: ["email", "password"], properties: { email: str, password: str } },
  RefreshToken: { type: "object", required: ["refreshToken"], properties: { refreshToken: str } },
  Email: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } },
  Contact: {
    type: "object",
    required: ["name", "email", "message"],
    properties: { name: str, email: str, subject: str, message: { type: "string", minLength: 10 } },
  },
  MetricDayInput: {
    type: "object",
    properties: {
      restingBpm: { type: ["integer", "null"], minimum: 25, maximum: 220 },
      steps: { type: ["integer", "null"], minimum: 0 },
      recoveryScore: { type: ["number", "null"], minimum: 0, maximum: 3 },
      hrvMs: { type: ["number", "null"] },
      sleepMinutes: { type: ["integer", "null"] },
      activeMinutes: { type: ["integer", "null"] },
      heartRate: {
        type: "array",
        maxItems: 1440,
        items: { type: "object", properties: { t: { type: "string", pattern: "^\\d{2}:\\d{2}$" }, bpm: { type: "integer" } } },
      },
      source: { type: "string", enum: ["manual", "device", "seed"] },
    },
  },
};

const CREATE_PATHS = ["/auth/register", "/programs", "/coaches", "/pricing-plans", "/contact", "/newsletter", "/members", "/staff"];

function successStatus(method: string, path: string): string {
  if ((method === "delete" && !path.endsWith("/enroll")) || path === "/auth/logout" || path === "/auth/change-password") return "204";
  if (method === "post" && CREATE_PATHS.includes(path)) return "201";
  return "200";
}

export function buildOpenApi(serverUrl = "/api/v1") {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const [method, path, tag, summary, access, body] of routes) {
    const params = [...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
      name: m[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    }));
    const op: Record<string, unknown> = {
      tags: [tag],
      summary,
      description: `${ACCESS_NOTE[access]} See docs/API.md for full request/response shapes.`,
      responses: {
        [successStatus(method, path)]: {
          description: "Success — `{ data, meta? }`",
        },
        default: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      },
    };
    if (params.length) op.parameters = params;
    if (access !== "public") op.security = [{ bearerAuth: [] }];
    if (body) {
      op.requestBody = { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${body}` } } } };
    }
    paths[path] = { ...(paths[path] ?? {}), [method]: op };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Pulsa API",
      version: "1.0.0",
      description: "Pulsa — Your Personal Heart Coach. Cardio coaching + gym admin REST API.",
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas,
    },
    paths,
  };
}
