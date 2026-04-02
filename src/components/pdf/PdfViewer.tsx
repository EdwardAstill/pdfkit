import { useRef, useState, useEffect } from "react";
import { usePdfStore } from "../../store/usePdfStore";
import { useAnnotationStore } from "../../store/useAnnotationStore";
import { PdfPage } from "./PdfPage";
import type { TabId } from "../layout/AppShell";

export function PdfViewer({ activeTab }: { activeTab: TabId }) {
  const pdfjsDoc = usePdfStore((s) => s.pdfjsDoc);
  const pages = usePdfStore((s) => s.pages);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1.5);

  useEffect(() => {
    if (!pages.length || !containerRef.current) return;

    const updateScale = () => {
      const containerWidth = containerRef.current!.clientWidth - 64;
      const maxPageWidth = Math.max(...pages.map((p) => p.width));
      // Fit to width — scroll vertically for multi-page docs
      const scale = Math.min(containerWidth / maxPageWidth, 2.5);
      setFitScale(Math.max(scale, 0.4));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pages]);

  // Keep annotation store in sync with the actual display scale
  useEffect(() => {
    useAnnotationStore.getState().setRenderScale(fitScale);
  }, [fitScale]);

  if (!pdfjsDoc) return null;

  return (
    <div
      ref={containerRef}
      className="canvas-area"
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 32px",
      }}
    >
      {pages.map((_, i) => (
        <PdfPage
          key={`${i}-${fitScale}`}
          pdfjsDoc={pdfjsDoc}
          pageIndex={i}
          scale={fitScale}
          activeTab={activeTab}
        />
      ))}
    </div>
  );
}
