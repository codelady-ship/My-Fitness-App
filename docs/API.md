# Pulsa API — contract v1

Backend for **Pulsa — Your Personal Heart Coach** (cardio coaching) plus the
original My-Fitness gym-admin features (members / membership cards, staff,
activity). Code lives in `backend/`.

- Base URL: `{API_URL}/api/v1` (local: `http://localhost:4000/api/v1`)
- Format: JSON in, JSON out (`Content-Type: application/json`)
- Dates: calendar days are `YYYY-MM-DD` strings (the user's local day);
  timestamps are ISO 8601 UTC strings.
- IDs: every resource has a string `id` (24-char hex). Never `_id`.
- Machine-readable spec: `GET /api/v1/openapi.json`

---

## 1. Conventions

### Success envelope

```json
{ "data": { } }
```

List endpoints add `meta`:

```json
{
  "data": [ ],
  "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

`DELETE` and logout return **204 No Content** (empty body).

### Pagination

Query `?page=1&limit=20` (page ≥ 1, 1 ≤ limit ≤ 100; defaults 1 and 20).
Lists also accept `sort=<field>` or `sort=-<field>` (descending) where noted.

### Error envelope

Every error, on every route, has this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [ { "path": "email", "message": "Invalid email" } ]
  }
}
```

| HTTP | `code`              | When                                        |
|------|---------------------|---------------------------------------------|
| 400  | `VALIDATION_ERROR`  | body / query / params fail validation (`details` lists fields) |
| 400  | `BAD_REQUEST`       | malformed JSON, bad id                      |
| 401  | `UNAUTHORIZED`      | missing / invalid / expired access token, wrong credentials |
| 403  | `FORBIDDEN`         | authenticated but role not allowed          |
| 404  | `NOT_FOUND`         | resource or route does not exist            |
| 409  | `CONFLICT`          | duplicate (email already registered, slug taken, …) |
| 429  | `RATE_LIMITED`      | too many requests (see `Retry-After` header) |
| 500  | `INTERNAL_ERROR`    | unexpected server error                     |

### Auth

- `Authorization: Bearer <accessToken>` on protected routes.
- **Access token**: JWT (HS256), lifetime 15 min (`JWT_ACCESS_TTL`).
  Payload: `{ sub: userId, role }`.
- **Refresh token**: opaque random string, lifetime 30 days
  (`JWT_REFRESH_TTL_DAYS`), stored hashed on the server, **rotated** on every
  refresh (the old one stops working). Store it client-side (e.g.
  `localStorage` or memory) and call `/auth/refresh` when a request returns 401.
- Passwords hashed with bcrypt (cost 10). Password rule: 8–128 chars.

Roles: `member` (default on register), `coach`, `admin`.

Legend below: 🌐 public · 🔑 any logged-in user · 🧑‍🏫 coach or admin · 🛡️ admin only.

### Rate limits (per IP)

| Scope                              | Limit            |
|------------------------------------|------------------|
| all `/api/v1/*`                    | 300 / 15 min     |
| `/auth/login`, `/auth/register`, `/auth/refresh` | 20 / 15 min |
| `POST /contact`, `POST /newsletter`| 10 / hour        |

Headers `RateLimit-*` (draft-7) are returned.

### CORS

Allowed origins come from env `CORS_ORIGINS` (comma-separated), e.g.
`http://localhost:3000,https://my-fitness-app-tau-drab.vercel.app`.

---

## 2. Resource shapes

### User
```json
{
  "id": "665f…",
  "name": "Aysel Aliyeva",
  "email": "aysel@pulsa.example",
  "role": "member",
  "avatarUrl": "",
  "birthDate": "1995-02-15",
  "gender": "female",
  "goal": "Lower resting heart rate",
  "programId": "665f…",
  "coachId": "665f…",
  "createdAt": "2026-11-01T10:00:00.000Z",
  "updatedAt": "2026-11-01T10:00:00.000Z"
}
```
`birthDate`, `gender`, `goal`, `programId`, `coachId` may be `null`.

### Program
```json
{
  "id": "…",
  "slug": "zone-2-foundations",
  "title": "Zone 2 Foundations",
  "summary": "Build an aerobic base with low-intensity cardio.",
  "description": "Longer text…",
  "level": "beginner",
  "focus": "endurance",
  "durationWeeks": 6,
  "sessionsPerWeek": 4,
  "minutesPerSession": 40,
  "targetZone": { "minPct": 60, "maxPct": 70 },
  "coachId": "…",
  "imageUrl": "",
  "isPublished": true,
  "enrolledCount": 1840,
  "createdAt": "…", "updatedAt": "…"
}
```
`level`: `beginner | intermediate | advanced`.
`focus`: `endurance | fat-burn | hiit | recovery | heart-health`.
`targetZone` is % of max heart rate.

### Coach
```json
{
  "id": "…",
  "name": "Leyla Taghizade",
  "title": "Head Cardio Coach",
  "bio": "…",
  "specialties": ["Zone 2", "Marathon prep"],
  "yearsExperience": 9,
  "rating": 4.9,
  "reviewsCount": 312,
  "avatarUrl": "",
  "initials": "LT",
  "userId": null,
  "isActive": true,
  "createdAt": "…", "updatedAt": "…"
}
```

### PricingPlan
```json
{
  "id": "…",
  "slug": "pro",
  "name": "Pro",
  "tagline": "Daily adaptive plan + coach chat",
  "priceMonthly": 19,
  "priceYearly": 182,
  "currency": "USD",
  "features": ["Daily adaptive plan", "Heart-rate zones", "Coach chat"],
  "highlighted": true,
  "order": 2,
  "isActive": true
}
```

### MetricDay (one per user per calendar day)
```json
{
  "id": "…",
  "userId": "…",
  "date": "2026-11-17",
  "restingBpm": 72,
  "steps": 24000,
  "recoveryScore": 1.32,
  "hrvMs": 58,
  "sleepMinutes": 440,
  "activeMinutes": 52,
  "heartRate": [ { "t": "06:00", "bpm": 64 }, { "t": "06:15", "bpm": 71 } ],
  "source": "manual",
  "createdAt": "…", "updatedAt": "…"
}
```
- `restingBpm` 25–220 (integer), `steps` 0–200000 (integer),
  `recoveryScore` 0–3 (ratio vs. personal baseline, 1.00 = baseline,
  shown as e.g. "1.32 recovery"), `hrvMs` 0–300, `sleepMinutes` 0–1440,
  `activeMinutes` 0–1440 — all optional except `date`.
- `heartRate`: optional series, ≤ 1440 points, `t` = `HH:mm` local time,
  `bpm` 25–240. Sorted by `t` on save, duplicate `t` keeps the last one.
- `source`: `manual | device | seed`.
- `heartRate` is omitted from list responses unless `includeSeries=true`.

### Member (gym admin — "membership card")
```json
{
  "id": "…",
  "memberCode": "C123456",
  "fullName": "Elvin Mammadov",
  "email": "elvin@myfitness.example",
  "phone": "+994 50 123 45 67",
  "gender": "male",
  "birthDate": "1990-05-12",
  "image": "/download2.jpg",
  "membershipType": "Year",
  "status": "active",
  "remainingAccesses": 5,
  "startDate": "2026-07-20",
  "endDate": "2027-07-20",
  "lastVisit": "2026-11-16T08:12:00.000Z",
  "checkInHistory": ["2026-11-16T08:12:00.000Z"],
  "height": 180,
  "weight": 78,
  "goals": "Increase muscle mass",
  "coach": "Rauf Gasimov",
  "notes": "Good progress on bench press.",
  "isBlacklisted": false,
  "userId": null,
  "createdAt": "…", "updatedAt": "…"
}
```
`membershipType`: `Year | Monthly`. `status`: `active | expired | passive`.
Field names match the frontend `ICard` interface (`owner` = `fullName`,
`id` in the old store = `memberCode`).

### Staff
```json
{
  "id": "…",
  "firstName": "Leyla",
  "lastName": "Taghizade",
  "email": "leyla.taghizade@myfitness.example",
  "phone": "+994 50 200 10 01",
  "birthDate": "1991-03-08",
  "gender": "female",
  "image": "/image.jpg",
  "jobType": "Trainer",
  "createdAt": "…", "updatedAt": "…"
}
```
`jobType`: `Trainer | Instructor | Manager | Receptionist`.
Old frontend names: `FName`→`firstName`, `Lname`→`lastName`, `tel`→`phone`,
`birth`→`birthDate`.

### ContactMessage
```json
{
  "id": "…", "name": "…", "email": "…", "subject": "Programs",
  "message": "…", "status": "new", "createdAt": "…", "updatedAt": "…"
}
```
`status`: `new | read | archived`.

### NewsletterSubscriber
```json
{ "id": "…", "email": "…", "status": "subscribed", "createdAt": "…" }
```

---

## 3. Endpoints

### Health
| Method | Path | Access | Response |
|---|---|---|---|
| GET | `/health` | 🌐 | `{ "data": { "status": "ok", "db": "up", "uptime": 12.3 } }` |
| GET | `/openapi.json` | 🌐 | OpenAPI 3.1 document |

### Auth
| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | 🌐 | `{ name, email, password }` | **201** `{ data: { user, accessToken, refreshToken, expiresIn } }` |
| POST | `/auth/login` | 🌐 | `{ email, password }` | 200 same as register |
| POST | `/auth/refresh` | 🌐 | `{ refreshToken }` | 200 same as register (new pair) |
| POST | `/auth/logout` | 🌐 | `{ refreshToken }` | 204 |
| GET | `/auth/me` | 🔑 | — | `{ data: User }` |
| PATCH | `/auth/me` | 🔑 | any of `{ name, avatarUrl, birthDate, gender, goal, coachId }` | `{ data: User }` |
| POST | `/auth/change-password` | 🔑 | `{ currentPassword, newPassword }` | 204 (all refresh tokens revoked) |

`expiresIn` = access-token lifetime in seconds. Login with a wrong email or
password returns 401 `UNAUTHORIZED` (same message for both).

### Users (admin)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/users` | 🛡️ | `?page&limit&role&q` (q matches name/email) |
| GET | `/users/:id` | 🛡️ | |
| PATCH | `/users/:id` | 🛡️ | `{ name, role, coachId, programId }` |
| DELETE | `/users/:id` | 🛡️ | 204, also deletes the user's metrics |

### Programs
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/programs` | 🌐 | `?page&limit&level&focus&q&sort` (`sort`: `title`, `durationWeeks`, `enrolledCount`, `createdAt`; default `-enrolledCount`). Only published unless caller is coach/admin. |
| GET | `/programs/:idOrSlug` | 🌐 | accepts id or slug |
| POST | `/programs` | 🧑‍🏫 | Program fields (`slug` optional — generated from title) → 201 |
| PATCH | `/programs/:id` | 🧑‍🏫 | partial |
| DELETE | `/programs/:id` | 🛡️ | 204 |
| POST | `/programs/:id/enroll` | 🔑 | sets `user.programId`, increments `enrolledCount` → `{ data: User }` |
| DELETE | `/programs/:id/enroll` | 🔑 | leave program → `{ data: User }` |

### Coaches
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/coaches` | 🌐 | `?page&limit&q&specialty&sort` (default `-rating`) — active only for public |
| GET | `/coaches/:id` | 🌐 | includes `programs: Program[]` (their published programs) |
| POST | `/coaches` | 🛡️ | → 201 |
| PATCH | `/coaches/:id` | 🛡️ | partial |
| DELETE | `/coaches/:id` | 🛡️ | 204 |

### Pricing plans
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/pricing-plans` | 🌐 | not paginated, sorted by `order`; active only |
| GET | `/pricing-plans/:idOrSlug` | 🌐 | |
| POST | `/pricing-plans` | 🛡️ | → 201 |
| PATCH | `/pricing-plans/:id` | 🛡️ | |
| DELETE | `/pricing-plans/:id` | 🛡️ | 204 |

### Heart metrics
All 🔑. They act on the **caller's own data**. GET routes accept
`?userId=<id>` to read another user's data:
- **admin**: any user (404 if the user does not exist);
- **coach**: only users whose `coachId` is that coach's own profile (the
  Coach whose `userId` is the coach's account); anyone else → 403
  `FORBIDDEN` (also for unknown ids, so ids cannot be probed);
- **member**: 403.

| Method | Path | Body / Query | Response |
|---|---|---|---|
| PUT | `/metrics/days/:date` | MetricDay fields (no `date`) | upsert → 200 `{ data: MetricDay }` |
| POST | `/metrics/batch` | `{ days: MetricDay[] }` (1–366 days, each with `date`) | 200 `{ data: { upserted: 30 } }` |
| GET | `/metrics/days` | `?from&to&includeSeries&page&limit` (default last 30 days, newest first, limit up to 366) | list of MetricDay |
| GET | `/metrics/days/:date` | — | `{ data: MetricDay }` (with `heartRate`) or 404 |
| DELETE | `/metrics/days/:date` | — | 204 |
| GET | `/metrics/summary` | `?days=7` (1–90, window ending today or at `to`) `&to` | see below |
| GET | `/metrics/aggregate` | `?from&to&interval=day\|week\|month` (max 366 days) | see below |
| GET | `/metrics/series` | `?date=YYYY-MM-DD&bucket=15` (minutes, 1–240; default 15) | see below |

`PUT` merges: fields you omit keep their stored value; send
`heartRate: []` to clear the series.

**`GET /metrics/summary`** — feeds the "Cardio Insights" gauge card:
```json
{
  "data": {
    "window": { "from": "2026-11-11", "to": "2026-11-17", "days": 7, "daysWithData": 7 },
    "latest": { "date": "2026-11-17", "restingBpm": 72, "steps": 24000, "recoveryScore": 1.32 },
    "averages": { "restingBpm": 70.4, "steps": 11250, "recoveryScore": 1.08, "hrvMs": 55.1, "sleepMinutes": 431 },
    "totals": { "steps": 78750, "activeMinutes": 320 },
    "trend": { "restingBpm": -1.6, "steps": 840, "recoveryScore": 0.05 },
    "gauge": { "value": 72, "min": 0, "max": 100, "fraction": 0.72, "ticks": 30, "litTicks": 22, "unit": "bpm" }
  }
}
```
- `latest` = most recent day in the window that has data (fields may be `null`).
- `trend` = average of the second half of the window minus the first half
  (negative restingBpm trend is good). `null` when not enough data.
- `gauge.fraction` = `clamp(value / max, 0, 1)`, `litTicks` = `round(fraction × ticks)`.
- All `null` (and `daysWithData: 0`) when there is no data — never 404.

**`GET /metrics/aggregate`** — feeds trend charts:
```json
{
  "data": {
    "interval": "week",
    "from": "2026-10-01", "to": "2026-11-17",
    "buckets": [
      {
        "start": "2026-09-28", "end": "2026-10-04", "days": 4,
        "restingBpm": { "avg": 71.2, "min": 68, "max": 75 },
        "steps": { "avg": 10400, "total": 41600 },
        "recoveryScore": { "avg": 1.04 },
        "heartRate": { "min": 52, "max": 168, "avg": 88.3 }
      }
    ]
  }
}
```
Weeks start on Monday; month buckets use the calendar month. Buckets with no
data are omitted. Values rounded to 1 decimal (recovery to 2).

**`GET /metrics/series`** — feeds the heart-rate line chart:
```json
{
  "data": {
    "date": "2026-11-17",
    "bucketMinutes": 15,
    "points": [ { "t": "06:00", "bpm": 66 }, { "t": "06:15", "bpm": 74 } ],
    "stats": { "min": 52, "max": 151, "avg": 81.6, "count": 96 }
  }
}
```
Each point is the rounded average of the raw points inside that bucket.
Empty `points` and `null` stats when the day has no series.

### Daily adaptive plan
| Method | Path | Access | Response |
|---|---|---|---|
| GET | `/plan/today` | 🔑 | plan for today (server UTC date, or `?date=YYYY-MM-DD`) |

```json
{
  "data": {
    "date": "2026-11-17",
    "intensity": "moderate",
    "headline": "Steady cardio day",
    "targetZone": { "name": "Zone 3", "minPct": 70, "maxPct": 80, "minBpm": 133, "maxBpm": 152 },
    "durationMinutes": 40,
    "stepsGoal": 10500,
    "sessions": [
      { "title": "Warm-up walk", "minutes": 8, "zone": "Zone 1" },
      { "title": "Tempo intervals", "minutes": 24, "zone": "Zone 3" },
      { "title": "Cool-down", "minutes": 8, "zone": "Zone 1" }
    ],
    "reasons": [
      "Recovery 1.08 is near your baseline.",
      "Resting heart rate 70 bpm is in line with your 7-day average."
    ],
    "basedOn": { "date": "2026-11-16", "restingBpm": 70, "recoveryScore": 1.08, "baselineRestingBpm": 70.4, "avgSteps": 10000, "maxHr": 190 },
    "program": { "id": "…", "title": "Zone 2 Foundations" }
  }
}
```
`intensity`: `rest | easy | moderate | hard`. Rules (in order):
1. No metrics yet → `easy` (getting-started plan).
2. `recoveryScore < 0.8` **or** resting bpm ≥ 7-day baseline + 7 → `rest`.
3. `recoveryScore < 0.95` **or** resting bpm ≥ baseline + 4 → `easy`.
4. `recoveryScore ≥ 1.2` **and** resting bpm ≤ baseline + 1 → `hard`.
5. otherwise → `moderate`.

Max HR = `220 − age` (age from `birthDate`, 30 if unknown). Zones (% of max HR):
rest 50–60, easy 60–70, moderate 70–80, hard 80–90. `stepsGoal` = 7-day average
steps × (0.8 rest / 1.0 easy / 1.05 moderate / 1.1 hard), rounded to 500,
minimum 4000, default 8000 without data.

### Contact & newsletter
| Method | Path | Access | Body / Notes |
|---|---|---|---|
| POST | `/contact` | 🌐 | `{ name (2–80), email, subject? (≤120), message (10–2000) }` → **201** `{ data: { id, status: "new", createdAt } }` |
| GET | `/contact` | 🛡️ | `?page&limit&status` newest first |
| PATCH | `/contact/:id` | 🛡️ | `{ status }` |
| DELETE | `/contact/:id` | 🛡️ | 204 |
| POST | `/newsletter` | 🌐 | `{ email }` → **201** new, **200** already subscribed (re-subscribes if unsubscribed). `{ data: { email, status: "subscribed" } }` |
| POST | `/newsletter/unsubscribe` | 🌐 | `{ email }` → 200 `{ data: { email, status: "unsubscribed" } }` (200 even if unknown) |
| GET | `/newsletter` | 🛡️ | `?page&limit&status` |

### Public stats (hero avatars "+12.4k")
| Method | Path | Access | Response |
|---|---|---|---|
| GET | `/stats/public` | 🌐 | `{ data: { members: 12400, membersLabel: "+12.4k", coaches: 6, programs: 6, featuredInitials: ["AR","MK","JS","TL"] } }` |

`members` = registered users + `PUBLIC_MEMBER_BASE` env (default 12400, a
marketing offset; set 0 to show the real count).

### Gym admin — members (membership cards)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/members` | 🧑‍🏫 | `?page&limit&q&status&membershipType&coach&blacklisted&sort` (`q` matches name/email/phone/memberCode; `sort` default `-createdAt`) |
| GET | `/members/:id` | 🧑‍🏫 | id or `memberCode` |
| POST | `/members` | 🛡️ | Member fields; `memberCode` auto (`C` + 6 digits) if omitted → 201 |
| PATCH | `/members/:id` | 🛡️ | partial |
| DELETE | `/members/:id` | 🛡️ | 204 |
| POST | `/members/:id/check-in` | 🧑‍🏫 | records a visit now: pushes to `checkInHistory`, sets `lastVisit`, decrements `remainingAccesses`. 409 `CONFLICT` if blacklisted, not `active`, or 0 accesses left. → `{ data: Member }` |

### Gym admin — staff
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/staff` | 🧑‍🏫 | `?page&limit&q&jobType&sort` |
| GET | `/staff/:id` | 🧑‍🏫 | |
| POST | `/staff` | 🛡️ | → 201 |
| PATCH | `/staff/:id` | 🛡️ | |
| DELETE | `/staff/:id` | 🛡️ | 204 |

### Gym admin — dashboard & activity
| Method | Path | Access | Response |
|---|---|---|---|
| GET | `/admin/stats` | 🧑‍🏫 | `?remainingLimit=20` (1–100) caps the `remainingAccesses` list (sorted by `memberCode`; `members.total` is the full count). See below. |
| GET | `/admin/activity` | 🧑‍🏫 | `?days=14` (1–90) → `{ data: [ { "date": "2026-11-04", "checkIns": 3, "registrations": 1 } ] }` one entry per day, oldest first, zero-filled |

```json
{
  "data": {
    "members": { "total": 10, "active": 4, "expired": 4, "passive": 2, "blacklisted": 1, "newLast30Days": 3, "expiringNext7Days": 1 },
    "membershipTypes": { "Year": 3, "Monthly": 7 },
    "staff": { "total": 8, "byJobType": { "Trainer": 3, "Instructor": 3, "Manager": 1, "Receptionist": 1 } },
    "users": { "total": 25, "member": 20, "coach": 4, "admin": 1 },
    "remainingAccesses": [ { "memberCode": "C123456", "fullName": "Elvin Mammadov", "remainingAccesses": 5 } ],
    "contact": { "new": 2 },
    "newsletter": { "subscribed": 14 }
  }
}
```

---

## 4. Stability

This contract is v1. Additive changes only (new optional fields / endpoints).
Breaking changes would go to `/api/v2`.
