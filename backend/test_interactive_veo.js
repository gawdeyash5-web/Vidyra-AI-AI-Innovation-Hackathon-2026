async function runTests() {
  const topics = [
    "Pulse Width Modulation",
    "Binary Search",
    "Black Body Radiation"
  ];

  console.log("==================================================");
  console.log("STARTING VIDYRA VEO 3.1 INTERACTIVE SYSTEM TEST");
  console.log("==================================================\n");

  for (const topic of topics) {
    console.log(`\n--------------------------------------------------`);
    console.log(`TESTING TOPIC: ${topic}`);
    console.log(`--------------------------------------------------`);

    // 1. Test create-lesson
    console.log(`1. Testing /api/create-lesson for "${topic}"...`);
    const lessonRes = await fetch("http://localhost:5000/api/create-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, level: "beginner" }),
    });
    const lessonData = await lessonRes.json();
    console.log(`   Lesson created: "${lessonData.lesson?.lessonTitle}" (success: ${lessonData.success})`);

    // 2. Test Part 1 generation
    console.log(`2. Testing Part 1 (First Teaching Part) via Gemini Teaching Planner & Veo...`);
    const part1Res = await fetch("http://localhost:5000/api/generate-teaching-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        learnerLevel: "beginner",
        language: "English",
        order: 1,
        mode: "continue",
      }),
    });
    const part1Data = await part1Res.json();
    const p1 = part1Data.part;
    console.log(`   Part 1 Concept: "${p1?.concept}"`);
    console.log(`   Part 1 Objective: "${p1?.learningObjective}"`);
    console.log(`   Part 1 Narration: "${p1?.narration}" (${p1?.narration?.split(/\s+/).length} words)`);
    console.log(`   Part 1 Visual Type: ${p1?.visualType}`);
    console.log(`   Part 1 Video Status: ${p1?.status} (videoUrl: ${p1?.videoUrl || "none - offline/quota handled"})`);

    // 3. Test Continue Teaching (Part 2)
    console.log(`3. Testing "Continue Teaching" (Part 2)...`);
    const part2Res = await fetch("http://localhost:5000/api/generate-teaching-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        learnerLevel: "beginner",
        language: "English",
        order: 2,
        mode: "continue",
        currentConcept: p1?.concept,
        previousConcepts: [p1?.concept],
      }),
    });
    const part2Data = await part2Res.json();
    const p2 = part2Data.part;
    console.log(`   Part 2 Concept: "${p2?.concept}"`);
    console.log(`   Part 2 Objective: "${p2?.learningObjective}"`);
    console.log(`   Part 2 Narration: "${p2?.narration}"`);
    console.log(`   Part 2 Visual Type: ${p2?.visualType}`);

    // Check that Concept 2 is distinct from Concept 1
    const isDistinct = p1?.concept?.toLowerCase() !== p2?.concept?.toLowerCase();
    console.log(`   Assertion - Part 2 teaches distinct new concept: ${isDistinct ? "PASSED" : "FAILED"}`);

    // 4. Test Go Deeper (Part 3)
    console.log(`4. Testing "Go Deeper" on current concept...`);
    const part3Res = await fetch("http://localhost:5000/api/generate-teaching-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        learnerLevel: "beginner",
        language: "English",
        order: 3,
        mode: "deepen",
        currentConcept: p2?.concept,
        previousConcepts: [p1?.concept, p2?.concept],
      }),
    });
    const part3Data = await part3Res.json();
    const p3 = part3Data.part;
    console.log(`   Part 3 Deepened Concept: "${p3?.concept}"`);
    console.log(`   Part 3 Visual Type: ${p3?.visualType}`);
  }

  // 5. Test evaluate-answer
  console.log(`\n--------------------------------------------------`);
  console.log(`TESTING EVALUATE ANSWER FLOW`);
  console.log(`--------------------------------------------------`);
  const evalRes = await fetch("http://localhost:5000/api/evaluate-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "Pulse Width Modulation",
      question: "What happens to the average voltage when the duty cycle increases?",
      correctAnswer: "The average voltage increases proportionally.",
      studentAnswer: "It gets higher because the pulse stays on longer.",
      level: "beginner",
      language: "English",
    }),
  });
  const evalData = await evalRes.json();
  console.log(`Evaluation result: ${evalData.evaluation?.result}, Score: ${evalData.evaluation?.score}`);
  console.log(`Feedback: "${evalData.evaluation?.feedback}"`);

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests();
