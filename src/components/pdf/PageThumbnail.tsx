import type { PDFDocumentProxy } from "pdfjs-dist";
import { usePdfRenderer } from "../../hooks/usePdfRenderer";

interface Props {
  pdfjsDoc: PDFDocumentProxy;
  pageIndex: number;
  isActive: boolean;
  onClick: () => void;
  thumbHeight: number;
  pageWidth: number;
  pageHeight: number;
}

export function PageThumbnail({
  pdfjsDoc,
  pageIndex,
  isActive,
  onClick,
  thumbHeight,
  pageWidth,
  pageHeight,
}: Props) {
  // Compute scale so the rendered canvas CSS height = thumbHeight
  const aspect = pageWidth / pageHeight;
  const thumbScale = thumbHeight / pageHeight;
  const thumbWidth = thumbHeight * aspect;

  const { canvasRef } = usePdfRenderer(pdfjsDoc, pageIndex, thumbScale);

  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        cursor: "pointer",
        textAlign: "center",
        transition: "transform 0.12s var(--ease)",
      }}
    >
      <div
        style={{
          width: thumbWidth + 4,
          height: thumbHeight + 4,
          padding: 2,
          borderRadius: "var(--r-sm)",
          border: isActive
            ? "2px solid var(--active)"
            : "2px solid transparent",
          background: isActive ? "var(--active-soft)" : "transparent",
          transition: "all 0.12s var(--ease)",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: thumbWidth,
            height: thumbHeight,
            borderRadius: 2,
            background: "var(--page-white)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 9,
          fontFamily: "var(--font-mono)",
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "var(--active)" : "var(--text-lo)",
          marginTop: 2,
          lineHeight: 1,
        }}
      >
        {pageIndex + 1}
      </div>
    </div>
  );
}
