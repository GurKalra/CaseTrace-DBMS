# CaseTrace

**CaseTrace** is a comprehensive, secure, and modern National Crime & Case Tracking Network portal designed to connect Citizens with Law Enforcement Officers. The system handles the reporting, processing, and management of legal complaints with a strong emphasis on maintaining structured, immutable data records.

## 📖 What the Project Is
CaseTrace acts as a dual-portal Government tracking application. It fundamentally divides traffic between **Citizens** (who use the portal to file specific complaints securely and upload immutable evidence) and **Officers** (who interact with the portal to organize workload, filter urgencies safely, edit case statuses, and append official departmental investigation notes).

## 🤔 Why the Project Exists
This project aims to solve structural inefficiencies in how local legal systems log and manage complaints.
1. **Security & Immutability:** By design, once a Citizen files a complaint, neither the Citizen nor the Officer can destructively modify or delete the original record, adhering strictly to real-world government immutability protocols.
2. **Transparency:** Citizens can access their own dedicated dashboards to track the real-time status of their case (e.g., *Investigating*, *Closed*).
3. **Structured Flow:** It eliminates redundant data entry by keeping complaints locked, standardizing priority classifications, and ensuring cross-platform uniqueness (no conflicting emails or names).

---

## 🛠️ Tech Stack & Architecture
This platform runs on a standard **Node.js, Express, MySQL** stack alongside a Vanilla static frontend.

**Backend Area**
- **Node.js + Express.js:** Serves the REST API endpoints cleanly to manage the specific routing requests.
- **MySQL2:** A deeply integrated connection pool maps directly to local backend processes using robust constraints and explicit parameterizations to prevent SQL injections.
- **Bcrypt & JWT:** Cryptographically signs passwords and utilizes JSON Web Tokens to authorize specific views for Citizens vs Officers.
- **Multer:** (To be fully scoped) Processes secure file system uploads for case evidence linking.

**Frontend Area**
- **Vanilla HTML/CSS/JS:** Built explicitly without heavy JavaScript frameworks, ensuring a lightweight and incredibly fast load time using a pristine Custom CSS Theme to simulate a Government UI.

---

## 🏗️ File Structure

```text
/casetrace
├── casetrace-backend/
│   ├── controllers/
│   │   ├── authController.js         # JWT, Reg/Login for Citizen 
│   │   ├── complaintController.js    # Creating & fetching citizen complaints
│   │   └── officerController.js      # Officer specific endpoints & dashboard data
│   ├── db/
│   │   ├── connection.js             # MySQL Pool setup & ENV Loader
│   │   ├── schema.sql                # Full immutable database logical declarations
│   │   └── seed.sql                  # Initial database test/mock population records
│   ├── middleware/
│   │   └── authMiddleware.js         # Verifies Bearer tokens & explicit Admin roles
│   ├── routes/
│   │   ├── auth.js                   # Public routes handling initial auth entries
│   │   ├── complaints.js             # Protected citizen UI interactions
│   │   ├── evidence.js               # File uploading paths
│   │   └── officer.js                # Protected officer routes
│   └── server.js                     # ⚙️ Application entry & port config
│
└── casetrace-frontend/
    ├── index.html                    # Root split-screen multi-auth login hub
    ├── citizen-dashboard.html        # Citizen secured viewport
    ├── officer-dashboard.html        # Department structured viewport
    ├── style.css                     # Primary site-wide structural styling config
    ├── dashboard.css                 # Advanced CSS scoped to app dashboard layers
    ├── app.js                        # Controls fetching & local JWT logic for Login
    ├── dashboard.js                  # Feeds the Citizen HTML dynamically
    └── officer-dashboard.js          # Feeds the Officer HTML dynamically
```

---

## 🔐 Database Connection Details
The project utilizes a dynamic pool connection methodology.
The `db/connection.js` spins up a localized pool connected to the raw MySQL Workbench/Local instance by wrapping the `mysql2/promise` node plugin. All configurations naturally map through the `.env` root node targeting:
- `DB_HOST=localhost`
- `DB_USER=root` (or configured database user)
- `DB_PASSWORD=...`
- `DB_NAME=CaseTraceDB`

All endpoints specifically parse inputs securely before pushing parameters into the connection pool to prevent data-loss or injection attacks safely ensuring the strict "Append-Only" architecture for filed cases.
