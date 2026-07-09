import { NextResponse } from "next/server";
import { bootstrap } from "../../lib/serverStore";

export async function GET() {
  try {
    const data = await bootstrap();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load" },
      { status: 500 }
    );
  }
}
