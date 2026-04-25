// API Configuration - auto-detect backend URL
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : `${window.location.origin}/api`;

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  const config = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...(options.headers || {}) },
  };
  try {
    console.log(
      `API Call: ${options.method || "GET"} ${API_BASE_URL}${endpoint}`,
    );
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.message || `API request failed (${response.status})`,
      );
    }
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Events data
let mockEvents = [];

// User preferences and state
let userPreferences = {
  interests: JSON.parse(localStorage.getItem("userInterests") || "[]"),
  department: localStorage.getItem("userDepartment") || "",
  theme: localStorage.getItem("theme") || "space",
};

// Current user (from backend)
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
const authToken = localStorage.getItem("authToken");

// DOM elements
const eventsContainer = document.getElementById("eventsContainer");
const recommendedContainer = document.getElementById("recommendedEvents");
const calendarContainer = document.getElementById("calendarContainer");
const trendingContainer = document.getElementById("trendingEvents");

// Filters
const categoryFilter = document.getElementById("categoryFilter");
const departmentFilter = document.getElementById("departmentFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const dateFilter = document.getElementById("dateFilter");
const searchInput = document.getElementById("searchInput");
const navSearchInput = document.getElementById("navSearchInput");
const sortBy = document.getElementById("sortBy");
const clearFiltersBtn = document.getElementById("clearFilters");

// View toggles
const gridViewBtn = document.getElementById("gridViewBtn");
const calendarViewBtn = document.getElementById("calendarViewBtn");

// Navigation
const themeToggle = document.getElementById("themeToggle");
const loginBtn = document.getElementById("loginBtn");
const heroBrowseBtn = document.getElementById("heroBrowseBtn");

// Dashboard buttons
const viewMyEventsBtn = document.getElementById("viewMyEvents");
const viewSavedEventsBtn = document.getElementById("viewSavedEvents");
const viewRemindersBtn = document.getElementById("viewReminders");

// Skill constellation tags
const starSkills = document.querySelectorAll(".star-skill");

// Modals
const registrationModal = document.getElementById("registrationModal");
const ticketModal = document.getElementById("ticketModal");
const myEventsModal = document.getElementById("myEventsModal");
const eventDetailsModal = document.getElementById("eventDetailsModal");
const loginModal = document.getElementById("loginModal");

const registrationForm = document.getElementById("registrationForm");
const loginForm = document.getElementById("loginForm");

// State arrays
let filteredEvents = [...mockEvents];
let registeredEvents = JSON.parse(
  localStorage.getItem("registeredEvents") || "[]",
);
let savedEvents = JSON.parse(localStorage.getItem("savedEvents") || "[]");
let reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
let eventRatings = JSON.parse(localStorage.getItem("eventRatings") || "{}");

// Current view state
let currentView = "grid";

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  applyTheme();
  await loadEventsFromDatabase();
  updateHeroStats();
  updateDashboardStrip();
  displayEvents();
  displayRecommendations();
  displayTrendingEvents();
  updateDashboard();
  updateSkillConstellation();
  setupEventListeners();
  updateLoginStatus();
  if (localStorage.getItem("authToken")) {
    await loadUserData();
  }
}

// ─── DATABASE ────────────────────────────────────────────────────────────────

async function loadEventsFromDatabase() {
  try {
    showLoadingState();
    const response = await apiCall(`/events?_t=${Date.now()}`);
    if (response.success) {
      mockEvents = response.data.map((event) => ({
        ...event,
        id: event._id,
        date: event.date ? event.date.split("T")[0] : "",
        registered: event.registered || 0,
        capacity: event.capacity || 100,
      }));
      filteredEvents = [...mockEvents];
      console.log("✅ Loaded", mockEvents.length, "events from database");
    }
  } catch (error) {
    console.error("Error loading events:", error);
    showErrorMessage(
      "Failed to load events. Is the backend running on port 5000?",
    );
  } finally {
    hideLoadingState();
  }
}

async function loadUserData() {
  try {
    const response = await apiCall("/auth/me");
    if (response.success) {
      currentUser = response.data;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      if (currentUser.interests) {
        userPreferences.interests = currentUser.interests;
        localStorage.setItem(
          "userInterests",
          JSON.stringify(currentUser.interests),
        );
      }
      if (currentUser.department) {
        userPreferences.department = currentUser.department;
        localStorage.setItem("userDepartment", currentUser.department);
      }
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    currentUser = null;
  }
}

function showLoadingState() {
  if (!eventsContainer) return;
  eventsContainer.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:3rem;">
      <div style="font-size:3rem;animation:spin 1s linear infinite;">⏳</div>
      <p style="color:var(--text-secondary);margin-top:1rem;">Loading events...</p>
    </div>`;
}

function hideLoadingState() {
  /* replaced by displayEvents */
}

function showErrorMessage(message) {
  if (!eventsContainer) return;
  eventsContainer.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:3rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
      <h3 style="color:var(--text-primary);">${message}</h3>
      <button onclick="location.reload()" class="space-btn glow-btn" style="margin-top:1rem;">Retry</button>
    </div>`;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────

function setupEventListeners() {
  // Filters
  categoryFilter.addEventListener("change", filterEvents);
  departmentFilter.addEventListener("change", filterEvents);
  difficultyFilter.addEventListener("change", filterEvents);
  dateFilter.addEventListener("change", filterEvents);
  searchInput.addEventListener("input", filterEvents);
  navSearchInput.addEventListener("input", (e) => {
    searchInput.value = e.target.value;
    filterEvents();
  });
  sortBy.addEventListener("change", filterEvents);
  clearFiltersBtn.addEventListener("click", clearFilters);

  // View toggles
  gridViewBtn.addEventListener("click", () => switchView("grid"));
  calendarViewBtn.addEventListener("click", () => switchView("calendar"));

  // Navigation
  themeToggle.addEventListener("click", toggleTheme);
  loginBtn.addEventListener("click", openLoginModal);
  heroBrowseBtn.addEventListener("click", scrollToEvents);

  // Dashboard
  viewMyEventsBtn.addEventListener("click", () =>
    openMyEventsModal("registered"),
  );
  viewSavedEventsBtn.addEventListener("click", () =>
    openMyEventsModal("saved"),
  );
  viewRemindersBtn.addEventListener("click", () =>
    openMyEventsModal("reminders"),
  );

  // Skill constellation stars
  starSkills.forEach((star) => {
    star.addEventListener("click", () =>
      toggleSkillStar(star.dataset.interest),
    );
  });

  // Forms
  registrationForm.addEventListener("submit", handleRegistration);
  loginForm.addEventListener("submit", handleLogin);

  // Register form (auth modal)
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  // Modal close buttons
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", closeAllModals);
  });

  // Tab functionality
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-btn")) {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      displayMyEvents(e.target.dataset.tab);
    }
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  // Tag chip clicks
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("tag-chip")) {
      const tag = e.target.textContent.replace("#", "");
      searchInput.value = tag;
      filterEvents();
    }
  });
}

