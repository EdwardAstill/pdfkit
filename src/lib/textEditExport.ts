import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { TextEdit, PdfTextItem } from "../types/textEdit";

/**
 * Apply text edits to a PDF: for each edit, draw a white rectangle over
 * the original text position, then write the replacement text on top.
 */
export async function applyTextEdits(
  doc: PDFDocument,
  edits: Map<string, TextEdit>,
  textItems: Map<number, PdfTextItem[]>,
) {
  if (edits.size === 0) return;

  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Group edits by page
  const editsByPage = new Map<number, { item: PdfTextItem; edit: TextEdit }[]>();

  for (const [itemId, edit] of edits) {
    // Find the text item this edit refers to
    for (const [pageIndex, items] of textItems) {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const list = editsByPage.get(pageIndex) ?? [];
        list.push({ item, edit });
        editsByPage.set(pageIndex, list);
        break;
      }
    }
  }

  for (const [pageIndex, pageEdits] of editsByPage) {
    if (pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    for (const { item, edit } of pageEdits) {
      // White-out rectangle over original text
      // item.pdfY is the baseline, so the rect goes from baseline-descent to baseline+ascent
      // Use a generous cover: slightly below baseline, full height + padding
      const coverPadding = 2;
      const coverY = item.pdfY - item.pdfFontSize * 0.25 - coverPadding;
      const coverH = item.pdfFontSize * 1.2 + coverPadding * 2;
      const coverW = item.pdfWidth + coverPadding * 2;

      page.drawRectangle({
        x: item.pdfX - coverPadding,
        y: coverY,
        width: coverW,
        height: coverH,
        color: rgb(1, 1, 1), // white
        borderWidth: 0,
      });

      // Draw replacement text at the same position
      page.drawText(edit.replacement, {
        x: item.pdfX,
        y: item.pdfY,
        size: item.pdfFontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }
}
