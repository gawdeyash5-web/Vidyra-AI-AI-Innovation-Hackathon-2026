/* Vidyra AI - Domain models and contracts matching real backend responses */

export type Stage =
  | "setup"
  | "preparing"
  | "roadmap"
  | "teaching"
  | "question"
  | "evaluation"
  | "adaptive"
  | "recheck"
  | "report";

export type VisualType =
  | "waveform"
  | "algorithm"
  | "radiation"
  | "physics"
  | "equation"
  | "graph"
  | "biologyProcess"
  | "flowchart"
  | "timeline"
  | "code"
  | "process"
  | "comparison"
  | "simulation"
  | "diagram"
  | "map"
  | "fallback"
  | (string & {});

export interface LessonSection {
  title: string;
  explanation: string;
  deeperExplanation?: string;
  keyPoints?: string[];
  example: string;
  practicalApplication?: string;
  commonMistake?: string;
  teacherNarration?: string;
  visualType?: VisualType;
  visualTitle?: string;
  visualDescription?: string;
  visualData?: Record<string, any>;
}

export interface TeacherScene {
  id: string;
  order: number;
  concept: string;
  learningObjective: string;
  narration: string;
  visualType: VisualType;
  visualData?: Record<string, any>;
  videoPrompt?: string;
  videoUrl?: string | null;
  status: "idle" | "preparing" | "generating" | "ready" | "unavailable" | "error";
}

export interface LessonQuestion {
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface BackendLesson {
  lessonTitle: string;
  introduction: string;
  learningObjectives: string[];
  sections: LessonSection[];
  teacherScenes?: TeacherScene[];
  commonMisconception: string;
  question: LessonQuestion;
}

export interface CreateLessonResponse {
  success: boolean;
  lesson?: BackendLesson;
  error?: string;
}

export interface BackendEvaluation {
  result: "correct" | "partially_correct" | "incorrect";
  score: number;
  feedback: string;
  understoodConcept: string;
  misconception: string;
  nextAction: "continue" | "simplify" | "reExplain" | "increaseDifficulty";
  adaptiveExplanation: string;
  followUpQuestion: string;
}

export interface EvaluateAnswerResponse {
  success: boolean;
  evaluation?: BackendEvaluation;
  error?: string;
}

export interface SessionConfig {
  topic: string;
  level: string;
  language: string;
  duration: number;
  goal: string;
  materialFile?: File | null;
}

export type VideoGenerationState = "IDLE" | "PREPARING" | "GENERATING" | "READY" | "UNAVAILABLE" | "ERROR";

export interface TeachingPart {
  id: string;
  order: number;
  concept: string;
  learningObjective: string;
  narration: string;
  deeperExplanation?: string;
  keyPoints?: string[];
  example?: string;
  practicalApplication?: string;
  commonMistake?: string;
  videoPrompt?: string;
  visualType?: VisualType;
  visualTitle?: string;
  visualDescription?: string;
  visualData?: Record<string, any>;
  videoUrl?: string | null;
  previousVideoId?: string | null;
  status?: "ready" | "unavailable" | "generating" | "error";
  continueAvailable?: boolean;
  fromCache?: boolean;
}

export interface GenerateTeachingPartRequest {
  topic: string;
  learnerLevel?: string;
  language?: string;
  duration?: number;
  goal?: string;
  currentConcept?: string;
  previousConcepts?: string[];
  mode?: "continue" | "deepen";
  order?: number;
  previousVideoId?: string | null;
}

export interface GenerateTeachingPartResponse {
  success: boolean;
  part?: TeachingPart;
  videoUrl?: string | null;
  error?: string;
}

export interface TeachingVideoRequest {
  topic: string;
  concept?: string;
  narration: string;
  language?: string;
  learnerLevel?: string;
  visualType?: string;
  visualContext?: string;
}

export interface TeachingVideoResponse {
  success: boolean;
  videoUrl?: string;
  provider?: string;
  duration?: number;
  spokenScript?: string;
  presenterId?: string;
  voiceId?: string;
  fromCache?: boolean;
  error?: string;
}


