require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// CORS configuration: Allow localhost in development and Vercel domains in production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

const videosDir = isServerless ? path.join("/tmp", "videos") : path.join(__dirname, "videos");
try {
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }
} catch (fsErr) {
  console.warn("Could not create local videos directory:", fsErr.message);
}
app.use("/videos", express.static(videosDir));


const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();

console.log({
  geminiKeyPresent: Boolean(geminiApiKey),
  geminiKeyPrefix: geminiApiKey ? geminiApiKey.slice(0, 4) : null
});

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

async function safeGenerateContent(prompt) {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite"
  ];
  let lastError = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} request failed (${err.message || err}), trying fallback...`);
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastError;
}

function fixJsonBackslashes(str) {
  return str.replace(/(\\+)(.)?/g, (match, backslashes, nextChar, offset, fullStr) => {
    if (!nextChar) return backslashes;

    const count = backslashes.length;
    // Even number of backslashes: all are already paired (e.g. \\ or \\\\)
    if (count % 2 === 0) {
      return match;
    }

    // Single/odd backslash followed by standard JSON escape: valid as-is
    if (/["/bfnrt]/.test(nextChar)) {
      return match;
    }

    // Unicode escape \uXXXX check
    if (nextChar === "u") {
      const rest = fullStr.slice(offset + match.length, offset + match.length + 3);
      if (/^[0-9a-fA-F]{3}$/.test(rest)) {
        return match;
      }
    }

    // Unpaired backslash preceding LaTeX or non-JSON escape character: escape it
    return "\\" + match;
  });
}

function robustJsonParse(text) {
  let clean = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // 1. Direct standard parse
  try {
    return JSON.parse(clean);
  } catch (firstErr) {
    // 2. Parity-aware backslash sanitization (safely handles LaTeX, formulas, units)
    try {
      const sanitized = fixJsonBackslashes(clean);
      return JSON.parse(sanitized);
    } catch (secondErr) {
      // 3. Extract outermost JSON object { ... } and sanitize
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        const sliced = clean.substring(start, end + 1);
        try {
          return JSON.parse(sliced);
        } catch (thirdErr) {
          const sanitizedSliced = fixJsonBackslashes(sliced);
          return JSON.parse(sanitizedSliced);
        }
      }
      throw secondErr;
    }
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "AI Teacher Backend is running!"
  });
});

app.post("/api/create-lesson", async (req, res) => {
  try {
    const {
      topic,
      level = "beginner",
      language = "English",
      duration = 20,
      goal = "understand the topic"
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "Topic is required"
      });
    }

    const prompt = `
You are an expert AI Master Educator for engineering, science, and technology students.
Teach the concept, do not merely summarize it.

The learner must receive enough rigorous, intuitive, and practical information to genuinely understand the topic, follow the mechanisms, and successfully solve the final assessment question.

STUDENT PROFILE:
Topic: ${topic}
Learner Level: ${level.toUpperCase()}
Language: ${language}
Available Time: ${duration} minutes
Learning Goal: ${goal}

LEVEL ADAPTATION RULES:
${level.toLowerCase() === "beginner" ? `
- BEGINNER:
  * Prioritize crystal-clear mental models, physical intuition, and everyday engineering analogies.
  * Use accessible terminology and explain any necessary jargon before using it.
  * Use concrete examples with tangible physical numbers or visual analogies.
  * Emphasize the fundamental "why" and "what happens" before mathematical formalism.
` : level.toLowerCase() === "advanced" ? `
- ADVANCED:
  * Provide rigorous mathematical formulation, precise engineering terminology, and formal definitions.
  * Address edge cases, operational trade-offs, stability criteria, and implementation realities.
  * Analyze second-order effects, parameter sensitivities, and performance bounds.
  * Deepen worked examples with exact equations and engineering constraints.
` : `
- INTERMEDIATE:
  * Bridge intuitive mental models with technical relationships and underlying physics/logic.
  * Explain the step-by-step operating mechanisms and quantitative trade-offs.
  * Use standard engineering terminology with practical operational examples.
`}

