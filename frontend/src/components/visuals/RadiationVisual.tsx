import React, { useState, useEffect } from "react";

interface RadiationVisualProps {
  visualData?: {
    temperature?: number;
    peakWavelength?: number;
    spectrumPoints?: { wavelength: number; intensity: number }[];
    [key: string]: any;
  };
}

export function RadiationVisual({ visualData }: RadiationVisualProps) {
  const rawTemp = visualData?.temperature;
  const parsedTemp = typeof rawTemp === "number" ? rawTemp : parseInt(String(rawTemp ?? ""), 10);
  const rawPeak = visualData?.peakWavelength;
  const parsedPeak = typeof rawPeak === "number" ? rawPeak : parseInt(String(rawPeak ?? ""), 10);

  if (isNaN(parsedTemp) && isNaN(parsedPeak)) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Thermal radiation parameters not specified for this concept.
      </div>
    );
  }

  const initialTemp = !isNaN(parsedTemp) ? parsedTemp : Math.round(2898000 / (parsedPeak || 500));
  const [temperature, setTemperature] = useState(initialTemp);

  useEffect(() => {
    if (!isNaN(parsedTemp)) {
      setTemperature(parsedTemp);
    }
  }, [parsedTemp, visualData]);

  // Wien's Displacement Constant b = 2.898 x 10^6 nm·K
  const peakNm = Math.round(2898000 / temperature);

  // Spectral band of peak
  let peakBand = "Visible Spectrum";
  let peakColor = "#4caf50";
  if (peakNm < 380) {
    peakBand = "Ultraviolet (UV)";
    peakColor = "#7b1fa2";
  } else if (peakNm > 750) {
    peakBand = "Infrared (IR)";
    peakColor = "#c62828";
  } else if (peakNm < 450) {
    peakBand = "Visible (Violet/Blue)";
    peakColor = "#1976d2";
  } else if (peakNm < 560) {
    peakBand = "Visible (Green/Yellow)";
    peakColor = "#d78b2a";
  } else {
    peakBand = "Visible (Orange/Red)";
    peakColor = "#e64a19";
  }

  // Generate Planck radiation curve points across 100nm to 2000nm
  const svgWidth = 360;
  const svgHeight = 150;
  const minWavelength = 100;
  const maxWavelength = 2000;
  const originX = 30;
  const originY = 125;
  const plotWidth = svgWidth - originX - 20;
  const plotHeight = 95;

  const numSteps = 40;
  let pathD = "";
  let peakX = originX;
  let peakY = originY;
  let maxIntensity = 0;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= numSteps; i++) {
    const wl = minWavelength + (i / numSteps) * (maxWavelength - minWavelength);
    const ratio = wl / peakNm;
    const intensity = ratio > 0 ? (1 / Math.pow(ratio, 5)) / (Math.exp(4.965 / ratio) - 1) * 142 : 0;
    if (intensity > maxIntensity) {
      maxIntensity = intensity;
    }
    const x = originX + ((wl - minWavelength) / (maxWavelength - minWavelength)) * plotWidth;
    points.push({ x, y: intensity });
  }

  const peakScale = (plotHeight * 0.88) / (maxIntensity || 1);
  points.forEach((pt, i) => {
    const yCoord = originY - pt.y * peakScale;
    if (i === 0) {
      pathD = `M ${pt.x} ${yCoord}`;
    } else {
      pathD += ` L ${pt.x} ${yCoord}`;
    }
    if (Math.abs(pt.x - (originX + ((peakNm - minWavelength) / (maxWavelength - minWavelength)) * plotWidth)) < 8) {
      peakX = pt.x;
      peakY = yCoord;
    }
  });

  const visStartX = originX + ((380 - minWavelength) / (maxWavelength - minWavelength)) * plotWidth;
  const visEndX = originX + ((750 - minWavelength) / (maxWavelength - minWavelength)) * plotWidth;

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", maxHeight: "165px", background: "rgba(23,43,58,0.03)", borderRadius: "4px" }}
      >
        <defs>
          <linearGradient id="visRainbow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7e57c2" stopOpacity="0.4" />
            <stop offset="25%" stopColor="#29b6f6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#66bb6a" stopOpacity="0.4" />
            <stop offset="75%" stopColor="#ffee58" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ef5350" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <rect
          x={visStartX}
          y="20"
          width={visEndX - visStartX}
          height={plotHeight + 10}
          fill="url(#visRainbow)"
        />
        <text x={(visStartX + visEndX) / 2} y="30" fontSize="7" fill="var(--ink-soft)" textAnchor="middle" fontWeight="600">
          Visible Band (380-750nm)
        </text>

        <line x1={originX} y1={originY} x2={svgWidth - 15} y2={originY} stroke="var(--ink)" strokeWidth="1.2" />
        <line x1={originX} y1="20" x2={originX} y2={originY} stroke="var(--ink)" strokeWidth="1.2" />

        <text x={svgWidth - 15} y={originY + 12} fontSize="8" fill="var(--muted)" textAnchor="end">
          Wavelength λ (nm)
        </text>
        <text x="12" y="25" fontSize="8" fill="var(--muted)" textAnchor="start">
          Radiance B_λ
        </text>

        <text x={originX} y={originY + 11} fontSize="7" fill="var(--muted)">100</text>
        <text x={visStartX} y={originY + 11} fontSize="7" fill="var(--muted)" textAnchor="middle">380</text>
        <text x={visEndX} y={originY + 11} fontSize="7" fill="var(--muted)" textAnchor="middle">750</text>
        <text x={svgWidth - 25} y={originY + 11} fontSize="7" fill="var(--muted)" textAnchor="end">2000</text>

        <path d={pathD} fill="none" stroke="var(--saffron)" strokeWidth="2.5" />

        <line x1={peakX} y1={peakY} x2={peakX} y2={originY} stroke="var(--ink)" strokeDasharray="2 2" strokeWidth="1" />
        <circle cx={peakX} cy={peakY} r="4" fill={peakColor} stroke="#fff" strokeWidth="1.5" />
        <text x={peakX} y={peakY - 7} fontSize="8" fill="var(--ink)" textAnchor="middle" fontWeight="700">
          λ_max = {peakNm} nm
        </text>
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "11px", marginTop: "8px", color: "var(--ink-soft)" }}>
        <span><strong>Temp T:</strong> {temperature} K</span>
        <span><strong>Peak Wavelength:</strong> {peakNm} nm</span>
        <span><strong>Region:</strong> <span style={{ color: peakColor, fontWeight: 700 }}>{peakBand}</span></span>
      </div>

      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" }}>
        <label htmlFor="temp-slider" style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Temperature:
        </label>
        <input
          id="temp-slider"
          type="range"
          min="1000"
          max="12000"
          step="200"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          style={{ width: "160px", accentColor: "var(--saffron)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "48px", color: "var(--saffron)" }}>
          {temperature} K
        </span>
      </div>
    </div>
  );
}

export default RadiationVisual;
