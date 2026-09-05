import React, { useState, useEffect } from "react";

export interface VariableInfo {
  symbol: string;
  name: string;
  unit?: string;
  description?: string;
}

interface EquationVisualProps {
  visualData?: {
    formula?: string;
    equation?: string;
    governingEquation?: string;
    variables?: (VariableInfo | string | Record<string, any>)[];
    [key: string]: any;
  };
}

export function EquationVisual({ visualData }: EquationVisualProps) {
  const formula = visualData?.formula || visualData?.equation || visualData?.governingEquation;

  // Normalize variables strictly from visualData - NO hardcoded escape velocity or cross-topic defaults
  const variables: VariableInfo[] = React.useMemo(() => {
    if (!visualData?.variables || !Array.isArray(visualData.variables)) {
      return [];
    }

    return visualData.variables
      .map((item): VariableInfo | null => {
        if (typeof item === "string") {
          return { symbol: item, name: item };
        }
        if (typeof item === "object" && item !== null) {
          const symbol = item.symbol || item.variable || item.name || "x";
          const name = item.name || item.description || item.meaning || symbol;
          const unit = item.unit;
          const description = item.description || (item.name !== name ? item.name : undefined);
          return { symbol, name, unit, description };
        }
        return null;
      })
      .filter((v): v is VariableInfo => v !== null);
  }, [visualData]);

  const [selectedVar, setSelectedVar] = useState<VariableInfo | null>(variables[0] || null);

  // Always reset selectedVar when variables change across sections
  useEffect(() => {
    setSelectedVar(variables[0] || null);
  }, [variables]);

  // If no formula is provided in visualData, show an honest data-missing notice
  if (!formula) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Mathematical formula not specified for this concept.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Formula Display Board */}
      <div
        style={{
          background: "rgba(23,43,58,0.04)",
          border: "1px solid var(--line)",
          borderRadius: "4px",
          padding: "20px 24px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
          Mathematical Governing Relation
        </span>
        <div style={{ font: "600 24px var(--serif)", color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {formula}
        </div>
      </div>

      {/* Variables Inspector Title */}
      {variables.length > 0 && (
        <>
          <div style={{ alignSelf: "flex-start", marginTop: "14px", marginBottom: "6px", fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Parameter Breakdown (Click to Inspect)
          </div>

          {/* Variable Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "100%", justifyContent: "center" }}>
            {variables.map((v, i) => {
              const isSelected = selectedVar?.symbol === v.symbol;
              return (
                <button
                  key={`${v.symbol}_${i}`}
                  onClick={() => setSelectedVar(v)}
                  style={{
                    border: isSelected ? "1.5px solid var(--saffron)" : "1px solid var(--line)",
                    background: isSelected ? "#fdf8ee" : "#ffffff",
                    color: isSelected ? "var(--saffron)" : "var(--ink)",
                    padding: "6px 12px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <strong style={{ fontFamily: "var(--serif)", fontSize: "13px" }}>{v.symbol}</strong>
                  <span style={{ fontSize: "10px", color: isSelected ? "var(--ink)" : "var(--muted)" }}>{v.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Variable Details Card */}
          {selectedVar && (
            <div
              style={{
                marginTop: "12px",
                width: "100%",
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderLeft: "3px solid var(--saffron)",
                padding: "10px 14px",
                borderRadius: "2px",
                fontSize: "11px",
                color: "var(--ink-soft)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <strong style={{ fontSize: "13px", color: "var(--ink)", fontFamily: "var(--serif)" }}>
                  {selectedVar.symbol} — {selectedVar.name}
                </strong>
                {selectedVar.unit && (
                  <span style={{ fontSize: "10px", color: "var(--forest)", background: "rgba(72,104,92,0.08)", padding: "2px 6px", borderRadius: "2px", fontWeight: 600 }}>
                    Unit: {selectedVar.unit}
                  </span>
                )}
              </div>
              {selectedVar.description && selectedVar.description !== selectedVar.name && (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "11px", lineHeight: "1.4" }}>
                  {selectedVar.description}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EquationVisual;