TIME ADAPTATION RULES:
${duration <= 10 ? `
- SHORT SESSION (${duration} min):
  * Create 2 highly focused, high-impact sections.
  * Section 1: Build intuition and state the governing principle.
  * Section 2: Concrete worked example and practical takeaway.
` : duration >= 45 ? `
- EXTENDED SESSION (${duration} min):
  * Create 4 to 5 comprehensive, progressively deep sections.
  * Section 1: Physical intuition and problem motivation.
  * Section 2: Formal definition and governing equations/rules.
  * Section 3: Step-by-step mechanism and parameter relationships.
  * Section 4: Detailed worked example and practical application.
  * Section 5: Edge cases, non-ideal behavior, and common pitfalls.
` : `
- STANDARD SESSION (20-30 min):
  * Create 3 to 4 structured sections.
  * Section 1: Core intuition and motivation.
  * Section 2: Operating mechanism and governing relationship.
  * Section 3: Worked practical example and engineering application.
`}

PEDAGOGICAL STRUCTURE FOR EACH SECTION:
For each section provide:
1. "title": Concise, descriptive concept name.
2. "explanation": 3-5 clear sentences explaining the core concept thoroughly.
3. "deeperExplanation": Deepens how and why it works, the causal mechanism, and crucial relationships.
4. "keyPoints": Array of 2 to 4 concise bullet points of essential takeaways.
5. "example": A concrete worked example with numbers or specific scenarios.
6. "practicalApplication": Real-world industry, engineering, or scientific use case.
7. "commonMistake": Specific misconception or trap learners fall into regarding this exact section.
8. "teacherNarration": Natural, conversational teacher voice (strictly 20-35 words) suitable for audio/video instruction, referencing the visual naturally.
9. "visualType": Subject-aware visualizer strictly matching the topic and section.
10. "visualTitle", "visualDescription", "visualData".

CRITICAL VISUAL SPECIFICATION & DATA INTEGRITY RULES:
Each section MUST have a visualType that truly matches the concept.
DO NOT use generic process diagrams for everything. Reason from the topic:
- Electrical, signal modulation, PWM, AC/DC, cycles -> "waveform" (keys: dutyCycle, voltageHigh, voltageLow, frequency)
- Computer science algorithms, binary search, sorting, array operations -> "algorithm" (keys: array, target, midpointIndex, eliminatedRange)
- Thermodynamics, black body radiation, electromagnetic spectrum, optics, stars -> "radiation" (keys: temperature, peakWavelength)
- Mechanics, gravity, orbital dynamics, escape velocity, forces, kinematics -> "physics" (keys: velocity, mass, radius, vectors)
- Mathematical formulas, theorems, governing laws -> "equation" (keys: formula, variables: [{symbol, name, unit, description}])
- Rates of change, curves, functions, coordinate relationships -> "graph" (keys: xAxis: {label}, yAxis: {label}, curveType, points)
- Photosynthesis, cellular processes, biological mechanisms -> "biologyProcess" (keys: inputs, outputs, stages)
- Decision logic, state flow, conditional workflows -> "flowchart" (keys: nodes, edges)
- Historical evolution, chronologies, milestone phases -> "timeline" (keys: events: [{year, title, description}])
- Programming syntax, implementation, code execution -> "code" (keys: language, code, highlightLines, output)
- Comparing two concepts, architectures, or trade-offs -> "comparison" (keys: subjectA, subjectB, attributes: [{name, valA, valB}])
- Genuine stepwise physical or chemical multi-step process -> "process" (keys: steps: [{step, name, description}])
- Default/other -> "fallback"

CRITICAL DATA INTEGRITY & TOPIC ISOLATION:
- For every section, visualData MUST contain ONLY information strictly relevant to that specific section and the overall topic "${topic}".
- DO NOT copy variables, formulas, or concepts from other subjects.
  For example, NEVER place orbital mechanics or escape velocity variables (like "Velocity", "Gravitational Constant", "Mass of Body", "Radius") into an electrical or algorithm lesson.
  NEVER place search/algorithm complexity (like "O(log n)", "Sorted Array") into a physical or hardware lesson.

ASSESSMENT GROUNDING RULE:
The question in "question" MUST be strictly answerable from the concepts taught in the sections above. NEVER ask about external trivia or untaught facts.

Return ONLY valid JSON in exactly this structure:

