# 🚀 TeamFinder — NBKRIST Hackathon & SIH Collaboration Platform

A full-stack **MERN** (MongoDB, Express.js, React, Node.js) web application designed specifically for students of **N.B.K.R. Institute of Science and Technology (NBKRIST)** to form, discover, and organize winning teams for the **Smart India Hackathon (SIH)** and collegiate hackathons.

---

## 🌟 Key Features

### 🎓 1. Domain-Restricted Authentication (`@nbkrist.org`)
* **Strict Email Enforcement**: Only allows accounts with emails ending in `@nbkrist.org` (validated on both client and server).
* **Student Registration Fields**: Full Name, Registered Roll Number (e.g., `21KB1A0501`), NBKRIST Email, Password, Department (CSE, ECE, AI&DS, IT, EEE, MECH, CIVIL), Academic Year (1st–4th), Gender, Technical Skills tags, and Bio.
* **JWT Authentication**: Secure token-based session management with HTTP interceptors.

### 🏆 2. Smart India Hackathon (SIH) Compliance Engine
* **6-Member Enforcement**: Tracks team capacity against SIH's standard 6-member team size.
* **Mandatory Female Teammate Indicator**: Real-time visual badge tracking whether the team complies with the national SIH rule requiring at least 1 female student.
* **Hackathon Exclusivity Rule**: Prevents students from creating or joining multiple teams for the same hackathon event.

### 🔍 3. Live Team Discovery & Filtering
* Multi-parameter filter panel:
  * **By Hackathon Event**: Smart India Hackathon, Internal Hackathon, Open National Hackathons.
  * **By Skills Needed**: Filter or search for React, Node.js, Python, IoT, Figma, Flutter, etc.
  * **By Department**: Filter teams specifically looking for CSE, ECE, AI&DS, etc.
  * **By Availability**: Open teams vs. full teams.
  * **Special SIH Toggle**: One-click filter to find teams actively prioritizing female teammates.

### 🤝 4. Team Creation & Join Request Workflow
* **Team Creation**: Team leaders define team name, hackathon target, problem/domain, description, required member count, skills needed, and requirements.
* **Pitch & Join Request**: Students send join requests along with their introduction pitch and qualifications.
* **Leader Management Console**: Leaders can review applicant details (name, roll number, department, year, gender, pitch) and **Accept** or **Reject** with one click.
* **Roster Management**: Leaders can remove members or inspect student credentials.

### 🛡️ 5. Admin Coordinator Dashboard & Excel Export
* Protected coordinator dashboard accessible by faculty/admin.
* Institutional metrics (Total Students, Total Teams, SIH Teams, Open/Full Teams, Total Requests).
* Complete student directory and team audit modal with roll numbers.
* **One-Click Excel (`.xlsx`) Export**: Downloads a formatted official roster containing Team Name, Hackathon, Leader Name & Roll No, Member Names & Roll Nos, Department, Year, Gender, and SIH compliance status for direct submission to the SIH nodal center!

---

## 📂 Project Structure

```text
TeamCollab/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx      # Top navigation with role badges & mobile menu
│   │   │   ├── Footer.jsx      # Institution footer & links
│   │   │   ├── TeamCard.jsx    # Card with SIH badges & member counts
│   │   │   ├── SIHBadge.jsx    # Dynamic SIH compliance indicator
│   │   │   └── RequestModal.jsx# Join request submission modal
│   │   ├── pages/              # Main application views
│   │   │   ├── Home.jsx        # Landing page with SIH guidelines & live vacancies
│   │   │   ├── Login.jsx       # Auth login with 1-click demo credentials
│   │   │   ├── Register.jsx    # Student signup with @nbkrist.org validation
│   │   │   ├── TeamsList.jsx   # Team directory with multi-filter search
│   │   │   ├── TeamDetails.jsx # Detailed team view with roll number roster
│   │   │   ├── CreateTeam.jsx  # Team creation form with SIH presets
│   │   │   ├── MyTeams.jsx     # Leader & applicant management hub
│   │   │   ├── Profile.jsx     # Student profile editor
│   │   │   └── AdminDashboard.jsx # Coordinator dashboard with Excel export
│   │   ├── context/            # AuthContext with persistent JWT state
│   │   ├── services/           # Axios client configured with JWT interceptors
│   │   ├── App.jsx             # Main router and state coordinator
│   │   ├── main.jsx            # React root entry
│   │   └── index.css           # Tailwind design tokens & utilities
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend API
│   ├── config/
│   │   └── db.js               # MongoDB connection with in-memory fallback
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # Student schema with domain validation & bcrypt
│   │   ├── Team.js             # Team schema with SIH rules & member arrays
│   │   └── JoinRequest.js      # Join application schema (pending/accepted/rejected)
│   ├── controllers/            # Route business logic
│   │   ├── authController.js   # Register, Login, GetMe, UpdateProfile
│   │   ├── teamController.js   # Create, List, Details, Delete, RemoveMember
│   │   ├── requestController.js# CreateRequest, RespondRequest, ListRequests
│   │   └── adminController.js  # Admin stats, tables, Excel export (.xlsx)
│   ├── routes/                 # Express API route endpoints
│   │   ├── authRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── requestRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/             # JWT protect, adminOnly, and error handlers
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── errorMiddleware.js
│   ├── utils/                  # Seed script & test suite
│   │   └── seedData.js         # Comprehensive NBKRIST demo dataset
│   ├── server.js               # Express application entrypoint
│   ├── package.json
│   └── .env.example
│
├── package.json                # Root orchestrator with concurrently scripts
├── README.md                   # Full documentation & setup guide
└── .gitignore
```

