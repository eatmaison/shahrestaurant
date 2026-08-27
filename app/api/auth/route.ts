import { NextRequest, NextResponse } from "next/server";
import {
  loginUser,
  logoutUser,
  publicOrigin,
  registerUser,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  setUserEmailVerified,
  verifyEmail,
} from "../../lib/serverStore";
import { authSchema } from "../../lib/validation";
import { enforceRateLimit } from "../../lib/rateLimit";

/** Actions that can be brute-forced or abused get a stricter limit. */
const SENSITIVE_ACTIONS = new Set(["login", "register", "requestReset", "resetPassword"]);

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = authSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }
    const body = parsed.data;

    // Rate limit per IP: 10 sensitive attempts / 10 min, 60 other calls / 10 min.
    const limited = SENSITIVE_ACTIONS.has(body.action)
      ? enforceRateLimit(req, `auth:${body.action}`, 10, 10 * 60_000)
      : enforceRateLimit(req, "auth:general", 60, 10 * 60_000);
    if (limited) return limited;

    const origin = publicOrigin(req);

    if (body.action === "register") {
      const res = await registerUser({ ...body, origin });
      return NextResponse.json(res);
    }
    if (body.action === "login") {
      const res = await loginUser(body.email, body.password);
      return NextResponse.json(res);
    }
    if (body.action === "logout") {
      await logoutUser();
      return NextResponse.json({ ok: true });
    }
    if (body.action === "verifyEmail") {
      const res = await verifyEmail(body.token);
      return NextResponse.json(res);
    }
    if (body.action === "setUserEmailVerified") {
      const res = await setUserEmailVerified(body.userId, body.verified);
      return NextResponse.json(res);
    }
    if (body.action === "resendVerification") {
      const res = await resendVerification(origin);
      return NextResponse.json(res);
    }
    if (body.action === "requestReset") {
      const res = await requestPasswordReset(body.email, origin);
      return NextResponse.json(res);
    }
    if (body.action === "resetPassword") {
      const res = await resetPassword(body.token, body.password);
      return NextResponse.json(res);
    }
    return NextResponse.json({ ok: false, error: "unknownAction" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
