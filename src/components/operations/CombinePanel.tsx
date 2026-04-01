import { useState, useRef } from "react";
import { Modal, dialogBtn } from "./Modal";
import { usePdfStore } from "../../store/usePdfStore";
import { combineDocuments } from "../../lib/pdfOperations";
import { downloadBytes } from "../../utils/download";

interface Props {
  onClose: () => void;
}

export function CombinePanel({ onClose }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const pdfBytes = usePdfStore((s) => s.pdfBytes);
  const fileName = usePdfStore((s) => s.fileName);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleCombine = async () => {
    if (!pdfBytes) return;
    const allBytes: Uint8Array[] = [pdfBytes];
    for (const f of files) {
      const buf = await f.arrayBuffer();
      allBytes.push(new Uint8Array(buf));
    }
    const result = await combineDocuments(allBytes);
    downloadBytes(new Uint8Array(result), fileName.replace(".pdf", "_combined.pdf"));
    onClose();
  };

  return (
    <Modal title="Combine PDFs" onClose={onClose}>
      <p style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 14, lineHeight: 1.5 }}>
        The current document is first. Add more PDFs to append:
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          padding: "6px 14px",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-sm)",
          background: "transparent",
          color: "var(--text-mid)",
          fontSize: 11,
          fontWeight: 500,
          marginBottom: 14,
        }}
      >
        + Add PDF files
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" multiple onChange={addFiles} style={{ display: "none" }} />
      {files.length > 0 && (
        <ul style={{ marginBottom: 16, paddingLeft: 18, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-mid)", lineHeight: 1.8 }}>
          {files.map((f, i) => <li key={i}>{f.name}</li>)}
        </ul>
      )}
      <button
        onClick={handleCombine}
        disabled={files.length === 0}
        style={{ ...dialogBtn, opacity: files.length > 0 ? 1 : 0.4 }}
      >
        Combine & Download
      </button>
    </Modal>
  );
}
