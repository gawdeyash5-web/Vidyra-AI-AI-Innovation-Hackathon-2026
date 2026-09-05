import React, { useState, useEffect } from "react";

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
}

interface TimelineVisualProps {
  visualData?: {
    events?: TimelineEvent[];
    [key: string]: any;
  };
}

export function TimelineVisual({ visualData }: TimelineVisualProps) {
  const hasEvents = Array.isArray(visualData?.events) && visualData.events.length > 0;

  if (!hasEvents) {
    return (
      <div style={{ width: "100%", padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        Chronological milestones not specified for this concept.
      </div>
    );
  }

  const events: TimelineEvent[] = visualData!.events!;
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [visualData]);

  return (
    <div style={{ width: "100%", padding: "10px 14px", display: "flex", flexDirection: "column" }}>
      {/* Horizontal milestone selector */}
      <div style={{ display: "flex", alignItems: "center", position: "relative", marginBottom: "16px", padding: "0 10px" }}>
        <div style={{ position: "absolute", left: "20px", right: "20px", top: "50%", height: "2px", background: "var(--line)", zIndex: 0 }} />
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", zIndex: 1 }}>
          {events.map((ev, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  background: isActive ? "var(--saffron)" : "#ffffff",
                  color: isActive ? "#ffffff" : "var(--ink-soft)",
                  border: isActive ? "2px solid var(--saffron)" : "1px solid var(--line)",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title={ev.title}
              >
                0{i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Milestone Card */}
      {events[activeIdx] && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--saffron)",
            borderRadius: "4px",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--saffron)", textTransform: "uppercase" }}>
              {events[activeIdx].time}
            </span>
            <span style={{ fontSize: "9px", color: "var(--muted)" }}>Milestone 0{activeIdx + 1} of 0{events.length}</span>
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--ink)", fontFamily: "var(--serif)" }}>
            {events[activeIdx].title}
          </h4>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--ink-soft)", lineHeight: "1.45" }}>
            {events[activeIdx].description}
          </p>
        </div>
      )}
    </div>
  );
}

export default TimelineVisual;
