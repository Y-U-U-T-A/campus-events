# 🎨 VS Code Setup Guide - Campus Events

## 🚀 Complete VS Code Integration

This guide will help you connect VS Code to your MongoDB database and work efficiently with your code.

---

## 📦 Step 1: Install Required Extensions

VS Code will prompt you to install recommended extensions. Click **"Install All"** or install manually:

### Required Extensions:

1. **MongoDB for VS Code** (mongodb.mongodb-vscode)
   - Browse databases directly in VS Code
   - Run queries
   - View and edit documents

2. **Live Server** (ritwickdey.liveserver)
   - Run your frontend with auto-reload
   - Right-click `index.html` → "Open with Live Server"

3. **Prettier** (esbenp.prettier-vscode)
   - Auto-format your code
   - Formats on save

4. **ESLint** (dbaeumer.vscode-eslint)
   - JavaScript linting
   - Catch errors early

### How to Install:
1. Press `Ctrl+Shift+X` to open Extensions
2. Search for each extension
3. Click "Install"

---

## 🗄️ Step 2: Connect to MongoDB in VS Code

### Method A: Using MongoDB Extension

1. **Click MongoDB icon** in left sidebar (🍃 leaf icon)
2. **Click "Add Connection"**
3. **Enter connection string:**
   ```
   mongodb://localhost:27017
   ```
4. **Click "Connect"**

**You'll see:**
```
📊 localhost:27017
  └── 📁 campus-events
      ├── 📄 users
      ├── 📄 events
      └── 📄 registrations
```

### Method B: Using Integrated Terminal

1. Press `` Ctrl+` `` to open terminal
2. Type: `mongosh`
3. Run commands:
   ```javascript
   use campus-events
   show collections
   db.events.find().pretty()
   ```

---

## ⚡ Step 3: Quick Actions in VS Code

### Start Backend Server

**Option A: Using Tasks**
1. Press `Ctrl+Shift+P`
2. Type: "Tasks: Run Task"
3. Select: "Start Backend"

**Option B: Using Terminal**
1. Press `` Ctrl+` ``
2. Type: `npm run dev`

**Option C: Using Debug**
1. Press `F5`
2. Select: "Start Backend Server"

### Seed Database

**Option A: Using Tasks**
1. Press `Ctrl+Shift+P`
2. Type: "Tasks: Run Task"
3. Select: "Seed Database"

**Option B: Using Terminal**
```bash
npm run seed
```

### Open Frontend

**Option A: Using Live Server**
1. Right-click `index.html`
2. Select "Open with Live Server"
3. Browser opens automatically at `http://127.0.0.1:5500`

**Option B: Direct File**
1. Right-click `index.html`
2. Select "Open in Default Browser"

---

## 🎯 Step 4: Working with MongoDB in VS Code

### View Collections

1. **Expand MongoDB connection** in sidebar
2. **Expand "campus-events" database**
3. **Click on any collection** (users, events, registrations)
4. **View documents** in the editor

### Run Queries

1. **Right-click on collection**
2. **Select "Open Playground"**
3. **Write MongoDB queries:**

```javascript
// Find all events
use('campus-events');
db.events.find({});

// Find trending events
use('campus-events');
db.events.find({ popularity: 'trending' });

// Find admin users
use('campus-events');
db.users.find({ role: 'admin' });

// Count registrations
use('campus-events');
db.registrations.countDocuments();
```

4. **Press `Ctrl+Alt+E`** to execute

### Edit Documents

1. **Click on a document** in the collection view
2. **Edit the JSON** directly
3. **Save** with `Ctrl+S`
4. **Changes sync to MongoDB** automatically

---

## 🔧 Step 5: Useful VS Code Shortcuts

### General
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+P` - Command palette
- `` Ctrl+` `` - Toggle terminal
- `Ctrl+B` - Toggle sidebar

### Editing
- `Alt+Up/Down` - Move line up/down
- `Ctrl+D` - Select next occurrence
- `Ctrl+/` - Toggle comment
- `Shift+Alt+F` - Format document

### Terminal
- `Ctrl+Shift+5` - Split terminal
- `Ctrl+Shift+C` - Copy from terminal
- `Ctrl+Shift+V` - Paste to terminal

### MongoDB
- `Ctrl+Alt+E` - Execute playground
- Right-click collection → "Refresh" to update

---

## 📊 Step 6: View Your Data

### In VS Code MongoDB Extension:

**View Events:**
1. MongoDB sidebar → campus-events → events
2. Click to view all documents
3. Edit directly in VS Code

**View Users:**
1. MongoDB sidebar → campus-events → users
2. See all registered users
3. Check roles and permissions

**View Registrations:**
1. MongoDB sidebar → campus-events → registrations
2. See all event registrations
3. Check ticket IDs and status

### In Integrated Terminal:

```bash
# Open MongoDB shell
mongosh

# Switch to database
use campus-events

# View all events
db.events.find().pretty()

# View specific event
db.events.findOne({ title: "AI & Machine Learning Workshop" })

# View all registrations
db.registrations.find().pretty()

# Count documents
db.events.countDocuments()
db.users.countDocuments()
db.registrations.countDocuments()

# Exit
exit
```

---

## 🎨 Step 7: Workspace Layout

### Recommended Layout:

**Left Sidebar:**
- 📁 Explorer (files)
- 🔍 Search
- 🗄️ MongoDB
- 🐛 Debug

**Main Area:**
- Code editor