{
  "lessonTitle": "string",
  "introduction": "string",
  "learningObjectives": ["string", "string", "string"],
  "sections": [
    {
      "title": "string",
      "explanation": "string",
      "deeperExplanation": "string",
      "keyPoints": ["string", "string"],
      "example": "string",
      "practicalApplication": "string",
      "commonMistake": "string",
      "teacherNarration": "string",
      "visualType": "waveform" | "algorithm" | "radiation" | "physics" | "equation" | "graph" | "biologyProcess" | "flowchart" | "timeline" | "code" | "comparison" | "process" | "fallback",
      "visualTitle": "string",
      "visualDescription": "string",
      "visualData": {}
    }
  ],
  "teacherScenes": [
    {
      "id": "scene_1",
      "order": 1,
      "concept": "string",
      "learningObjective": "string",
      "narration": "string",
      "visualType": "waveform" | "algorithm" | "radiation" | "physics" | "equation" | "graph" | "biologyProcess" | "flowchart" | "timeline" | "code" | "comparison" | "process" | "fallback",
      "visualData": {},
      "videoPrompt": "string",
      "videoUrl": null,
      "status": "idle"
    }
  ],
  "commonMisconception": "string",
  "question": {
    "type": "mcq",
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": "string"
  }
}

Do not include markdown fences.
Do not include any text outside the JSON.
`;

    const response = await safeGenerateContent(prompt);
    const lesson = robustJsonParse(response.text);

    // Ensure teacherScenes exists and covers all sections
    if (!lesson.teacherScenes || !Array.isArray(lesson.teacherScenes) || lesson.teacherScenes.length < (lesson.sections || []).length) {
      lesson.teacherScenes = (lesson.sections || []).map((sec, idx) => ({
        id: `scene_${idx + 1}`,
        order: idx + 1,
        concept: sec.title,
        learningObjective: sec.keyPoints?.[0] || sec.title,
        narration: sec.teacherNarration || sec.explanation?.slice(0, 160) || "",
        visualType: sec.visualType || "fallback",
        visualData: sec.visualData || {},
        videoPrompt: `Professional educator in a modern studio explaining ${sec.title}`,
        videoUrl: null,
        status: "idle"
      }));
    }

    res.json({
      success: true,
      lesson
    });

  } catch (error) {
    console.error("LESSON ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create lesson: " + (error.message || error)
    });
  }
});

app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const {
      topic,
      question,
      correctAnswer,
      studentAnswer,
      level = "beginner",
      language = "English"
    } = req.body;

    if (!question || !studentAnswer) {
      return res.status(400).json({
        success: false,
        error: "Question and student answer are required"
      });
    }

    const prompt = `
You are an expert AI Master Educator evaluating a student's answer.

Topic: ${topic}
Student level: ${level}
Language: ${language}

Question:
${question}

Expected answer:
${correctAnswer}

Student's answer:
${studentAnswer}

Evaluate the student's understanding rigorously and supportively.

You must:
1. Decide whether the answer is "correct", "partially_correct", or "incorrect".
2. Assign an accurate score from 0 to 100 based on genuine conceptual mastery (e.g., 85-100 for fully correct, 45-75 for partially correct, 0-35 for incorrect). Never fabricate a fixed number.
3. Identify the specific concept the student understands or misunderstands.
4. Detect a misconception if one exists.
5. Provide constructive teacher feedback appropriate for the student's level.
6. Decide what the teacher should do next ("continue", "simplify", "reExplain", or "increaseDifficulty").
7. If the student struggles (partially_correct or incorrect), formulate an ADAPTIVE EXPLANATION that is meaningfully different from a standard textbook definition. Use strategies such as:
   - A crystal-clear physical analogy
   - A simpler, intuitive thought experiment
   - An alternate real-world example
   - Step-by-step causal reasoning
8. Formulate a FOLLOW-UP QUESTION that tests the same underlying concept from a new, fresh angle to verify if the adapted explanation clicked.

Return ONLY valid JSON in exactly this structure:

{
  "result": "correct",
  "score": 0,
  "feedback": "string",
  "understoodConcept": "string",
  "misconception": "string",
  "nextAction": "continue",
  "adaptiveExplanation": "string",
  "followUpQuestion": "string"
}

