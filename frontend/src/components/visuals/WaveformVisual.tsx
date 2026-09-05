import React, { useState, useEffect } from "react";

interface WaveformVisualProps {
  visualData?: {
    dutyCycle?: number;
    voltageHigh?: number;
    voltageLow?: number;
    frequency?: number;
    signals?: Array<{ label?: string; duty?: number; values?: number[]; [key: string]: any }>;
    [key: string]: any;
  };
}

export function WaveformVisual({ visualData }: WaveformVisualProps) {
  // Extract duty cycle from diverse structured formats
  let initialDuty: number | undefined = undefined;

  if (typeof visualData?.dutyCycle === "number") {
    initialDuty = visualData.dutyCycle;
  } else if (visualData?.dutyCycle !== undefined) {
    const p = parseInt(String(visualData.dutyCycle), 10);
    if (!isNaN(p)) initialDuty = p;
  } else if (Array.isArray(visualData?.signals) && visualData.signals.length > 0) {
    const s0 = visualData.signals[0];
    if (typeof s0.duty === "number") {
      initialDuty = s0.duty;
    } else if (Array.isArray(s0.values) && s0.values.length > 0) {
      const highCount = s0.values.filter((v) => v > 0).length;
      initialDuty = Math.round((highCount / s0.values.length) * 100);
    }
  }

  // If duty cycle is not found and no waveform data exists at all
  if (initialDuty === undefined && !visualData?.frequency && !visualData?.signals) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Waveform signal parameters not specified for this concept.
      </div>
    );
  }

  const effectiveDuty = initialDuty !== undefined ? initialDuty : 50;
  const [dutyCycle, setDutyCycle] = useState(effectiveDuty);

  const rawVHigh = visualData?.voltageHigh;
  const parsedVHigh = typeof rawVHigh === "number" ? rawVHigh : parseFloat(String(rawVHigh ?? ""));
  const vHigh = !isNaN(parsedVHigh) ? parsedVHigh : 5;

  const rawVLow = visualData?.voltageLow;
  const parsedVLow = typeof rawVLow === "number" ? rawVLow : parseFloat(String(rawVLow ?? ""));
  const vLow = !isNaN(parsedVLow) ? parsedVLow : 0;

  const rawFreq = visualData?.frequency;
  const parsedFreq = typeof rawFreq === "number" ? rawFreq : parseFloat(String(rawFreq ?? ""));
  const freq = !isNaN(parsedFreq) ? parsedFreq : 1000;

  useEffect(() => {
    if (initialDuty !== undefined) {
      setDutyCycle(initialDuty);
    }
  }, [initialDuty, visualData]);

  // Calculate average DC equivalent voltage
  const vAvg = (vLow + (vHigh - vLow) * (dutyCycle / 100)).toFixed(2);

  // Oscilloscope dimensions
  const svgWidth = 380;
  const svgHeight = 160;
  const topY = 35; // high rail
  const bottomY = 125; // low rail
  const periodWidth = 100; // 1 period in px (3 full periods on screen)
  const startX = 35;

  const highWidth = (periodWidth * dutyCycle) / 100;

  // Build rectangular pulse train path for 3 cycles
  let pathD = `M ${startX} ${bottomY}`;
  for (let i = 0; i < 3; i++) {
    const cycleStartX = startX + i * periodWidth;
    pathD += ` L ${cycleStartX} ${topY}`;
    pathD += ` L ${cycleStartX + highWidth} ${topY}`;
    pathD += ` L ${cycleStartX + highWidth} ${bottomY}`;
    pathD += ` L ${cycleStartX + periodWidth} ${bottomY}`;
  }

  // Average voltage dashed horizontal line
  const avgY = bottomY - ((vHigh - vLow > 0 ? (vHigh - vLow) : 1) * (dutyCycle / 100) / (vHigh - vLow || 1)) * (bottomY - topY);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", maxHeight: "170px", background: "rgba(23,43,58,0.03)", borderRadius: "4px" }}
      >
        {/* Grid lines */}
        <line x1="25" y1={topY} x2={svgWidth - 15} y2={topY} stroke="var(--line)" strokeDasharray="3 3" />
        <line x1="25" y1={bottomY} x2={svgWidth - 15} y2={bottomY} stroke="var(--line)" />
        <line x1={startX} y1="20" x2={startX} y2="140" stroke="var(--line)" strokeWidth="1" />

        {/* Voltage level labels */}
        <text x="20" y={topY + 4} fontSize="9" textAnchor="end" fill="var(--muted)">{vHigh}V</text>
        <text x="20" y={bottomY + 4} fontSize="9" textAnchor="end" fill="var(--muted)">{vLow}V</text>

        {/* Average voltage reference */}
        <line
          x1={startX}
          y1={avgY}
          x2={startX + periodWidth * 3}
          y2={avgY}
          stroke="#48685c"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <text x={svgWidth - 20} y={avgY - 4} fontSize="8" fill="var(--forest)" textAnchor="end" fontWeight="600">
          V_avg = {vAvg}V
        </text>

        {/* Active square waveform */}
        <path d={pathD} fill="none" stroke="var(--saffron)" strokeWidth="2.5" strokeLinejoin="miter" />

        {/* Timing bracket for 1 period */}
        <line x1={startX} y1="145" x2={startX + periodWidth} y2="145" stroke="var(--muted)" strokeWidth="1" />
        <line x1={startX} y1="141" x2={startX} y2="149" stroke="var(--muted)" strokeWidth="1" />
        <line x1={startX + periodWidth} y1="141" x2={startX + periodWidth} y2="149" stroke="var(--muted)" strokeWidth="1" />
        <text x={startX + periodWidth / 2} y="155" fontSize="8" fill="var(--muted)" textAnchor="middle">
          Period T = {(1000 / freq).toFixed(2)} ms
        </text>

        {/* High state marker */}
        <text x={startX + highWidth / 2} y={topY - 8} fontSize="8" fill="var(--saffron)" textAnchor="middle" fontWeight="600">
          T_ON ({dutyCycle}%)
        </text>
      </svg>

      {/* Metrics Row */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "11px", marginTop: "8px", color: "var(--ink-soft)" }}>
        <span><strong>Duty Cycle:</strong> {dutyCycle}%</span>
        <span><strong>Frequency:</strong> {freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`}</span>
        <span><strong>Effective DC:</strong> <span style={{ color: "var(--forest)", fontWeight: 700 }}>{vAvg} V</span></span>
      </div>

      {/* Interactive Duty Cycle Control */}
      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" }}>
        <label htmlFor="duty-slider" style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Duty Cycle:
        </label>
        <input
          id="duty-slider"
          type="range"
          min="5"
          max="95"
          step="5"
          value={dutyCycle}
          onChange={(e) => setDutyCycle(Number(e.target.value))}
          style={{ width: "160px", accentColor: "var(--saffron)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "32px", color: "var(--saffron)" }}>
          {dutyCycle}%
        </span>
      </div>
    </div>
  );
}

export default WaveformVisual;
