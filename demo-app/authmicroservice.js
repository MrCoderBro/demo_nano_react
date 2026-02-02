/**
 * AUTH MICROSERVICE
 * 
 * Provides authentication and authorization middleware.
 * 
 * Usage:
 *   import { setupAuthMiddleware, setupAuthRoutes } from './authmicroservice.js';
 *   const { verifyUser, requireLogin, requireAdmin } = setupAuthMiddleware(db);
 *   app.use(verifyUser);
 *   setupAuthRoutes(app, db, bcrypt, logActivity);
 */

// Middleware factory - returns middleware functions that use the provided db
export function setupAuthMiddleware(db) {
  async function verifyUser(req, res, next) {
    const username = req.cookies.user4000;

    if (!username) {
      req.user = null;
      return next();
    }

    await db.read();
    const user = db.data.users.find(
      (u) => u.username === username && u.status === "active"
    );

    req.user = user || null;
    next();
  }

  async function requireLogin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Login required" });
    }
    next();
  }

  async function requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Login required" });
    }
    if (req.user.role !== "Administrator") {
      return res.status(403).json({ message: "Admin access only" });
    }
    next();
  }

  return { verifyUser, requireLogin, requireAdmin };
}

// Route setup - registers auth routes on the app
export function setupAuthRoutes(app, db, bcrypt, logActivity) {
  // Login Endpoint
  app.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      await db.read();
      const user = db.data.users.find((u) => u.username === username);

      if (!user) {
        return res.json({ success: false, message: "User not found" });
      }

      if (user.status !== "active") {
        return res.json({ success: false, message: "Account is pending approval" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.json({ success: false, message: "Invalid password" });
      }

      // Set cookie for authentication
      res.cookie("user4000", username, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      await logActivity(username, "Login", "User logged in successfully");

      res.json({
        success: true,
        message: "Login successful",
        user: { username: user.username, role: user.role },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Logout Endpoint
  app.post("/logout", (req, res) => {
    const username = req.cookies.user4000;
    res.clearCookie("user4000");
    if (username) {
      logActivity(username, "Logout", "User logged out");
    }
    res.json({ success: true, message: "Logged out" });
  });

  // Check Auth Status
  app.get("/check-auth", async (req, res) => {
    if (req.user) {
      res.json({
        loggedIn: true,
        user: { username: req.user.username, role: req.user.role },
      });
    } else {
      res.json({ loggedIn: false });
    }
  });
}
