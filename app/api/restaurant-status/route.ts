import { NextRequest, NextResponse } from "next/server";
import { loadRestaurantStatus, setRestaurantOpenOverride } from "../../lib/serverStore";
import type { RestaurantOpenOverride } from "../../lib/openingHours";

const OVERRIDES: RestaurantOpenOverride[] = ["auto", "open", "closed"];

export async function GET() {
  try {
    const restaurantStatus = await loadRestaurantStatus();
    return NextResponse.json({ ok: true, restaurantStatus });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const override = raw?.override as RestaurantOpenOverride | undefined;
    if (!override || !OVERRIDES.includes(override)) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }
    const restaurantStatus = await setRestaurantOpenOverride(override);
    return NextResponse.json({ ok: true, restaurantStatus });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
