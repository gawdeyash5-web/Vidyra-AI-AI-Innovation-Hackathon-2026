import React, { useState, useEffect, useMemo } from "react";

export interface ComparisonAttribute {
  name: string;
  valA: string;
  valB: string;
}

interface ComparisonVisualProps {
  visualData?: {
    subjectA?: string;
    subjectB?: string;
    attributes?: ComparisonAttribute[];
    items?: Array<{ label?: string; value?: string; [key: string]: any }>;
    rows?: Array<{ name?: string; valA?: string; valB?: string; [key: string]: any }>;
    [key: string]: any;
  };
}

export function ComparisonVisual({ visualData }: ComparisonVisualProps) {
  // Normalize comparison data - NO hardcoded binary search defaults
  const normalized = useMemo(() => {
    let subA = visualData?.subjectA || "Option A";
    let subB = visualData?.subjectB || "Option B";
    let attrs: ComparisonAttribute[] = [];

    // Case 1: Standard attributes array
    if (Array.isArray(visualData?.attributes) && visualData.attributes.length > 0) {
      attrs = visualData.attributes.map((a: any) => ({
        name: a.name || a.attribute || a.metric || "Parameter",
        valA: String(a.valA ?? a.valueA ?? a.optionA ?? "—"),
        valB: String(a.valB ?? a.valueB ?? a.optionB ?? "—"),
      }));
    }
    // Case 2: Rows array
    else if (Array.isArray(visualData?.rows) && visualData.rows.length > 0) {
      attrs = visualData.rows.map((r: any) => ({
        name: r.name || r.metric || "Parameter",
        valA: String(r.valA ?? r.valueA ?? "—"),
        valB: String(r.valB ?? r.valueB ?? "—"),
      }));
    }
    // Case 3: Items array (e.g. Gemini returned { items: [{ label: "25% Duty Cycle", value: "Dim LED" }, { label: "75% Duty Cycle", value: "Bright LED" }] })
    else if (Array.isArray(visualData?.items) && visualData.items.length >= 2) {
      const it0 = visualData.items[0];
      const it1 = visualData.items[1];
      subA = it0.label || it0.name || subA;
      subB = it1.label || it1.name || subB;
      attrs = [
        {
          name: "Characteristic / Output",
          valA: String(it0.value || it0.description || it0.label || "—"),
          valB: String(it1.value || it1.description || it1.label || "—"),
        },
      ];
      if (visualData.items.length > 2) {
        for (let i = 2; i < visualData.items.length; i++) {
          const it = visualData.items[i];
          attrs.push({
            name: it.label || `Characteristic ${i + 1}`,
            valA: String(it.value || "—"),
            valB: "—",
          });
        }
      }
    }

    return { subjectA: subA, subjectB: subB, attributes: attrs };
  }, [visualData]);

  const [activeSide, setActiveSide] = useState<"all" | "A" | "B">("all");

  useEffect(() => {
    setActiveSide("all");
  }, [visualData]);

  if (normalized.attributes.length === 0) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Comparison parameters not specified for this concept.
      </div>
    );
  }

  const { subjectA, subjectB, attributes } = normalized;

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Toggle selector */}
      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
        <button
          onClick={() => setActiveSide("all")}
          style={{
            background: activeSide === "all" ? "var(--ink)" : "transparent",
            color: activeSide === "all" ? "var(--paper)" : "var(--ink-soft)",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            padding: "4px 10px",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Side-by-Side
        </button>
        <button
          onClick={() => setActiveSide("A")}
          style={{
            background: activeSide === "A" ? "var(--saffron)" : "transparent",
            color: activeSide === "A" ? "#ffffff" : "var(--ink-soft)",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            padding: "4px 10px",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Focus {subjectA}
        </button>
        <button
          onClick={() => setActiveSide("B")}
          style={{
            background: activeSide === "B" ? "var(--forest)" : "transparent",
            color: activeSide === "B" ? "#ffffff" : "var(--ink-soft)",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            padding: "4px 10px",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Focus {subjectB}
        </button>
      </div>

      {/* Comparison Table */}
      <div style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "4px", overflow: "hidden", background: "#ffffff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "rgba(23,43,58,0.04)", padding: "8px 10px", fontWeight: 700, fontSize: "10px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ color: "var(--muted)" }}>ATTRIBUTE</span>
          <span style={{ color: activeSide === "B" ? "var(--muted)" : "var(--saffron)" }}>{subjectA}</span>
          <span style={{ color: activeSide === "A" ? "var(--muted)" : "var(--forest)" }}>{subjectB}</span>
        </div>

        {attributes.map((attr, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              padding: "8px 10px",
              fontSize: "11px",
              borderBottom: idx < attributes.length - 1 ? "1px solid var(--line)" : "none",
              background: idx % 2 === 1 ? "rgba(23,43,58,0.015)" : "#ffffff",
            }}
          >
            <strong style={{ color: "var(--ink)" }}>{attr.name}</strong>
            <span style={{ color: activeSide === "B" ? "#9a9a9a" : "var(--ink-soft)", fontWeight: activeSide === "A" ? 700 : 400 }}>
              {attr.valA}
            </span>
            <span style={{ color: activeSide === "A" ? "#9a9a9a" : "var(--ink-soft)", fontWeight: activeSide === "B" ? 700 : 400 }}>
              {attr.valB}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComparisonVisual;
