import type { PendingImage } from "../store/useAnnotationStore";

/**
 * Read an image file and normalise it to a PNG data URL.
 *
 * Rasterising through a canvas means any browser-decodable format
 * (JPEG, WebP, GIF, BMP, SVG, …) becomes a PNG that pdf-lib can embed,
 * and gives us the natural pixel dimensions for aspect-correct placement.
 */
export function loadImageFile(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode the image file"));
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          reject(new Error("Image has no dimensions"));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext("2d");
        if (!c) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }
        c.drawImage(img, 0, 0);
        resolve({ src: canvas.toDataURL("image/png"), width: w, height: h });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