// ─── THEME ───────────────────────────────────────────────────────────────────

function applyTheme() {
  document.body.className = userPreferences.theme + "-theme";
  themeToggle.textContent =
    userPreferences.theme === "space" ? "🌙 Dark Mode" : "☀️ Light Mode";
}

function toggleTheme() {
  userPreferences.theme =
    userPreferences.theme === "space" ? "deep-space" : "space";
  localStorage.setItem("theme", userPreferences.theme);
  applyTheme();
}

// ─── STATS ───────────────────────────────────────────────────────────────────

function updateDashboardStrip() {
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const liveEvents = mockEvents.filter(
    (e) => new Date(e.date).toDateString() === today.toDateString(),
  ).length;
  const launchingSoon = mockEvents.filter((e) => {
    const d = new Date(e.date);
    return d >= today && d <= threeDaysFromNow;
  }).length;
  const popular = mockEvents.filter(
    (e) => e.popularity === "trending" || e.popularity === "most-registered",
  ).length;
  const matches = getSmartRecommendations().length;

  animateCounter("liveEventsCount", liveEvents);
  animateCounter("launchingSoonCount", launchingSoon);
  animateCounter("popularCount", popular);
  animateCounter("matchesCount", matches);
}

function updateHeroStats() {
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const eventsThisWeek = mockEvents.filter((e) => {
    const d = new Date(e.date);
    return d >= today && d <= weekFromNow;
  }).length;
  const totalStudents = mockEvents.reduce(
    (sum, e) => sum + (e.registered || 0),
    0,
  );
  const departments = [...new Set(mockEvents.map((e) => e.department))].length;

  animateCounter("heroEventsCount", eventsThisWeek);
  animateCounter("heroStudentsCount", totalStudents);
  animateCounter("heroDepartmentsCount", departments);
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  let currentValue = 0;
  const increment = targetValue / 50;
  const timer = setInterval(() => {
    currentValue += increment;
    if (currentValue >= targetValue) {
      currentValue = targetValue;
      clearInterval(timer);
    }
    element.textContent = Math.floor(currentValue);
  }, 30);
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function updateDashboard() {
  const el = (id) => document.getElementById(id);
  if (el("registeredCount"))
    el("registeredCount").textContent = registeredEvents.length;
  if (el("savedCount")) el("savedCount").textContent = savedEvents.length;
  if (el("remindersCount")) el("remindersCount").textContent = reminders.length;
}

// ─── SKILL CONSTELLATION ─────────────────────────────────────────────────────

function updateSkillConstellation() {
  starSkills.forEach((star) => {
    if (userPreferences.interests.includes(star.dataset.interest)) {
      star.classList.add("active");
    }
  });
}

function toggleSkillStar(interest) {
  const index = userPreferences.interests.indexOf(interest);
  if (index > -1) {
    userPreferences.interests.splice(index, 1);
  } else {
    userPreferences.interests.push(interest);
  }
  localStorage.setItem(
    "userInterests",
    JSON.stringify(userPreferences.interests),
  );
  updateSkillConstellation();
  displayRecommendations();
  updateDashboardStrip();
}

// ─── TRENDING EVENTS ─────────────────────────────────────────────────────────

function displayTrendingEvents() {
  if (!trendingContainer) return;
  const trendingEvents = mockEvents
    .filter((e) => e.popularity === "trending")
    .slice(0, 5);
  trendingContainer.innerHTML = "";
  trendingEvents.forEach((event) => {
    const card = createTrendingEventCard(event);
    trendingContainer.appendChild(card);
  });
}

function createTrendingEventCard(event) {
  const card = document.createElement("div");
  card.className = "event-card trending-card";
  card.style.minWidth = "300px";
  const spotsLeft = event.capacity - event.registered;
  const availabilityPercentage =
    ((event.capacity - event.registered) / event.capacity) * 100;
  card.innerHTML = `
    <div class="event-image" style="background:${getCategoryGradient(event.category)};height:150px;">
      ${event.image}
      <div class="event-badges"><div class="badge trending">🔥 Supernova</div></div>
    </div>
    <div class="event-content" style="padding:1rem;">
      <div class="event-title" style="font-size:1.1rem;margin-bottom:0.5rem;">${event.title}</div>
      <div class="countdown-timer" style="margin-bottom:0.5rem;">${getCountdown(event.date, event.time)}</div>
      <div class="seats-indicator">
        <div class="seats-bar"><div class="seats-fill" style="width:${100 - availabilityPercentage}%"></div></div>
        <div class="seats-text">${spotsLeft} spots left</div>
      </div>
      <button class="register-btn" onclick="openRegistrationModal('${event.id || event._id}')" style="padding:0.5rem;font-size:0.9rem;">🚀 Register Now</button>
    </div>`;
  return card;
}

// ─── VIEW SWITCHING ──────────────────────────────────────────────────────────

function switchView(view) {
  currentView = view;
  if (view === "grid") {
    eventsContainer.style.display = "grid";
    calendarContainer.style.display = "none";
    gridViewBtn.classList.add("active");
    calendarViewBtn.classList.remove("active");
    displayEvents();
  } else {
    eventsContainer.style.display = "none";
    calendarContainer.style.display = "block";
    calendarViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
    displayCalendarView();
  }
}

function scrollToEvents() {
  document
    .querySelector(".event-galaxies")
    ?.scrollIntoView({ behavior: "smooth" });
}

// ─── FILTER & DISPLAY ────────────────────────────────────────────────────────

function filterEvents() {
  const selectedCategory = categoryFilter.value;
  const selectedDepartment = departmentFilter.value;
  const selectedDifficulty = difficultyFilter.value;
  const selectedDate = dateFilter.value;
  const searchTerm = searchInput.value.toLowerCase();
  const sortOption = sortBy.value;

  filteredEvents = mockEvents.filter((event) => {
    const categoryMatch =
      !selectedCategory || event.category === selectedCategory;
    const departmentMatch =
      !selectedDepartment || event.department === selectedDepartment;
    const difficultyMatch =
      !selectedDifficulty || event.difficulty === selectedDifficulty;
    const dateMatch = !selectedDate || event.date === selectedDate;
    const searchMatch =
      !searchTerm ||
      (event.title || "").toLowerCase().includes(searchTerm) ||
      (event.description || "").toLowerCase().includes(searchTerm) ||
      (event.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchTerm),
      ) ||
      (event.organizer || "").toLowerCase().includes(searchTerm);
    return (
      categoryMatch &&
      departmentMatch &&
      difficultyMatch &&
      dateMatch &&
      searchMatch
    );
  });

  filteredEvents.sort((a, b) => {
    switch (sortOption) {
      case "popularity":
        return b.registered - a.registered;
      case "availability":
        return b.capacity - b.registered - (a.capacity - a.registered);
      case "trending": {
        const order = { trending: 3, "most-registered": 2, new: 1 };
        return (order[b.popularity] || 0) - (order[a.popularity] || 0);
      }
      default:
        return new Date(a.date) - new Date(b.date);
    }
  });

  if (currentView === "grid") displayEvents();
  else displayCalendarView();
}

