const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  type: {
    type: String,
    enum: ["borrowed", "returned", "ordering", "overdue"],
    required: true,
  },
  borrowedDate: { type: Date },
  dueDate: { type: Date },
  returnedDate: { type: Date },
  fine: { type: Number, default: 0 },
});

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);
