import { useState } from "react";
import { Modal, dialogBtn } from "./Modal";
import { usePdfStore } from "../../store/usePdfStore";
import { imposeNup, imposeBooklet } from "../../lib/pdfOperations";
import { downloadBytes } from "../../utils/download";

interface Props {
  onClose: () => void;
}

/** Mini page rectangle for the visual preview */
function MiniPage({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--page-white, #fff)",
        border: "1px solid var(--line-strong)",
        borderRadius: 2,
        fontSize: 9,
        fontFamily: "var(--font-mono)",
        color: "var(--text-lo)",
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

/** Visual preview of N-Up layout */
function NupPreview({ cols, rows, landscape }: { cols: number; rows: number; landscape: boolean }) {
  const longSide = 160;
  const shortSide = 120;
  const sheetW = landscape ? longSide : shortSide;
  const sheetH = landscape ? shortSide : longSide;
  const gap = 3;

  const pages: number[] = [];
  for (let i = 1; i <= cols * rows; i++) pages.push(i);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: sheetW,
          height: sheetH,
          background: "var(--chrome-hover)",
          border: "1.5px solid var(--line-strong)",
          borderRadius: 4,
          padding: gap,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap,
          transition: "width 0.2s ease, height 0.2s ease",
        }}
      >
        {pages.map((n) => (
          <MiniPage key={n} label={String(n)} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: "var(--text-lo)", fontFamily: "var(--font-mono)" }}>
        {landscape ? "Landscape" : "Portrait"} sheet
      </div>
    </div>
  );
}

/** Visual preview of booklet layout */
function BookletPreview() {
  const sheetW = 160;
  const sheetH = 100;
  const gap = 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div style={{ fontSize: 9, color: "var(--text-lo)", fontFamily: "var(--font-mono)", marginBottom: 3 }}>
          Sheet 1 — front
        </div>
        <div
          style={{
            width: sheetW, height: sheetH,
            background: "var(--chrome-hover)",
            border: "1.5px solid var(--line-strong)",
            borderRadius: 4,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap, padding: gap,
          }}
        >
          <MiniPage label="4" />
          <MiniPage label="1" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: "var(--text-lo)", fontFamily: "var(--font-mono)", marginBottom: 3 }}>
          Sheet 1 — back
        </div>
        <div
          style={{
            width: sheetW, height: sheetH,
            background: "var(--chrome-hover)",
            border: "1.5px solid var(--line-strong)",
            borderRadius: 4,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap, padding: gap,
          }}
        >
          <MiniPage label="2" />
          <MiniPage label="3" />
        </div>
      </div>
    </div>
  );
}

/** Orientation toggle button */
function OrientationToggle({ landscape, onChange }: { landscape: boolean; onChange: (v: boolean) => void }) {
  const btn = (isLandscape: boolean, label: string) => {
    const active = landscape === isLandscape;
    return (
      <button
        onClick={() => onChange(isLandscape)}
        title={label}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          padding: "5px 10px",
          border: `1px solid ${active ? "var(--active)" : "var(--line-strong)"}`,
          borderRadius: "var(--r-sm)",
          background: active ? "var(--active-soft)" : "transparent",
          color: active ? "var(--active)" : "var(--text-lo)",
          fontSize: 10,
          fontWeight: active ? 600 : 400,
          cursor: "pointer",
        }}
      >
        {/* Mini orientation icon */}
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
          {isLandscape ? (
            <rect x="1" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          ) : (
            <rect x="4" y="0.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          )}
        </svg>
        {label}
      </button>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-lo)", marginBottom: 4 }}>
        Orientation
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {btn(false, "Portrait")}
        {btn(true, "Landscape")}
      </div>
    </div>
  );
}

export function ImposeDialog({ onClose }: Props) {
  const [mode, setMode] = useState<"nup" | "booklet">("nup");
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(1);
  const [landscape, setLandscape] = useState(false);
  const pdfBytes = usePdfStore((s) => s.pdfBytes);
  const fileName = usePdfStore((s) => s.fileName);

  const handleImpose = async () => {
    if (!pdfBytes) return;
    const stem = fileName.replace(".pdf", "");
    let result: Uint8Array;
    let name: string;
    if (mode === "booklet") {
      result = new Uint8Array(await imposeBooklet(pdfBytes));
      name = `${stem}_booklet.pdf`;
    } else {
      result = new Uint8Array(await imposeNup(pdfBytes, cols, rows, landscape));
      name = `${stem}_${cols}x${rows}.pdf`;
    }
    downloadBytes(result, name);
    onClose();
  };

  const tabBtn = (isActive: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    border: `1px solid ${isActive ? "var(--active)" : "var(--line-strong)"}`,
    borderRadius: "var(--r-sm)",
    background: isActive ? "var(--active-soft)" : "transparent",
    color: isActive ? "var(--active)" : "var(--text-mid)",
    fontSize: 11,
    fontWeight: isActive ? 600 : 400,
  });

  const numInput = (val: number, setter: (v: number) => void, label: string) => (
    <div>
      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-lo)", marginBottom: 4 }}>{label}</div>
      <input
        type="number" min={1} max={6} value={val}
        onChange={(e) => setter(Math.max(1, parseInt(e.target.value) || 1))}
        style={{
          width: 52, padding: "5px 8px",
          border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)",
          background: "var(--chrome)", color: "var(--text-hi)",
          fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center",
        }}
      />
    </div>
  );

  return (
    <Modal title="Impose" onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setMode("nup")} style={tabBtn(mode === "nup")}>N-Up</button>
        <button onClick={() => setMode("booklet")} style={tabBtn(mode === "booklet")}>Booklet</button>
      </div>

      {mode === "nup" && (
        <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 11, color: "var(--text-mid)", lineHeight: 1.5, margin: 0 }}>
              Place multiple pages on each sheet. Pages are arranged left-to-right, top-to-bottom.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              {numInput(cols, setCols, "Columns")}
              {numInput(rows, setRows, "Rows")}
            </div>
            <OrientationToggle landscape={landscape} onChange={setLandscape} />
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "var(--text-lo)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
              Preview
            </div>
            <NupPreview cols={cols} rows={rows} landscape={landscape} />
          </div>
        </div>
      )}

      {mode === "booklet" && (
        <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "var(--text-mid)", lineHeight: 1.6, margin: 0 }}>
              Pages are reordered for saddle-stitch booklet printing. Print double-sided, fold in half, and staple along the spine.
            </p>
            <p style={{ fontSize: 10, color: "var(--text-lo)", lineHeight: 1.5, marginTop: 8 }}>
              Output is always landscape (two pages side by side). For a 4-page document, sheet 1 front has pages 4 and 1; back has pages 2 and 3.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <BookletPreview />
          </div>
        </div>
      )}

      <button onClick={handleImpose} style={dialogBtn}>Impose & Download</button>
    </Modal>
  );
}
