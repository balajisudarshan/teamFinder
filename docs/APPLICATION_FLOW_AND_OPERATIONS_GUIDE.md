# 📘 TeamFinder — Application Flow, Architecture & Operations Guide
### Official Hackathon & SIH Collaboration Platform for N.B.K.R. Institute of Science & Technology (NBKRIST)

---

## 📌 1. System Overview & Purpose

**TeamFinder** is a specialized MERN (MongoDB, Express.js, React, Node.js) web application engineered exclusively for the students and faculty of **N.B.K.R. Institute of Science and Technology (Autonomous), Vidyanagar, Andhra Pradesh**.

The platform solves the logistical challenges of student team formation for national hackathons, specifically the **Smart India Hackathon (SIH)** organized by the Ministry of Education & AICTE:

1. **Academic Verification**: Restricts account creation strictly to verified `@nbkrist.org` student email addresses and registered roll numbers.
2. **SIH Compliance Automation**: Dynamically enforces the mandatory **6-member team size** and tracks the presence of at least **one female teammate** per team.
3. **Exclusivity Engine**: Guarantees that no student is registered in multiple teams for the same hackathon.
4. **Interdisciplinary Teammate Discovery**: Allows team leaders to search, filter, and recruit peers across CSE, ECE, AI&DS, EEE, IT, MECH, and CIVIL departments.
5. **Coordinator Reporting**: Equips faculty coordinators with an administrative dashboard and a **one-click Excel (.xlsx) roster generator** ready for SIH portal nodal submission.

---

## 🔄 2. End-to-End Application Flows

```
               [ NBKRIST Student ]                          [ Faculty Coordinator ]
                       │                                               │
           ┌───────────┴───────────┐                                   │
           ▼                       ▼                                   ▼
    [ Registration ]        [ User Login ]                     [ Admin Console ]
     @nbkrist.org only       JWT Issued                                │
           │                       │                                   ├─ Institutional Metrics
           └───────────┬───────────┘                                   ├─ Team Roster Dossiers
                       │                                               ├─ Student Directory
         ┌─────────────┴─────────────┐                                 └─ Excel Export (.xlsx)
         ▼                           ▼
   [ Create Team ]             [ Browse Teams ]
    SIH 6-Member Preset         Multi-Filter Discovery
    Exclusivity Check           (Skills, Dept, Female Rule)
         │                           │
         │                           ▼
         │                    [ Send Join Request ]
         │                     Pitch / Introduction
         │                           │
         └─────────────┬─────────────┘
                       ▼
             [ Team Leader Hub ]
             "My Teams" Console
             Review Pitch & Roll No
             ┌─────────┴─────────┐
             ▼                   ▼
        [ Accept ]          [ Decline ]
     Member Added to Roster  Request Closed
     Auto-SIH Recalculation
```

---

### Flow 1: Student Registration & Domain Validation
1. **Navigation**: User visits `http://localhost:5173` and clicks **Register**.
2. **Data Collected**:
   - **Full Name**: e.g., `Sneha Reddy`
   - **Registered Roll Number**: e.g., `22KB1A0512` (stored uppercase in database).
   - **NBKRIST Email**: Must strictly end with `@nbkrist.org` (e.g., `sneha.22@nbkrist.org`).
   - **Password**: Minimum 6 characters (hashed with `bcryptjs`, 10 salt rounds).
   - **Department**: `CSE`, `ECE`, `AI&DS`, `EEE`, `IT`, `MECH`, `CIVIL`, or `OTHER`.
   - **Academic Year**: `1st Year`, `2nd Year`, `3rd Year`, or `4th Year`.
   - **Gender**: `Male`, `Female`, or `Other` (essential for SIH compliance tracking).
   - **Skills**: Comma-separated tags (e.g., `React, Python, IoT, Figma`).
   - **Bio**: Brief introduction and project interests.
