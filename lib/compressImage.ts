// Resizes and re-compresses an image entirely in the browser before upload.
// Uses the native Canvas API — no extra dependency needed. Cuts typical
// phone-camera photos (often 2-5MB) down to a few hundred KB without a
// visible quality loss at the sizes this app actually displays photos.
//
// Always falls back to the original file if anything goes wrong (unsupported
// format or decode failure) so a compression hiccup never blocks someone
// from completing their profile.
//
// Deliberately does NOT fall back to the original just because the
// recompressed version came out the same size or larger. Canvas re-encoding
// strips EXIF (including GPS) as a structural side effect of how
// createImageBitmap/canvas work — there is no metadata channel for it to
// survive through. Falling back on a size comparison alone would silently
// let an EXIF-intact original through whenever compression did not happen
// to shrink the file, which is a real, non-rare case for already-small or
// already-compressed images — not just a rare edge case worth ignoring.
export async function compressImage(
  file: File,
  opts?: { maxDimension?: number; quality?: number }
): Promise<File> {
  const maxDimension = opts?.maxDimension ?? 1600;
  const quality = opts?.quality ?? 0.82;

  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close(); return file; }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;

  const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
