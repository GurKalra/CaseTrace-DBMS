const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool.promise();

// TEST SERVER
app.get("/", (req, res) => {
  res.json({ message: "CaseTrace Backend is Running and Secure." });
});

// Configuring Multer to save files in the uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Saving as timestamp-filename.ext
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// REGISTER CITIZEN
app.post("/api/register", async (req, res) => {
  const { full_name, email, phone_number, password } = req.body;

  if (!full_name || !email || !password || !phone_number) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // SECURITY
    const checkQuery = "SELECT * FROM Citizen WHERE email = ?";
    const [existingUser] = await db.query(checkQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hashing Password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate UUID
    const citizen_id = crypto.randomUUID();

    // SECURITY: Parameterized Insert
    const insertQuery = `
            INSERT INTO Citizen (citizen_id, full_name, email, phone_number, password_hash) 
            VALUES (?, ?, ?, ?, ?)
        `;

    await db.query(insertQuery, [
      citizen_id,
      full_name,
      email,
      phone_number,
      password_hash,
    ]);

    res.status(201).json({ message: "Citizen registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// LOGIN CITIZEN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // SECURITY
    const [users] = await db.query("SELECT * FROM Citizen WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = users[0];

    // Verify Hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.citizen_id, role: "citizen" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      message: "Login successful",
      token: token,
      user: { name: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// MIDDLEWARE TO VERIFY JWT TOKENS
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Access denied. Token required." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
};

// FILE A COMPLAINT (Protected)
app.post("/api/complaints", authenticateToken, async (req, res) => {
  const { incident_date, incident_location, description, category, priority } =
    req.body;
  const citizen_id = req.user.id;

  if (!incident_date || !incident_location || !description || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const complaint_id = crypto.randomUUID();

  try {
    const query = `
            INSERT INTO Complaint (complaint_id, citizen_id, incident_date, incident_location, description, category, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

    await db.query(query, [
      complaint_id,
      citizen_id,
      incident_date,
      incident_location,
      description,
      category,
      priority || "MEDIUM",
    ]);

    res
      .status(201)
      .json({ message: "Complaint filed successfully!", complaint_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to file complaint" });
  }
});

// SEE COMPLAINTS (Citizen View)
app.get("/api/my-complaints", authenticateToken, async (req, res) => {
  const citizen_id = req.user.id;

  try {
    const query = `
            SELECT * FROM Complaint 
            WHERE citizen_id = ? 
            ORDER BY filed_at DESC
        `;

    const [complaints] = await db.query(query, [citizen_id]);

    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// UPLOADING EVIDENCE (With SHA-256 Hashing)
app.post(
  "/api/evidence",
  authenticateToken,
  upload.single("evidence_file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { complaint_id } = req.body;
    if (!complaint_id) {
      return res.status(400).json({ error: "Complaint ID is required" });
    }

    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const hashSum = crypto.createHash("sha256");
      hashSum.update(fileBuffer);
      const sha256_hash = hashSum.digest("hex");

      // Saving Metadata to Database
      const query = `
            INSERT INTO Evidence (complaint_id, uploaded_by_id, file_name, file_path, file_type, file_size_kb, sha256_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

      await db.query(query, [
        complaint_id,
        req.user.id,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        Math.round(req.file.size / 1024),
        sha256_hash,
      ]);

      res.status(201).json({
        message: "Evidence uploaded successfully",
        hash: sha256_hash,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload evidence" });
    }
  },
);

// MIDDLEWARE: REQUIRE OFFICER ROLE
const requireOfficer = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Access denied." });

  if (req.user.role !== "officer") {
    return res
      .status(403)
      .json({ error: "Access denied. Police personnel only." });
  }
  next();
};

// OFFICER LOGIN
app.post("/api/officer/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [officers] = await db.query("SELECT * FROM Officer WHERE email = ?", [
      email,
    ]);

    if (officers.length === 0) {
      return res.status(401).json({ error: "Invalid officer credentials" });
    }

    const officer = officers[0];

    const isMatch = await bcrypt.compare(password, officer.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid officer credentials" });
    }

    const token = jwt.sign(
      { id: officer.officer_id, role: "officer", dept_id: officer.dept_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      message: "Officer login successful",
      token,
      officer: { name: officer.full_name, badge: officer.badge_number },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// VIEW ALL COMPLAINTS (Officer Dashboard)
app.get(
  "/api/officer/complaints",
  authenticateToken,
  requireOfficer,
  async (req, res) => {
    try {
      const query = `
            SELECT c.*, z.full_name as citizen_name 
            FROM Complaint c
            JOIN Citizen z ON c.citizen_id = z.citizen_id
            ORDER BY c.filed_at DESC
        `;
      const [complaints] = await db.query(query);
      res.json(complaints);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  },
);

// UPDATE STATUS
app.patch(
  "/api/complaints/:id/status",
  authenticateToken,
  requireOfficer,
  async (req, res) => {
    const complaint_id = req.params.id;
    const { status } = req.body;

    // Validate Status
    const validStatuses = [
      "FILED",
      "VERIFIED",
      "INVESTIGATING",
      "ACTION_TAKEN",
      "CLOSED",
      "REJECTED",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    try {
      await db.query(
        "UPDATE Complaint SET current_status = ? WHERE complaint_id = ?",
        [status, complaint_id],
      );

      res.json({ message: `Status updated to ${status}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update status" });
    }
  },
);

// ADD INVESTIGATION NOTE
app.post(
  "/api/complaints/:id/notes",
  authenticateToken,
  requireOfficer,
  async (req, res) => {
    const complaint_id = req.params.id;
    const { note_text } = req.body;
    const officer_id = req.user.id;
    if (!note_text)
      return res.status(400).json({ error: "Note text is required" });

    try {
      await db.query(
        "INSERT INTO InvestigationNote (complaint_id, officer_id, note_text) VALUES (?, ?, ?)",
        [complaint_id, officer_id, note_text],
      );

      res.status(201).json({ message: "Note added to case file." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add note" });
    }
  },
);
