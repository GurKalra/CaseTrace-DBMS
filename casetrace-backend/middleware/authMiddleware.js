const jwt = require("jsonwebtoken");

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

module.exports = { authenticateToken, requireOfficer };
