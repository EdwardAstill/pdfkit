import { useState } from "react";
import { Modal, dialogInput, dialogBtn, dialogLabel } from "./Modal";
import { usePdfStore } from "../../store/usePdfStore";
import { parsePageRange } from "../../lib/pageRange";
import { extractPages } from "../../lib/pdfOperations";
import { downloadBytes } from "../../utils/download";

interface Props {
  onClose: () => void;
}

export function ExtractDialog({ onClose }: Props) {
  const [range, setRange] = useState("");
  const pdfBytes = usePdfStore((s) => s.pdfBytes);
  const pages = usePdfStore((s) => s.pages);
  const fileName = usePdfStore((s) => s.fileName);

  const handleExtract = async () => {
    if (!pdfBytes) return;
    const indices = parsePageRange(range, pages.length);
    if (indices.length === 0) return;
    const result = await extractPages(pdfBytes, indices);
    downloadBytes(
      new Uint8Array(result),
      fileName.replace(".pdf", "_extracted.pdf")
    );
    onClose();
  };

  return (
    <Modal title="Extract Pages" onClose={onClose}>
      <label style={dialogLabel}>
        Pages to extract &middot; {pages.length} total
      </label>
      <input
        value={range}
        onChange={(e) => setRange(e.target.value)}
        placeholder="1, 3, 5-8"
        style={{ ...dialogInput, marginBottom: 16 }}
        autoFocus
      />
      <button
        onClick={handleExtract}
        disabled={!range.trim()}
        style={{ ...dialogBtn, opacity: range.trim() ? 1 : 0.4 }}
      >
        Extract & Download
      </button>
    </Modal>
  );
}
