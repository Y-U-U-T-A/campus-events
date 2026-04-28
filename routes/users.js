const express = require("express");
const router = express.Router();
const User = require("../backend/models/User");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// Validation middleware
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2–100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters and spaces"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .matches(/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/)
    .withMessage("Please enter a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^\d{7,15}$/)
    .withMessage("Phone must contain only digits (7–15 digits)"),
  body("department")
    .optional()
    .isIn(["csit", "mechanical", "cultural", "sports", "business", "other"])
    .withMessage("Invalid department"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "default_secret_key",
    { expiresIn: "7d" },
  );
};

// POST /api/users/register - Register new user
router.post("/register", validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, password, studentId, phone, department, interests } =
      req.body;

    // Extra server-side checks
    if (phone && !/^\d{7,15}$/.test(phone)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Phone must contain only digits (7–15 digits)",
        });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must contain at least one letter and one number",
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      studentId,
      phone,
      department,
      interests: interests || [],
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          interests: user.interests,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

// POST /api/users/login - Login user
router.post("/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          interests: user.interests,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

// Middleware to verify token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_key",
    );
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};

// GET /api/users/profile - Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("savedEvents")
      .populate("reminders");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, department, interests } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, department, interests },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

// POST /api/users/save-event/:eventId - Save event
router.post("/save-event/:eventId", authMiddleware, async (req, res) => {
  try {
    await req.user.saveEvent(req.params.eventId);

    res.json({
      success: true,
      message: "Event saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving event",
      error: error.message,
    });
  }
});

// DELETE /api/users/save-event/:eventId - Unsave event
router.delete("/save-event/:eventId", authMiddleware, async (req, res) => {
  try {
    await req.user.unsaveEvent(req.params.eventId);

    res.json({
      success: true,
      message: "Event unsaved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unsaving event",
      error: error.message,
    });
  }
});

// POST /api/users/reminder/:eventId - Add reminder
router.post("/reminder/:eventId", authMiddleware, async (req, res) => {
  try {
    await req.user.addReminder(req.params.eventId);

    res.json({
      success: true,
      message: "Reminder added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding reminder",
      error: error.message,
    });
  }
});

// DELETE /api/users/reminder/:eventId - Remove reminder
router.delete("/reminder/:eventId", authMiddleware, async (req, res) => {
  try {
    await req.user.removeReminder(req.params.eventId);

    res.json({
      success: true,
      message: "Reminder removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing reminder",
      error: error.message,
    });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