---

## ⚡ Quick Start Guide

### Prerequisites
* **Node.js** (v18 or newer recommended)
* **npm** (v9 or newer)
* *Optional*: Local MongoDB or MongoDB Atlas URI (if not provided, an automatic in-memory MongoDB instance will boot seamlessly for development).

---

### 1. Installation

From the project root:

```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or install separately:
```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

---

### 2. Environment Configuration

In the `server/` directory, copy the example environment file:

```bash
cd server
cp .env.example .env
```

Default `.env` values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/teamfinder
JWT_SECRET=nbkrist_teamfinder_jwt_secret_key_2025_secure_token
CLIENT_URL=http://localhost:5173
```

> 💡 **Zero Friction DB**: If your local MongoDB daemon is not running, the server automatically starts an embedded in-memory database server so you can test immediately without setup errors!

---

### 3. Seed Demo Data

Populate the database with verified NBKRIST students across departments (CSE, AI&DS, ECE, EEE), teams, and pending join requests:

```bash
# From workspace root:
npm run seed

# Or from the server directory:
cd server
npm run seed
```

---

### 4. Running the Application

You can run both backend and frontend concurrently with a single command:

```bash
# From workspace root:
npm run dev
```

Or run them in separate terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

Now open **http://localhost:5173** in your browser!

---

## 🔑 Production Authentication & Administrator Access

The production database is clean of dummy student records. Students register directly with their official `@nbkrist.org` email and roll number.

| Account Type | Email | Default Password / Access | Role |
| :--- | :--- | :--- | :--- |
| **Faculty Coordinator (Admin)** | `admin@nbkrist.org` | Configured in `server/.env` (`ADMIN_PASSWORD`) | Full Institutional Dashboard & Excel Export |
| **Student Accounts** | `[rollnumber]@nbkrist.org` | Created via Student Registration | Browse, Create, and Join Teams |

> 📖 **Comprehensive Application Flow Guide**: For detailed diagrams, user journeys, schema structures, and coordinator workflows, see the [Application Flow & Operations Guide](file:///c:/Users/HP/Desktop/projects/TeamCollab/docs/APPLICATION_FLOW_AND_OPERATIONS_GUIDE.md).

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register student (validates `@nbkrist.org`, rolls, dept, gender, etc.)
* `POST /api/auth/login` — Sign in and issue JWT token
* `GET /api/auth/me` — Retrieve current authenticated profile (Protected)
* `PUT /api/auth/profile` — Update student profile details (Protected)

### Teams (`/api/teams`)
* `GET /api/teams` — List teams with filters (`hackathon`, `status`, `department`, `genderReq`, `search`)
* `GET /api/teams/:id` — Full team dossier with leader and member profiles
* `POST /api/teams` — Create a new team (prevents duplicate teams for the same hackathon)
* `GET /api/teams/my-teams` — Get teams user leads or belongs to (Protected)
* `DELETE /api/teams/:id` — Delete a team (Leader or Admin)
* `DELETE /api/teams/:id/members/:memberId` — Remove a member from team (Leader or Admin)

### Join Requests (`/api/requests`)
* `POST /api/requests/:teamId` — Send a join request with pitch message
* `GET /api/requests/team/:teamId` — View all applicants for a team (Leader only)
* `PUT /api/requests/:id` — Accept or reject a request (Leader only; accepts up to team limit)
* `GET /api/requests/my/sent` — View student's sent join requests and statuses

### Coordinator & Admin (`/api/admin`)
* `GET /api/admin/stats` — Metrics overview (Students, Teams, SIH, Open, Requests)
* `GET /api/admin/teams` — All teams with detailed rosters
* `GET /api/admin/students` — All registered students directory
* `GET /api/admin/export-excel` — **Download official `.xlsx` spreadsheet roster**

---

## 🧪 Verification & Automated Validation

The project includes an end-to-end integration test verifying all core workflows:

```bash
# Run server test suite
cd server
npm test
```

This verifies:
1. Student registration with `@nbkrist.org` email validation.
2. Rejection of non-NBKRIST emails (e.g., `@gmail.com`).
3. Student login and JWT generation.
4. Team creation and duplicate hackathon prevention.
5. Join request submission.
6. Team leader acceptance and team roster update.
7. Admin authentication and Excel (`.xlsx`) export generation.

---

## 🏛️ Built for NBKRIST
* **Institution**: N.B.K.R. Institute of Science & Technology, Vidyanagar, Andhra Pradesh.
* **Target Events**: Smart India Hackathon (SIH), Inter-College Hackathons, Innovation Challenges.
