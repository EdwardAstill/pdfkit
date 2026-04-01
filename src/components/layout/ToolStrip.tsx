import { useState } from "react";
import { ExtractDialog } from "../operations/ExtractDialog";
import { RotateControls } from "../operations/RotateControls";
import { SplitDialog } from "../operations/SplitDialog";
import { ImposeDialog } from "../operations/ImposeDialog";
import { CombinePanel } from "../operations/CombinePanel";
import { InfoPanel } from "../operations/InfoPanel";
import { AnnotationToolbar } from "../annotation/AnnotationToolbar";
import { PropertyPanel } from "../annotation/PropertyPanel";
import type { TabId } from "./AppShell";

type Dialog = "extract" | "rotate" | "split" | "impose" | "combine" | "info" | null;

interface Props {
  activeTab: TabId;
}

const chipStyle = (hover = false): React.CSSProperties => ({
  padding: "4px 11px",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--r-sm)",
  background: hover ? "var(--chrome-hover)" : "transparent",
  color: "var(--text-mid)",
  fontSize: 11,
  fontWeight: 500,
  transition: "all 0.12s var(--ease)",
  whiteSpace: "nowrap",
});

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={chipStyle()}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--chrome-hover)";
        e.currentTarget.style.color = "var(--text-hi)";
        e.currentTarget.style.borderColor = "var(--line-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-mid)";
        e.currentTarget.style.borderColor = "var(--line-strong)";
      }}
    >
      {children}
    </button>
  );
}

export function ToolStrip({ activeTab }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 16px",
          background: "var(--chrome-raised)",
          borderBottom: "1px solid var(--line)",
          minHeight: 34,
          flexShrink: 0,
        }}
      >
        {activeTab === "pages" && (
          <>
            <Chip onClick={() => setDialog("extract")}>Extract</Chip>
            <Chip onClick={() => setDialog("combine")}>Combine</Chip>
            <Chip onClick={() => setDialog("rotate")}>Rotate</Chip>
            <Chip onClick={() => setDialog("split")}>Split</Chip>
            <Chip onClick={() => setDialog("impose")}>Impose</Chip>
            <div style={{ width: 1, height: 16, background: "var(--line)", margin: "0 4px" }} />
            <Chip onClick={() => setDialog("info")}>Info</Chip>
          </>
        )}
        {activeTab === "annotate" && (
          <>
            <AnnotationToolbar />
            <div style={{ width: 1, height: 16, background: "var(--line)", margin: "0 6px" }} />
            <PropertyPanel />
          </>
        )}
      </div>

      {dialog === "extract" && <ExtractDialog onClose={() => setDialog(null)} />}
      {dialog === "rotate" && <RotateControls onClose={() => setDialog(null)} />}
      {dialog === "split" && <SplitDialog onClose={() => setDialog(null)} />}
      {dialog === "impose" && <ImposeDialog onClose={() => setDialog(null)} />}
      {dialog === "combine" && <CombinePanel onClose={() => setDialog(null)} />}
      {dialog === "info" && <InfoPanel onClose={() => setDialog(null)} />}
    </>
  );
}
