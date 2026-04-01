import { Modal } from "./Modal";
import { usePdfStore } from "../../store/usePdfStore";
import { getPdfInfo } from "../../lib/pdfOperations";

interface Props {
  onClose: () => void;
}

export function InfoPanel({ onClose }: Props) {
  const pdfLibDoc = usePdfStore((s) => s.pdfLibDoc);
  const fileName = usePdfStore((s) => s.fileName);

  if (!pdfLibDoc) return null;
  const info = getPdfInfo(pdfLibDoc);

  const rows: [string, string][] = [
    ["File", fileName],
    ["Pages", String(info.pageCount)],
    ["Size", `${info.width.toFixed(1)} x ${info.height.toFixed(1)} pt  (${(info.width / 72).toFixed(2)} x ${(info.height / 72).toFixed(2)} in)`],
  ];
  if (info.title) rows.push(["Title", info.title]);
  if (info.author) rows.push(["Author", info.author]);
  if (info.creator) rows.push(["Creator", info.creator]);
  if (info.producer) rows.push(["Producer", info.producer]);
  if (info.creationDate) rows.push(["Created", info.creationDate]);
  if (info.modDate) rows.push(["Modified", info.modDate]);

  return (
    <Modal title="PDF Info" onClose={onClose}>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{
                padding: "7px 12px 7px 0", fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--text-lo)", whiteSpace: "nowrap", verticalAlign: "top",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}>{label}</td>
              <td style={{ padding: "7px 0", wordBreak: "break-all", color: "var(--text-mid)" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
