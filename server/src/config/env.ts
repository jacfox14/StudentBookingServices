import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default("sbs_dev"),
  DB_USER: z.string().default("root"),
  DB_PASS: z.string().default("dev"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_TTL: z.string().default("12h"),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
