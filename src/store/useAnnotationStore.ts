import { create } from "zustand";
import type {
  AnnotationTool,
  AnnotationStyle,
  AnnotationShape,
} from "../types/annotation";

const MAX_HISTORY = 50;

interface PageHistory {
  stack: string[]; // JSON snapshots
  index: number;
}

interface AnnotationStore {
  // Page shapes: Map<pageIndex, shapes[]>
  annotations: Map<number, AnnotationShape[]>;
  activeTool: AnnotationTool;
  style: AnnotationStyle;
  selectedId: string | null;
  /** The actual display scale used by the viewer (fit-to-width) */
  renderScale: number;

  setActiveTool: (tool: AnnotationTool) => void;
  setStyle: (style: Partial<AnnotationStyle>) => void;
  setSelectedId: (id: string | null) => void;
  setRenderScale: (scale: number) => void;

  getPageShapes: (pageIndex: number) => AnnotationShape[];
  addShape: (pageIndex: number, shape: AnnotationShape) => void;
  updateShape: (pageIndex: number, id: string, updates: Partial<AnnotationShape>) => void;
  removeShape: (pageIndex: number, id: string) => void;

  // History (undo/redo)
  _history: Map<number, PageHistory>;
  pushHistory: (pageIndex: number) => void;
  undo: (pageIndex: number) => void;
  redo: (pageIndex: number) => void;

  // For PDF export — serialize shapes to JSON
  getPageAnnotations: (pageIndex: number) => string | undefined;

  clearAll: () => void;
}

const defaultStyle: AnnotationStyle = {
  strokeColor: "#e8642c",
  fillColor: "transparent",
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: "Helvetica",
};

function snapshotPage(annotations: Map<number, AnnotationShape[]>, pageIndex: number): string {
  return JSON.stringify(annotations.get(pageIndex) ?? []);
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: new Map(),
  activeTool: "select",
  style: { ...defaultStyle },
  selectedId: null,
  renderScale: 2,
  _history: new Map(),

  setActiveTool: (tool) => set({ activeTool: tool, selectedId: null }),
  setStyle: (partial) =>
    set((state) => ({ style: { ...state.style, ...partial } })),
  setSelectedId: (id) => set({ selectedId: id }),
  setRenderScale: (scale) => set({ renderScale: scale }),

  getPageShapes: (pageIndex) => get().annotations.get(pageIndex) ?? [],

  addShape: (pageIndex, shape) =>
    set((state) => {
      const next = new Map(state.annotations);
      const existing = next.get(pageIndex) ?? [];
      next.set(pageIndex, [...existing, shape]);
      return { annotations: next };
    }),

  updateShape: (pageIndex, id, updates) =>
    set((state) => {
      const next = new Map(state.annotations);
      const shapes = next.get(pageIndex) ?? [];
      next.set(
        pageIndex,
        shapes.map((s) => (s.id === id ? { ...s, ...updates } as AnnotationShape : s))
      );
      return { annotations: next };
    }),

  removeShape: (pageIndex, id) =>
    set((state) => {
      const next = new Map(state.annotations);
      const shapes = next.get(pageIndex) ?? [];
      next.set(pageIndex, shapes.filter((s) => s.id !== id));
      return { annotations: next };
    }),

  pushHistory: (pageIndex) => {
    const state = get();
    const snap = snapshotPage(state.annotations, pageIndex);
    const hist = state._history.get(pageIndex) ?? { stack: [], index: -1 };

    // Trim future entries if we branched
    const stack = hist.stack.slice(0, hist.index + 1);
    stack.push(snap);
    if (stack.length > MAX_HISTORY) stack.shift();

    const nextHist = new Map(state._history);
    nextHist.set(pageIndex, { stack, index: stack.length - 1 });
    set({ _history: nextHist });
  },

  undo: (pageIndex) => {
    const state = get();
    const hist = state._history.get(pageIndex);
    if (!hist || hist.index <= 0) return;

    const newIndex = hist.index - 1;
    const json = hist.stack[newIndex];
    if (!json) return;

    const shapes: AnnotationShape[] = JSON.parse(json);
    const nextAnnotations = new Map(state.annotations);
    nextAnnotations.set(pageIndex, shapes);

    const nextHist = new Map(state._history);
    nextHist.set(pageIndex, { ...hist, index: newIndex });

    set({ annotations: nextAnnotations, _history: nextHist, selectedId: null });
  },

  redo: (pageIndex) => {
    const state = get();
    const hist = state._history.get(pageIndex);
    if (!hist || hist.index >= hist.stack.length - 1) return;

    const newIndex = hist.index + 1;
    const json = hist.stack[newIndex];
    if (!json) return;

    const shapes: AnnotationShape[] = JSON.parse(json);
    const nextAnnotations = new Map(state.annotations);
    nextAnnotations.set(pageIndex, shapes);

    const nextHist = new Map(state._history);
    nextHist.set(pageIndex, { ...hist, index: newIndex });

    set({ annotations: nextAnnotations, _history: nextHist, selectedId: null });
  },

  getPageAnnotations: (pageIndex) => {
    const shapes = get().annotations.get(pageIndex);
    return shapes ? JSON.stringify(shapes) : undefined;
  },

  clearAll: () => set({ annotations: new Map(), _history: new Map() }),
}));
