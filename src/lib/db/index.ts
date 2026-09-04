import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dbEnv } from "@/config/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __pg?: ReturnType<typeof postgres>;
};

function client() {
  if (!globalForDb.__pg) {
    globalForDb.__pg = postgres(dbEnv().DATABASE_URL, {
      prepare: false, // Supabase transaction pooler
      max: 5,
    });
  }
  return globalForDb.__pg;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function db() {
  return (_db ??= drizzle(client(), { schema }));
}

export { schema };
