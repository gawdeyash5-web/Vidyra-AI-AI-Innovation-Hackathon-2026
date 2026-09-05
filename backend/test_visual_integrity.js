const forbiddenForPwm = [
  "velocity",
  "gravitational constant",
  "mass of body",
  "radius / distance",
  "escape",
  "o(log n)",
  "o(n)",
  "sorted array required",
  "unsorted list"
];

async function testVisualIntegrity() {
  console.log("==================================================");
  console.log("TEST 1: PULSE WIDTH MODULATION (PWM) AUDIT");
  console.log("==================================================");

  // 1. Create Lesson Audit
  console.log("\n1. Auditing /api/create-lesson for PWM...");
  const lessonRes = await fetch("http://localhost:5000/api/create-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "Pulse Width Modulation", level: "beginner" }),
  });
  const lessonData = await lessonRes.json();
  const sections = lessonData.lesson?.sections || [];

  sections.forEach((s, idx) => {
    console.log(`\n--- Section ${idx + 1}: "${s.title}" (visualType: ${s.visualType}) ---`);
    console.log("visualData:", JSON.stringify(s.visualData));
    const stringified = JSON.stringify(s.visualData || {}).toLowerCase();
    
    for (const bad of forbiddenForPwm) {
      if (stringified.includes(bad)) {
        throw new Error(`FAIL: Found cross-contaminated term "${bad}" in PWM Section ${idx + 1}!`);
      }
    }
    console.log(`✓ Section ${idx + 1} is clean: Zero escape-velocity or binary-search contamination.`);
  });

  // 2. Interactive Teaching Parts Audit (Parts 1 to 4)
  console.log("\n2. Auditing 4 Consecutive Teaching Parts for PWM...");
  let currentConcept = null;
  let prevConcepts = [];

  for (let order = 1; order <= 4; order++) {
    const partRes = await fetch("http://localhost:5000/api/generate-teaching-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Pulse Width Modulation",
        learnerLevel: "beginner",
        language: "English",
        order,
        mode: "continue",
        currentConcept,
        previousConcepts: prevConcepts,
      }),
    });
    const partData = await partRes.json();
    const part = partData.part;

    console.log(`\n--- Part ${order}: "${part.concept}" (visualType: ${part.visualType}) ---`);
    console.log("Narration:", part.narration);
    console.log("visualData:", JSON.stringify(part.visualData));

    const stringified = JSON.stringify(part.visualData || {}).toLowerCase();
    for (const bad of forbiddenForPwm) {
      if (stringified.includes(bad)) {
        throw new Error(`FAIL: Found cross-contaminated term "${bad}" in PWM Part ${order}!`);
      }
    }
    console.log(`✓ Part ${order} is clean: Zero escape-velocity or binary-search contamination.`);

    currentConcept = part.concept;
    prevConcepts.push(part.concept);
  }

  console.log("\n==================================================");
  console.log("TEST 2: CROSS-TOPIC ISOLATION AUDIT (4 TOPICS)");
  console.log("==================================================");

  const testTopics = [
    {
      topic: "Binary Search",
      forbidden: ["duty cycle", "gravitational constant", "wavelength", "kelvin", "radiation"]
    },
    {
      topic: "Escape Velocity",
      forbidden: ["duty cycle", "sorted array", "o(log n)", "chloroplast"]
    },
    {
      topic: "Black Body Radiation",
      forbidden: ["duty cycle", "sorted array required", "escape velocity", "binary search"]
    }
  ];

  for (const t of testTopics) {
    console.log(`\nAuditing topic: ${t.topic}...`);
    const res = await fetch("http://localhost:5000/api/generate-teaching-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: t.topic,
        learnerLevel: "beginner",
        language: "English",
        order: 1,
        mode: "continue",
      }),
    });
    const d = await res.json();
    const part = d.part;
    console.log(`Part 1 Concept: "${part.concept}" | visualType: ${part.visualType}`);
    console.log("visualData:", JSON.stringify(part.visualData));

    const stringified = JSON.stringify(part.visualData || {}).toLowerCase();
    for (const bad of t.forbidden) {
      if (stringified.includes(bad)) {
        throw new Error(`FAIL: Found cross-contaminated term "${bad}" in ${t.topic}!`);
      }
    }
    console.log(`✓ ${t.topic} is clean: Zero cross-contamination.`);
  }

  console.log("\n==================================================");
  console.log("ALL DATA INTEGRITY AND ISOLATION TESTS PASSED!");
  console.log("==================================================");
}

testVisualIntegrity().catch((err) => {
  console.error(err);
  process.exit(1);
});
