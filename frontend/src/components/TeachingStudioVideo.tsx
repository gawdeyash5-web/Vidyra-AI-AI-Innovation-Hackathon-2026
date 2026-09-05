import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertTriangle, Loader2 } from "lucide-react";
import { VideoGenerationState } from "../lib/models";

export interface TeachingStudioVideoProps {
  src?: string;
  poster?: string;
  captions?: string;
  scene?: string;
  progress?: number;
  narration?: string;
  spokenScript?: string;
  videoState?: VideoGenerationState;
  errorMessage?: string;
  onGenerate?: () => void;
  onRetry?: () => void;
  onEnded?: () => void;
}

export function TeachingStudioVideo({
  src,
  poster,
  captions,
  scene = "Scene 01 / Core Concept",
  progress: externalProgress,
  narration,
  spokenScript,
  videoState = "IDLE",
  errorMessage,
  onGenerate,
  onRetry,
  onEnded,
}: TeachingStudioVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const hasSource = Boolean(src && src.trim().length > 0 && videoState === "READY");

  // Auto-play when video becomes ready
  useEffect(() => {
    if (hasSource && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Autoplay policy might require user click
        setIsPlaying(false);
      });
    }
  }, [hasSource, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onEnded, hasSource]);

  const togglePlay = () => {
    if (!videoRef.current || !hasSource) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleReplay = () => {
    if (!videoRef.current || !hasSource) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progressPercent = hasSource && duration > 0
    ? (currentTime / duration) * 100
    : externalProgress ?? 0;

  return (
    <div className="video-shell" role="region" aria-label="AI Teacher Studio Video">
      {/* 1. Real Video Player */}
      {hasSource && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="auto"
          aria-label="AI teacher video lecture"
        >
          {captions && (
            <track
              kind="captions"
              label="Lesson captions"
              src={captions}
              default={showCaptions}
            />
          )}
        </video>
      )}

      {/* 2. IDLE State: Explicit user generation button */}
      {videoState === "IDLE" && !hasSource && (
        <div className="video-fallback-canvas" style={{ background: "radial-gradient(circle at 50% 40%, #1f3747 0%, #10212e 100%)" }}>
          <div className="video-avatar-silhouette">
            <span style={{ color: "var(--saffron)", font: "600 28px var(--serif)" }}>V</span>
          </div>
          <span style={{ color: "var(--paper)", font: "600 16px var(--serif)", letterSpacing: "-0.01em" }}>
            Generate teaching scene
          </span>
          <span style={{ color: "#aaa69d", fontSize: "12px", marginTop: "6px", maxWidth: "340px", lineHeight: "1.5" }}>
            Click below to generate the AI teacher video for this concept with D-ID.
          </span>
          {onGenerate && (
            <button
              onClick={onGenerate}
              className="primary-button"
              style={{
                marginTop: "14px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <Play size={15} fill="currentColor" /> Generate teaching scene
            </button>
          )}
        </div>
      )}

      {/* 3. PREPARING State */}
      {videoState === "PREPARING" && (
        <div className="video-fallback-canvas">
          <div className="video-avatar-silhouette" style={{ borderColor: "var(--saffron)" }}>
            <Loader2 size={30} className="spin-slow" style={{ animation: "spinSlow 3s linear infinite", color: "var(--saffron)" }} />
          </div>
          <span style={{ color: "var(--paper)", font: "600 17px var(--serif)", letterSpacing: "-0.02em" }}>
            Preparing your teaching scene...
          </span>
          <span style={{ color: "var(--saffron-soft)", fontSize: "11px", marginTop: "8px", maxWidth: "340px", lineHeight: "1.5" }}>
            Gemini Teaching Planner is structuring your concept with AI teacher video.
          </span>
        </div>
      )}

      {/* 4. GENERATING State */}
      {videoState === "GENERATING" && (
        <div className="video-fallback-canvas">
          <div className="video-avatar-silhouette" style={{ borderColor: "var(--saffron)" }}>
            <Loader2 size={30} className="spin-slow" style={{ animation: "spinSlow 3s linear infinite", color: "var(--saffron)" }} />
          </div>
          <span style={{ color: "var(--paper)", font: "600 17px var(--serif)", letterSpacing: "-0.02em" }}>
            Generating your AI teacher...
          </span>
          <span style={{ color: "var(--saffron-soft)", fontSize: "11px", marginTop: "8px", maxWidth: "340px", lineHeight: "1.5" }}>
            D-ID neural avatar is synthesizing video lecture and voice audio.
          </span>
        </div>
      )}

      {/* 5. ERROR / UNAVAILABLE State */}
      {(videoState === "UNAVAILABLE" || videoState === "ERROR") && (
        <div className="video-fallback-canvas" style={{ background: "radial-gradient(circle at 50% 40%, #203c4f 0%, #10212e 100%)" }}>
          <div className="video-avatar-silhouette">
            <AlertTriangle size={24} style={{ color: "var(--saffron)" }} />
          </div>
          <span style={{ color: "var(--paper)", font: "600 16px var(--serif)" }}>
            Teaching video unavailable right now
          </span>
          <span style={{ color: "#aaa69d", fontSize: "11px", marginTop: "6px", maxWidth: "360px", lineHeight: "1.5" }}>
            {errorMessage || "Continuing with the interactive narration and subject-aware visual engine."}
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-button"
              style={{
                color: "var(--saffron)",
                marginTop: "12px",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} /> Try generating video again
            </button>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="video-poster-note">
        <span className="live-dot" />{" "}
        {videoState === "READY" && hasSource
          ? "Teaching scene ready · AI Teacher Video"
          : videoState === "IDLE"
          ? "Teaching Studio · Ready to generate"
          : videoState === "PREPARING"
          ? "Preparing your teaching scene..."
          : videoState === "GENERATING"
          ? "Generating your AI teacher..."
          : "AI Video Offline · Continuing with Subject Visual"}
      </div>

      {/* Video Overlay with Scene and Play control */}
      {hasSource && (
        <div className="video-overlay">
          <button
            className="play-button"
            disabled={!hasSource}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause teacher video" : "Play teacher video"}
          >
            {isPlaying ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}
          </button>
          <div className="video-caption">
            <span>{scene}</span>
            <p>{spokenScript ? `“${spokenScript}”` : narration ? `“${narration}”` : "“Notice how the fundamental relationship operates.”"}</p>
          </div>
        </div>
      )}

      {/* Video Controls Bar */}
      {hasSource && (
        <div className="video-controls">
          <span>{formatTime(currentTime)}</span>
          <div className="video-progress">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <span>{formatTime(duration || 10)}</span>
          <button
            aria-label="Replay"
            disabled={!hasSource}
            onClick={handleReplay}
            title="Replay from beginning"
          >
            <RotateCcw size={14} />
          </button>
          <button
            aria-label="Toggle Captions"
            className="cc"
            onClick={() => setShowCaptions(!showCaptions)}
            style={{ opacity: showCaptions ? 1 : 0.5 }}
            title={showCaptions ? "Disable Captions" : "Enable Captions"}
          >
            CC
          </button>
          <button
            aria-label={isMuted ? "Unmute" : "Mute"}
            disabled={!hasSource}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      )}
    </div>
  );
}

export default TeachingStudioVideo;
