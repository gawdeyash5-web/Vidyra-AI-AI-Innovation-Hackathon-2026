import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface BiologyStage {
  name: string;
  description: string;
}

interface BiologyProcessVisualProps {
  visualData?: {
    organismOrSite?: string;
    inputs?: string[];
    outputs?: string[];
    stages?: BiologyStage[];
    [key: string]: any;
  };
}

export function BiologyProcessVisual({ visualData }: BiologyProcessVisualProps) {
  const hasData = (Array.isArray(visualData?.inputs) && visualData.inputs.length > 0) ||
    (Array.isArray(visualData?.outputs) && visualData.outputs.length > 0) ||
    (Array.isArray(visualData?.stages) && visualData.stages.length > 0);

  if (!hasData) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Biological process mechanism not specified for this concept.
      </div>
    );
  }

  const site = visualData?.organismOrSite || "Biological Site / Pathway";
  const inputs = Array.isArray(visualData?.inputs) ? visualData.inputs : [];
  const outputs = Array.isArray(visualData?.outputs) ? visualData.outputs : [];
  const stages: BiologyStage[] = Array.isArray(visualData?.stages) ? visualData.stages : [];

  const [activeStageIdx, setActiveStageIdx] = useState(0);

  useEffect(() => {
    setActiveStageIdx(0);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Cellular Frame */}
      <div
        style={{
          width: "100%",
          background: "linear-gradient(135deg, rgba(72,104,92,0.08) 0%, rgba(215,139,42,0.06) 100%)",
          border: "1.5px solid rgba(72,104,92,0.3)",
          borderRadius: "8px",
          padding: "14px 16px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--forest)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Sparkles size={11} /> Site: {site}
          </span>
          <span style={{ fontSize: "9px", color: "var(--muted)" }}>Biological Mechanism</span>
        </div>

        {/* Inputs vs Outputs Bar */}
        {(inputs.length > 0 || outputs.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", alignItems: "center", marginBottom: "14px" }}>
            {/* Reactants / Inputs */}
            <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: "4px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "9px", color: "var(--saffron)", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                INPUTS / PRECURSORS
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {inputs.map((inp, i) => (
                  <span key={i} style={{ fontSize: "10px", background: "rgba(215,139,42,0.12)", color: "var(--ink)", padding: "2px 6px", borderRadius: "3px" }}>
                    {inp}
                  </span>
                ))}
              </div>
            </div>

            <ArrowRight size={16} style={{ color: "var(--forest)", flexShrink: 0 }} />

            {/* Products / Outputs */}
            <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: "4px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "9px", color: "var(--forest)", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                OUTPUTS / PRODUCTS
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {outputs.map((out, i) => (
                  <span key={i} style={{ fontSize: "10px", background: "rgba(72,104,92,0.12)", color: "var(--forest)", padding: "2px 6px", borderRadius: "3px", fontWeight: 600 }}>
                    {out}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stages Tabs */}
        {stages.length > 0 && (
          <>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              {stages.map((st, i) => {
                const isActive = i === activeStageIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveStageIdx(i)}
                    style={{
                      flex: 1,
                      background: isActive ? "var(--forest)" : "#ffffff",
                      color: isActive ? "#ffffff" : "var(--ink-soft)",
                      border: isActive ? "1px solid var(--forest)" : "1px solid var(--line)",
                      borderRadius: "4px",
                      padding: "6px 8px",
                      fontSize: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: "center",
                    }}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>

            {/* Active Stage Detail */}
            {stages[activeStageIdx] && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "4px",
                  padding: "10px 12px",
                  fontSize: "11px",
                  lineHeight: "1.45",
                  color: "var(--ink)",
                }}
              >
                <strong style={{ color: "var(--forest)", display: "block", marginBottom: "2px" }}>
                  Phase {activeStageIdx + 1}: {stages[activeStageIdx].name}
                </strong>
                <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "11px" }}>
                  {stages[activeStageIdx].description}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BiologyProcessVisual;