function clearFilters() {
  categoryFilter.value = "";
  departmentFilter.value = "";
  difficultyFilter.value = "";
  dateFilter.value = "";
  searchInput.value = "";
  navSearchInput.value = "";
  sortBy.value = "date";
  filteredEvents = [...mockEvents];
  if (currentView === "grid") displayEvents();
  else displayCalendarView();
}

function displayEvents() {
  if (!eventsContainer) return;
  eventsContainer.innerHTML = "";
  if (filteredEvents.length === 0) {
    eventsContainer.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary);">
        <div style="font-size:3rem;margin-bottom:1rem;">🌌</div>
        <h3>No events found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>`;
    return;
  }
  filteredEvents.forEach((event) => {
    eventsContainer.appendChild(createEventCard(event));
  });
}

function displayCalendarView() {
  const eventsByMonth = groupEventsByMonth(filteredEvents);
  calendarContainer.innerHTML = "";
  Object.keys(eventsByMonth).forEach((month) => {
    const monthSection = document.createElement("div");
    monthSection.className = "calendar-month";
    monthSection.innerHTML = `
      <h3>🌌 ${month} Events</h3>
      <div class="calendar-events">
        ${eventsByMonth[month]
          .map(
            (event) => `
          <div class="calendar-day-group">
            <div class="calendar-day-header">🚀 ${formatDate(event.date)} at ${event.time}</div>
            <div class="calendar-event-item" onclick="openEventDetails('${event.id || event._id}')">
              <strong>${event.title}</strong>
              <p>📍 ${event.location} • 🏢 ${event.organizer}</p>
              <small>⭐ ${event.capacity - event.registered} spots available</small>
            </div>
          </div>`,
          )
          .join("")}
      </div>`;
    calendarContainer.appendChild(monthSection);
  });
}

function groupEventsByMonth(events) {
  const grouped = {};
  events.forEach((event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    if (!grouped[monthYear]) grouped[monthYear] = [];
    grouped[monthYear].push(event);
  });
  return grouped;
}

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────

function displayRecommendations() {
  if (!recommendedContainer) return;
  const recommendations = getSmartRecommendations();
  recommendedContainer.innerHTML = "";
  if (recommendations.length === 0) {
    recommendedContainer.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-secondary);">
        <div style="font-size:3rem;margin-bottom:1rem;">⭐</div>
        <p>Select your interests above to discover events tailored for you! 🌟</p>
      </div>`;
    return;
  }
  recommendations.forEach((event) => {
    recommendedContainer.appendChild(createEventCard(event, true));
  });
}

function getSmartRecommendations() {
  if (userPreferences.interests.length === 0) return [];
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  return mockEvents
    .map((event) => {
      let score = 0;
      const eventDate = new Date(event.date);
      const matchesInterest = userPreferences.interests.some((interest) => {
        const i = interest.toLowerCase();
        const c = (event.category || "").toLowerCase();
        const t = (event.tags || []).map((tag) => tag.toLowerCase());
        if (c === i || t.includes(i)) return true;
        if (
          i === "tech" &&
          (c === "csit" || t.includes("ai") || t.includes("coding"))
        )
          return true;
        if (i === "arts" && (c === "cultural" || t.includes("art")))
          return true;
        if (
          i === "social" &&
          (c === "cultural" ||
            t.includes("networking") ||
            t.includes("festival"))
        )
          return true;
        if (i === "academic" && (c === "csit" || t.includes("workshop")))
          return true;
        return false;
      });
      if (matchesInterest) score += 50;
      if (currentUser && event.department === currentUser.department)
        score += 3;
      if (event.popularity === "trending") score += 2;
      if (eventDate >= today && eventDate <= nextWeek) score += 2;
      if ((event.capacity - event.registered) / event.capacity > 0.3)
        score += 1;
      if (event.rating >= 4.5) score += 1;
      return { ...event, recommendationScore: score };
    })
    .filter((e) => e.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 4);
}

// ─── EVENT CARD ──────────────────────────────────────────────────────────────

