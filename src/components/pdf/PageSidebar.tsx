import { usePdfStore } from "../../store/usePdfStore";
import { PageThumbnail } from "./PageThumbnail";

const SIDEBAR_WIDTH = 160;
const THUMB_AREA_WIDTH = SIDEBAR_WIDTH - 24; // padding

export function PageSidebar() {
  const pdfjsDoc = usePdfStore((s) => s.pdfjsDoc);
  const pages = usePdfStore((s) => s.pages);
  const currentPage = usePdfStore((s) => s.currentPage);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);

  if (!pdfjsDoc) return null;

  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        overflow: "auto",
        borderRight: "1px solid var(--line)",
        padding: "10px 12px",
        background: "var(--chrome-raised)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {pages.map((page, i) => {
        // Compute thumb height to fit within the sidebar width
        const aspect = page.width / page.height;
        const thumbWidth = THUMB_AREA_WIDTH;
        const thumbHeight = thumbWidth / aspect;

        return (
          <PageThumbnail
            key={i}
            pdfjsDoc={pdfjsDoc}
            pageIndex={i}
            isActive={i === currentPage}
            onClick={() => setCurrentPage(i)}
            thumbHeight={thumbHeight}
            pageWidth={page.width}
            pageHeight={page.height}
          />
        );
      })}
    </div>
  );
}
