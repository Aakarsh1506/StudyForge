const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Same smart pdf-parse wrapper as timetableController ──
const pdfParseModule = require("pdf-parse");

async function extractTextFromBuffer(buffer) {
  if (typeof pdfParseModule === "function") {
    const data = await pdfParseModule(buffer);
    return data.text;
  }
  if (pdfParseModule.default && typeof pdfParseModule.default === "function") {
    const data = await pdfParseModule.default(buffer);
    return data.text;
  }
  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  if (pdfParseModule.default && pdfParseModule.default.PDFParse) {
    const parser = new pdfParseModule.default.PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  throw new Error("Could not detect a recognized export structure in pdf-parse.");
}

async function pdfToText(buffer) {
  const text = await extractTextFromBuffer(buffer);
  return text.split(/\s+/).slice(0, 4000).join(" ");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory rate limit store
const chatUsage = {};
const DAILY_LIMIT = 15;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ── QUIZ ──
exports.generateQuiz = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded." });
    const { numQuestions = 5, difficulty = "medium" } = req.body;
    const text = await pdfToText(req.file.buffer);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(`
You are a quiz generator. Based on the study material below, generate exactly ${numQuestions} multiple-choice questions at ${difficulty} difficulty.

Material:
"""${text}"""

Reply ONLY with a valid JSON array, no markdown fences:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
`);
    const raw = result.response.text().replace(/```json|```/g, "").trim();
    res.json({ questions: JSON.parse(raw) });
  } catch (e) {
    console.error("Quiz:", e.message);
    res.status(500).json({ error: e.message });
  }
};

// ── FLASHCARDS ──
exports.generateFlashcards = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded." });
    const { numCards = 10 } = req.body;
    const text = await pdfToText(req.file.buffer);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are a flashcard generator. Based on the study material below, generate exactly ${numCards} flashcards covering the key concepts.

Material:
"""${text}"""

Reply ONLY with a valid JSON array, no markdown fences:
[{"front":"term or question","back":"definition or answer"}]
`;

    let raw;
    for (let i = 0; i < 4; i++) {
      try {
        const result = await model.generateContent(prompt);
        raw = result.response.text().replace(/```json|```/g, "").trim();
        break;
      } catch (e) {
        if (e.status === 503 && i < 3) {
          console.warn(`Gemini busy, retrying in ${(i+1)*3}s...`);
          await new Promise(r => setTimeout(r, (i+1) * 3000));
        } else throw e;
      }
    }

    res.json({ flashcards: JSON.parse(raw) });
  } catch (e) {
    console.error("Flashcards:", e.message);
    res.status(500).json({ error: e.message });
  }
};

// ── STUDY PLAN ──
exports.generateStudyPlan = async (req, res) => {
  try {
    const { subjects, examDate, hoursPerDay, goals } = req.body;
    if (!subjects || !examDate || !hoursPerDay)
      return res.status(400).json({ error: "subjects, examDate, and hoursPerDay are required." });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const today = todayStr();

    const result = await model.generateContent(`
You are an expert study planner. Create a day-by-day study plan.

- Today: ${today}
- Exam date: ${examDate}
- Subjects: ${subjects}
- Hours per day: ${hoursPerDay}
- Goals: ${goals || "Score well"}

Reply ONLY with a valid JSON object, no markdown fences:
{
  "summary": "...",
  "totalDays": 7,
  "plan": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "dailyGoal": "...",
      "sessions": [{"subject":"...","topic":"...","duration":"1.5 hours","activity":"..."}]
    }
  ],
  "tips": ["tip1","tip2"]
}
`);
    const raw = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(raw));
  } catch (e) {
    console.error("Study plan:", e.message);
    res.status(500).json({ error: e.message });
  }
};

// ── CHATBOT (15/day, study-only) ──
exports.chatMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message required." });

    const today = todayStr();
    if (!chatUsage[userId] || chatUsage[userId].date !== today)
      chatUsage[userId] = { count: 0, date: today };

    if (chatUsage[userId].count >= DAILY_LIMIT)
      return res.status(429).json({ error: `Daily limit of ${DAILY_LIMIT} messages reached. Come back tomorrow!`, limitReached: true });

    chatUsage[userId].count++;
    const remaining = DAILY_LIMIT - chatUsage[userId].count;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are StudyForge's AI Study Assistant — a focused academic tutor.
You ONLY help with: academics, subject concepts, exam prep, study strategies, assignments, and notes.
If asked anything unrelated to studying or academics, respond: "I'm here to help you study! Ask me about any subject, concept, or exam prep."
Keep answers concise and student-friendly.`;

    const chatHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Got it! I'm StudyForge's study assistant, here to help with academics only." }] },
      ...history.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
    ];

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);

    res.json({ reply: result.response.text(), remaining });
  } catch (e) {
    console.error("Chat:", e.message);
    res.status(500).json({ error: e.message });
  }
};