import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

const RENDER_SCALE = 2;

export function usePdfRenderer(
  pdfjsDoc: PDFDocumentProxy | null,
  pageIndex: number,
  scale: number = RENDER_SCALE
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfjsDoc) return;

    const taskId = ++taskRef.current;

    (async () => {
      const page = await pdfjsDoc.getPage(pageIndex + 1);
      if (taskId !== taskRef.current) return; // stale

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });
      const cssViewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${cssViewport.width}px`;
      canvas.style.height = `${cssViewport.height}px`;

      const ctx = canvas.getContext("2d")!;
      try {
        await page.render({ canvasContext: ctx, viewport } as any).promise;
      } catch {
        // render cancelled — ignore
      }
    })();

    return () => {
      taskRef.current++; // invalidate in-flight render
    };
  }, [pdfjsDoc, pageIndex, scale]);

  return { canvasRef, scale };
}

export { RENDER_SCALE };
