const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const authMiddleware = require("../middleware/authMiddleware");
const timetableController = require("../controllers/timetableController");

router.get("/", authMiddleware, timetableController.getTimetable);

router.post("/", authMiddleware, timetableController.createLecture);

// NEW: Clear the entire timetable for the current user
// (Must be placed ABOVE the /:id route so Express doesn't mistake "clear-all" for an ID)
router.delete("/clear-all", authMiddleware, timetableController.clearFullTimetable);

router.delete("/:id", authMiddleware, timetableController.deleteLecture);

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  timetableController.uploadTimetablePDF
);

module.exports = router;