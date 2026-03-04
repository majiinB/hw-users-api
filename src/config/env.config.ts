import * as dotenv from "dotenv";
import * as z from "zod";

dotenv.config();

/**
 * Environment configuration for the Heron Wellnest Authentication API.
 *
 * This module defines the environment variables required for the application,
 * validates them using Zod, and exports them for use throughout the application.
 *
 * @file env.config.ts
 * @description Configuration for environment variables.
 * 
 * Usage:
 * - Imported in `app.ts` to access environment variables.
 * - Validates required variables and provides defaults where applicable.
 *
 * @author Arthur M. Artugue
 * @created 2025-08-17
 * @updated 2025-08-29
 */
export const envSchema = z.object({
  // Application environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),
  
  // Database configuration
  DB_HOST : z.string().default("localhost"),
  DB_PORT : z.coerce.number().default(3306),
  DB_USER : z.string().min(1, "DB_USER is required").default("root"),
  DB_PASSWORD : z.string().optional().default(""),
  DB_NAME : z.string().min(1, "DB_NAME is required").default("heron_wellnest_db"),

  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required").default('fake-client-id.apps.googleusercontent.com'),
  GOOGLE_EMAIL_DOMAIN: z.string().min(1, "GOOGLE_EMAIL_DOMAIN is required").default("umak.edu.ph"),
  
  // Security
  JWT_SECRET: z.string().min(32).optional(), // for HS256
  JWT_PRIVATE_KEY: z.string().optional(), // for RS256
  JWT_PUBLIC_KEY: z.string().optional(),  // for RS256
  JWT_ACCESS_TOKEN_TTL: z.string().default("15m"), // 15 minutes
  JWT_REFRESH_TOKEN_TTL: z.string().default("7d"), // 7 days
  JWT_ISSUER: z.string().default("heron-wellnest-auth-api"),
  JWT_AUDIENCE: z.string().default("heron-wellnest-users"),
  JWT_ALGORITHM: z.enum(["HS256", "RS256"]).default("HS256"),

  // CORS
  CORS_ALLOWED_ORIGINS: z.string().min(1, "CORS_ALLOWED_ORIGINS is required"),
}).superRefine((env, ctx) => {
  if (env.JWT_ALGORITHM === "HS256" && !env.JWT_SECRET) {
    ctx.addIssue({
      path: ["JWT_SECRET"],
      message: "JWT_SECRET is required when using HS256",
      code: z.ZodIssueCode.custom,
    });
  }

  if (env.JWT_ALGORITHM === "RS256") {
    if (!env.JWT_PRIVATE_KEY) {
      ctx.addIssue({
        path: ["JWT_PRIVATE_KEY_PATH"],
        message: "JWT_PRIVATE_KEY_PATH is required when using RS256",
        code: z.ZodIssueCode.custom,
      });
    }
    if (!env.JWT_PUBLIC_KEY) {
      ctx.addIssue({
        path: ["JWT_PUBLIC_KEY_PATH"],
        message: "JWT_PUBLIC_KEY_PATH is required when using RS256",
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

