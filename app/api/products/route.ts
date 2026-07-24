import { NextRequest, NextResponse } from "next/server";
import { addProduct, createProductGroup, removeProduct, syncProductGroup, updateProduct } from "../../lib/serverStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // A `targets` array means "publish this product to several restaurants at once".
    if (Array.isArray(body.targets)) {
      const { targets, ...content } = body;
      const products = await createProductGroup(content, targets);
      return NextResponse.json({ ok: true, products });
    }
    const product = await addProduct(body);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    // A `targets` array edits the product across every restaurant it is sold at.
    if (Array.isArray(body.targets)) {
      const { id, targets, ...content } = body;
      await syncProductGroup(id, content, targets);
      return NextResponse.json({ ok: true });
    }
    const { id, ...patch } = body;
    await updateProduct(id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) await removeProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
