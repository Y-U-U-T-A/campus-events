// API Configuration
// In production (Render), frontend is served from the same origin as the backend
// In development, falls back to localhost:5000
const API_CONFIG = {
  BASE_URL:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api"
      : `${window.location.origin}/api`,
  ENDPOINTS: {
    // Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",

    // Events
    EVENTS: "/events",
    EVENT_BY_ID: (id) => `/events/${id}`,
    TRENDING_EVENTS: "/events/trending",
    UPCOMING_EVENTS: "/events/upcoming",
    RATE_EVENT: (id) => `/events/${id}/rate`,

    // Registrations
    REGISTER_EVENT: "/registrations",
    MY_REGISTRATIONS: "/registrations",
    CANCEL_REGISTRATION: (id) => `/registrations/${id}/cancel`,

    // User
    PROFILE: "/users/profile",
    SAVE_EVENT: (id) => `/users/save-event/${id}`,
    UNSAVE_EVENT: (id) => `/users/save-event/${id}`,
    ADD_REMINDER: (id) => `/users/reminder/${id}`,
    REMOVE_REMINDER: (id) => `/users/reminder/${id}`,

    // Admin
    ADMIN_STATS: "/admin/stats",
    ADMIN_USERS: "/admin/users",
    ADMIN_EVENTS: "/admin/events",
    ADMIN_REGISTRATIONS: "/admin/registrations",
  },
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Export for use in other files
window.API_CONFIG = API_CONFIG;
window.apiCall = apiCall;
