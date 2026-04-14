const express = require("express");
const router = express.Router();
const { authenticateToken, requireOfficer } = require("../middleware/authMiddleware");
const {
  registerOfficer,
  officerLogin,
  getAllComplaints,
  updateComplaintStatus,
  addInvestigationNote,
  getAllDepartments,
} = require("../controllers/officerController");

// GET DEPARTMENTS
router.get("/departments", getAllDepartments);

// OFFICER REGISTRATION
router.post("/register", registerOfficer);

// OFFICER LOGIN
router.post("/login", officerLogin);

// VIEW ALL COMPLAINTS (Officer Dashboard)
router.get("/complaints", authenticateToken, requireOfficer, getAllComplaints);

// UPDATE STATUS
router.patch("/complaints/:id/status", authenticateToken, requireOfficer, updateComplaintStatus);

// ADD INVESTIGATION NOTE
router.post("/complaints/:id/notes", authenticateToken, requireOfficer, addInvestigationNote);

module.exports = router;
