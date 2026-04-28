const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

// Load environment variables
dotenv.config();

// Import models
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

// Sample data
const users = [
  {
    name: "Admin User",
    email: "admin@campus.edu",
    password: "admin123",
    role: "admin",
    department: "csit",
    interests: ["tech", "academic"],
  },
  {
    name: "John Doe",
    email: "john@campus.edu",
    password: "password123",
    studentId: "STU001",
    phone: "1234567890",
    department: "csit",
    interests: ["tech", "career"],
  },
  {
    name: "Jane Smith",
    email: "jane@campus.edu",
    password: "password123",
    studentId: "STU002",
    phone: "0987654321",
    department: "business",
    interests: ["career", "social"],
  },
];

const events = [
  {
    title: "AI & Machine Learning Workshop",
    category: "tech",
    department: "csit",
    difficulty: "intermediate",
    date: new Date("2026-06-15"),
    time: "2:00 PM",
    location: "Computer Science Lab Alpha",
    description:
      "Learn AI fundamentals and build your first ML model. Perfect for students looking to expand their knowledge in neural networks!",
    capacity: 30,
    registered: 15,
    rating: 4.8,
    ratingCount: 12,
    tags: ["ai", "machine-learning", "python", "workshop"],
    organizer: "Computer Science Department",
    price: "Free",
    image: "🤖",
    popularity: "trending",
  },
  {
    title: "Cultural Festival 2026",
    category: "social",
    department: "cultural",
    difficulty: "beginner",
    date: new Date("2026-07-20"),
    time: "6:00 PM",
    location: "Main Auditorium",
    description:
      "Celebrate diversity with music, dance, and cuisine from around the world. Join us for an unforgettable evening!",
    capacity: 500,
    registered: 387,
    rating: 4.9,
    ratingCount: 245,
    tags: ["festival", "music", "dance", "cultural"],
    organizer: "Cultural Affairs Department",
    price: "$10",
    image: "🎭",
    popularity: "most-registered",
  },
  {
    title: "Basketball Championship Finals",
    category: "sports",
    department: "sports",
    difficulty: "beginner",
    date: new Date("2026-06-25"),
    time: "7:00 PM",
    location: "Sports Arena",
    description:
      "Cheer for our college team in the championship finals! Free snacks and team merchandise for all students.",
    capacity: 800,
    registered: 654,
    rating: 4.7,
    ratingCount: 412,
    tags: ["basketball", "championship", "sports"],
    organizer: "Sports Department",
    price: "Free",
    image: "🏀",
    popularity: "trending",
  },
  {
    title: "Tech Career Expo",
    category: "career",
    department: "csit",
    difficulty: "beginner",
    date: new Date("2026-08-10"),
    time: "10:00 AM",
    location: "Convention Center",
    description:
      "Meet recruiters from top tech companies including Google, Microsoft, Apple and 50+ other companies. Bring multiple copies of your resume!",
    capacity: 1000,
    registered: 756,
    rating: 4.6,
    ratingCount: 523,
    tags: ["career", "tech", "networking", "jobs"],
    organizer: "Career Services",
    price: "Free",
    image: "💼",
    popularity: "most-registered",
  },
  {
    title: "Digital Art Exhibition",
    category: "arts",
    department: "cultural",
    difficulty: "beginner",
    date: new Date("2026-05-28"),
    time: "7:00 PM",
    location: "Art Gallery",
    description:
      "Showcase of stunning digital artwork by talented students. Interactive demos and artist meet-and-greets included.",
    capacity: 150,
    registered: 89,
    rating: 4.4,
    ratingCount: 67,
    tags: ["art", "digital", "exhibition"],
    organizer: "Arts Department",
    price: "Free",
    image: "🎨",
    popularity: "new",
  },
];

const seedDatabase = async () => {
  const force = process.argv.includes("--force");

  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/campus-events",
    );
    console.log("✅ Connected to MongoDB");

    // Only seed if database is empty — unless --force flag is passed
    const existingEvents = await Event.countDocuments();
    const existingUsers = await User.countDocuments();

    if ((existingEvents > 0 || existingUsers > 0) && !force) {
      console.log(
        `ℹ️  Database already has ${existingUsers} users and ${existingEvents} events. Skipping seed to protect existing data.`,
      );
      console.log(
        "💡 To force reseed, run: node backend/scripts/seedDatabase.js --force",
      );
      await mongoose.disconnect();
      return;
    }

    if (force) {
      await User.deleteMany({});
      await Event.deleteMany({});
      await Registration.deleteMany({});
      console.log("🗑️  Cleared existing data (--force)");
    } else {
      console.log("🌱 Database is empty, seeding now...");
    }

    // Create users one by one so the pre-save password hashing hook runs
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create events
    const createdEvents = await Event.insertMany(events);
    console.log(`🎉 Created ${createdEvents.length} events`);

    // Create sample registrations
    const sampleRegistrations = [
      {
        event: createdEvents[0]._id,
        user: createdUsers[1]._id,
        fullName: createdUsers[1].name,
        email: createdUsers[1].email,
        phoneNumber: createdUsers[1].phone,
        department: createdUsers[1].department,
        ticketId: Registration.generateTicketId(),
        status: "confirmed",
      },
      {
        event: createdEvents[1]._id,
        user: createdUsers[2]._id,
        fullName: createdUsers[2].name,
        email: createdUsers[2].email,
        phoneNumber: createdUsers[2].phone,
        department: createdUsers[2].department,
        ticketId: Registration.generateTicketId(),
        status: "confirmed",
      },
    ];

    await Registration.insertMany(sampleRegistrations);
    console.log(
      `📝 Created ${sampleRegistrations.length} sample registrations`,
    );

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("Admin: admin@campus.edu / admin123");
    console.log("Student: john@campus.edu / password123");
    console.log("Student: jane@campus.edu / password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
