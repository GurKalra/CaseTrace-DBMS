const express = require("express");
const router = express.Router();
const { authenticateToken, requireOfficer } = require("../middleware/authMiddleware");
const {
  officerLogin,
  getAllComplaints,
  updateComplaintStatus,
  addInvestigationNote,
} = require("../controllers/officerController");

// OFFICER LOGIN
router.post("/login", officerLogin);

// VIEW ALL COMPLAINTS (Officer Dashboard)
router.get("/complaints", authenticateToken, requireOfficer, getAllComplaints);

// UPDATE STATUS
router.patch("/complaints/:id/status", authenticateToken, requireOfficer, updateComplaintStatus);

// ADD INVESTIGATION NOTE
router.post("/complaints/:id/notes", authenticateToken, requireOfficer, addInvestigationNote);

module.exports = router;
