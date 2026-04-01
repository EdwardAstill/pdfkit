import { useState } from "react";
import { Modal, dialogBtn, dialogLabel } from "./Modal";
import { usePdfStore } from "../../store/usePdfStore";
import { splitDocument } from "../../lib/pdfOperations";
import { downloadBytes } from "../../utils/download";

interface Props {
  onClose: () => void;
}

export function SplitDialog({ onClose }: Props) {
  const [every, setEvery] = useState(1);
  const pdfBytes = usePdfStore((s) => s.pdfBytes);
  const pages = usePdfStore((s) => s.pages);
  const fileName = usePdfStore((s) => s.fileName);

  const handleSplit = async () => {
    if (!pdfBytes) return;
    const results = await splitDocument(pdfBytes, every);
    const stem = fileName.replace(".pdf", "");
    for (const { bytes, label } of results) {
      downloadBytes(new Uint8Array(bytes), `${stem}_p${label}.pdf`);
    }
    onClose();
  };

  return (
    <Modal title="Split PDF" onClose={onClose}>
      <label style={dialogLabel}>{pages.length} pages total</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 12, color: "var(--text-mid)" }}>Split every</span>
        <input
          type="number"
          min={1}
          max={pages.length}
          value={every}
          onChange={(e) => setEvery(Math.max(1, parseInt(e.target.value) || 1))}
          style={{
            width: 56,
            padding: "5px 8px",
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--r-sm)",
            background: "var(--chrome)",
            color: "var(--text-hi)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            textAlign: "center",
          }}
        />
        <span style={{ fontSize: 12, color: "var(--text-mid)" }}>page{every > 1 ? "s" : ""}</span>
      </div>
      <button onClick={handleSplit} style={dialogBtn}>Split & Download</button>
    </Modal>
  );
}
