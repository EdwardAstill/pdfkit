export type AnnotationTool =
  | "select"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text";

export interface AnnotationStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
}

// Shape types stored per page
export type ShapeType = "rect" | "ellipse" | "line" | "arrow" | "text";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  rotation?: number;
}

export interface RectShape extends BaseShape {
  type: "rect";
  width: number;
  height: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
}

export interface LineShape extends BaseShape {
  type: "line";
  points: number[]; // [x1, y1, x2, y2] relative to x,y
}

export interface ArrowShape extends BaseShape {
  type: "arrow";
  points: number[]; // [x1, y1, x2, y2] relative to x,y
}

export interface TextShape extends BaseShape {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  width?: number;
}

export type AnnotationShape =
  | RectShape
  | EllipseShape
  | LineShape
  | ArrowShape
  | TextShape;
