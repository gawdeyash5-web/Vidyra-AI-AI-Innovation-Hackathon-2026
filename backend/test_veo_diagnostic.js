const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is missing from backend/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const promptText = "A professional teacher in a modern classroom explains a simple engineering concept to a student, natural gestures, realistic educational video.";

const models = [
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-preview"
];

async function runDiagnostic() {
  console.log("==================================================");
  console.log("VEO 3.1 API ACCESS AND BILLING DIAGNOSTIC");
  console.log("==================================================");
  console.log("SDK: @google/genai");
  console.log("API Key present: YES (length: " + apiKey.length + ")");
  console.log("Prompt: \"" + promptText + "\"\n");

  for (const model of models) {
    console.log("--------------------------------------------------");
    console.log(`Testing Model: ${model}`);
    console.log("--------------------------------------------------");

    try {
      console.log(`[VEO] Sending generateVideos() request with model: ${model}...`);
      
      // Test both with prompt top-level and source: { prompt }
      const operation = await ai.models.generateVideos({
        model,
        source: {
          prompt: promptText,
        },
        config: {
          numberOfVideos: 1,
          aspectRatio: "16:9",
          durationSeconds: 8,
          resolution: "720p",
        },
      });

      console.log("[VEO] SUCCESS! Operation initiated:");
      console.log("Operation name:", operation.name);
      console.log("Operation done:", operation.done);
      console.log("Operation metadata:", JSON.stringify(operation.metadata || {}));

      // Polling loop
      console.log("[VEO] Starting polling loop...");
      let currentOp = operation;
      let attempts = 0;
      const maxAttempts = 30; // up to ~5 minutes

      while (!currentOp.done && attempts < maxAttempts) {
        attempts++;
        console.log(`[VEO] Polling attempt ${attempts}... waiting 10s...`);
        await new Promise((r) => setTimeout(r, 10000));

        currentOp = await ai.operations.getVideosOperation({
          operation: currentOp,
        });
        console.log(`[VEO] Status: done=${currentOp.done}`);
      }

      if (currentOp.done) {
        console.log("[VEO] OPERATION COMPLETED!");
        console.log("Response:", JSON.stringify(currentOp.response, null, 2));

        const generatedVideos = currentOp.response?.generatedVideos;
        if (generatedVideos && generatedVideos.length > 0) {
          const videoObj = generatedVideos[0].video;
          console.log("[VEO] Generated Video Object:", JSON.stringify(videoObj, null, 2));
          console.log("[VEO] Video URI:", videoObj?.uri);
        }
        return; // Success!
      } else {
        console.log("[VEO] Polling timed out before operation marked done.");
      }

    } catch (err) {
      console.log(`[VEO] REQUEST FAILED for model: ${model}`);
      console.log("Error status:", err.status);
      console.log("Error name:", err.name);
      console.log("Error message:", err.message);

      if (err.error) {
        console.log("Raw API Error Object:", JSON.stringify(err.error, null, 2));
      }
      if (err.details) {
        console.log("Raw Error Details:", JSON.stringify(err.details, null, 2));
      }
      if (err.response) {
        console.log("Raw Response:", err.response);
      }
    }
  }

  console.log("\n==================================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("==================================================");
}

runDiagnostic();
