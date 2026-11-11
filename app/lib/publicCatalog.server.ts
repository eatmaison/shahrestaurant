import "server-only";
import { neon } from "@neondatabase/serverless";
import { readCatalogSnapshot } from "./catalogSnapshot";
import type { PublicCatalogSnapshot } from "./publicCatalogTypes";

/** Never imports the schema/bootstrap/session modules or initializes an empty database. */
export async function loadPublicCatalog(): Promise<PublicCatalogSnapshot | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return null;
    return await readCatalogSnapshot(async (queries, signal) => {
      const sql = neon(connectionString);
      return sql.transaction(queries.map(query => sql.query(query.text, [...query.params])), {
        readOnly: true,
        isolationLevel: "RepeatableRead",
        fetchOptions: { signal, cache: "no-store" },
      });
    });
  } catch {
    return null;
  }
}
