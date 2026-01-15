const express = require("express");
const multer = require("multer");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  exportData,
  importData,
} = require("../controllers/exportImportController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/:type/export", protect, adminOnly, exportData);
router.post(
  "/:type/import",
  protect,
  adminOnly,
  upload.single("file"),
  importData
);

module.exports = router;
