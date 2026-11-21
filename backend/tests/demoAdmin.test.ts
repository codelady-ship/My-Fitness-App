import { beforeAll, describe, expect, it } from "vitest";
import { addDays, today } from "../src/lib/dates";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, ensureDemoAdmin } from "../src/seed/demoAdmin";
import { api, makeUser } from "./helpers";

type Auth = { Authorization: string };
let demo: Auth;
let admin: Auth;

beforeAll(async () => {
  await ensureDemoAdmin();
  await ensureDemoAdmin(); // idempotent
  const res = await api().post("/api/v1/auth/login").send({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD }).expect(200);
  expect(res.body.data.user).toMatchObject({ role: "admin", isDemo: true });
  demo = { Authorization: `Bearer ${res.body.data.accessToken}` };
  admin = (await makeUser("admin")).auth;
});

const card = {
  fullName: "Nigar Huseynova",
  gender: "female",
  membershipType: "Monthly",
  startDate: today(),
  endDate: addDays(today(), 30),
};

describe("read-only demo admin", () => {
  it("reads the gym admin lists", async () => {
    await api().post("/api/v1/members").set(admin).send(card).expect(201);
    const list = await api().get("/api/v1/members").set(demo).expect(200);
    expect(list.body.data.length).toBeGreaterThan(0);
    await api().get("/api/v1/staff").set(demo).expect(200);
    await api().get("/api/v1/admin/stats").set(demo).expect(200);
    await api().get("/api/v1/auth/me").set(demo).expect(200);
  });

  it("every write is refused with DEMO_READ_ONLY and nothing changes", async () => {
    const before = (await api().get("/api/v1/members").set(admin).expect(200)).body.data;
    const id = before[0].id;
    for (const req of [
      api().post("/api/v1/members").set(demo).send(card),
      api().patch(`/api/v1/members/${id}`).set(demo).send({ notes: "x" }),
      api().delete(`/api/v1/members/${id}`).set(demo),
      api().post(`/api/v1/members/${id}/check-in`).set(demo),
      api().post("/api/v1/staff").set(demo).send({}),
      api().patch("/api/v1/auth/me").set(demo).send({ name: "Hacked" }),
      api().post("/api/v1/auth/change-password").set(demo).send({ currentPassword: DEMO_ADMIN_PASSWORD, newPassword: "something-else" }),
    ]) {
      const res = await req.expect(403);
      expect(res.body.error.code).toBe("DEMO_READ_ONLY");
    }
    const after = (await api().get("/api/v1/members").set(admin).expect(200)).body.data;
    expect(after).toEqual(before);
    // The public password still works.
    await api().post("/api/v1/auth/login").send({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD }).expect(200);
  });

  it("cannot see visitors' personal data", async () => {
    await api().get("/api/v1/users").set(demo).expect(403);
    await api().get("/api/v1/contact").set(demo).expect(403);
    await api().get("/api/v1/newsletter").set(demo).expect(403);
    await api().get("/api/v1/metrics/days?userId=000000000000000000000000").set(demo).expect(403);
  });

  it("no spelling of a hidden route gets through (case, slashes, encoding)", async () => {
    const victim = await makeUser("member", { name: "Private Person", email: "private.person@secret.example" });
    await api()
      .post("/api/v1/contact")
      .send({ name: "Private Person", email: "private.person@secret.example", message: "Call me on +994501112233 please" })
      .expect(201);
    await api().post("/api/v1/newsletter").send({ email: "private.person@secret.example" }).expect(201);
    // The real admin does see them: the fixtures are really there.
    for (const path of ["/api/v1/users?limit=100", "/api/v1/contact", "/api/v1/newsletter"]) {
      expect((await api().get(path).set(admin).expect(200)).text).toContain("private.person@secret.example");
    }

    const spellings = (name: string) => {
      const upper = name.toUpperCase();
      const capital = name[0].toUpperCase() + name.slice(1);
      const hex = (c: string) => "%" + c.charCodeAt(0).toString(16).toUpperCase();
      return [
        `/api/v1/${name}`,
        `/api/v1/${capital}`,
        `/api/v1/${upper}`,
        `/API/V1/${upper}`,
        `/api/v1/${name}/`,
        `/api/v1/${capital}/`,
        `/api/v1/${name}//`,
        `/api/v1//${name}`,
        `//api/v1/${name}`,
        `/api//v1/${capital}`,
        `/api/v1/${hex(name[0])}${name.slice(1)}`, // %75sers
        `/api/v1/${hex(capital[0])}${name.slice(1)}`, // %55sers
        `/api/v1%2F${name}`,
        `/api%2Fv1%2F${capital}`,
        `/api/v1/%2F${name}`,
        `/api/v1/${name}%2F`,
        `/api/v1/./${name}`,
        `/api/v1/members/../${name}`,
        `/api/v1/members/%2E%2E/${capital}`,
        `/api/v1/${name};a=b`,
        `/api/v1/${name}?limit=100`,
        `/api/v1/${capital}?limit=100&userId=${victim.id}`,
      ];
    };
    const paths = [
      ...spellings("users"),
      ...spellings("contact"),
      ...spellings("newsletter"),
      `/api/v1/users/${victim.id}`,
      `/api/v1/Users/${victim.id}`,
      `/api/v1/USERS/${victim.id}/`,
      `/api/v1/%55sers/${victim.id}`,
      `/api/v1/users%2F${victim.id}`,
      `/api/v1//Users//${victim.id}`,
      // Another account's metrics, by every route that takes ?userId.
      `/api/v1/metrics/days?userId=${victim.id}`,
      `/api/v1/Metrics/Days?userId=${victim.id}`,
      `/api/v1/METRICS/SUMMARY/?userId=${victim.id}`,
      `/api/v1/metrics/aggregate?userId=${victim.id}`,
      `/api/v1/metrics/series?date=${today()}&userId=${victim.id}`,
      `/api/v1/metrics/days/${today()}?userId=${victim.id}`,
    ];
    for (const path of paths) {
      for (const method of ["get", "head"] as const) {
        const res = await api()[method](path).set(demo);
        // Refused, or simply not a route. Never an answer.
        expect([400, 403, 404], `${method.toUpperCase()} ${path} -> ${res.status}`).toContain(res.status);
        expect(res.text ?? "", path).not.toContain("secret.example");
        expect(res.text ?? "", path).not.toContain("Private Person");
        expect(res.text ?? "", path).not.toContain("994501112233");
      }
    }
    // The spellings Express itself treats as the same route are refused as such, not "not found".
    for (const path of ["/api/v1/Users", "/api/v1/USERS/", `/api/v1/Users/${victim.id}`, "/api/v1/Contact", "/api/v1/NEWSLETTER", "/API/V1/Newsletter/"]) {
      await api().get(path).set(demo).expect(403);
    }
  });

  it("is denied by default: only the allow-listed reads answer, in any spelling", async () => {
    for (const path of [
      "/api/v1/auth/me",
      "/api/v1/Auth/Me/",
      "/api/v1/members",
      "/api/v1/MEMBERS/",
      "/api/v1/staff",
      "/api/v1/admin/stats",
      "/api/v1/admin/activity",
      "/api/v1/metrics/summary",
      "/api/v1/metrics/days",
      "/api/v1/plan/today",
    ]) {
      await api().get(path).set(demo).expect(200);
    }
    // Its own metrics by id are its own; that is not "another user".
    const me = (await api().get("/api/v1/auth/me").set(demo).expect(200)).body.data;
    await api().get(`/api/v1/metrics/days?userId=${me.id}`).set(demo).expect(200);
    // Public pages answer the demo token exactly as they answer an anonymous visitor (no admin extras).
    for (const path of ["/api/v1/programs", "/api/v1/coaches", "/api/v1/pricing-plans"]) {
      const anon = await api().get(path).expect(200);
      const asDemo = await api().get(path).set(demo).expect(200);
      expect(asDemo.body).toEqual(anon.body);
    }
  });

  it("writes are refused in every spelling as well", async () => {
    const victim = await makeUser("member");
    for (const req of [
      api().patch(`/api/v1/Users/${victim.id}`).set(demo).send({ role: "admin" }),
      api().delete(`/api/v1/USERS/${victim.id}/`).set(demo),
      api().post("/api/v1/Members/").set(demo).send(card),
      api().post("/api/v1/PROGRAMS").set(demo).send({}),
      api().post("/api/v1/Coaches").set(demo).send({}),
      api().post("/api/v1/Pricing-Plans").set(demo).send({}),
      api().put(`/api/v1/Metrics/Days/${today()}`).set(demo).send({ steps: 1 }),
      api().post("/api/v1/metrics/batch").set(demo).send({ days: [{ date: today(), steps: 1 }] }),
    ]) {
      const res = await req.expect(403);
      expect(res.body.error.code).toBe("DEMO_READ_ONLY");
    }
    await api().get(`/api/v1/users/${victim.id}`).set(admin).expect(200);
  });

  it("real admins keep full rights", async () => {
    await api().post("/api/v1/members").set(admin).send(card).expect(201);
    await api().get("/api/v1/users").set(admin).expect(200);
    await api().get("/api/v1/Users/").set(admin).expect(200);
    const found = await api().get("/api/v1/users?q=private.person").set(admin).expect(200);
    expect(found.body.data.map((u: { email: string }) => u.email)).toContain("private.person@secret.example");
    await api().get("/api/v1/contact").set(admin).expect(200);
    await api().get("/api/v1/newsletter").set(admin).expect(200);
    const someone = await makeUser("member");
    await api().get(`/api/v1/metrics/days?userId=${someone.id}`).set(admin).expect(200);
    await api().patch(`/api/v1/users/${someone.id}`).set(admin).send({ name: "Renamed" }).expect(200);
  });
});
