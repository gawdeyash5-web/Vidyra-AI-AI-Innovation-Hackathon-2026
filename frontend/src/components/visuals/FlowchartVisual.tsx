import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  type?: "start" | "step" | "decision" | "end";
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowchartVisualProps {
  visualData?: {
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    [key: string]: any;
  };
}

export function FlowchartVisual({ visualData }: FlowchartVisualProps) {
  const hasNodes = Array.isArray(visualData?.nodes) && visualData.nodes.length > 0;

  if (!hasNodes) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Flowchart steps not specified for this concept.
      </div>
    );
  }

  const nodes: FlowNode[] = visualData!.nodes!;
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);

  useEffect(() => {
    setActiveNodeIdx(0);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center", width: "100%", padding: "12px 0" }}>
        {nodes.map((node, i) => {
          const isActive = i === activeNodeIdx;
          const isDecision = node.type === "decision";
          const isStart = node.type === "start";
          const isEnd = node.type === "end";

          return (
            <React.Fragment key={node.id || i}>
              <button
                onClick={() => setActiveNodeIdx(i)}
                style={{
                  background: isActive ? (isDecision ? "#fdf8ee" : "#172b3a") : "#ffffff",
                  color: isActive ? (isDecision ? "var(--saffron)" : "var(--paper)") : "var(--ink)",
                  border: isActive
                    ? (isDecision ? "2px solid var(--saffron)" : "2px solid var(--ink)")
                    : "1px solid var(--line)",
                  borderRadius: isDecision ? "4px" : isStart || isEnd ? "20px" : "4px",
                  padding: isDecision ? "10px 14px" : "8px 14px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  textAlign: "center",
                  maxWidth: "140px",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {isDecision && (
                  <span style={{ fontSize: "8px", color: "var(--saffron)", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>
                    Condition
                  </span>
                )}
                {node.label}
              </button>

              {i < nodes.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", color: "var(--muted)" }}>
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active node detail readout */}
      {nodes[activeNodeIdx] && (
        <div
          style={{
            marginTop: "12px",
            width: "100%",
            background: "rgba(23,43,58,0.03)",
            border: "1px solid var(--line)",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            Active Node: <strong>{nodes[activeNodeIdx].label}</strong> ({nodes[activeNodeIdx].type || "step"})
          </span>
          <button
            onClick={() => setActiveNodeIdx((prev) => (prev + 1) % nodes.length)}
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              border: "none",
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "10px",
              cursor: "pointer",
            }}
          >
            Advance Step →
          </button>
        </div>
      )}
    </div>
  );
}

export default FlowchartVisual;
