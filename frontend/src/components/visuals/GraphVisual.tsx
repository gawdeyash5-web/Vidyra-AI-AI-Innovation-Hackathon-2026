import React, { useState, useEffect } from "react";

interface GraphPoint {
  x: number;
  y: number;
  label?: string;
}

interface GraphVisualProps {
  visualData?: {
    xAxis?: { label?: string; unit?: string };
    yAxis?: { label?: string; unit?: string };
    curveType?: string;
    keyPoints?: GraphPoint[];
    [key: string]: any;
  };
}

export function GraphVisual({ visualData }: GraphVisualProps) {
  const hasAxis = visualData?.xAxis?.label || visualData?.yAxis?.label || visualData?.curveType;

  if (!hasAxis) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Graph axes not specified for this concept.
      </div>
    );
  }

  const xLabel = visualData?.xAxis?.label || "Input";
  const xUnit = visualData?.xAxis?.unit ? ` (${visualData.xAxis.unit})` : "";
  const yLabel = visualData?.yAxis?.label || "Output";
  const yUnit = visualData?.yAxis?.unit ? ` (${visualData.yAxis.unit})` : "";
  const curveType = (visualData?.curveType || "linear").toLowerCase();

  const [tRatio, setTRatio] = useState(50);

  useEffect(() => {
    setTRatio(50);
  }, [visualData]);

  const svgWidth = 360;
  const svgHeight = 160;
  const originX = 35;
  const originY = 130;
  const plotW = 300;
  const plotH = 100;

  const numSteps = 40;
  let pathD = "";
  let opX = originX;
  let opY = originY;

  for (let i = 0; i <= numSteps; i++) {
    const frac = i / numSteps;
    let normY = 0;

    if (curveType.includes("exp")) {
      normY = Math.exp(frac * 2) / Math.exp(2);
    } else if (curveType.includes("linear")) {
      normY = frac;
    } else if (curveType.includes("inverse") || curveType.includes("decay")) {
      normY = 1 / (1 + frac * 4);
    } else if (curveType.includes("sin")) {
      normY = (Math.sin(frac * Math.PI * 2) + 1) / 2;
    } else if (curveType.includes("bell") || curveType.includes("resonance")) {
      const z = (frac - 0.5) / 0.18;
      normY = Math.exp(-0.5 * z * z);
    } else {
      normY = frac;
    }

    const x = originX + frac * plotW;
    const y = originY - normY * plotH;

    if (i === 0) pathD = `M ${x} ${y}`;
    else pathD += ` L ${x} ${y}`;

    if (Math.abs(frac - tRatio / 100) < 0.03) {
      opX = x;
      opY = y;
    }
  }

  const points = Array.isArray(visualData?.keyPoints) ? visualData.keyPoints : [];

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", maxHeight: "170px", background: "rgba(23,43,58,0.03)", borderRadius: "4px" }}
      >
        <line x1={originX} y1={originY - plotH / 2} x2={originX + plotW} y2={originY - plotH / 2} stroke="var(--line)" strokeDasharray="3 3" />
        <line x1={originX + plotW / 2} y1={originY - plotH} x2={originX + plotW / 2} y2={originY} stroke="var(--line)" strokeDasharray="3 3" />

        <line x1={originX} y1={originY} x2={originX + plotW + 10} y2={originY} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={originX} y1={originY - plotH - 10} x2={originX} y2={originY} stroke="var(--ink)" strokeWidth="1.5" />

        <text x={originX + plotW} y={originY + 14} fontSize="8" fill="var(--muted)" textAnchor="end">
          {xLabel}{xUnit}
        </text>
        <text x={originX - 5} y={originY - plotH - 2} fontSize="8" fill="var(--muted)" textAnchor="start">
          {yLabel}{yUnit}
        </text>

        <path d={pathD} fill="none" stroke="var(--saffron)" strokeWidth="2.5" />

        <line x1={opX} y1={opY} x2={opX} y2={originY} stroke="var(--muted)" strokeDasharray="2 2" strokeWidth="1" />
        <line x1={originX} y1={opY} x2={opX} y2={opY} stroke="var(--muted)" strokeDasharray="2 2" strokeWidth="1" />

        <circle cx={opX} cy={opY} r="4.5" fill="var(--forest)" stroke="#ffffff" strokeWidth="1.5" />
        <text x={opX} y={opY - 8} fontSize="8" fill="var(--ink)" textAnchor="middle" fontWeight="700">
          Operating Point ({tRatio}%)
        </text>

        {points.map((pt, idx) => {
          const px = originX + (Math.min(1, Math.max(0, pt.x / 100))) * plotW;
          const py = originY - (Math.min(1, Math.max(0, pt.y / 100))) * plotH;
          return (
            <g key={idx}>
              <circle cx={px} cy={py} r="3" fill="var(--saffron)" />
              {pt.label && (
                <text x={px + 5} y={py - 4} fontSize="7" fill="var(--ink-soft)">{pt.label}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" }}>
        <label htmlFor="graph-slider" style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Sweep Input:
        </label>
        <input
          id="graph-slider"
          type="range"
          min="0"
          max="100"
          value={tRatio}
          onChange={(e) => setTRatio(Number(e.target.value))}
          style={{ width: "160px", accentColor: "var(--saffron)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "36px", color: "var(--forest)" }}>
          {tRatio}%
        </span>
      </div>
    </div>
  );
}

export default GraphVisual;
