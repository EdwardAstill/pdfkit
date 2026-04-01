import {
  rgb,
  type PDFPage,
  type PDFDocument,
} from "pdf-lib";
import type { AnnotationShape } from "../types/annotation";

function hexToRgbArray(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/**
 * Add annotation shapes to a PDF page as native /Annot entries.
 * These are real PDF annotations — editable in Acrobat, Preview, etc.
 *
 * scale = canvas pixels per PDF point (the render scale used by pdf.js)
 */
export async function drawAnnotationsOnPage(
  page: PDFPage,
  shapesJson: string,
  scale: number,
  doc: PDFDocument,
) {
  const shapes: AnnotationShape[] = JSON.parse(shapesJson);
  if (shapes.length === 0) return;

  const ctx = doc.context;
  const pageH = page.getHeight();

  for (const shape of shapes) {
    addAnnotation(page, shape, scale, pageH, ctx);
  }
}

function addAnnotation(
  page: PDFPage,
  shape: AnnotationShape,
  scale: number,
  pageH: number,
  ctx: ReturnType<PDFDocument["context"]>,
) {
  const hasStroke = shape.stroke && shape.stroke !== "transparent";
  const hasFill = shape.fill && shape.fill !== "transparent";
  const strokeRgb = hasStroke ? hexToRgbArray(shape.stroke) : null;
  const fillRgb = hasFill ? hexToRgbArray(shape.fill) : null;
  const sw = (shape.strokeWidth ?? 1) / scale;

  switch (shape.type) {
    case "rect": {
      const x1 = shape.x / scale;
      const y1 = pageH - (shape.y + shape.height) / scale;
      const x2 = (shape.x + shape.width) / scale;
      const y2 = pageH - shape.y / scale;

      const annotDict: Record<string, unknown> = {
        Type: "Annot",
        Subtype: "Square",
        Rect: [x1, y1, x2, y2],
        Border: [0, 0, sw],
        F: 4, // Print flag
      };
      if (strokeRgb) annotDict.C = strokeRgb;
      if (fillRgb) annotDict.IC = fillRgb;

      const ref = ctx.register(ctx.obj(annotDict));
      page.node.addAnnot(ref);
      break;
    }

    case "ellipse": {
      // /Circle annotation uses a bounding rectangle
      const rx = shape.radiusX / scale;
      const ry = shape.radiusY / scale;
      const cx = shape.x / scale;
      const cy = pageH - shape.y / scale;

      const annotDict: Record<string, unknown> = {
        Type: "Annot",
        Subtype: "Circle",
        Rect: [cx - rx, cy - ry, cx + rx, cy + ry],
        Border: [0, 0, sw],
        F: 4,
      };
      if (strokeRgb) annotDict.C = strokeRgb;
      if (fillRgb) annotDict.IC = fillRgb;

      const ref = ctx.register(ctx.obj(annotDict));
      page.node.addAnnot(ref);
      break;
    }

    case "line":
    case "arrow": {
      const [x1, y1, x2, y2] = shape.points;
      const pdfX1 = x1 / scale;
      const pdfY1 = pageH - y1 / scale;
      const pdfX2 = x2 / scale;
      const pdfY2 = pageH - y2 / scale;

      // Rect is the bounding box of the line
      const minX = Math.min(pdfX1, pdfX2) - sw;
      const minY = Math.min(pdfY1, pdfY2) - sw;
      const maxX = Math.max(pdfX1, pdfX2) + sw;
      const maxY = Math.max(pdfY1, pdfY2) + sw;

      const annotDict: Record<string, unknown> = {
        Type: "Annot",
        Subtype: "Line",
        Rect: [minX, minY, maxX, maxY],
        L: [pdfX1, pdfY1, pdfX2, pdfY2],
        Border: [0, 0, sw],
        F: 4,
      };
      if (strokeRgb) annotDict.C = strokeRgb;

      // Arrow gets line endings
      if (shape.type === "arrow") {
        annotDict.LE = ["None", "OpenArrow"];
      }

      const ref = ctx.register(ctx.obj(annotDict));
      page.node.addAnnot(ref);
      break;
    }

    case "text": {
      const fontSize = shape.fontSize / scale;
      const pdfX = shape.x / scale;
      const pdfY = pageH - shape.y / scale;
      const textColor = (shape.fill && shape.fill !== "transparent")
        ? hexToRgbArray(shape.fill)
        : [0, 0, 0] as [number, number, number];

      // Estimate text dimensions for the Rect
      const textWidth = (shape.width ?? shape.text.length * fontSize * 0.6) / scale;
      const textHeight = fontSize * 1.4;

      const annotDict: Record<string, unknown> = {
        Type: "Annot",
        Subtype: "FreeText",
        Rect: [pdfX, pdfY - textHeight, pdfX + textWidth, pdfY],
        Contents: shape.text,
        DA: `${textColor[0]} ${textColor[1]} ${textColor[2]} rg /Helv ${fontSize} Tf`,
        F: 4,
        // No border on free text
        Border: [0, 0, 0],
      };

      const ref = ctx.register(ctx.obj(annotDict));
      page.node.addAnnot(ref);
      break;
    }
  }
}

/**
 * Legacy fallback: draw annotations directly into page content stream.
 * Use this when you need annotations "baked in" and non-editable.
 */
export async function flattenAnnotationsOnPage(
  page: PDFPage,
  shapesJson: string,
  scale: number,
  doc: PDFDocument,
) {
  const shapes: AnnotationShape[] = JSON.parse(shapesJson);
  if (shapes.length === 0) return;

  const pageH = page.getHeight();
  const font = await doc.embedFont("Helvetica" as never);

  for (const shape of shapes) {
    const strokeColor =
      shape.stroke && shape.stroke !== "transparent"
        ? rgb(...hexToRgbArray(shape.stroke))
        : undefined;
    const fillColor =
      shape.fill && shape.fill !== "transparent"
        ? rgb(...hexToRgbArray(shape.fill))
        : undefined;
    const sw = (shape.strokeWidth ?? 1) / scale;

    switch (shape.type) {
      case "rect": {
        const w = shape.width / scale;
        const h = shape.height / scale;
        const pdfX = shape.x / scale;
        const pdfY = pageH - shape.y / scale - h;
        page.drawRectangle({
          x: pdfX, y: pdfY, width: w, height: h,
          borderColor: strokeColor, color: fillColor,
          borderWidth: strokeColor ? sw : 0,
        });
        break;
      }
      case "ellipse": {
        const rx = shape.radiusX / scale;
        const ry = shape.radiusY / scale;
        page.drawEllipse({
          x: shape.x / scale, y: pageH - shape.y / scale,
          xScale: rx, yScale: ry,
          borderColor: strokeColor, color: fillColor,
          borderWidth: strokeColor ? sw : 0,
        });
        break;
      }
      case "line": {
        const [x1, y1, x2, y2] = shape.points;
        page.drawLine({
          start: { x: x1 / scale, y: pageH - y1 / scale },
          end: { x: x2 / scale, y: pageH - y2 / scale },
          color: strokeColor, thickness: sw,
        });
        break;
      }
      case "arrow": {
        const [ax1, ay1, ax2, ay2] = shape.points;
        page.drawLine({
          start: { x: ax1 / scale, y: pageH - ay1 / scale },
          end: { x: ax2 / scale, y: pageH - ay2 / scale },
          color: strokeColor, thickness: sw,
        });
        const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
        const headLen = 12 / scale;
        const tip = { x: ax2 / scale, y: pageH - ay2 / scale };
        const p1 = {
          x: tip.x - headLen * Math.cos(angle - Math.PI / 6),
          y: tip.y + headLen * Math.sin(angle - Math.PI / 6),
        };
        const p2 = {
          x: tip.x - headLen * Math.cos(angle + Math.PI / 6),
          y: tip.y + headLen * Math.sin(angle + Math.PI / 6),
        };
        const color = fillColor ?? strokeColor;
        page.drawLine({ start: tip, end: p1, color, thickness: sw });
        page.drawLine({ start: tip, end: p2, color, thickness: sw });
        page.drawLine({ start: p1, end: p2, color, thickness: sw });
        break;
      }
      case "text": {
        const fontSize = shape.fontSize / scale;
        const color = (shape.fill && shape.fill !== "transparent")
          ? rgb(...hexToRgbArray(shape.fill))
          : rgb(0, 0, 0);
        page.drawText(shape.text, {
          x: shape.x / scale,
          y: pageH - shape.y / scale - fontSize,
          size: fontSize, font, color,
        });
        break;
      }
    }
  }
}
