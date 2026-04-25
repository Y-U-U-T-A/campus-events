const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Event management routes
router.get("/events", adminController.getAllEvents);
router.post("/events", adminController.createEvent);
router.put("/events/:id", adminController.updateEvent);
router.delete("/events/:id", adminController.deleteEvent);
router.get("/events/:id/participants", adminController.getParticipants);

// User management routes
router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);
router.put("/users/:id", adminController.changeUserRole);

// Registration management routes
router.get("/registrations", adminController.getAllRegistrations);
router.put("/registrations/:id/cancel", adminController.cancelRegistration);
router.get("/registrations/export", adminController.exportRegistrations);

// Statistics route
router.get("/stats", adminController.getStats);

module.exports = router;
