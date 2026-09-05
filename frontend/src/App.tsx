import React, { useState, useMemo, useEffect } from "react";
import { Toaster, toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Clock3,
  FileText,
  Headphones,
  Lightbulb,
  Mic2,
  RotateCcw,
  Send,
  Sparkles,
  X,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { createLesson, evaluateAnswer, generateTeachingVideo, generateTeachingPart, resolveVideoUrl, apiBaseUrl } from "./lib/api";
import { BackendLesson, BackendEvaluation, Stage, VideoGenerationState, TeachingPart } from "./lib/models";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TeachingStudioVideo } from "./components/TeachingStudioVideo";
import { SubjectVisual } from "./components/SubjectVisual";


/* =========================================================================
   Top Bar & Brand Components
   ========================================================================= */

function AppMark() {
  return (
    <div className="brand">
      <div className="brand-mark">V</div>
      <span>
        vidyra <em>AI</em>
      </span>
    </div>
  );
}

function TopBar({ stage, onReset }: { stage: Stage; onReset: () => void }) {
  const labels: Record<Stage, string> = {
    setup: "New lesson",
    preparing: "Preparing lesson",
    roadmap: "Lesson path",
    teaching: "Teaching studio",
    question: "Understanding check",
    evaluation: "Teacher reflection",
    adaptive: "Adaptive explanation",
    recheck: "Follow-up check",
    report: "Learning report",
  };

  return (
    <header className="topbar">
      <AppMark />
      <div className="topbar-center">
        <span className="eyebrow">{labels[stage]}</span>
        <span className="topbar-rule" />
      </div>
      <button className="quiet-button" onClick={onReset} aria-label="Start a new lesson">
        <span aria-hidden="true" className="plus">+</span> New lesson
      </button>
    </header>
  );
}

/* =========================================================================
   Navigation Rail
   ========================================================================= */

