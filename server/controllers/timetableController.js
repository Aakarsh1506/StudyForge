const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const { exec } = require("child_process");

// 1. Smart Universal Wrapper to support all old & new versions of pdf-parse
const pdfParseModule = require("pdf-parse");

async function extractTextFromBuffer(buffer) {
  // Variant A: Classic pdf-parse structure (Direct function export)
  if (typeof pdfParseModule === "function") {
    const data = await pdfParseModule(buffer);
    return data.text;
  }
  
  // Variant B: Classic default wrapper structure
  if (pdfParseModule.default && typeof pdfParseModule.default === "function") {
    const data = await pdfParseModule.default(buffer);
    return data.text;
  }

  // Variant C: Modern/Forked structure (Class constructor named PDFParse)
  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  // Variant D: Modern structure wrapped inside a default property
  if (pdfParseModule.default && pdfParseModule.default.PDFParse) {
    const parser = new pdfParseModule.default.PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  throw new Error("Could not detect a recognized export structure in the installed pdf-parse package.");
}

// Import the official Google Gen AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini SDK with the key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple helper function to handle waiting between retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const convertPDFToImages = async (pdfBuffer) => {
  const tempDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const pdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  const outputPrefix = pdfPath.replace(".pdf", "");

  await new Promise((resolve, reject) => {
    exec(`pdftoppm -png "${pdfPath}" "${outputPrefix}"`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const files = fs
    .readdirSync(tempDir)
    .filter(f => f.startsWith(`temp_`) && f.endsWith(".png"))
    .map(f => path.join(tempDir, f));

  return files;
};

const runOCR = async (imagePath) => {
  const { data } = await Tesseract.recognize(imagePath, "eng");
  return data.text;
};

// This function handles structural AI parsing with a robust backoff mechanism
const parseTimetableWithAI = async (text, retries = 4) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are an expert university data entry assistant. Analyze this extracted text from a student's timetable schedule.
    This text may come directly from a digital layer or via an OCR engine. 
    
    CRUCIAL NOTE ON NOISE: If the text contains random symbols, grid line artifacts, or messy character blocks (e.g., "[1] 5 [3 << i", "wE a EERE"), completely ignore them. Focus strictly on identifying text structures that represent real schedules.

    Extract every valid lecture class, session, and laboratory slot.

    CRUCIAL FORMATTING & MAPPING RULES:
    1. Normalize all day headings to full proper names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".
    2. Check if shorthand subject codes (e.g., "QP", "PEM", "LADE", "DLD") or faculty initials (e.g., "VKH", "VSG", "KPA") have a "Reference Legend" mapping table anywhere in the text. If a legend is found, replace the abbreviations with their full text equivalents (e.g., "Quantum Physics", "Dr. Vinita Khatri"). If no matching legend is found, preserve the raw text layout values exactly.
    3. Format all times to standard 24-hour HH:MM representation (e.g., "08:00", "09:00", "13:00").
    4. Ignore standard non-class entries like "BREAK" or "LUNCH".

    Return a clean, valid raw JSON array matching this exact schema:
    [
      {
        "day": "Monday",
        "startTime": "08:00",
        "endTime": "09:00",
        "subject": "Course Name Here",
        "lecturer": "Professor Name or Code"
      }
    ]

    Raw text to process:
    ${text}
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        const waitTime = 3000 * (i + 1); 
        console.warn(`⚠️ Gemini is temporarily busy (503). Retrying attempt ${i + 2}/${retries} in ${waitTime / 1000} seconds...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        subject,
        day,
        start_time AS startTime,
        end_time AS endTime,
        lecturer
      FROM timetable
      WHERE user_id = ?
      ORDER BY FIELD(day,
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ), start_time ASC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
};

exports.createLecture = async (req, res) => {
  try {
    const { subject, day, startTime, endTime, lecturer } = req.body;

    const [result] = await pool.query(
      `INSERT INTO timetable
      (user_id, subject, day, start_time, end_time, lecturer)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, subject, day, startTime, endTime, lecturer || null]
    );

    res.status(201).json({
      id: result.insertId,
      subject,
      day,
      startTime,
      endTime,
      lecturer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create lecture" });
  }
};

exports.deleteLecture = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM timetable
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete lecture" });
  }
};

// NEW: Delete ALL lectures for the logged-in user (Reset Timetable)
exports.clearFullTimetable = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM timetable WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({ 
      success: true, 
      message: "Current timetable completely erased from existence." 
    });
  } catch (err) {
    console.error("Error clearing full timetable: ", err);
    res.status(500).json({ message: "Failed to erase the timetable schedule." });
  }
};

exports.uploadTimetablePDF = async (req, res) => {
  try {
    const buffer = req.file.buffer;
    let textToParse = "";
    let cleanText = "";

    // HYBRID STEP 1: Safely attempt to pull digital text layer
    try {
      cleanText = await extractTextFromBuffer(buffer);
    } catch (parseError) {
      console.warn("⚠️ Digital parsing wrapper fallback triggered:", parseError.message);
    }
    
    // If text was successfully extracted, use it directly
    if (cleanText && cleanText.trim().length > 150) {
      console.log("🚀 Digital text layer detected! Skipping OCR processing step.");
      textToParse = cleanText;
    } else {
      // HYBRID STEP 2: Fall back to Tesseract OCR if it's an image scan
      console.log("📸 No readable text layer found. Falling back to OCR processing pipeline...");
      
      const images = await convertPDFToImages(buffer);
      for (const img of images) {
        const text = await runOCR(img);
        textToParse += "\n" + text;
      }

      // Clean up temporary files
      for (const img of images) {
        if (fs.existsSync(img)) fs.unlinkSync(img);
      }
    }

    console.log("FINAL TEXT SENT TO GEMINI:\n", textToParse);

    // 3. Process the resolved text layout through Gemini
    const parsed = await parseTimetableWithAI(textToParse);

    // 4. Save structured results to MySQL
    for (const item of parsed) {
      await pool.query(
        `INSERT INTO timetable
        (user_id, subject, day, start_time, end_time, lecturer)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          item.subject,
          item.day,
          item.startTime,
          item.endTime,
          item.lecturer || null
        ]
      );
    }

    res.json({
      success: true,
      inserted: parsed.length,
      data: parsed
    });

  } catch (err) {
    console.error("AI Upload Controller Error: ", err);
    res.status(500).json({ message: "Upload and AI parsing failed" });
  }
};