import { useState, useRef, useEffect, useCallback } from "react";
import { useTextEditStore } from "../../store/useTextEditStore";
import type { PdfTextItem } from "../../types/textEdit";

interface Props {
  pageIndex: number;
  width: number;
  height: number;
}

function TextItemOverlay({ item }: { item: PdfTextItem }) {
  const editingId = useTextEditStore((s) => s.editingId);
  const edits = useTextEditStore((s) => s.edits);
  const store = useTextEditStore;

  const isEditing = editingId === item.id;
  const edit = edits.get(item.id);
  const displayText = edit ? edit.replacement : item.str;
  const isEdited = !!edit;

  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(displayText);
  const localValueRef = useRef(localValue);
  localValueRef.current = localValue;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setLocalValue(displayText);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    store.getState().setEdit(item.id, item.str, localValueRef.current);
    store.getState().setEditingId(null);
  }, [item.id, item.str]);

  const handleDblClick = useCallback(() => {
    store.getState().setEditingId(item.id);
  }, [item.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        commit();
      }
      if (e.key === "Escape") {
        store.getState().setEditingId(null);
      }
    },
    [commit],
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={{
          position: "absolute",
          left: item.x,
          top: item.y,
          width: Math.max(item.width + 20, 60),
          height: item.height + 4,
          fontSize: item.fontSize,
          fontFamily: item.fontFamily,
          lineHeight: `${item.height}px`,
          padding: "0 2px",
          border: "2px solid #4d8eff",
          borderRadius: 2,
          background: "rgba(255,255,255,0.95)",
          color: "#000",
          outline: "none",
          zIndex: 20,
          boxSizing: "border-box",
        }}
      />
    );
  }

  // If edited, render the replacement text visually (covering the original)
  if (isEdited) {
    return (
      <div
        onDoubleClick={handleDblClick}
        title="Double-click to edit"
        style={{
          position: "absolute",
          left: item.x,
          top: item.y,
          minWidth: item.width,
          height: item.height,
          cursor: "text",
          background: "#fff",
          zIndex: 5,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          borderBottom: "1.5px solid rgba(77, 142, 255, 0.4)",
        }}
      >
        <span
          style={{
            fontSize: item.fontSize,
            fontFamily: item.fontFamily,
            lineHeight: 1,
            color: "#000",
            whiteSpace: "nowrap",
          }}
        >
          {displayText}
        </span>
      </div>
    );
  }

  // Unedited — invisible hit target over original PDF text
  return (
    <div
      onDoubleClick={handleDblClick}
      title="Double-click to edit"
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        cursor: "text",
        zIndex: 5,
        boxSizing: "border-box",
      }}
    />
  );
}

export function TextOverlay({ pageIndex, width, height }: Props) {
  const textItems = useTextEditStore((s) => s.textItems.get(pageIndex));

  if (!textItems || textItems.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "auto",
        zIndex: 2,
      }}
    >
      {textItems.map((item) => (
        <TextItemOverlay key={item.id} item={item} />
      ))}
    </div>
  );
}
