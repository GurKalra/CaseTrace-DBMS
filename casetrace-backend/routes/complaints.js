const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { fileComplaint, getMyComplaints } = require("../controllers/complaintController");

// FILE A COMPLAINT (Protected)
router.post("/", authenticateToken, fileComplaint);

// SEE COMPLAINTS (Citizen View)
router.get("/my-complaints", authenticateToken, getMyComplaints);

module.exports = router;
