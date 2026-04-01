import { PDFDocument } from "pdf-lib";
import { drawAnnotationsOnPage, flattenAnnotationsOnPage } from "./annotationSerializer";
import { applyTextEdits } from "./textEditExport";
import type { AnnotationShape } from "../types/annotation";
import type { TextEdit, PdfTextItem } from "../types/textEdit";

export type ExportMode = "annotate" | "flatten";

/**
 * Export a PDF with annotations and text edits applied.
 *
 * Annotation mode:
 *   "annotate" (default) — writes native PDF /Annot entries (editable)
 *   "flatten" — bakes annotations into the page content stream (permanent)
 *
 * Text edits are always flattened (white rect + replacement text) since
 * PDF content streams can't be surgically edited.
 */
export async function exportWithAnnotations(
  srcBytes: Uint8Array,
  annotations: Map<number, AnnotationShape[]>,
  renderScale: number,
  mode: ExportMode = "annotate",
  textEdits?: Map<string, TextEdit>,
  textItems?: Map<number, PdfTextItem[]>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(srcBytes);
  const pages = doc.getPages();

  // Apply text edits first (cover + replace)
  if (textEdits && textItems && textEdits.size > 0) {
    await applyTextEdits(doc, textEdits, textItems);
  }

  // Then apply annotation shapes
  const writer = mode === "flatten" ? flattenAnnotationsOnPage : drawAnnotationsOnPage;

  for (const [pageIndex, shapes] of annotations) {
    if (pageIndex < pages.length && shapes.length > 0) {
      const json = JSON.stringify(shapes);
      await writer(pages[pageIndex], json, renderScale, doc);
    }
  }

  return doc.save();
}
