import { Rect, Ellipse, Line, Arrow, Text } from "react-konva";
import type Konva from "konva";
import type { AnnotationShape, AnnotationTool } from "../../types/annotation";

interface Props {
  shape: AnnotationShape;
  isSelected: boolean;
  activeTool: AnnotationTool;
  cursor: string;
  stageRef: React.RefObject<Konva.Stage | null>;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (id: string, shape: AnnotationShape, e: Konva.KonvaEventObject<Event>) => void;
  onTextDblClick: (id: string, shape: AnnotationShape) => void;
}

export function ShapeRenderer({
  shape,
  isSelected,
  activeTool,
  cursor,
  stageRef,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onTextDblClick,
}: Props) {
  const common = {
    id: shape.id,
    draggable: activeTool === "select",
    onClick: () => onSelect(shape.id),
    onTap: () => onSelect(shape.id),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(shape.id, e),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(shape.id, shape, e),
    rotation: shape.rotation ?? 0,
    onMouseEnter:
      activeTool === "select"
        ? () => {
            const stage = stageRef.current;
            if (stage) stage.container().style.cursor = "move";
          }
        : undefined,
    onMouseLeave:
      activeTool === "select"
        ? () => {
            const stage = stageRef.current;
            if (stage) stage.container().style.cursor = cursor;
          }
        : undefined,
    shadowColor: isSelected ? "#4d8eff" : undefined,
    shadowBlur: isSelected ? 6 : 0,
    shadowOpacity: isSelected ? 0.4 : 0,
  };

  switch (shape.type) {
    case "rect":
      return (
        <Rect
          {...common}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill === "transparent" ? undefined : shape.fill}
          cornerRadius={1}
          hitStrokeWidth={Math.max(shape.strokeWidth, 10)}
        />
      );
    case "ellipse":
      return (
        <Ellipse
          {...common}
          x={shape.x}
          y={shape.y}
          radiusX={shape.radiusX}
          radiusY={shape.radiusY}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill === "transparent" ? undefined : shape.fill}
          hitStrokeWidth={Math.max(shape.strokeWidth, 10)}
        />
      );
    case "line":
      return (
        <Line
          {...common}
          points={shape.points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(shape.strokeWidth, 12)}
        />
      );
    case "arrow":
      return (
        <Arrow
          {...common}
          points={shape.points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill}
          pointerLength={12}
          pointerWidth={10}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(shape.strokeWidth, 12)}
        />
      );
    case "text":
      return (
        <Text
          {...common}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          fill={shape.fill || shape.stroke}
          width={shape.width}
          onDblClick={() => onTextDblClick(shape.id, shape)}
          onDblTap={() => onTextDblClick(shape.id, shape)}
        />
      );
    default:
      return null;
  }
}
