// Shared browser-side upload sizing; no upload occurs until its admin form is submitted.
export const processImageFile = (file: File, opts?: { maxDim?: number; mime?: string }): Promise<string> =>
  new Promise((resolve, reject) => {
    const maxDim = opts?.maxDim ?? 1200;
    const mime = opts?.mime ?? "image/jpeg";
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL(mime, 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
