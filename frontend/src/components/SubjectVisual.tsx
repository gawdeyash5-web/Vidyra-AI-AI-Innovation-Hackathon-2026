import React from "react";
import { VisualType } from "../lib/models";
import { Layers, Info } from "lucide-react";

import { WaveformVisual } from "./visuals/WaveformVisual";
import { AlgorithmVisual } from "./visuals/AlgorithmVisual";
import { RadiationVisual } from "./visuals/RadiationVisual";
import { PhysicsVisual } from "./visuals/PhysicsVisual";
import { EquationVisual } from "./visuals/EquationVisual";
import { GraphVisual } from "./visuals/GraphVisual";
import { BiologyProcessVisual } from "./visuals/BiologyProcessVisual";
import { FlowchartVisual } from "./visuals/FlowchartVisual";
import { TimelineVisual } from "./visuals/TimelineVisual";
import { CodeVisual } from "./visuals/CodeVisual";
import { ComparisonVisual } from "./visuals/ComparisonVisual";
import { ProcessVisual } from "./visuals/ProcessVisual";
import { SimulationVisual } from "./visuals/SimulationVisual";
import { DiagramVisual } from "./visuals/DiagramVisual";
import { MapVisual } from "./visuals/MapVisual";
import { FallbackVisual } from "./visuals/FallbackVisual";

interface SubjectVisualProps {
  topic: string;
  type?: VisualType;
  caption?: string;
  sectionTitle?: string;
  visualType?: VisualType;
  visualTitle?: string;
  visualDescription?: string;
  visualData?: Record<string, any>;
}