Rules:
- result must be one of: "correct", "partially_correct", "incorrect"
- score must be an integer from 0 to 100
- nextAction must be one of: "continue", "simplify", "reExplain", "increaseDifficulty"
- If there is no misconception, use an empty string.
- If no adaptive explanation is needed, provide a brief encouraging consolidation.
- Keep feedback concise, actionable, and warm.
- Do not include markdown fences.
- Do not include any text outside the JSON.
`;

    const response = await safeGenerateContent(prompt);

    const evaluation = robustJsonParse(response.text);

    res.json({
      success: true,
      evaluation
    });

  } catch (error) {
    console.error("EVALUATION ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Failed to evaluate answer"
    });
  }
});

// Persistent disk-backed cache for generated teaching videos
const cacheFilePath = path.join(videosDir, "cache.json");
const videoCache = new Map();

function loadCacheFromDisk() {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));
      for (const [key, val] of Object.entries(data)) {
        videoCache.set(key, val);
      }
      console.log(`Loaded ${videoCache.size} cached video entries from disk.`);
    }
  } catch (err) {
    console.warn("Could not load video cache from disk:", err.message);
  }
}

function saveCacheToDisk() {
  try {
    const obj = {};
    for (const [key, val] of videoCache.entries()) {
      obj[key] = val;
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(obj, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not save video cache to disk:", err.message);
  }
}

loadCacheFromDisk();



/**
 * Gemini Teaching Planner:
 * Determines the single next concept to teach, providing rich pedagogical depth:
 * core intuition, mechanism, concrete example, practical application, key takeaways,
 * spoken teacher narration (20-35 words), and structured subject-aware visual specifications.
 */
async function planTeachingConcept({
  topic,
  learnerLevel = "beginner",
  language = "English",
  goal = "understand the concept intuitively",
  availableTime = 20,
  currentConcept = null,
  previousConcepts = [],
  mode = "continue",
  order = 1,
}) {
  const isDeepen = mode === "deepen";
  const prompt = `
You are Vidyra's AI Teaching Planner.
Teach the concept, do not merely summarize it.
Each teaching part covers ONE COMPLETE CONCEPT at a time with rigorous clarity.

Student Context:
Topic: ${topic}
Learner Level: ${learnerLevel.toUpperCase()}
Language: ${language}
Goal: ${goal}
Lesson Part Order: ${order}
Teaching Mode: ${isDeepen ? "DEEPEN (elaborate deeper on current concept, providing more detailed mechanics, equations, or nuances)" : "CONTINUE (advance to the next logical concept in the learning progression)"}
Current Concept: ${currentConcept || "None (This is Part 1, the opening concept)"}
Previously Taught Concepts: ${JSON.stringify(previousConcepts || [])}

Instructions:
1. Select the SINGLE NEXT CONCEPT to teach. It must build on previous concepts without repeating them.
2. Formulate one clear learning objective for this specific moment.
3. Write a concise, natural spoken teacher narration in ${language} (STRICTLY 20-35 words). It must be conversational, authoritative, and refer naturally to the visual.
4. Provide a "deeperExplanation" (2-3 sentences explaining the underlying mechanism and why it works).
5. Provide 2-3 "keyPoints" (essential takeaways).
6. Provide a concrete "example" and a "practicalApplication".
7. Provide a "commonMistake" related to this concept.
8. Write a "videoPrompt" describing a professional educator in a modern studio explaining this exact concept with natural hand gestures.
9. Select a GENUINELY SUBJECT-AWARE visualType matching the concept:
   "waveform", "algorithm", "radiation", "physics", "equation", "graph", "biologyProcess", "flowchart", "timeline", "code", "comparison", "process", "fallback"
10. Provide visualTitle, visualDescription, and bounded visualData strictly matching the visualType schema:
   - "waveform": { "dutyCycle": number, "voltageHigh": number, "voltageLow": number, "frequency": number }
   - "algorithm": { "array": [elements], "target": value, "midpointIndex": number, "eliminatedRange": [start, end] }
   - "radiation": { "temperature": number, "peakWavelength": number }
   - "physics": { "velocity": number, "mass": number, "radius": number, "vectors": [] }
   - "equation": { "formula": "string", "variables": [{ "symbol": "string", "name": "string", "unit": "string", "description": "string" }] }
   - "comparison": { "subjectA": "string", "subjectB": "string", "attributes": [{ "name": "string", "valA": "string", "valB": "string" }] }
   - "code": { "language": "string", "code": "string", "highlightLines": [number], "output": "string" }
   - "process": { "steps": [{ "step": number, "name": "string", "description": "string" }] }
   - "fallback": general conceptual model
11. CRITICAL DATA INTEGRITY & TOPIC ISOLATION:
    visualData must contain ONLY information strictly relevant to this concept and the overall topic "${topic}".
    NEVER copy variables or concepts from unrelated subjects.