3. **Validation Logic**:
   - **Client-Side**: Live warning prevents form submission if email does not end with `@nbkrist.org`.
   - **Server-Side**: Controller validates normalized email domain with HTTP 400 rejection if non-NBKRIST domain is detected. Checks for duplicate roll number or email.
4. **Result**: Account created, JWT signed with user ID and role (`student`), stored in browser `localStorage`, and session authenticated.

---

### Flow 2: Student Sign-In & Session Handling
1. **Navigation**: User navigates to **Sign In** (`/login`).
2. **Submission**: Enters NBKRIST email and password.
3. **Server Validation**:
   - Finds user record by normalized email.
   - Compares password hash via `bcrypt.compare()`.
   - Generates JWT token signed with `JWT_SECRET` (valid for 30 days).
4. **Client State**:
   - `AuthContext` stores token and decoded user profile.
   - Axios request interceptor automatically attaches `Authorization: Bearer <token>` to all subsequent API calls.
   - Top navigation dynamically displays student's name, monospace roll number, and contextual menu items.

---

### Flow 3: Creating a Hackathon Team & Exclusivity Constraint
1. **Navigation**: Authenticated user clicks **Create Team** in the navbar.
2. **Form Parameters**:
   - **Team Name**: e.g., `AgriVision NBKR`
   - **Target Hackathon**: Preset dropdown (`Smart India Hackathon (SIH)`, `NBKRIST Internal Hackathon`, `Open National Hackathon`, etc.).
   - **Problem Domain**: e.g., `Agriculture & Rural Technology`
   - **Team Size**: Defaults to **6 members** when SIH is selected.
   - **Description**: Detailed pitch and technical vision.
   - **Skills Needed**: e.g., `React, Python, OpenCV, IoT`
   - **Inclusivity Preferences**:
     - *Female Teammate Priority Checkbox* (automatically enabled for SIH).
     - *Target Department & Target Academic Year*.
3. **Exclusivity Enforcement**:
   - The backend queries existing teams for the same hackathon.
   - If the user is **already a team leader or member** of another team participating in that hackathon event, the server rejects team creation with HTTP 400:
     > *"You are already part of team '[Existing Team]' for Smart India Hackathon (SIH). You cannot create or join multiple teams for the same hackathon."*
4. **Result**: Team record created. Creator is automatically designated as **Leader** and added as member #1 in the team roster.

---

### Flow 4: Teammate Discovery & Multi-Parameter Search
1. **Navigation**: User clicks **Browse Teams** in the navbar.
2. **Filtering Controls**:
   - **Search Bar**: Live search querying team names, problem descriptions, or skill tags.
   - **Hackathon Selector**: Filter by specific event.
   - **Availability Selector**: Filter by `Open (Recruiting)` vs. `Full (Roster Complete)`.
   - **Department Selector**: Filter teams seeking specific department backgrounds (`CSE`, `ECE`, `AI&DS`, etc.).
   - **SIH Female Rule Toggle**: Checkbox `Show only teams seeking female teammates` to instantly find teams needing female members for SIH eligibility.
3. **Team Card Presentation**:
   - Team name and problem statement.
   - **SIH Compliance Badge**: Displays `SIH 2025`, `Female rule met` (green) or `Female teammate needed` (amber).
   - Roster progress bar (`X of 6 spots filled`).
   - Leader name, roll number, and department.
   - Target skill tags and requirements.
   - Actions: `Team Details` or direct `Request to Join`.

---

### Flow 5: Submitting a Join Request
1. **Trigger**: An eligible student clicks **Request to Join** on an open team card.
2. **Modal Dialog**:
   - Displays team name and target hackathon.
   - Highlights the **Hackathon Exclusivity Rule**: warns the student that acceptance permanently commits them to this team for this hackathon.
   - Textarea: Prompts student for their introduction pitch, skills, and past experience.
