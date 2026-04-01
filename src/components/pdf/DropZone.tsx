import { useRef, useState } from "react";
import { useFileHandler } from "../../hooks/useFileHandler";

export function DropZone() {
  const { onDrop, onDragOver, onFileSelect } = useFileHandler();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovering, setHovering] = useState(false);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--chrome)",
        position: "relative",
      }}
    >
      {/* Decorative grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `
            linear-gradient(var(--text-lo) 1px, transparent 1px),
            linear-gradient(90deg, var(--text-lo) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      <div
        onDrop={(e) => { setHovering(false); onDrop(e); }}
        onDragOver={onDragOver}
        onDragEnter={() => setHovering(true)}
        onDragLeave={() => setHovering(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 420,
          height: 280,
          border: hovering
            ? "2px solid var(--accent)"
            : "1px solid var(--line-strong)",
          borderRadius: "var(--r-lg)",
          cursor: "pointer",
          transition: "all 0.25s var(--ease)",
          background: hovering ? "var(--accent-soft)" : "var(--chrome-raised)",
        }}
      >
        {/* Abstract PDF icon */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <div
            style={{
              width: 44,
              height: 56,
              border: `1.5px solid ${hovering ? "var(--accent)" : "var(--text-lo)"}`,
              borderRadius: 4,
              position: "relative",
              transition: "border-color 0.25s var(--ease)",
            }}
          >
            {/* Corner fold */}
            <div
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 14,
                height: 14,
                borderLeft: `1.5px solid ${hovering ? "var(--accent)" : "var(--text-lo)"}`,
                borderBottom: `1.5px solid ${hovering ? "var(--accent)" : "var(--text-lo)"}`,
                borderRadius: "0 0 0 3px",
                background: hovering ? "var(--accent-soft)" : "var(--chrome-raised)",
                transition: "all 0.25s var(--ease)",
              }}
            />
            {/* Content lines */}
            {[20, 28, 36].map((y) => (
              <div
                key={y}
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  top: y,
                  height: 1.5,
                  background: hovering ? "var(--accent)" : "var(--line-strong)",
                  borderRadius: 1,
                  opacity: 0.5,
                  transition: "background 0.25s var(--ease)",
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: hovering ? "var(--accent)" : "var(--text-mid)",
            marginBottom: 4,
            transition: "color 0.25s var(--ease)",
          }}
        >
          Drop a PDF here
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-lo)",
            fontWeight: 400,
          }}
        >
          or click to browse files
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onFileSelect}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
