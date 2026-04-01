import { useEffect } from "react";
import { useAnnotationStore } from "../store/useAnnotationStore";
import { newShapeId } from "./useDrawing";
import type { AnnotationTool, AnnotationShape } from "../types/annotation";

/**
 * Global keyboard shortcuts for annotation tools.
 * Disabled when `disabled` is true (e.g. during text editing).
 */
export function useAnnotationKeys(pageIndex: number, disabled: boolean) {
  const store = useAnnotationStore;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // Tool shortcuts (no modifier)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolMap: Record<string, AnnotationTool> = {
          v: "select",
          r: "rectangle",
          o: "circle",
          l: "line",
          a: "arrow",
          t: "text",
        };
        if (toolMap[e.key]) {
          e.preventDefault();
          store.getState().setActiveTool(toolMap[e.key]);
          return;
        }
        if (e.key === "Escape") {
          const sid = store.getState().selectedId;
          if (sid) {
            store.getState().setSelectedId(null);
          } else {
            store.getState().setActiveTool("select");
          }
          return;
        }
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        store.getState().undo(pageIndex);
        return;
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        store.getState().redo(pageIndex);
        return;
      }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const sid = store.getState().selectedId;
        if (!sid) return;
        const shape = store.getState().getPageShapes(pageIndex).find((s) => s.id === sid);
        if (!shape) return;
        const newShape = { ...shape, id: newShapeId(), x: shape.x + 20, y: shape.y + 20 } as AnnotationShape;
        store.getState().addShape(pageIndex, newShape);
        store.getState().setSelectedId(newShape.id);
        store.getState().pushHistory(pageIndex);
        return;
      }
      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        const sid = store.getState().selectedId;
        if (sid) {
          store.getState().removeShape(pageIndex, sid);
          store.getState().setSelectedId(null);
          store.getState().pushHistory(pageIndex);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageIndex, disabled]);
}