3. **Server Verifications**:
   - Checks that the student is not already a member of this team.
   - Checks that the student is not already in another team for this hackathon.
   - Checks that the team roster is not already full (`members.length < requiredMembers`).
4. **Result**: `JoinRequest` record created with status `pending`.

---

### Flow 6: Team Leader Roster Management Hub ("My Teams")
1. **Navigation**: Team leader navigates to **My Teams**.
2. **Section 1: Teams I Lead**:
   - Displays team card with confirmed member count.
   - **Incoming Applications Box**:
     - Lists all pending applicant cards with: Full name, Roll number, Department, Year, Gender, Skill tags, and the student's introduction pitch.
     - **Accept Button**:
       - Adds the applicant's user ID to the team's `members` array.
       - Marks the request status as `accepted`.
       - If team capacity reaches `requiredMembers`, updates team status to `full`.
       - **Automated Request Cleanup**: Automatically invalidates/cancels any other pending requests the accepted student had submitted to other teams for this same hackathon!
     - **Decline Button**: Marks the request as `rejected`.
   - **Confirmed Members Roster**:
     - Lists all active members with their roll numbers, departments, and genders.
     - Leader can click the **Remove Member** icon to remove a student if necessary.
3. **Section 2: Teams I Am In**:
   - Lists teams the user has joined as a regular member.
4. **Section 3: My Sent Requests**:
   - Real-time status table showing all applications sent by the student with status badges (`pending`, `accepted`, `rejected`).

---

### Flow 7: Faculty / Coordinator Administration Desk
1. **Access**: Protected by `adminOnly` middleware; accessible by accounts with `role: 'admin'`.
2. **Institutional Metrics**:
   - `Total Students`: Total verified registered NBKRIST accounts.
   - `Total Teams`: Total formed teams across all competitions.
   - `SIH 2025 Teams`: Teams specifically targeting Smart India Hackathon.
   - `Recruiting Teams`: Teams with open spots.
   - `Full Teams`: Completely formed teams.
   - `Applications`: Total join requests submitted across the campus.
3. **Tab 1: All Registered Teams Table**:
   - Searchable by team name, problem statement, leader name, or roll number.
   - Filterable by hackathon event.
   - Columns: Team Name, Hackathon, Leader & Roll No, Members Count, SIH Compliance Status, Team Status.
   - **Inspect Button**: Opens a formal **Team Audit Record** modal displaying all confirmed member roll numbers, names, departments, years, and genders.
4. **Tab 2: Student Directory**:
   - Complete roster of all registered students.
   - Filterable by department (`CSE`, `ECE`, etc.) and searchable by name or roll number.
5. **Official Excel (.xlsx) Export**:
   - Coordinator clicks **Export to Excel (.xlsx)**.
   - Server dynamically generates a multi-sheet spreadsheet using the `xlsx` library:
     - **Sheet 1 (`Teams Summary`)**: Team Name, Hackathon, Leader Name & Roll No, Total Members, SIH Compliance Status, Problem Domain, Required Skills.
     - **Sheet 2 (`Member Breakdown`)**: Exhaustive row-by-row directory of every student in every team with their roll number, department, year, gender, and role (Leader / Member).
   - Browser automatically downloads: `NBKRIST_SIH_Teams_Roster_YYYY-MM-DD.xlsx`.

---

## 🗄️ 3. Database Models & Schema Design

### User Model (`server/models/User.js`)
```javascript
{
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true, uppercase: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: [/@nbkrist\.org$/, 'Must end with @nbkrist.org']
  },
  password: { type: String, required: true, minlength: 6 },
  department: { 
    type: String, 
    enum: ['CSE', 'ECE', 'EEE', 'AI&DS', 'IT', 'MECH', 'CIVIL', 'OTHER'],
    default: 'CSE'
  },
  year: { 
    type: String, 
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '3rd Year'
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    required: true 
  },
  skills: [{ type: String }],
  bio: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
}
```