12. Indicate if more concepts remain (continueAvailable: boolean).

Return ONLY valid JSON in this exact structure:
{
  "concept": "string",
  "learningObjective": "string",
  "narration": "string",
  "deeperExplanation": "string",
  "keyPoints": ["string", "string"],
  "example": "string",
  "practicalApplication": "string",
  "commonMistake": "string",
  "videoPrompt": "string",
  "visualType": "waveform" | "algorithm" | "radiation" | "physics" | "equation" | "graph" | "biologyProcess" | "flowchart" | "timeline" | "code" | "comparison" | "process" | "fallback",
  "visualTitle": "string",
  "visualDescription": "string",
  "visualData": {},
  "continueAvailable": true
}

Do not include markdown fences. Do not include any text outside the JSON.
`;

  const response = await safeGenerateContent(prompt);
  return robustJsonParse(response.text);
}

/**
 * D-ID AI Video Generation Pipeline
 * Protected by VIDEO_GENERATION_LIVE environment flag.
 * STRICTLY NEVER calls D-ID API if process.env.VIDEO_GENERATION_LIVE !== "true".
 * Zero API credits consumed during development/testing.
 */
async function generateDidClip({ narration, concept, topic, clipId, customPresenterId, customVoiceId }) {
  const isLive = process.env.VIDEO_GENERATION_LIVE === "true";

  if (!isLive) {
    console.log(`[D-ID] Safe development mode active (VIDEO_GENERATION_LIVE=false). Zero API credits consumed.`);
    return {
      success: false,
      mode: "development",
      videoUnavailable: true,
      statusCode: 200,
      clipId,
      concept: concept || topic,
      narration,
      error: "AI Video Offline · D-ID video generation is paused (VIDEO_GENERATION_LIVE=false) to protect remaining credits for the final verified run.",
    };
  }

  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) {
    console.error("[D-ID] Error: DID_API_KEY missing from environment");
    return {
      success: false,
      statusCode: 401,
      clipId,
      concept: concept || topic,
      narration,
      error: "DID_API_KEY is not configured on the server.",
    };
  }

  // D-ID basic auth formatting: key may be "key:secret" or pre-encoded base64
  const authHeader = apiKey.includes(":")
    ? `Basic ${Buffer.from(apiKey.trim()).toString("base64")}`
    : `Basic ${apiKey.trim()}`;

  const presenterId = customPresenterId || process.env.DID_PRESENTER_ID || "amy-jcwCkr1grs";
  const voiceId = customVoiceId || process.env.DID_VOICE_ID || "en-US-JennyNeural";

  const payload = {
    script: {
      type: "text",
      subtitles: "false",
      provider: {
        type: "microsoft",
        voice_id: voiceId,
      },
      input: narration,
    },
    config: {
      result_format: "mp4",
    },
    presenter_id: presenterId,
  };

  console.log(`[D-ID] Initiating live clip creation for presenter: ${presenterId}`);

  try {
    const createRes = await fetch("https://api.d-id.com/clips", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const status = createRes.status;
      let errBody = {};
      try { errBody = await createRes.json(); } catch (_) {}

      console.error(`[D-ID] Creation failed with HTTP ${status}:`, errBody.description || errBody.message || "Unknown error");

      let userMsg = `D-ID video generation failed (HTTP ${status})`;
      if (status === 401) userMsg = "D-ID authentication failed. Check DID_API_KEY.";
      else if (status === 402) userMsg = "D-ID credit quota exceeded or payment required.";
      else if (status === 403) userMsg = "D-ID forbidden: requested presenter or voice not permitted.";
      else if (status === 451) userMsg = "D-ID moderation refusal or legal limitation.";

      return {
        success: false,
        statusCode: status,
        clipId,
        concept: concept || topic,
        narration,
        error: userMsg,
      };
    }

    const createData = await createRes.json();
    const clipIdDId = createData.id;
    console.log(`[D-ID] Clip initiated successfully with ID: ${clipIdDId}`);

    // Polling loop (max 30 attempts, 4s delay = 2 minutes max)
    const maxAttempts = 30;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 4000));
      console.log(`[D-ID] Polling clip status: attempt ${attempt}/${maxAttempts}...`);

      const pollRes = await fetch(`https://api.d-id.com/clips/${clipIdDId}`, {
        method: "GET",
        headers: {
          "Authorization": authHeader,
        },
      });

      if (!pollRes.ok) {
        console.warn(`[D-ID] Polling error HTTP ${pollRes.status}`);
        continue;
      }

      const clipInfo = await pollRes.json();
      console.log(`[D-ID] Status: ${clipInfo.status}`);

      if (clipInfo.status === "done" && clipInfo.result_url) {
        console.log(`[D-ID] Generation complete! Status: ${clipInfo.status}, result_url: ${clipInfo.result_url}`);

        // On Vercel / serverless: filesystem is ephemeral and read-only outside /tmp.
        // Return direct D-ID result_url (AWS S3) so frontend renders the real video directly.
        if (isServerless) {
          console.log("[D-ID] Serverless environment detected; returning direct D-ID CDN result_url for production video playback.");
          return {
            success: true,
            videoUrl: clipInfo.result_url,
            clipId,
            duration: clipInfo.duration || 8,
            provider: "d-id",
          };
        }

        // Local development: attempt local download for offline/local playback
        const localFilename = `${clipId}.mp4`;
        const localFilePath = path.join(videosDir, localFilename);

        try {
          const videoFetch = await fetch(clipInfo.result_url);
          if (videoFetch.ok) {
            const buffer = await videoFetch.arrayBuffer();
            fs.writeFileSync(localFilePath, Buffer.from(buffer));
            console.log(`[D-ID] Saved video to ${localFilename}`);

            return {
              success: true,
              videoUrl: `/videos/${localFilename}`,
              clipId,
              duration: clipInfo.duration || 8,
              provider: "d-id",
            };
          }
        } catch (dlErr) {
          console.warn("[D-ID] Download failed, using direct result_url:", dlErr.message);
        }

        return {
          success: true,
          videoUrl: clipInfo.result_url,
          clipId,
          duration: clipInfo.duration || 8,
          provider: "d-id",
        };
      } else if (clipInfo.status === "error" || clipInfo.status === "rejected") {
        console.error(`[D-ID] Clip generation failed with status: ${clipInfo.status}`);
        return {
          success: false,
          statusCode: 500,
          clipId,
          concept: concept || topic,
          narration,
          error: `D-ID generation ${clipInfo.status}: ${clipInfo.error?.description || "Processing error"}`,
        };
      }
    }

    return {
      success: false,
      statusCode: 504,
      clipId,
      concept: concept || topic,
      narration,
      error: "D-ID generation timed out while processing video.",
    };
  } catch (netErr) {
    console.error("[D-ID] Network or unexpected error:", netErr.message);
    return {
      success: false,
      statusCode: 500,
      clipId,
      concept: concept || topic,
      narration,
      error: "Network error contacting D-ID service: " + netErr.message,
    };
  }
}

