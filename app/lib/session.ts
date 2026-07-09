import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "etg_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "eattogo-dev-secret-change-me-in-production"
);

/** Sign a session cookie for the given user id. */
export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Read the logged-in user id from the session cookie, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.userId as string) ?? null;
  } catch {
    return null;
  }
}

/** Remove the session cookie (logout). */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
