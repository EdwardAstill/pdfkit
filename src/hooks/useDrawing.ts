import { useRef, useEffect, useCallback } from "react";
import type Konva from "konva";
import { useAnnotationStore } from "../store/useAnnotationStore";
import type { AnnotationShape } from "../types/annotation";

let shapeCounter = 0;
export function newShapeId() {
  return `shape_${Date.now()}_${shapeCounter++}`;
}

/**
 * Manages shape drawing on a Konva stage.
 * Handles mousedown → mousemove → mouseup lifecycle, shift-constrained
 * drawing, center-origin ellipses, and auto-select after draw.
 */
export function useDrawing(pageIndex: number) {
  const store = useAnnotationStore;
  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const drawingIdRef = useRef<string | null>(null);
  const shiftRef = useRef(false);

  // Track shift key globally
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handleDrawStart = useCallback(
    (pos: { x: number; y: number }) => {
      const tool = store.getState().activeTool;
      if (tool === "select" || tool === "text") return false;

      drawingRef.current = true;
      startRef.current = { x: pos.x, y: pos.y };
      const st = store.getState().style;
      const id = newShapeId();
      drawingIdRef.current = id;

      switch (tool) {
        case "rectangle":
          store.getState().addShape(pageIndex, {
            id,
            type: "rect",
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            stroke: st.strokeColor,
            strokeWidth: st.strokeWidth,
            fill: st.fillColor,
          });
          break;
        case "circle":
          store.getState().addShape(pageIndex, {
            id,
            type: "ellipse",
            x: pos.x,
            y: pos.y,
            radiusX: 0,
            radiusY: 0,
            stroke: st.strokeColor,
            strokeWidth: st.strokeWidth,
            fill: st.fillColor,
          });
          break;
        case "line":
          store.getState().addShape(pageIndex, {
            id,
            type: "line",
            x: 0,
            y: 0,
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: st.strokeColor,
            strokeWidth: st.strokeWidth,
            fill: "transparent",
          });
          break;
        case "arrow":
          store.getState().addShape(pageIndex, {
            id,
            type: "arrow",
            x: 0,
            y: 0,
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: st.strokeColor,
            strokeWidth: st.strokeWidth,
            fill: st.strokeColor,
          });
          break;
      }
      return true;
    },
    [pageIndex]
  );

  const handleDrawMove = useCallback(
    (pos: { x: number; y: number }) => {
      if (!drawingRef.current || !drawingIdRef.current) return;
      const sx = startRef.current.x;
      const sy = startRef.current.y;
      const id = drawingIdRef.current;
      const tool = store.getState().activeTool;
      const shift = shiftRef.current;

      switch (tool) {
        case "rectangle": {
          let w = Math.abs(pos.x - sx);
          let h = Math.abs(pos.y - sy);
          if (shift) {
            const size = Math.max(w, h);
            w = size;
            h = size;
          }
          const x = pos.x < sx ? sx - w : sx;
          const y = pos.y < sy ? sy - h : sy;
          store.getState().updateShape(pageIndex, id, { x, y, width: w, height: h } as Partial<AnnotationShape>);
          break;
        }
        case "circle": {
          let rx = Math.abs(pos.x - sx);
          let ry = Math.abs(pos.y - sy);
          if (shift) {
            const r = Math.max(rx, ry);
            rx = r;
            ry = r;
          }
          store.getState().updateShape(pageIndex, id, {
            x: sx,
            y: sy,
            radiusX: rx,
            radiusY: ry,
          } as Partial<AnnotationShape>);
          break;
        }
        case "line":
        case "arrow": {
          let ex = pos.x;
          let ey = pos.y;
          if (shift) {
            const dx = pos.x - sx;
            const dy = pos.y - sy;
            const angle = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            ex = sx + dist * Math.cos(snapped);
            ey = sy + dist * Math.sin(snapped);
          }
          store.getState().updateShape(pageIndex, id, {
            points: [sx, sy, ex, ey],
          } as Partial<AnnotationShape>);
          break;
        }
      }
    },
    [pageIndex]
  );

  const handleDrawEnd = useCallback(() => {
    if (!drawingRef.current) return null;
    drawingRef.current = false;
    const id = drawingIdRef.current;
    drawingIdRef.current = null;

    store.getState().pushHistory(pageIndex);

    // Switch to select tool first (which clears selectedId),
    // then set the selection so it sticks.
    if (id) {
      store.getState().setActiveTool("select");
      store.getState().setSelectedId(id);
    }
    return id;
  }, [pageIndex]);

  const isDrawing = useCallback(() => drawingRef.current, []);

  return { handleDrawStart, handleDrawMove, handleDrawEnd, isDrawing };
}
