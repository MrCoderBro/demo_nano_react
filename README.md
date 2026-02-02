# 🚀 Microservices Demo Application

A reference demo application showcasing how to integrate and use the microservices for future teams.

## Microservices Included

### 1. 🔐 Auth Microservice (`authmicroservice.js`)
Handles user authentication and authorization.

**Middleware Functions:**
- `verifyUser` - Checks if user is logged in via cookie
- `requireLogin` - Protects routes requiring authentication
- `requireAdmin` - Protects admin-only routes

**Endpoints:**
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /check-auth` - Check authentication status

### 2. 👥 User Microservice (`usermicroservice.js`)
Handles user and role management.

**User Endpoints:**
- `POST /create-user` - Create new user
- `GET /users` - Get all users (admin only)
- `POST /update-user` - Update user details
- `POST /delete-user` - Delete a user
- `POST /approve-user` - Approve pending user
- `POST /reject-user` - Reject pending user

**Role Endpoints:**
- `GET /roles` - Get all roles
- `POST /create-role` - Create new role
- `POST /update-role` - Update role name
- `POST /delete-role` - Delete a role

### 3. 📅 Calendar Microservice
FullCalendar integration with backend event management.

**Frontend:** Uses `@fullcalendar/react` with plugins:
- `dayGridPlugin` - Month view
- `timeGridPlugin` - Week/Day views
- `interactionPlugin` - Click/drag events

**Endpoints:**
- `GET /events` - Get all events
- `POST /events` - Create new event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the application
```bash
# Start both backend and frontend together
npm run dev

# Or run separately:
npm run server  # Start backend (port 4000)
npm start       # Start frontend (port 3000)
```

### 3. Access the app
- **Frontend:** http://localhost:3000
- **API Server:** http://localhost:4000

### 4. Demo Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## Database

Uses **LowDB** (JSON file-based database) - see `db.json`

**Data Structure:**
```json
{
  "users": [...],
  "roles": ["Administrator", "User"],
  "events": [...],
  "activityLog": [...]
}
```

---

## Project Structure

```
demo-app/
├── server.mjs           # Main server with all microservices
├── authmicroservice.js  # Auth middleware reference
├── usermicroservice.js  # User endpoints reference
├── db.json              # LowDB database file
├── vite.config.js       # Vite config with API proxy
├── package.json
├── index.html
└── src/
    ├── App.jsx          # Main React app with demo UI
    ├── index.jsx
    └── components/
        ├── Calendar.jsx # FullCalendar component
        └── index.css
```

---

      ## Application Architecture Flow

      ```
      ┌─────────────────────────────────────────────────────────────────────────┐
      │                           FRONTEND (React + Vite)                       │
      │                              localhost:3000                             │
      │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐  │
      │  │   Login/    │    │    User     │    │      Calendar Component     │  │
      │  │  Register   │    │ Management  │    │       (FullCalendar)        │  │
      │  └──────┬──────┘    └──────┬──────┘    └──────────────┬──────────────┘  │
      └─────────┼──────────────────┼─────────────────────────┼──────────────────┘
          │                  │                         │
          │ fetch()          │ fetch()                 │ fetch()
          ▼                  ▼                         ▼
      ┌─────────────────────────────────────────────────────────────────────────┐
      │                    VITE PROXY (vite.config.js)                          │
      │              Forwards /login, /users, /events → localhost:4000          │
      └─────────────────────────────────────────────────────────────────────────┘
          │                  │                         │
          ▼                  ▼                         ▼
      ┌─────────────────────────────────────────────────────────────────────────┐
      │                      BACKEND SERVER (server.mjs)                        │
      │                           localhost:4000                                │
      │  ┌──────────────────────────────────────────────────────────────────┐   │
      │  │                    MIDDLEWARE CHAIN                              │   │
      │  │  1. express.json()  →  2. cookieParser()  →  3. verifyUser()    │   │
      │  └──────────────────────────────────────────────────────────────────┘   │
      │                                │                                        │
      │                    ┌───────────┴───────────┐                           │
      │                    ▼                       ▼                           │
      │  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
      │  │   AUTH MICROSERVICE     │  │      USER MICROSERVICE              │  │
      │  │  (authmicroservice.js)  │  │    (usermicroservice.js)            │  │
      │  │                         │  │                                     │  │
      │  │  • POST /login          │  │  • POST /create-user                │  │
      │  │  • POST /logout         │  │  • GET  /users                      │  │
      │  │  • GET /check-auth     │  │  • POST /approve-user               │  │
      │  │                         │  │  • GET  /roles                      │  │
      │  │  Middleware:            │  │  • POST /create-role, etc.          │  │
      │  │  • verifyUser           │  │                                     │  │
      │  │  • requireLogin         │  └─────────────────────────────────────┘  │
      │  │  • requireAdmin         │                                           │
      │  └─────────────────────────┘                                           │
      │                                                                         │
      │  ┌─────────────────────────────────────────────────────────────────┐   │
      │  │              CALENDAR/EVENTS MICROSERVICE                       │   │
      │  │                    (in server.mjs)                              │   │
      │  │                                                                 │   │
      │  │  • GET    /events         ← Anyone can view                     │   │
      │  │  • POST   /events         ← requireLogin middleware             │   │
      │  │  • PUT    /events/:id     ← requireLogin + owner/admin check    │   │
      │  │  • DELETE /events/:id     ← requireLogin + owner/admin check    │   │
      │  └─────────────────────────────────────────────────────────────────┘   │
      └─────────────────────────────────────────────────────────────────────────┘
                  │
                  ▼
      ┌─────────────────────────────────────────────────────────────────────────┐
      │                         DATABASE (LowDB)                                │
      │                            db.json                                      │
      │  {                                                                      │
      │    "users": [{ username, password, role, status }],                     │
      │    "roles": ["Administrator", "User"],                                  │
      │    "events": [{ id, title, start, end, userId }],                       │
      │    "activityLog": [{ timestamp, user, action, details }]                │
      │  }                                                                      │
      └─────────────────────────────────────────────────────────────────────────┘
      ```
## For Future Teams

This demo shows the **basic integration** of all microservices. To use in your own project:

1. **Copy the microservice files** you need
2. **Set up your database** (LowDB or your preferred DB)
3. **Apply middleware** for authentication
4. **Connect frontend** to API endpoints

See the API Reference tab in the app for complete endpoint documentation!

## Babel transforms

The Babel preset [babel-preset-nano-react-app](https://github.com/nano-react-app/babel-preset-nano-react-app) is used to support the same transforms that Create React App supports.

The Babel configuration lives inside `package.json` and will override an external `.babelrc` file, so if you want to use `.babelrc` remember to delete the `babel` property inside `package.json`.


## Deploy to GitHub Pages

You can also deploy your project using GitHub pages.
First install the `gh-pages` [package](https://github.com/tschaub/gh-pages):

`npm i -D gh-pages`

Use the following scripts for deployment:

```js
"scripts": {
  "start": "vite",
  "build": "vite build",
  "predeploy": "rm -rf dist && vite build",
  "deploy": "gh-pages -d dist"
},
```

Then follow the normal procedure in GitHub Pages and select the `gh-pages` branch.
