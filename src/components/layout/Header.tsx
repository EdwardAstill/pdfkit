import { useRef, useState } from "react";
import { usePdfStore } from "../../store/usePdfStore";
import { useAnnotationStore } from "../../store/useAnnotationStore";
import { useTextEditStore } from "../../store/useTextEditStore";
import { exportWithAnnotations, type ExportMode } from "../../lib/pdfExport";
import { downloadBytes } from "../../utils/download";
import { RENDER_SCALE } from "../../hooks/usePdfRenderer";
import type { TabId } from "./AppShell";

interface Props {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: "pages", label: "Pages" },
  { id: "annotate", label: "Annotate" },
];

export function Header({ activeTab, setActiveTab }: Props) {
  const fileName = usePdfStore((s) => s.fileName);
  const loadFile = usePdfStore((s) => s.loadFile);
  const pdfjsDoc = usePdfStore((s) => s.pdfjsDoc);
  const pages = usePdfStore((s) => s.pages);
  const pdfBytes = usePdfStore((s) => s.pdfBytes);
  const annotations = useAnnotationStore((s) => s.annotations);
  const textEdits = useTextEditStore((s) => s.edits);
  const textItems = useTextEditStore((s) => s.textItems);
  const inputRef = useRef<HTMLInputElement>(null);
  const [exportMode, setExportMode] = useState<ExportMode>("annotate");

  const handleExport = async () => {
    if (!pdfBytes) return;
    const result = await exportWithAnnotations(
      pdfBytes, annotations, RENDER_SCALE, exportMode, textEdits, textItems,
    );
    const suffix = exportMode === "flatten" ? "_flattened" : "_annotated";
    downloadBytes(new Uint8Array(result), fileName.replace(".pdf", `${suffix}.pdf`));
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: 40,
        background: "var(--chrome)",
        borderBottom: "1px solid var(--line)",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Open button */}
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          background: "transparent",
          border: "none",
          borderRight: "1px solid var(--line)",
          color: "var(--text-mid)",
          fontSize: 12,
          fontWeight: 500,
          transition: `color 0.15s var(--ease)`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-hi)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-mid)")}
      >
        Open
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) loadFile(f);
        }}
      />

      {/* Tabs — only visible when a PDF is loaded */}
      {pdfjsDoc && (
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={isActive ? "tab-active" : ""}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  background: "transparent",
                  border: "none",
                  color: isActive ? "var(--text-hi)" : "var(--text-lo)",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.01em",
                  transition: `color 0.15s var(--ease)`,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Right side — file info + export */}
      {pdfjsDoc && (
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 14px",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-lo)",
              fontWeight: 400,
            }}
          >
            {fileName} &mdash; {pages.length} page{pages.length !== 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setExportMode(exportMode === "annotate" ? "flatten" : "annotate")}
              title={exportMode === "annotate"
                ? "Editable annotations — click to switch to flattened"
                : "Flattened into page — click to switch to editable annotations"}
              style={{
                padding: "4px 8px",
                background: "transparent",
                border: "1px solid var(--line-strong)",
                borderRadius: "var(--r-sm)",
                color: "var(--text-lo)",
                fontSize: 9,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                cursor: "pointer",
                lineHeight: 1.2,
              }}
            >
              {exportMode === "annotate" ? "ANNOT" : "FLAT"}
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: "5px 14px",
                background: "var(--accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.02em",
                transition: `opacity 0.15s var(--ease)`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
