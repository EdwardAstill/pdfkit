import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PageInfo } from "../types/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

export interface LoadedPdf {
  pdfjsDoc: PDFDocumentProxy;
  pdfLibDoc: PDFDocument;
  pages: PageInfo[];
  bytes: Uint8Array;
}

export async function loadPdfFromBytes(bytes: Uint8Array): Promise<LoadedPdf> {
  const [pdfjsDoc, pdfLibDoc] = await Promise.all([
    pdfjsLib.getDocument({ data: bytes.slice() }).promise,
    PDFDocument.load(bytes, { ignoreEncryption: true }),
  ]);

  const pages: PageInfo[] = [];
  for (let i = 0; i < pdfjsDoc.numPages; i++) {
    const page = await pdfjsDoc.getPage(i + 1); // pdfjs is 1-indexed
    const viewport = page.getViewport({ scale: 1 });
    pages.push({
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate,
    });
  }

  return { pdfjsDoc, pdfLibDoc, pages, bytes };
}

export async function loadPdfFromFile(file: File): Promise<LoadedPdf> {
  const buffer = await file.arrayBuffer();
  return loadPdfFromBytes(new Uint8Array(buffer));
}