/**
 * POST /api/generate-teaching-part
 * Generates one teaching concept part at a time with subject visuals and optional D-ID video.
 */
app.post("/api/generate-teaching-part", async (req, res) => {
  try {
    const {
      topic,
      learnerLevel = "beginner",
      language = "English",
      duration = 20,
      goal = "understand clearly",
      currentConcept = null,
      previousConcepts = [],
      mode = "continue",
      order = 1,
      previousVideoId = null,
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "Topic is required",
      });
    }

    // 1. Gemini Teaching Planner decides the next concept & visual
    const planned = await planTeachingConcept({
      topic,
      learnerLevel,
      language,
      goal,
      availableTime: duration,
      currentConcept,
      previousConcepts,
      mode,
      order,
    });

    const partId = `part_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cacheKey = `${topic.toLowerCase().trim()}_${planned.concept.toLowerCase().trim()}_${language.toLowerCase().trim()}_${learnerLevel.toLowerCase().trim()}`;

    // 2. Check local persistent video cache
    let videoUrl = null;
    let fromCache = false;
    const cached = videoCache.get(cacheKey);

    if (cached && cached.clipId) {
      const localFilePath = path.join(videosDir, `${cached.clipId}.mp4`);
      if (fs.existsSync(localFilePath)) {
        videoUrl = cached.videoUrl || `/videos/${cached.clipId}.mp4`;
        fromCache = true;
      }
    }

    // 3. If not cached, attempt D-ID video generation (guarded by VIDEO_GENERATION_LIVE)
    if (!videoUrl) {
      const clipId = `did_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const didResult = await generateDidClip({
        narration: planned.narration,
        concept: planned.concept,
        topic,
        clipId,
      });

      if (didResult.success && didResult.videoUrl) {
        videoUrl = didResult.videoUrl;
        videoCache.set(cacheKey, {
          clipId,
          videoUrl,
          duration: didResult.duration || 8,
          concept: planned.concept,
          topic,
          language,
        });
        saveCacheToDisk();
      }
    }

    const teachingPart = {
      id: partId,
      order: order || 1,
      concept: planned.concept,
      learningObjective: planned.learningObjective,
      narration: planned.narration,
      deeperExplanation: planned.deeperExplanation,
      keyPoints: planned.keyPoints,
      example: planned.example,
      practicalApplication: planned.practicalApplication,
      commonMistake: planned.commonMistake,
      videoPrompt: planned.videoPrompt,
      visualType: planned.visualType,
      visualTitle: planned.visualTitle,
      visualDescription: planned.visualDescription,
      visualData: planned.visualData,
      videoUrl: videoUrl || null,
      previousVideoId: previousVideoId || null,
      status: videoUrl ? "ready" : "unavailable",
      continueAvailable: planned.continueAvailable !== false,
      fromCache,
    };

    res.json({
      success: true,
      part: teachingPart,
      videoUrl: videoUrl || null,
    });
  } catch (error) {
    console.error("GENERATE TEACHING PART ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate teaching part: " + (error.message || error),
    });
  }
});

