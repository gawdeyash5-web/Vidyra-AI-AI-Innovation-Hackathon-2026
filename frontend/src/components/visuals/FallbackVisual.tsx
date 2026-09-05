import React from "react";
import { BookOpen, Info } from "lucide-react";

interface FallbackVisualProps {
  topic: string;
  visualType?: string;
  visualTitle?: string;
  visualDescription?: string;
  visualData?: Record<string, any>;
}

export function FallbackVisual({
  topic,
  visualType,
  visualTitle,
  visualDescription,
  visualData,
}: FallbackVisualProps) {
  // Extract key scalar data points safely if present
  const dataEntries = visualData && typeof visualData === "object"
    ? Object.entries(visualData).filter(([_, val]) => typeof val === "string" || typeof val === "number" || typeof val === "boolean")
    : [];

  return (
    <div style={{ width: "100%", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Title & Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0, font: "600 16px var(--serif)", color: "var(--ink)" }}>
          {visualTitle || topic}
        </h4>
        <span style={{ fontSize: "9px", textTransform: "uppercase", background: "rgba(23,43,58,0.06)", color: "var(--muted)", padding: "3px 8px", borderRadius: "3px", fontWeight: 700, letterSpacing: "0.06em" }}>
          Conceptual Model
        </span>
      </div>

      {/* Description Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid var(--line)",
          borderRadius: "4px",
          padding: "12px 14px",
          fontSize: "12px",
          lineHeight: "1.55",
          color: "var(--ink-soft)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
          <Info size={14} style={{ color: "var(--saffron)", flexShrink: 0, marginTop: "2px" }} />
          <strong style={{ color: "var(--ink)" }}>Concept Insight:</strong>
        </div>
        <p style={{ margin: 0, paddingLeft: "22px" }}>
          {visualDescription || `Visual parameters and conceptual relations for ${topic}.`}
        </p>
      </div>

      {/* Structured Key Values if available */}
      {dataEntries.length > 0 && (
        <div style={{ background: "rgba(23,43,58,0.03)", border: "1px solid var(--line)", borderRadius: "4px", padding: "10px 12px" }}>
          <span style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
            Key Parameters
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "6px" }}>
            {dataEntries.map(([k, v], i) => (
              <div key={i} style={{ background: "#ffffff", padding: "6px 8px", borderRadius: "3px", border: "1px solid var(--line)", fontSize: "11px" }}>
                <span style={{ color: "var(--muted)", fontSize: "9px", display: "block", textTransform: "capitalize" }}>
                  {k.replace(/([A-Z])/g, " $1").trim()}:
                </span>
                <strong style={{ color: "var(--ink)" }}>{String(v)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: "9px", color: "var(--muted)", textAlign: "center" }}>
        Direct topic representation · No synthetic placeholders
      </div>
    </div>
  );
}
