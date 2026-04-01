import { useAnnotationStore } from "../../store/useAnnotationStore";

/** Custom number stepper — replaces ugly native number input */
function NumStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <span
        style={{
          fontSize: 10,
          color: "var(--text-lo)",
          fontFamily: "var(--font-mono)",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
          background: "var(--chrome)",
          height: 24,
        }}
      >
        <button
          onClick={() => onChange(clamp(value - step))}
          style={{
            width: 18,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRight: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text-lo)",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--chrome-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          -
        </button>
        <span
          style={{
            width: 28,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-hi)",
            fontWeight: 500,
            userSelect: "none",
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(clamp(value + step))}
          style={{
            width: 18,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderLeft: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text-lo)",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--chrome-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          +
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 3,
  fontSize: 10,
  color: "var(--text-lo)",
  fontFamily: "var(--font-mono)",
  whiteSpace: "nowrap",
};

export function PropertyPanel() {
  const style = useAnnotationStore((s) => s.style);
  const setStyle = useAnnotationStore((s) => s.setStyle);

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {/* Stroke color */}
      <label style={labelStyle} title="Stroke color">
        <input
          type="color"
          value={style.strokeColor}
          onChange={(e) => setStyle({ strokeColor: e.target.value })}
          style={{
            width: 20,
            height: 20,
            border: "1.5px solid var(--line-strong)",
            borderRadius: 3,
            cursor: "pointer",
            padding: 0,
            background: "none",
          }}
        />
      </label>

      {/* Fill color + toggle */}
      <label style={labelStyle} title="Fill color">
        <input
          type="color"
          value={style.fillColor === "transparent" ? "#ffffff" : style.fillColor}
          onChange={(e) => setStyle({ fillColor: e.target.value })}
          style={{
            width: 20,
            height: 20,
            border: "1.5px solid var(--line-strong)",
            borderRadius: 3,
            cursor: "pointer",
            padding: 0,
            background: "none",
            opacity: style.fillColor === "transparent" ? 0.3 : 1,
          }}
        />
        <button
          onClick={() =>
            setStyle({
              fillColor: style.fillColor === "transparent" ? "#ffffff" : "transparent",
            })
          }
          style={{
            padding: "2px 5px",
            fontSize: 9,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-sm)",
            background: style.fillColor === "transparent" ? "var(--chrome-hover)" : "transparent",
            color: "var(--text-lo)",
            lineHeight: 1.2,
            letterSpacing: "0.04em",
            cursor: "pointer",
          }}
        >
          {style.fillColor === "transparent" ? "OFF" : "FILL"}
        </button>
      </label>

      {/* Divider */}
      <div style={{ width: 1, height: 16, background: "var(--line)", flexShrink: 0 }} />

      {/* Stroke width */}
      <NumStepper
        label="W"
        value={style.strokeWidth}
        onChange={(v) => setStyle({ strokeWidth: v })}
        min={1}
        max={20}
      />

      {/* Font size */}
      <NumStepper
        label="Aa"
        value={style.fontSize}
        onChange={(v) => setStyle({ fontSize: v })}
        min={8}
        max={72}
        step={2}
      />
    </div>
  );
}
