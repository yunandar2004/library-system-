const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createBook,
  updateBook,
  deleteBook,
  getBookDetail,
  listBooks,
  borrowBook,
  returnBook,
  orderBook,
  exportBooks
} = require("../controllers/bookController");
const { borrowerReport } = require("../controllers/reportController");
const { upload } = require("../middleware/uploadMiddlewares"); // ✅ import multer middleware

const router = express.Router();

/* BOOK MANAGEMENT (Admin) */
// router.post("/", protect, adminOnly, createBook);
router.post("/", protect, adminOnly, upload.single("image"), createBook);
router.get("/export", protect, adminOnly, exportBooks); 
router.put("/:id", protect, adminOnly, updateBook);
router.delete("/:id", protect, adminOnly, deleteBook);
router.get("/:id", protect, adminOnly, getBookDetail);
router.get("/", protect, adminOnly, listBooks);

/* BORROWING (User) */
router.post("/:id/borrow", protect, borrowBook);
router.post("/:id/order", protect, orderBook);
router.put("/return/:recordId", protect, returnBook);

/* REPORTS (Admin) */
router.get("/reports", protect, adminOnly, borrowerReport);

module.exports = router;