/**
 * POST /api/generate-teaching-video
 * D-ID AI Teacher Video generation endpoint.
 * Protected by VIDEO_GENERATION_LIVE flag in backend/.env.
 */
app.post("/api/generate-teaching-video", async (req, res) => {
  try {
    const {
      topic,
      concept,
      narration,
      language = "English",
      learnerLevel = "beginner",
    } = req.body;

    if (!topic || !narration) {
      return res.status(400).json({
        success: false,
        error: "Topic and narration are required",
      });
    }

    const cacheKey = `${topic.toLowerCase().trim()}_${(concept || topic).toLowerCase().trim()}_${language.toLowerCase().trim()}_${learnerLevel.toLowerCase().trim()}`;
    const cached = videoCache.get(cacheKey);

    if (cached && cached.clipId) {
      const localFilePath = path.join(videosDir, `${cached.clipId}.mp4`);
      if (fs.existsSync(localFilePath)) {
        const cachedUrl = cached.videoUrl || `/videos/${cached.clipId}.mp4`;
        console.log(`[D-ID] frontend response: success=true (cached), videoUrl=${cachedUrl}`);
        return res.json({
          success: true,
          videoUrl: cachedUrl,
          sceneId: cached.clipId,
          concept: concept || topic,
          narration: cached.spokenScript || narration,
          duration: cached.duration || 8,
          spokenScript: cached.spokenScript || narration,
          fromCache: true,
          provider: "d-id",
        });
      }
    }

    const clipId = `did_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Call D-ID video pipeline (guarded: ZERO calls if VIDEO_GENERATION_LIVE !== true)
    const didResult = await generateDidClip({
      narration,
      concept: concept || topic,
      topic,
      clipId,
    });

    if (didResult.success && didResult.videoUrl) {
      videoCache.set(cacheKey, {
        clipId,
        videoUrl: didResult.videoUrl,
        duration: didResult.duration || 8,
        concept: concept || topic,
        topic,
        language,
        spokenScript: narration,
      });
      saveCacheToDisk();

      console.log(`[D-ID] frontend response: success=true, videoUrl=${didResult.videoUrl}`);
      return res.json({
        success: true,
        videoUrl: didResult.videoUrl,
        sceneId: clipId,
        concept: concept || topic,
        narration,
        duration: didResult.duration || 8,
        spokenScript: narration,
        provider: "d-id",
      });
    }

    console.log(`[D-ID] frontend response: success=false, mode=${didResult.mode || "offline"}, statusCode=${didResult.statusCode || 200}`);
    return res.status(didResult.statusCode || 200).json({
      success: false,
      mode: didResult.mode || "development",
      videoUnavailable: true,
      statusCode: didResult.statusCode || 200,
      sceneId: clipId,
      concept: concept || topic,
      narration,
      error: didResult.error || "AI Video Offline · D-ID video generation is paused to protect credits.",
    });
  } catch (error) {
    console.error("GENERATE TEACHING VIDEO ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate teaching video: " + (error.message || error),
    });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;