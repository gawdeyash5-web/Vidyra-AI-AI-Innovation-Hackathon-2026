import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

interface MapNode {
  name: string;
  x: number; // 0 to 100
  y: number; // 0 to 100
  note?: string;
}

interface MapVisualProps {
  visualData?: {
    regionName?: string;
    nodes?: MapNode[];
    [key: string]: any;
  };
}

export function MapVisual({ visualData }: MapVisualProps) {
  const hasNodes = Array.isArray(visualData?.nodes) && visualData.nodes.length > 0;

  if (!hasNodes) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Spatial distribution map not specified for this concept.
      </div>
    );
  }

  const region = visualData?.regionName || "Domain Map";
  const nodes: MapNode[] = visualData!.nodes!;
  const [activeNode, setActiveNode] = useState<MapNode>(nodes[0]);

  useEffect(() => {
    setActiveNode(nodes[0]);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox="0 0 340 140"
        style={{ width: "100%", maxHeight: "150px", background: "rgba(23,43,58,0.03)", borderRadius: "4px" }}
      >
        {/* Grid dots */}
        <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#d0c8bb" />
        </pattern>
        <rect width="340" height="140" fill="url(#dotGrid)" />

        {/* Connecting vector paths */}
        <polyline
          points={nodes.map((n) => `${(n.x / 100) * 300 + 20},${(n.y / 100) * 110 + 15}`).join(" ")}
          fill="none"
          stroke="var(--saffron)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Nodes */}
        {nodes.map((n, i) => {
          const cx = (n.x / 100) * 300 + 20;
          const cy = (n.y / 100) * 110 + 15;
          const isSelected = activeNode.name === n.name;
          return (
            <g key={i} onClick={() => setActiveNode(n)} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={isSelected ? 6 : 4} fill={isSelected ? "var(--saffron)" : "var(--ink)"} />
              <text x={cx} y={cy - 9} fontSize="8" fill="var(--ink)" textAnchor="middle" fontWeight="600">
                {n.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Node detail */}
      <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--ink-soft)", textAlign: "center" }}>
        <MapPin size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px", color: "var(--saffron)" }} />
        <strong>{activeNode.name}:</strong> {activeNode.note || region}
      </div>
    </div>
  );
}

export default MapVisual;
