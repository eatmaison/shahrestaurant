import { jwtVerify } from "jose";
import { sql } from "./db";

/** Check the current database role; a valid session alone never grants event access. */
export async function hasEventAdminAccess(token: string | undefined): Promise<boolean> {
  if (!token || (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)) return false;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "eattogo-dev-secret-change-me-in-production");
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return false;
    const rows = await sql.query("SELECT role FROM users WHERE id = $1", [payload.userId]);
    return rows[0]?.role === "admin";
  } catch {
    return false;
  }
}
