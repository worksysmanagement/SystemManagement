import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibSql } from "drizzle-orm/libsql";
import { createClient as createNodeClient } from "@libsql/client";
import * as schema from "@/db/schema";
import path from "path";

let localDbInstance: ReturnType<typeof drizzleLibSql<typeof schema>> | null = null;

/**
 * Obtain Drizzle database instance.
 * Supports Cloudflare D1 bindings in edge runtime or local SQLite database.
 */
export function getDb(d1Binding?: any) {
  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }

  if (!localDbInstance) {
    const rawPath = process.env.LOCAL_DB_PATH || process.env.DATABASE_URL || path.join(process.cwd(), "local.sqlite");
    const normalizedPath = rawPath.replace(/\\/g, "/");
    const url = normalizedPath.startsWith("file:") ? normalizedPath : `file:${normalizedPath}`;
    const client = createNodeClient({ url });
    localDbInstance = drizzleLibSql(client, { schema });
  }

  return localDbInstance;
}

/**
 * Creates an isolated in-memory database instance for testing.
 */
export function createTestDb(url = ":memory:") {
  const client = createNodeClient({ url });
  return drizzleLibSql(client, { schema });
}
