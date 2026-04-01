import { useState } from "react";
import { Modal, dialogInput, dialogBtn, dialogLabel } from "./Modal";
import { usePdfStore } from "../../store/usePdfStore";
import { parsePageRange } from "../../lib/pageRange";
import { rotatePages } from "../../lib/pdfOperations";

interface Props {
  onClose: () => void;
}

export function RotateControls({ onClose }: Props) {
  const [angle, setAngle] = useState(90);
  const [range, setRange] = useState("");
  const pdfBytes = usePdfStore((s) => s.pdfBytes);
  const pages = usePdfStore((s) => s.pages);
  const loadBytes = usePdfStore((s) => s.loadBytes);
  const fileName = usePdfStore((s) => s.fileName);

  const handleRotate = async () => {
    if (!pdfBytes) return;
    const indices = range.trim()
      ? parsePageRange(range, pages.length)
      : pages.map((_, i) => i);
    const result = await rotatePages(pdfBytes, indices, angle);
    await loadBytes(new Uint8Array(result), fileName);
    onClose();
  };

  return (
    <Modal title="Rotate Pages" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={dialogLabel}>Pages (empty = all)</label>
        <input
          value={range}
          onChange={(e) => setRange(e.target.value)}
          placeholder="e.g. 1, 3, 5-8"
          style={dialogInput}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[90, 180, 270].map((a) => (
          <button
            key={a}
            onClick={() => setAngle(a)}
            style={{
              padding: "7px 18px",
              border: `1px solid ${angle === a ? "var(--active)" : "var(--line-strong)"}`,
              borderRadius: "var(--r-sm)",
              background: angle === a ? "var(--active-soft)" : "transparent",
              color: angle === a ? "var(--active)" : "var(--text-mid)",
              fontWeight: angle === a ? 600 : 400,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            {a}°
          </button>
        ))}
      </div>
      <button onClick={handleRotate} style={dialogBtn}>Rotate</button>
    </Modal>
  );
}
