import React, { useState, useEffect } from "react";
import { ArrowDown, Check, ChevronRight, RotateCcw } from "lucide-react";

interface AlgorithmVisualProps {
  visualData?: {
    array?: (number | string)[];
    target?: number | string;
    midpointIndex?: number;
    eliminatedRange?: [number, number];
    [key: string]: any;
  };
}

export function AlgorithmVisual({ visualData }: AlgorithmVisualProps) {
  const hasArray = Array.isArray(visualData?.array) && visualData.array.length > 0;

  if (!hasArray) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Algorithm array not specified for this concept.
      </div>
    );
  }

  const rawArray = visualData!.array!;
  const array = rawArray.map((x) => (typeof x === "string" && !isNaN(Number(x)) ? Number(x) : x));
  const initialTarget = visualData?.target !== undefined ? visualData.target : array[Math.floor(array.length / 2)];

  const [target, setTarget] = useState<number | string>(initialTarget);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(array.length - 1);
  const [stepCount, setStepCount] = useState(1);
  const [found, setFound] = useState(false);

  // Reset internal state when visualData changes
  useEffect(() => {
    setTarget(visualData?.target !== undefined ? visualData.target : array[Math.floor(array.length / 2)]);
    setLow(0);
    setHigh(array.length - 1);
    setStepCount(1);
    setFound(false);
  }, [visualData]);

  const mid = Math.floor((low + high) / 2);
  const midVal = array[mid];

  const handleStep = () => {
    if (low > high || found) return;

    if (midVal === target) {
      setFound(true);
      return;
    }

    if (typeof midVal === "number" && typeof target === "number") {
      if (midVal < target) {
        setLow(mid + 1);
      } else {
        setHigh(mid - 1);
      }
    } else {
      if (String(midVal) < String(target)) {
        setLow(mid + 1);
      } else {
        setHigh(mid - 1);
      }
    }
    setStepCount((s) => s + 1);
  };

  const handleReset = () => {
    setLow(0);
    setHigh(array.length - 1);
    setStepCount(1);
    setFound(false);
  };

  return (
    <div style={{ width: "100%", padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Target & Search State Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
          Target value: <strong style={{ color: "var(--saffron)", fontSize: "14px", marginLeft: "4px" }}>{target}</strong>
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
          Step {stepCount} · Search Window [{low} .. {high}]
        </div>
      </div>

      {/* Array Element Cells */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          width: "100%",
          justifyContent: "center",
          alignItems: "flex-end",
          padding: "16px 4px 8px",
          overflowX: "auto",
        }}
      >
        {array.map((val, idx) => {
          const isMid = idx === mid && low <= high;
          const isLow = idx === low && low <= high;
          const isHigh = idx === high && low <= high;
          const isEliminated = idx < low || idx > high;
          const isMatch = found && idx === mid;

          let cellBg = "#ffffff";
          let cellBorder = "1px solid var(--line)";
          let textColor = "var(--ink)";
          let opacity = 1;

          if (isMatch) {
            cellBg = "#e8f5e9";
            cellBorder = "2px solid var(--forest)";
            textColor = "var(--forest)";
          } else if (isMid) {
            cellBg = "#fdf8ee";
            cellBorder = "2px solid var(--saffron)";
            textColor = "var(--saffron)";
          } else if (isEliminated) {
            cellBg = "#f0ebe1";
            cellBorder = "1px dashed #d0c8bb";
            textColor = "#a0988c";
            opacity = 0.55;
          }

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: "1 0 28px",
                maxWidth: "42px",
                opacity,
                transition: "all 0.2s ease",
              }}
            >
              {/* Pointer indicator */}
              <div style={{ height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isMid && (
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--saffron)", display: "flex", alignItems: "center" }}>
                    MID <ArrowDown size={10} />
                  </span>
                )}
                {!isMid && isLow && (
                  <span style={{ fontSize: "8px", fontWeight: 700, color: "var(--ink-soft)" }}>L</span>
                )}
                {!isMid && isHigh && (
                  <span style={{ fontSize: "8px", fontWeight: 700, color: "var(--ink-soft)" }}>H</span>
                )}
              </div>

              {/* Cell box */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  background: cellBg,
                  border: cellBorder,
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: textColor,
                  position: "relative",
                }}
              >
                {val}
                {isMatch && (
                  <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "var(--forest)", borderRadius: "50%", color: "#fff", width: "12px", height: "12px", display: "grid", placeItems: "center" }}>
                    <Check size={8} />
                  </span>
                )}
              </div>

              {/* Index label */}
              <span style={{ fontSize: "8px", color: "var(--muted)" }}>[{idx}]</span>
            </div>
          );
        })}
      </div>

      {/* Comparison & Intuition readout */}
      <div
        style={{
          marginTop: "14px",
          width: "100%",
          padding: "8px 12px",
          background: "rgba(23,43,58,0.04)",
          borderRadius: "4px",
          fontSize: "11px",
          color: "var(--ink-soft)",
          textAlign: "center",
        }}
      >
        {found ? (
          <span style={{ color: "var(--forest)", fontWeight: 600 }}>
            Target {target} located at index [{mid}] in {stepCount} steps!
          </span>
        ) : low > high ? (
          <span style={{ color: "var(--error)", fontWeight: 600 }}>
            Target {target} not found in array (search window exhausted).
          </span>
        ) : (
          <span>
            Compare Midpoint: <strong>array[{mid}] = {midVal}</strong> vs Target <strong>{target}</strong>
            {midVal === target ? (
              <span style={{ color: "var(--forest)", marginLeft: "6px" }}>(Match!)</span>
            ) : midVal < target ? (
              <span style={{ marginLeft: "6px" }}>(Mid &lt; Target: Eliminate left half [0..{mid}])</span>
            ) : (
              <span style={{ marginLeft: "6px" }}>(Mid &gt; Target: Eliminate right half [{mid}..{high}])</span>
            )}
          </span>
        )}
      </div>

      {/* Interactive Controls */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button
          onClick={handleStep}
          disabled={low > high || found}
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            borderRadius: "3px",
            padding: "6px 12px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: low > high || found ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            opacity: low > high || found ? 0.4 : 1,
          }}
        >
          Next Comparison <ChevronRight size={13} />
        </button>
        <button
          onClick={handleReset}
          style={{
            background: "transparent",
            color: "var(--ink-soft)",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            padding: "6px 12px",
            fontSize: "11px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}

export default AlgorithmVisual;
