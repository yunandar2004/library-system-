const express = require("express");
const {
  listUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  banUser,
  restoreUser,
  listAdmins,
  getAdminDetail,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  banAdmin,
  restoreAdmin,
  uploadAdminImage,
  uploadUserImage,
  exportAdmins,
  exportUsers,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/* USER MANAGEMENT */
// Export users as Excel
router.get("/users/export", protect, adminOnly, exportUsers);

router.get("/users", protect, adminOnly, listUsers);
router.post("/users", protect, adminOnly, uploadUserImage, createUser);
router.get("/users/:id", protect, adminOnly, getUserDetail);
// router.post("/users", protect, adminOnly, createUser);
router.put("/users/:id", protect, adminOnly, updateUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);
router.put("/users/:id/ban", protect, adminOnly, banUser);
router.put("/users/:id/restore", protect, adminOnly, restoreUser);

/* ADMIN MANAGEMENT */
// Export admins
router.get("/admins/export", protect, adminOnly, exportAdmins);

router.get("/admins", protect, adminOnly, listAdmins);
router.get("/admins/:id", protect, adminOnly, getAdminDetail);
// Create admin with optional image upload
router.post("/admins", protect, adminOnly, uploadAdminImage, createAdmin);
router.put("/admins/:id", protect, adminOnly, updateAdmin);
router.delete("/admins/:id", protect, adminOnly, deleteAdmin);
router.put("/admins/:id/ban", protect, adminOnly, banAdmin);
router.put("/admins/:id/restore", protect, adminOnly, restoreAdmin);

module.exports = router;
