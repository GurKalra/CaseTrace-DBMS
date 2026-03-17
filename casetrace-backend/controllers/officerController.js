const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");

// OFFICER LOGIN
const officerLogin = async (req, res) => {
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
};

// VIEW ALL COMPLAINTS (Officer Dashboard)
const getAllComplaints = async (req, res) => {
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
};

// UPDATE STATUS
const updateComplaintStatus = async (req, res) => {
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
};

// ADD INVESTIGATION NOTE
const addInvestigationNote = async (req, res) => {
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
};

module.exports = {
  officerLogin,
  getAllComplaints,
  updateComplaintStatus,
  addInvestigationNote,
};
