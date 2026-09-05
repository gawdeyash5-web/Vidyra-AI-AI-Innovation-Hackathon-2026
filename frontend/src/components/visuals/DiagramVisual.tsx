import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface DiagramComponent {
  name: string;
  role: string;
  status?: string;
}

interface DiagramVisualProps {
  visualData?: {
    title?: string;
    components?: DiagramComponent[];
    [key: string]: any;
  };
}

export function DiagramVisual({ visualData }: DiagramVisualProps) {
  const hasComponents = Array.isArray(visualData?.components) && visualData.components.length > 0;

  if (!hasComponents) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Diagram components not specified for this concept.
      </div>
    );
  }

  const components: DiagramComponent[] = visualData!.components!;
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
        {components.map((comp, idx) => {
          const isActive = idx === activeIdx;
          return (
            <React.Fragment key={idx}>
              <button
                onClick={() => setActiveIdx(idx)}
                style={{
                  background: isActive ? "#fdf8ee" : "#ffffff",
                  border: isActive ? "2px solid var(--saffron)" : "1px solid var(--line)",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "center",
                  minWidth: "80px",
                }}
              >
                <b style={{ fontSize: "11px", color: "var(--ink)", display: "block" }}>{comp.name}</b>
                <small style={{ color: "var(--muted)", fontSize: "9px" }}>{comp.role}</small>
              </button>
              {idx < components.length - 1 && (
                <ArrowRight size={14} style={{ color: "var(--muted)" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {components[activeIdx] && (
        <div style={{ background: "rgba(23,43,58,0.03)", border: "1px solid var(--line)", borderRadius: "3px", padding: "8px 12px", fontSize: "11px" }}>
          <strong>{components[activeIdx].name}</strong>: {components[activeIdx].role}
          {components[activeIdx].status && (
            <span style={{ marginLeft: "8px", color: "var(--forest)", fontWeight: 600 }}>
              [{components[activeIdx].status}]
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DiagramVisual;
