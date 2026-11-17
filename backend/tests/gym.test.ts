import { beforeAll, describe, expect, it } from "vitest";
import { addDays, today } from "../src/lib/dates";
import { seedDatabase } from "../src/seed/data";
import { api, makeUser } from "./helpers";

type Auth = { Authorization: string };
let admin: Auth;
let coach: Auth;
let member: Auth;

beforeAll(async () => {
  admin = (await makeUser("admin")).auth;
  coach = (await makeUser("coach")).auth;
  member = (await makeUser("member")).auth;
});

const newMember = {
  fullName: "Elvin Mammadov",
  email: "elvin@mail.example",
  gender: "male",
  membershipType: "Monthly",
  startDate: today(),
  endDate: addDays(today(), 30),
  remainingAccesses: 2,
  coach: "Rauf Gasimov",
};

describe("members (membership cards)", () => {
  let id = "";
  let code = "";

  it("admin creates a member with an auto code", async () => {
    const res = await api().post("/api/v1/members").set(admin).send(newMember).expect(201);
    id = res.body.data.id;
    code = res.body.data.memberCode;
    expect(code).toMatch(/^C\d{6}$/);
    expect(res.body.data).toMatchObject({ status: "active", isBlacklisted: false, checkInHistory: [] });
    await api().post("/api/v1/members").set(coach).send(newMember).expect(403);
    await api().post("/api/v1/members").set(admin).send({ ...newMember, endDate: addDays(today(), -1) }).expect(400);
  });

  it("coach reads by id or memberCode; members cannot", async () => {
    await api().get(`/api/v1/members/${id}`).set(coach).expect(200);
    const byCode = await api().get(`/api/v1/members/${code.toLowerCase()}`).set(coach).expect(200);
    expect(byCode.body.data.id).toBe(id);
    await api().get("/api/v1/members").set(member).expect(403);
  });

  it("check-in uses an access and stops at zero", async () => {
    const one = await api().post(`/api/v1/members/${id}/check-in`).set(coach).expect(200);
    expect(one.body.data.remainingAccesses).toBe(1);
    expect(one.body.data.checkInHistory).toHaveLength(1);
    expect(one.body.data.lastVisit).toBeTruthy();
    await api().post(`/api/v1/members/${id}/check-in`).set(coach).expect(200);
    const none = await api().post(`/api/v1/members/${id}/check-in`).set(coach).expect(409);
    expect(none.body.error.message).toMatch(/No accesses left/);
  });

  it("blacklisted members cannot check in", async () => {
    await api().patch(`/api/v1/members/${id}`).set(admin).send({ remainingAccesses: 5, isBlacklisted: true }).expect(200);
    const res = await api().post(`/api/v1/members/${id}/check-in`).set(coach).expect(409);
    expect(res.body.error.message).toMatch(/blacklisted/);
  });

  it("lists with search and filters", async () => {
    await api().post("/api/v1/members").set(admin).send({ ...newMember, fullName: "Aysel Aliyeva", email: "aysel@mail.example", status: "expired" }).expect(201);
    const all = await api().get("/api/v1/members?sort=fullName").set(coach).expect(200);
    expect(all.body.data.map((m: { fullName: string }) => m.fullName)).toEqual(["Aysel Aliyeva", "Elvin Mammadov"]);
    const q = await api().get("/api/v1/members?q=aysel").set(coach).expect(200);
    expect(q.body.meta.total).toBe(1);
    const expired = await api().get("/api/v1/members?status=expired").set(coach).expect(200);
    expect(expired.body.meta.total).toBe(1);
    const bl = await api().get("/api/v1/members?blacklisted=true").set(coach).expect(200);
    expect(bl.body.data[0].id).toBe(id);
  });

  it("admin deletes", async () => {
    await api().delete(`/api/v1/members/${id}`).set(admin).expect(204);
    await api().get(`/api/v1/members/${id}`).set(admin).expect(404);
  });
});

describe("staff", () => {
  it("CRUD", async () => {
    const body = { firstName: "Leyla", lastName: "Taghizade", email: "leyla@myfitness.example", gender: "female", jobType: "Trainer" };
    const res = await api().post("/api/v1/staff").set(admin).send(body).expect(201);
    const id = res.body.data.id;
    await api().post("/api/v1/staff").set(admin).send(body).expect(409);
    await api().post("/api/v1/staff").set(admin).send({ ...body, email: "x@y.example", jobType: "Chef" }).expect(400);
    const list = await api().get("/api/v1/staff?jobType=Trainer").set(coach).expect(200);
    expect(list.body.meta.total).toBe(1);
    const upd = await api().patch(`/api/v1/staff/${id}`).set(admin).send({ jobType: "Manager" }).expect(200);
    expect(upd.body.data.jobType).toBe("Manager");
    await api().patch(`/api/v1/staff/${id}`).set(coach).send({ jobType: "Trainer" }).expect(403);
    await api().delete(`/api/v1/staff/${id}`).set(admin).expect(204);
  });
});

describe("seeded dashboard", () => {
  let seededAdmin: Auth;
  let demo: Auth;

  beforeAll(async () => {
    await seedDatabase({ adminEmail: "admin@pulsa.example", adminPassword: "admin-pass-123", demoPassword: "demo-pass-123", light: true });
    const a = await api().post("/api/v1/auth/login").send({ email: "admin@pulsa.example", password: "admin-pass-123" }).expect(200);
    seededAdmin = { Authorization: `Bearer ${a.body.data.accessToken}` };
    const d = await api().post("/api/v1/auth/login").send({ email: "demo@pulsa.example", password: "demo-pass-123" }).expect(200);
    demo = { Authorization: `Bearer ${d.body.data.accessToken}` };
  });

  it("admin stats count the seeded gym", async () => {
    const res = await api().get("/api/v1/admin/stats").set(seededAdmin).expect(200);
    const s = res.body.data;
    expect(s.members).toMatchObject({ total: 10, active: 5, expired: 3, passive: 2, blacklisted: 1 });
    expect(s.membershipTypes).toEqual({ Year: 3, Monthly: 7 });
    expect(s.staff.total).toBe(8);
    expect(s.users).toMatchObject({ admin: 1, coach: 1 });
    expect(s.remainingAccesses).toHaveLength(10);
    expect(s.contact.new).toBe(2);
  });

  it("activity is zero-filled per day", async () => {
    const res = await api().get("/api/v1/admin/activity?days=14").set(seededAdmin).expect(200);
    expect(res.body.data).toHaveLength(14);
    expect(res.body.data.at(-1).date).toBe(today());
    const checkIns = res.body.data.reduce((a: number, r: { checkIns: number }) => a + r.checkIns, 0);
    expect(checkIns).toBeGreaterThan(0);
  });

  it("demo user sees the hero numbers", async () => {
    const res = await api().get("/api/v1/metrics/summary").set(demo).expect(200);
    expect(res.body.data.latest).toMatchObject({ restingBpm: 72, steps: 24000, recoveryScore: 1.32 });
    expect(res.body.data.gauge.litTicks).toBe(22);
    const series = await api().get(`/api/v1/metrics/series?date=${today()}`).set(demo).expect(200);
    expect(series.body.data.points).toHaveLength(96);
    const plan = await api().get("/api/v1/plan/today").set(demo).expect(200);
    expect(plan.body.data.program.title).toBe("Zone 2 Foundations");
    const stats = await api().get("/api/v1/stats/public").expect(200);
    expect(stats.body.data.featuredInitials).toEqual(["AR", "MK", "JS", "TL"]);
  });
});
