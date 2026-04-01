import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PDFDocument } from "pdf-lib";

export interface PageInfo {
  width: number;
  height: number;
  rotation: number;
}

export interface PdfState {
  pdfBytes: Uint8Array | null;
  pdfLibDoc: PDFDocument | null;
  pdfjsDoc: PDFDocumentProxy | null;
  pages: PageInfo[];
  fileName: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  loadFile: (file: File) => Promise<void>;
  loadBytes: (bytes: Uint8Array, name: string) => Promise<void>;
  reset: () => void;
}
