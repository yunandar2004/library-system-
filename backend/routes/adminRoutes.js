const express = require("express");
const {
  listUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  banUser,
  listAdmins,
  getAdminDetail,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  banAdmin,
  restoreAdmin,
  restoreUser,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/* USER MANAGEMENT */
router.get("/users", protect, adminOnly, listUsers);
router.get("/users/:id", protect, adminOnly, getUserDetail);
router.post("/users", protect, adminOnly, createUser);
router.put("/users/:id", protect, adminOnly, updateUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);
router.put("/users/:id/ban", protect, adminOnly, banUser);
router.put("/:id/restore",protect, adminOnly, restoreUser);

/* ADMIN MANAGEMENT */
router.get("/admins", protect, adminOnly, listAdmins);
router.get("/admins/:id", protect, adminOnly, getAdminDetail);
router.post("/admins", protect, adminOnly, createAdmin);
router.put("/admins/:id", protect, adminOnly, updateAdmin);
router.delete("/admins/:id", protect, adminOnly, deleteAdmin);
router.put("/admins/:id/ban", protect, adminOnly, banAdmin);
router.put("/admins/:id/restore", protect, adminOnly, restoreAdmin);
router.put("/admins/:id/restore", protect, adminOnly, restoreAdmin);

module.exports = router;
