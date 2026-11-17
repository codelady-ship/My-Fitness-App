import express, { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { dbState } from "./db";
import { ApiError } from "./lib/errors";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { makeLimiters, type RateLimitOptions } from "./middleware/rateLimit";
import { buildOpenApi } from "./openapi";
import { authRouter } from "./routes/auth";
import { coachesRouter } from "./routes/coaches";
import { contactRouter, newsletterRouter } from "./routes/contact";
import { adminRouter, membersRouter, staffRouter } from "./routes/gym";
import { metricsRouter } from "./routes/metrics";
import { planRouter } from "./routes/plan";
import { pricingRouter } from "./routes/pricing";
import { programsRouter } from "./routes/programs";
import { statsRouter } from "./routes/stats";
import { usersRouter } from "./routes/users";

export type AppOptions = {
  rateLimit?: RateLimitOptions;
  corsOrigins?: string[];
};

export function createApp(opts: AppOptions = {}) {
  const app = express();
  const limiters = makeLimiters(opts.rateLimit ?? { enabled: config.rateLimitEnabled });
  const origins = opts.corsOrigins ?? config.corsOrigins;

  app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Non-browser clients (curl, server-to-server) send no Origin header.
        if (!origin || origins.includes("*") || origins.includes(origin)) return cb(null, true);
        cb(new ApiError(403, "FORBIDDEN", `Origin ${origin} is not allowed`));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "512kb" }));

  app.get("/", (_req, res) => {
    res.json({ data: { name: "Pulsa API", version: "1.0.0", docs: "/api/v1/openapi.json", health: "/api/v1/health" } });
  });

  const api = Router();
  api.use(limiters.global);
  api.get("/health", (_req, res) => {
    res.json({ data: { status: "ok", db: dbState(), uptime: Math.round(process.uptime() * 10) / 10 } });
  });
  api.get("/openapi.json", (_req, res) => {
    res.json(buildOpenApi());
  });
  api.use("/auth", authRouter(limiters.auth));
  api.use("/users", usersRouter);
  api.use("/programs", programsRouter);
  api.use("/coaches", coachesRouter);
  api.use("/pricing-plans", pricingRouter);
  api.use("/metrics", metricsRouter);
  api.use("/plan", planRouter);
  api.use("/contact", contactRouter(limiters.forms));
  api.use("/newsletter", newsletterRouter(limiters.forms));
  api.use("/stats", statsRouter);
  api.use("/members", membersRouter);
  api.use("/staff", staffRouter);
  api.use("/admin", adminRouter);

  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