function createEventCard(event, isRecommended = false) {
  const card = document.createElement("div");
  card.className = `event-card ${isRecommended ? "recommended" : ""}`;
  const eventId = event.id || event._id;
  const isRegistered = registeredEvents.includes(eventId);
  const isSaved = savedEvents.includes(eventId);
  const hasReminder = reminders.includes(eventId);
  const spotsLeft = event.capacity - event.registered;
  const isFull = spotsLeft <= 0;
  const availabilityPercentage =
    ((event.capacity - event.registered) / event.capacity) * 100;

  card.innerHTML = `
    <div class="event-image" style="background:${getCategoryGradient(event.category)}">
      ${event.image || "🎉"}
      <div class="event-badges">
        <div>
          <div class="badge category">${(event.category || "").charAt(0).toUpperCase() + (event.category || "").slice(1)}</div>
          ${getDifficultyBadge(event.difficulty)}
        </div>
        <div>${getPopularityBadge(event)}</div>
      </div>
    </div>
    <div class="event-content">
      <div class="event-header">
        <div class="event-title">${event.title}</div>
        <button class="save-btn ${isSaved ? "saved" : ""}" onclick="toggleSave('${eventId}')">${isSaved ? "❤️" : "🤍"}</button>
      </div>
      <div class="countdown-timer">${getCountdown(event.date, event.time)}</div>
      <div class="event-details">
        <div class="event-detail"><strong>📅</strong> ${formatDate(event.date)}</div>
        <div class="event-detail"><strong>🕐</strong> ${event.time}</div>
        <div class="event-detail"><strong>📍</strong> ${event.location}</div>
        <div class="event-detail"><strong>🏢</strong> ${event.organizer}</div>
        <div class="event-detail"><strong>💰</strong> ${event.price || "Free"}</div>
        <div class="event-detail"><strong>⭐</strong> ${event.rating || 0}/5</div>
      </div>
      <div class="seats-indicator">
        <div class="seats-bar"><div class="seats-fill" style="width:${100 - availabilityPercentage}%"></div></div>
        <div class="seats-text">${spotsLeft} of ${event.capacity} spots available</div>
      </div>
      <p style="margin-bottom:1rem;color:var(--text-secondary);font-size:0.9rem;line-height:1.5;">${event.description || ""}</p>
      <div class="event-tags">
        ${(event.tags || []).map((tag) => `<span class="tag-chip">#${tag}</span>`).join("")}
      </div>
      <div class="event-actions">
        <button class="action-btn remind-btn ${hasReminder ? "reminded" : ""}" onclick="toggleReminder('${eventId}')">
          ${hasReminder ? "🔔 Reminded" : "🔔 Remind Me"}
        </button>
        <button class="action-btn details-btn" onclick="openEventDetails('${eventId}')">📋 Details</button>
        <button class="action-btn share-btn" onclick="shareEvent('${eventId}')">📤 Share</button>
      </div>
      <button class="register-btn" onclick="openRegistrationModal('${eventId}')"
        ${isRegistered ? "disabled" : ""} ${isFull ? "disabled" : ""}>
        ${isRegistered ? "✅ Registered" : isFull ? "❌ Full" : "📝 Register Now"}
      </button>
    </div>`;
  return card;
}

// ─── CARD HELPERS ────────────────────────────────────────────────────────────

function getCategoryGradient(category) {
  const gradients = {
    tech: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
    social: "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
    sports: "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
    career: "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
    arts: "linear-gradient(135deg,#fa709a 0%,#fee140 100%)",
    academic: "linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)",
  };
  return (
    gradients[category] || "linear-gradient(135deg,#667eea 0%,#764ba2 100%)"
  );
}

function getPopularityBadge(event) {
  switch (event.popularity) {
    case "trending":
      return '<div class="badge popularity trending">🔥 Trending</div>';
    case "most-registered":
      return '<div class="badge popularity">⭐ Popular</div>';
    case "new":
      return '<div class="badge new">🆕 New</div>';
    default:
      return "";
  }
}

function getDifficultyBadge(difficulty) {
  const badges = {
    beginner: '<div class="badge difficulty beginner">🟢 Beginner</div>',
    intermediate:
      '<div class="badge difficulty intermediate">🟡 Intermediate</div>',
    advanced: '<div class="badge difficulty advanced">🔴 Advanced</div>',
  };
  return badges[difficulty] || "";
}

function getCountdown(date, time) {
  if (!date || !time) return "";
  const dateParts = date.split("-");
  const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts || dateParts.length < 3) return "";

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const period = timeParts[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  else if (period === "AM" && hours === 12) hours = 0;

  const eventDateTime = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    hours,
    minutes,
  );
  const diff = eventDateTime - new Date();
  if (diff < 0) return "Event has passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  if (days > 0) return `Starts in: ${days} days ${hoursLeft} hours`;
  if (hoursLeft > 0) return `Starts in: ${hoursLeft} hours`;
  return `Starts in: ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))} minutes`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── MODALS ──────────────────────────────────────────────────────────────────

function openModal(modal) {
  modal.style.display = "flex";
  modal.classList.add("active");
  document.body.classList.add("modal-open");
  const firstInput = modal.querySelector("input, textarea, select, button");
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeAllModals() {
  [
    registrationModal,
    ticketModal,
    myEventsModal,
    eventDetailsModal,
    loginModal,
  ].forEach((m) => {
    if (m) {
      m.style.display = "none";
      m.classList.remove("active");
    }
  });
  document.body.classList.remove("modal-open");
  if (registrationForm) registrationForm.reset();
  if (loginForm) loginForm.reset();
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.reset();
  // Reset auth tabs back to login
  switchAuthTab("login");
}

function openRegistrationModal(eventId) {
  // Find event by id or _id
  const event = mockEvents.find(
    (e) => (e.id || e._id) === eventId || e._id === eventId || e.id === eventId,
  );
  if (!event) {
    console.error("Event not found for id:", eventId);
    return;
  }
  const modalDetails = document.getElementById("modalEventDetails");
  if (modalDetails) {
    modalDetails.innerHTML = `
      <div style="text-align:center;margin-bottom:1.5rem;">
        <div style="font-size:3rem;margin-bottom:0.5rem;">${event.image || "🎉"}</div>
        <h3 style="color:var(--neon-cyan,#00d4ff);margin-bottom:0.5rem;">${event.title}</h3>
        <p><strong>📅 ${formatDate(event.date)} at ${event.time}</strong></p>
        <p><strong>📍 ${event.location}</strong></p>
        <p><strong>💰 ${event.price || "Free"}</strong></p>
      </div>`;
  }
  registrationForm.dataset.eventId = eventId;
  openModal(registrationModal);
}

function openLoginModal() {
  openModal(loginModal);
}

function openMyEventsModal(tab = "registered") {
  openModal(myEventsModal);
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.tab === tab) btn.classList.add("active");
  });
  displayMyEvents(tab);
}

function displayMyEvents(tab) {
  const content = document.getElementById("myEventsContent");
  if (!content) return;
  let events = [];
  let emptyMessage = "";
  switch (tab) {
    case "registered":
      events = mockEvents.filter((e) =>
        registeredEvents.includes(e.id || e._id),
      );
      emptyMessage =
        "No registered events yet. Start exploring events above! 🎯";
      break;
    case "saved":
      events = mockEvents.filter((e) => savedEvents.includes(e.id || e._id));
      emptyMessage =
        "No saved events yet. Click the ❤️ button on events you like! 💝";
      break;
    case "reminders":
      events = mockEvents.filter((e) => reminders.includes(e.id || e._id));
      emptyMessage = "No reminders set. Click 🔔 Remind Me on events! ⏰";
      break;
  }
  if (events.length === 0) {
    content.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-secondary);">
        <h3>No ${tab} events</h3><p>${emptyMessage}</p>
      </div>`;
    return;
  }
  content.innerHTML =
    '<div class="events-grid">' +
    events.map((e) => createEventCard(e).outerHTML).join("") +
    "</div>";
}