**Bottom Panel:**
- 💻 Terminal (for `npm run dev`)
- 🐛 Debug Console
- 📊 Output

### Split View:

1. **Open `server.js`**
2. **Press `Ctrl+\`** to split editor
3. **Open `script.js`** in second pane
4. **Work on backend and frontend simultaneously**

---

## 🚀 Step 8: Development Workflow

### Daily Workflow:

1. **Open VS Code** in project folder
2. **Start MongoDB** (if not running):
   - Press `Ctrl+Shift+P`
   - Type: "Tasks: Run Task"
   - Select: "Start MongoDB"

3. **Start Backend**:
   - Press `` Ctrl+` ``
   - Type: `npm run dev`
   - Keep terminal open

4. **Open Frontend**:
   - Right-click `index.html`
   - Select "Open with Live Server"

5. **View Database**:
   - Click MongoDB icon in sidebar
   - Browse collections

6. **Make Changes**:
   - Edit code
   - Save with `Ctrl+S`
   - Auto-reload in browser (Live Server)
   - Backend auto-restarts (nodemon)

---

## 🔍 Step 9: Debugging

### Debug Backend:

1. **Set breakpoints** in `server.js` or routes
2. **Press `F5`**
3. **Select "Start Backend Server"**
4. **Make API request** from frontend
5. **Debugger pauses** at breakpoints

### Debug Frontend:

1. **Open browser DevTools** (F12)
2. **Go to Sources tab**
3. **Find `script.js`**
4. **Set breakpoints**
5. **Interact with website**

### View Logs:

**Backend Logs:**
- Terminal where `npm run dev` is running
- Shows all API requests and errors

**Frontend Logs:**
- Browser Console (F12)
- Shows JavaScript errors and logs

**MongoDB Logs:**
- MongoDB Compass → View logs
- Or check MongoDB service logs

---

## 💡 Step 10: Pro Tips

### Quick Database Queries:

Create a file `queries.mongodb` in your project:

```javascript
// queries.mongodb

// Find all events
use('campus-events');
db.events.find({});

// Find events by category
use('campus-events');
db.events.find({ category: 'tech' });

// Find registrations for specific event
use('campus-events');
db.registrations.find({ 
  event: ObjectId('YOUR_EVENT_ID') 
});

// Update event capacity
use('campus-events');
db.events.updateOne(
  { title: "AI & Machine Learning Workshop" },
  { $set: { capacity: 50 } }
);

// Delete test registrations
use('campus-events');
db.registrations.deleteMany({ 
  email: 'test@test.com' 
});
```

**Run queries:** Press `Ctrl+Alt+E`

### Snippets:

Create custom snippets for common code:
1. File → Preferences → User Snippets
2. Select "javascript.json"
3. Add your snippets

### Multi-Cursor Editing:

- `Ctrl+Alt+Up/Down` - Add cursor above/below
- `Ctrl+D` - Select next occurrence
- `Alt+Click` - Add cursor at click position

### Search Across Files:

- `Ctrl+Shift+F` - Search in all files
- Useful for finding where functions are used

---

## 🎯 Common Tasks

### Add New Event to Database:

**Method 1: MongoDB Extension**
1. MongoDB sidebar → events → Right-click
2. "Insert Document"
3. Paste JSON
4. Save

**Method 2: Playground**
```javascript
use('campus-events');
db.events.insertOne({
  title: "New Event",
  category: "tech",
  department: "csit",
  difficulty: "beginner",
  date: new Date("2026-04-01"),
  time: "2:00 PM",
  location: "Room 101",
  description: "Event description",
  capacity: 50,
  registered: 0,
  tags: ["tag1", "tag2"],
  organizer: "Department Name",
  price: "Free",
  image: "🎉",
  isActive: true
});
```

### View All Registrations for Event:

```javascript
use('campus-events');
db.registrations.find({ 
  event: ObjectId('EVENT_ID_HERE') 
}).pretty();
```

### Reset Database:

```bash
# In terminal
npm run seed
```

---

## 🐛 Troubleshooting

### MongoDB Extension Not Connecting:

1. Check MongoDB is running: `mongosh`
2. Restart VS Code
3. Reinstall MongoDB extension

### Live Server Not Working:

1. Install "Live Server" extension
2. Right-click `index.html`
3. If no option, restart VS Code

### Backend Not Starting:

1. Check port 5000 is free
2. Check MongoDB is running
3. Run `npm install` again

### Changes Not Reflecting:

**Backend:**
- Check nodemon is running
- Restart with `npm run dev`

**Frontend:**
- Hard refresh: `Ctrl+Shift+R`
- Clear cache: `Ctrl+Shift+Delete`

---

## 🎉 You're All Set!

Your VS Code is now fully integrated with:
- ✅ MongoDB database
- ✅ Backend server
- ✅ Frontend development
- ✅ Debugging tools
- ✅ Quick tasks

### Quick Start:
1. Press `` Ctrl+` `` → `npm run dev`
2. Right-click `index.html` → "Open with Live Server"
3. Click MongoDB icon → Browse database
4. Start coding! 🚀

---

## 📚 Additional Resources

- **MongoDB Extension Docs:** https://www.mongodb.com/docs/mongodb-vscode/
- **VS Code Shortcuts:** Press `Ctrl+K Ctrl+S`
- **Node.js Debugging:** https://code.visualstudio.com/docs/nodejs/nodejs-debugging

Happy Coding! 🎨
