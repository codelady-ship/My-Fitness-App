import { beforeAll, describe, expect, it } from "vitest";
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

describe("coaches", () => {
  let coachId = "";

  it("admin creates, public lists and reads", async () => {
    const res = await api().post("/api/v1/coaches").set(admin).send({ name: "Leyla Taghizade", specialties: ["Zone 2"], rating: 4.9 }).expect(201);
    coachId = res.body.data.id;
    expect(res.body.data.initials).toBe("LT");
    await api().post("/api/v1/coaches").set(admin).send({ name: "Rauf Gasimov", rating: 4.5 }).expect(201);
    await api().post("/api/v1/coaches").set(member).send({ name: "Nope" }).expect(403);
    await api().post("/api/v1/coaches").send({ name: "Nope" }).expect(401);

    const list = await api().get("/api/v1/coaches").expect(200);
    expect(list.body.data.map((c: { name: string }) => c.name)).toEqual(["Leyla Taghizade", "Rauf Gasimov"]);
    const bySpecialty = await api().get("/api/v1/coaches?specialty=zone%202").expect(200);
    expect(bySpecialty.body.meta.total).toBe(1);
  });

  it("hides inactive coaches from the public", async () => {
    await api().patch(`/api/v1/coaches/${coachId}`).set(admin).send({ isActive: false }).expect(200);
    await api().get(`/api/v1/coaches/${coachId}`).expect(404);
    await api().get(`/api/v1/coaches/${coachId}`).set(admin).expect(200);
    await api().patch(`/api/v1/coaches/${coachId}`).set(admin).send({ isActive: true }).expect(200);
  });

  it("validates ids", async () => {
    const res = await api().get("/api/v1/coaches/not-an-id").expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  describe("programs", () => {
    let programId = "";

    it("coach creates a program with a generated slug", async () => {
      const res = await api()
        .post("/api/v1/programs")
        .set(coach)
        .send({ title: "Zone 2 Foundations", level: "beginner", focus: "endurance", durationWeeks: 6, sessionsPerWeek: 4, minutesPerSession: 40, targetZone: { minPct: 60, maxPct: 70 }, coachId })
        .expect(201);
      programId = res.body.data.id;
      expect(res.body.data).toMatchObject({ slug: "zone-2-foundations", isPublished: true, enrolledCount: 0, targetZone: { minPct: 60, maxPct: 70 } });
      await api().post("/api/v1/programs").set(member).send({}).expect(403);
    });

    it("rejects a duplicate slug with 409", async () => {
      const res = await api()
        .post("/api/v1/programs")
        .set(coach)
        .send({ title: "Zone 2 Foundations", level: "beginner", focus: "endurance", durationWeeks: 6, sessionsPerWeek: 4, minutesPerSession: 40, targetZone: { minPct: 60, maxPct: 70 } })
        .expect(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("lists with filters, pagination and sort; reads by slug", async () => {
      await api()
        .post("/api/v1/programs")
        .set(coach)
        .send({ title: "Hidden Draft", level: "advanced", focus: "hiit", durationWeeks: 4, sessionsPerWeek: 3, minutesPerSession: 30, targetZone: { minPct: 80, maxPct: 90 }, isPublished: false })
        .expect(201);
      const pub = await api().get("/api/v1/programs").expect(200);
      expect(pub.body.meta.total).toBe(1);
      const staff = await api().get("/api/v1/programs").set(coach).expect(200);
      expect(staff.body.meta.total).toBe(2);
      const filtered = await api().get("/api/v1/programs?level=advanced").set(coach).expect(200);
      expect(filtered.body.data[0].title).toBe("Hidden Draft");
      await api().get("/api/v1/programs?sort=-password").expect(400);
      const bySlug = await api().get("/api/v1/programs/zone-2-foundations").expect(200);
      expect(bySlug.body.data.id).toBe(programId);
      const coachPage = await api().get(`/api/v1/coaches/${coachId}`).expect(200);
      expect(coachPage.body.data.programs).toHaveLength(1);
    });

    it("member enrolls and leaves", async () => {
      const res = await api().post(`/api/v1/programs/${programId}/enroll`).set(member).expect(200);
      expect(res.body.data.programId).toBe(programId);
      await api().post(`/api/v1/programs/${programId}/enroll`).set(member).expect(200); // idempotent
      const p = await api().get(`/api/v1/programs/${programId}`).expect(200);
      expect(p.body.data.enrolledCount).toBe(1);
      const left = await api().delete(`/api/v1/programs/${programId}/enroll`).set(member).expect(200);
      expect(left.body.data.programId).toBeNull();
    });

    it("only admin deletes", async () => {
      await api().delete(`/api/v1/programs/${programId}`).set(coach).expect(403);
      await api().delete(`/api/v1/programs/${programId}`).set(admin).expect(204);
      await api().get(`/api/v1/programs/${programId}`).expect(404);
    });
  });
});

describe("pricing plans", () => {
  it("CRUD with public list sorted by order", async () => {
    await api().post("/api/v1/pricing-plans").set(admin).send({ name: "Pro", priceMonthly: 19, priceYearly: 182, order: 2, highlighted: true }).expect(201);
    const starter = await api().post("/api/v1/pricing-plans").set(admin).send({ name: "Starter", priceMonthly: 0, priceYearly: 0, order: 1 }).expect(201);
    const list = await api().get("/api/v1/pricing-plans").expect(200);
    expect(list.body.data.map((p: { slug: string }) => p.slug)).toEqual(["starter", "pro"]);
    expect(list.body.data[1]).toMatchObject({ currency: "USD", highlighted: true });
    await api().patch(`/api/v1/pricing-plans/${starter.body.data.id}`).set(admin).send({ isActive: false }).expect(200);
    const after = await api().get("/api/v1/pricing-plans").expect(200);
    expect(after.body.data).toHaveLength(1);
    await api().get("/api/v1/pricing-plans/pro").expect(200);
    await api().delete(`/api/v1/pricing-plans/${starter.body.data.id}`).set(admin).expect(204);
  });
});

describe("contact & newsletter", () => {
  it("accepts a contact message and lets admin manage it", async () => {
    const res = await api().post("/api/v1/contact").send({ name: "Ramin", email: "ramin@mail.example", message: "Which program lowers resting HR?" }).expect(201);
    expect(res.body.data.status).toBe("new");
    await api().post("/api/v1/contact").send({ name: "R", email: "x", message: "short" }).expect(400);
    const list = await api().get("/api/v1/contact").set(admin).expect(200);
    expect(list.body.meta.total).toBe(1);
    await api().get("/api/v1/contact").set(member).expect(403);
    const upd = await api().patch(`/api/v1/contact/${res.body.data.id}`).set(admin).send({ status: "read" }).expect(200);
    expect(upd.body.data.status).toBe("read");
  });

  it("subscribes idempotently and unsubscribes", async () => {
    await api().post("/api/v1/newsletter").send({ email: "Reader@Mail.example" }).expect(201);
    const again = await api().post("/api/v1/newsletter").send({ email: "reader@mail.example" }).expect(200);
    expect(again.body.data).toEqual({ email: "reader@mail.example", status: "subscribed" });
    await api().post("/api/v1/newsletter/unsubscribe").send({ email: "reader@mail.example" }).expect(200);
    const list = await api().get("/api/v1/newsletter?status=unsubscribed").set(admin).expect(200);
    expect(list.body.meta.total).toBe(1);
    await api().post("/api/v1/newsletter").send({ email: "reader@mail.example" }).expect(200);
  });

  it("public stats show a compact member label", async () => {
    const res = await api().get("/api/v1/stats/public").expect(200);
    expect(res.body.data.members).toBeGreaterThanOrEqual(12400);
    expect(res.body.data.membersLabel).toBe("+12.4k");
    expect(res.body.data.featuredInitials).toHaveLength(4);
  });
});
