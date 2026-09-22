/**
 * Downscale an image before upload so the TV preloads it quickly.
 * Longest side is capped at `maxSize`; output is WebP (JPEG where the browser
 * cannot encode WebP). Animated GIFs and SVGs are uploaded untouched.
 */
export async function prepareImage(file: File, maxSize = 1600): Promise<{ blob: Blob; extension: string }> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return { blob: file, extension: file.type === "image/gif" ? "gif" : "svg" };
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const encode = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

    const webp = await encode("image/webp", 0.86);
    if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };
    const jpeg = await encode("image/jpeg", 0.88);
    if (jpeg) return { blob: jpeg, extension: "jpg" };
    throw new Error("Could not encode image");
  } finally {
    bitmap.close();
  }
}

export function extensionOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split("/")[1] ?? "bin";
}
