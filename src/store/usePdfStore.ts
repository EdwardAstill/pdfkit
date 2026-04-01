import { create } from "zustand";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PDFDocument } from "pdf-lib";
import type { PageInfo } from "../types/pdf";
import { loadPdfFromBytes, loadPdfFromFile } from "../lib/pdfLoader";

interface PdfStore {
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

export const usePdfStore = create<PdfStore>((set, get) => ({
  pdfBytes: null,
  pdfLibDoc: null,
  pdfjsDoc: null,
  pages: [],
  fileName: "",
  currentPage: 0,

  setCurrentPage: (page) => set({ currentPage: page }),

  loadFile: async (file) => {
    const old = get().pdfjsDoc;
    if (old) old.destroy();

    const result = await loadPdfFromFile(file);
    set({
      pdfBytes: result.bytes,
      pdfLibDoc: result.pdfLibDoc,
      pdfjsDoc: result.pdfjsDoc,
      pages: result.pages,
      fileName: file.name,
      currentPage: 0,
    });
  },

  loadBytes: async (bytes, name) => {
    const old = get().pdfjsDoc;
    if (old) old.destroy();

    const result = await loadPdfFromBytes(bytes);
    set({
      pdfBytes: result.bytes,
      pdfLibDoc: result.pdfLibDoc,
      pdfjsDoc: result.pdfjsDoc,
      pages: result.pages,
      fileName: name,
      currentPage: 0,
    });
  },

  reset: () => {
    const old = get().pdfjsDoc;
    if (old) old.destroy();
    set({
      pdfBytes: null,
      pdfLibDoc: null,
      pdfjsDoc: null,
      pages: [],
      fileName: "",
      currentPage: 0,
    });
  },
}));
