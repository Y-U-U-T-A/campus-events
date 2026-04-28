const express = require("express");
const router = express.Router();
const Registration = require("../backend/models/Registration");
const Event = require("../backend/models/Event");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../backend/models/User");

// Local auth middleware (optional - doesn't block if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret_key",
      );
      req.user = await User.findById(decoded.id);
    }
  } catch (e) {
    /* ignore */
  }
  next();
};

// Auth middleware (required)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_key",
    );
    req.user = await User.findById(decoded.id);
    if (!req.user)
      return res.status(401).json({ success: false, message: "Invalid token" });
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Validation middleware - matches Registration model fields
const validateRegistration = [
  body("eventId").notEmpty().withMessage("Event ID is required"),
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2–100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters and spaces"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("phoneNumber")
    .optional({ checkFalsy: true })
    .matches(/^\d{7,15}$/)
    .withMessage("Phone must contain only digits (7–15 digits)"),
  body("department")
    .optional()
    .isIn([
      "csit",
      "mechanical",
      "business",
      "arts",
      "cultural",
      "sports",
      "other",
    ])
    .withMessage("Invalid department"),
];

// POST /api/registrations - Register for an event
router.post("/", validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    console.log("Registration request body:", req.body);

    const {
      eventId,
      fullName,
      email,
      phoneNumber,
      department,
      specialRequests,
      userId,
    } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event is full
    if (event.registered >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: "Event is full",
      });
    }

    // Check if user already registered (if userId provided)
    if (userId) {
      const existingRegistration = await Registration.findOne({
        event: eventId,
        user: userId,
      });

      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message: "You are already registered for this event",
        });
      }
    }

    // Generate unique ticket ID
    let ticketId;
    let isUnique = false;
    while (!isUnique) {
      ticketId = Registration.generateTicketId();
      const existing = await Registration.findOne({ ticketId });
      if (!existing) isUnique = true;
    }

    // Create registration
    const registration = new Registration({
      event: eventId,
      user: userId || null,
      fullName,
      email,
      phoneNumber,
      department,
      specialRequests,
      ticketId,
    });

    await registration.save();

    // Increment event registered count
    await event.incrementRegistered();

    // Populate event details
    await registration.populate("event");

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        registration,
        ticketId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering for event",
      error: error.message,
    });
  }
});

// GET /api/registrations - Get all registrations (with auth)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate("event")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registrations",
      error: error.message,
    });
  }
});

// GET /api/registrations/ticket/:ticketId - Get registration by ticket ID
router.get("/ticket/:ticketId", async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
    }).populate("event");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registration",
      error: error.message,
    });
  }
});

// GET /api/registrations/:id - Get single registration
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate(
      "event",
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check if user owns this registration
    if (registration.user && !registration.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registration",
      error: error.message,
    });
  }
});

// PUT /api/registrations/:id/cancel - Cancel registration
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check if user owns this registration
    if (registration.user && !registration.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if already cancelled
    if (registration.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Registration already cancelled",
      });
    }

    await registration.cancel();

    // Decrement event registered count
    const event = await Event.findById(registration.event);
    if (event && event.registered > 0) {
      event.registered -= 1;
      await event.save();
    }

    res.json({
      success: true,
      message: "Registration cancelled successfully",
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling registration",
      error: error.message,
    });
  }
});

// POST /api/registrations/:id/checkin - Check in to event
router.post("/:id/checkin", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot check in - registration is cancelled",
      });
    }

    if (registration.status === "attended") {
      return res.status(400).json({
        success: false,
        message: "Already checked in",
      });
    }

    await registration.checkIn();

    res.json({
      success: true,
      message: "Checked in successfully",
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking in",
      error: error.message,
    });
  }
});

// POST /api/registrations/:id/feedback - Add feedback
router.post(
  "/:id/feedback",
  [
    authMiddleware,
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("feedback").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const registration = await Registration.findById(req.params.id);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Check if user owns this registration
      if (registration.user && !registration.user.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const { rating, feedback } = req.body;
      await registration.addFeedback(rating, feedback);

      // Update event rating
      const event = await Event.findById(registration.event);
      if (event) {
        await event.addRating(rating);
      }

      res.json({
        success: true,
        message: "Feedback added successfully",
        data: registration,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding feedback",
        error: error.message,
      });
    }
  },
);

// GET /api/registrations/event/:eventId - Get all registrations for an event
router.get("/event/:eventId", async (req, res) => {
  try {
    const registrations = await Registration.find({
      event: req.params.eventId,
      status: { $ne: "cancelled" },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registrations",
      error: error.message,
    });
  }
});

module.exports = router;
