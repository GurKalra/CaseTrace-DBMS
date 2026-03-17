const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// TEST SERVER
app.get("/", (req, res) => {
  res.json({ message: "CaseTrace Backend is Running and Secure." });
});

// Routes
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const evidenceRoutes = require("./routes/evidence");
const officerRoutes = require("./routes/officer");

app.use("/api", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/officer", officerRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
