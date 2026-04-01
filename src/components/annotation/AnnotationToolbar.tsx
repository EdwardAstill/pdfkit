import { useAnnotationStore } from "../../store/useAnnotationStore";
import type { AnnotationTool } from "../../types/annotation";

const tools: { id: AnnotationTool; label: string; icon: JSX.Element }[] = [
  {
    id: "select",
    label: "Select (V)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 1L2 12L5.5 8.5L8.5 13L10.5 12L7.5 7L12 7L2 1Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "rectangle",
    label: "Rectangle (R)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="2.5" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "circle",
    label: "Ellipse (O)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5.5" ry="4.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "line",
    label: "Line (L)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "arrow",
    label: "Arrow (A)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <line x1="2" y1="12" x2="11" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 2H12V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text (T)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 3H11V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function AnnotationToolbar() {
  const activeTool = useAnnotationStore((s) => s.activeTool);
  const setActiveTool = useAnnotationStore((s) => s.setActiveTool);

  return (
    <div
      style={{
        display: "flex",
        gap: 1,
        padding: 2,
        background: "var(--chrome)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--line)",
      }}
    >
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
            style={{
              width: 30,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: "var(--r-sm)",
              background: isActive ? "var(--active)" : "transparent",
              color: isActive ? "#fff" : "var(--text-lo)",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.1s var(--ease)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = "var(--chrome-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}
