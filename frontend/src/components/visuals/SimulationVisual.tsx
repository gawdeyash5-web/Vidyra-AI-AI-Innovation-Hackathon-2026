import React, { useState, useEffect } from "react";

interface SimulationVisualProps {
  visualData?: {
    parameterName?: string;
    min?: number;
    max?: number;
    defaultValue?: number;
    unit?: string;
    observableEffect?: string;
    [key: string]: any;
  };
}

export function SimulationVisual({ visualData }: SimulationVisualProps) {
  const hasParam = visualData?.parameterName || visualData?.observableEffect;

  if (!hasParam && typeof visualData?.min !== "number") {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Simulation parameters not specified for this concept.
      </div>
    );
  }

  const paramName = visualData?.parameterName || "Driving Input";
  const min = typeof visualData?.min === "number" ? visualData.min : 0;
  const max = typeof visualData?.max === "number" ? visualData.max : 100;
  const defaultVal = typeof visualData?.defaultValue === "number" ? visualData.defaultValue : (min + max) / 2;
  const unit = visualData?.unit || "%";
  const effect = visualData?.observableEffect || "Dynamic system response";

  const [val, setVal] = useState(defaultVal);

  useEffect(() => {
    setVal(defaultVal);
  }, [defaultVal, visualData]);

  const normalized = (val - min) / (max - min || 1); // 0 to 1
  const tiltDeg = (normalized - 0.5) * 24; // -12deg to +12deg

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Dynamic Seesaw / Balance Simulation */}
      <div style={{ width: "100%", height: "130px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Central Fulcrum */}
        <polygon points="170,110 190,110 180,85" fill="var(--ink)" />

        {/* Dynamic Beam */}
        <div
          style={{
            width: "240px",
            height: "4px",
            background: "var(--saffron)",
            borderRadius: "2px",
            transform: `rotate(${tiltDeg}deg)`,
            transition: "transform 0.1s ease-out",
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left payload */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid var(--ink)",
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "10px",
              fontWeight: 600,
              transform: `rotate(${-tiltDeg}deg) translateY(-24px)`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              whiteSpace: "nowrap",
            }}
          >
            {paramName}: {val} {unit}
          </div>

          {/* Right payload */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid var(--forest)",
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--forest)",
              transform: `rotate(${-tiltDeg}deg) translateY(-24px)`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              whiteSpace: "nowrap",
            }}
          >
            Response: {(max - val + min).toFixed(0)} {unit}
          </div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginBottom: "8px", textAlign: "center" }}>
        <strong>Dynamic Balance:</strong> {effect}
      </div>

      {/* Interactive Slider */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" }}>
        <label htmlFor="sim-slider" style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          {paramName}:
        </label>
        <input
          id="sim-slider"
          type="range"
          min={min}
          max={max}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          style={{ width: "160px", accentColor: "var(--saffron)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "45px", color: "var(--saffron)" }}>
          {val} {unit}
        </span>
      </div>
    </div>
  );
}

export default SimulationVisual;
