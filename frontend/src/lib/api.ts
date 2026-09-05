import {
  CreateLessonResponse,
  EvaluateAnswerResponse,
  TeachingVideoRequest,
  TeachingVideoResponse,
  GenerateTeachingPartRequest,
  GenerateTeachingPartResponse
} from "./models";

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000";

/**
 * Resolves a video URL returned by the backend.
 * Direct URLs (http://, https://, blob:, data:) are preserved as-is.
 * Relative URLs (e.g. /videos/...) are prepended with apiBaseUrl so they work both locally and in production.
 */
export function resolveVideoUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${apiBaseUrl}${cleanPath}`;
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${apiBaseUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMsg = `Server returned status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) errorMsg = errorData.error;
      } catch {
        // use fallback status errorMsg
      }
      throw new Error(errorMsg);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        throw new Error(`Unable to connect to backend server at ${apiBaseUrl}. Please ensure the server is running.`);
      }
      throw err;
    }
    throw new Error("An unexpected error occurred while communicating with the server.");
  }
}

export interface CreateLessonPayload {
  topic: string;
  level?: string;
  language?: string;
  duration?: number;
  goal?: string;
}

export interface EvaluateAnswerPayload {
  topic: string;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  level?: string;
  language?: string;
}

export function createLesson(payload: CreateLessonPayload): Promise<CreateLessonResponse> {
  return postJson<CreateLessonResponse>("/api/create-lesson", payload);
}

export function evaluateAnswer(payload: EvaluateAnswerPayload): Promise<EvaluateAnswerResponse> {
  return postJson<EvaluateAnswerResponse>("/api/evaluate-answer", payload);
}

export function generateTeachingVideo(payload: TeachingVideoRequest): Promise<TeachingVideoResponse> {
  return postJson<TeachingVideoResponse>("/api/generate-teaching-video", payload);
}

export function generateTeachingPart(payload: GenerateTeachingPartRequest): Promise<GenerateTeachingPartResponse> {
  return postJson<GenerateTeachingPartResponse>("/api/generate-teaching-part", payload);
}


