import { z } from "zod";
import { readStockPayload, stockJson } from "../../../lib/stockRequest";
import { unsubscribe } from "../../../lib/campaignStore";

export const dynamic = "force-dynamic";
const tokenSchema = z.uuid();

// Mailbox clients may POST the URL capability using RFC 8058. A link-preview
// GET never mutates anything. The manual confirmation form uses same-origin JSON.
export async function POST(request: Request) {
  try {
    const content = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    let token: string;
    if (content === "application/x-www-form-urlencoded" || content === "multipart/form-data") {
      const parsed = tokenSchema.safeParse(new URL(request.url).searchParams.get("token"));
      if (!parsed.success || !request.body) return stockJson({ ok: false }, 400);
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 1024) { await reader.cancel(); return stockJson({ ok: false }, 400); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
      if (form.getAll("List-Unsubscribe").length !== 1 || form.get("List-Unsubscribe") !== "One-Click") {
        return stockJson({ ok: false }, 400);
      }
      token = parsed.data;
    } else {
      const origin = new URL(process.env.APP_URL || request.url).origin;
      if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site"
          || content !== "application/json") return stockJson({ ok: false }, 403);
      const parsed = z.strictObject({ token: tokenSchema }).safeParse(await readStockPayload(request, 256));
      if (!parsed.success) return stockJson({ ok: false }, 400);
      token = parsed.data.token;
    }
    await unsubscribe(token);
    return stockJson({ ok: true });
  } catch { return stockJson({ ok: false }, 503); }
}
