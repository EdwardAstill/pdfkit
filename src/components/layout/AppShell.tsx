import { useState } from "react";
import { usePdfStore } from "../../store/usePdfStore";
import { Header } from "./Header";
import { ToolStrip } from "./ToolStrip";
import { PdfViewer } from "../pdf/PdfViewer";
import { PageSidebar } from "../pdf/PageSidebar";
import { DropZone } from "../pdf/DropZone";

export type TabId = "pages" | "annotate";

export function AppShell() {
  const pdfjsDoc = usePdfStore((s) => s.pdfjsDoc);
  const [activeTab, setActiveTab] = useState<TabId>("pages");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--chrome)",
      }}
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {pdfjsDoc && <ToolStrip activeTab={activeTab} />}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {pdfjsDoc ? (
          <>
            <PageSidebar />
            <PdfViewer activeTab={activeTab} />
          </>
        ) : (
          <DropZone />
        )}
      </div>
    </div>
  );
}