export function SubjectVisual({
  topic,
  type: legacyType,
  caption,
  sectionTitle,
  visualType: incomingVisualType,
  visualTitle,
  visualDescription,
  visualData,
}: SubjectVisualProps) {
  // Infer smart subject-aware type ONLY if not explicitly specified
  const inferType = (): VisualType => {
    if (incomingVisualType) return incomingVisualType;
    if (legacyType) return legacyType;

    const lower = `${topic} ${sectionTitle || ""}`.toLowerCase();

    if (lower.includes("pwm") || lower.includes("pulse width") || lower.includes("waveform") || lower.includes("square wave") || lower.includes("duty cycle")) {
      return "waveform";
    }
    if (lower.includes("binary search") || lower.includes("search") || lower.includes("sort") || lower.includes("algorithm") || lower.includes("array") || lower.includes("tree")) {
      return "algorithm";
    }
    if (lower.includes("black body") || lower.includes("radiation") || lower.includes("planck") || lower.includes("wien") || lower.includes("spectrum") || lower.includes("wavelength") || lower.includes("thermal")) {
      return "radiation";
    }
    if (lower.includes("escape velocity") || lower.includes("gravity") || lower.includes("orbit") || lower.includes("celestial") || lower.includes("kinematics") || lower.includes("mechanics") || lower.includes("force")) {
      return "physics";
    }
    if (lower.includes("photosynthesis") || lower.includes("biology") || lower.includes("respiration") || lower.includes("enzyme") || lower.includes("cell") || lower.includes("chloroplast")) {
      return "biologyProcess";
    }
    if (lower.includes("equation") || lower.includes("formula") || lower.includes("law") || lower.includes("theorem") || lower.includes("math")) {
      return "equation";
    }
    if (lower.includes("graph") || lower.includes("curve") || lower.includes("rate") || lower.includes("response curve")) {
      return "graph";
    }
    if (lower.includes("code") || lower.includes("programming") || lower.includes("python") || lower.includes("javascript")) {
      return "code";
    }
    if (lower.includes("timeline") || lower.includes("history") || lower.includes("evolution")) {
      return "timeline";
    }
    if (lower.includes("flowchart") || lower.includes("decision") || lower.includes("workflow")) {
      return "flowchart";
    }
    if (lower.includes("comparison") || lower.includes("trade-off") || lower.includes("vs") || lower.includes("versus")) {
      return "comparison";
    }

    return "fallback";
  };

  const activeType: VisualType = incomingVisualType || legacyType || inferType();

  // Validate if visualData contains sufficient data for activeType
  // If not, render honest fallback rather than showing broken or empty state
  const hasValidDataForType = (): boolean => {
    if (!visualData || typeof visualData !== "object") return false;

    switch (activeType) {
      case "waveform":
        return typeof visualData.dutyCycle === "number" ||
          !isNaN(parseInt(String(visualData.dutyCycle), 10)) ||
          (Array.isArray(visualData.signals) && visualData.signals.length > 0);

      case "algorithm":
        return Array.isArray(visualData.array) && visualData.array.length > 0;

      case "radiation":
        return typeof visualData.temperature === "number" ||
          typeof visualData.peakWavelength === "number" ||
          !isNaN(parseInt(String(visualData.temperature), 10));

      case "physics":
        return Boolean(visualData.body || visualData.formula || typeof visualData.escapeVelocityKmS === "number");

      case "equation":
        return Boolean(visualData.formula || visualData.equation || visualData.governingEquation);

      case "comparison":
        return (Array.isArray(visualData.attributes) && visualData.attributes.length > 0) ||
          (Array.isArray(visualData.items) && visualData.items.length >= 2) ||
          (Array.isArray(visualData.rows) && visualData.rows.length > 0);

      case "code":
        return Boolean(visualData.code);

      case "biologyProcess":
        return (Array.isArray(visualData.inputs) && visualData.inputs.length > 0) ||
          (Array.isArray(visualData.outputs) && visualData.outputs.length > 0) ||
          (Array.isArray(visualData.stages) && visualData.stages.length > 0);

      case "flowchart":
        return Array.isArray(visualData.nodes) && visualData.nodes.length > 0;

      case "timeline":
        return Array.isArray(visualData.events) && visualData.events.length > 0;

      case "diagram":
        return Array.isArray(visualData.components) && visualData.components.length > 0;

      case "map":
        return Array.isArray(visualData.nodes) && visualData.nodes.length > 0;

      case "process":
        return Array.isArray(visualData.steps) && visualData.steps.length > 0;

      case "simulation":
        return Boolean(visualData.parameterName || visualData.observableEffect || typeof visualData.min === "number");

      case "graph":
        return Boolean(visualData.xAxis?.label || visualData.yAxis?.label || visualData.curveType);

      case "fallback":
      default:
        return true;
    }
  };

  // Explicit unique key to ensure complete React remount on section / data changes
  const remountKey = `${activeType}_${sectionTitle || topic}`;

  // Primary visual renderer selector
  const renderVisualContent = () => {
    // If structured data is incomplete for specialized renderer, fall back safely
    if (!hasValidDataForType() && activeType !== "fallback") {
      return (
        <FallbackVisual
          key={remountKey}
          topic={topic}
          visualType={activeType}
          visualTitle={visualTitle || sectionTitle}
          visualDescription={visualDescription || caption}
          visualData={visualData}
        />
      );
    }

    try {
      switch (activeType) {
        case "waveform":
          return <WaveformVisual key={remountKey} visualData={visualData} />;

        case "algorithm":
          return <AlgorithmVisual key={remountKey} visualData={visualData} />;

        case "radiation":
          return <RadiationVisual key={remountKey} visualData={visualData} />;

        case "physics":
          return <PhysicsVisual key={remountKey} visualData={visualData} />;

        case "equation":
          return <EquationVisual key={remountKey} visualData={visualData} />;

        case "graph":
          return <GraphVisual key={remountKey} visualData={visualData} />;

        case "biologyProcess":
          return <BiologyProcessVisual key={remountKey} visualData={visualData} />;

        case "flowchart":
          return <FlowchartVisual key={remountKey} visualData={visualData} />;

        case "timeline":
          return <TimelineVisual key={remountKey} visualData={visualData} />;

        case "code":
          return <CodeVisual key={remountKey} visualData={visualData} />;

        case "comparison":
          return <ComparisonVisual key={remountKey} visualData={visualData} />;

        case "process":
          return <ProcessVisual key={remountKey} visualData={visualData} />;

        case "simulation":
          return <SimulationVisual key={remountKey} visualData={visualData} />;

        case "diagram":
          return <DiagramVisual key={remountKey} visualData={visualData} />;

        case "map":
          return <MapVisual key={remountKey} visualData={visualData} />;

        case "fallback":
        default:
          return (
            <FallbackVisual
              key={remountKey}
              topic={topic}
              visualType={activeType}
              visualTitle={visualTitle || sectionTitle}
              visualDescription={visualDescription || caption}
              visualData={visualData}
            />
          );
      }
    } catch (err) {
      console.warn("Visual render error:", err);
      return (
        <FallbackVisual
          key={remountKey}
          topic={topic}
          visualType="fallback"
          visualTitle={visualTitle || sectionTitle}
          visualDescription={visualDescription || caption}
          visualData={visualData}
        />
      );
    }
  };

  return (
    <div className="lesson-visual" role="figure" aria-label={`Subject visual: ${activeType}`}>
      <div className="visual-topline">
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Layers size={13} style={{ color: "var(--saffron)" }} />
          <span>VISUAL MODEL</span>
        </span>
        <span
          className="visual-type"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          {visualTitle || activeType}
        </span>
      </div>

      <div className="visual-content" style={{ padding: "12px", width: "100%" }}>
        {renderVisualContent()}
      </div>

      <div className="visual-footer">
        <span>
          {visualDescription || caption || `Subject-grounded intuition for ${sectionTitle || topic}`}
        </span>
      </div>
    </div>
  );
}

export default SubjectVisual;
