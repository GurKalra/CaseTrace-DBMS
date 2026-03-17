const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { authenticateToken } = require("../middleware/authMiddleware");
const db = require("../db/connection");

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

// UPLOADING EVIDENCE (With SHA-256 Hashing)
router.post(
  "/",
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

module.exports = router;
