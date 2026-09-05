import React, { useState, useEffect } from "react";
import { Terminal } from "lucide-react";

interface CodeVisualProps {
  visualData?: {
    language?: string;
    code?: string;
    highlightedLines?: number[];
    output?: string;
    [key: string]: any;
  };
}

export function CodeVisual({ visualData }: CodeVisualProps) {
  const rawCode = visualData?.code;

  if (!rawCode) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Code implementation not specified for this concept.
      </div>
    );
  }

  const language = visualData?.language || "code";
  const highlightedLines = Array.isArray(visualData?.highlightedLines) ? visualData.highlightedLines : [];
  const output = visualData?.output;

  const lines = rawCode.split("\n");
  const [activeLine, setActiveLine] = useState<number | null>(highlightedLines[0] || null);

  useEffect(() => {
    setActiveLine(highlightedLines[0] || null);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Code Editor Window */}
      <div
        style={{
          background: "#172b3a",
          borderRadius: "4px",
          overflow: "hidden",
          border: "1px solid var(--line)",
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#e6edf3",
        }}
      >
        {/* Editor Topbar */}
        <div style={{ background: "#10212e", padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: "10px", color: "var(--saffron)", textTransform: "uppercase", fontWeight: 700 }}>
            {language}
          </span>
          <span style={{ fontSize: "9px", color: "#8b949e" }}>Click line to inspect</span>
        </div>

        {/* Code Content */}
        <div style={{ padding: "8px 0", maxHeight: "170px", overflowY: "auto", lineHeight: "1.55" }}>
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightedLines.includes(lineNum) || activeLine === lineNum;
            return (
              <div
                key={idx}
                onClick={() => setActiveLine(lineNum)}
                style={{
                  display: "flex",
                  padding: "1px 12px",
                  background: isHighlighted ? "rgba(215,139,42,0.18)" : "transparent",
                  borderLeft: isHighlighted ? "3px solid var(--saffron)" : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "#6e7681", minWidth: "24px", userSelect: "none", fontSize: "10px" }}>
                  {lineNum}
                </span>
                <span style={{ color: isHighlighted ? "#ffdf91" : "#e6edf3", whiteSpace: "pre" }}>
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Output */}
      {output && (
        <div
          style={{
            background: "rgba(23,43,58,0.05)",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            padding: "6px 10px",
            fontSize: "10px",
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--ink)",
          }}
        >
          <Terminal size={12} style={{ color: "var(--forest)" }} />
          <span>Output: <strong>{output}</strong></span>
        </div>
      )}
    </div>
  );
}

export default CodeVisual;
