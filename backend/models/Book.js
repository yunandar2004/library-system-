const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  availableCopies: { type: Number, required: true },
  totalCopies: { type: Number, required: true },
  publisherYear: { type: Number },
  rating: { type: Number, default: 4, min: 1, max: 5 },
  borrowPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  category: { type: String },
  description: { type: String },
  image: { type: String, default: "default-book.png" },
  status: {
    type: String,
    enum: ["available", "out of stock"],
    default: "available",
  },
});

module.exports = mongoose.model("Book", bookSchema);
