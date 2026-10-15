/**
 * Browser only. Cuts the largest centred square out of a picture and scales it to `size` pixels, as WebP
 * (JPEG where the browser cannot write WebP). A phone photo of several MB becomes a few tens of KB,
 * so uploads are fast and the server never has to handle big files.
 * Throws when the file cannot be read as an image.
 */
export async function resizeToSquare(file: Blob, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    return await toBlob(canvas, "image/webp", 0.85).catch(() => toBlob(canvas, "image/jpeg", 0.9));
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob && blob.type === type ? resolve(blob) : reject(new Error(`Cannot encode ${type}`))),
      type,
      quality
    );
  });
}
