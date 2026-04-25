const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["student", "admin", "organizer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message,
    });
  }
};

// @desc    Get all events (admin)
// @route   GET /api/admin/events
// @access  Private/Admin
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;

    let query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    const events = await Event.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching events",
      error: error.message,
    });
  }
};

// @desc    Create event (admin)
// @route   POST /api/admin/events
// @access  Private/Admin
exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res
      .status(201)
      .json({ success: true, message: "Event created", data: event });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating event",
        error: error.message,
      });
  }
};

// @desc    Update event (admin)
// @route   PUT /api/admin/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Event updated", data: event });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error updating event",
        error: error.message,
      });
  }
};

// @desc    Delete event (admin)
// @route   DELETE /api/admin/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting event",
        error: error.message,
      });
  }
};

// @desc    Get participants of an event
// @route   GET /api/admin/events/:id/participants
// @access  Private/Admin
exports.getParticipants = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching participants",
        error: error.message,
      });
  }
};

// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalEvents = await Event.countDocuments({ isActive: true });
    const totalRegistrations = await Registration.countDocuments({
      status: "confirmed",
    });

    // Most popular events
    const popularEvents = await Event.find({ isActive: true })
      .sort({ registered: -1 })
      .limit(5)
      .select("title registered capacity category");

    // Recent registrations
    const recentRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("event", "title date")
      .populate("user", "name email");

    // Category distribution
    const categoryStats = await Event.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Monthly registrations
    const monthlyRegistrations = await Registration.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalEvents,
          totalRegistrations,
          averageRegistrationsPerEvent:
            totalEvents > 0 ? (totalRegistrations / totalEvents).toFixed(2) : 0,
        },
        popularEvents,
        recentRegistrations,
        categoryStats,
        monthlyRegistrations,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// @desc    Get all registrations
// @route   GET /api/admin/registrations
// @access  Private/Admin
exports.getAllRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, status } = req.query;

    let query = {};

    if (eventId) {
      query.event = eventId;
    }

    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .populate("event", "title date location")
      .populate("user", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Registration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registrations",
      error: error.message,
    });
  }
};

// @desc    Cancel registration (admin)
// @route   PUT /api/admin/registrations/:id/cancel
// @access  Private/Admin
exports.cancelRegistration = async (req, res) => {
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
};

// @desc    Export registrations
// @route   GET /api/admin/registrations/export
// @access  Private/Admin
exports.exportRegistrations = async (req, res) => {
  try {
    const { eventId } = req.query;

    let query = {};
    if (eventId) {
      query.event = eventId;
    }

    const registrations = await Registration.find(query)
      .populate("event", "title date location")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    // Format data for export
    const exportData = registrations.map((reg) => ({
      ticketId: reg.ticketId,
      fullName: reg.fullName,
      email: reg.email,
      phoneNumber: reg.phoneNumber || "N/A",
      department: reg.department || "N/A",
      eventTitle: reg.event?.title || "N/A",
      eventDate: reg.event?.date || "N/A",
      registrationDate: reg.createdAt,
      status: reg.status,
    }));

    res.json({
      success: true,
      data: exportData,
      count: exportData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting registrations",
      error: error.message,
    });
  }
};
