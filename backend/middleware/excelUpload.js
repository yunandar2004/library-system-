// backend/middleware/excelUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage config for Excel files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/excel";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `excel-${Date.now()}${ext}`);
  },
});

// File filter for Excel files
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.includes("spreadsheet") && !file.originalname.endsWith(".xls") && !file.originalname.endsWith(".xlsx")) {
    return cb(new Error("Only Excel files are allowed"));
  }
  cb(null, true);
};

const excelUpload = multer({ storage, fileFilter });

module.exports = excelUpload;
