import { jwtVerify } from "jose";
import { sql } from "./db";

/** Check the current database role; a valid session alone never grants event access. */
export async function eventAdminId(token: string | undefined): Promise<string | null> {
  if (!token || (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)) return null;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "eattogo-dev-secret-change-me-in-production");
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    const rows = await sql.query("SELECT role FROM users WHERE id = $1", [payload.userId]);
    return rows[0]?.role === "admin" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function hasEventAdminAccess(token: string | undefined): Promise<boolean> {
  return (await eventAdminId(token)) !== null;
}
