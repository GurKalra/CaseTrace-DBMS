const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db/connection");

// REGISTER CITIZEN
const registerCitizen = async (req, res) => {
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

    // 3.1.2 Constraint: Unique email (DB-level enforcement)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email already registered." });
    }

    res.status(500).json({ error: "Server error during registration." });
  }
};

// LOGIN CITIZEN
const loginCitizen = async (req, res) => {
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
};

module.exports = { registerCitizen, loginCitizen };
