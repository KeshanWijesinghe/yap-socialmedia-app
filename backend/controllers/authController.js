const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register User
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message:
          existingUser.email === email
            ? "User already exists with this email"
            : "Username is already taken",
      });
    }

    // Create new user
    const user = new User({
      name,
      username,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error details:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      status: "error",
      message: "Server error during registration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user exists (allow login with email or username)
    const user = await User.findOne({
      $or: [{ email }, { username: email }],
    });
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      status: "success",
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      status: "error",
      message: "Server error during login",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
