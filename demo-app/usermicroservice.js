/**
 * USER MICROSERVICE
 * 
 * Provides user and role management endpoints.
 * 
 * Usage:
 *   import { setupUserRoutes } from './usermicroservice.js';
 *   setupUserRoutes(app, db, bcrypt, logActivity);
 */

export function setupUserRoutes(app, db, bcrypt, logActivity) {
  // Create User
  app.post("/create-user", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const createdBy = req.cookies.user4000 || "Public";

      await db.read();

      if (!username || !password || !role) {
        return res.json({ success: false, message: "Missing fields" });
      }

      if (db.data.users.find((u) => u.username === username)) {
        return res.json({ success: false, message: "Username already exists" });
      }

      const creator = db.data.users.find((u) => u.username === createdBy);
      const status =
        creator && creator.role === "Administrator"
          ? "active" // auto approve
          : "pending"; // needs admin approval

      const hashed = await bcrypt.hash(password, 10);

      db.data.users.push({
        username,
        password: hashed,
        role,
        status,
        createdBy,
      });

      await db.write();

      await logActivity(
        createdBy,
        status === "active" ? "Created user" : "Account requested",
        `Username: ${username}, Role: ${role}`
      );

      res.json({
        success: true,
        message:
          status === "active"
            ? "User created successfully."
            : "Account request submitted. Awaiting admin approval.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Get Users (Admin only)
  app.get("/users", async (req, res) => {
    const currentUser = req.cookies.user4000;
    await db.read();

    const userObj = db.data.users.find((u) => u.username === currentUser);
    if (!userObj || userObj.role !== "Administrator") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const users = db.data.users.map((u) => ({
      username: u.username,
      role: u.role,
      status: u.status,
    }));

    return res.json({ success: true, users });
  });

  // Update User
  app.post("/update-user", async (req, res) => {
    const currentUser = req.cookies.user4000;
    await db.read();

    const { username, role, password } = req.body;

    if (!username || !role) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const user = db.data.users.find((u) => u.username === username);
    if (!user) {
      console.log("DEBUG: User not found →", username);
      console.log("DEBUG: Existing users →", db.data.users);
      return res.json({ success: false, message: "User not found" });
    }

    user.role = role;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await db.write();

    await logActivity(
      currentUser,
      "Updated user",
      `Username: ${username}, New role: ${role}${password ? ", password changed" : ""}`
    );

    return res.json({ success: true, message: "User updated" });
  });

  // Delete User
  app.post("/delete-user", async (req, res) => {
    const currentUser = req.cookies.user4000;
    const { username } = req.body;

    await db.read();

    const index = db.data.users.findIndex((u) => u.username === username);
    if (index === -1) {
      return res.json({ success: false, message: "User not found" });
    }

    db.data.users.splice(index, 1);
    await db.write();

    await logActivity(currentUser, "Deleted user", `Username: ${username}`);
    return res.json({ success: true });
  });

  // Approve User
  app.post("/approve-user", async (req, res) => {
    const adminUser = req.cookies.user4000;
    const { username } = req.body;

    await db.read();

    const admin = db.data.users.find((u) => u.username === adminUser);
    if (!admin || admin.role !== "Administrator") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const user = db.data.users.find((u) => u.username === username);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = "active";
    await db.write();

    await logActivity(adminUser, "Approved user", `Username: ${username}`);
    res.json({ success: true });
  });

  // Reject User
  app.post("/reject-user", async (req, res) => {
    const { username } = req.body;
    await db.read();

    const index = db.data.users.findIndex((u) => u.username === username);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    db.data.users.splice(index, 1);
    await db.write();

    const adminUser = req.cookies.user4000;
    await logActivity(adminUser, "Rejected user", `Username: ${username}`);
    res.json({ success: true });
  });

  // Get Roles
  app.get("/roles", async (req, res) => {
    await db.read();
    res.json({ roles: db.data.roles });
  });

  // Create Role
  app.post("/create-role", async (req, res) => {
    const currentUser = req.cookies.user4000;
    const { role } = req.body;

    await db.read();

    const admin = db.data.users.find((u) => u.username === currentUser);
    if (!admin || admin.role !== "Administrator") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!role) {
      return res.json({ success: false, message: "Role name required" });
    }

    db.data.roles ||= [];
    if (db.data.roles.includes(role)) {
      return res.json({ success: false, message: "Role already exists" });
    }

    db.data.roles.push(role);
    await db.write();

    await logActivity(currentUser, "Created role", role);
    res.json({ success: true });
  });

  // Update Role
  app.post("/update-role", async (req, res) => {
    const currentUser = req.cookies.user4000;
    const { oldRole, newRole } = req.body;

    await db.read();

    const admin = db.data.users.find((u) => u.username === currentUser);
    if (!admin || admin.role !== "Administrator") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!oldRole || !newRole) {
      return res.json({ success: false, message: "Missing fields" });
    }

    if (!db.data.roles.includes(oldRole)) {
      return res.json({ success: false, message: "Old role not found" });
    }

    if (db.data.roles.includes(newRole)) {
      return res.json({ success: false, message: "Role already exists" });
    }

    // Update role in roles array
    db.data.roles = db.data.roles.map((r) => (r === oldRole ? newRole : r));

    // Update role for users using this role
    db.data.users.forEach((u) => {
      if (u.role === oldRole) {
        u.role = newRole;
      }
    });

    await db.write();
    await logActivity(currentUser, "Updated role", `${oldRole} → ${newRole}`);
    res.json({ success: true });
  });

  // Delete Role
  app.post("/delete-role", async (req, res) => {
    const currentUser = req.cookies.user4000;
    const { role } = req.body;

    await db.read();

    const admin = db.data.users.find((u) => u.username === currentUser);
    if (!admin || admin.role !== "Administrator") {
      return res.status(403).json({ success: false });
    }

    if (["Administrator", "User"].includes(role)) {
      return res.json({
        success: false,
        message: "Default roles cannot be deleted",
      });
    }

    // Prevent deletion if role is in use
    if (db.data.users.some((u) => u.role === role)) {
      return res.json({ success: false, message: "Role is assigned to users" });
    }

    db.data.roles = db.data.roles.filter((r) => r !== role);
    await db.write();

    await logActivity(currentUser, "Deleted role", role);
    res.json({ success: true });
  });
}
