import type { ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--chrome-raised)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          minWidth: 380,
          maxWidth: 520,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          color: "var(--text-hi)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "var(--chrome-hover)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-sm)",
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "var(--text-lo)",
            }}
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const dialogInput: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--r-sm)",
  background: "var(--chrome)",
  color: "var(--text-hi)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
};

export const dialogBtn: React.CSSProperties = {
  padding: "7px 18px",
  background: "var(--active)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--r-sm)",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--font-ui)",
  transition: "opacity 0.12s var(--ease)",
};

export const dialogLabel: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-lo)",
  fontFamily: "var(--font-mono)",
  marginBottom: 6,
  display: "block",
};