function openEventDetails(eventId) {
  const event = mockEvents.find(
    (e) => (e.id || e._id) === eventId || e._id === eventId || e.id === eventId,
  );
  if (!event) return;
  const content = document.getElementById("eventDetailsContent");
  if (!content) return;
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:2rem;">
      <div style="font-size:4rem;margin-bottom:1rem;">${event.image || "🎉"}</div>
      <h2 style="color:var(--neon-cyan,#00d4ff);margin-bottom:1rem;">${event.title}</h2>
      <div class="badge category" style="margin:0.5rem;">${(event.category || "").charAt(0).toUpperCase() + (event.category || "").slice(1)}</div>
      ${getDifficultyBadge(event.difficulty)}${getPopularityBadge(event)}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;margin-bottom:2rem;">
      <div>
        <h3 style="color:var(--neon-purple,#a855f7);margin-bottom:1rem;">📅 Event Information</h3>
        <p><strong>Date:</strong> ${formatDate(event.date)}</p>
        <p><strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Organizer:</strong> ${event.organizer}</p>
        <p><strong>Price:</strong> ${event.price || "Free"}</p>
        <p><strong>Department:</strong> ${(event.department || "").toUpperCase()}</p>
      </div>
      <div>
        <h3 style="color:var(--neon-purple,#a855f7);margin-bottom:1rem;">👥 Capacity & Rating</h3>
        <p><strong>Total Capacity:</strong> ${event.capacity} people</p>
        <p><strong>Registered:</strong> ${event.registered} people</p>
        <p><strong>Available:</strong> ${event.capacity - event.registered} spots</p>
        <p><strong>Rating:</strong> ⭐ ${event.rating || 0}/5</p>
        <p><strong>Difficulty:</strong> ${event.difficulty}</p>
      </div>
    </div>
    <div style="margin-bottom:2rem;">
      <h3 style="color:var(--neon-purple,#a855f7);margin-bottom:1rem;">📝 Description</h3>
      <p style="line-height:1.6;">${event.description}</p>
    </div>
    <div style="margin-bottom:2rem;">
      <h3 style="color:var(--neon-purple,#a855f7);margin-bottom:1rem;">🏷️ Tags</h3>
      <div class="event-tags">
        ${(event.tags || []).map((tag) => `<span class="tag-chip">#${tag}</span>`).join("")}
      </div>
    </div>
    <div style="text-align:center;">
      <button onclick="openRegistrationModal('${event.id || event._id}')" class="dashboard-btn"
        ${registeredEvents.includes(event.id || event._id) ? "disabled" : ""}>
        ${registeredEvents.includes(event.id || event._id) ? "✅ Already Registered" : "📝 Register Now"}
      </button>
    </div>`;
  openModal(eventDetailsModal);
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

function switchAuthTab(tab) {
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");
  const loginTab = document.getElementById("showLoginTab");
  const registerTab = document.getElementById("showRegisterTab");

  if (tab === "login") {
    loginPanel.style.display = "block";
    registerPanel.style.display = "none";
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
  } else {
    loginPanel.style.display = "none";
    registerPanel.style.display = "block";
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
  }
}

function updateLoginStatus() {
  if (currentUser) {
    loginBtn.textContent = `👨‍🚀 ${currentUser.name}`;
    loginBtn.onclick = logout;
    // Show admin button only for admins
    const adminBtn = document.getElementById("adminPanelBtn");
    if (adminBtn)
      adminBtn.style.display =
        currentUser.role === "admin" ? "inline-block" : "none";
  } else {
    loginBtn.textContent = "👨‍🚀 Login";
    loginBtn.onclick = openLoginModal;
    const adminBtn = document.getElementById("adminPanelBtn");
    if (adminBtn) adminBtn.style.display = "none";
  }
}

async function handleLogin(e) {
  e.preventDefault();
  // loginUsername field is used as email input
  const email = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Logging in...";
  submitBtn.disabled = true;
  try {
    const response = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.success) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));
      currentUser = response.data.user;
      updateLoginStatus();
      closeAllModals();
      await loadUserData();
      displayRecommendations();
      updateDashboard();
      alert(`Welcome back, ${currentUser.name}! 🚀`);
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  currentUser = null;
  updateLoginStatus();
  displayRecommendations();
  updateDashboard();
  alert("Logged out successfully! 👋");
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const department = document.getElementById("regDepartment").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const submitBtn =
    document.querySelector('#registerForm button[type="submit"]') ||
    document.querySelector('button[form="registerForm"]');
  const originalText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.textContent = "Creating account...";
    submitBtn.disabled = true;
  }

  try {
    const response = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone: phone || undefined,
        department: department || undefined,
        password,
      }),
    });

    if (response.success) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));
      currentUser = response.data.user;
      updateLoginStatus();
      closeAllModals();
      displayRecommendations();
      updateDashboard();
      alert(`Welcome, ${currentUser.name}! Your account has been created. 🚀`);
    }
  } catch (error) {
    alert("Registration failed: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.textContent = originalText || "Create Account →";
      submitBtn.disabled = false;
    }
  }
}
// ─── REGISTRATION ────────────────────────────────────────────────────────────

async function handleRegistration(e) {
  e.preventDefault();
  const eventId = registrationForm.dataset.eventId;
  const fullName = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const phoneNumber = document.getElementById("studentPhone").value.trim();
  const department = document.getElementById("studentDepartment").value;
  const specialRequests = document
    .getElementById("specialRequests")
    .value.trim();

  if (!eventId) {
    alert("No event selected. Please try again.");
    return;
  }

  const submitBtn =
    document.querySelector('button[form="registrationForm"]') ||
    registrationForm.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.textContent = "Registering...";
    submitBtn.disabled = true;
  }

  try {
    console.log("Registering for event:", eventId, {
      fullName,
      email,
      phoneNumber,
      department,
    });
    const response = await apiCall("/registrations", {
      method: "POST",
      body: JSON.stringify({
        eventId,
        fullName,
        email,
        phoneNumber: phoneNumber || undefined,
        department: department || undefined,
        specialRequests: specialRequests || undefined,
        userId: currentUser?._id || currentUser?.id || undefined,
      }),
    });

    if (response.success) {
      registeredEvents.push(eventId);
      localStorage.setItem(
        "registeredEvents",
        JSON.stringify(registeredEvents),
      );

      const event = mockEvents.find((ev) => (ev.id || ev._id) === eventId);
      if (event) event.registered = (event.registered || 0) + 1;

      closeAllModals();
      showTicketModal(response.data.registration, event);
      displayEvents();
      displayRecommendations();
      updateDashboard();
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration failed: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.textContent = originalText || "Register Now";
      submitBtn.disabled = false;
    }
  }
}

function showTicketModal(registration, event) {
  const ticketContent = document.getElementById("ticketContent");
  if (!ticketContent) return;
  ticketContent.innerHTML = `
    <div class="ticket">
      <div class="ticket-header">
        <div style="font-size:3rem;margin-bottom:1rem;">${event?.image || "🎉"}</div>
        <div class="ticket-title">${event?.title || "Event"}</div>
        <div class="ticket-id">Ticket ID: ${registration.ticketId}</div>
        <div class="qr-placeholder">📱</div>
        <p style="font-size:0.9rem;color:var(--text-secondary);">QR Code for Check-in</p>
      </div>
      <div class="ticket-details">
        <div class="ticket-detail"><span><strong>Name:</strong></span><span>${registration.fullName}</span></div>
        <div class="ticket-detail"><span><strong>Email:</strong></span><span>${registration.email}</span></div>
        <div class="ticket-detail"><span><strong>Date:</strong></span><span>${event ? formatDate(event.date) : ""}</span></div>
        <div class="ticket-detail"><span><strong>Time:</strong></span><span>${event?.time || ""}</span></div>
        <div class="ticket-detail"><span><strong>Location:</strong></span><span>${event?.location || ""}</span></div>
        <div class="ticket-detail"><span><strong>Status:</strong></span><span style="color:#22c55e;">✅ Confirmed</span></div>
      </div>
    </div>
    <div style="text-align:center;margin-top:1.5rem;">
      <button onclick="closeAllModals()" class="dashboard-btn glow-btn">✅ Done</button>
    </div>
    <p style="text-align:center;margin-top:1rem;font-size:0.9rem;color:var(--text-secondary);">
      🎉 Registration Successful! Save this ticket for event check-in.
    </p>`;
  openModal(ticketModal);
}

// ─── SAVE / REMINDER / SHARE ─────────────────────────────────────────────────

function toggleSave(eventId) {
  const index = savedEvents.indexOf(eventId);
  if (index > -1) savedEvents.splice(index, 1);
  else savedEvents.push(eventId);
  localStorage.setItem("savedEvents", JSON.stringify(savedEvents));
  displayEvents();
  displayRecommendations();
  updateDashboard();
}

function toggleReminder(eventId) {
  const index = reminders.indexOf(eventId);
  if (index > -1) reminders.splice(index, 1);
  else reminders.push(eventId);
  localStorage.setItem("reminders", JSON.stringify(reminders));
  displayEvents();
  displayRecommendations();
  updateDashboard();
}

function shareEvent(eventId) {
  const event = mockEvents.find((e) => (e.id || e._id) === eventId);
  if (!event) return;
  const shareText = `🎓 Check out this event: ${event.title}\n\n📅 ${formatDate(event.date)} at ${event.time}\n📍 ${event.location}\n💰 ${event.price || "Free"}\n\n${event.description}\n\n#CampusEvents #${event.category}`;
  if (navigator.share) {
    navigator.share({
      title: event.title,
      text: shareText,
      url: window.location.href,
    });
  } else {
    navigator.clipboard
      .writeText(shareText)
      .then(() => alert("Event details copied to clipboard! 📋"));
  }
}

