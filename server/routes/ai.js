const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const { generateQuiz, generateFlashcards, generateStudyPlan, chatMessage } = require("../controllers/aiController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("PDF only"));
  },
});

router.post("/quiz",       verifyToken, upload.single("pdf"), generateQuiz);
router.post("/flashcards", verifyToken, upload.single("pdf"), generateFlashcards);
router.post("/study-plan", verifyToken, generateStudyPlan);
router.post("/chat",       verifyToken, chatMessage);

module.exports = router;