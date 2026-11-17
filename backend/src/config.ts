import "dotenv/config";
import { z } from "zod";

const DEV_SECRET = "dev-only-insecure-secret-change-me-0123456789";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/pulsa"),
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  RATE_LIMIT_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v !== "false" && v !== "0"),
  PUBLIC_MEMBER_BASE: z.coerce.number().int().min(0).default(12400),
});

const env = schema.parse(process.env);

if (env.NODE_ENV === "production" && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET must be set to at least 32 characters in production");
}

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  mongoUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET && env.JWT_SECRET.length >= 32 ? env.JWT_SECRET : DEV_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtlDays: env.JWT_REFRESH_TTL_DAYS,
  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
  trustProxy: env.TRUST_PROXY,
  rateLimitEnabled: env.RATE_LIMIT_ENABLED,
  publicMemberBase: env.PUBLIC_MEMBER_BASE,
};
