import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibSql } from "drizzle-orm/libsql";
import { createClient as createNodeClient } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import * as schema from "@/db/schema";
import path from "path";

let localDbInstance: ReturnType<typeof drizzleLibSql<typeof schema>> | null = null;

/**
 * Obtain Drizzle database instance.
 * In Vercel / Production with Turso, uses @libsql/client/web over HTTPS for 100% serverless compatibility.
 * In local dev and tests, uses @libsql/client with local sqlite / memory.
 */
export function getDb(d1Binding?: any) {
  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }

  if (!localDbInstance) {
    const rawUrl =
      process.env.TURSO_DATABASE_URL ||
      process.env.STORAGE_URL ||
      process.env.TURSO_URL ||
      process.env.DATABASE_URL;
    const rawToken =
      process.env.TURSO_AUTH_TOKEN ||
      process.env.STORAGE_AUTH_TOKEN ||
      process.env.TURSO_TOKEN ||
      process.env.DATABASE_AUTH_TOKEN;

    const tursoUrl = rawUrl ? rawUrl.trim().replace(/^["']|["']$/g, "") : undefined;
    const tursoToken = rawToken ? rawToken.trim().replace(/^["']|["']$/g, "") : undefined;

    if (tursoUrl) {
      const httpUrl = tursoUrl.startsWith("libsql://")
        ? tursoUrl.replace("libsql://", "https://")
        : tursoUrl;

      const client = createWebClient({
        url: httpUrl,
        authToken: tursoToken,
      });
      localDbInstance = drizzleLibSql(client, { schema });
    } else {
      const rawPath = process.env.LOCAL_DB_PATH || path.join(process.cwd(), "local.sqlite");
      const normalizedPath = rawPath.replace(/\\/g, "/");
      const url = normalizedPath.startsWith("file:") ? normalizedPath : `file:${normalizedPath}`;
      const client = createNodeClient({ url });
      localDbInstance = drizzleLibSql(client, { schema });
    }
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
