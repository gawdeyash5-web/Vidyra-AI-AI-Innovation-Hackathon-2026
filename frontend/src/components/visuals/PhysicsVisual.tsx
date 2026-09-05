import React, { useState, useEffect } from "react";

interface PhysicsVisualProps {
  visualData?: {
    body?: string;
    velocityDirection?: string;
    gravityDirection?: string;
    formula?: string;
    escapeVelocityKmS?: number;
    [key: string]: any;
  };
}

export function PhysicsVisual({ visualData }: PhysicsVisualProps) {
  // If visualData does not contain actual physics model data, do NOT use Earth/escape defaults
  const bodyName = visualData?.body;
  const formula = visualData?.formula;
  const vEsc = typeof visualData?.escapeVelocityKmS === "number" ? visualData.escapeVelocityKmS : undefined;

  const defaultVel = vEsc ? Math.max(1, vEsc * 0.75) : 8.0;
  const [velocity, setVelocity] = useState(defaultVel);

  useEffect(() => {
    if (vEsc) {
      setVelocity(Number((vEsc * 0.75).toFixed(1)));
    }
  }, [vEsc, visualData]);

  if (!bodyName && !formula && vEsc === undefined) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Physics simulation parameters not specified for this concept.
      </div>
    );
  }

  const effectiveBody = bodyName || "Celestial Body";
  const effectiveFormula = formula || (vEsc ? `v_threshold = ${vEsc} km/s` : "F = G(M·m)/r²");
  const threshold = vEsc || 10.0;

  const isEscaped = velocity >= threshold;
  const isOrbit = velocity >= threshold * 0.7 && velocity < threshold;

  // Trajectory path calculation
  const svgWidth = 360;
  const svgHeight = 160;
  const earthX = 100;
  const earthY = 100;
  const earthR = 32;

  // Launch point on top of Body
  const launchX = earthX;
  const launchY = earthY - earthR;

  let trajectoryD = "";
  let statusText = "Suborbital (Gravity Dominates)";
  let statusColor = "var(--error)";

  if (isEscaped) {
    trajectoryD = `M ${launchX} ${launchY} C ${launchX + 40} ${launchY - 30}, ${launchX + 110} ${launchY - 60}, 340 20`;
    statusText = `Escape Achieved! (v ≥ ${threshold} km/s)`;
    statusColor = "var(--forest)";
  } else if (isOrbit) {
    trajectoryD = `M ${launchX} ${launchY} C ${launchX + 70} ${launchY - 40}, ${earthX + 80} ${earthY + 30}, ${earthX} ${earthY + 45} C ${earthX - 70} ${earthY + 30}, ${earthX - 60} ${launchY - 35}, ${launchX} ${launchY}`;
    statusText = `Bound Stable Orbit (${(threshold * 0.7).toFixed(1)} ≤ v < ${threshold} km/s)`;
    statusColor = "var(--saffron)";
  } else {
    trajectoryD = `M ${launchX} ${launchY} Q ${launchX + 40} ${launchY - 20} ${earthX + 26} ${earthY - 18}`;
    statusText = "Suborbital Fallback (Insufficient Velocity)";
    statusColor = "#d32f2f";
  }

  const vVectorLen = Math.min(60, Math.max(20, (velocity / threshold) * 45));
  const gVectorLen = 28;

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", maxHeight: "170px", background: "rgba(23,43,58,0.03)", borderRadius: "4px" }}
      >
        <defs>
          <radialGradient id="planetGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#4a90e2" />
            <stop offset="60%" stopColor="#1b4d7e" />
            <stop offset="100%" stopColor="#0d2a4a" />
          </radialGradient>
          <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="var(--saffron)" />
          </marker>
          <marker id="gravityArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#e53935" />
          </marker>
        </defs>

        {/* Atmosphere / Orbital Altitude Boundary Ring */}
        <circle cx={earthX} cy={earthY} r={earthR + 14} fill="none" stroke="var(--line)" strokeDasharray="3 3" />

        {/* Central Planetary Body */}
        <circle cx={earthX} cy={earthY} r={earthR} fill="url(#planetGrad)" />
        <text x={earthX} y={earthY + 4} fontSize="9" fill="#ffffff" textAnchor="middle" fontWeight="600">
          {effectiveBody}
        </text>

        {/* Trajectory line */}
        <path d={trajectoryD} fill="none" stroke={statusColor} strokeWidth="2" strokeDasharray={isEscaped ? "" : "3 2"} />

        {/* Spacecraft / Projectile at launch */}
        <circle cx={launchX} cy={launchY} r="3.5" fill="var(--ink)" stroke="#ffffff" strokeWidth="1" />

        {/* Velocity Vector arrow */}
        <line
          x1={launchX}
          y1={launchY}
          x2={launchX + vVectorLen}
          y2={launchY - (isEscaped ? 18 : 6)}
          stroke="var(--saffron)"
          strokeWidth="2"
          markerEnd="url(#arrowHead)"
        />
        <text x={launchX + vVectorLen + 4} y={launchY - 10} fontSize="8" fill="var(--saffron)" fontWeight="700">
          v⃗ = {velocity} km/s
        </text>

        {/* Gravity Force Vector arrow */}
        <line
          x1={launchX}
          y1={launchY}
          x2={launchX}
          y2={launchY + gVectorLen}
          stroke="#e53935"
          strokeWidth="1.8"
          markerEnd="url(#gravityArrow)"
        />
        <text x={launchX - 6} y={launchY + gVectorLen} fontSize="8" fill="#e53935" textAnchor="end" fontWeight="600">
          F⃗_grav
        </text>

        {/* Formula Annotation Panel */}
        <rect x="220" y="95" width="130" height="52" rx="3" fill="#ffffff" stroke="var(--line)" />
        <text x="285" y="112" fontSize="9" fill="var(--muted)" textAnchor="middle" fontWeight="600">
          GOVERNING RELATION
        </text>
        <text x="285" y="130" fontSize="11" fill="var(--ink)" textAnchor="middle" fontFamily="var(--serif)" fontWeight="700">
          {effectiveFormula}
        </text>
        {vEsc !== undefined && (
          <text x="285" y="141" fontSize="8" fill="var(--forest)" textAnchor="middle">
            Threshold: {threshold} km/s
          </text>
        )}
      </svg>

      {/* Metrics Row */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "11px", marginTop: "8px", color: "var(--ink-soft)" }}>
        <span><strong>Body:</strong> {effectiveBody}</span>
        {vEsc !== undefined && <span><strong>Threshold:</strong> {threshold} km/s</span>}
        <span><strong>Status:</strong> <span style={{ color: statusColor, fontWeight: 700 }}>{statusText}</span></span>
      </div>

      {/* Interactive Launch Velocity Slider */}
      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" }}>
        <label htmlFor="velocity-slider" style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Launch Velocity:
        </label>
        <input
          id="velocity-slider"
          type="range"
          min={Math.max(1, Math.round(threshold * 0.4))}
          max={Math.round(threshold * 1.6)}
          step="0.5"
          value={velocity}
          onChange={(e) => setVelocity(Number(e.target.value))}
          style={{ width: "160px", accentColor: "var(--saffron)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "55px", color: "var(--saffron)" }}>
          {velocity} km/s
        </span>
      </div>
    </div>
  );
}

export default PhysicsVisual;
