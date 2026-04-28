const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const { body } = require("express-validator");

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Event validation
const validateEvent = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title too long"),
  body("category")
    .isIn(["tech", "social", "sports", "career", "arts", "academic"])
    .withMessage("Invalid category"),
  body("department")
    .isIn(["csit", "mechanical", "cultural", "sports", "business"])
    .withMessage("Invalid department"),
  body("difficulty")
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty"),
  body("date").isISO8601().withMessage("Invalid date format"),
  body("time").notEmpty().withMessage("Time is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 1000 })
    .withMessage("Description too long"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("organizer").trim().notEmpty().withMessage("Organizer is required"),
];

// Event management routes
router.get("/events", adminController.getAllEvents);
router.post("/events", validateEvent, adminController.createEvent);
router.put(
  "/events/:id",
  validateObjectId(),
  validateEvent,
  adminController.updateEvent,
);
router.delete("/events/:id", validateObjectId(), adminController.deleteEvent);
router.get(
  "/events/:id/participants",
  validateObjectId(),
  adminController.getParticipants,
);

// User management routes
router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", validateObjectId(), adminController.deleteUser);
router.put(
  "/users/:id",
  validateObjectId(),
  [
    body("role")
      .isIn(["student", "admin", "organizer"])
      .withMessage("Invalid role"),
  ],
  adminController.changeUserRole,
);

// Registration management routes
router.get("/registrations", adminController.getAllRegistrations);
router.put(
  "/registrations/:id/cancel",
  validateObjectId(),
  adminController.cancelRegistration,
);
router.get("/registrations/export", adminController.exportRegistrations);

// Statistics route
router.get("/stats", adminController.getStats);

module.exports = router;
