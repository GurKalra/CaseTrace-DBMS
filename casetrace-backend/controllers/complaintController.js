const crypto = require("crypto");
const db = require("../db/connection");

// FILE A COMPLAINT (Protected)
// Allowed priority values (matches DB constraint chk_priority)
const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const fileComplaint = async (req, res) => {
  const { incident_date, incident_location, description, category, priority } =
    req.body;
  const citizen_id = req.user.id;

  if (!incident_date || !incident_location || !description || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 3.1.1 Constraint: Complaint Priority must be HIGH, MEDIUM, or LOW
  const finalPriority = priority || "MEDIUM";
  if (!VALID_PRIORITIES.includes(finalPriority)) {
    return res.status(400).json({
      error: "Invalid priority value. Allowed values: HIGH, MEDIUM, LOW",
    });
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
      finalPriority,
    ]);

    res
      .status(201)
      .json({ message: "Complaint filed successfully!", complaint_id });
  } catch (err) {
    console.error(err);

    // 3.1.3 Constraint: Foreign key violation (invalid citizen_id)
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid citizen. Complaint must be linked to a registered citizen.",
      });
    }

    res.status(500).json({ error: "Failed to file complaint" });
  }
};

// SEE COMPLAINTS (Citizen View)
const getMyComplaints = async (req, res) => {
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
};

module.exports = { fileComplaint, getMyComplaints };
