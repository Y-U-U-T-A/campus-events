# 🚀 Quick Start Guide - Campus Events

## ✅ Your Setup is Complete!

Everything is now connected to MongoDB. Here's how to use it:

---

## 🎯 Step 1: Start Backend Server

Open terminal in your project folder and run:

```bash
npm run dev
```

**You should see:**
```
✅ Connected to MongoDB
📊 Database: campus-events
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
```

**✅ Keep this terminal open!**

---

## 🎯 Step 2: Open Your Website

**Option A: Using VS Code Live Server**
1. Right-click on `index.html`
2. Click "Open with Live Server"

**Option B: Direct File**
1. Double-click `index.html`

---

## 🎯 Step 3: Test Everything

### Test 1: View Events
- Open your website
- You should see events loading from database
- If you see "Loading events..." then events appear, it's working! ✅

### Test 2: Login
1. Click "Login" button
2. Enter credentials:
   - **Email:** `admin@campus.edu`
   - **Password:** `admin123`
3. Click Login
4. You should see "Welcome back, Admin User!" ✅

### Test 3: Register for Event
1. Click on any event
2. Click "Register Now"
3. Fill in the form:
   - Full Name: Your Name
   - Email: your@email.com
   - Department: Choose one
   - Phone: (optional)
4. Click "Register Now"
5. You should get a ticket with unique ID! ✅

### Test 4: View in Database
1. Open MongoDB Compass
2. Click "campus-events" database
3. Click "registrations" collection
4. You should see your new registration! ✅

---

## 🔑 Login Credentials

### Admin Account:
- **Email:** `admin@campus.edu`
- **Password:** `admin123`
- **Can:** Manage everything

### Student Accounts:
- **Email:** `john@campus.edu`
- **Password:** `password123`

- **Email:** `jane@campus.edu`
- **Password:** `password123`

---

## 🎨 What's Connected to Database:

### ✅ Events
- All events load from MongoDB
- Real-time seat availability
- Automatic updates

### ✅ User Authentication
- Login with real accounts
- JWT token authentication
- Secure password hashing

### ✅ Event Registration
- Saves to MongoDB
- Generates unique ticket IDs
- Checks seat availability
- Updates event capacity

### ✅ User Data
- Saved events
- Reminders
- Registration history
- User preferences

---

## 🔍 How to Verify Connection:

### Method 1: Browser Console
1. Press F12 to open console
2. You should see: `✅ Loaded X events from database`
3. No errors = working perfectly!

### Method 2: Network Tab
1. Press F12 → Network tab
2. Refresh page
3. Look for requests to `localhost:5000/api/events`
4. Status should be `200 OK`

### Method 3: MongoDB Compass
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Click "campus-events" database
4. You should see 3 collections with data

---

## 🎯 Common Actions:

### Register for an Event:
```
1. Browse events on homepage
2. Click "Register Now"
3. Fill form
4. Get unique ticket ID
5. Check MongoDB Compass → registrations collection
```

### Add New Event (as Admin):
```
1. Login as admin
2. (Admin panel coming soon)
3. Or add via MongoDB Compass
4. Refresh website to see new event
```

### View Your Registrations:
```
1. Login to your account
2. Click "My Events" button
3. See all your registered events
```

---

## 🐛 Troubleshooting:

### Events Not Loading?
**Check:**
1. Backend server is running (`npm run dev`)
2. MongoDB is running (check Compass)
3. Browser console for errors (F12)

**Fix:**
```bash
# Restart backend
Ctrl+C (stop server)
npm run dev (start again)
```

### Login Not Working?
**Check:**
1. Using correct credentials
2. Backend server is running
3. No CORS errors in console

**Fix:**
```bash
# Reseed database
npm run seed
# Try login again
```

### Registration Fails?
**Check:**
1. Event has available seats
2. All required fields filled
3. Backend server running

**Fix:**
- Check backend terminal for error messages
- Check browser console (F12)

### CORS Error?
**Fix:**
1. Open `.env` file
2. Make sure: `FRONTEND_URL=http://127.0.0.1:5500`
3. Restart backend: `npm run dev`

---

## 📊 View Your Data:

### In MongoDB Compass:
```
campus-events
├── users (3 documents)
├── events (5 documents)
└── registrations (grows as users register)
```

### In Browser:
- Events: `http://localhost:5000/api/events`
- Health: `http://localhost:5000/api/health`

### On Website:
- Homepage: All events
- My Events: Your registrations
- Dashboard: Your stats

---

## 🎉 You're All Set!

Your website is now fully connected to MongoDB!

**What happens when you register:**
1. Frontend sends data to backend
2. Backend validates and saves to MongoDB
3. Backend generates unique ticket ID
4. Frontend shows success with ticket
5. You can see it in MongoDB Compass!

**Try it now:**
1. Open your website
2. Register for an event
3. Check MongoDB Compass
4. See your registration appear! ✨

---

## 🚀 Next Steps:

1. **Customize Events:** Edit `backend/scripts/seedDatabase.js`
2. **Add Features:** Extend the API
3. **Deploy Online:** Use Heroku + MongoDB Atlas
4. **Add Admin Panel:** Create admin dashboard

---

## 💡 Pro Tips:

- Keep backend terminal open while using website
- Use MongoDB Compass to view real-time data
- Check browser console (F12) for debugging
- Backend logs show all API requests

---

**Need Help?** Check the error messages in:
1. Backend terminal (where `npm run dev` runs)
2. Browser console (F12)
3. MongoDB Compass connection status

Happy Coding! 🎉
