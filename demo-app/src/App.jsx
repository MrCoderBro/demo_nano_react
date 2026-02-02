import React, { useState, useEffect } from "react";
import Calendar from "./components/Calendar";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * DEMO APPLICATION
 * This app demonstrates how to use the microservices:
 * 1. User Microservice - user registration, login, management
 * 2. Auth Microservice - authentication/authorization middleware
 * 3. Calendar Microservice - FullCalendar integration with events
 */

function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form States
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", role: "User" });

  // Data States
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");

  // Active Tab
  const [activeTab, setActiveTab] = useState("calendar");

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchEvents();
      if (user?.role === "Administrator") {
        fetchUsers();
      }
    }
  }, [isLoggedIn, user]);

  // ============================================
  // AUTH MICROSERVICE ENDPOINTS
  // ============================================

  const checkAuth = async () => {
    try {
      const res = await fetch("/check-auth");
      const data = await res.json();
      if (data.loggedIn) {
        setUser(data.user);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      setMessage(data.message);
      if (data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        setLoginForm({ username: "", password: "" });
      }
    } catch (err) {
      setMessage("Login failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "POST" });
      setUser(null);
      setIsLoggedIn(false);
      setUsers([]);
      setEvents([]);
      setMessage("Logged out successfully");
    } catch (err) {
      setMessage("Logout failed");
    }
  };

  // ============================================
  // USER MICROSERVICE ENDPOINTS
  // ============================================

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      setMessage(data.message);
      if (data.success) {
        setRegisterForm({ username: "", password: "", role: "User" });
        if (isLoggedIn && user?.role === "Administrator") {
          fetchUsers();
        }
      }
    } catch (err) {
      setMessage("Registration failed");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/roles");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const approveUser = async (username) => {
    try {
      const res = await fetch("/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setMessage(data.success ? "User approved" : data.message);
      fetchUsers();
    } catch (err) {
      setMessage("Failed to approve user");
    }
  };

  const deleteUser = async (username) => {
    try {
      const res = await fetch("/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setMessage(data.success ? "User deleted" : data.message);
      fetchUsers();
    } catch (err) {
      setMessage("Failed to delete user");
    }
  };

  // ============================================
  // CALENDAR MICROSERVICE ENDPOINTS
  // ============================================

  const fetchEvents = async () => {
    try {
      const res = await fetch("/events");
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const createEvent = async (eventData) => {
    try {
      const res = await fetch("/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
        setMessage("Event created!");
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Failed to create event");
    }
  };

  // ============================================
  // RENDER UI
  // ============================================

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-center">🚀 Microservices Demo App</h1>
          <p className="text-center text-muted">
            Demonstrating User, Auth, and Calendar Microservices
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="row mb-3">
          <div className="col-md-6 mx-auto">
            <div className="alert alert-info alert-dismissible fade show">
              {message}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMessage("")}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Status Bar */}
      <div className="row mb-4">
        <div className="col">
          <div className="card bg-light">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <strong>Auth Status:</strong>{" "}
                {isLoggedIn ? (
                  <span className="badge bg-success">
                    Logged in as {user?.username} ({user?.role})
                  </span>
                ) : (
                  <span className="badge bg-secondary">Not logged in</span>
                )}
              </div>
              {isLoggedIn && (
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!isLoggedIn ? (
        // Login/Register Forms
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">🔐 Login (Auth Microservice)</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Login
                  </button>
                </form>
                <hr />
                <small className="text-muted">
                  Demo credentials: <code>admin</code> / <code>admin123</code>
                </small>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">📝 Register (User Microservice)</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleRegister}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={registerForm.role}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, role: e.target.value })
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-success w-100">
                    Register
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Logged In Content
        <>
          {/* Navigation Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
                onClick={() => setActiveTab("calendar")}
              >
                📅 Calendar
              </button>
            </li>
            {user?.role === "Administrator" && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                  onClick={() => setActiveTab("users")}
                >
                  👥 User Management
                </button>
              </li>
            )}
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "docs" ? "active" : ""}`}
                onClick={() => setActiveTab("docs")}
              >
                📖 API Reference
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          {activeTab === "calendar" && (
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">📅 Calendar (FullCalendar Microservice)</h5>
              </div>
              <div className="card-body">
                <Calendar events={events} onCreateEvent={createEvent} user={user} />
              </div>
            </div>
          )}

          {activeTab === "users" && user?.role === "Administrator" && (
            <div className="card">
              <div className="card-header bg-warning">
                <h5 className="mb-0">👥 User Management (User Microservice)</h5>
              </div>
              <div className="card-body">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.username}>
                        <td>{u.username}</td>
                        <td>
                          <span className="badge bg-secondary">{u.role}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              u.status === "active" ? "bg-success" : "bg-warning"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td>
                          {u.status === "pending" && (
                            <button
                              className="btn btn-sm btn-success me-1"
                              onClick={() => approveUser(u.username)}
                            >
                              Approve
                            </button>
                          )}
                          {u.username !== "admin" && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteUser(u.username)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">📖 API Reference for Future Teams</h5>
              </div>
              <div className="card-body">
                <ApiDocs />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// API Documentation Component
function ApiDocs() {
  return (
    <div className="accordion" id="apiDocs">
      {/* Auth Microservice */}
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button
            className="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#authDocs"
          >
            🔐 Auth Microservice (authmicroservice.js)
          </button>
        </h2>
        <div id="authDocs" className="accordion-collapse collapse show">
          <div className="accordion-body">
            <h6>Middleware Functions:</h6>
            <ul>
              <li>
                <code>verifyUser</code> - Checks if user is logged in via cookie
              </li>
              <li>
                <code>requireLogin</code> - Protects routes requiring authentication
              </li>
              <li>
                <code>requireAdmin</code> - Protects admin-only routes
              </li>
            </ul>
            <h6>Endpoints:</h6>
            <pre className="bg-light p-2">
{`POST /login     - Login user
POST /logout    - Logout user  
GET  /check-auth - Check auth status`}
            </pre>
          </div>
        </div>
      </div>

      {/* User Microservice */}
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button
            className="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#userDocs"
          >
            👥 User Microservice (usermicroservice.js)
          </button>
        </h2>
        <div id="userDocs" className="accordion-collapse collapse">
          <div className="accordion-body">
            <h6>User Endpoints:</h6>
            <pre className="bg-light p-2">
{`POST /create-user   - Create new user
GET  /users         - Get all users (admin only)
POST /update-user   - Update user details
POST /delete-user   - Delete a user
POST /approve-user  - Approve pending user
POST /reject-user   - Reject pending user`}
            </pre>
            <h6>Role Endpoints:</h6>
            <pre className="bg-light p-2">
{`GET  /roles        - Get all roles
POST /create-role  - Create new role
POST /update-role  - Update role name
POST /delete-role  - Delete a role`}
            </pre>
          </div>
        </div>
      </div>

      {/* Calendar Microservice */}
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button
            className="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#calendarDocs"
          >
            📅 Calendar Microservice
          </button>
        </h2>
        <div id="calendarDocs" className="accordion-collapse collapse">
          <div className="accordion-body">
            <h6>FullCalendar Integration:</h6>
            <p>Uses @fullcalendar/react with plugins:</p>
            <ul>
              <li><code>dayGridPlugin</code> - Month view</li>
              <li><code>timeGridPlugin</code> - Week/Day views</li>
              <li><code>interactionPlugin</code> - Click/drag events</li>
            </ul>
            <h6>Event Endpoints:</h6>
            <pre className="bg-light p-2">
{`GET    /events     - Get all events
POST   /events     - Create new event
PUT    /events/:id - Update event
DELETE /events/:id - Delete event`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;