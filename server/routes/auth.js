const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Rate limiter — max 3 attempts per 3 hours per IP
const authLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many attempts. Please try again after 3 hours." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

module.exports = router;