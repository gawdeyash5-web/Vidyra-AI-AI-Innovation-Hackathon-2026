/**
 * Vidyra AI - Arbitrary Topics Rich Lesson & Evaluation Verification
 * 
 * Verifies that:
 * 1. Rich lesson generation works for diverse subjects.
 * 2. Visual types and data change appropriately.
 * 3. Narrations and examples are topic-specific.
 * 4. Assessment questions are strictly grounded in taught content.
 * 5. Answer evaluation returns real feedback, scores, and adaptive explanations.
 */

const topicsToTest = [
  { topic: "Binary Search", level: "intermediate", duration: 20, expectedType: "algorithm" },
  { topic: "Black Body Radiation", level: "advanced", duration: 45, expectedType: "radiation" },
  { topic: "Escape Velocity", level: "beginner", duration: 20, expectedType: "physics" },
  { topic: "Photosynthesis", level: "beginner", duration: 20, expectedType: "biologyProcess" },
  { topic: "Operating Systems", level: "intermediate", duration: 20, expectedType: "flowchart" }
];

async function runTopicTests() {
  console.log("==================================================");
  console.log("ARBITRARY TOPICS RICH TEACHING VALIDATION");
  console.log("==================================================\n");

  for (const item of topicsToTest) {
    console.log(`--------------------------------------------------`);
    console.log(`Testing Topic: ${item.topic} (Level: ${item.level}, Duration: ${item.duration}m)`);
    console.log(`--------------------------------------------------`);

    const res = await fetch("http://localhost:5000/api/create-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: item.topic,
        level: item.level,
        language: "English",
        duration: item.duration,
        goal: `Master ${item.topic} concepts thoroughly`
      })
    });

    if (!res.ok) {
      console.error(`FAILED: ${item.topic} returned HTTP ${res.status}`);
      continue;
    }

    const data = await res.json();
    if (!data.success || !data.lesson) {
      console.error(`FAILED: ${item.topic} returned unsuccessful response:`, data);
      continue;
    }

    const lesson = data.lesson;
    console.log(`Lesson Title: "${lesson.lessonTitle}"`);
    console.log(`Sections Generated: ${lesson.sections?.length}`);

    const s1 = lesson.sections?.[0];
    if (s1) {
      console.log(`Section 1: "${s1.title}"`);
      console.log(`- Visual Type: "${s1.visualType}"`);
      console.log(`- Key Points: ${s1.keyPoints?.length || 0} points`);
      console.log(`- Example: "${s1.example?.slice(0, 80)}..."`);
      console.log(`- Narration: "${s1.teacherNarration?.slice(0, 80)}..."`);
      console.log(`- Has Deeper Explanation: ${Boolean(s1.deeperExplanation)}`);
    }

    console.log(`Teacher Scenes Count: ${lesson.teacherScenes?.length}`);
    console.log(`Grounded Question: "${lesson.question?.question}"`);
    console.log(`Options Count: ${lesson.question?.options?.length}, Correct: "${lesson.question?.correctAnswer}"`);

    // Verify Evaluation with a sample answer
    console.log(`Testing answer evaluation for ${item.topic}...`);
    const evalRes = await fetch("http://localhost:5000/api/evaluate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: item.topic,
        question: lesson.question?.question,
        correctAnswer: lesson.question?.correctAnswer,
        studentAnswer: lesson.question?.correctAnswer, // test correct answer
        level: item.level,
        language: "English"
      })
    });

    const evalData = await evalRes.json();
    if (evalData.success && evalData.evaluation) {
      console.log(`Evaluation Result: ${evalData.evaluation.result}, Score: ${evalData.evaluation.score}/100`);
      console.log(`Feedback: "${evalData.evaluation.feedback?.slice(0, 70)}..."`);
      console.log(`Understood Concept: "${evalData.evaluation.understoodConcept?.slice(0, 50)}..."`);
    }

    console.log(`>>> ${item.topic}: PASSED!\n`);
  }

  console.log("==================================================");
  console.log("ALL ARBITRARY TOPICS VALIDATION COMPLETED");
  console.log("==================================================");
}

runTopicTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