// ─── ANIMATIONS ──────────────────────────────────────────────────────────────

class SpaceAnimations {
  constructor() {
    this.init();
  }
  init() {
    this.setupScrollReveal();
    this.setupMagneticButtons();
    this.setupProgressBars();
  }
  setupScrollReveal() {
    const sections = document.querySelectorAll(
      "section, .space-filters, .space-dashboard, .skill-constellation",
    );
    sections.forEach((s) => s.classList.add("reveal-section"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("revealed");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    sections.forEach((s) => observer.observe(s));
  }
  setupMagneticButtons() {
    document
      .querySelectorAll(".register-btn, .dashboard-btn, .glow-btn")
      .forEach((el) => {
        el.classList.add("magnetic-btn");
        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect();
          el.style.setProperty(
            "--mouse-x",
            `${(e.clientX - rect.left - rect.width / 2) * 0.1}px`,
          );
          el.style.setProperty(
            "--mouse-y",
            `${(e.clientY - rect.top - rect.height / 2) * 0.1}px`,
          );
        });
        el.addEventListener("mouseleave", () => {
          el.style.setProperty("--mouse-x", "0px");
          el.style.setProperty("--mouse-y", "0px");
        });
      });
  }
  setupProgressBars() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;
            bar.style.width = "0%";
            setTimeout(() => {
              bar.style.width = width;
            }, 100);
          }
        });
      },
      { threshold: 0.5 },
    );
    document
      .querySelectorAll(".seats-fill")
      .forEach((bar) => observer.observe(bar));
  }
  showRegistrationSuccess(eventTitle) {
    const overlay = document.createElement("div");
    overlay.className = "success-overlay";
    overlay.innerHTML = `
      <div class="success-content">
        <div class="rocket-launch">🚀</div>
        <h2>Mission Accepted!</h2>
        <p>Successfully registered for ${eventTitle}</p>
        <div class="confetti-stars"><span>⭐</span><span>🌟</span><span>✨</span><span>💫</span><span>⭐</span></div>
      </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.querySelector(".rocket-launch").style.transform =
        "translateY(-200px) scale(0.5)";
    }, 500);
    setTimeout(() => overlay.remove(), 3000);
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  init();
  new SpaceAnimations();
});

// Additional CSS for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
.success-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(11,15,26,0.9);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:10000;animation:fadeIn 0.3s ease}
.success-content{text-align:center;color:var(--text-primary)}
.rocket-launch{font-size:4rem;margin-bottom:1rem;transition:all 1s cubic-bezier(0.4,0,0.2,1)}
.success-content h2{font-family:'Orbitron',monospace;font-size:2rem;color:var(--neon-cyan,#00d4ff);margin-bottom:0.5rem}
.confetti-stars{margin-top:2rem}.confetti-stars span{display:inline-block;font-size:1.5rem;margin:0 0.5rem;animation:starTwinkle 1s ease-in-out infinite}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes starTwinkle{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.2) rotate(180deg)}}
`;
document.head.appendChild(styleSheet);

// ═══════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════
const ADM_API = API_BASE_URL;
let admEvents = [],
  admUsers = [],
  admRegs = [],
  admStats = {};

function openAdminPanel() {
  document.getElementById("adminOverlay").style.display = "block";
  admShow("dashboard");
  admLoadAll();
}

function closeAdminPanel() {
  document.getElementById("adminOverlay").style.display = "none";
}

function admShow(section) {
  ["dashboard", "events", "users", "registrations", "analytics"].forEach(
    (s) => {
      document.getElementById(`adm-${s}`).style.display =
        s === section ? "block" : "none";
    },
  );
  document.querySelectorAll(".adm-tab").forEach((t, i) => {
    t.classList.toggle(
      "active",
      ["dashboard", "events", "users", "registrations", "analytics"][i] ===
        section,
    );
  });
  if (section === "analytics") admRenderAnalytics();
}

async function admApi(path, opts = {}) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${ADM_API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

async function admLoadAll() {
  await Promise.all([
    admLoadStats(),
    admLoadEvents(),
    admLoadUsers(),
    admLoadRegs(),
  ]);
}

// ── STATS ──
async function admLoadStats() {
  const data = await admApi("/admin/stats");
  if (!data.success) return;
  admStats = data.data;
  const o = data.data.overview;
  document.getElementById("adm-stat-users").textContent = o.totalUsers;
  document.getElementById("adm-stat-events").textContent = o.totalEvents;
  document.getElementById("adm-stat-regs").textContent = o.totalRegistrations;
  document.getElementById("adm-stat-avg").textContent =
    o.averageRegistrationsPerEvent;
  document.getElementById("adm-popular-body").innerHTML = (
    data.data.popularEvents || []
  )
    .map(
      (e) =>
        `<tr><td>${e.title}</td><td><span class="adm-badge adm-badge-blue">${e.category}</span></td><td>${e.registered}</td><td>${e.capacity}</td></tr>`,
    )
    .join("");
}

// ── EVENTS ──
async function admLoadEvents() {
  const data = await admApi("/admin/events?limit=100");
  if (!data.success) return;
  admEvents = data.data;
  admRenderEvents(admEvents);
}

function admRenderEvents(events) {
  document.getElementById("adm-events-body").innerHTML = events
    .map(
      (e) => `
    <tr>
      <td>${e.title}</td>
      <td><span class="adm-badge adm-badge-blue">${e.category}</span></td>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${e.registered}/${e.capacity}</td>
      <td><span class="adm-badge ${e.isActive ? "adm-badge-green" : "adm-badge-red"}">${e.isActive ? "Active" : "Inactive"}</span></td>
      <td style="display:flex;gap:6px">
        <button class="adm-btn-edit" onclick="admOpenEventModal('${e._id}')">Edit</button>
        <button class="adm-btn-danger" onclick="admDeleteEvent('${e._id}')">Delete</button>
      </td>
    </tr>`,
    )
    .join("");
}

function admFilterEvents(q) {
  admRenderEvents(
    admEvents.filter((e) => e.title.toLowerCase().includes(q.toLowerCase())),
  );
}

function admOpenEventModal(id) {
  document.getElementById("adm-modal-title").textContent = id
    ? "Edit Event"
    : "Add Event";
  document.getElementById("adm-ev-id").value = id || "";
  if (id) {
    const e = admEvents.find((x) => x._id === id);
    if (e) {
      document.getElementById("adm-ev-title").value = e.title;
      document.getElementById("adm-ev-cat").value = e.category;
      document.getElementById("adm-ev-dept").value = e.department;
      document.getElementById("adm-ev-diff").value = e.difficulty;
      document.getElementById("adm-ev-cap").value = e.capacity;
      document.getElementById("adm-ev-date").value = e.date
        ? e.date.split("T")[0]
        : "";
      document.getElementById("adm-ev-time").value = e.time;
      document.getElementById("adm-ev-loc").value = e.location;
      document.getElementById("adm-ev-org").value = e.organizer;
      document.getElementById("adm-ev-price").value = e.price || "";
      document.getElementById("adm-ev-tags").value = (e.tags || []).join(", ");
      document.getElementById("adm-ev-desc").value = e.description;
      document.getElementById("adm-ev-trending").checked =
        e.popularity === "trending";
    }
  } else {
    [
      "adm-ev-title",
      "adm-ev-cap",
      "adm-ev-date",
      "adm-ev-time",
      "adm-ev-loc",
      "adm-ev-org",
      "adm-ev-price",
      "adm-ev-tags",
      "adm-ev-desc",
    ].forEach((i) => (document.getElementById(i).value = ""));
    document.getElementById("adm-ev-trending").checked = false;
  }
  document.getElementById("adm-event-modal").style.display = "flex";
}

function admCloseEventModal() {
  document.getElementById("adm-event-modal").style.display = "none";
}

async function admSaveEvent() {
  const id = document.getElementById("adm-ev-id").value;
  const body = {
    title: document.getElementById("adm-ev-title").value,
    category: document.getElementById("adm-ev-cat").value,
    department: document.getElementById("adm-ev-dept").value,
    difficulty: document.getElementById("adm-ev-diff").value,
    capacity: parseInt(document.getElementById("adm-ev-cap").value),
    date: document.getElementById("adm-ev-date").value,
    time: document.getElementById("adm-ev-time").value,
    location: document.getElementById("adm-ev-loc").value,
    organizer: document.getElementById("adm-ev-org").value,
    price: document.getElementById("adm-ev-price").value || "Free",
    tags: document
      .getElementById("adm-ev-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    description: document.getElementById("adm-ev-desc").value,
    popularity: document.getElementById("adm-ev-trending").checked
      ? "trending"
      : "normal",
  };
  const data = await admApi(id ? `/admin/events/${id}` : "/admin/events", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  });
  if (data.success) {
    admToast("Event saved");
    admCloseEventModal();
    admLoadEvents();
    admLoadStats();
  } else admToast(data.message || "Error", true);
}

async function admDeleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  const data = await admApi(`/admin/events/${id}`, { method: "DELETE" });
  if (data.success) {
    admToast("Event deleted");
    admLoadEvents();
    admLoadStats();
  } else admToast(data.message || "Error", true);
}

// ── USERS ──
async function admLoadUsers() {
  const data = await admApi("/admin/users?limit=100");
  if (!data.success) return;
  admUsers = data.data;
  admRenderUsers(admUsers);
}

function admRenderUsers(users) {
  document.getElementById("adm-users-body").innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u.name}</td><td>${u.email}</td><td>${u.department || "—"}</td>
      <td>
        <select class="adm-input" style="width:auto;padding:4px 8px" onchange="admChangeRole('${u._id}',this.value)">
          <option ${u.role === "student" ? "selected" : ""} value="student">student</option>
          <option ${u.role === "admin" ? "selected" : ""} value="admin">admin</option>
          <option ${u.role === "organizer" ? "selected" : ""} value="organizer">organizer</option>
        </select>
      </td>
      <td><span class="adm-badge ${u.isActive ? "adm-badge-green" : "adm-badge-red"}">${u.isActive ? "Active" : "Inactive"}</span></td>
      <td><button class="adm-btn-danger" onclick="admDeleteUser('${u._id}')">Delete</button></td>
    </tr>`,
    )
    .join("");
}

function admFilterUsers(q) {
  admRenderUsers(
    admUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()),
    ),
  );
}

async function admChangeRole(id, role) {
  const data = await admApi(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  if (data.success) admToast("Role updated");
  else admToast(data.message || "Error", true);
}

async function admDeleteUser(id) {
  if (!confirm("Deactivate this user?")) return;
  const data = await admApi(`/admin/users/${id}`, { method: "DELETE" });
  if (data.success) {
    admToast("User deactivated");
    admLoadUsers();
  } else admToast(data.message || "Error", true);
}

// ── REGISTRATIONS ──
async function admLoadRegs() {
  const data = await admApi("/admin/registrations?limit=100");
  if (!data.success) return;
  admRegs = data.data;
  document.getElementById("adm-regs-body").innerHTML = admRegs
    .map(
      (r) => `
    <tr>
      <td><code style="color:#38BDF8;font-size:.8rem">${r.ticketId}</code></td>
      <td>${r.fullName}</td>
      <td>${r.event?.title || "—"}</td>
      <td>${r.event?.date ? new Date(r.event.date).toLocaleDateString() : "—"}</td>
      <td><span class="adm-badge ${r.status === "confirmed" ? "adm-badge-green" : r.status === "cancelled" ? "adm-badge-red" : "adm-badge-yellow"}">${r.status}</span></td>
      <td>${r.status !== "cancelled" ? `<button class="adm-btn-danger" onclick="admCancelReg('${r._id}')">Cancel</button>` : "—"}</td>
    </tr>`,
    )
    .join("");
}

async function admCancelReg(id) {
  if (!confirm("Cancel this registration?")) return;
  const data = await admApi(`/admin/registrations/${id}/cancel`, {
    method: "PUT",
  });
  if (data.success) {
    admToast("Cancelled");
    admLoadRegs();
    admLoadStats();
  } else admToast(data.message || "Error", true);
}

function admExport() {
  const blob = new Blob([JSON.stringify(admRegs, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "registrations.json";
  a.click();
}

// ── ANALYTICS ──
function admRenderAnalytics() {
  if (!admStats.popularEvents) return;
  const maxVal = (arr) =>
    Math.max(...arr.map((x) => x.registered || x.count || 1), 1);

  document.getElementById("adm-chart-popular").innerHTML = (
    admStats.popularEvents || []
  )
    .map(
      (e) =>
        `<div class="adm-bar-row"><div class="adm-bar-label">${e.title.substring(0, 12)}…</div>
    <div class="adm-bar-track"><div class="adm-bar-fill" style="width:${Math.round((e.registered / maxVal(admStats.popularEvents)) * 100)}%"></div></div>
    <div class="adm-bar-count">${e.registered}</div></div>`,
    )
    .join("");

  document.getElementById("adm-chart-cat").innerHTML = (
    admStats.categoryStats || []
  )
    .map(
      (c) =>
        `<div class="adm-bar-row"><div class="adm-bar-label">${c._id}</div>
    <div class="adm-bar-track"><div class="adm-bar-fill" style="width:${Math.round((c.count / maxVal(admStats.categoryStats)) * 100)}%;background:#818CF8"></div></div>
    <div class="adm-bar-count">${c.count}</div></div>`,
    )
    .join("");

  document.getElementById("adm-chart-monthly").innerHTML = (
    admStats.monthlyRegistrations || []
  )
    .slice()
    .reverse()
    .map(
      (m) =>
        `<div class="adm-bar-row"><div class="adm-bar-label">${m._id.year}/${m._id.month}</div>
    <div class="adm-bar-track"><div class="adm-bar-fill" style="width:${Math.round((m.count / maxVal(admStats.monthlyRegistrations)) * 100)}%;background:#34D399"></div></div>
    <div class="adm-bar-count">${m.count}</div></div>`,
    )
    .join("");
}

// ── TOAST ──
function admToast(msg, isErr = false) {
  let t = document.getElementById("adm-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "adm-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = "show" + (isErr ? " err" : "");
  setTimeout(() => (t.className = ""), 3000);
}

// On page load — restore admin button if already logged in as admin
if (currentUser && currentUser.role === "admin") {
  const adminBtn = document.getElementById("adminPanelBtn");
  if (adminBtn) adminBtn.style.display = "inline-block";
}
