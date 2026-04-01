import { create } from "zustand";
import type { PdfTextItem, TextEdit } from "../types/textEdit";

interface TextEditStore {
  /** Extracted text items per page: Map<pageIndex, items[]> */
  textItems: Map<number, PdfTextItem[]>;
  /** Edits keyed by item ID */
  edits: Map<string, TextEdit>;
  /** Currently editing item ID */
  editingId: string | null;

  setPageTextItems: (pageIndex: number, items: PdfTextItem[]) => void;
  setEdit: (itemId: string, original: string, replacement: string) => void;
  removeEdit: (itemId: string) => void;
  setEditingId: (id: string | null) => void;
  getEditedText: (itemId: string, original: string) => string;
  clearAll: () => void;
}

export const useTextEditStore = create<TextEditStore>((set, get) => ({
  textItems: new Map(),
  edits: new Map(),
  editingId: null,

  setPageTextItems: (pageIndex, items) =>
    set((state) => {
      const next = new Map(state.textItems);
      next.set(pageIndex, items);
      return { textItems: next };
    }),

  setEdit: (itemId, original, replacement) =>
    set((state) => {
      // If replacement matches original, remove the edit
      if (replacement === original) {
        const next = new Map(state.edits);
        next.delete(itemId);
        return { edits: next };
      }
      const next = new Map(state.edits);
      next.set(itemId, { itemId, original, replacement });
      return { edits: next };
    }),

  removeEdit: (itemId) =>
    set((state) => {
      const next = new Map(state.edits);
      next.delete(itemId);
      return { edits: next };
    }),

  setEditingId: (id) => set({ editingId: id }),

  getEditedText: (itemId, original) => {
    const edit = get().edits.get(itemId);
    return edit ? edit.replacement : original;
  },

  clearAll: () => set({ textItems: new Map(), edits: new Map(), editingId: null }),
}));
