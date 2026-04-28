const express = require("express");
const router = express.Router();
const Event = require("../backend/models/Event");
const { body, validationResult, query } = require("express-validator");
const { validateObjectId } = require("../backend/middleware/validate");

// Validation middleware
const validateEvent = [
  body("title").trim().notEmpty().withMessage("Title is required"),
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
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("organizer").trim().notEmpty().withMessage("Organizer is required"),
];

// GET /api/events - Get all events with filters
router.get(
  "/",
  [
    query("category")
      .optional()
      .isIn(["tech", "social", "sports", "career", "arts", "academic"]),
    query("department")
      .optional()
      .isIn(["csit", "mechanical", "cultural", "sports", "business"]),
    query("difficulty")
      .optional()
      .isIn(["beginner", "intermediate", "advanced"]),
    query("date").optional().isISO8601(),
    query("search").optional().trim(),
    query("sort")
      .optional()
      .isIn(["date", "popularity", "availability", "trending"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        category,
        department,
        difficulty,
        date,
        search,
        sort = "date",
      } = req.query;

      // Build query - show all active events (no future-only filter so seeded events always display)
      let query = { isActive: true };

      if (category) query.category = category;
      if (department) query.department = department;
      if (difficulty) query.difficulty = difficulty;
      if (date) {
        const searchDate = new Date(date);
        query.date = {
          $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59, 999)),
        };
      }
      if (search) {
        query.$text = { $search: search };
      }

      // Build sort
      let sortOption = {};
      switch (sort) {
        case "popularity":
          sortOption = { registered: -1 };
          break;
        case "availability":
          sortOption = { registered: 1 };
          break;
        case "trending":
          sortOption = { popularity: -1, registered: -1 };
          break;
        case "date":
        default:
          sortOption = { date: 1 };
      }

      const events = await Event.find(query).sort(sortOption);

      res.json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching events",
        error: error.message,
      });
    }
  },
);

// GET /api/events/trending - Get trending events
router.get("/trending", async (req, res) => {
  try {
    const events = await Event.getTrending();
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching trending events",
      error: error.message,
    });
  }
});

// GET /api/events/upcoming - Get upcoming events
router.get("/upcoming", async (req, res) => {
  try {
    const events = await Event.getUpcoming();
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching upcoming events",
      error: error.message,
    });
  }
});

// GET /api/events/:id - Get single event
router.get("/:id", validateObjectId(), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching event",
      error: error.message,
    });
  }
});

// POST /api/events - Create new event
router.post("/", validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const event = new Event(req.body);
    await event.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating event",
      error: error.message,
    });
  }
});

// PUT /api/events/:id - Update event
router.put("/:id", validateObjectId(), validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating event",
      error: error.message,
    });
  }
});

// DELETE /api/events/:id - Delete event (soft delete)
router.delete("/:id", validateObjectId(), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting event",
      error: error.message,
    });
  }
});

// POST /api/events/:id/rate - Rate an event
router.post(
  "/:id/rate",
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      await event.addRating(req.body.rating);

      res.json({
        success: true,
        message: "Rating added successfully",
        data: {
          rating: event.rating,
          ratingCount: event.ratingCount,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding rating",
        error: error.message,
      });
    }
  },
);

module.exports = router;
