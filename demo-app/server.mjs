/**
 * DEMO SERVER - Microservices Integration
 * 
 * This server integrates:
 * 1. User Microservice (usermicroservice.js) - User CRUD operations
 * 2. Auth Microservice (authmicroservice.js) - Authentication middleware
 * 3. Calendar/Events Microservice - FullCalendar backend
 * 
 * Database: LowDB (JSON file-based database)
 */

import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

// Import microservices
import { setupAuthMiddleware, setupAuthRoutes } from "./authmicroservice.js";
import { setupUserRoutes } from "./usermicroservice.js";

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database Setup (LowDB)
const adapter = new JSONFile("db.json");
const db = new Low(adapter, {
  users: [],
  roles: ["Administrator", "User"],
  events: [],
  activityLog: [],
});

// Initialize database
await db.read();
db.data ||= { users: [], roles: ["Administrator", "User"], events: [], activityLog: [] };

// ============================================
// ACTIVITY LOGGING HELPER
// ============================================
async function logActivity(user, action, details = "") {
  await db.read();
  db.data.activityLog ||= [];
  db.data.activityLog.push({
    timestamp: new Date().toISOString(),
    user,
    action,
    details,
  });
  await db.write();
}

// ============================================
// SETUP MICROSERVICES
// ============================================

// 1. Auth Microservice - Setup middleware
const { verifyUser, requireLogin, requireAdmin } = setupAuthMiddleware(db);
app.use(verifyUser);

// 2. Auth Microservice - Setup routes (login, logout, check-auth)
setupAuthRoutes(app, db, bcrypt, logActivity);

// 3. User Microservice - Setup routes (users, roles)
setupUserRoutes(app, db, bcrypt, logActivity);

// ============================================
// CALENDAR/EVENTS MICROSERVICE
// ============================================

// Get Events
app.get("/events", async (req, res) => {
  await db.read();
  res.json({ success: true, events: db.data.events || [] });
});

// Create Event
app.post("/events", requireLogin, async (req, res) => {
  try {
    const { title, description, start, end, allDay } = req.body;
    const userId = req.user.username;

    if (!title || !start) {
      return res.json({ success: false, message: "Title and start date required" });
    }

    await db.read();
    db.data.events ||= [];

    const newEvent = {
      id: String(Date.now()),
      title,
      start,
      end: end || start,
      description: description || "",
      allDay: allDay ?? true,
      userId,
      createdAt: new Date().toISOString(),
    };

    db.data.events.push(newEvent);
    await db.write();

    await logActivity(userId, "Created event", title);
    res.json({ success: true, event: newEvent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update Event
app.put("/events/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, allDay } = req.body;

    await db.read();
    const event = db.data.events.find((e) => e.id === id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Only owner or admin can update
    if (event.userId !== req.user.username && req.user.role !== "Administrator") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (start) event.start = start;
    if (end) event.end = end;
    if (allDay !== undefined) event.allDay = allDay;
    event.updatedAt = new Date().toISOString();

    await db.write();

    await logActivity(req.user.username, "Updated event", title || event.title);
    res.json({ success: true, event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete Event
app.delete("/events/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.read();
    const index = db.data.events.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const event = db.data.events[index];

    // Only owner or admin can delete
    if (event.userId !== req.user.username && req.user.role !== "Administrator") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    db.data.events.splice(index, 1);
    await db.write();

    await logActivity(req.user.username, "Deleted event", event.title);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║    🚀 Microservices Demo Server Running!       ║
║                                                ║
║    API Server: http://localhost:${PORT}           ║
║    Frontend:   Run 'npm start' separately      ║
║                                                ║
║    Demo Login: admin / admin                   ║
╚════════════════════════════════════════════════╝
  `);
});
