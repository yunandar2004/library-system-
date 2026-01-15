const express = require("express");
const { updateSelf, deleteSelf } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.put("/me", protect, updateSelf);
router.delete("/me", protect, deleteSelf);

module.exports = router;
