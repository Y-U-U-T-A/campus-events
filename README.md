# Campus Galaxy - Event Management Backend API

A complete Node.js/Express backend API for the Campus Galaxy Event Discovery & Registration system with MongoDB database.

## Features

- 🎯 **Event Management**: Create, read, update, delete events
- 👤 **User Authentication**: JWT-based authentication with bcrypt password hashing
- 📝 **Event Registration**: Register for events with unique ticket generation
- ⭐ **Rating System**: Rate events and provide feedback
- 💾 **Save & Remind**: Save favorite events and set reminders
- 🔍 **Advanced Filtering**: Filter events by category, department, difficulty, date
- 📊 **Statistics**: Track registrations, ratings, and event popularity

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: bcryptjs for password hashing
- **CORS**: Enabled for frontend integration

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Steps

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus-galaxy
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:3000
```

3. **Start MongoDB**:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

4. **Seed the database** (optional):
```bash
node scripts/seedData.js
```

5. **Start the server**:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000/api`

## API Endpoints

### Events

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | Get all events with filters | No |
| GET | `/api/events/trending` | Get trending events | No |
| GET | `/api/events/upcoming` | Get upcoming events | No |
| GET | `/api/events/:id` | Get single event | No |
| POST | `/api/events` | Create new event | No* |
| PUT | `/api/events/:id` | Update event | No* |
| DELETE | `/api/events/:id` | Delete event (soft) | No* |
| POST | `/api/events/:id/rate` | Rate an event | No |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | Register new user | No |
| POST | `/api/users/login` | Login user | No |
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |
| POST | `/api/users/save-event/:eventId` | Save event | Yes |
| DELETE | `/api/users/save-event/:eventId` | Unsave event | Yes |
| POST | `/api/users/reminder/:eventId` | Add reminder | Yes |
| DELETE | `/api/users/reminder/:eventId` | Remove reminder | Yes |

### Registrations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/registrations` | Register for event | No |
| GET | `/api/registrations` | Get user registrations | Yes |
| GET | `/api/registrations/ticket/:ticketId` | Get by ticket ID | No |
| GET | `/api/registrations/:id` | Get single registration | Yes |
| PUT | `/api/registrations/:id/cancel` | Cancel registration | Yes |
| POST | `/api/registrations/:id/checkin` | Check in to event | No |
| POST | `/api/registrations/:id/feedback` | Add feedback | Yes |
| GET | `/api/registrations/event/:eventId` | Get event registrations | No |

*Note: In production, these should require admin authentication

## Query Parameters

### GET /api/events

Filter events using query parameters:

```
GET /api/events?category=tech&department=csit&difficulty=beginner&date=2026-02-15&search=AI&sort=popularity
```

**Parameters**:
- `category`: tech, social, sports, career, arts, academic
- `department`: csit, mechanical, cultural, sports, business
- `difficulty`: beginner, intermediate, advanced
- `date`: ISO date format (YYYY-MM-DD)
- `search`: Text search in title, description, tags
- `sort`: date, popularity, availability, trending

## Request Examples

### Register a User

```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "department": "csit",
    "interests": ["tech", "career"]
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Register for Event

```bash
curl -X POST http://localhost:5000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVENT_ID_HERE",
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "studentPhone": "1234567890",
    "studentDepartment": "csit",
    "specialRequests": "Vegetarian meal"
  }'
```

### Get Events with Filters

```bash
curl "http://localhost:5000/api/events?category=tech&sort=popularity"
```

## Database Models

### Event Schema
- title, category, department, difficulty
- date, time, location, description
- capacity, registered, rating, ratingCount
- tags, organizer, price, image, popularity
- isActive, createdBy, timestamps

### User Schema
- name, email, password (hashed)
- studentId, phone, department, interests
- role (student/admin/organizer)
- savedEvents, reminders
- isActive, timestamps

### Registration Schema
- event, user, studentName, studentEmail
- studentPhone, studentDepartment, specialRequests
- ticketId (unique), status
- checkInTime, rating, feedback
- timestamps

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token is returned on successful login/registration and expires in 7 days.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (development only)"
}
```

## Development

### Run with auto-reload:
```bash
npm run dev
```

### Seed database:
```bash
node scripts/seedData.js
```

### Test API:
Use tools like Postman, Insomnia, or curl to test endpoints.

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB Atlas or production database
4. Add authentication middleware to admin routes
5. Enable rate limiting and security headers
6. Use HTTPS in production

## Frontend Integration

Update your frontend `script.js` to use the API:

```javascript
const API_URL = 'http://localhost:5000/api';

// Fetch events
async function fetchEvents() {
    const response = await fetch(`${API_URL}/events`);
    const data = await response.json();
    return data.data;
}

// Register for event
async function registerForEvent(eventId, formData) {
    const response = await fetch(`${API_URL}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...formData })
    });
    return await response.json();
}
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
