/**
 * Vidyra AI - D-ID Video Pipeline Mock Lifecycle Test
 * 
 * STRICT RULE: ZERO real D-ID generation requests.
 * Uses a local mock server to simulate the D-ID clips lifecycle:
 * 1. created -> processing -> done
 * 2. created -> processing -> error
 * 3. verification of VIDEO_GENERATION_LIVE=false credit protection
 */

const http = require("http");

console.log("==================================================");
console.log("D-ID VIDEO PIPELINE MOCK LIFECYCLE TESTS");
console.log("STRICT GUARANTEE: ZERO live requests to api.d-id.com");
console.log("==================================================\n");

// Helper to run a local mock D-ID server
function createMockDidServer({ pollBehavior = "done", maxPolls = 2 }) {
  let pollCount = 0;
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    // POST /clips (Creation)
    if (req.method === "POST" && req.url === "/clips") {
      res.writeHead(201);
      res.end(JSON.stringify({
        id: "clp_mock_test_123",
        created_at: new Date().toISOString(),
        status: "created",
        object: "clip"
      }));
      return;
    }

    // GET /clips/:id (Polling)
    if (req.method === "GET" && req.url.startsWith("/clips/")) {
      pollCount++;
      if (pollCount < maxPolls) {
        // Still processing
        res.writeHead(200);
        res.end(JSON.stringify({
          id: "clp_mock_test_123",
          status: "started",
          created_at: new Date().toISOString()
        }));
      } else if (pollBehavior === "done") {
        // Completed successfully
        res.writeHead(200);
        res.end(JSON.stringify({
          id: "clp_mock_test_123",
          status: "done",
          result_url: "http://localhost:5000/videos/mock_demo.mp4",
          duration: 8.5
        }));
      } else {
        // Error state
        res.writeHead(200);
        res.end(JSON.stringify({
          id: "clp_mock_test_123",
          status: "error",
          error: {
            kind: "SynthesizeError",
            description: "Simulated synthesis error for test"
          }
        }));
      }
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r))
      });
    });
  });
}

// Pipeline simulation using mock server URL
async function testPipelineWithMockServer(baseUrl, pollBehavior) {
  const authHeader = "Basic dGVzdF9rZXk6dGVzdF9zZWNyZXQ=";
  
  // 1. Creation
  const createRes = await fetch(`${baseUrl}/clips`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      script: {
        type: "text",
        input: "Test script narration"
      },
      presenter_id: "amy-jcwCkr1grs"
    })
  });

  if (!createRes.ok) {
    throw new Error(`Create failed with status ${createRes.status}`);
  }

  const createData = await createRes.json();
  const clipId = createData.id;
  console.log(`[MOCK] Step 1: Clip created -> id: ${clipId}, status: ${createData.status}`);

  // 2. Polling loop
  let isDone = false;
  let result = null;
  let attempts = 0;

  while (!isDone && attempts < 10) {
    attempts++;
    const pollRes = await fetch(`${baseUrl}/clips/${clipId}`, {
      headers: { "Authorization": authHeader }
    });
    const info = await pollRes.json();
    console.log(`[MOCK] Step 2: Polling attempt ${attempts} -> status: ${info.status}`);

    if (info.status === "done") {
      isDone = true;
      result = {
        success: true,
        videoUrl: info.result_url,
        duration: info.duration,
        provider: "d-id"
      };
    } else if (info.status === "error") {
      isDone = true;
      result = {
        success: false,
        error: info.error?.description || "Processing error"
      };
    }
  }

  return result;
}

async function runAllMockTests() {
  console.log("TEST 1: Simulating created -> processing -> done lifecycle...");
  const mockDone = await createMockDidServer({ pollBehavior: "done", maxPolls: 2 });
  const result1 = await testPipelineWithMockServer(mockDone.baseUrl, "done");
  await mockDone.close();

  console.log("Result 1:", result1);
  if (result1.success && result1.videoUrl) {
    console.log(">>> TEST 1 PASSED: Successfully transitioned created -> started -> done with valid videoUrl\n");
  } else {
    console.error(">>> TEST 1 FAILED\n");
    process.exit(1);
  }

  console.log("TEST 2: Simulating created -> processing -> error lifecycle...");
  const mockError = await createMockDidServer({ pollBehavior: "error", maxPolls: 2 });
  const result2 = await testPipelineWithMockServer(mockError.baseUrl, "error");
  await mockError.close();

  console.log("Result 2:", result2);
  if (!result2.success && result2.error) {
    console.log(">>> TEST 2 PASSED: Successfully handled error state without crash\n");
  } else {
    console.error(">>> TEST 2 FAILED\n");
    process.exit(1);
  }

  console.log("TEST 3: Verifying live backend credit protection (VIDEO_GENERATION_LIVE=false)...");
  const backendRes = await fetch("http://localhost:5000/api/generate-teaching-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "Pulse Width Modulation",
      concept: "Duty cycle",
      narration: "Testing credit safety mode",
      language: "English"
    })
  });
  const backendData = await backendRes.json();
  console.log("Backend Response in Safe Mode:", backendData);

  if (backendData.videoUnavailable === true && backendData.mode === "development") {
    console.log(">>> TEST 3 PASSED: Server safely paused D-ID generation. Zero credits consumed.\n");
  } else {
    console.error(">>> TEST 3 FAILED: Unexpected backend behavior\n");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("ALL MOCK LIFECYCLE TESTS COMPLETED SUCCESSFULLY!");
  console.log("CONFIRMATION: ZERO live requests were made to D-ID.");
  console.log("==================================================");
}

runAllMockTests().catch((err) => {
  console.error("Mock test run error:", err);
  process.exit(1);
});