### Team Model (`server/models/Team.js`)
```javascript
{
  teamName: { type: String, required: true, trim: true },
  hackathon: { type: String, required: true, default: 'Smart India Hackathon (SIH)' },
  problemDomain: { type: String, required: true },
  description: { type: String },
  requiredMembers: { type: Number, default: 6, min: 2, max: 10 },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  skillsNeeded: [{ type: String }],
  requirements: {
    femaleRequired: { type: Boolean, default: true },
    targetDepartment: { type: String, default: 'Any' },
    targetYear: { type: String, default: 'Any' },
    otherRequirements: { type: String }
  },
  status: { type: String, enum: ['open', 'full'], default: 'open' }
}
```

### JoinRequest Model (`server/models/JoinRequest.js`)
```javascript
{
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}
```

---

## 🌐 4. API Endpoints Reference

### Auth Endpoints (`/api/auth`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register student (validates `@nbkrist.org` domain) |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated student profile |
| `PUT` | `/api/auth/profile` | Private | Update student technical skills & bio |

### Team Endpoints (`/api/teams`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teams` | Public | List teams with search & query filters |
| `GET` | `/api/teams/:id` | Public | Detailed team view with confirmed roll numbers |
| `POST` | `/api/teams` | Private | Create team (enforces hackathon exclusivity) |
| `GET` | `/api/teams/my-teams` | Private | Get user's created and joined teams |
| `DELETE` | `/api/teams/:id` | Private (Leader/Admin) | Delete team |
| `DELETE` | `/api/teams/:id/members/:memberId` | Private (Leader/Admin) | Remove member from roster |

### Join Request Endpoints (`/api/requests`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/requests/:teamId` | Private | Submit join request with pitch message |
| `GET` | `/api/requests/team/:teamId` | Private (Leader) | View incoming applications for team |
| `PUT` | `/api/requests/:id` | Private (Leader) | Accept or decline student application |
| `GET` | `/api/requests/my/sent` | Private | View student's sent requests & statuses |

### Coordinator Endpoints (`/api/admin`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin Only | Get institutional metrics overview |
| `GET` | `/api/admin/teams` | Admin Only | Get all registered teams with rosters |
| `GET` | `/api/admin/students` | Admin Only | Get complete student directory |
| `GET` | `/api/admin/export-excel` | Admin Only | **Download official Excel report (.xlsx)** |

---

## ⚙️ 5. Production Operations & Deployment

### Environment Configuration (`server/.env`)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/nbkrist_teamfinder?retryWrites=true&w=majority
JWT_SECRET=your_strong_jwt_production_secret_key_here
ADMIN_EMAIL=admin@nbkrist.org
ADMIN_PASSWORD=SetAStrongPasswordHere!
```

### Database Management Commands
```bash
# In server/ directory:

# Purge dummy data and verify clean database for production:
npm run db:clean

# Run full automated test suite:
npm test

# Start production server:
npm start
```

### Starting the Production App
```bash
# From workspace root:

# Option A: Start both concurrently
npm run dev

# Option B: Run independently
# Terminal 1 (Backend API):
cd server && npm start

# Terminal 2 (Frontend Client):
cd client && npm run dev
```

---

## 🔒 6. Production Security Checklist

- [x] **Email Domain Hardening**: Email domain validation is active on both frontend form handlers and backend Mongoose schema validation.
- [x] **Password Protection**: Passwords hashed using bcrypt with salt rounds of 10.
- [x] **Clean Database**: 0 dummy students, 0 dummy teams, and 0 dummy requests in the live database.
- [x] **No Hardcoded Demo Credentials**: The login interface has no auto-fill buttons.
- [x] **Production Database Fail-Safe**: In `NODE_ENV=production`, the server will explicitly abort if the primary MongoDB connection fails, rather than starting an in-memory database that loses data on reboot.
- [x] **Role Protection**: Regular registration assigns the `student` role; coordinator routes are guarded with JWT role checks.
