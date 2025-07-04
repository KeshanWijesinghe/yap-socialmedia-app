const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getCurrentUser,
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({
    status: "success",
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Debug route to check users
router.get("/debug/users", async (req, res) => {
  try {
    const User = require("../models/User");
    const users = await User.find({}, "name email username").limit(5);
    res.json({
      status: "success",
      users: users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Register validation rules
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

// Login validation rules
const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginValidation, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, getCurrentUser);

module.exports = router;