function LessonRail({ stage, onStage }: { stage: Stage; onStage: (s: Stage) => void }) {
  const items: { key: Stage; title: string; note: string }[] = [
    { key: "setup", title: "Your intention", note: "Define goal & topic" },
    { key: "roadmap", title: "The path", note: "Structured roadmap" },
    { key: "teaching", title: "Teaching studio", note: "Live interactive lesson" },
    { key: "question", title: "Understanding", note: "Concept evaluation" },
    { key: "adaptive", title: "Adaptive path", note: "Tailored clarification" },
    { key: "report", title: "Reflection", note: "Learning assessment" },
  ];

  const stageOrder: Stage[] = [
    "setup",
    "preparing",
    "roadmap",
    "teaching",
    "question",
    "evaluation",
    "adaptive",
    "recheck",
    "report",
  ];

  const currentStageRank = stageOrder.indexOf(stage);

  return (
    <aside className="lesson-rail">
      <div className="rail-kicker">TODAY’S THREAD</div>
      <h2>
        Learn in a way<br />that adapts to you.
      </h2>
      <div className="rail-progress">
        <div
          className="rail-progress-fill"
          style={{
            height: `${Math.min(100, Math.max(12, ((currentStageRank + 1) / stageOrder.length) * 100))}%`,
          }}
        />
      </div>
      <nav aria-label="Lesson journey">
        {items.map((item, index) => {
          const itemRank = stageOrder.indexOf(item.key);
          const isActive = stage === item.key;
          const isDone = currentStageRank > itemRank;

          return (
            <button
              key={item.key}
              className={`rail-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
              onClick={() => {
                if (isDone || isActive) {
                  onStage(item.key);
                }
              }}
              style={{ cursor: isDone ? "pointer" : "default" }}
            >
              <span className="rail-number">
                {isDone ? <Check size={10} /> : `0${index + 1}`}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.note}</small>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="rail-footer">
        <div className="teacher-mini">
          <span className="mini-avatar">V</span>
          <span>
            <b>Vidyra AI Teacher</b>
            <small>Gemini-powered instruction</small>
          </span>
        </div>
        <button
          className="icon-button"
          aria-label="Help"
          onClick={() => toast.info("Vidyra AI adapts its teaching depth and examples based on your responses.")}
        >
          <CircleHelp size={17} />
        </button>
      </div>
    </aside>
  );
}

/* =========================================================================
   STAGE 1: Setup
   ========================================================================= */

interface SetupProps {
  onStart: (params: {
    topic: string;
    level: string;
    language: string;
    duration: number;
    goal: string;
    file: File | null;
  }) => void;
  isLoading: boolean;
}

function Setup({ onStart, isLoading }: SetupProps) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [time, setTime] = useState("20 minutes");
  const [language, setLanguage] = useState("English");
  const [file, setFile] = useState<File | null>(null);

  const durationMinutes = parseInt(time, 10) || 20;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTopic = topic.trim();
    if (!finalTopic) {
      toast.error("Please enter a topic or learning goal.");
      return;
    }
    onStart({
      topic: finalTopic,
      level: level.toLowerCase(),
      language,
      duration: durationMinutes,
      goal: `Understand ${finalTopic} clearly with practical insights`,
      file,
    });
  };

  return (
    <main className="setup-page">
      <div className="setup-copy">
        <span className="chapter-label">01 / BEGIN HERE</span>
        <h1>
          What would you like<br />
          <i>to understand</i> today?
        </h1>
        <p className="lede">
          Tell Vidyra what you want to master. Your AI teacher will generate a personalized lesson
          crafted around your starting level, available time, and language.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-block">
            <label htmlFor="topic">A topic, question, or engineering concept</label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Pulse Width Modulation (PWM), Binary Search, Newton's Laws..."
              rows={2}
              required
            />
          </div>

          <div className="setup-grid">
            <div className="input-block">
              <label htmlFor="level">I’m starting from</label>
              <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                {["Beginner", "Intermediate", "Advanced"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-block">
              <label htmlFor="time">I have</label>
              <select id="time" value={time} onChange={(e) => setTime(e.target.value)}>
                {["5 minutes", "20 minutes", "45 minutes", "60 minutes"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-block">
              <label htmlFor="language">Teach me in</label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {["English", "Hindi", "Marathi", "Hinglish"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-block">
              <label>
                Bring your material <span className="optional">optional</span>
              </label>
              <label className={`upload-line ${file ? "uploaded" : ""}`}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setFile(selected);
                    if (selected) {
                      toast.info(`Attached: ${selected.name} (document processing will connect in next backend upgrade)`);
                    }
                  }}
                />
                {file ? (
                  <>
                    <FileText size={16} />
                    <span>{file.name}</span>
                    <X
                      size={14}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFile(null);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <BookOpen size={16} />
                    <span>Upload PDF, notes, or slides</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </label>
            </div>
          </div>

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Consulting AI Teacher..." : "Shape my lesson"} <ArrowRight size={17} />
          </button>
        </form>

        <p className="privacy-note">
          Live Gemini backend connection: lessons are structured on-demand. Document grounding is preserved for next phase.
        </p>
      </div>

      <div className="setup-aside">
        <div className="aside-mark">
          <span>V</span>
          <div>
            <b>Vidyra AI</b>
            <small>Adaptive Engineering Teacher</small>
          </div>
        </div>
        <div className="aside-quote">
          “I won’t just hand you a formula. I’ll stay with the intuition until it genuinely clicks.”
        </div>
        <div className="aside-lines">
          <div>
            <span>01</span>
            <p>
              Understand<br />
              <b>your starting baseline</b>
            </p>
          </div>
          <div>
            <span>02</span>
            <p>
              Structure<br />
              <b>a focused progression</b>
            </p>
          </div>
          <div>
            <span>03</span>
            <p>
              Adapt<br />
              <b>the explanation if needed</b>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================================
   STAGE 2: Preparing (Real backend loading screen)
   ========================================================================= */

function Preparing({ topic, error, onRetry }: { topic: string; error?: string; onRetry?: () => void }) {
  return (
    <main className="center-stage preparing">
      <div className="preparing-orbit">
        <div className="orbit-dot" />
        <span>V</span>
      </div>
      <span className="chapter-label">SYNTHESIZING CURRICULUM</span>
      <h1>
        Let’s make <i>{topic}</i><br />
        intuitive and usable.
      </h1>

      {error ? (
        <div className="error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          {onRetry && <button onClick={onRetry}>Retry</button>}
        </div>
      ) : (
        <div className="preparing-list">
          <p>
            <Check size={16} /> Reading your topic parameters and learning level
          </p>
          <p>
            <Sparkles size={16} /> Generating real-world engineering analogies via Gemini
          </p>
          <p>
            <Lightbulb size={16} /> Formulating interactive checkpoints and common misconceptions
          </p>
        </div>
      )}

      <p className="soft-note">
        Structured lesson plan arriving directly from the Vidyra backend...
      </p>
    </main>
  );
}

/* =========================================================================
   STAGE 3: Roadmap (Lesson Plan)
   ========================================================================= */

interface RoadmapProps {
  lesson: BackendLesson;
  topic: string;
  onStart: () => void;
}

function Roadmap({ lesson, topic, onStart }: RoadmapProps) {
  return (
    <main className="roadmap-page">
      <div className="roadmap-intro">
        <span className="chapter-label">YOUR TEACHER’S PLAN</span>
        <h1>
          A clear path into<br />
          <i>{lesson.lessonTitle || topic}</i>.
        </h1>
        <p className="lede">
          {lesson.introduction ||
            "We will explore core fundamentals first, connect them with real engineering applications, and verify your intuition."}
        </p>

        {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
          <div style={{ margin: "24px 0", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
            <span className="eyebrow" style={{ display: "block", marginBottom: "8px" }}>
              Key Outcomes
            </span>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--ink-soft)", fontSize: "12px", lineHeight: "1.7" }}>
              {lesson.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="primary-button" onClick={onStart}>
          Enter the teaching studio <ArrowRight size={17} />
        </button>
      </div>

      <div className="roadmap-path">
        <div className="path-line" />
        {lesson.sections && lesson.sections.map((item, i) => (
          <div className={`path-step ${i === 0 ? "current" : ""}`} key={i}>
            <span className="path-index">0{i + 1}</span>
            <div>
              <span className="step-kind">Stage 0{i + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.explanation ? item.explanation.slice(0, 120) + "..." : "Deep-dive concept explanation."}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/* =========================================================================
   STAGE 4: Teaching Studio
   ========================================================================= */

interface TeachingProps {
  lesson: BackendLesson;
  topic: string;
  language: string;
  duration: number;
  level: string;
  onQuestion: () => void;
  videoCache: Record<string, { videoUrl: string; spokenScript?: string; duration?: number }>;
  onCacheVideo: (key: string, data: { videoUrl: string; spokenScript?: string; duration?: number }) => void;
  onClearVideoCache?: (key: string) => void;
}

function Teaching({
  lesson,
  topic,
  language,
  duration,
  level,
  onQuestion,
  videoCache,
  onCacheVideo,
  onClearVideoCache,
}: TeachingProps) {
  // Initialize with initial section if available as placeholder
  const initialFallbackPart: TeachingPart = {
    id: "part_init",
    order: 1,
    concept: lesson.sections?.[0]?.title || topic,
    learningObjective: lesson.learningObjectives?.[0] || `Understand ${topic}`,
    narration: lesson.sections?.[0]?.explanation || lesson.introduction || "Let's explore the core concept.",
    visualType: lesson.sections?.[0]?.visualType || "fallback",
    visualTitle: lesson.sections?.[0]?.visualTitle || lesson.sections?.[0]?.title,
    visualDescription: lesson.sections?.[0]?.visualDescription,
    visualData: lesson.sections?.[0]?.visualData,
    videoUrl: null,
    status: "generating",
    continueAvailable: true,
  };

  const initialParts: TeachingPart[] = useMemo(() => {
    if (lesson.sections && lesson.sections.length > 0) {
      return lesson.sections.map((sec, idx) => ({
        id: `part_${idx + 1}`,
        order: idx + 1,
        concept: sec.title,
        learningObjective: sec.keyPoints?.[0] || sec.title,
        narration: sec.teacherNarration || sec.explanation || "Let's explore the core concept.",
        deeperExplanation: sec.deeperExplanation,
        keyPoints: sec.keyPoints,
        example: sec.example,
        practicalApplication: sec.practicalApplication,
        commonMistake: sec.commonMistake,
        visualType: sec.visualType || "fallback",
        visualTitle: sec.visualTitle || sec.title,
        visualDescription: sec.visualDescription,
        visualData: sec.visualData,
        videoUrl: null,
        status: "idle" as const,
        continueAvailable: true,
      }));
    }
    return [initialFallbackPart];
  }, [lesson, topic]);

  const [teachingParts, setTeachingParts] = useState<TeachingPart[]>(initialParts);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoState, setVideoState] = useState<VideoGenerationState>("IDLE");
  const [videoError, setVideoError] = useState<string | null>(null);

  const currentPart = teachingParts[currentPartIndex] || initialFallbackPart;
  const hasPrev = currentPartIndex > 0;
  const hasNext = currentPartIndex < teachingParts.length - 1;

  // Cache key helper for current scene
  const currentCacheKey = useMemo(() => {
    return `${topic.toLowerCase().trim()}_${(currentPart.concept || topic).toLowerCase().trim()}_${language.toLowerCase().trim()}_${level.toLowerCase().trim()}`;
  }, [topic, currentPart.concept, language, level]);

  // Sync if lesson changes
  useEffect(() => {
    setTeachingParts(initialParts);
    setCurrentPartIndex(0);
  }, [initialParts]);

  // Inspect session cache or part videoUrl when switching scene
  useEffect(() => {
    const cached = videoCache[currentCacheKey];
    if (cached && cached.videoUrl) {
      setVideoState("READY");
      setVideoError(null);
    } else if (currentPart.videoUrl) {
      setVideoState("READY");
      setVideoError(null);
    } else {
      // Clean ungenerated state: IDLE (never display "unavailable" before attempt)
      setVideoState("IDLE");
      setVideoError(null);
    }
  }, [currentCacheKey, videoCache, currentPart.videoUrl]);

  // Explicit user-triggered video generation for the current scene
  const handleGenerateSceneVideo = async () => {
    if (isGenerating || videoState === "PREPARING" || videoState === "GENERATING") return;

    // Check if already in cache
    const cached = videoCache[currentCacheKey];
    if (cached && cached.videoUrl) {
      setVideoState("READY");
      return;
    }

    setIsGenerating(true);
    setVideoState("PREPARING");
    setVideoError(null);
    toast.info("Preparing your teaching scene...");

    // Transition smoothly from PREPARING to GENERATING
    const genTimer = setTimeout(() => {
      setVideoState((prev) => (prev === "PREPARING" ? "GENERATING" : prev));
    }, 1000);

    try {
      const resp = await generateTeachingVideo({
        topic,
        concept: currentPart.concept,
        narration: currentPart.narration,
        language,
        learnerLevel: level,
      });

      clearTimeout(genTimer);

      if (resp.success && resp.videoUrl) {
        const resolved = resolveVideoUrl(resp.videoUrl) || resp.videoUrl;

        // Update current part with resolved URL
        setTeachingParts((prev) =>
          prev.map((p, idx) => (idx === currentPartIndex ? { ...p, videoUrl: resolved } : p))
        );

        // Cache in session
        onCacheVideo(currentCacheKey, {
          videoUrl: resolved,
          spokenScript: resp.spokenScript || currentPart.narration,
          duration: resp.duration,
        });

        setVideoState("READY");
        toast.success("Teaching video ready!");
      } else {
        const errMsg = resp.error || "Teaching video unavailable right now.";
        setVideoError(errMsg);
        setVideoState("ERROR");
        toast.error(errMsg);
      }
    } catch (err: unknown) {
      clearTimeout(genTimer);
      const errMsg = err instanceof Error ? err.message : "Failed to generate video.";
      setVideoError(errMsg);
      setVideoState("ERROR");
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Request next teaching concept or deeper explanation
  const handleRequestPart = async (mode: "continue" | "deepen") => {
    if (isGenerating) return;
    setIsGenerating(true);
    setVideoError(null);

    const nextOrder = teachingParts.length + 1;
    const toastLabel = mode === "deepen" ? "Deepening concept with Gemini..." : "Preparing next teaching concept...";
    toast.info(toastLabel);

    try {
      const resp = await generateTeachingPart({
        topic,
        learnerLevel: level,
        language,
        duration,
        currentConcept: currentPart.concept,
        previousConcepts: teachingParts.map((p) => p.concept),
        mode,
        order: nextOrder,
        previousVideoId: currentPart.id,
      });

      if (resp.success && resp.part) {
        setTeachingParts((prev) => [...prev, resp.part!]);
        setCurrentPartIndex(teachingParts.length);
        if (resp.part.videoUrl) {
          const resolved = resolveVideoUrl(resp.part.videoUrl) || resp.part.videoUrl;
          resp.part.videoUrl = resolved;
          const nextCacheKey = `${topic.toLowerCase().trim()}_${resp.part.concept.toLowerCase().trim()}_${language.toLowerCase().trim()}_${level.toLowerCase().trim()}`;
          onCacheVideo(nextCacheKey, {
            videoUrl: resolved,
            spokenScript: resp.part.narration,
          });
          setVideoState("READY");
          toast.success(`Scene ready: ${resp.part.concept}`);
        } else {
          // New scene starts in IDLE state for explicit user generation
          setVideoState("IDLE");
          toast.info(`Continuing with: ${resp.part.concept}`);
        }
      } else {
        throw new Error(resp.error || "Failed to generate teaching part.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate next teaching part.";
      setVideoError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="studio-page">
      <div className="studio-head">
        <div>
          <span className="chapter-label">
            TEACHING SCENE 0{currentPart.order || currentPartIndex + 1} / {currentPart.concept}
          </span>
          <h1>
            Let’s make <i>{topic}</i><br />
            feel tangible.
          </h1>
        </div>
        <div className="studio-meta">
          <span>
            <Clock3 size={15} /> ~{duration} min total
          </span>
          <span>
            <Mic2 size={15} /> {language}
          </span>
        </div>
      </div>

      <div className="studio-grid">
        <TeachingStudioVideo
          src={resolveVideoUrl(videoCache[currentCacheKey]?.videoUrl || currentPart.videoUrl)}
          scene={`Scene 0${currentPart.order || currentPartIndex + 1} · ${currentPart.concept}`}
          narration={currentPart.narration}
          spokenScript={currentPart.narration}
          videoState={videoState}
          errorMessage={videoError || "Teaching video unavailable right now"}
          onGenerate={handleGenerateSceneVideo}
          onRetry={handleGenerateSceneVideo}
        />
        <SubjectVisual
          key={`part_visual_${currentPart.id}_${currentPart.order || currentPartIndex + 1}_${currentPart.concept}_${currentPart.visualType}`}
          topic={topic}
          sectionTitle={currentPart.concept}
          visualType={currentPart.visualType}
          visualTitle={currentPart.visualTitle || currentPart.concept}
          visualDescription={currentPart.visualDescription || currentPart.learningObjective}
          visualData={currentPart.visualData}
          caption={currentPart.visualDescription || currentPart.learningObjective}
        />
      </div>

      {/* Primary Teacher Narration & Core Takeaway */}
      <div className="narration-row">
        <div className="narration-avatar">V</div>
        <div style={{ flex: 1 }}>
          <span className="eyebrow">
            TEACHER’S CORE EXPLANATION · {currentPart.concept}
          </span>
          <p>{currentPart.narration}</p>
          {currentPart.learningObjective && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: "rgba(23,43,58,0.03)",
                borderLeft: "2px solid var(--saffron)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            >
              <strong>Learning Takeaway:</strong> {currentPart.learningObjective}
            </div>
          )}
        </div>
        <button
          className="listen-button"
          aria-label="Listen to narration"
          onClick={() => {
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(currentPart.narration);
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
              toast.info("Audio narration playing");
            } else {
              toast.info("Browser text-to-speech is not supported in this environment.");
            }
          }}
        >
          <Headphones size={16} /> Listen
        </button>
      </div>

      {/* Pedagogical Depth Cards: Mechanism, Example, Key Points */}
      <div
        style={{
          maxWidth: "790px",
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* 1. Deeper Mechanism */}
        {currentPart.deeperExplanation && (
          <div
            style={{
              padding: "14px 18px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                color: "var(--saffron)",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "10px",
                letterSpacing: "0.1em",
                display: "block",
                marginBottom: "6px",
              }}
            >
              How & Why It Works (Underlying Mechanism)
            </span>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-soft)", lineHeight: "1.6" }}>
              {currentPart.deeperExplanation}
            </p>
          </div>
        )}

        {/* 2. Key Takeaways */}
        {currentPart.keyPoints && currentPart.keyPoints.length > 0 && (
          <div
            style={{
              padding: "12px 18px",
              background: "rgba(23,43,58,0.02)",
              border: "1px solid var(--line)",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                color: "var(--forest)",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "10px",
                letterSpacing: "0.1em",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Essential Concepts To Master
            </span>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--ink-soft)", lineHeight: "1.7" }}>
              {currentPart.keyPoints.map((kp, i) => (
                <li key={i}>{kp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Concrete Example & Practical Application */}
        {(currentPart.example || currentPart.practicalApplication) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: currentPart.example && currentPart.practicalApplication ? "1fr 1fr" : "1fr",
              gap: "12px",
            }}
          >
            {currentPart.example && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "4px",
                }}
              >
                <span
                  style={{
                    color: "var(--ink)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Concrete Worked Example
                </span>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)", lineHeight: "1.5" }}>
                  {currentPart.example}
                </p>
              </div>
            )}

            {currentPart.practicalApplication && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "4px",
                }}
              >
                <span
                  style={{
                    color: "var(--saffron)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Practical Engineering Application
                </span>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)", lineHeight: "1.5" }}>
                  {currentPart.practicalApplication}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. Common Misconception or Mistake */}
        {(currentPart.commonMistake || lesson.commonMisconception) && (
          <div
            style={{
              padding: "12px 16px",
              border: "1px solid #f0dec5",
              background: "#fffaf0",
              borderRadius: "4px",
              fontSize: "12px",
              color: "var(--ink-soft)",
            }}
          >
            <span style={{ color: "var(--saffron)", fontWeight: 700, textTransform: "uppercase", fontSize: "10px" }}>
              Common Misconception to Avoid:
            </span>{" "}
            {currentPart.commonMistake || lesson.commonMisconception}
          </div>
        )}
      </div>

      {/* Interactive Continuation & Progress Toolbar */}
      <div className="studio-footer" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="icon-button"
            disabled={!hasPrev || isGenerating}
            onClick={() => setCurrentPartIndex((p) => Math.max(0, p - 1))}
            title="Previous concept"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="lesson-count">
            <b>Part 0{currentPartIndex + 1}</b> / 0{teachingParts.length}
          </span>
          <button
            className="icon-button"
            disabled={!hasNext || isGenerating}
            onClick={() => setCurrentPartIndex((p) => Math.min(teachingParts.length - 1, p + 1))}
            title="Next concept"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        {/* Dynamic Concept Request Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
          <button
            className="primary-button small"
            style={{ background: "transparent", border: "1.5px solid var(--line)", color: "var(--ink)" }}
            disabled={isGenerating}
            onClick={() => handleRequestPart("deepen")}
            title="Explore a deeper angle on this concept"
          >
            {isGenerating ? "Deepening..." : "Go deeper"} <Sparkles size={14} style={{ color: "var(--saffron)" }} />
          </button>

          <button
            className="primary-button small"
            disabled={isGenerating}
            onClick={() => handleRequestPart("continue")}
            title="Advance to the next concept in this topic"
          >
            {isGenerating ? "Synthesizing next..." : "Continue teaching"} <ArrowRight size={14} />
          </button>

          <button
            className="primary-button small"
            style={{ background: "var(--forest)" }}
            onClick={onQuestion}
            title="Test what you have learned so far"
          >
            Test understanding <Check size={14} />
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================================
   STAGE 5: Interactive Question (Generated by backend)
   ========================================================================= */

interface QuestionProps {
  lesson: BackendLesson;
  onSubmit: (answer: string) => void;
  isEvaluating: boolean;
}

function Question({ lesson, onSubmit, isEvaluating }: QuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const q = lesson.question || {
    question: "How does the primary parameter regulate the system behavior?",
    options: [
      "By varying the duty or state ratio",
      "By fixing a permanent static constant",
      "By disconnecting all inputs",
      "By applying memory cache only",
    ],
    correctAnswer: "By varying the duty or state ratio",
  };

  const options = q.options && q.options.length > 0 ? q.options : ["Option A", "Option B", "Option C"];

  const handleShare = () => {
    if (!selectedAnswer) return;
    onSubmit(selectedAnswer);
  };

  return (
    <main className="question-page">
      <div className="question-intro">
        <span className="chapter-label">A MOMENT TO THINK</span>
        <h1>
          Let’s see whether<br />
          <i>that idea clicked.</i>
        </h1>
        <p>
          There is no penalty here. Choose the answer that reflects your honest mental model, and
          Vidyra will calibrate the feedback accordingly.
        </p>
      </div>

      <div className="question-card">
        <div className="question-card-top">
          <span>QUESTION 01</span>
          <span className="question-kind">Interactive Understanding Check</span>
        </div>

        <h2>{q.question}</h2>

        <div className="option-list">
          {options.map((option, i) => {
            const isSelected = selectedAnswer === option;
            const letter = String.fromCharCode(65 + i);

            return (
              <button
                key={option}
                className={`option ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedAnswer(option)}
                disabled={isEvaluating}
              >
                <span>{letter}</span>
                <span style={{ flex: 1 }}>{option}</span>
                {isSelected && <Check size={17} />}
              </button>
            );
          })}
        </div>

        <div className="answer-foot">
          <span>
            {isEvaluating
              ? "Teacher is evaluating your reasoning..."
              : selectedAnswer
              ? "Selected answer ready for submission."
              : "Select an option above to continue."}
          </span>
          <button
            className="primary-button small"
            disabled={!selectedAnswer || isEvaluating}
            onClick={handleShare}
          >
            {isEvaluating ? "Analyzing..." : "Share my thinking"} <Send size={15} />
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================================
   STAGE 6: Evaluation (Real backend result)
   ========================================================================= */

interface EvaluationProps {
  evaluation: BackendEvaluation;
  onContinue: () => void;
}

function Evaluation({ evaluation, onContinue }: EvaluationProps) {
  const isCorrect = evaluation.result === "correct";
  const isPartial = evaluation.result === "partially_correct";

  return (
    <main className="evaluation-page">
      <span className="chapter-label">TEACHER’S ASSESSMENT</span>
      <h1>
        {isCorrect ? (
          <>
            You grasped the <i>core mechanism</i>.
          </>
        ) : isPartial ? (
          <>
            You found the <i>general shape</i>.
          </>
        ) : (
          <>
            Let’s clarify the <i>underlying logic</i>.
          </>
        )}
      </h1>

      <div className="evaluation-grid">
        <div className="understood">
          <span className="eyebrow">WHAT YOU UNDERSTOOD</span>
          <p>{evaluation.understoodConcept || "You engaged directly with the question."}</p>
          <div className="signal-line" />
          <div style={{ marginTop: "24px", fontSize: "13px", color: "var(--ink-soft)" }}>
            <strong>Teacher Feedback:</strong> {evaluation.feedback}
          </div>
        </div>

        <div className="attention">
          <span className="eyebrow">KEY TAKEAWAY OR REFINEMENT</span>
          <p>
            {evaluation.misconception
              ? evaluation.misconception
              : "Solid foundational grasp. Keep connecting this concept to variations."}
          </p>
          <button className="text-button" onClick={onContinue}>
            Explore another perspective <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================================
   STAGE 7: Adaptive Explanation (Real backend explanation)
   ========================================================================= */

interface AdaptiveProps {
  evaluation: BackendEvaluation;
  topic: string;
  onContinue: () => void;
}

function Adaptive({ evaluation, topic, onContinue }: AdaptiveProps) {
  return (
    <main className="adaptive-page">
      <div className="adaptive-header">
        <span className="chapter-label">TAILORED REINFORCEMENT</span>
        <h1>
          Let’s look at this<br />
          <i>another way.</i>
        </h1>
        <div className="teacher-note">
          <span className="narration-avatar">V</span>
          <p>
            “{evaluation.adaptiveExplanation ||
              `Let's look at ${topic} from a first-principles mechanical perspective to solidify the pattern.`}”
          </p>
        </div>
      </div>

      <div className="adaptive-grid">
        <div className="model-card">
          <div>
            <span className="eyebrow">DYNAMIC MENTAL MODEL</span>
            <p>
              When the driving input shifts, notice how the equilibrium adjusts to maintain continuity.
            </p>
          </div>
          <div className="seesaw">
            <span className="node left">Driving Signal</span>
            <span className="beam" />
            <span className="node right">Effective State</span>
          </div>
        </div>

        <SubjectVisual
          topic={topic}
          type="simulation"
          caption="Adjustable parameter simulation for intuitive grounding"
        />
      </div>

      <button className="primary-button" onClick={onContinue}>
        {evaluation.followUpQuestion ? "Try follow-up question" : "View learning report"}{" "}
        <ArrowRight size={17} />
      </button>
    </main>
  );
}

/* =========================================================================
   STAGE 8: Recheck / Follow-up (Clean backend integration point)
   ========================================================================= */

interface RecheckProps {
  followUpQuestion?: string;
  onSubmit: (response: string) => void;
}

function Recheck({ followUpQuestion, onSubmit }: RecheckProps) {
  const [response, setResponse] = useState("");

  const questionText =
    followUpQuestion ||
    "In your own words, how does changing the operating parameter alter the observed response?";

  const handleContinue = () => {
    onSubmit(response.trim());
  };

  return (
    <main className="recheck-page">
      <span className="chapter-label">FOLLOW-UP UNDERSTANDING CHECK</span>
      <h1>
        Now show me whether<br />
        <i>the new picture clicked.</i>
      </h1>

      <div className="recheck-layout">
        <div className="recheck-prompt">
          <span>FOLLOW-UP QUESTION</span>
          <h2>{questionText}</h2>
          <p>
            Explain it in your own words. One or two clear sentences are plenty. Your response will be
            captured in your lesson reflection.
          </p>
          <p style={{ color: "#aaa69d", fontSize: "11px", marginTop: "16px" }}>
            * Real follow-up question generated by Gemini. Dedicated follow-up evaluation endpoint
            will integrate in the upcoming backend iteration.
          </p>
        </div>

        <div className="answer-box">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="I think the relationship works because..."
            rows={5}
          />
          <div className="answer-box-foot">
            <span>{response.length > 0 ? `${response.length} characters recorded` : "Your teacher is listening"}</span>
            <button
              className="primary-button small"
              disabled={!response.trim()}
              onClick={handleContinue}
            >
              Continue to summary <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================================
   STAGE 9: Report (Real backend metrics)
   ========================================================================= */

interface ReportProps {
  lesson: BackendLesson;
  evaluation: BackendEvaluation;
  recheckAnswer: string;
  topic: string;
  onReset: () => void;
}

function Report({ lesson, evaluation, recheckAnswer, topic, onReset }: ReportProps) {
  const score = evaluation.score ?? 75;

  return (
    <main className="report-page">
      <div className="report-header">
        <div>
          <span className="chapter-label">A TEACHER’S REFLECTION</span>
          <h1>
            That was a productive<br />
            <i>first conversation.</i>
          </h1>
          <p>
            You explored <i>{topic}</i>, reviewed its governing relationship, and worked through the
            common edge cases.
          </p>
        </div>
        <div className="score-stamp">
          <span>UNDERSTANDING</span>
          <strong>{score}</strong>
          <small>{score >= 80 ? "strong foundation" : score >= 50 ? "solid progress" : "needs revision"}</small>
        </div>
      </div>

      <div className="report-grid">
        <section>
          <span className="eyebrow">WHAT STAYED WITH YOU</span>
          <div className="report-row">
            <Check size={16} />
            <div>
              <b>Core Intuition</b>
              <small>{evaluation.understoodConcept || "Demonstrated understanding of the primary concept."}</small>
            </div>
          </div>
          {lesson.learningObjectives?.[0] && (
            <div className="report-row">
              <Check size={16} />
              <div>
                <b>Key Learning Objective</b>
                <small>{lesson.learningObjectives[0]}</small>
              </div>
            </div>
          )}
          {recheckAnswer && (
            <div className="report-row">
              <Check size={16} />
              <div>
                <b>Your Written Synthesis</b>
                <small style={{ fontStyle: "italic" }}>“{recheckAnswer}”</small>
              </div>
            </div>
          )}
        </section>

        <section>
          <span className="eyebrow">A GENTLE RECOMMENDATION</span>
          <div className="recommendation">
            <Sparkles size={17} />
            <div>
              <b>Recommended Next Focus</b>
              <small>
                {evaluation.misconception
                  ? `Pay special attention to: ${evaluation.misconception}`
                  : `Continue to practical problem solving and application of ${topic}.`}
              </small>
            </div>
          </div>
          <button
            className="text-button"
            onClick={() => {
              window.print();
            }}
          >
            Save or print this session report <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <div className="next-path">
        <div>
          <span className="eyebrow">YOUR NEXT STEP</span>
          <h2>Continue building momentum.</h2>
          <p>You can start a new lesson on any related engineering concept anytime.</p>
        </div>
        <button className="primary-button" onClick={onReset}>
          Start another lesson <ArrowRight size={17} />
        </button>
      </div>
    </main>
  );
}

/* =========================================================================
   Main App Root (Stage Coordinator)
   ========================================================================= */

export default function App() {
  const [stage, setStage] = useState<Stage>("setup");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [language, setLanguage] = useState("English");
  const [duration, setDuration] = useState(20);

  const [lesson, setLesson] = useState<BackendLesson | null>(null);
  const [evaluation, setEvaluation] = useState<BackendEvaluation | null>(null);
  // Session video cache persisted in sessionStorage so it survives re-renders, stage transitions, and page refreshes
  const [videoCache, setVideoCache] = useState<Record<string, { videoUrl: string; spokenScript?: string; duration?: number }>>(() => {
    try {
      const saved = sessionStorage.getItem("vidyra_video_cache");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleCacheVideo = (key: string, data: { videoUrl: string; spokenScript?: string; duration?: number }) => {
    setVideoCache((prev) => {
      const updated = { ...prev, [key]: data };
      try {
        sessionStorage.setItem("vidyra_video_cache", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save video cache to sessionStorage", err);
      }
      return updated;
    });
  };

  const handleClearVideoCache = (key: string) => {
    setVideoCache((prev) => {
      const next = { ...prev };
      delete next[key];
      try {
        sessionStorage.setItem("vidyra_video_cache", JSON.stringify(next));
      } catch (err) {
        console.warn("Could not update sessionStorage", err);
      }
      return next;
    });
  };

  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start lesson generation via real backend
  const handleStartLesson = async (params: {
    topic: string;
    level: string;
    language: string;
    duration: number;
    goal: string;
    file: File | null;
  }) => {
    setTopic(params.topic);
    setLevel(params.level);
    setLanguage(params.language);
    setDuration(params.duration);
    setError(null);
    setStage("preparing");
    setIsLoadingLesson(true);

    try {
      const response = await createLesson({
        topic: params.topic,
        level: params.level,
        language: params.language,
        duration: params.duration,
        goal: params.goal,
      });

      if (response.success && response.lesson) {
        setLesson(response.lesson);
        toast.success(`Lesson "${response.lesson.lessonTitle}" generated by Gemini!`);
        setStage("roadmap");
      } else {
        throw new Error(response.error || "The backend was unable to generate a lesson for this topic.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create lesson.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Evaluate student answer via real backend
  const handleAnswerSubmit = async (studentAnswer: string) => {
    if (!lesson) return;
    setIsEvaluating(true);

    try {
      const response = await evaluateAnswer({
        topic,
        question: lesson.question.question,
        correctAnswer: lesson.question.correctAnswer,
        studentAnswer,
        level,
        language,
      });

      if (response.success && response.evaluation) {
        setEvaluation(response.evaluation);
        toast.success("Answer evaluated by AI teacher!");
        setStage("evaluation");
      } else {
        throw new Error(response.error || "Failed to evaluate answer.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Evaluation failed.";
      toast.error(msg);
      // Fallback evaluation object so UI doesn't break
      setEvaluation({
        result: "partially_correct",
        score: 65,
        feedback: "Your answer shows relevant thinking. Let's continue through the explanation.",
        understoodConcept: studentAnswer,
        misconception: "",
        nextAction: "continue",
        adaptiveExplanation: "Let's review the fundamental relationship from another angle.",
        followUpQuestion: "How does this concept apply in real operational conditions?",
      });
      setStage("evaluation");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setStage("setup");
    setTopic("");
    setLesson(null);
    setEvaluation(null);
    setRecheckAnswer("");
    setVideoCache({});
    setError(null);
  };

  const activeStage = useMemo(() => stage, [stage]);

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <Toaster position="top-right" richColors />
        <TopBar stage={activeStage} onReset={handleReset} />

        {stage !== "setup" && <LessonRail stage={stage} onStage={(s) => setStage(s)} />}

        <div className={stage === "setup" ? "content-area setup-content" : "content-area"}>
          {stage === "setup" && <Setup onStart={handleStartLesson} isLoading={isLoadingLesson} />}

          {stage === "preparing" && (
            <Preparing
              topic={topic}
              error={error ?? undefined}
              onRetry={() =>
                handleStartLesson({
                  topic,
                  level,
                  language,
                  duration,
                  goal: `Understand ${topic}`,
                  file: null,
                })
              }
            />
          )}

          {stage === "roadmap" && lesson && (
            <Roadmap lesson={lesson} topic={topic} onStart={() => setStage("teaching")} />
          )}

          {stage === "teaching" && lesson && (
            <Teaching
              lesson={lesson}
              topic={topic}
              language={language}
              duration={duration}
              level={level}
              onQuestion={() => setStage("question")}
              videoCache={videoCache}
              onCacheVideo={handleCacheVideo}
              onClearVideoCache={handleClearVideoCache}
            />
          )}

          {stage === "question" && lesson && (
            <Question

              lesson={lesson}
              onSubmit={handleAnswerSubmit}
              isEvaluating={isEvaluating}
            />
          )}

          {stage === "evaluation" && evaluation && (
            <Evaluation evaluation={evaluation} onContinue={() => setStage("adaptive")} />
          )}

          {stage === "adaptive" && evaluation && (
            <Adaptive
              evaluation={evaluation}
              topic={topic}
              onContinue={() => setStage("recheck")}
            />
          )}

          {stage === "recheck" && (
            <Recheck
              followUpQuestion={evaluation?.followUpQuestion}
              onSubmit={(answer) => {
                setRecheckAnswer(answer);
                setStage("report");
              }}
            />
          )}

          {stage === "report" && lesson && evaluation && (
            <Report
              lesson={lesson}
              evaluation={evaluation}
              recheckAnswer={recheckAnswer}
              topic={topic}
              onReset={handleReset}
            />
          )}
        </div>

        <div className="bottom-note">
          <span>
            <span className="signal-dot" /> Live continuous lesson state · Powered by Gemini
          </span>
          <span>Vidyra AI · Adaptive Teaching System</span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
