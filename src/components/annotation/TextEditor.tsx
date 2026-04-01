import { useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
}

/**
 * HTML textarea overlay that matches the Konva text position and style.
 * Supports multi-line (Shift+Enter), auto-grows vertically, and commits
 * on Enter or blur.
 */
export function TextEditor({ value, onChange, onFinish, x, y, fontSize, fontFamily, color, width }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and select all on mount
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  // Auto-resize height to fit content
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onFinish();
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onFinish();
      }
      // Stop propagation so annotation keyboard shortcuts don't fire
      e.stopPropagation();
    },
    [onFinish]
  );

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onFinish}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize,
        fontFamily,
        color,
        width: Math.max(width, 60),
        minHeight: fontSize * 1.4 + 8,
        border: "2px solid #4d8eff",
        borderRadius: 2,
        background: "rgba(255,255,255,0.95)",
        padding: "2px 4px",
        outline: "none",
        resize: "horizontal",
        lineHeight: 1.2,
        zIndex: 10,
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
      }}
    />
  );
}
