import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { api, makeUser } from "./helpers";

const creds = { name: "Aysel Aliyeva", email: "Aysel@Pulsa.example", password: "secret-pass-1" };

describe("auth", () => {
  let refreshToken = "";
  let accessToken = "";

  it("registers a member and returns tokens", async () => {
    const res = await api().post("/api/v1/auth/register").send(creds).expect(201);
    expect(res.body.data.user).toMatchObject({ name: "Aysel Aliyeva", email: "aysel@pulsa.example", role: "member" });
    expect(res.body.data.user.id).toMatch(/^[a-f\d]{24}$/);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.body.data.user).not.toHaveProperty("_id");
    expect(res.body.data.expiresIn).toBe(900);
    expect(typeof res.body.data.accessToken).toBe("string");
    refreshToken = res.body.data.refreshToken;
  });

  it("rejects a duplicate email with 409", async () => {
    const res = await api().post("/api/v1/auth/register").send(creds).expect(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("validates the body with field details", async () => {
    const res = await api().post("/api/v1/auth/register").send({ name: "A", email: "nope", password: "short" }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const paths = res.body.error.details.map((d: { path: string }) => d.path).sort();
    expect(paths).toEqual(["email", "name", "password"]);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await api().post("/api/v1/auth/login").set("Content-Type", "application/json").send("{bad").expect(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("logs in with the right password only", async () => {
    await api().post("/api/v1/auth/login").send({ email: creds.email, password: "wrong-password" }).expect(401);
    await api().post("/api/v1/auth/login").send({ email: "nobody@pulsa.example", password: "whatever1" }).expect(401);
    const res = await api().post("/api/v1/auth/login").send({ email: creds.email, password: creds.password }).expect(200);
    accessToken = res.body.data.accessToken;
  });

  it("GET /auth/me needs a valid token", async () => {
    const none = await api().get("/api/v1/auth/me").expect(401);
    expect(none.body.error.code).toBe("UNAUTHORIZED");
    await api().get("/api/v1/auth/me").set("Authorization", "Bearer not-a-jwt").expect(401);
    const res = await api().get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(res.body.data.email).toBe("aysel@pulsa.example");
  });

  it("PATCH /auth/me updates the profile and rejects unknown fields", async () => {
    const auth = { Authorization: `Bearer ${accessToken}` };
    const res = await api().patch("/api/v1/auth/me").set(auth).send({ goal: "Resting HR under 65", birthDate: "1995-02-15" }).expect(200);
    expect(res.body.data).toMatchObject({ goal: "Resting HR under 65", birthDate: "1995-02-15" });
    await api().patch("/api/v1/auth/me").set(auth).send({ role: "admin" }).expect(400);
  });

  it("rotates refresh tokens (old one stops working)", async () => {
    const res = await api().post("/api/v1/auth/refresh").send({ refreshToken }).expect(200);
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
    await api().post("/api/v1/auth/refresh").send({ refreshToken }).expect(401);
    refreshToken = res.body.data.refreshToken;
  });

  it("logout revokes the refresh token", async () => {
    await api().post("/api/v1/auth/logout").send({ refreshToken }).expect(204);
    await api().post("/api/v1/auth/refresh").send({ refreshToken }).expect(401);
  });

  it("change-password checks the current password", async () => {
    const auth = { Authorization: `Bearer ${accessToken}` };
    await api().post("/api/v1/auth/change-password").set(auth).send({ currentPassword: "nope-nope", newPassword: "another-pass-2" }).expect(401);
    await api().post("/api/v1/auth/change-password").set(auth).send({ currentPassword: creds.password, newPassword: "another-pass-2" }).expect(204);
    await api().post("/api/v1/auth/login").send({ email: creds.email, password: "another-pass-2" }).expect(200);
  });

  it("enforces roles: members cannot reach admin routes", async () => {
    const member = await makeUser("member");
    const admin = await makeUser("admin");
    const res = await api().get("/api/v1/users").set(member.auth).expect(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    const list = await api().get("/api/v1/users?limit=2").set(admin.auth).expect(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect(list.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it("admin can change a role", async () => {
    const admin = await makeUser("admin");
    const target = await makeUser("member");
    const res = await api().patch(`/api/v1/users/${target.id}`).set(admin.auth).send({ role: "coach" }).expect(200);
    expect(res.body.data.role).toBe("coach");
    await api().delete(`/api/v1/users/${target.id}`).set(admin.auth).expect(204);
    await api().get(`/api/v1/users/${target.id}`).set(admin.auth).expect(404);
  });
});

describe("platform", () => {
  it("health and openapi respond", async () => {
    const h = await api().get("/api/v1/health").expect(200);
    expect(h.body.data).toMatchObject({ status: "ok", db: "up" });
    const o = await api().get("/api/v1/openapi.json").expect(200);
    expect(o.body.openapi).toBe("3.1.0");
    expect(Object.keys(o.body.paths)).toContain("/metrics/summary");
  });

  it("unknown routes give the error envelope", async () => {
    const res = await api().get("/api/v1/nope").expect(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: "Route GET /api/v1/nope not found" } });
  });

  it("sets security headers and CORS for allowed origins only", async () => {
    const ok = await api().get("/api/v1/health").set("Origin", "http://localhost:3000").expect(200);
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(ok.headers["x-content-type-options"]).toBe("nosniff");
    const bad = await api().get("/api/v1/health").set("Origin", "https://evil.example").expect(403);
    expect(bad.body.error.code).toBe("FORBIDDEN");
  });

  it("rate limits auth routes", async () => {
    const limited = createApp({ rateLimit: { enabled: true, scale: 0.1 } }); // auth: 2 per window
    for (let i = 0; i < 2; i++) {
      await request(limited).post("/api/v1/auth/login").send({ email: "x@y.example", password: "whatever1" }).expect(401);
    }
    const res = await request(limited).post("/api/v1/auth/login").send({ email: "x@y.example", password: "whatever1" }).expect(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});
