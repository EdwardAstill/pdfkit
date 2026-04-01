import { useEffect } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useTextEditStore } from "../store/useTextEditStore";
import type { PdfTextItem } from "../types/textEdit";

/**
 * Extracts text items from a PDF page and stores them.
 * Each item gets canvas-space coordinates (scaled) and PDF-space coordinates (unscaled).
 */
export function useTextExtract(
  pdfjsDoc: PDFDocumentProxy | null,
  pageIndex: number,
  scale: number,
) {
  useEffect(() => {
    if (!pdfjsDoc) return;
    let cancelled = false;

    (async () => {
      const page = await pdfjsDoc.getPage(pageIndex + 1);
      if (cancelled) return;

      const content = await page.getTextContent();
      if (cancelled) return;

      const pageH = page.getViewport({ scale: 1 }).height;

      const items: PdfTextItem[] = [];
      let idx = 0;

      for (const item of content.items) {
        // Skip marked content items (they don't have str)
        if (!("str" in item) || !item.str.trim()) continue;

        const tx = item.transform;
        // transform = [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const pdfFontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
        const pdfX = tx[4];
        const pdfY = tx[5];

        // pdfjs gives width/height in unscaled coordinates
        const pdfWidth = item.width;
        const pdfHeight = item.height || pdfFontSize;

        // Convert to canvas coordinates (Y-flip + scale)
        const canvasX = pdfX * scale;
        const canvasY = (pageH - pdfY) * scale - pdfHeight * scale;
        const canvasWidth = pdfWidth * scale;
        const canvasHeight = pdfHeight * scale;

        const style = content.styles[item.fontName];
        const fontFamily = style?.fontFamily ?? "sans-serif";

        items.push({
          id: `${pageIndex}_${idx}`,
          str: item.str,
          x: canvasX,
          y: canvasY,
          width: canvasWidth,
          height: canvasHeight,
          fontSize: pdfFontSize * scale,
          fontFamily,
          pageIndex,
          pdfX,
          pdfY,
          pdfWidth,
          pdfHeight,
          pdfFontSize,
        });
        idx++;
      }

      if (!cancelled) {
        useTextEditStore.getState().setPageTextItems(pageIndex, items);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfjsDoc, pageIndex, scale]);
}
