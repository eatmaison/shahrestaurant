// Browser-side validation and bounded raster preparation; this function never uploads.
export type PreparedImage = { width: number; height: number; originalWidth: number; originalHeight: number; inputBytes: number; outputBytes: number };
export function validateAdminImage(file: Pick<File, "size" | "type" | "name">): "size" | "type" | undefined {
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > 10_000_000) return "size";
  if (!/^image\/(jpeg|png|webp|avif|gif|svg\+xml)$/i.test(file.type) && !(file.type === "" && /\.(?:jpe?g|png|webp|avif|gif|svg)$/i.test(file.name))) return "type";
}
export const processImageFile = (file: File, opts?: { maxDim?: number; mime?: string; signal?: AbortSignal; onPrepared?: (image: PreparedImage) => void }): Promise<string> => new Promise((resolve, reject) => {
  const invalid = validateAdminImage(file);
  if (invalid) { reject(new Error(invalid)); return; }
  const maxDim = opts?.maxDim ?? 1200, mime = opts?.mime ?? "image/jpeg";
  if (!Number.isFinite(maxDim) || maxDim < 1 || maxDim > 4096) { reject(new Error("dimensions")); return; }
  if (opts?.signal?.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
  const url = URL.createObjectURL(file), img = new window.Image();
  let finished = false;
  const finish = (error?: Error, output?: string) => { if (finished) return; finished = true; clearTimeout(timer); URL.revokeObjectURL(url); opts?.signal?.removeEventListener("abort", abort); img.onload = null; img.onerror = null; if (error) { img.src = ""; reject(error); } else resolve(output!); };
  const abort = () => finish(new DOMException("Aborted", "AbortError"));
  const timer = setTimeout(() => finish(new Error("decode-timeout")), 15_000);
  opts?.signal?.addEventListener("abort", abort, { once: true });
  img.onload = () => { try {
    const originalWidth = img.naturalWidth, originalHeight = img.naturalHeight;
    if (!originalWidth || !originalHeight || originalWidth * originalHeight > 40_000_000) return finish(new Error("pixels"));
    if (opts?.signal?.aborted) return abort();
    const scale = Math.min(1, maxDim / Math.max(originalWidth, originalHeight)), width = Math.max(1, Math.round(originalWidth * scale)), height = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d"); if (!ctx) return finish(new Error("canvas"));
    ctx.drawImage(img, 0, 0, width, height);
    const output = canvas.toDataURL(mime, 0.85);
    canvas.width = 0; canvas.height = 0;
    if (opts?.signal?.aborted) return abort();
    opts?.onPrepared?.({ width, height, originalWidth, originalHeight, inputBytes: file.size, outputBytes: Math.ceil((output.split(",")[1]?.length || 0) * 3 / 4) });
    finish(undefined, output);
  } catch { finish(new Error("decode")); } };
  img.onerror = () => finish(new Error("decode")); img.src = url;
});
