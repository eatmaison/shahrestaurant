import { NextRequest, NextResponse } from "next/server";
import { addGalleryImage, listGalleryImages, removeGalleryImage } from "../../lib/serverStore";

/** Public: list this site's gallery photos. */
export async function GET() {
  try {
    const images = await listGalleryImages();
    return NextResponse.json({ ok: true, images });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Admin: add a photo (base64 data URL) - stored in DigitalOcean Spaces. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await addGalleryImage({
      image: typeof body.image === "string" ? body.image : "",
      alt: typeof body.alt === "string" ? body.alt : "",
      altNl: typeof body.altNl === "string" ? body.altNl : "",
      category: typeof body.category === "string" ? body.category : "",
      portrait: Boolean(body.portrait),
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

/** Admin: delete a photo (removes the stored file from Spaces too). */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) await removeGalleryImage(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
