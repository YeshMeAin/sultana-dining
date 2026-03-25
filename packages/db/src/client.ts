import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Singleton pattern — prevents connection pool exhaustion in Next.js dev (hot reload)
const globalForDb = globalThis as unknown as {
  _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function createDb() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");
  const sql = postgres(connectionString);
  return drizzle(sql, { schema });
}

export const db = globalForDb._db ?? createDb();

if (process.env["NODE_ENV"] !== "production") {
  globalForDb._db = db;
}

export type Database = typeof db;
