import type { PDFDocumentProxy } from "pdfjs-dist";
import { usePdfRenderer, RENDER_SCALE } from "../../hooks/usePdfRenderer";
import { useTextExtract } from "../../hooks/useTextExtract";
import { usePdfStore } from "../../store/usePdfStore";
import { AnnotationLayer } from "../annotation/AnnotationLayer";
import { TextOverlay } from "./TextOverlay";
import type { TabId } from "../layout/AppShell";

interface Props {
  pdfjsDoc: PDFDocumentProxy;
  pageIndex: number;
  scale?: number;
  activeTab: TabId;
}

export function PdfPage({ pdfjsDoc, pageIndex, scale = RENDER_SCALE, activeTab }: Props) {
  const { canvasRef } = usePdfRenderer(pdfjsDoc, pageIndex, scale);
  const pageInfo = usePdfStore((s) => s.pages[pageIndex]);

  // Extract text items for this page
  useTextExtract(pdfjsDoc, pageIndex, scale);

  const w = Math.round(pageInfo.width * scale);
  const h = Math.round(pageInfo.height * scale);

  return (
    <div
      style={{
        position: "relative",
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        display: "inline-block",
        background: "var(--page-white)",
        borderRadius: 2,
        width: w,
        height: h,
        zIndex: 1,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* Text editing overlay — active on pages tab */}
      {activeTab === "pages" && (
        <TextOverlay pageIndex={pageIndex} width={w} height={h} />
      )}

      {/* Annotation layer — active on annotate tab */}
      {activeTab === "annotate" && (
        <AnnotationLayer pageIndex={pageIndex} width={w} height={h} />
      )}
    </div>
  );
}
