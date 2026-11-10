import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { loadEnvFile } from "node:process";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Load local secrets for Windows and other development shells that do not
// automatically read .env. Production environment variables remain supported.
try {
  loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
