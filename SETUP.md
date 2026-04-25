# Campus Events - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** (optional)

## Step-by-Step Setup

### 1. Install MongoDB

#### Windows:
```bash
# Download MongoDB Community Server from:
# https://www.mongodb.com/try/download/community

# After installation, start MongoDB service:
net start MongoDB

# Or use MongoDB Compass (GUI) to start the service
```

#### macOS:
```bash
# Using Homebrew:
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB:
brew services start mongodb-community
```

#### Linux:
```bash
# Ubuntu/Debian:
sudo apt-get install mongodb

# Start MongoDB:
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is running:
mongosh

# You should see MongoDB shell. Type 'exit' to quit.
```

### 3. Install Project Dependencies

```bash
# Navigate to project directory
cd campus-events

# Install all dependencies
npm install
```

### 4. Configure Environment Variables

```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file with your settings (use notepad or any text editor)
notepad .env
```

**Important:** Update these values in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/campus-events
JWT_SECRET=your_super_secret_key_here_change_this
FRONTEND_URL=http://127.0.0.1:5500
```

### 5. Seed the Database

```bash
# This will create sample data (users, events, registrations)
npm run seed
```

**Default Login Credentials:**
- **Admin:** admin@campus.edu / admin123
- **Student 1:** john@campus.edu / password123
- **Student 2:** jane@campus.edu / password123

### 6. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ Connected to MongoDB
📊 Database: campus-events
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
```

### 7. Open the Frontend

#### Option A: Using Live Server (VS Code)
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option B: Direct File Access
1. Navigate to project folder
2. Double-click `index.html`
3. Or drag `index.html` into your browser

#### Option C: Using Python
```bash
# Python 3
python -m http.server 5500

# Then open: http://localhost:5500
```

### 8. Test the Application

1. **Check API Health:**
   - Open: http://localhost:5000/api/health
   - Should show: `{"status":"OK","message":"Campus Events API is running"}`

2. **Test Login:**
   - Open the frontend
   - Click "Login" button
   - Use: admin@campus.edu / admin123

3. **Browse Events:**
   - You should see 5 sample events
   - Try filtering and searching

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (requires auth)
- `PUT /api/events/:id` - Update event (requires auth)
- `DELETE /api/events/:id` - Delete event (requires auth)

### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations` - Get user registrations (requires auth)
- `GET /api/registrations/ticket/:ticketId` - Get by ticket ID
- `PUT /api/registrations/:id/cancel` - Cancel registration (requires auth)

### Admin (requires admin role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/events` - Get all events
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/registrations` - Get all registrations
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/role` - Change user role

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in `.env` file or kill the process using port 5000

### CORS Error in Browser
```
Access to fetch at 'http://localhost:5000/api/events' has been blocked by CORS policy
```
**Solution:** Make sure `FRONTEND_URL` in `.env` matches your frontend URL

### Module Not Found Error
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install` again

## Project Structure

```
campus-events/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Registration.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── admin.js
│   └── scripts/
│       └── seedDatabase.js
├── routes/
│   ├── events.js
│   ├── users.js
│   └── registrations.js
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Registration.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── server.js
├── package.json
├── .env.example
└── README.md
```

## Development Tips

### Watch MongoDB Data
```bash
# Open MongoDB shell
mongosh

# Switch to database
use campus-events

# View collections
show collections

# View users
db.users.find().pretty()

# View events
db.events.find().pretty()

# View registrations
db.registrations.find().pretty()
```

### Reset Database
```bash
# Drop database and reseed
mongosh campus-events --eval "db.dropDatabase()"
npm run seed
```

### Test API with cURL
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"admin123"}'

# Get events
curl http://localhost:5000/api/events
```

## Next Steps

1. **Customize Events:** Edit `backend/scripts/seedDatabase.js` to add your own events
2. **Add Features:** Extend the API with new endpoints
3. **Deploy:** Deploy to Heroku, Railway, or Render
4. **Add Email:** Configure email service for ticket delivery

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation in README.md
3. Check MongoDB logs: `mongod --logpath /path/to/log`
4. Check server logs in terminal

## Security Notes

⚠️ **Important for Production:**
1. Change `JWT_SECRET` to a strong random string
2. Use environment variables for all sensitive data
3. Enable HTTPS
4. Add rate limiting
5. Implement input sanitization
6. Use MongoDB Atlas for cloud database
7. Never commit `.env` file to Git

Happy Coding! 🚀
