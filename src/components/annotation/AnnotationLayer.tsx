import { useState, useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import Konva from "konva";
import { useAnnotationStore } from "../../store/useAnnotationStore";
import { useDrawing, newShapeId } from "../../hooks/useDrawing";
import { useAnnotationKeys } from "../../hooks/useAnnotationKeys";
import { ShapeRenderer } from "./ShapeRenderer";
import { TextEditor } from "./TextEditor";
import type { AnnotationShape } from "../../types/annotation";

interface Props {
  pageIndex: number;
  width: number;
  height: number;
}

const EMPTY_SHAPES: AnnotationShape[] = [];

// Custom rotation cursor (SVG data URI)
const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234d8eff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 2v6h-6'/%3E%3Cpath d='M21 8A9 9 0 0 0 5.64 5.64L3 3'/%3E%3Cpath d='M3 22v-6h6'/%3E%3Cpath d='M3 16a9 9 0 0 0 15.36 2.36L21 21'/%3E%3C/svg%3E") 12 12, pointer`;

export function AnnotationLayer({ pageIndex, width, height }: Props) {
  const shapes = useAnnotationStore((s) => s.annotations.get(pageIndex) ?? EMPTY_SHAPES);
  const activeTool = useAnnotationStore((s) => s.activeTool);
  const selectedId = useAnnotationStore((s) => s.selectedId);

  const store = useAnnotationStore;
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textEditValue, setTextEditValue] = useState("");
  const [textEditPos, setTextEditPos] = useState({
    x: 0,
    y: 0,
    fontSize: 16,
    fontFamily: "Helvetica",
    color: "#e8642c",
    width: 200,
  });

  // Hooks
  const { handleDrawStart, handleDrawMove, handleDrawEnd } = useDrawing(pageIndex);
  useAnnotationKeys(pageIndex, !!editingTextId);

  // Seed initial history snapshot
  useEffect(() => {
    store.getState().pushHistory(pageIndex);
  }, [pageIndex]);

  // Attach transformer to selected node
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    if (selectedId && activeTool === "select") {
      const node = stage.findOne(`#${selectedId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedId, activeTool, shapes]);

  // --- Text editing ---
  const startTextEdit = useCallback(
    (id: string, x: number, y: number, fontSize: number, fontFamily: string, color: string, textWidth: number) => {
      const shape = store.getState().getPageShapes(pageIndex).find((s) => s.id === id);
      if (!shape || shape.type !== "text") return;
      setEditingTextId(id);
      setTextEditValue(shape.text);
      setTextEditPos({ x, y, fontSize, fontFamily, color, width: Math.max(textWidth, 100) });
    },
    [pageIndex]
  );

  const finishTextEdit = useCallback(() => {
    if (!editingTextId) return;
    if (textEditValue.trim() === "") {
      // Remove empty text shapes instead of keeping blanks
      store.getState().removeShape(pageIndex, editingTextId);
    } else {
      store.getState().updateShape(pageIndex, editingTextId, { text: textEditValue } as Partial<AnnotationShape>);
    }
    store.getState().pushHistory(pageIndex);
    setEditingTextId(null);
  }, [editingTextId, textEditValue, pageIndex]);

  const handleTextDblClick = useCallback(
    (id: string, shape: AnnotationShape) => {
      if (shape.type !== "text") return;
      store.getState().setSelectedId(null);
      startTextEdit(id, shape.x, shape.y, shape.fontSize, shape.fontFamily, shape.fill || shape.stroke, shape.width ?? 200);
    },
    [startTextEdit]
  );

  // --- Stage event handlers ---
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const tool = store.getState().activeTool;

      // Select mode: click empty space to deselect
      if (tool === "select") {
        if (e.target === e.target.getStage()) {
          store.getState().setSelectedId(null);
        }
        return;
      }

      // Text mode: click to place text, then start editing
      if (tool === "text") {
        if (e.target === e.target.getStage()) {
          const pos = e.target.getStage()!.getPointerPosition()!;
          const st = store.getState().style;
          const id = newShapeId();
          store.getState().addShape(pageIndex, {
            id,
            type: "text",
            x: pos.x,
            y: pos.y,
            text: "",
            fontSize: st.fontSize,
            fontFamily: st.fontFamily,
            stroke: st.strokeColor,
            strokeWidth: 0,
            fill: st.strokeColor,
          });
          store.getState().pushHistory(pageIndex);
          store.getState().setSelectedId(id);
          // Open editor directly — bypass startTextEdit's store lookup
          // since we already know the shape details
          setEditingTextId(id);
          setTextEditValue("");
          setTextEditPos({
            x: pos.x,
            y: pos.y,
            fontSize: st.fontSize,
            fontFamily: st.fontFamily,
            color: st.strokeColor,
            width: 200,
          });
        }
        return;
      }

      // Shape drawing
      const pos = e.target.getStage()!.getPointerPosition()!;
      handleDrawStart(pos);
    },
    [pageIndex, handleDrawStart, startTextEdit]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()!.getPointerPosition()!;
      handleDrawMove(pos);
    },
    [handleDrawMove]
  );

  const handleMouseUp = useCallback(() => {
    handleDrawEnd();
  }, [handleDrawEnd]);

  // --- Shape interaction handlers ---
  const handleShapeSelect = useCallback((id: string) => {
    if (store.getState().activeTool === "select") {
      store.getState().setSelectedId(id);
    }
  }, []);

  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      store.getState().updateShape(pageIndex, id, { x: node.x(), y: node.y() });
      store.getState().pushHistory(pageIndex);
    },
    [pageIndex]
  );

  const handleTransformEnd = useCallback(
    (id: string, shape: AnnotationShape, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const updates: Record<string, unknown> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      switch (shape.type) {
        case "rect":
          updates.width = Math.max(5, node.width() * scaleX);
          updates.height = Math.max(5, node.height() * scaleY);
          break;
        case "ellipse":
          updates.radiusX = Math.max(5, (node as Konva.Ellipse).radiusX() * scaleX);
          updates.radiusY = Math.max(5, (node as Konva.Ellipse).radiusY() * scaleY);
          break;
        case "text":
          updates.fontSize = Math.max(8, (shape as { fontSize: number }).fontSize * scaleY);
          updates.width = node.width() * scaleX;
          break;
      }

      store.getState().updateShape(pageIndex, id, updates as Partial<AnnotationShape>);
      store.getState().pushHistory(pageIndex);
    },
    [pageIndex]
  );

  const cursor = activeTool === "select" ? "default" : activeTool === "text" ? "text" : "crosshair";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "auto",
        cursor,
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor }}
      >
        <Layer>
          {shapes.map((shape) => {
            if (shape.id === editingTextId) return null;
            return (
              <ShapeRenderer
                key={shape.id}
                shape={shape}
                isSelected={selectedId === shape.id}
                activeTool={activeTool}
                cursor={cursor}
                stageRef={stageRef}
                onSelect={handleShapeSelect}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                onTextDblClick={handleTextDblClick}
              />
            );
          })}
          <Transformer
            ref={transformerRef}
            visible={activeTool === "select" && !!selectedId}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            anchorStroke="#4d8eff"
            anchorFill="#fff"
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke="#4d8eff"
            borderStrokeWidth={1}
            borderDash={[4, 3]}
            rotateEnabled={true}
            rotateAnchorOffset={20}
            rotateAnchorCursor={ROTATE_CURSOR}
            keepRatio={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ]}
            anchorStyleFunc={(anchor) => {
              if (anchor.hasName("rotater")) {
                anchor.cornerRadius(10);
                anchor.fill("#4d8eff");
                anchor.stroke("#fff");
                anchor.strokeWidth(1.5);
                anchor.width(12);
                anchor.height(12);
                anchor.offsetX(6);
                anchor.offsetY(6);
              }
            }}
          />
        </Layer>
      </Stage>

      {/* HTML text editor overlay */}
      {editingTextId && (
        <TextEditor
          value={textEditValue}
          onChange={setTextEditValue}
          onFinish={finishTextEdit}
          x={textEditPos.x}
          y={textEditPos.y}
          fontSize={textEditPos.fontSize}
          fontFamily={textEditPos.fontFamily}
          color={textEditPos.color}
          width={textEditPos.width}
        />
      )}
    </div>
  );
}
