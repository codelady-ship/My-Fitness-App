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

  it("real admins keep full rights", async () => {
    await api().post("/api/v1/members").set(admin).send(card).expect(201);
    await api().get("/api/v1/users").set(admin).expect(200);
  });
});
