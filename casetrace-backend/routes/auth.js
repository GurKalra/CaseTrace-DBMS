const express = require("express");
const router = express.Router();
const { registerCitizen, loginCitizen } = require("../controllers/authController");

// REGISTER CITIZEN
router.post("/register", registerCitizen);

// LOGIN CITIZEN
router.post("/login", loginCitizen);

module.exports = router;
