import React, { useState, useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";

interface ProcessStep {
  step?: number;
  name: string;
  description: string;
}

interface ProcessVisualProps {
  visualData?: {
    steps?: ProcessStep[];
    [key: string]: any;
  };
}

export function ProcessVisual({ visualData }: ProcessVisualProps) {
  const hasSteps = Array.isArray(visualData?.steps) && visualData.steps.length > 0;

  if (!hasSteps) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Process sequence steps not specified for this concept.
      </div>
    );
  }

  const steps: ProcessStep[] = visualData!.steps!;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Step Sequence */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
        {steps.map((st, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <React.Fragment key={i}>
              <button
                onClick={() => setActiveStep(i)}
                style={{
                  background: isActive ? "#fdf8ee" : isDone ? "rgba(72,104,92,0.08)" : "#ffffff",
                  border: isActive ? "2px solid var(--saffron)" : isDone ? "1px solid var(--forest)" : "1px solid var(--line)",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "center",
                  minWidth: "75px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "8px", fontWeight: 700, color: isActive ? "var(--saffron)" : isDone ? "var(--forest)" : "var(--muted)" }}>
                  {isDone ? <Check size={8} /> : `STAGE 0${st.step || i + 1}`}
                </div>
                <strong style={{ fontSize: "11px", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                  {st.name}
                </strong>
              </button>
              {i < steps.length - 1 && (
                <ArrowRight size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Step Details */}
      {steps[activeStep] && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--saffron)",
            borderRadius: "3px",
            padding: "10px 14px",
          }}
        >
          <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--saffron)", textTransform: "uppercase" }}>
            Active Stage 0{steps[activeStep].step || activeStep + 1}
          </span>
          <h4 style={{ margin: "2px 0 4px", fontSize: "12px", color: "var(--ink)" }}>
            {steps[activeStep].name}
          </h4>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            {steps[activeStep].description}
          </p>
        </div>
      )}
    </div>
  );
}

export default ProcessVisual;
